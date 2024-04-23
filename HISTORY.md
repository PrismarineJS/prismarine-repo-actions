## History

### 1.4.0
* [Update for gh-helpers v0.3 (#24)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/cd94fb7c8d15b0c7870ece32096acebe85055b6f) (thanks @extremeheat)
* [Add review command (#20)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/8a34d86a9129acb5991e1d904fb4cfffd17d12ca) (thanks @extremeheat)
* [Bump gh-helpers from 0.1.3 to 0.2.2 (#23)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/29cf6d0ae0a48cb266c01b262beeb57180ea8a8d) (thanks @dependabot[bot])
* [Bump gh-helpers from 0.0.1 to 0.1.2 (#19)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/98271383c7475c6d14f6317d06a70c8985993a59) (thanks @dependabot[bot])

### 1.3.1
* [Move github-helper script to new `gh-helpers` package (#17)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/7cfb6bcd45613a5ad555463fe27d65eb441cc028) (thanks @extremeheat)
* [node18 is not supported by gh action, switching to 20](https://github.com/PrismarineJS/prismarine-repo-actions/commit/bed432092fccc6168b9c29f005ff74d97c820166) (thanks @rom1504)
* [Fix token type check, update options/doc (#16)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/c4c9ead22a191073f261a0ce40c067c1432d9cdb) (thanks @extremeheat)
* [Bump @actions/github from 5.1.1 to 6.0.0 (#13)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/3bb43f87efaef757878d497e645020f6473a972b) (thanks @dependabot[bot])
* [Bump @vercel/ncc from 0.36.1 to 0.38.1 (#14)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/815ae9ce1534d11643399a5774399e4fa9c9f3dd) (thanks @dependabot[bot])
* [update build](https://github.com/PrismarineJS/prismarine-repo-actions/commit/4127e381c806ccb5fa8df95e3ddc944539bf83bb) (thanks @extremeheat)
* [Fix default github_token usage](https://github.com/PrismarineJS/prismarine-repo-actions/commit/e37b4090dd4a3e98bdea0db5ac3ca8782eeaa3cb) (thanks @extremeheat)
* [makerelease: reorder manifest lookup to fix another special case](https://github.com/PrismarineJS/prismarine-repo-actions/commit/095d42c3ab8dfe762e9656884df304073d86e32a) (thanks @extremeheat)
* [makerelease: update manifest updating (#11)](https://github.com/PrismarineJS/prismarine-repo-actions/commit/af035507315e9cfc7d7d7666e12483997c5b569f) (thanks @extremeheat)
* [makerelease: update manifest update logic](https://github.com/PrismarineJS/prismarine-repo-actions/commit/9c1554bd6e981edfddfa7b52d2855c564f075616) (thanks @extremeheat)
* [Fix space/quote handling when reading setup.py for release cmd](https://github.com/PrismarineJS/prismarine-repo-actions/commit/7d28e7904aa8a922d3c7913130930bb13410889c) (thanks @extremeheat)

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
