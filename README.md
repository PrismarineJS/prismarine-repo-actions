# prismarine-repo-commands

Github Action for automating repo actions via issue/PR comment commands. To run the commands on a PR, the user must be the PR author or a repo COLLABORATOR, MEMBER, or OWNER.

### Install
```yaml
name: Repo Commands

on:
  issue_comment:        # Handle comment commands
    types: [created]
  pull_request:         # Handle renamed PRs
    types: [edited]

jobs:
  comment-trigger:
    runs-on: ubuntu-latest
    steps:
    - name: Check out repository
      uses: actions/checkout@v3
    - name: Run command handlers
      uses: extremeheat/prismarine-repo-actions@master
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
```

### Commands
* /makerelease [release version]
  * Make a release PR (Node.js and Python projects). This command creates a new PR with a modified HISTORY.md to add a section with the latest commits since the last release PR (commit starting with "Release ") and if they exist, updates the package.json (Node.js) or setup.py/pyproject.toml (Python) manifest files. *This doesn't actually create a release, it just creates a PR that when merged, will trigger your actual release workflow.*
<!-- * /fixlint -- run `npm run fix` on the current PR, then push the update to the PR -->

