# Install Lumen CLI 3.2.0

Lumen CLI 3.2.0 supports:

- Windows 11
- macOS 13 or later
- Ubuntu 22.04 or later

Before installing, ensure Node.js 22 and npm 10 are installed.

## 1. Open a terminal

- Windows: Open a standard PowerShell or Command Prompt window. Administrator privileges are not required.
- macOS: Open Terminal.
- Ubuntu: Open a terminal.

## 2. Install Lumen CLI

Run:

```bash
npm install --global @lumen/cli@3.2.0
```

Do not run this command with `sudo`, and do not use an administrator PowerShell to bypass permission errors.

## 3. Verify the installation

Run:

```bash
lumen --version
```

The expected output is:

```text
3.2.0
```

## 4. Create your first project

Run:

```bash
lumen init hello-site
cd hello-site
lumen dev
```

Open the development page at:

<http://localhost:4173>

## Troubleshooting

### `lumen` is not found

Find the global npm location:

```bash
npm prefix --global
```

Check whether the executable directory for that global location is included in your `PATH`. Add it if necessary, then close and reopen the terminal before trying again.

### Permission errors

Review your user-level Node.js and npm installation. Do not bypass the problem by using administrator rights or `sudo`.

## Uninstall Lumen CLI

Run:

```bash
npm uninstall --global @lumen/cli
```

Uninstalling the CLI does not delete existing Lumen projects.