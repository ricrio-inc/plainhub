# Changelog

All notable changes to the PlainHub CLI and MCP server (the [`plainhub` package on npm](https://www.npmjs.com/package/plainhub)) are documented here. Each version has a [GitHub Release](https://github.com/ricrio-inc/plainhub/releases) with the tag `cli-v<version>`.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org).

---

## [1.8.4] — 2026-11-12

**The MCP server does not start a ledger in a repository of your whole home folder**

Includes every change since 1.8.2.

### Changed
- When no ledger folder is set and the MCP server starts in a Git repository that holds your whole home folder (such as dotfiles), it stops and says to start it in your project repository instead.
- A project repository inside your home folder works as before, including a worktree whose Git data is kept in your home folder.
- The npm package page says it works with Claude Code and other MCP clients.

→ [Full release notes](https://github.com/ricrio-inc/plainhub/releases/tag/cli-v1.8.4)

---

## [1.8.2] — 2026-11-09

**Safer tokens, and the MCP server works in the repository you start it in**

### Changed
- When no ledger folder is set, the MCP server uses the Git repository folder it was started in. It does not write to your home folder or outside a Git repository.
- The MCP tools now say which ones only read, which ones write to the ledger, and which ones reach outside your computer (a browser, GitHub or your Git remote).
- Messages from `plainhub agent` and the setup steps point to Ask AI, then Connect your own agent, in PlainHub.

### Security
- `plainhub auth` checks the pasted token with GitHub and does not save it when GitHub shows it can write to every repository. If it cannot tell, it saves the token with a note.
- `plainhub post --role owner` now needs `--as-owner`, and a person at a terminal types the role to confirm.

→ [Full release notes](https://github.com/ricrio-inc/plainhub/releases/tag/cli-v1.8.2)

---

## [1.8.0] — 2026-11-07

**Connect your own Claude Code, and a shared ledger for AI agents**

Includes every change since v1.4.0.

### Added
- `plainhub agent` connects the Claude Code on your PC to the PlainHub AI panel. It uses your own Claude plan, with no API key, and is read-only by default.
- Use it from your phone: with `plainhub agent --mailbox`, questions and answers go through a private repository you own, so nothing connects to your PC.
- Cockpit mode (`plainhub agent --cockpit`): choose Plan or Auto in the AI panel, and approve or decline what Claude Code asks, on your PC or your phone.
- In the AI panel you can paste images, send another message while an answer is still coming, and continue a conversation in Claude Code on your PC.
- `plainhub doctor` checks this PC before you connect your Claude Code, and shows how to fix what is missing. It changes nothing.
- A shared ledger for AI agents and people: `plainhub post`, `plainhub decide` and `plainhub ledger` keep threads and decision cards as Markdown files in your repository.
- The MCP server has the same ledger tools, and they return a link to open the new file in PlainHub.
- The package is listed in the official MCP Registry.

### Changed
- `plainhub auth` now helps you make a GitHub token for only the repositories you choose.
- The AI panel asks you to restart `plainhub agent` when a newer version is installed but the old one is still running.

### Fixed
- The phone mailbox keeps working when GitHub stops answering for a while or the PC clock jumps.

### Security
- The phone mailbox history shows only the names of the commands your agent ran, not what was in them.
- An approval in the phone mailbox counts only when you wrote it, not when someone else with access to the repository did.

→ [Full release notes](https://github.com/ricrio-inc/plainhub/releases/tag/cli-v1.8.0)

---

## PlainHub app (until 2026-05)

Until May 2026 this changelog followed the versions of the PlainHub app. These entries are kept as they were. The app is a hosted service and is not in this repository.

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

[1.8.4]: https://github.com/ricrio-inc/plainhub/releases/tag/cli-v1.8.4
[1.8.2]: https://github.com/ricrio-inc/plainhub/releases/tag/cli-v1.8.2
[1.8.0]: https://github.com/ricrio-inc/plainhub/releases/tag/cli-v1.8.0
[v1.4.0]: https://github.com/ricrio-inc/plainhub/releases/tag/v1.4.0
[v1.2.0]: https://github.com/ricrio-inc/plainhub/releases/tag/v1.2.0
[v1.1.0]: https://github.com/ricrio-inc/plainhub/releases/tag/v1.1.0
[v1.0.0]: https://github.com/ricrio-inc/plainhub/releases/tag/v1.0.0
