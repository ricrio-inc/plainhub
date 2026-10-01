# PlainHub

**あなたのメモは、あなたの GitHub に。** GitHub に保存する、プレーンテキストのエディタです（Markdown にも対応）。保存するたびに履歴（コミット）が残り、AI が編集を手伝います。

[![PlainHub を試す](https://img.shields.io/badge/PlainHub%20を試す-app.plainhub.dev-blue?style=for-the-badge)](https://app.plainhub.dev)
[![npm version](https://img.shields.io/npm/v/plainhub)](https://www.npmjs.com/package/plainhub)

[Web サイト](https://plainhub.dev/ja/) · ▶ [30秒の紹介動画（YouTube・英語）](https://youtu.be/2ThRzBnGxoE) · [English Documentation](../../README.md)

![PlainHub: メモを書くと保存されてコミットになり、履歴を確かめ、AI に直しを頼んで適用する](../images/hero.gif)

> **⭐ PlainHub が役立ったら、ぜひスターをお願いします — 新機能の開発を後押しできます。**

PlainHub は、GitHub を誰でも簡単に使えるようにする AI 駆動オンラインエディタです。
Git の知識は不要。ファイルを開いて、編集して、保存。すべて GitHub に直接。
何万行でも重くならない。GitHub を自然言語で操作 — AI にやりたいことを伝えるだけ。
エンジニアもビジネスも、同じドキュメントを同じ場所で。

## 特徴

### スマホから直す

スマホでノートを開いて1行直すと、そのまま保存されます。保存は、あなたのリポジトリへのコミットです。

<img src="../images/phone-edit.gif" width="300" alt="スマホで Markdown のチェックリストを開き、Code に切り替えて1行足すと Saved と出て、GitHub の履歴にコミットが並ぶ">

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

## ドキュメント

- **[ユーザーガイド](USER_GUIDE.md)** — エディタ機能とショートカット
- **[特徴](FEATURES.md)** — 目玉機能、データ主権、エンタープライズ
- **[ユースケース](USE_CASES.md)** — PlainHub の活用シーン
- **[CLI リファレンス](CLI.md)** — ターミナルからの操作
- **[MCP Server](MCP_SERVER.md)** — AI IDE 連携
- **[FAQ](FAQ.md)** — よくある質問とトラブルシューティング
- **[English Documentation](../../README.md)** — English docs

## 困ったとき

迷った・うまく動かない・こうしてほしい、があれば [Issue を開いてください](https://github.com/ricrio-inc/plainhub/issues/new/choose)。小さな質問で大丈夫です（英語でも日本語でも構いません）。

- **❓ How do I…?** — 使い方の質問
- **🐞 Bug** — 思ったとおりに動かない
- **💡 Idea** — 改善の提案

返事は AI の手を借りて下書きし、PlainHub のチームが確かめてから送ることがあります。このリポジトリは公開されているので、個人情報・トークン・非公開のファイルの中身は書かないでください。

## リンク

- **アプリ**: [app.plainhub.dev](https://app.plainhub.dev)
- **About**: [plainhub.dev](https://plainhub.dev)

## ライセンス

Copyright © 2025 [ricrio Inc.](https://ai.ricrio.jp/) All rights reserved.
