# Changelog

All notable changes to PlainHub are documented here. For full release notes (with detailed descriptions and screenshots), see the [GitHub Releases](https://github.com/ricrio-inc/plainhub/releases) page.

This project follows [Semantic Versioning](https://semver.org).

---

## [v1.4.0] — 2026-05-01

**Talk to Your Whole Repository**

### AI
- AI now reads your entire repository (files, content, commit history) to answer questions
- New AI panel actions: `list_files`, `read_file`, `list_commits`
- Brainstorm-then-keep workflow: AI-assisted ideation that lives in Git as Markdown

### Voice
- Voice in, voice out — push-to-talk + AI response read-aloud (TTS)
- TTS playback speed: 1x to 5x for "listen-while-doing"

### UX
- Stick-to-bottom auto-scroll for streaming AI responses (yields to user when scrolled up)

→ [Full release notes](https://github.com/ricrio-inc/plainhub/releases/tag/v1.4.0)

---

## [v1.2.0] — 2026-03-17

**Security, i18n & CLI**

### Security
- Critical XSS fix in Markdown rendering (DOMPurify sanitization)
- Critical XSS fix in commit message display (innerHTML → textContent)
- Command injection fix in browser launcher (`exec` → `spawn`)
- OAuth state timestamp with 10-minute expiry (replay attack prevention)
- SRI integrity hashes added to CDN scripts

### CLI & MCP
- New `plainhub_browse` MCP tool for repository browsing
- New `browse` CLI command — open repo with sidebar
- New `-b` branch flag, `-n` URL-only flag, `--version` flag

### Editor
- "Open in new tab" context menu for files and directories
- Font size slider in Settings panel
- Markdown preview state persists across file switches
- Context menu grouping aligned with VS Code / Google Drive

### i18n
- 33+ UI strings translated to English

→ [Full release notes](https://github.com/ricrio-inc/plainhub/releases/tag/v1.2.0)

---

## [v1.1.0] — 2026-03-17

### Editor
- Alt+Z keyboard shortcut for Line Wrap toggle (VS Code standard)
- OAuth `prompt=select_account` for multi-account switching

### Maintenance
- Remove 244 debug `console.log` statements
- Semver version alignment

→ [Full release notes](https://github.com/ricrio-inc/plainhub/releases/tag/v1.1.0)

---

## [v1.0.0] — 2026-03-17

**Initial Release** — GitHub-native notepad. AI-ready.

### AI Integration (MCP & CLI)
- MCP Server for AI IDE integration (Claude Code, Cursor, etc.)
- CLI `plainhub` — open and edit files from terminal
- Tools: `plainhub_open`, `plainhub_auth`, `plainhub_auth_status`
- URL deep linking for AI ↔ editor handoff

### Editor
- CodeMirror 6 with syntax highlighting
- Markdown preview with image rendering
- Image paste (Ctrl+V → auto upload to GitHub)
- PDF / binary file preview
- Line numbers, word wrap, auto-indent
- Git history viewer with conflict resolution (VS Code-style diff)

### GitHub Integration
- OAuth authentication (private/public repos)
- Full file CRUD (create, rename, duplicate, delete)
- Sidebar file browser, repository selector, auto-save, pull to sync

### Search
- File name search with subdirectory support
- Content search with real-time results

### Mobile & PWA
- Responsive design with toolbar overflow menu
- Installable as an app (offline capable)

→ [Full release notes](https://github.com/ricrio-inc/plainhub/releases/tag/v1.0.0)

---

[v1.4.0]: https://github.com/ricrio-inc/plainhub/releases/tag/v1.4.0
[v1.2.0]: https://github.com/ricrio-inc/plainhub/releases/tag/v1.2.0
[v1.1.0]: https://github.com/ricrio-inc/plainhub/releases/tag/v1.1.0
[v1.0.0]: https://github.com/ricrio-inc/plainhub/releases/tag/v1.0.0
