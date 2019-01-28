### Find Stale Git Branches

Use this scipt to identify stale git branches that should be deleted. It does this by iterating over every branch
in the repository and getting the last commit author, and the date of the last commit.

### Install

1. Install git-clean from NPM.

```bash
npm i -g git-clean
```

### Configure

Once installed, you must configure some parameters for git-clean.

It is recommended to create a `.gitcleanrc` file in the root of your git repository.

git-clean uses the [rc](https://github.com/dominictarr/rc) library for finding and loading configs. It is possible to define these settings in other places as well, for a list of all supported option please see the rc project.

The following example also shows the default values git-clean uses.

```ini
# Required
BITBUCKET_URL =

# Optional
JIRA_PROJECTS =
MAIN_BRANCH = master
PROTECTED_BRANCHES = HEAD, origin/master
```

#### Options

- **BITBUCKET_URL** is the URL to the BitBucket server.
- **JIRA_PROJECTS** comma separated list of Jira project codes that you want to display links for.
- **MAIN_BRANCH** is the name of your main branch. Generally this is the _master_ branch.
- **PROTECTED_BRANCHES** comma separated list of branches that are protected and should not be deleted. Branches matching any of these values will not be displayed by git-clean.

### Recommended Setup for large projects

For large projects with multiple developers and a large number of branches it is recommended to commit a `.gitcleanrc` file in the root of your project.

install **git-clean** as a devDependency
