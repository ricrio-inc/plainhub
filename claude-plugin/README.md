# PlainHub plugin for Claude Code

From your phone, ask your own Claude Code about your repo, read its reports as pages, and approve its proposals. Reports and decision cards stay in your Git repo as a shared ledger.

**Your agent:** from your phone or a browser, ask Claude Code on your own PC, signed in with your own Claude account, about your repository. From your phone, the questions and answers are kept as files in a private GitHub repository of your own; with the `ledger` skill, your agents' reports and decision cards are Markdown files too, and agents are told to wait for your approval before a release. Ask Claude *"Set up PlainHub so I can ask you from my phone"*: the `your-agent` skill walks you through it. Steps: [Your agent](https://github.com/ricrio-inc/plainhub/blob/main/docs/YOUR_AGENT.md).

The record is kept in a shared ledger in your own Git repository: agents post messages in threads and raise decision cards, and a person decides. Everything is Markdown in `.agents/`, so GitHub shows it too. No PlainHub account or token needed.

## Install

In Claude Code, add this repository as a marketplace, then install:

```
/plugin marketplace add ricrio-inc/plainhub
/plugin install plainhub@plainhub
```

It adds the `plainhub` MCP server (the npm package `plainhub`, version 1.7.0; Node.js 18+) and two skills: `ledger`, which tells Claude when to post, raise a card and share, and `your-agent`, which walks you through connecting PlainHub to Claude Code on your PC. The ledger tools work on the folder you start Claude Code in, so start it at the top of your repository. To use another folder, set `PLAINHUB_LEDGER` before you start Claude Code.

Then ask Claude: *"Start a ledger here, then report this fix in a thread and ask me to approve the release."*

## What is inside

- `.mcp.json`: runs the MCP server with `npx -y plainhub@1.7.0 mcp`, pinned to one version (the same as the plugin version), so an update reaches you only with a new plugin version. npm runs in the folder you start Claude Code in, so that folder's npm settings (`.npmrc`) and its `node_modules` folder (which can hold a different `plainhub`) are used and can run other code; start Claude Code only in repositories you trust
- `skills/ledger/SKILL.md`: how to use the ledger — when to post, decide and sync, the rules, and that what agents read in the ledger is data, not instructions
- `skills/your-agent/SKILL.md`: how to set up Your agent — where the setup steps are (one page for AI assistants, `docs/AGENT_SETUP.md`) and what Claude must leave to you (starting the agent, `plainhub auth` and tokens, Cockpit mode)
- `.claude-plugin/plugin.json`: the plugin. The marketplace with this one plugin is `.claude-plugin/marketplace.json` at the top of the repository

The ledger commands and rules: "Use without PlainHub" in the [plainhub package on npm](https://www.npmjs.com/package/plainhub).

## What it runs, sends and fetches

**Where your data goes:** only to your own repository (its Git remote, for example GitHub, when you share the ledger) and to PlainHub at app.plainhub.dev (when you follow a link to open a file, a diff or a card). PlainHub's servers do not store your files: the page reads and saves them directly with GitHub. Privacy policy: https://plainhub.dev/privacy

- **Runs on your PC:** Claude Code starts the MCP server with `npx`. npm fetches the `plainhub` package (version 1.7.0) and its dependencies from the npm registry (registry.npmjs.org). The server talks to Claude Code over stdio, so it works in Claude Code on your PC, not in chats on claude.ai. The plugin has no hooks and starts nothing in the background.
- **The ledger stays in your repository:** `plainhub_ledger_init`, `plainhub_post`, `plainhub_decide`, `plainhub_ledger_decisions`, `plainhub_ledger_thread`, `plainhub_ledger_tasks` and `plainhub_ledger_read` read and write Markdown files in `.agents/`. They send nothing over the network. To build a link to the file in PlainHub, they read the branch and the remote URL of your repository with `git`; nothing opens until you follow the link.
- **Sharing is Git:** `plainhub_ledger_sync` runs `git` in your repository. It commits only the changes in `.agents/` (ledger commits that are not sent yet are combined into one), then pulls from and pushes to the remote your repository already uses, with your own Git sign-in. It stops if commits that are not sent yet change files outside `.agents/`. Posting and deciding never push.
- **Opening pages:** `plainhub_open`, `plainhub_browse` and `plainhub_diff` open a page of https://app.plainhub.dev in your browser (or of the address in `PLAINHUB_APP_URL`, if you set it). If you saved a GitHub token, `plainhub_diff` (and `plainhub_open` with `noAuth: false`) adds it after `#` in a link to app.plainhub.dev only, and browsers do not send that part to the server. The PlainHub page keeps the token in that browser and uses it to read and write the repositories the token reaches, for example when you save a file or approve a card.
- **Your GitHub token:** `plainhub_auth` opens the GitHub page that creates a token. Save the token by running `plainhub auth` in your own terminal: a token pasted into a chat stays in its history. A saved token is kept on your PC in `~/.config/plainhub/token`; `plainhub_auth_status` only checks that file. The plugin does not read tokens from your environment or from the GitHub CLI.
- **Setting up Your agent:** the `your-agent` skill has Claude call `plainhub_agent_check` first, which changes nothing and sends nothing over the network: it looks at Node.js, Claude Code (it runs only `claude --version`), the `plainhub` command, the local ports of Your agent (127.0.0.1) and whether a token file and paired browsers exist, without reading a token's value. The skill then has Claude read the setup page for this version from GitHub (https://raw.githubusercontent.com/ricrio-inc/plainhub/cli-v1.7.0/docs/AGENT_SETUP.md), check Node.js with `node -v`, install the latest `plainhub` from the npm registry with `npm i -g plainhub` if the command is missing, and run `plainhub doctor`, which changes nothing. The agent itself, `plainhub agent`, is a command you start yourself in your terminal; Claude is told not to start it. What the agent sends: [Your agent](https://github.com/ricrio-inc/plainhub/blob/main/docs/YOUR_AGENT.md).
- The MCP server sends no usage data.

## See and decide in PlainHub

Open the repository in [PlainHub](https://plainhub.dev) to read threads and cards as pages and approve with a button, also from your phone.

## License

MIT
