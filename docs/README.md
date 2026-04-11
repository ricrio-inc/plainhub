# PlainHub Documentation

**Frontend for GitHub.**

[![Try PlainHub](https://img.shields.io/badge/Try%20PlainHub-plainhub.dev-blue?style=for-the-badge)](https://plainhub.dev)
[![npm version](https://img.shields.io/npm/v/plainhub)](https://www.npmjs.com/package/plainhub)

Open, edit, save — directly to your repo. No server, no database.

## Documentation

- **[User Guide](USER_GUIDE.md)** — Editor features and shortcuts
- **[Features](FEATURES.md)** — Key features, data ownership, enterprise
- **[Use Cases](USE_CASES.md)** — When and how to use PlainHub
- **[CLI Reference](CLI.md)** — Terminal commands and options
- **[MCP Server](MCP_SERVER.md)** — AI IDE integration
- **[FAQ](FAQ.md)** — Troubleshooting and common questions
- **[日本語ドキュメント](ja/)** — Japanese documentation

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

## Links

- **App**: [app.plainhub.dev](https://app.plainhub.dev)
- **About**: [plainhub.dev](https://plainhub.dev)
- **[Back to Repository](../README.md)**
