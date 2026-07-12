Write installation instructions for Lumen CLI 3.2.0.
They are for developers using it for the first time on Windows, macOS, or Ubuntu.

What we know:

- Supported systems are Windows 11, macOS 13 or later, and Ubuntu 22.04 or later.
- Node.js 22 and npm 10 are prerequisites.
- Install with `npm install --global @lumen/cli@3.2.0`.
- Do not use `sudo npm install`, and do not assume an administrator PowerShell on Windows.
- Verify with `lumen --version`; the expected output is `3.2.0`.
- Start a first project with `lumen init hello-site`, `cd hello-site`, and `lumen dev`.
- The development page opens at `http://localhost:4173`.
- If `lumen` is not found, run `npm prefix --global`, check whether the executable directory for that global location is on PATH, and reopen the terminal.
- For permission errors, review the user-level Node.js/npm installation instead of bypassing the problem with administrator rights or sudo.
- Uninstall with `npm uninstall --global @lumen/cli`. Existing projects are not deleted.
- We do not have any other commands or screens documented.

