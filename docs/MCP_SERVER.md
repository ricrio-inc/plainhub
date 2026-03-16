# PlainHub MCP Server

Control PlainHub from AI IDEs using natural language.

## Setup

### Claude Code

```bash
npm install -g plainhub
claude mcp add plainhub -- plainhub-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "plainhub": {
      "command": "npx",
      "args": ["plainhub-mcp"]
    }
  }
}
```

### Cursor / Other MCP Clients

Any MCP-compatible client can use PlainHub. Run the server via stdio:

```bash
npx plainhub-mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `plainhub_open` | Open a file or change editor settings |
| `plainhub_browse` | Open repository with file browser |
| `plainhub_auth` | Save or manage GitHub PAT |
| `plainhub_auth_status` | Check authentication status |

### `plainhub_open`

Open a file in PlainHub. Can also change editor settings without opening a specific file.

**Parameters:** `repo`, `path`, `branch`, `line`, `theme`, `fontSize`, `preview`, `sidebar`, `lineNumbers`, `whitespace`, `noAuth`

### `plainhub_browse`

Open a repository with the file browser sidebar.

**Parameters:** `repo`

### `plainhub_auth`

Save a GitHub Personal Access Token. If called without a token, opens the GitHub token settings page.

**Parameters:** `token` (optional)

### `plainhub_auth_status`

Check if a token is saved. Returns the masked token or "not authenticated".

## Examples

```
"Open the README in owner/repo on PlainHub"
→ plainhub_open { repo: "owner/repo", path: "README.md" }

"Switch to light mode"
→ plainhub_open { theme: "light" }

"Set font size to 20"
→ plainhub_open { fontSize: 20 }

"Browse owner/repo"
→ plainhub_browse { repo: "owner/repo" }

"Open src/app.ts on the develop branch"
→ plainhub_open { repo: "owner/repo", path: "src/app.ts", branch: "develop" }
```

## Authentication

The MCP server automatically uses the saved token from `~/.config/plainhub/token`. To set up authentication:

```bash
# From terminal (before using MCP)
plainhub auth --from-gh
```

Or use the `plainhub_auth` tool from your AI IDE to save a token directly.
