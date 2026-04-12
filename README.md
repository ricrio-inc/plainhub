# PlainHub

**Frontend for GitHub.** Edit GitHub files directly in your browser — no server, no database.

<!-- ![PlainHub Demo](docs/images/hero.gif) -->

[![Try PlainHub](https://img.shields.io/badge/Try%20PlainHub-plainhub.dev-blue?style=for-the-badge)](https://plainhub.dev)
[![npm version](https://img.shields.io/npm/v/plainhub)](https://www.npmjs.com/package/plainhub)

[日本語ドキュメント](docs/ja/README.md)

PlainHub is an online editor that makes GitHub simple for everyone.
Open, edit, save — directly to your repo. No Git knowledge required.
Control GitHub with natural language: just tell the AI what you want.

## Features

### Editor

- **Markdown 3-mode editing** — Code / Visual (WYSIWYG) / Preview
- **Syntax highlighting** — Markdown, JSON, YAML, and more
- **Undo / Redo** — Full edit history
- **Line numbers, auto-indent, line wrapping** — Configurable
- **Whitespace visualization** — Toggle invisible characters
- **Keyboard shortcuts** — VS Code-style shortcuts (Ctrl+S, Ctrl+Z, etc.)

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
- **[Features](docs/FEATURES.md)** — Key features, data ownership, enterprise
- **[Use Cases](docs/USE_CASES.md)** — When and how to use PlainHub
- **[CLI Reference](docs/CLI.md)** — Terminal commands and options
- **[MCP Server](docs/MCP_SERVER.md)** — AI IDE integration
- **[FAQ](docs/FAQ.md)** — Troubleshooting and common questions
- **[日本語ドキュメント](docs/ja/)** — Japanese documentation

## Community

- [Report an Issue](https://github.com/ricrio-inc/plainhub/issues)

## Links

- **App**: [app.plainhub.dev](https://app.plainhub.dev)
- **About**: [plainhub.dev](https://plainhub.dev)

## License

Copyright © 2025 [ricrio Inc.](https://ai.ricrio.jp/) All rights reserved.
