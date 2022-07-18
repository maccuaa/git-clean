import Branch from "./branch.mjs";
import * as c from "yoctocolors";
import inquirer from "inquirer";
import rc from "rc";
import shell from "shelljs";

/* ============================================================================================
 * Constants
 * ============================================================================================ */
export const LOCAL = "local";
export const REMOTE = "remote";
const MERGED = "merged";
const UNMERGED = "no-merged";
const LIST_ALL = "list_all";
const LIST_BY_AUTHOR = "list_by_author";
const FIND_BY_AUTHOR = "find_by_author";
const VIEW_ONLY = "view_only";
const VIEW_AND_DELETE = "view_and_delete";
const EMAIL_LAST_COMMITTER = "email_last_committer";
const NOTIFY_THROUGH_TEAMS = "notify_through_teams";

/* ============================================================================================
 * Main Function
 * ============================================================================================ */

const main = async () => {
  // Load Application Configuration - These are the defaults values.
  const conf = rc("gitclean", {
    MAIN_BRANCH: "master",
    PROTECTED_BRANCHES: "HEAD, origin/master",
  });

  if (!conf.REMOTE_URL) {
    console.log(c.red("REMOTE_URL not set. Please see the README for instructions."));
    shell.exit(1);
  }

  // Make sure Git is installed
  if (!shell.which("git")) {
    console.log(c.red("Sorry, this script requires git to be installed"));
    shell.exit(1);
  }

  const b = new Branch(conf);

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "Do you want to view local or remote branches?",
      default: LOCAL,
      choices: [LOCAL, REMOTE],
    },
    {
      type: "list",
      name: "mergeState",
      message: "Do you want to view merged or unmerged branches?",
      default: MERGED,
      choices: [MERGED, UNMERGED],
    },
    {
      when: (answers) => answers.type === REMOTE,
      type: "list",
      name: "action",
      message: "What do you want to do?",
      default: LIST_ALL,
      choices: [
        {
          name: "List all (oldest to newest)",
          value: LIST_ALL,
        },
        {
          name: "List all (grouped by author)",
          value: LIST_BY_AUTHOR,
        },
        {
          name: "Find by author",
          value: FIND_BY_AUTHOR,
        },
        {
          name: "Email last committer",
          value: EMAIL_LAST_COMMITTER,
        },
        {
          name: "Notify through teams",
          value: NOTIFY_THROUGH_TEAMS,
        },
      ],
    },
    {
      when: (answers) => answers.action === FIND_BY_AUTHOR,
      type: "input",
      name: "author",
      message: "Enter author name (case-insensitive)",
      validate: (value) => !!value,
    },
    {
      when: (answers) => answers.action !== EMAIL_LAST_COMMITTER && answers.action !== NOTIFY_THROUGH_TEAMS,
      type: "list",
      name: "outcome",
      message: "Do you want to view or view and delete branches?",
      default: LOCAL,
      choices: [
        {
          name: "View only",
          value: VIEW_ONLY,
        },
        {
          name: "View and delete",
          value: VIEW_AND_DELETE,
        },
      ],
    },
  ]);

  let branches = await b.getBranches(answer.type, answer.mergeState);

  if (answer.type === REMOTE) {
    switch (answer.action) {
      case LIST_ALL:
        branches.forEach(b.prettyPrint);
        branches = b.groupByNone(branches);
        break;
      case LIST_BY_AUTHOR:
        branches = b.groupByAuthor(branches);
        b.prettyPrintByAuthor(branches);
        break;
      case FIND_BY_AUTHOR:
        branches = b.branchesByAuthor(branches, answer.author);
        b.prettyPrintByAuthor(branches);
        break;
      case EMAIL_LAST_COMMITTER:
        branches = b.groupByAuthor(branches);
        b.emailLastCommitter(branches, answer.mergeState);
        break;
      case NOTIFY_THROUGH_TEAMS:
        branches = b.groupByAuthor(branches);
        b.notifyThroughTeams(branches, answer.mergeState);
        break;
    }
  } else {
    branches = b.groupByAuthor(branches);
    b.prettyPrintByAuthor(branches);
  }

  switch (answer.outcome) {
    case VIEW_ONLY:
      break;
    case VIEW_AND_DELETE:
      await b.deleteBranches(branches, answer.type);
      break;
  }
};

// Run main
main();
