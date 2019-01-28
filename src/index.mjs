import inquirer from "inquirer";
import shell from "shelljs";
import rc from "rc";
import chalk from "chalk";
import Helper from "./branch";

/* ============================================================================================
 * Constants
 * ============================================================================================ */
const LOCAL = "local";
const REMOTE = "remote";
const LIST_ALL = "list_all";
const LIST_BY_AUTHOR = "list_by_author";
const FIND_BY_AUTHOR = "find_by_author";
const VIEW_ONLY = "view_only";
const VIEW_AND_DELETE = "view_and_delete";

/* ============================================================================================
 * Main Function
 * ============================================================================================ */

const main = async () => {
  // Load Application Configuration
  const conf = rc("gitclean", {
    MAIN_BRANCH: "master",
    PROTECTED_BRANCHES: "HEAD, origin/master"
  });

  if (!conf.BITBUCKET_URL) {
    console.log(chalk.red("BITBUCKET_URL not set. Please see the README for instructions."));
    shell.exit(1);
  }

  // Make sure Git is installed
  if (!shell.which("git")) {
    console.log(chalk.red("Sorry, this script requires git to be installed"));
    shell.exit(1);
  }

  const h = new Helper(conf);

  // TODO: Add option to list all unmerged branches.
  // Git Command: git log -n 1 --pretty=format:"%cn | %cr | %cI" --abbrev-commit ${this.conf.MAIN_BRANCH}...${branch}

  let answer = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "Do you want to view local or remote branches?",
      default: LOCAL,
      choices: [LOCAL, REMOTE]
    },
    {
      when: answers => answers.type === REMOTE,
      type: "list",
      name: "action",
      message: "What do you want to do?",
      default: LIST_ALL,
      choices: [
        {
          name: "List all (oldest to newest)",
          value: LIST_ALL
        },
        {
          name: "List all (grouped by author)",
          value: LIST_BY_AUTHOR
        },
        {
          name: "Find by author",
          value: FIND_BY_AUTHOR
        }
      ]
    },
    {
      when: answers => answers.action === FIND_BY_AUTHOR,
      type: "input",
      name: "author",
      message: "Enter author name (case-insensitive)",
      validate: value => !!value
    },
    {
      type: "list",
      name: "outcome",
      message: "Do you want to view or view and delete branches?",
      default: LOCAL,
      choices: [
        {
          name: "View only",
          value: VIEW_ONLY
        },
        {
          name: "View and delete",
          value: VIEW_AND_DELETE
        }
      ]
    }
  ]);

  let branches = await h.getBranches(answer.type);

  if (answer.type === LOCAL) {
    branches.forEach(h.prettyPrint);
    shell.exit(0);
  } else {
    switch (answer.action) {
      case LIST_ALL:
        branches.forEach(h.prettyPrint);
        break;
      case LIST_BY_AUTHOR:
        branches = h.groupByAuthor(branches);
        h.prettyPrintByAuthor(branches);
        break;
      case FIND_BY_AUTHOR:
        branches = h.branchesByAuthor(branches, answer.author);
        h.prettyPrintByAuthor(branches);
        break;
    }
  }

  if (answer.outcome === VIEW_AND_DELETE) {
    await h.deleteBranches(branches, answer.type);
  }

  shell.exit(0);
};

// Run main
main();
