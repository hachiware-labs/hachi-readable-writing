# Install Lumen CLI 3.2.0

Lumen CLI 3.2.0 supports Windows 11, macOS 13 or later, and Ubuntu 22.04 or later. Before installing it, make sure Node.js 22 and npm 10 are available in your terminal.

Install the CLI globally:

```sh
npm install --global @lumen/cli@3.2.0
```

Do not run this command with `sudo`, and do not use an administrator PowerShell window on Windows.

Verify the installation:

```sh
lumen --version
```

The command should print:

```text
3.2.0
```

Create and run your first project:

```sh
lumen init hello-site
cd hello-site
lumen dev
```

Open the development page at `http://localhost:4173`.

If your terminal reports that `lumen` is not found, run:

```sh
npm prefix --global
```

Check that the executable directory for that global npm location is included in your `PATH`, then close and reopen the terminal.

If installation fails with a permissions error, review your user-level Node.js and npm installation. Do not bypass the issue with administrator rights or `sudo`.

To uninstall the CLI later, run:

```sh
npm uninstall --global @lumen/cli
```

This removes the CLI but does not delete existing projects.