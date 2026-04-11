> **[plainhub.dev](https://plainhub.dev)** — Try PlainHub now | [日本語](ja/CLI.md)

# PlainHub CLI — Open GitHub Files in Your Browser from the Terminal

A CLI tool that lets you open any GitHub repository file in PlainHub with a single command.

---

## Installation

```bash
npm install -g plainhub
```

## Quick Start

```bash
plainhub auth --from-gh        # Import auth from gh CLI (recommended)
plainhub open README.md -r owner/repo
plainhub browse -r owner/repo  # Open the file browser
```

---

## Commands

| Command | Description |
|---------|-------------|
| `plainhub open <file>` | Open a file in PlainHub |
| `plainhub diff <sha>` | View a commit diff in PlainHub |
| `plainhub browse` | Open the repository file browser |
| `plainhub auth` | Authenticate with a GitHub PAT |
| `plainhub auth --from-gh` | Import token from gh CLI |
| `plainhub auth --status` | Check authentication status |
| `plainhub auth --logout` | Remove saved token |

---

## Options

| Option | Value | Description |
|--------|-------|-------------|
| `-r, --repo` | owner/name | Repository |
| `-b, --branch` | string | Git branch |
| `-l, --line` | number | Jump to line |
| `-n` | | Print URL only (don't open browser) |
| `--theme` | dark/light | Editor theme |
| `--preview` | on/off | Markdown preview |
| `--scroll` | string | Scroll to a heading in preview |
| `--sidebar` | on/off | Sidebar visibility |
| `--fontSize` | 8-72 | Font size |
| `--lineNumbers` | on/off | Line numbers |
| `--whitespace` | on/off | Whitespace characters |
| `--no-auth` | | Open without authentication |

---

## Examples

```bash
# Open a document with Markdown preview
plainhub open docs/API.md -r owner/repo --preview on

# Jump to a specific line with light theme
plainhub open src/App.tsx -r owner/repo -l 42 --theme light

# Print URL only (useful for scripts or sharing in chat)
plainhub open README.md -r owner/repo -n

# View a commit diff
plainhub diff abc1234 -r owner/repo

# View the diff for a specific file only
plainhub diff abc1234 -r owner/repo --path src/main.js

# Share a URL with preset editor settings
plainhub open docs/API.md -r owner/repo --preview on --theme light --fontSize 18
```

---

## Authentication

PlainHub supports three authentication methods:

1. **gh CLI import** (recommended): `plainhub auth --from-gh`
2. **Manual PAT**: `plainhub auth` — opens GitHub token settings
3. **Web UI**: Enter your PAT directly in the browser

Tokens are saved to `~/.config/plainhub/token` (permissions `0600`, owner read/write only).

---

## Using with gh CLI

If you already use gh CLI, getting started with PlainHub is effortless. Just share your authentication and you're ready to go.

```bash
# If you're already authenticated with gh CLI, this is all you need
plainhub auth --from-gh
```

While gh CLI is a tool for "managing GitHub," PlainHub is a tool for "editing GitHub files." They complement each other naturally since they cover different use cases.

```
gh CLI excels at:
  Creating issues, managing PRs, repository admin, checking CI

PlainHub excels at:
  Editing documents, creating/saving files, Markdown preview, AI assistance
```

### Flexible Combinations

PlainHub connects to the same GitHub data through every channel — CLI, MCP, browser, and AI panel. You can access the same files from any channel, and how you combine them is up to you.

```
Launch PlainHub automatically from shell scripts
Embed PlainHub URLs in CI/CD steps for review workflows
Post PlainHub links from Slack bots
Include PlainHub URLs in GitHub Actions notifications
Analyze with Claude Code → Write reports in PlainHub → Commit to the same repo
```
