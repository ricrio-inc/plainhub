# PlainHub

**Frontend for GitHub.** GitHub のファイルをブラウザで直接編集。サーバーもデータベースも不要。

<!-- ![PlainHub デモ](../images/hero.gif) -->

[![PlainHub を試す](https://img.shields.io/badge/PlainHub%20を試す-plainhub.dev-blue?style=for-the-badge)](https://plainhub.dev)
[![npm version](https://img.shields.io/npm/v/plainhub)](https://www.npmjs.com/package/plainhub)

[English Documentation](../)

## 特徴

### エディタ

- **Markdown 3モード編集** — Code / Visual（WYSIWYG）/ Preview
- **シンタックスハイライト** — Markdown、JSON、YAML など
- **Undo / Redo** — 完全な編集履歴
- **行番号、自動インデント、行折り返し** — 設定可能
- **空白文字の可視化** — 非表示文字の表示切替
- **キーボードショートカット** — VS Code スタイル（Ctrl+S、Ctrl+Z 等）

### ファイル管理

- **ファイル・フォルダの作成 / リネーム / 複製 / 削除**
- **ファイル履歴** — 過去のバージョンを差分表示で確認
- **同期 & 競合解決** — GitHub とのリアルタイム同期
- **画像ペースト** — 画像を貼り付けるだけでリポジトリに自動アップロード
- **リポジトリ横断検索** — すべてのリポジトリを横断して検索

### 連携

- **CLI** — ターミナルから `plainhub open <file> -r <repo>`
- **MCP Server** — AI IDE（Claude Code、Cursor、VS Code）から自然言語で操作
- **Deep linking** — テーマ、フォントサイズ、行番号設定を URL で共有
- **PWA** — デスクトップ・モバイルにネイティブアプリとしてインストール

### デザイン

- **ダーク / ライトテーマ** — 自動または手動切替
- **モバイル対応** — スマホ・タブレットでもフル機能

## ドキュメント

- **[ユーザーガイド](USER_GUIDE.md)** — エディタ機能とショートカット
- **[特徴](FEATURES.md)** — 目玉機能、データ主権、エンタープライズ
- **[ユースケース](USE_CASES.md)** — PlainHub の活用シーン
- **[CLI リファレンス](CLI.md)** — ターミナルからの操作
- **[MCP Server](MCP_SERVER.md)** — AI IDE 連携
- **[FAQ](FAQ.md)** — よくある質問とトラブルシューティング
- **[English Documentation](../)** — English docs

## クイックスタート

### Web

**[plainhub.dev](https://plainhub.dev)** にアクセスして GitHub でサインイン。

### CLI

```bash
npm install -g plainhub
plainhub auth --from-gh
plainhub open README.md -r owner/repo
```

### MCP Server（AI IDE）

```bash
npm install -g plainhub
claude mcp add plainhub -- plainhub-mcp
```

AI に話しかけるだけ: *「owner/repo の README を PlainHub で開いて」*

## コミュニティ

- [Issue を報告する](https://github.com/ricrio-inc/plainhub/issues)

## リンク

- **アプリ**: [app.plainhub.dev](https://app.plainhub.dev)
- **About**: [plainhub.dev](https://plainhub.dev)

## ライセンス

Copyright © 2025 [ricrio Inc.](https://ai.ricrio.jp/) All rights reserved.
