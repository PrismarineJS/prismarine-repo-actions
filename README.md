# prismarine-repo-commands
[![NPM version](https://img.shields.io/npm/v/prismarine-repo-actions.svg?color=success&label=npm%20package&logo=npm)](https://www.npmjs.com/package/prismarine-repo-actions)
[![Build Status](https://img.shields.io/github/actions/workflow/status/extremeheat/prismarine-repo-actions/ci.yml.svg?label=CI&logo=github&logoColor=lightgrey)](https://github.com/PrismarineJS/mineflayer/actions?query=workflow%3A%22CI%22)
[![Try it on gitpod](https://img.shields.io/static/v1.svg?label=try&message=on%20gitpod&color=brightgreen&logo=gitpod)](https://gitpod.io/#https://github.com/extremeheat/prismarine-repo-actions)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/PrismarineJS)](https://github.com/sponsors/PrismarineJS)\
[![Official Discord](https://img.shields.io/static/v1.svg?label=PrismarineJS&message=Discord&color=blue&logo=discord)](https://discord.gg/GsEFRM8)

Github Action for automating repo actions via issue/PR comment commands. To run the commands on a PR, the user must be the PR author or a repo COLLABORATOR, MEMBER, or OWNER.

## Install
Add a workflow looking like this in `.github/workflows/comments.yml`:

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
        # this sets the command to use for installing the repo, if needed for the command
        install-command: npm install
        # To disable the makerelease command, uncomment the following line
        # /makerelease.enabled: false
        # To disable the fixlint command, uncomment the following line
        # /fixlint.enabled: false
        # this sets the command to use for the /fixlint command
        /fixlint.fix-command: npm run fix
```

Commands can be enabled/disabled by setting the `/$command.enabled` property to `true` or `false`.

## Commands
* /makerelease [release version]
  * Make a release PR (Node.js and Python projects).
  * This command creates a new PR with a modified HISTORY.md adding a section with the latest commits since the last release PR (commit starting with "Release ") and if they exist, updates the package.json (Node.js) or setup.py/pyproject.toml (Python) manifest files.
  * *This doesn't actually create a release, it just creates a PR that when merged, will trigger your actual release workflow.*
  * [Example trigger](https://github.com/extremeheat/prismarine-repo-actions/pull/1) and [resulting release PR](https://github.com/extremeheat/prismarine-repo-actions/pull/5)
* /fixlint -- run a lint fix command on the current PR, then push the update to the PR

