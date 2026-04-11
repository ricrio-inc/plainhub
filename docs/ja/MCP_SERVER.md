> **[plainhub.dev](https://plainhub.dev)** — PlainHub を試す | [English](../MCP_SERVER.md)

# PlainHub MCP Server — AI IDEからGitHubを操作

Claude Code、Cursor、VS CodeからGitHubファイルを自然言語で操作するMCP Server。

---

## MCP Server とは

MCP（Model Context Protocol）Server を使うと、AI IDE（Claude Code、Cursor、VS Code 等）から自然言語で PlainHub を操作できます。コマンドを覚える必要はありません。

```
「owner/repo の README を PlainHubで開いて」
「このリポジトリをブラウザで確認したい」
「最新コミットの差分を見せて」
「認証の状態を確認して」
```

---

## セットアップ

### Claude Code

```bash
npm install -g plainhub
claude mcp add plainhub -- plainhub-mcp
```

または `~/.claude/settings.json` に直接追加:

```json
{
  "mcpServers": {
    "plainhub": {
      "command": "npx",
      "args": ["-y", "plainhub-mcp"]
    }
  }
}
```

### Cursor

`.cursor/mcp.json` に追加:

```json
{
  "mcpServers": {
    "plainhub": {
      "command": "plainhub-mcp"
    }
  }
}
```

### VS Code

VS Code の MCP 設定に追加:

```json
{
  "mcpServers": {
    "plainhub": {
      "command": "npx",
      "args": ["-y", "plainhub-mcp"]
    }
  }
}
```

---

## MCP Server ツール一覧

| ツール | 説明 |
|------|------|
| `plainhub_open` | ファイルを開く、またはエディタ設定を変更 |
| `plainhub_diff` | コミットの差分を PlainHub で表示 |
| `plainhub_browse` | リポジトリのファイルブラウザを開く |
| `plainhub_auth` | GitHub PAT を保存 |
| `plainhub_auth_status` | 認証状態を確認 |

---

## Claude Code 連携

Claude Code と PlainHub の組み合わせで、コードとドキュメントの両方をカバーする。

### ワークフロー例

- **コード + ドキュメント**: Claude Code でコード修正 → PlainHub でドキュメント更新 → 両方 Git コミット
- **バグ調査**: Claude Code で原因調査 → `plainhub diff` で変更差分をビジュアル確認
- **チーム連携**: 非エンジニアが PlainHub で議事録作成 → エンジニアが Claude Code で参照

> Claude Code はコードを書く場所。PlainHub はドキュメントを書く場所。MCP/CLI で両者はシームレスにつながる。

---

## 認証

MCP Server は CLI と同じ認証情報を共有します。

```bash
# gh CLI から認証をインポート（推奨）
plainhub auth --from-gh

# または手動で PAT を設定
plainhub auth
```

トークンは `~/.config/plainhub/token` に保存されます（パーミッション `0600`）。

---

## トラブルシューティング

### MCP Server が認識されない

1. `plainhub-mcp` がインストールされているか確認: `which plainhub-mcp`
2. Claude Code / Cursor を再起動
3. 設定ファイルの JSON 構文を確認

### 認証エラー

1. `plainhub auth --status` で認証状態を確認
2. `plainhub auth --from-gh` で再認証
3. GitHub PAT のスコープに `repo` が含まれているか確認
