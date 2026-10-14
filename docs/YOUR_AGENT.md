# Use your own Claude Code in PlainHub (Your agent)

Ask questions about your notes and code in the PlainHub AI panel, and let **Claude Code on your own PC** answer. No API key needed — it uses your Claude subscription. By default, Claude Code only **reads** the folder you start it in; it can't change anything. If you want it to change files and run commands for you, use [Cockpit mode](#cockpit-mode) in a folder you trust.

Questions and files go from your browser to your PC and to Claude. They don't go through PlainHub servers.

## Two ways to connect

| Where you ask | What you enter in PlainHub | Start the agent with |
|---|---|---|
| PlainHub on the **same PC** (Chrome or Edge) | the 6-digit **pairing code** | `plainhub agent` |
| PlainHub on your **phone** | the **mailbox repository name** (`you/private-repo`) — not the pairing code | `plainhub agent --mailbox you/private-repo` |

The pairing code works only in a browser on the same PC. On a phone, it always ends with “No agent found” — use [From your phone](#from-your-phone) instead.

## What you need

1. A PC (Windows, macOS or Linux) with **Node.js 18** or later — check with `node -v`
2. **Claude Code**, installed and signed in — `claude` must work in a terminal
3. **Chrome or Edge** on that PC (Safari can't reach apps on your PC — see [Troubleshooting](#troubleshooting))
4. PlainHub at app.plainhub.dev — you can ask without signing in; sign in with GitHub to open the files in your repositories and to ask from your phone

From your phone, you also need a **private GitHub repository** that only you can write to (see [From your phone](#from-your-phone)).

## Install

Once, in a terminal:

```bash
npm i -g plainhub
```

## Start the agent

Go to the folder you want to ask about (for example, the clone of your notes repository), then start the agent:

```bash
cd ~/notes
plainhub agent
```

It shows the folder, and a 6-digit **pairing code**:

```text
PlainHub agent — Claude Code, read-only
  Folder:  /home/you/notes  (Claude Code can read files here only, and cannot change anything)
  Listening on http://127.0.0.1:47110  (this PC only)
  Sites:   https://app.plainhub.dev

  Pairing code: 123456
  In PlainHub: Settings → AI → "Connect your own agent", then enter the code.

Press Ctrl+C to stop.
```

Leave this terminal open. The agent answers only while it is running.

**Pick the folder with care.** Claude Code can read everything in it, and your questions can bring any of it into the answer. Don't start the agent in your home folder itself, or in a folder with secrets (`.env` files, keys). For safety, the agent also ignores programs installed inside that folder — so in your home folder it may not find `claude` (see [Troubleshooting](#claude-code-was-not-found)).

## Connect PlainHub

1. In PlainHub on the same PC, open “Settings” (⚙️) and, under “AI”, click “Connect your own agent”
2. Enter the pairing code and click “Connect”
3. If your browser asks to let the site access apps on your device or local network, choose **Allow**

If two agents are running (in two folders), PlainHub asks “Which folder?” — pick one, then click “Connect” again.

You only pair once per browser. When you start the agent again later, PlainHub connects to it without a new code.

## Ask

Open the AI panel and ask, for example: *What is still open in this folder?* or *Summarize the file I have open.*

- The answer comes from “Claude Code on this PC”. The file you have open in PlainHub is sent along with the question (for a long file, only the first part)
- While Claude Code works, the panel shows which file it is reading
- Deep questions that read many files can take 20 seconds or more

## From your phone

Your phone can't reach your PC directly. Instead, your PC checks a private GitHub repository (the **mailbox**) for questions every few seconds and writes the answers back.

1. On GitHub, make a **private** repository that only you can write to, with at least one file (for example a README). Use a new one just for this
2. Give the agent a GitHub token for that account, once: run `plainhub auth` and paste a token that can write to that repository. A fine-grained token for only that repository is safest. If you already use the gh CLI with that account, the agent can use its token instead (or import it with `plainhub auth --from-gh`)
3. On your PC, in your folder:

   ```bash
   plainhub agent --mailbox you/private-repo
   ```

4. On your phone, sign in to PlainHub with the same GitHub account. If you let PlainHub use only some of your repositories, let it use the mailbox repository too: tap “Add it on GitHub” in the steps of step 5 (or open the repository list and choose “＋ Add / Remove Repositories”), select the repository and save
5. On your phone, in PlainHub: “Settings” → “AI” → “Connect your own agent” → “From your phone (through a private GitHub repo)”, enter `you/private-repo`, and tap “Connect”

Questions (with the open file) and answers are saved in the `plainhub-chat` branch of that repository. Keep your PC on and awake while you ask from your phone.

## Cockpit mode

By default the agent only reads. If you want Claude Code to work in a folder — change files and run commands — start the agent in **Cockpit mode**. Use it only in a folder you trust.

```bash
cd ~/notes
plainhub agent --cockpit
```

The first line then says `PlainHub agent — Claude Code, Cockpit mode`. Connect PlainHub with the pairing code, as above.

In the AI panel, the button at the top shows the mode. Click it to switch; the new mode applies from your next question.

- **Plan** — Claude Code reads and proposes a plan. It changes nothing
- **Auto** — Claude Code's auto mode (`--permission-mode auto`). File changes and commands that Claude Code judges safe run **without asking**. Commands run on your PC, as you

The panel starts in **Plan** — on your PC and on your phone. If your own Claude Code settings (`~/.claude/settings.json`) set `permissions.defaultMode` to `"auto"`, it starts in **Auto** instead. The folder's own `.claude` settings can't change this.

When Claude Code decides to ask (including what your `ask` rules list), a card comes to the AI panel and shows exactly what it wants to do (the file and the change, or the command). Choose **Approve** or **Decline**. Your answer goes to Claude Code as it is. If you approve, it can also change files outside the folder.

- Your own Claude Code settings apply (`~/.claude`, hooks too). To block something for sure, add a `deny` rule there
- From the folder's own `.claude` settings, the agent uses only **deny** and **ask** rules. A folder can't give itself more permission

**Files can carry instructions.** Your question comes with the file you have open, and Claude Code reads other files in the folder. If one of them contains instructions, Claude Code may follow them (prompt injection). Don't ask in Auto while you have someone else's file, or a repository you don't know, open — that is also why the panel starts in Plan.

From your phone, add the mailbox (set it up as in [From your phone](#from-your-phone)):

```bash
plainhub agent --cockpit --mailbox you/private-repo
```

On your phone, too, the panel starts in **Plan**. Switch to **Auto** when you want it to make changes; the cards to approve come to your phone.

## Stop

- **Stop the agent:** press Ctrl+C in its terminal (or close the window). This also stops Claude Code if it is still answering
- **Stop using it in PlainHub:** “Settings” → “AI” → “Disconnect”. The AI panel goes back to how it was
- **Forget all paired browsers:** `plainhub agent --forget` (they need a new pairing code next time)

## What it can read

Without `--cockpit` (the default):

| Can | Can't |
|---|---|
| Read files in the folder you started it in (and its subfolders) | Read files outside that folder |
| Search those files | Edit, create or delete files |
| See the file you have open in PlainHub | Run commands, or use your MCP servers and Claude Code settings |

In [Cockpit mode](#cockpit-mode), it can do more: in Auto, it changes files and runs commands that Claude Code judges safe without asking, and asks you in the panel about the rest. Your `deny` rules in `~/.claude` still block.

- Only browsers paired with the code, on PlainHub's own sites, can ask. Someone else's website can't
- The agent listens on 127.0.0.1 only (ports 47110–47114) — other devices on your network can't reach it
- With `--mailbox`, the agent only uses a private repository that only you can write to, and answers only questions written by you

## Troubleshooting

### Safari, iPhone or iPad

> Safari and iPhone/iPad browsers can't reach apps on your PC.

Open PlainHub in Chrome or Edge on your PC. On a phone, use [From your phone](#from-your-phone).

### The agent isn't running

> No agent found on this PC. Run `plainhub agent` in your folder first.

> Your agent isn’t running. Start it with `plainhub agent` in your folder, then ask again.

**On your phone?** The pairing code works only in a browser on the same PC. Use [From your phone](#from-your-phone) and enter the mailbox repository name instead.

Start `plainhub agent` in your folder again (the terminal may have been closed, or the PC restarted). If Chrome or Edge asked about access to apps on your device and you chose Block, allow it in the site settings (the icon left of the address) and try again.

### Chrome or Edge asks about your local network

Chrome and Edge may ask whether app.plainhub.dev can access apps on your device or local network. Choose **Allow** — that's how the page reaches the agent on your own PC (127.0.0.1). Nothing else on your network is used.

### Wrong code

> Wrong code. The code changes each time you connect — enter the newest code in the agent's terminal (the last “Next pairing code”, if there is one).

The code works once. After a browser connects, the terminal shows a `Next pairing code` — use that one next time.

> Too many wrong codes, so your agent stopped pairing. Restart it (Ctrl+C in its terminal, then run plainhub agent again) and enter the new code it shows.

After 5 wrong codes the agent stops pairing. Press Ctrl+C, start it again, and enter the new code.

### Claude Code was not found

The AI panel says:

> Claude Code (claude) was not found on this PC. Install it, then start plainhub agent again.

- Check that `claude` runs in the same terminal
- Did you start the agent in your home folder itself? For safety, the agent ignores programs inside the folder it reads, and `claude` is often installed under your home folder. Stop it (Ctrl+C), `cd` into the folder you want to ask about, and start it again

### Windows

Run `plainhub agent` in PowerShell or Command Prompt, where `claude` works. PowerShell opens in your home folder, so `cd` into your folder first (see [Claude Code was not found](#claude-code-was-not-found)). When you press Ctrl+C or close the window, Claude Code stops too.

### Claude Code is too old

> This version of Claude Code cannot run in read-only mode. Update Claude Code (claude update), then start plainhub agent again.

### All ports are in use

> All agent ports are in use

Another `plainhub agent` is probably running. Stop it (Ctrl+C) and try again.

### From your phone: the PC doesn't answer

> Your home PC isn't answering

Check that `plainhub agent --mailbox …` is still running on your PC, and that the PC is not asleep.

### From your phone: the repository is refused

> <repo> is public. Questions, answers and the files your agent reads would be public. Use a private repository.

> Other people can write to <repo>

> <repo> is empty. Add any file (for example a README) on GitHub first.

Use a new private repository under your own account, with at least one file, that nobody else can write to.

### From your phone: the repository isn't found

> <repo> was not found, or PlainHub can't access it.

Check the name (owner/name). If you let PlainHub use only some of your repositories, add the mailbox repository: tap “Add it on GitHub” under the message (or open the repository list and choose “＋ Add / Remove Repositories”), select it and save, then tap “Connect” again.

If GitHub says *This app has changed since you last viewed it* and doesn't let you save, review and accept the new permissions on that page first, then add the repository.
