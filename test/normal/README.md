# prismarine-repo-commands
[![NPM version](https://img.shields.io/npm/v/prismarine-repo-actions.svg?color=success&label=npm%20package&logo=npm)](https://www.npmjs.com/package/prismarine-repo-actions)
[![Build Status](https://img.shields.io/github/actions/workflow/status/PrismarineJS/prismarine-repo-actions/ci.yml.svg?label=CI&logo=github&logoColor=lightgrey)](https://github.com/PrismarineJS/mineflayer/actions?query=workflow%3A%22CI%22)
[![Try it on gitpod](https://img.shields.io/static/v1.svg?label=try&message=on%20gitpod&color=brightgreen&logo=gitpod)](https://gitpod.io/#https://github.com/PrismarineJS/prismarine-repo-actions)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/PrismarineJS)](https://github.com/sponsors/PrismarineJS)\
[![Official Discord](https://img.shields.io/static/v1.svg?label=PrismarineJS&message=Discord&color=blue&logo=discord)](https://discord.gg/GsEFRM8)

Github Action for automating repo actions via issue/PR comment commands. To run the commands on a PR, the user must be the PR author or a repo *COLLABORATOR*, *MEMBER*, or *OWNER*.

## Install
Add a workflow looking like this in `.github/workflows/comments.yml`:

<strong>Note: In order to use this Action, you need to generate a [GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) (PAT). While you can use the default `GITHUB_TOKEN` token, commits and PRs created by the GITHUB_TOKEN won't trigger other workflows in the repository.</strong>

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
      uses: PrismarineJS/prismarine-repo-actions@master
      with:
        # NOTE: You must specify a Personal Access Token (PAT) with repo access here. While you can use the default GITHUB_TOKEN, actions taken with it will not trigger other actions, so if you have a CI workflow, commits created by this action will not trigger it.
        token: ${{ secrets.PAT_TOKEN }}
        # See `Options` section below for more info on these options
        install-command: npm install
        /fixlint.fix-command: npm run fix
```

Commands can be enabled/disabled by setting the `/$command.enabled` property to `true` or `false`.

### Options
<table>
<thead>
  <tr>
    <td><strong>option</strong></td>
    <td><strong>default</strong></td>
    <td><strong>doc</strong></td>
  </tr>
</thead>
<tbody>
  <tr>
    <td>token</td>
    <td><strong>Required</strong></td>
    <td>Github API key. Either a Personal Access Token (PAT) with repo access or the predefined <code>${{ secrets.PAT_TOKEN }}</code>.</td>
  </tr>
  <tr>
    <td>install-command</td>
    <td><code>"npm install"</code></td>
    <td>What command to run to install the repo if the command requires installing it</td>
  </tr>
  <tr>
    <td>/makerelease.enabled</td>
    <td><code>true</code></td>
    <td>Whether or not to enable the `/makerelease` command</td>
  </tr>
  <tr>
    <td>/makerelease.releaseCommitsStartWith</td>
    <td><code>"Release "</code></td>
    <td>When looking back through all the commits until the most recent release, what separator to stop at</td>
  </tr>
  <tr>
    <td>/fixlint.enabled</td>
    <td><code>true</code></td>
    <td>Whether or not to enable the `/fixlint` command</td>
  </tr>
  <tr>
    <td>/fixlint.fix-command</td>
    <td><code>"npm run fix"</code></td>
    <td>What command to use to fix the lint</td>
  </tr>
</tbody>
</table>

## Commands
* /makerelease [release version]
  * Make a release PR (Node.js and Python projects) on projects that have a HISTORY.md file like [this](https://github.com/PrismarineJS/mineflayer/blob/master/docs/history.md)
  * This command creates a new PR with a modified HISTORY.md adding a section with the latest commits since the last release and if they exist, updates the package.json (Node.js) or setup.py/pyproject.toml (Python) manifest files.
  * *This doesn't actually create a release, it just creates a PR that when merged, should trigger your actual release workflow.* You can modify the generated changelog as needed.
  * [Example trigger](https://github.com/PrismarineJS/prismarine-repo-actions/pull/6) and [resulting release PR](https://github.com/PrismarineJS/prismarine-repo-actions/pull/7)
* /fixlint
  * Run a lint fix command on the current PR, then push the update to the PR
  * [Example trigger](https://github.com/PrismarineJS/prismarine-repo-actions/pull/6)

