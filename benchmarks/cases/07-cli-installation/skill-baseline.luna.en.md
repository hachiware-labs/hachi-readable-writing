# Install Lumen CLI 3.2.0

Lumen CLI 3.2.0 supports:

- Windows 11
- macOS 13 or later
- Ubuntu 22.04 or later

Before installing, make sure Node.js 22 and npm 10 are installed.

## Install Lumen CLI

Open a regular terminal. On Windows, do not use an administrator PowerShell. On macOS or Ubuntu, do not use `sudo`.

```bash
npm install --global @lumen/cli@3.2.0
```

Verify the installation:

```bash
lumen --version
```

The expected output is:

```text
3.2.0
```

## Create and run your first project

Create a project named `hello-site`, move into its directory, and start the development server:

```bash
lumen init hello-site
cd hello-site
lumen dev
```

The development page opens at:

```text
http://localhost:4173
```

## Troubleshooting

### `lumen` is not found

Find the global npm installation location:

```bash
npm prefix --global
```

Check whether the executable directory for that global location is included in your `PATH`. After updating `PATH`, close and reopen the terminal, then run:

```bash
lumen --version
```

### Permission errors

Review your user-level Node.js and npm installation. Do not bypass the error by using administrator rights or `sudo npm install`.

## Uninstall Lumen CLI

```bash
npm uninstall --global @lumen/cli
```

Uninstalling the CLI does not delete existing Lumen projects.