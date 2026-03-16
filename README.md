# PlainHub

**GitHub-native notepad. AI-ready.**

Open, edit, save — directly to your repo. No server, no database.

## Features

- **GitHub-backed** — All files stay in your repository
- **CLI** — Open files from your terminal: `plainhub open <file> -r <repo>`
- **MCP Server** — Control from AI IDE (Claude Code, Cursor) via natural language
- **Markdown preview** — Live preview as you type
- **Dark / Light theme** — Automatic or manual switching
- **Deep linking** — Share file URLs with custom settings
- **PWA** — Install as an app, works on mobile

## Quick Start

### Web

Visit **[plainhub.dev](https://plainhub.dev)** and sign in with GitHub.

### CLI

```bash
npm install -g plainhub
plainhub auth --from-gh
plainhub open README.md -r owner/repo
```

### MCP Server

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
