## History

### 1.3.0
* [/fixrelease: use github API for recent commits to show Github usernames in history](https://github.com/PrismarineJS/prismarine-repo-actions/commit/797a7dac3052c94472a847b304a607063160d47b) (thanks @extremeheat)
* [/makerelease: improve padding handling](https://github.com/PrismarineJS/prismarine-repo-actions/commit/85203d23c3dfea003404a843fb241515fc5f6041) (thanks @extremeheat)
* [add newline padding to /makerelease](https://github.com/PrismarineJS/prismarine-repo-actions/commit/b4e70e238c983e54130b34ea5ec3ce76944281b8) (thanks @extremeheat)
* [fix existing PR search](https://github.com/PrismarineJS/prismarine-repo-actions/commit/7dbd0e24c9099d7723b3abb5be8f20bd874dc46f) (thanks @extremeheat)
* [Add history in readme support for /makerelease (#8)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/e41301a96d654999f923d0f884f77466a565e5ea) (thanks @extremeheat)
* [update build](https://github.com/PrismarineJS/prismarine-repo-actions/commit/51c5f22c0dc82773c78a84f5cd0daf6ee7421fa6) (thanks @extremeheat)
* [disable npm dry run](https://github.com/PrismarineJS/prismarine-repo-actions/commit/93ac68369b67e3d83946d0c24ec4578ee2c6daaa) (thanks @extremeheat)
* [rename repo](https://github.com/PrismarineJS/prismarine-repo-actions/commit/2adb7c7c4c66fb23708856f1e74f45c7a5e29377) (thanks @extremeheat)

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
