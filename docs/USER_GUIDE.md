# PlainHub User Guide

An online notepad backed by GitHub. Open, edit, save — your text files stay in your repository.

## Getting Started

### 1. Sign In

1. Visit [plainhub.dev](https://plainhub.dev)
2. Click **Sign in with GitHub**
3. Authorize PlainHub on the GitHub consent screen

You can also use a **Personal Access Token (PAT)** instead of OAuth:
- Click "Use a token instead"
- Paste your token (`ghp_...` or `github_pat_...`)
- Check "Remember on this device" to stay signed in

### 2. Select a Repository

After signing in, click the repository name in the sidebar header to open the repository selector.

- **Search**: Type to filter your repositories
- **Create new**: Click "＋ Create new repository" at the top
  - Enter a name and choose Private/Public
- **Switch**: Click any repository to switch to it

### 3. Create a File

- Click the **＋** button in the sidebar header
- Enter a file name (e.g., `notes.md`, `memo.txt`)
- The file is created and opened automatically

You can also right-click a folder and select **New File**.

### 4. Edit and Save

- Edit your file in the editor
- **Auto-save**: Changes are saved automatically when you leave the editor
- **Manual save**: Press `Ctrl+S` for immediate save
- Every save creates a Git commit in your repository

---

## Editor Features

### Toolbar Buttons

| Button | Function |
|--------|----------|
| ↶ / ↷ | Undo / Redo |
| ¶ | Toggle whitespace characters |
| 🔢 | Toggle line numbers |
| ⇥ | Toggle auto-indent |
| ↩ | Toggle line wrapping |
| 👁 | Toggle Markdown preview (`.md` files) |
| 🌙 / ☀ | Switch Dark / Light theme |
| 🕐 | View file history |
| ⚙️ | Settings |
| 🔄 | Pull latest from remote |
| ⋯ | More tools |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save immediately |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+L` | Show login dialog |
| `Ctrl+Home` | Jump to top |
| `Ctrl+End` | Jump to bottom |
| `Escape` | Close dialog / menu |

### Markdown Preview

For `.md` files, click the **👁** button to open a live preview panel alongside the editor. The preview updates as you type and supports:

- Headings, bold, italic
- Links and images
- Code blocks with syntax highlighting
- Tables
- Lists (ordered / unordered)
- Blockquotes

### Image Paste

In Markdown files, paste an image from your clipboard. PlainHub automatically:
1. Uploads the image to your repository (`images/` folder)
2. Inserts the Markdown image link in the editor

---

## File Operations

### From Context Menu (Right-Click)

| Action | Description |
|--------|-------------|
| **Rename** | Change the file name |
| **Copy** | Duplicate the file |
| **Delete** | Remove the file (with confirmation) |

### File History

Click **🕐** to view the commit history of the current file. Each entry shows the date, commit message, and SHA. Click any commit to view that historical version (read-only).

### Pull Latest

Click **🔄** to check for remote changes. If someone else updated the file, PlainHub detects the conflict and offers:
1. **Keep your edits** — preserve your unsaved changes
2. **Use latest version** — discard local changes and load the remote version
3. **Decide later** — defer the decision

---

## Search

Use the search bar in the sidebar to find files.

- **By name** (default): Filters the file list as you type
- **By content**: Searches inside file contents (toggle via radio buttons)

---

## Settings

Click **⚙️** to open settings:

- **Light theme**: Switch to light mode
- **Auto-scroll to bottom**: Automatically scroll to the end when opening a file (useful for logs and diaries)

### Persistent Preferences

PlainHub remembers your settings across sessions:
- Theme (dark/light)
- Font size
- Line numbers on/off
- Whitespace display
- Line wrapping
- Sidebar visibility
- Last opened repository and file

---

## URL Parameters (Deep Linking)

Share a direct link to a specific file with custom settings:

```
https://plainhub.dev/?repo=owner/myrepo&path=docs/guide.md&preview=on
```

| Parameter | Values | Description |
|-----------|--------|-------------|
| `repo` | `owner/name` | Open a specific repository |
| `path` | `file/path` | Open a specific file |
| `line` | number | Jump to a line |
| `preview` | `on` / `off` | Enable Markdown preview |
| `theme` | `dark` / `light` | Set theme |
| `fontSize` | `10`–`32` | Set font size |
| `lineNumbers` | `on` / `off` | Show line numbers |
| `whitespace` | `on` / `off` | Show whitespace |
| `sidebar` | `on` / `off` | Show/hide sidebar |

---

## Supported File Types

| Type | Behavior |
|------|----------|
| `.md`, `.txt`, `.json`, `.yaml`, `.js`, `.py`, etc. | Editable with syntax highlighting |
| `.png`, `.jpg`, `.gif`, `.webp`, `.svg` | Image preview |
| `.pdf` | PDF viewer |
| Other binary files | "Cannot display" message |

---

## Read-Only Mode

If you don't have write permission to a repository, PlainHub automatically enters read-only mode. A banner is displayed and editing is disabled. You can still browse and read files.

---

## Mobile

PlainHub works on mobile browsers:
- Tap **☰** to open the file list
- Tap **🔐** to access login/logout
- All features work on touch devices

---

## Privacy & Security

- **No server**: PlainHub runs entirely in your browser
- **No database**: All files are stored in your GitHub repository
- **Local credentials**: Authentication tokens are stored only in your browser
- **Direct API**: All operations go directly to the GitHub API — no intermediary servers
