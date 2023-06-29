## History

### 1.2.0
#### Added Commands
* /makerelease [release version]
  * Make a release PR (Node.js and Python projects).
  * This command creates a new PR with a modified HISTORY.md adding a section with the latest commits since the last release PR (commit starting with "Release ") and if they exist, updates the package.json (Node.js) or setup.py/pyproject.toml (Python) manifest files.
  * *This doesn't actually create a release, it just creates a PR that when merged, will trigger your actual release workflow.*
  * [Example trigger](https://github.com/PrismarineJS/prismarine-repo-actions/pull/1) and [resulting release PR](https://github.com/PrismarineJS/prismarine-repo-actions/pull/5)
* /fixlint
  * Run a lint fix command on the current PR, then push the update to the PR
  * [Example trigger](https://github.com/PrismarineJS/prismarine-repo-actions/pull/1#issuecomment-1611685220)

### 1.0.0

* initial implementation
