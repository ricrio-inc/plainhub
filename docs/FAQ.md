> **[plainhub.dev](https://plainhub.dev)** — Try PlainHub now | [日本語](ja/FAQ.md)

# PlainHub FAQ — Frequently Asked Questions & Troubleshooting

Common questions and answers about PlainHub, the GitHub online editor.

---

## General

### What is PlainHub?

PlainHub is an online text editor that lets you edit and save files in your GitHub repositories directly from the browser. It features a built-in AI panel that enables file operations and GitHub Issues management using natural language.

### Is it free?

Yes, PlainHub is free for individuals. Just visit [plainhub.dev](https://plainhub.dev) and sign in with GitHub. For organizations, Enterprise features are available on request, built to your requirements — see the [Enterprise page](https://plainhub.dev/enterprise).

### Where is my data stored?

Your files are stored in your own GitHub repository. PlainHub doesn't store them (what PlainHub does record is in the [privacy policy](https://plainhub.dev/privacy)). Even if you stop using PlainHub, your data stays on GitHub.

### Do I need a GitHub account?

Not to try it — you can try PlainHub without signing in at [app.plainhub.dev/?guest=1](https://app.plainhub.dev/?guest=1). To save files to your own GitHub repository, you need a GitHub account. A free GitHub account works fine.

### How is PlainHub different from github.dev?

github.dev is a full-featured code editor optimized for coding sessions. PlainHub is a notepad backed by GitHub, designed for everyday text editing. They serve different purposes.

### How is PlainHub different from other cloud editors?

With PlainHub, your data is stored in your own GitHub repository, so there's no vendor lock-in. Since it uses the standard Git format, you can migrate to other tools at any time.

---

## Sign-In & Authentication

### I can't sign in

- Your browser's popup blocker may be blocking the GitHub OAuth flow
- Make sure cookies and localStorage are enabled in your browser
- Try using an incognito/private window

### Where can I get a PAT (Personal Access Token)?

Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token. The `repo` scope is required.

### Where are tokens stored?

- **Web UI**: You sign in with a GitHub App. The short-lived access token is stored in the browser's localStorage; the long-lived token that renews it is stored in a cookie that scripts cannot read and that is sent only to PlainHub's sign-in endpoints
- **CLI / MCP Server**: Stored at `~/.config/plainhub/token` (permissions 0600)

---

## Editor

### I can't save a file

- Check that your GitHub authentication token is valid
- Verify that you have write access to the repository
- Check your network connection

### Can I edit large files?

Yes, PlainHub handles files with tens of thousands of lines smoothly. Powered by the CodeMirror engine, it can comfortably handle file sizes that other online editors struggle with.

### Visual mode (WYSIWYG) isn't rendering correctly

Some complex Markdown syntax may not render perfectly in Visual mode. We recommend switching to Code mode for editing and using Preview mode to verify the result.

### How do I paste images?

Use Ctrl+V (Mac: Cmd+V) to paste screenshots directly from your clipboard. Images are automatically uploaded to your GitHub repository, and a Markdown image link is inserted.

---

## Sync & Conflicts

### I see a "Conflict" message

This happens when the same file has been edited on another device or by another user. PlainHub will display a conflict resolution dialog where you can choose which changes to keep.

### I saved but the file hasn't updated

- Browser cache may be the cause. Try a hard reload with Ctrl+Shift+R
- There may be a GitHub API delay. Wait a few seconds and check again

---

## AI Panel

### What do I need to use the AI panel?

There are two ways:

- **Your own Anthropic API key** (BYOK: Bring Your Own Key) — enter your API key in the settings page.
- **Your own Claude Code on your PC** — no API key needed; it uses your Claude subscription. See [Your agent](YOUR_AGENT.md).

### Which models are available?

You can choose from three models: Claude Opus, Sonnet, and Haiku (default). Switch between them with a single click in the settings.

### Are there usage fees for the API?

If you use your own Anthropic API key, Anthropic API usage fees apply. If you connect your own Claude Code instead, no API key is needed — it uses your Claude subscription. PlainHub itself is free for individuals.

---

## CLI / MCP Server

### I can't install the CLI

Node.js 18 or later is required. Check your version with `node --version`.

### The MCP Server isn't recognized

1. Verify installation with `which plainhub-mcp`
2. Restart Claude Code / Cursor
3. Check the JSON syntax in your settings file

### `plainhub auth --from-gh` fails

Make sure gh CLI is installed and you're logged in. You can verify with `gh auth status`.
