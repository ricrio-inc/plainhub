> **[plainhub.dev](https://plainhub.dev)** — Try PlainHub now | [日本語](ja/USER_GUIDE.md)

# PlainHub User Guide — Edit GitHub Files in Your Browser

PlainHub is an AI-powered online editor that lets you edit GitHub repository files directly in your browser.

---

## What is PlainHub

PlainHub is an online text editor that lets you edit files in your GitHub repositories directly from the browser.

- **Complete Data Ownership** — All files are stored in your GitHub repository. No proprietary servers or databases
- **100% Client-Side** — Everything runs in your browser. No data is sent to PlainHub servers
- **Automatic Version Control** — Every save creates a Git commit. View change history on GitHub
- **Multi-Device** — Sign in and access from any device
- **Lightweight** — Smoothly edit even files with tens of thousands of lines

### Who is it for

- Engineers and non-engineers who want to use GitHub and AI for document management
- Anyone who wants to quickly edit and save files from a browser
- Users of AI tools (Claude Code / Cursor) who want to operate GitHub files

---

## Getting Started

### Web

1. Visit [plainhub.dev](https://plainhub.dev)
2. Click **Sign in with GitHub**
3. Select a repository and start editing

### CLI

```bash
npm install -g plainhub
plainhub auth --from-gh
plainhub open README.md -r your/repo
```

### MCP Server (Claude Code)

Add to `~/.claude/settings.json`:

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

## Editor

### Three Editor Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Code** | Plain text / source code view (CodeMirror) | Code editing, text editing |
| **Preview** | Markdown rendered view | Document reading |
| **Visual** | WYSIWYG editing (ProseMirror) | Edit without knowing Markdown — like Word |

### Image Paste

Paste screenshots directly from clipboard with Ctrl+V. Great for creating documents with visual evidence.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save instantly (Git commit) |
| Ctrl+B | Toggle sidebar |
| Ctrl+H | Focus Mode (hide UI elements) |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Ctrl+L | Select line |
| Ctrl+Home / End | Jump to beginning / end of file |
| Alt+Z | Toggle line wrapping |

---

## AI Panel

An AI chat feature integrated into the editor. Uses the Claude API to let you control the editor with natural language.

### What You Can Do

```
Content operations:
  "Convert this paragraph to bullet points"
  "Summarize this file"
  "Translate to Japanese"
  "Create a new README with a project overview"

UI operations:
  "Switch to dark mode"
  "Increase the font size"
  "Close the sidebar"
  "Switch to preview mode"
```

### Control GitHub with Natural Language

Execute GitHub-specific operations from the AI panel using natural language. No need to learn the GitHub UI.

| GitHub Operation | With PlainHub |
|-----------------|---------------|
| Navigate to a repo and find a file | "Open README.md" |
| Switch between repositories | "Switch to design-docs" |
| Create a new repository | "Create a repo called my-notes" |
| Create a new file and commit | "Create docs/memo.md" |
| Create an Issue | "Create a bug report Issue" |
| Comment on an Issue | "Comment on Issue #1 that it's resolved" |
| Close an Issue | "Close Issue #1" |

### Available Models

| Model | Characteristics |
|-------|----------------|
| **Opus** | Highest performance. Best for advanced analysis and long-form writing |
| **Sonnet** | Balanced. Best for code editing and complex suggestions |
| **Haiku** (default) | Fast and low-cost. Best for everyday editing and simple questions |

Switch between models with one click in the settings.

### Features

- **BYOK** (Bring Your Own Key) — Use your own Anthropic API key
- Automatically provides the current file content as context
- Diff view for proposed edits — review changes before applying
- Streaming response support

---

## Search

### Three Search Modes

| Mode | Description |
|------|-------------|
| **Name** | Search by file name |
| **Content** | Search within file contents |
| **All repos** | Search across all repositories |

### Cross-Repository Search (All repos)

Search across all your GitHub repositories in one place.

- **Scope**: All repositories accessible to the logged-in user
- **Method**: Simultaneous file name and content search (GitHub Search API + Trees API)
- **Results**: Grouped by repository
- **Filtering**: Filter results by specific repository

#### Examples

- Find information across documents scattered in multiple repositories
- Search for specific keywords (API names, config values) across projects
- Instantly resolve "which repo was that file in?"

---

## Repository Management

- **Switch repositories**: One-click switching from the sidebar header
- **Create repositories**: Create new repositories from the browser (Public/Private)
- **File operations**: Create, edit, and save files directly in the browser
- **Context menu**: Duplicate files, copy paths, delete, and more

---

## Security

- **Authentication**:
  - Web UI: Sign in securely via GitHub's official OAuth flow (tokens stored in browser localStorage)
  - CLI / MCP Server: Stored locally at `~/.config/plainhub/token` (permissions 0600, owner read/write only)
- **Code integrity verification**: Verify that running code matches the GitHub repository via SHA-256 hash

---

## PWA Support

- **Offline support**: Works offline via Service Worker
- **Add to home screen**: Install as an app on mobile and desktop
- **Native app feel**: Runs without the browser address bar

---

## Supported Browsers

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
