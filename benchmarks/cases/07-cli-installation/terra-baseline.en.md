# Install Lumen CLI 3.2.0

Lumen CLI 3.2.0 supports Windows 11, macOS 13 or later, and Ubuntu 22.04 or later. Before installing it, make sure Node.js 22 and npm 10 are installed for your user account.

Install the CLI from a normal terminal session:

```sh
npm install --global @lumen/cli@3.2.0
```

Do not use `sudo npm install` on macOS or Ubuntu, and do not run PowerShell as an administrator on Windows.

Verify the installation:

```sh
lumen --version
```

The command should print:

```text
3.2.0
```

## Start your first project

Create and run a project:

```sh
lumen init hello-site
cd hello-site
lumen dev
```

Open http://localhost:4173 in your browser.

## Troubleshooting

If the `lumen` command is not found, run:

```sh
npm prefix --global
```

Check that the executable directory for that global npm location is included in your `PATH`, then close and reopen the terminal.

If installation fails with a permission error, review your user-level Node.js and npm installation. Do not bypass the issue with administrator rights or `sudo`.

## Uninstall

```sh
npm uninstall --global @lumen/cli
```

Uninstalling Lumen CLI does not delete existing projects.