# prismarine-repo-commands

Github Action for automating repo actions via issue/PR comment commands. To run the commands on a PR, the user must be the PR author or a repo COLLABORATOR, MEMBER, or OWNER.

### Install
```yaml
name: Comment Commands

on:
  issue_comment:
    types: [created]
  # Handle renamed PRs
  pull_request:
    types:
      - edited

jobs:
  comment-trigger:
    runs-on: ubuntu-latest
    
    steps:
      - name: Check out repository
        uses: actions/checkout@v2

      - name: Run command automater
        uses: extremeheat/prismarine-repo-commands
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### Usage
* /makerelease [release version] -- make a release PR
<!-- * /fixlint -- run `standard --fix` on the current PR, then push the update to the PR -->

