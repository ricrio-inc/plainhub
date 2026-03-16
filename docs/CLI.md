# PlainHub CLI

Open files, browse repos, and control editor settings from your terminal.

## Install

```bash
npm install -g plainhub
```

## Authentication

```bash
# Recommended: reuse gh CLI token (no browser needed)
plainhub auth --from-gh

# Manual: opens GitHub token settings, then paste your PAT
plainhub auth

# Check status
plainhub auth --status

# Remove saved token
plainhub auth --logout
```

Token is saved to `~/.config/plainhub/token` (permissions `0600`).

## Commands

### `plainhub open <file>`

Open a file in PlainHub browser editor.

```bash
plainhub open README.md -r owner/repo
plainhub open src/app.ts -r owner/repo -b develop -l 42
plainhub open README.md -r owner/repo --preview on --fontSize 20
```

Can also be used without `repo`/`path` to change editor settings only:

```bash
plainhub open --theme light --fontSize 18
```

### `plainhub browse`

Open a repository with the file browser sidebar.

```bash
plainhub browse -r owner/repo
plainhub browse -r owner/repo -b develop
```

### `plainhub auth`

See [Authentication](#authentication) above.

### `plainhub --version`

Show the PlainHub version.

## Options

| Option | Value | Description |
|--------|-------|-------------|
| `-r, --repo` | owner/name | Repository |
| `-b, --branch` | branch name | Branch |
| `-l, --line` | number | Jump to line |
| `-n` | — | Print URL only (don't open browser) |
| `--theme` | dark / light | Theme |
| `--preview` | on / off | Markdown preview |
| `--scroll` | section name | Scroll to heading in preview |
| `--fontSize` | number | Font size (slider 8–72, input accepts any) |
| `--sidebar` | on / off | File browser sidebar |
| `--lineNumbers` | on / off | Line numbers |
| `--whitespace` | on / off | Whitespace characters |
| `--no-auth` | — | Open without passing saved token |

## Examples

```bash
# Open a file
plainhub open README.md -r owner/repo

# Open on a specific branch at line 42
plainhub open src/app.ts -r owner/repo -b develop -l 42

# Browse repository files
plainhub browse -r owner/repo

# Light theme with large font
plainhub open notes.md -r owner/repo --theme light --fontSize 24

# Markdown preview with sidebar
plainhub open docs/guide.md -r owner/repo --preview on --sidebar on

# Print URL only (for scripting / piping)
plainhub open README.md -r owner/repo -n

# Change editor settings (no file)
plainhub open --theme dark --fontSize 14
```

## How It Works

The CLI builds a URL with your parameters and opens it in your default browser. Authentication tokens are passed via URL fragment (`#token=...`), which is never sent to any server per the HTTP specification.

```
plainhub open README.md -r owner/repo --theme light
→ https://plainhub.dev?repo=owner/repo&path=README.md&theme=light#token=...
→ Browser opens → PlainHub reads parameters → token is removed from URL
```
