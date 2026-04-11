> **[plainhub.dev](https://plainhub.dev)** — Try PlainHub now | [日本語](ja/MCP_SERVER.md)

# PlainHub MCP Server — Control GitHub from AI IDEs

An MCP Server that lets you manage GitHub files using natural language from Claude Code, Cursor, and VS Code.

---

## What Is an MCP Server?

With an MCP (Model Context Protocol) Server, you can control PlainHub using natural language from AI IDEs like Claude Code, Cursor, and VS Code. No need to memorize commands.

```
"Open the README in owner/repo on PlainHub"
"I want to browse this repository"
"Show me the latest commit diff"
"Check my authentication status"
```

---

## Setup

### Claude Code

```bash
npm install -g plainhub
claude mcp add plainhub -- plainhub-mcp
```

Or add directly to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "plainhub": {
      "command": "npx",
      "args": ["-y", "plainhub-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "plainhub": {
      "command": "plainhub-mcp"
    }
  }
}
```

### VS Code

Add to your VS Code MCP settings:

```json
{
  "mcpServers": {
    "plainhub": {
      "command": "npx",
      "args": ["-y", "plainhub-mcp"]
    }
  }
}
```

---

## MCP Server Tools

| Tool | Description |
|------|-------------|
| `plainhub_open` | Open a file or change editor settings |
| `plainhub_diff` | View a commit diff in PlainHub |
| `plainhub_browse` | Open the repository file browser |
| `plainhub_auth` | Save a GitHub PAT |
| `plainhub_auth_status` | Check authentication status |

---

## Claude Code Integration

Combine Claude Code and PlainHub to cover both code and documentation.

### Workflow Examples

- **Code + Docs**: Fix code in Claude Code → Update documentation in PlainHub → Git commit both
- **Bug Investigation**: Investigate root cause in Claude Code → Visually review changes with `plainhub diff`
- **Team Collaboration**: Non-engineers write meeting notes in PlainHub → Engineers reference them in Claude Code

> Claude Code is where you write code. PlainHub is where you write documents. MCP/CLI connects the two seamlessly.

---

## Authentication

The MCP Server shares the same credentials as the CLI.

```bash
# Import auth from gh CLI (recommended)
plainhub auth --from-gh

# Or set a PAT manually
plainhub auth
```

Tokens are saved to `~/.config/plainhub/token` (permissions `0600`).

---

## Troubleshooting

### MCP Server Not Recognized

1. Verify `plainhub-mcp` is installed: `which plainhub-mcp`
2. Restart Claude Code / Cursor
3. Check the JSON syntax in your settings file

### Authentication Errors

1. Check authentication status with `plainhub auth --status`
2. Re-authenticate with `plainhub auth --from-gh`
3. Ensure your GitHub PAT includes the `repo` scope
