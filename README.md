# prismarine-repo-commands
[![NPM version](https://img.shields.io/npm/v/prismarine-repo-actions.svg?color=success&label=npm%20package&logo=npm)](https://www.npmjs.com/package/prismarine-repo-actions)
[![Build Status](https://img.shields.io/github/actions/workflow/status/PrismarineJS/prismarine-repo-actions/ci.yml.svg?label=CI&logo=github&logoColor=lightgrey)](https://github.com/PrismarineJS/mineflayer/actions?query=workflow%3A%22CI%22)
[![Try it on gitpod](https://img.shields.io/static/v1.svg?label=try&message=on%20gitpod&color=brightgreen&logo=gitpod)](https://gitpod.io/#https://github.com/PrismarineJS/prismarine-repo-actions)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/PrismarineJS)](https://github.com/sponsors/PrismarineJS)\
[![Official Discord](https://img.shields.io/static/v1.svg?label=PrismarineJS&message=Discord&color=blue&logo=discord)](https://discord.gg/GsEFRM8)

Github Action for automating repo actions via issue/PR comment commands. To run a command, the commenter must be a repo *COLLABORATOR*, *MEMBER*, or *OWNER*. PR authors without write access cannot run commands, since several commands execute code from the PR branch with the workflow token.

## Install
Add a workflow looking like this in `.github/workflows/comments.yml`:

<strong>Note: In order to use this Action, you need to generate a [GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) (PAT). While you can use the default `GITHUB_TOKEN` token, commits and PRs created by the GITHUB_TOKEN won't trigger other workflows in the repository.</strong>

```yaml
name: Repo Commands

on:
  issue_comment:        # Handle comment commands
    types: [created]

# NOTE: You must use a Personal Access Token (PAT) with repo access. While you can use the default GITHUB_TOKEN,
# actions taken with it will not trigger other actions, so if you have a CI workflow, commits created by this action will not trigger it.
jobs:
  comment-trigger:
    runs-on: ubuntu-latest
    steps:
    - name: Check out repository
      uses: actions/checkout@v4
      with:
        token: ${{ secrets.PAT_TOKEN }}
    - name: Run command handlers
      uses: PrismarineJS/prismarine-repo-actions@master
      with:
        token: ${{ secrets.PAT_TOKEN }}
        # See `Options` section below for more info on these options
        install-command: npm install
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
    <td>/ai.enabled</td>
    <td><code>false</code></td>
    <td>Whether or not to enable the `/ai` command. Off by default as it creates Copilot agent tasks with the workflow token.</td>
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
    <td><code>false</code></td>
    <td>Whether or not to enable the `/fixlint` command. Off by default as it runs the PR branch's install and lint-fix scripts on the runner with the workflow token, so anyone with write access can extract the token via a PR.</td>
  </tr>
  <tr>
    <td>/fixlint.fix-command</td>
    <td><code>"npm run fix"</code></td>
    <td>What command to use to fix the lint</td>
  </tr>
  <tr>
    <td>/mergeonpass.enabled</td>
    <td><code>false</code></td>
    <td>Whether or not to enable the `/mergeonpass` command</td>
  </tr>
  <tr>
    <td>/mergeonpass.maxWaitTime</td>
    <td><code>600000</code> (20 min)</td>
    <td>How long to wait in milliseconds for the PR checks to pass (after retries) before giving up</td>
  </tr>
  <tr>
    <td>/mergeonpass.defaultRetries</td>
    <td><code>1</code></td>
    <td>How many times to retry the PR checks on failure when waiting on merge, if the user does not specify in argument</td>
  </tr>
  <tr>
    <td>/mergeonpass.defaultMode</td>
    <td><code>squash</code></td>
    <td>What merge mode to use by default, options are { squash, merge, rebase }, if the user does not specify in argument</td>
  </tr>
  <tr>
    <td>/review.enabled</td>
    <td><code>false</code></td>
    <td>Whether or not to enable the `/review` command</td>
  </tr>
  <tr>
    <td>llm-services-repo</td>
    <td><code>$currentOrganization/llm-services</code></td>
    <td>What repository to use to send LLM requests to via dispatch. For example, `PrismarineJS/llm-services`. Defaults to the triggering repo's org's `llm-services` repo.</td>
  </tr>
</tbody>
</table>

## Commands
* /ai <prompt>
  * Create a GitHub Copilot Agent task to work on an issue or pull request
  * The command automatically includes the PR/issue URL as context
  * For PRs where both source and target branches are in the same repo, the agent will work on the source branch
  * Example: `/ai fix the failing tests`
  * Example: `/ai add documentation for the new feature`
* /makerelease [x.y.z | major | minor (default) | patch]
  * Make a release PR (Node.js and Python projects) on projects that have a HISTORY.md file like [this](https://github.com/PrismarineJS/mineflayer/blob/master/docs/history.md)
  * This command creates a new PR with a modified HISTORY.md adding a section with the latest commits since the last release and if they exist, updates the package.json (Node.js) or setup.py/pyproject.toml (Python) manifest files.
  * *This doesn't actually create a release, it just creates a PR that when merged, should trigger your actual release workflow.* You can modify the generated changelog as needed.
  * [Example trigger](https://github.com/PrismarineJS/prismarine-repo-actions/pull/6) and [resulting release PR](https://github.com/PrismarineJS/prismarine-repo-actions/pull/7)
* /fixlint (off by default, see Options)
  * Run a lint fix command on the current PR, then push the update to the PR
  * [Example trigger](https://github.com/PrismarineJS/prismarine-repo-actions/pull/6)
* `/mergeonpass [retries (default: 1)] [mode: squash (default), merge, rebase]\n[custom commit message]`
  * Merge a pull request after tests pass, with n retries of failed tests.
  * Merge a PR with 3 retries with standard merge mode, with the custom merge commit message "Merge this PR"
    ```
    /mergeonpass 3 merge
    Merge this PR
    ```
  * [Example trigger](https://github.com/extremeheat/gh-helpers/pull/25)
