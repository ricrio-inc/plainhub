> **[plainhub.dev](https://plainhub.dev)** — PlainHub を試す | [English](../FAQ.md)

# PlainHub FAQ — よくある質問とトラブルシューティング

PlainHub（GitHubオンラインエディタ）のよくある質問と回答。

---

## 一般的な質問

### PlainHub とは何ですか？

PlainHub は、GitHub リポジトリのファイルをブラウザで直接編集・保存できるオンラインテキストエディタです。AI パネルを内蔵し、自然言語でファイル操作や GitHub Issues の管理が可能です。

### 無料で使えますか？

はい、無料で使えます。[plainhub.dev](https://plainhub.dev) にアクセスして GitHub でサインインするだけです。

### データはどこに保存されますか？

すべてのデータはユーザーの GitHub リポジトリに保存されます。PlainHub 独自のサーバやデータベースにデータは保存されません。PlainHub をやめても、データは GitHub にそのまま残ります。

### GitHub アカウントが必要ですか？

はい、PlainHub は GitHub をバックエンドとして使用するため、GitHub アカウントが必要です。無料の GitHub アカウントで問題ありません。

### github.dev との違いは何ですか？

github.dev はフル機能のコードエディタで、コーディングセッションに最適です。PlainHub は GitHub をバックエンドにしたメモ帳で、通常のテキストエディタのような操作を行うことが可能です。用途が異なるツールです。

### 他のクラウドエディタとの違いは？

PlainHub はデータが自分の GitHub リポジトリに保存されるため、ベンダーロックインがありません。Git 標準形式なので、いつでも他のツールに移行できます。

---

## サインイン・認証

### サインインできません

- ブラウザのポップアップブロッカーが GitHub OAuth をブロックしている可能性があります
- ブラウザの Cookie と localStorage が有効になっているか確認してください
- シークレットウィンドウで試してみてください

### PAT（Personal Access Token）はどこで取得できますか？

GitHub → Settings → Developer settings → Personal access tokens → Generate new token で取得できます。スコープは `repo` が必要です。

### トークンはどこに保存されますか？

- **Web UI**: ブラウザの localStorage に保存されます
- **CLI / MCP Server**: `~/.config/plainhub/token` に保存されます（パーミッション 0600）

---

## エディタ

### ファイルが保存できません

- GitHub の認証トークンが有効か確認してください
- リポジトリへの書き込み権限があるか確認してください
- ネットワーク接続を確認してください

### 大きなファイルを編集できますか？

はい、PlainHub は数万行の超ロングファイルでもサクサク編集できます。CodeMirror エンジンにより、他のオンラインエディタでは表示しづらいサイズのファイルも快適に操作可能です。

### Visual モード（WYSIWYG）で表示が崩れます

一部の複雑な Markdown 構文は Visual モードで完全に再現できない場合があります。Code モードに切り替えて編集し、Preview モードで確認することをお勧めします。

### 画像を貼り付けるには？

Ctrl+V（Mac: Cmd+V）でクリップボードのスクリーンショットを直接貼り付けできます。画像は自動的に GitHub リポジトリにアップロードされ、Markdown の画像リンクが挿入されます。

---

## 同期・競合

### 「Conflict」と表示されました

別のデバイスや別のユーザーが同じファイルを編集した場合に発生します。PlainHub は競合解決ダイアログを表示するので、どちらの変更を採用するか選択できます。

### 保存したのにファイルが更新されていません

- ブラウザのキャッシュが原因の場合があります。Ctrl+Shift+R でハードリロードしてください
- GitHub API の遅延の場合があります。数秒待ってから再度確認してください

---

## AI パネル

### AI パネルを使うには何が必要ですか？

Anthropic の API キー（BYOK: Bring Your Own Key）が必要です。設定画面から API キーを入力してください。

### どのモデルが使えますか？

Claude Opus、Sonnet、Haiku（デフォルト）の 3 モデルから選択できます。設定画面からワンクリックで切り替え可能です。

### API の利用料金はかかりますか？

Anthropic の API 利用料金がかかります。PlainHub 自体は無料ですが、AI パネルの利用には Anthropic のアカウントと API キーが必要です。

---

## CLI / MCP Server

### CLI がインストールできません

Node.js 18 以上が必要です。`node --version` でバージョンを確認してください。

### MCP Server が認識されません

1. `which plainhub-mcp` でインストールを確認
2. Claude Code / Cursor を再起動
3. 設定ファイルの JSON 構文を確認

### `plainhub auth --from-gh` が失敗します

gh CLI がインストールされていて、ログイン済みであることを確認してください。`gh auth status` で確認できます。
