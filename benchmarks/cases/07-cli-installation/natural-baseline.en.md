# Install Lumen CLI 3.2.0

Lumen CLI supports:

- Windows 11
- macOS 13 or later
- Ubuntu 22.04 or later

## 1. Check the prerequisites

Lumen CLI requires Node.js 22 and npm 10. Open a regular terminal—administrator privileges are not required—and run:

```sh
node --version
npm --version
```

Confirm that the reported major versions are `22` and `10`, respectively. If they are not installed, set up Node.js and npm for your user account before continuing.

## 2. Install Lumen CLI

The same command works in PowerShell, Terminal, and an Ubuntu shell:

```sh
npm install --global @lumen/cli@3.2.0
```

Do not run this command with `sudo`. On Windows, do not switch to an administrator PowerShell.

## 3. Verify the installation

```sh
lumen --version
```

Expected output:

```text
3.2.0
```

## 4. Create your first project

```sh
lumen init hello-site
cd hello-site
lumen dev
```

Open the development page at:

```text
http://localhost:4173
```

## Troubleshooting

If the terminal reports that `lumen` was not found, run:

```sh
npm prefix --global
```

Check that the executable directory associated with that global npm location is included in your `PATH`, then close and reopen the terminal.

If installation fails with a permission error, review your user-level Node.js and npm installation. Do not bypass the error by using administrator rights or `sudo`.

## Uninstall Lumen CLI

```sh
npm uninstall --global @lumen/cli
```

Uninstalling the CLI does not delete existing Lumen projects.