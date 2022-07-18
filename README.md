# @maccuaa/git-clean

Keeping the number of branches in your git repository sane.

### About

Use this scipt to identify stale git branches that should be deleted. It does this by iterating over every branch
in the repository and getting the last commit author, and the date of the last commit.

# Install

1. Install git-clean from NPM.

```bash
# globally
npm i -g @maccuaa/git-clean

# in your project
npm i -D @maccuaa/git-clean
```

# Configure

Once installed, you must configure some parameters for git-clean.

It is recommended to create a `.gitcleanrc` file in the root of your project.

git-clean uses the [rc](https://github.com/dominictarr/rc) library for finding and loading configs. It is possible to define these settings in other places as well, for a list of all supported option please see the rc project.

This example also shows the default values git-clean uses.

```ini
# .gitcleanrc

#
# Required
#

# the URL to the remote Git server
REMOTE_URL =

#
# Optional
#

# comma separated list of Jira project codes that you want to display links for
JIRA_PROJECTS =

# the name of your main branch. Generally this is the _master_ branch
MAIN_BRANCH = master

# comma separated list of branches that are protected and should not be deleted.
# branches matching any of PROTECTED_BRANCHES values these values will not be displayed by git-clean.
PROTECTED_BRANCHES = HEAD, origin/master

# If you have email address updates for your git users, you can use this to map them to the correct email address.
EMAIL_ALIAS = old.com:new.com|old1.com:new1.com|old2.com:new2.com

# SMTP Settings
# see nodeemailer for more support servers
# https://github.com/nodemailer/nodemailer/blob/master/lib/well-known/services.json
SMTP_SERVER = Hotmail
SMTP_USER = <username>
SMTP_PASSWORD = <password>

# Teams Channel Webhook Connector Endpoint
# See https://docs.microsoft.com/en-us/microsoftteams/office-365-custom-connectors
TEAMS_WEBHOOK_URL = https://XXXXX.webhook.office.com/webhookb2/XXXXX
```

# Recommended Setup for large projects

For large projects with multiple developers and a large number of branches it is recommended to commit a `.gitcleanrc` file in the root of your project.

install **git-clean** as a devDependency

# Contribute
