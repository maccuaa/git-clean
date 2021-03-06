import ora from "ora";
import chalk from "chalk";
import shell from "shelljs";
import inquirer from "inquirer";
import urlJoin from "url-join";
import execAsync, { exec } from "./execAsync";
import { LOCAL } from "./index";

export default class Helper {
  conf = null;
  jiraProjects = [];

  constructor(conf) {
    this.conf = conf;

    this.jiraProjects = this.getJiraProjects(conf);
  }

  getBranches = async (type, mergeState) => {
    let branches = [];

    const spinner = ora("Finding branches...").start();

    try {
      switch (type) {
        case "local":
          branches = await this.fetchLocalBranches(mergeState);
          break;
        case "remote":
          branches = await this.fetchRemoteBranches(mergeState);
          break;
      }
    } catch (e) {
      spinner.fail().stop();
      console.error(e);
      shell.exit(1);
    }

    const total = branches.length;

    spinner.succeed().stop();

    console.log("Found", chalk.magenta(total), "branches...");

    if (total === 0) {
      shell.exit(0);
    }

    spinner.start("Getting branch information...");

    try {
      branches = await Promise.all(branches.map(this.getBranchInfo));

      branches = branches.sort((a, b) => a.date - b.date);
    } catch (e) {
      console.error(e);
      spinner.fail().stop();
      shell.exit(1);
    }

    spinner.succeed().stop();

    return branches;
  };

  groupByAuthor = (branches) => {
    const groups = {};
    branches.forEach((branch) => {
      if (!(branch.author in groups)) {
        groups[branch.author] = [];
      }
      groups[branch.author].push(branch);
    });
    return groups;
  };

  branchesByAuthor = (branches, author) => {
    const group = {};
    branches.forEach((branch) => {
      if (branch.author.toLowerCase().includes(author.toLowerCase())) {
        if (!(branch.author in group)) {
          group[branch.author] = [];
        }
        group[branch.author].push(branch);
      }
    });
    return group;
  };

  prettyPrintByAuthor = (branchesByAuthor) => {
    // Sort by author first
    const authors = Object.keys(branchesByAuthor).sort();

    authors.forEach((author) => {
      const branches = branchesByAuthor[author];
      console.log(chalk.underline.green(author), "-", chalk.bold.red(branches.length));
      console.log();
      branches.forEach((branch) =>
        console.log(chalk.blue(branch.prettyDate.padEnd(25)), branch.prettyName.padEnd(75), chalk.cyan(branch.url))
      );
      console.log();
    });
  };

  deleteBranches = async (branches, type) => {
    const authors = Object.keys(branches).sort();

    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        message: "Select branches to delete (use the Spacebar to select branches and Enter to confirm)",
        name: "branches",
        pageSize: 30,
        choices: authors.reduce((choices, author) => {
          return choices.concat(
            new inquirer.Separator(author),
            branches[author].map((branch) => {
              return { name: branch.prettyName, value: branch, checked: false };
            })
          );
        }, []),
      },
      {
        type: "confirm",
        name: "confirmDelete",
        message: "Are you sure you want to delete these branches?",
        default: false,
      },
    ]);

    if (answers.confirmDelete) {
      console.log(chalk.red("Deleting", answers.branches.length, "branches..."));

      // Start by pruning branches
      this.prune();

      if (answers.branches.length > 0) {
        const branchStr = answers.branches.map((branch) => branch.prettyName).join(" ");

        try {
          if (type === LOCAL) {
            exec(`git branch -D ${branchStr}`);
          } else {
            exec(`git push origin --delete ${branchStr}`);
          }
        } catch (e) {
          console.error(e);
          shell.exit(1);
        }
      }
      console.log(chalk.green("done."));
    } else {
      console.log("Exiting without deleting any branches.");
    }
  };

  // ============================================================================================
  // PRIVATE FUNCTIONS
  // ============================================================================================
  fetchLocalBranches = async (mergeState) => {
    const command = `git branch --${mergeState} ${this.conf.MAIN_BRANCH}`;

    return this.execFetchBranches(command);
  };

  fetchRemoteBranches = (mergeState) => {
    let command = `git branch -r --${mergeState} ${this.conf.MAIN_BRANCH} | grep -v `;

    const protectedBranches = this.conf.PROTECTED_BRANCHES.split(",").map((b) => b.trim());

    command = command.concat(protectedBranches.map((b) => `-e ${b}`).join(" "));

    return this.execFetchBranches(command);
  };

  execFetchBranches = async (command) => {
    const output = await execAsync(command, { silent: true });

    const branches = this.sanitizeBranchOutput(output);

    return branches;
  };

  sanitizeBranchOutput = (input) => {
    return (
      input
        .split("\n")
        // Remove the asterisk from the git branch output
        .map((branch) => branch.replace(/^\*/, ""))

        // Remove all whitespace
        .map((branch) => branch.trim())

        // Remove any empty lines
        .filter((branch) => branch !== "")

        // Filter out the main branch
        .filter((branch) => !branch.includes(this.conf.MAIN_BRANCH))
    );
  };

  getJiraUrl = (branch) => {
    if (!this.jiraProjects) return "";

    const regex = new RegExp(`(${this.jiraProjects.join("|")})-[\\d]+`, "i");

    const result = regex.exec(branch);

    if (result === null) {
      return "";
    }

    return urlJoin(this.conf.REMOTE_URL, "browse", result[0]);
  };

  /**
   * Get detailed information for this branch.
   *
   *    %cn: committer name
   *    %cr: committer date, relative
   *    %cI: committer date (ISO 8601)
   */
  getBranchInfo = async (branch) => {
    let info = await execAsync(`git log -n 1 --pretty=format:"%cn | %cr | %cI" ${branch}`, {
      silent: true,
    });

    info = info.split("|").map((info) => info.trim());

    return {
      author: info[0],
      prettyDate: info[1],
      date: new Date(info[2]),
      name: branch,
      prettyName: branch.replace("origin/", ""),
      url: this.getJiraUrl(branch),
    };
  };

  prettyPrint = (branch) => {
    console.log(
      chalk.blue(branch.prettyDate.padEnd(25)),
      chalk.green(branch.author.padEnd(25)),
      branch.prettyName.padEnd(75),
      chalk.cyan(branch.url)
    );
  };

  getJiraProjects = (conf) => {
    const confStr = conf.JIRA_PROJECTS;

    if (!confStr) return;

    return conf.JIRA_PROJECTS.split(",").map((b) => b.trim());
  };

  prune = () => {
    exec("git remote prune origin");
  };
}
