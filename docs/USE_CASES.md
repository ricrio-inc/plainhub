> **[plainhub.dev](https://plainhub.dev)** — Try PlainHub now | [日本語](ja/USE_CASES.md)

# PlainHub Use Cases — Document Management on GitHub

**Engineers and business teams, in the same place.**

A collection of use cases for teams that want document management and version control on GitHub. An AI-powered online editor with GitHub as the backend.

---

## When to Use PlainHub

| Situation | Challenge | With PlainHub |
|-----------|-----------|---------------|
| **Documents are getting scattered** | Can't tell which version is current, too many management tools | Centralize on GitHub. History is recorded automatically. Ask AI to "find it" |
| **You want to own your data** | Don't want to depend on a specific service | Stored in standard Git format. Data always lives on GitHub. Migrate anytime |
| **Need to edit on the go** | No PC, no IDE available | Edit and save with just a browser. Accessible from your phone |
| **Want to work alongside AI** | AI tools and documents are in separate apps | Built-in AI panel. Consult AI while editing |
| **Need to edit large files** | Other editors slow down at a few thousand lines | Smooth editing even for files with tens of thousands of lines |

---

## Document History & Restoration

A common pain point for teams: "I want to revert that file" or "Who changed it, and when?"

PlainHub automatically creates a Git commit every time you save, so the following works **with zero extra effort**:

- **Automatic change history** — every file change is recorded in Git. "When, who, and what changed" is always traceable
- **Restore to any point in time** — browse and restore past states from Git history
- **Visual diffs** — see before-and-after differences at a glance
- **No branches needed** — non-engineers just save to the main branch and version control is done

> Most cloud services offer some form of change history, but Git is a distributed version control system — robust and capable of maintaining history over the long term.

---

## Use Cases by Role

### Engineers

- Review and fix documentation in the browser during code reviews
- Analyze with Claude Code → create reports in PlainHub → commit to the same repo
- Use `plainhub diff` for visual change diffs
- Operate files with natural language from AI IDEs via MCP Server

### PMs / Business Planners

- Manage documents in the same GitHub repo as engineers
- Write meeting notes → ask AI: "Turn the TODOs into Issues"
- Brainstorm while writing proposals: "What are the weak points of this idea?"

### Non-Engineers

- No Markdown knowledge needed — edit in Visual mode (WYSIWYG), just like Word
- No need to learn complex GitHub operations — just talk to the AI panel
- Paste images from clipboard with Ctrl+V

### Teams

- Everyone shares documents in the same repository
- Git automatically records change history — "who changed what and when" is always clear
- Share deep links with settings baked into the URL — everyone sees the same view

---

## How PlainHub Differs from github.dev

github.dev is a full-featured editor — ideal for serious coding sessions.

PlainHub is **a notepad with GitHub as the backend** — open, edit, save. They serve different purposes.

---
