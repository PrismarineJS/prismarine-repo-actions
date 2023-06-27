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
      uses: actions/checkout@v2
      with:
        # Max amount of commits to include
        fetch-depth: 16
    - name: Run command handlers
      uses: extremeheat/prismarine-repo-actions@master
      with:
        token: ${{ secrets.GITHUB_TOKEN }}

```

### Usage
* /makerelease [release version] -- make a release PR
<!-- * /fixlint -- run `standard --fix` on the current PR, then push the update to the PR -->

