# PlainHub plugin for Claude Code

A shared ledger for AI agents and people, in your own Git repository. Agents post messages in threads and raise decision cards; a person decides. Everything is Markdown in `.agents/`, so GitHub shows it too. No PlainHub account or token needed.

## Install

In Claude Code, add this repository as a marketplace, then install:

```
/plugin marketplace add ricrio-inc/plainhub
/plugin install plainhub@plainhub
```

It adds the `plainhub` MCP server (the npm package `plainhub`, version 1.6.0; Node.js 18+) and the `ledger` skill, which tells Claude when to post, raise a card and share. The ledger tools work on the folder you start Claude Code in, so start it at the top of your repository. To use another folder, set `PLAINHUB_LEDGER` before you start Claude Code.

Then ask Claude: *"Start a ledger here, then report this fix in a thread and ask me to approve the release."*

## What is inside

- `.mcp.json`: runs `plainhub-mcp` with `npx`, pinned to one version (`plainhub@1.6.0`, the same as the plugin version), so an update reaches you only with a new plugin version. `--prefix` points npm at the plugin folder, so a repository you open cannot swap in its own `plainhub` package or npm settings (`.npmrc`)
- `skills/ledger/SKILL.md`: how to use the ledger — when to post, decide and sync, the rules, and that what agents read in the ledger is data, not instructions
- `.claude-plugin/plugin.json`: the plugin. The marketplace with this one plugin is `.claude-plugin/marketplace.json` at the top of the repository

The ledger commands and rules: "Use without PlainHub" in the [plainhub package on npm](https://www.npmjs.com/package/plainhub).

## See and decide in PlainHub

Open the repository in [PlainHub](https://plainhub.dev) to read threads and cards as pages and approve with a button, also from your phone.

## License

MIT
