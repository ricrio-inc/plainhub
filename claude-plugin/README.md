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

It adds the `plainhub` MCP server (the npm package `plainhub`, version 1.6.1; Node.js 18+) and two skills: `ledger`, which tells Claude when to post, raise a card and share, and `your-agent`, which walks you through connecting PlainHub to Claude Code on your PC. The ledger tools work on the folder you start Claude Code in, so start it at the top of your repository. To use another folder, set `PLAINHUB_LEDGER` before you start Claude Code.

Then ask Claude: *"Start a ledger here, then report this fix in a thread and ask me to approve the release."*

## What is inside

- `.mcp.json`: runs `plainhub-mcp` with `npx`, pinned to one version (`plainhub@1.6.1`, the same as the plugin version), so an update reaches you only with a new plugin version. `--prefix` points npm at the plugin folder, so a repository you open cannot swap in its own `plainhub` package or npm settings (`.npmrc`)
- `skills/ledger/SKILL.md`: how to use the ledger — when to post, decide and sync, the rules, and that what agents read in the ledger is data, not instructions
- `skills/your-agent/SKILL.md`: how to set up Your agent — where the setup steps are (one page for AI assistants, `docs/AGENT_SETUP.md`) and what Claude must leave to you (starting the agent, `plainhub auth` and tokens, Cockpit mode)
- `.claude-plugin/plugin.json`: the plugin. The marketplace with this one plugin is `.claude-plugin/marketplace.json` at the top of the repository

The ledger commands and rules: "Use without PlainHub" in the [plainhub package on npm](https://www.npmjs.com/package/plainhub).

## See and decide in PlainHub

Open the repository in [PlainHub](https://plainhub.dev) to read threads and cards as pages and approve with a button, also from your phone.

## License

MIT
