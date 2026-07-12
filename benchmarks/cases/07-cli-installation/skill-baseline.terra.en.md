# Install Lumen CLI 3.2.0

Lumen CLI requires Windows 11, macOS 13 or later, or Ubuntu 22.04 or later, with Node.js 22 and npm 10 installed.

Install version 3.2.0 in your user-level npm environment:

```sh
npm install --global @lumen/cli@3.2.0
```

Do not use `sudo npm install`. On Windows, an Administrator PowerShell is not required.

Verify the installation:

```sh
lumen --version
```

Expected output:

```text
3.2.0
```

## Create your first project

```sh
lumen init hello-site
cd hello-site
lumen dev
```

Open the development page at [http://localhost:4173](http://localhost:4173).

## If `lumen` is not found

Check npm’s global installation location:

```sh
npm prefix --global
```

Ensure the executable directory for that global location is included in your `PATH`, then close and reopen the terminal before running `lumen --version` again.

## Permission errors

Review your user-level Node.js and npm installation. Do not bypass permission errors with administrator privileges or `sudo`.

## Uninstall

```sh
npm uninstall --global @lumen/cli
```

This removes the CLI only; existing Lumen projects are not deleted.