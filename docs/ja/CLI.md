> **[plainhub.dev](https://plainhub.dev)** — PlainHub を試す | [English](../CLI.md)

# PlainHub CLI — ターミナルからGitHubファイルをブラウザで開く

ターミナルからワンコマンドでGitHubリポジトリのファイルをPlainHubで開くCLIツール。

---

## インストール

```bash
npm install -g plainhub
```

## クイックスタート

```bash
plainhub auth --from-gh        # gh CLI から認証をインポート（推奨）
plainhub open README.md -r owner/repo
plainhub browse -r owner/repo  # ファイルブラウザを開く
```

---

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `plainhub open <file>` | ファイルを PlainHub で開く |
| `plainhub diff <sha>` | コミットの差分を PlainHub で表示 |
| `plainhub browse` | リポジトリのファイルブラウザを開く |
| `plainhub auth` | GitHub PAT で認証 |
| `plainhub auth --from-gh` | gh CLI からトークンをインポート |
| `plainhub auth --status` | 認証状態を確認 |
| `plainhub auth --logout` | 保存済みトークンを削除 |

---

## オプション

| オプション | 値 | 説明 |
|-----------|-----|------|
| `-r, --repo` | owner/name | リポジトリ指定 |
| `-b, --branch` | string | Git ブランチ指定 |
| `-l, --line` | 数値 | 行番号ジャンプ |
| `-n` | | URL のみ出力（ブラウザを開かない） |
| `--theme` | dark/light | エディタテーマ |
| `--preview` | on/off | Markdown プレビュー |
| `--scroll` | string | プレビューの見出しにスクロール |
| `--sidebar` | on/off | サイドバー表示 |
| `--fontSize` | 8-72 | フォントサイズ |
| `--lineNumbers` | on/off | 行番号表示 |
| `--whitespace` | on/off | 不可視文字表示 |
| `--no-auth` | | 認証なしで開く |

---

## 使用例

```bash
# Markdown プレビュー付きでドキュメントを開く
plainhub open docs/API.md -r owner/repo --preview on

# 特定の行にジャンプしてライトテーマで開く
plainhub open src/App.tsx -r owner/repo -l 42 --theme light

# URL のみ出力（スクリプトやチャットに貼り付け用）
plainhub open README.md -r owner/repo -n

# コミットの差分を表示
plainhub diff abc1234 -r owner/repo

# 特定ファイルの差分のみ表示
plainhub diff abc1234 -r owner/repo --path src/main.js

# チームで共有する設定付き URL
plainhub open docs/API.md -r owner/repo --preview on --theme light --fontSize 18
```

---

## 認証

PlainHub は 3 つの認証方法をサポートしています:

1. **gh CLI インポート**（推奨）: `plainhub auth --from-gh`
2. **手動 PAT**: `plainhub auth` — GitHub トークン設定画面を開く
3. **Web UI**: ブラウザで直接 PAT を入力

トークンは `~/.config/plainhub/token` に保存されます（パーミッション `0600`、所有者のみ読み書き可）。

---

## gh CLI との併用

gh CLI を既に使っているなら、PlainHub はすぐに始められます。認証を共有できるので、追加のセットアップはほぼ不要。

```bash
# gh CLIで認証済みなら、これだけで準備完了
plainhub auth --from-gh
```

gh CLI が「GitHub を操作するツール」なら、PlainHub は「GitHub のファイルを編集するツール」。お互いの得意分野が異なるので、組み合わせて使うのが自然です。

```
gh CLI の得意分野（例）:
  Issue作成、PR操作、リポジトリ管理、CIの確認

PlainHub の得意分野（例）:
  ドキュメント編集、ファイル作成・保存、Markdownプレビュー、AI相談
```

### 組み合わせの自由度

PlainHub は CLI・MCP・ブラウザ・AI パネルの全チャネルが同じ GitHub データに繋がっている。どのチャネルからでも同じファイルにアクセスでき、組み合わせ方はユーザー次第。

```
シェルスクリプトから自動でPlainHubを起動
CI/CDのステップにPlainHub URLを埋め込んでレビュー導線を作る
SlackボットからPlainHubリンクを投稿
GitHub Actionsの通知にPlainHub URLを添える
Claude Codeで分析 → PlainHubでレポート作成 → 同じリポにコミット
```
