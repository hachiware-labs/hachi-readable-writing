# Install Lumen CLI 3.2.0

This guide installs Lumen CLI for first-time users on Windows, macOS, or Ubuntu and starts a local development project.

## Requirements

Lumen CLI 3.2.0 supports:

- Windows 11
- macOS 13 or later
- Ubuntu 22.04 or later

Before continuing, install Node.js 22 and npm 10 for your user account. Confirm their versions in a regular terminal:

```text
node --version
npm --version
```

On Windows, use a normal PowerShell session; administrator access is not required. On macOS and Ubuntu, do not use `sudo` with the npm installation command.

## Install Lumen CLI

Run the same command on all supported systems:

```text
npm install --global @lumen/cli@3.2.0
```

Verify the installation:

```text
lumen --version
```

The expected output is:

```text
3.2.0
```

## Create your first project

Create a project named `hello-site`, enter its directory, and start the development server:

```text
lumen init hello-site
cd hello-site
lumen dev
```

Open the development page at:

```text
http://localhost:4173
```

## Troubleshooting

### `lumen` is not found

Find npm’s global installation location:

```text
npm prefix --global
```

Check whether the executable directory for that location is included in your `PATH`. After correcting `PATH`, close and reopen the terminal, then try:

```text
lumen --version
```

### The installation reports a permission error

Review how Node.js and npm were installed for your user account. Do not bypass the error by opening an administrator PowerShell session or running `sudo npm install`.

## Uninstall Lumen CLI

Remove the globally installed CLI with:

```text
npm uninstall --global @lumen/cli
```

Uninstalling the CLI does not delete existing Lumen projects.