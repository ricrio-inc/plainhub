> **[plainhub.dev](https://plainhub.dev)** — Try PlainHub now | [日本語](ja/FEATURES.md)

# PlainHub Features — AI-Powered GitHub Online Editor

**Frontend for GitHub.**

An AI-native online editor with GitHub as the backend. Anyone can easily edit GitHub files — no engineering background required.

---

## AI-Native Online Editor

PlainHub has AI built right into the editor. Through MCP/CLI integration, it can also be operated from Claude Code or Cursor.

```
"Make this paragraph more concise" → AI suggests edits → review diff → apply with one click
```

---

## Search Documents with Natural Language

Cross-repository search powered by AI enables natural language queries (Coming Soon).

```
"Which is the latest version that covers this topic?"
"Where was that security policy document?"
"Summarize the action items from last month's meeting notes"
```

---

## AI-Powered File Organization (Coming Soon)

Let AI organize your scattered documents.

```
"Organize these scattered documents into a logical directory structure"
→ AI analyzes file structure → proposes hierarchy → auto-renames and moves files after approval
```

---

## File Server-Style Document Upload (Coming Soon)

Upload documents (PDF, Word, Excel, etc.) directly to a GitHub repository via drag & drop or file picker. Use GitHub with the ease of a file server.

---

## Voice Commands — Control GitHub with Your Voice

The AI panel features push-to-talk voice input. Hold the mic button, speak, and release to automatically send your message to the AI.

**Phase 1 (Shipped)**: Push-to-talk + Web Speech API
- Hold mic button → speak → release to auto-send → AI executes
- Uses browser-native API (Web Speech API), zero additional cost
- Supported on Chrome/Edge/Safari
- Mobile (touch) support

**Phase 2 (Coming Soon)**: High-Accuracy Speech Recognition
- Whisper API (BYOK) support — precise recognition of technical terms

**Phase 3 (Coming Soon)**: Conversation Mode
- Continuous conversation mode (automatically listens for next voice input after AI responds)

```
Speak: "Summarize the meeting notes and create Issues for each TODO"

PlainHub executes:
  1. Voice → text transcription
  2. AI panel understands intent
  3. Creates meeting notes file
  4. Files GitHub Issues for TODOs
  5. Commits everything to Git
```

---

## Edit and Deploy from Anywhere — Save to Go Live

Saving in PlainHub = committing to GitHub. If you use a GitHub-connected hosting service like Vercel, Netlify, or Cloudflare Pages, **your changes are automatically deployed the moment you save**.

```
Open PlainHub on the go
  → Edit documents, update content
  → Ask AI: "Make this text more concise"
  → Save (Ctrl+S)
  → Commits to GitHub → auto-deploy → live on production

No PC, no IDE, no terminal needed. Just a browser.
```

---

## Idea Development — Brainstorm with AI as You Write

Go beyond just jotting down ideas — develop them through conversation with AI. In PlainHub, your notes and AI live on the same screen.

```
1. Write down an idea (e.g., new service plan, article outline, business plan)
2. Consult AI:
   "What are the weak points of this idea?"
   "Give me 3 ways to differentiate from competitors"
3. Incorporate AI suggestions and update your notes on the spot
4. Save → idea evolution is automatically recorded in Git history
```

How PlainHub differs from other tools:
- ChatGPT or Claude conversations → **conversations flow away. You need to copy results somewhere else**
- PlainHub → **your document IS the workspace. Edits stay right where they are**

---

## GitHub Issues Integration

View, create, comment on, and close Issues — all from the AI panel while editing documents. No need to open GitHub's Issues page. Create and manage GitHub issues directly through AI.

```
"Show me the issues in this repository"
"Create a bug report issue"
"What's in Issue #1?"
"Add a comment to Issue #1 that it's resolved"
"Close Issue #1"
```

---

## Data Ownership

The most important design principle of PlainHub. Your data belongs 100% to your GitHub repository.

### Principles

- **PlainHub stores zero data** — no proprietary servers or databases
- **Data lives on GitHub** — all files are saved in your GitHub repository
- **Your data survives PlainHub** — stored in standard Git format, easy to migrate to other services
- **100% client-side** — direct communication between your browser and GitHub only

### Comparison with Other Services

| Service | Where Data Lives | If Service Shuts Down |
|---------|-----------------|----------------------|
| Typical cloud services | Service provider's servers | Export required |
| **PlainHub** | **Your GitHub** | **Data remains intact** |

### Why This Matters

- No vendor lock-in
- Full data portability (standard Git format)
- Audit and compliance friendly (complete change history via Git)

---

## Enterprise

### Adoption Path

| Phase | Target | Details |
|-------|--------|---------|
| **Free** | Individuals & small teams | Use all current PlainHub features (public/private repos) |
| **Team** | Departments & projects | GitHub Organization integration, member management, shared repositories |
| **Enterprise** | Company-wide | SSO/SAML, MFA, audit logs, IP restrictions, custom domains, self-hosting, SLA |

### Enterprise Features

- **GitHub Enterprise Server / Cloud support** — connect to on-premise GitHub
- **SSO (SAML/OIDC)** — integrate with your existing identity provider
- **Audit logs** — track who accessed and edited which files, and when
- **IP restrictions / access control** — restrict access to corporate networks
- **Self-hosting** — run PlainHub on your own infrastructure
- **Custom branding** — company logo, custom domain

### Value Proposition

- **High data portability** — data stays in standard Git format on GitHub. Your data survives even if you stop using PlainHub
- **Leverage existing infrastructure** — companies already using GitHub Enterprise can adopt immediately
- **Minimal learning curve** — non-engineers just open a browser and start writing

---
