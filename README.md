# PlainHub

[日本語](docs/README_ja.md)

**GitHub-native notepad. AI-ready.**

<!-- ![PlainHub Demo](docs/images/hero.gif) -->

[![npm version](https://img.shields.io/npm/v/plainhub)](https://www.npmjs.com/package/plainhub)

Open, edit, save — directly to your repo. No server, no database.

## Features

### Editor

- **Markdown 3-mode editing** — Code / Visual (WYSIWYG) / Preview
- **Syntax highlighting** — Markdown, JSON, YAML, and more
- **Undo / Redo** — Full edit history
- **Line numbers, auto-indent, line wrapping** — Configurable
- **Whitespace visualization** — Toggle invisible characters
- **Keyboard shortcuts** — Vim-like efficiency

### File Management

- **Create / rename / duplicate / delete** files and folders
- **File history** — View past versions with diff
- **Sync & conflict resolution** — Real-time sync with GitHub
- **Image paste** — Paste images directly, auto-upload to repo
- **Cross-repo search** — Search across all your repositories

### Integration

- **CLI** — `plainhub open <file> -r <repo>` from your terminal
- **MCP Server** — Control from AI IDE (Claude Code, Cursor, VS Code)
- **Deep linking** — Share URLs with theme, font size, line number settings
- **PWA** — Install as native app on desktop and mobile

### Design

- **Dark / Light theme** — Automatic or manual
- **Mobile responsive** — Full-featured on phone and tablet

## Quick Start

### Web

Visit **[plainhub.dev](https://plainhub.dev)** and sign in with GitHub.

### CLI

```bash
npm install -g plainhub
plainhub auth --from-gh
plainhub open README.md -r owner/repo
```

### MCP Server (AI IDE)

```bash
npm install -g plainhub
claude mcp add plainhub -- plainhub-mcp
```

Then say: *"Open the README in owner/repo on PlainHub"*

## Documentation

- **[User Guide](docs/USER_GUIDE.md)** — Editor features and shortcuts
- **[CLI Reference](docs/CLI.md)** — Commands and options
- **[MCP Server Setup](docs/MCP_SERVER.md)** — AI IDE integration

## PlainHub & github.dev

github.dev is a full-featured editor — great for serious coding sessions.

PlainHub is a **notepad backed by GitHub** — open, edit, save. Different tools for different moments.

## Links

- **App**: [plainhub.dev](https://plainhub.dev)
- **About**: [plainhub.dev/about.html](https://plainhub.dev/about.html)

## License

Copyright © 2025 [ricrio Inc.](https://ai.ricrio.jp/) All rights reserved.
