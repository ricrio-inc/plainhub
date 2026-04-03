# PlainHub

[English](../README.md)

**GitHub ネイティブのメモ帳。AI 対応。**

<!-- ![PlainHub デモ](images/hero.gif) -->

[![npm version](https://img.shields.io/npm/v/plainhub)](https://www.npmjs.com/package/plainhub)

ファイルを開いて、編集して、保存。すべて GitHub リポジトリに直接。サーバーもデータベースも不要。

## 機能

### エディタ

- **Markdown 3モード編集** — Code / Visual（WYSIWYG）/ Preview
- **シンタックスハイライト** — Markdown、JSON、YAML など
- **Undo / Redo** — 完全な編集履歴
- **行番号、自動インデント、行折り返し** — 設定可能
- **空白文字の可視化** — 非表示文字の表示切替
- **キーボードショートカット** — Vim ライクな操作性

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

あとは AI に話しかけるだけ: *「owner/repo の README を PlainHub で開いて」*

## ドキュメント

- **[ユーザーガイド](USER_GUIDE.md)** — エディタ機能とショートカット
- **[CLI リファレンス](CLI.md)** — コマンドとオプション
- **[MCP Server セットアップ](MCP_SERVER.md)** — AI IDE 連携

## PlainHub と github.dev

github.dev はフル機能のエディタ — 本格的なコーディングセッションに最適。

PlainHub は **GitHub をバックエンドにしたメモ帳** — 開いて、編集して、保存。それぞれ違う場面で使うツール。

## リンク

- **アプリ**: [plainhub.dev](https://plainhub.dev)
- **About**: [plainhub.dev/about.html](https://plainhub.dev/about.html)

## ライセンス

Copyright © 2025 [ricrio Inc.](https://ai.ricrio.jp/) All rights reserved.
