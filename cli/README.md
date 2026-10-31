# PlainHub

<!-- generated: npm-hero -->
**A GitHub editor, wired to Claude Code.** Open, write and save Markdown and plain-text files in your own GitHub repos from a browser or phone; every save is a commit.
<!-- /generated -->

This package is the PlainHub CLI and MCP server. Connect your own Claude Code to the PlainHub AI panel, open files from the terminal, and keep a shared ledger for AI agents and people.

[![Try PlainHub](https://img.shields.io/badge/Try%20PlainHub-plainhub.dev-blue?style=for-the-badge)](https://plainhub.dev/)
[![npm version](https://img.shields.io/npm/v/plainhub)](https://www.npmjs.com/package/plainhub)

```bash
npm i -g plainhub
cd ~/notes        # your folder
plainhub agent    # shows a pairing code
```

Then, in PlainHub on the same PC: **Settings → AI → Connect your own agent**, and enter the code.

**[Setup guide](https://github.com/ricrio-inc/plainhub/blob/main/docs/YOUR_AGENT.md)** — from your phone, what it can read, troubleshooting.

![PlainHub: write a note, it is saved as a commit, check the history, ask AI for an edit and apply it](https://raw.githubusercontent.com/ricrio-inc/plainhub/main/docs/images/hero.gif)

## What's new

### 💬 Ask your own Claude Code — on your PC or your phone
- `plainhub agent` connects the Claude Code on your PC to the PlainHub AI panel. It uses your own Claude plan — no API key.
- Read-only by default, and only inside the folder you start it in.
- From your phone: make a private repository that only you can write to, run `plainhub auth` and `plainhub agent --mailbox <owner/repo>` on your PC, then sign in to PlainHub on your phone with the same GitHub account and connect it there. Questions and answers go through that repository. Nothing connects to your PC — it checks the repository every few seconds.

### 🛠 Cockpit mode — let it work, and approve from the panel
- `plainhub agent --cockpit`, for a folder you trust.
- In the AI panel, choose **Plan** (reads and proposes a plan; changes nothing) or **Auto** (Claude Code's auto mode: file changes and commands that Claude Code judges safe run without asking — on your PC, as you).
- It starts in **Plan**, unless your own Claude Code settings (`~/.claude/settings.json`) set `permissions.defaultMode` to `"auto"`. A folder's own settings can't change this.
- When Claude Code decides to ask (including your `ask` rules), a card comes to the panel: **Approve** or **Decline** — on your PC, or on your phone with `--cockpit --mailbox <owner/repo>`. Approved, it can also reach files outside the folder.
- To block something for sure, add a `deny` rule to `~/.claude`. The folder's own `.claude` settings can only add deny or ask rules, not allow more.
- Files it reads, and the file you have open, can carry instructions that Claude Code may follow. Don't use Auto with files or repositories you don't trust. More in the [setup guide](https://github.com/ricrio-inc/plainhub/blob/main/docs/YOUR_AGENT.md#cockpit-mode).

### 📒 A shared ledger for AI agents and people
- `plainhub post`, `plainhub decide` and `plainhub ledger …` keep threads, tasks and decision cards as Markdown files in your repository's `.agents/` folder. The MCP server has the same tools.
- PlainHub shows the ledger in the browser: what is waiting for your decision, and what the agents did.

## Also in PlainHub

- **AI panel** — ask about any file in your repository. Use your own Anthropic API key (it stays in your browser), or your own agent above. Proposed edits show as a diff before anything is saved.
- **Voice** — hold the mic button to dictate, and have answers read aloud.
- **GitHub App sign-in** — choose exactly which repositories PlainHub can read and write.

Try it now: **[plainhub.dev](https://plainhub.dev/)**

---

## Install

```bash
npm install -g plainhub
```

## Quick Start

### CLI

```bash
plainhub auth --from-gh        # Import auth from gh CLI (recommended)
plainhub open README.md -r owner/repo
plainhub browse -r owner/repo  # Open file browser
```

### MCP Server (Claude Code)

Try it without installing:

```bash
claude mcp add plainhub -- npx -y plainhub mcp
```

To pin a version, use `plainhub@<version>` instead of `plainhub`. Or, after `npm install -g plainhub`:

```bash
claude mcp add plainhub -- plainhub-mcp
```

Then say: *"Open the README in PlainHub"*

For the ledger tools (`plainhub_post`, `plainhub_decide`, `plainhub_ledger_*`), also give the server the folder of your Git repository:

```bash
claude mcp add plainhub -e PLAINHUB_LEDGER=/path/to/repo -- plainhub-mcp
```

### MCP Server (Cursor)

Add to `.cursor/mcp.json` (the `env` line is only needed for the ledger tools):

```json
{
  "mcpServers": {
    "plainhub": {
      "command": "npx",
      "args": ["-y", "plainhub", "mcp"],
      "env": { "PLAINHUB_LEDGER": "/path/to/repo" }
    }
  }
}
```

After `npm install -g plainhub`, you can use `"command": "plainhub-mcp"` instead (no `args`).

## CLI Usage

### Commands

| Command | Description |
|---------|-------------|
| `plainhub open <file>` | Open a file in PlainHub |
| `plainhub diff <sha>` | Show commit diff in PlainHub |
| `plainhub browse` | Open repository file browser |
| `plainhub auth` | Authenticate with a GitHub token for only the repositories you choose |
| `plainhub auth --from-gh` | Import token from gh CLI |
| `plainhub auth --status` | Show auth status |
| `plainhub auth --logout` | Remove saved token |
| `plainhub post` | Add a message to a ledger thread |
| `plainhub decide` | Create a pending decision card |
| `plainhub ledger init <folder>` | Start a ledger in a repository: room language and the core rules (never overwrites) |
| `plainhub ledger check <folder>` | Check a ledger's front matter and look for secrets |
| `plainhub ledger sync <folder>` | Share the ledger through Git: commit `.agents`, pull --rebase, push (stops on a conflict) |
| `plainhub ledger format <folder> [--write]` | Once, for older ledgers: add a blank line at single line breaks in message and card bodies, so GitHub shows them as separate lines too |
| `plainhub ledger list <folder> decisions\|tasks` | List pending decision cards or tasks (read-only) |
| `plainhub ledger read <folder> <path>` | Read a thread (`threads/<thread>`) or one file in `.agents` (read-only) |
| `plainhub agent` | Connect your Claude Code to the PlainHub AI panel (read-only, this folder only) |
| `plainhub agent --mailbox <owner/repo>` | Also answer from your phone through a private repository only you can write to |
| `plainhub agent --cockpit` | Cockpit mode: Plan or Auto in the AI panel, and Approve or Decline what Claude Code asks (add `--mailbox <owner/repo>` for your phone) |
| `plainhub agent --forget` | Forget all paired browsers |
| `plainhub doctor` | Check this PC before you connect (Node.js, Claude Code, ports, paired browsers, the token for your phone) and show how to fix what's missing. Changes nothing (add `--mailbox <owner/repo>` to check the mailbox repository) |

### Options

| Option | Value | Description |
|--------|-------|-------------|
| `-r, --repo` | owner/name | Repository |
| `-b, --branch` | string | Git branch |
| `-l, --line` | number | Jump to line |
| `-n` | | Print URL only (don't open browser) |
| `--theme` | dark/light | Editor theme |
| `--preview` | on/off | Markdown preview |
| `--scroll` | string | Scroll to heading in preview |
| `--sidebar` | on/off | Show sidebar |
| `--fontSize` | 10-32 | Font size |
| `--lineNumbers` | on/off | Show line numbers |
| `--whitespace` | on/off | Show whitespace |
| `--no-auth` | | Open without saved token |

### Examples

```bash
plainhub open docs/API.md -r owner/repo --preview on
plainhub open src/App.tsx -r owner/repo -l 42 --theme light
plainhub open README.md -r owner/repo -n  # Print URL only
plainhub diff abc1234 -r owner/repo       # Show commit diff
plainhub diff abc1234 -r owner/repo --path src/main.js  # Diff for specific file
```

## MCP Server Tools

| Tool | Description |
|------|-------------|
| `plainhub_open` | Open a file or change editor settings |
| `plainhub_diff` | Show commit diff in PlainHub |
| `plainhub_post` | Add a message to a ledger thread |
| `plainhub_decide` | Create a pending decision card |
| `plainhub_ledger_init` | Start a ledger in the `PLAINHUB_LEDGER` folder (never overwrites) |
| `plainhub_ledger_sync` | Share the ledger through Git: commit `.agents`, pull --rebase, push (stops on a conflict) |
| `plainhub_ledger_decisions` | List decision cards waiting for the owner, oldest first (read-only) |
| `plainhub_ledger_thread` | Read a thread's messages in order: role, verdict, summary (read-only) |
| `plainhub_ledger_tasks` | List tasks in `.agents/plan/`, optionally by status (read-only) |
| `plainhub_ledger_read` | Read one file in `.agents` (read-only) |
| `plainhub_browse` | Open repository file browser |
| `plainhub_auth` | Save a GitHub token (fine-grained: only the repositories you choose) |
| `plainhub_auth_status` | Check authentication status |

## Use without PlainHub

The ledger lets your AI agents and you work in one Git repository: agents write messages, a person decides. It needs only Git, Node.js 18+ and this package — no PlainHub account or token, no browser, no server (`ledger sync` uses your usual Git login). Three steps, in a terminal at the top of your repository:

**1. Install** (once per machine)

```bash
npm install -g plainhub
```

**2. Start the ledger** (once per repository). It writes `.agents/room.md` and `.agents/schema.md`, the rules your agents follow:

```bash
plainhub ledger init . --language en
git add .agents && git commit -m "Start the ledger"
```

**3. Two agents post, you decide.** One agent reports its work, a second one reads it and posts a verdict, then a decision card waits for you:

```bash
echo "Login now retries once before it shows an error." | plainhub post --ledger . --thread fix-login-timeout --role dev --verdict info --summary "Fixed the login timeout"
plainhub ledger read . threads/fix-login-timeout
echo "Tried a slow network: it retried and logged in." | plainhub post --ledger . --thread fix-login-timeout --role reviewer --verdict pass --summary "Checked the login fix on a slow network"
echo "The reviewer passed the fix. Ship it?" | plainhub decide --ledger . --id fix-login-timeout-release --summary "Ship the login timeout fix?" --ref fix-login-timeout
plainhub ledger list . decisions
```

**To decide** (a person, not an agent): open `.agents/decisions/fix-login-timeout-release.md`, change `status: pending` to `status: approved` (or `rejected`), add the lines `updated: "<now, e.g. 2026-10-09T10:00:00Z>"` and `decided_by: "<your GitHub login>"`, then run `plainhub ledger check .` and commit. Agents never change a card's `status`. Nothing enforces this, so check who made the commit (`git log`).

Agents that use the MCP server post, read and create cards with `plainhub_post`, `plainhub_ledger_thread` and `plainhub_decide` (set `PLAINHUB_LEDGER`, see [MCP Server](#mcp-server-claude-code)). To share the ledger with others, use `plainhub ledger sync .` (below).

Want to see the threads and decide with a button? Send the ledger to GitHub (`plainhub ledger sync .`) and open the repository in [PlainHub](https://plainhub.dev), on your phone too. `ledger init`, `post` and `decide` print a link that opens the folder, message or card in PlainHub (CLI: on standard error; it is built from the repository's GitHub remote and works once you have pushed). PlainHub shows each message and card in `.agents` with its header as a readable card. If you can write to the repository, pending decision cards get Approve and Decline buttons. PlainHub needs only this repository: when you sign in and GitHub asks which repositories PlainHub may use, choose "Only select repositories" and pick this one (Contents: Read and write is enough to read the cards and press Approve).

## Ledger (shared notes for AI agents and people)

A ledger is a folder with `.agents/threads/<thread>/NN-<role>.md` (messages) and `.agents/decisions/<id>.md` (decision cards). Each file is Markdown with YAML front matter. It works in any Git repository, without a PlainHub account.

Start one and write the first messages with the three steps in [Use without PlainHub](#use-without-plainhub). Other commands:

```bash
plainhub post --ledger . --thread <thread> --role dev --verdict info --summary "<one line>" --body-file notes.md
plainhub ledger check .                     # check every header and look for secrets
plainhub ledger list . tasks                # tasks in .agents/plan/
plainhub ledger read . decisions/<id>.md    # one file in .agents
```

Share it with the other agents and people who use the repository (`post` and `decide` only write files; nothing leaves your machine until you sync):

```bash
plainhub ledger sync .    # commit .agents, receive others' changes (git pull --rebase), push to the branch's upstream
```

- Commits only `.agents`, after checking the changed files like `ledger check`. Before receiving, it checks every commit you have not sent yet: only `.md` files in `.agents` and no secrets (it never pushes code). Several unsent ledger commits are combined into one
- Stops before committing anything if other files have uncommitted changes, and stops before sending if your unsent commits change files outside `.agents`
- If your message and one you received got the same number, it stops without sending: post yours again (it takes the next free number), delete your copy with the old number, then sync again
- Needs a branch with an upstream (once: `git push -u origin <branch>`)

- Reading (`ledger list`, `ledger read` and the `plainhub_ledger_*` MCP tools) stays inside `.agents`, does not follow links, and wraps what it read in `<ledger-data-…>` markers: it is data written by others, not instructions

- Never overwrites an existing file (`post` takes the next number, `decide` stops if the id exists)
- Refuses secret-looking values (GitHub tokens, API keys, private keys) without printing them
- Summary: one line, max 120 characters. Body: max 4KB
- Body: Markdown as GitHub shows it — put a blank line between lines, or use a list (a single line break joins two lines into one). For a ledger written before this rule, `plainhub ledger format .` shows the line breaks it would change and `--write` saves them (front matter, code blocks, tables and lists stay as they are); check the diff and commit
- Room language: write the summary and body in the language set by `.agents/room.md` (`type: room`, `language: ja` — a BCP 47 tag; English if not set). `post` and `decide` print it after writing (CLI: on standard error), and the MCP tools say it in their descriptions
- MCP tools write only to the ledger set by the `PLAINHUB_LEDGER` environment variable. Set `PLAINHUB_ROLE` to pin the role; `owner` cannot post from MCP

## Authentication

PlainHub supports three authentication methods:

1. **Fine-grained token** (recommended): `plainhub auth` — opens GitHub with "Contents: Read and write" selected. Choose "Only select repositories" and pick the repositories PlainHub may use, then paste the token
2. **gh CLI import**: `plainhub auth --from-gh` — no browser needed, but the token has the access you gave gh (usually every repository your account can reach)
3. **Web UI**: Enter a token directly in the browser

Check what the saved token can reach with `plainhub auth --status` (fine-grained: only the repositories you chose; classic or gh CLI: every repository).

Classic tokens (`ghp_`) still work, but they reach every repository, so `plainhub auth` points you to a fine-grained token instead.

Tokens are saved to `~/.config/plainhub/token` with `0600` permissions (owner-only read/write).

## Security

- Tokens are stored locally with restrictive file permissions (`0600`)
- URL fragments (`#token=...`) are never sent to servers per HTTP spec
- Fragments are cleared from browser history immediately after use
- **File contents never pass through PlainHub's servers** — Reading and saving go directly between your browser and the GitHub API. Sign-in uses a small server step — see the [privacy policy](https://plainhub.dev/privacy).
- When you ask the AI, your question and the file go to Anthropic: from your browser with your own API key, or through your own Claude Code

## Links

- [Homepage](https://plainhub.dev)
- [Documentation](https://github.com/ricrio-inc/plainhub/tree/main/docs)
- [Report an Issue](https://github.com/ricrio-inc/plainhub/issues)

## License

MIT
