# 自分の Claude Code を PlainHub で使う（Your agent）

PlainHub の AIパネルで、メモやコードについて質問すると、**あなたの PC の Claude Code** が答えます。API キーは要りません。あなたの Claude のサブスクリプションを使います。最初の設定では、Claude Code は起動したフォルダを**読むだけ**で、何も変えられません。ファイルの書き換えやコマンドの実行も任せたいときは、信頼できるフォルダで [Cockpit モード](#cockpit-モード) を使ってください。

質問とファイルは、ブラウザからあなたの PC へ、そして Claude へ届きます。PlainHub のサーバーは通りません。

## つなぎ方は2通り

どこから聞きたいかを選び、その部分を上から順に進めてください。2つの部分は、PlainHub の「Connect your own agent」の2つのタブと同じ分け方です。

1. **同じ PC から** — Claude Code が動く PC の Chrome か Edge で、PlainHub から聞きます。画面のタブは「On this PC」です。3手順: [同じ PC から聞く](#同じ-pc-から聞く)
2. **スマホから** — スマホの PlainHub から聞きます。PC は GitHub のプライベートリポジトリを通して答えます。画面のタブは「From your phone」です。4手順: [スマホから聞く](#スマホから聞く)

| どこで聞くか | PlainHub に入れるもの | agent の起動 |
|---|---|---|
| **同じ PC** の PlainHub（Chrome か Edge） | 6桁の**合言葉** | `plainhub agent` |
| **スマホ**の PlainHub | **郵便受けのリポジトリの名前**（`you/private-repo`）。合言葉ではありません | `plainhub agent --mailbox you/private-repo` |

合言葉が使えるのは、同じ PC のブラウザだけです。スマホで入れると、必ず「No agent found」で終わります。スマホでは [スマホから聞く](#スマホから聞く) の手順を使ってください。

## 用意するもの

1. **Node.js 18** 以上が入った PC（Windows・macOS・Linux）。`node -v` で確かめられます。Node.js が無い、または古いときは、[nodejs.org](https://nodejs.org/en/download) から **LTS** 版を入れて、ターミナルを開き直してください
2. 入れてサインインした **Claude Code**。ターミナルで `claude` が動く状態にしておきます
3. その PC の **Chrome か Edge**（同じ PC から聞くとき。Safari からは PC のアプリに届きません。[困ったとき](#困ったとき) を参照）
4. app.plainhub.dev の PlainHub。サインインしなくても質問できます。リポジトリのファイルを開くときと、スマホから聞くときは、GitHub でサインインします

スマホから聞くときは、自分だけが書き込める **GitHub のプライベートリポジトリ**も要ります（[スマホから聞く](#スマホから聞く) を参照）。

## 同じ PC から聞く

手順 1 と 2 は、あなたの Claude Code に任せることもできます。[Claude Code に任せる](#claude-code-に任せる) を参照してください。

### 1. 入れる

ターミナルで1回だけ実行します。

```bash
npm i -g plainhub
```

### 2. agent を起動する

質問したいフォルダ（たとえば、メモのリポジトリを clone したフォルダ）に移って、agent を起動します。

```bash
cd ~/notes
plainhub agent
```

フォルダと、6桁の**合言葉**（Pairing code）が表示されます。

```text
PlainHub agent — Claude Code, read-only
  Folder:  /home/you/notes  (Claude Code can read files here only, and cannot change anything)
  Listening on http://127.0.0.1:47110  (this PC only)
  Sites:   https://app.plainhub.dev

  Pairing code: 123456
  In PlainHub: Settings → AI → "Connect your own agent", then enter the code.

Press Ctrl+C to stop.
```

このターミナルは開いたままにしてください。agent が答えるのは、起動している間だけです。

**フォルダは慎重に選んでください。** Claude Code はその中のファイルをすべて読めます。質問しだいで、どのファイルの中身も答えに出てきます。ホームフォルダそのものや、秘密の情報（`.env` ファイルや鍵）があるフォルダでは起動しないでください。また、安全のため、agent はそのフォルダの中に入っているプログラムを使いません。そのため、ホームフォルダで起動すると `claude` が見つからないことがあります（[困ったとき](#claude-code-が見つからない) を参照）。

### 3. PlainHub とつなぐ

1. 同じ PC の PlainHub で「Settings」（⚙️）を開き、「AI」の「Connect your own agent」を押します
2. 合言葉を入れて「Connect」を押します
3. ブラウザが「このデバイスのアプリやローカルネットワークへのアクセス」を聞いてきたら、**許可**を選びます

agent を2つ（2つのフォルダで）起動していると、PlainHub が「Which folder?」と聞きます。1つ選んで、もう一度「Connect」を押してください。

合言葉でつなぐのは、ブラウザごとに1回だけです。あとで agent を起動し直したときは、新しい合言葉なしで PlainHub がつなぎます。

### Claude Code に任せる

手順 1 と 2 の代わりに、あなたの Claude Code に準備を頼むこともできます。「On this PC」のタブで「Let Claude Code set it up」を開き、「Copy」を押して、この PC のターミナルの Claude Code に頼む文を貼り付けます。

Claude Code は `plainhub doctor` で足りないものを確かめ、必要なら plainhub を入れ、どのフォルダを使うかをあなたに聞いて、agent を起動するコマンドを教えます。フォルダは [手順 2](#2-agent-を起動する) と同じく慎重に選んでください。ホームフォルダそのものや、秘密の情報（`.env` ファイルや鍵）があるフォルダは選ばないでください。そのコマンドは、あなたが自分のターミナルで実行し、開いたままにしてください。Claude Code は agent を起動しません。`plainhub auth` の実行やトークンの扱いもしません。そのあと [手順 3](#3-plainhub-とつなぐ) に進みます。

## スマホから聞く

スマホから PC へ直接は届きません。その代わりに、PC が数秒おきに GitHub のプライベートリポジトリ（**郵便受け**）を見に行き、質問を受け取って答えを書き戻します。

まず GitHub で、自分だけが書き込める**プライベート**リポジトリを作り、ファイルを1つ以上（たとえば README）入れます。この用途だけに使う新しいリポジトリにしてください。そのあと、次のように進めます。

1. PC のターミナルで1回だけ `npm i -g plainhub` を実行します（[同じ PC から聞く](#同じ-pc-から聞く) で済ませていれば要りません）
2. そのアカウントの GitHub のトークンを、agent に1回だけ渡します。`plainhub auth` を実行すると、GitHub の fine-grained トークンを作る画面が開き、「Contents: Read and write」が選ばれた状態になっています。「Repository access」で「Only select repositories」を選び、郵便受けのリポジトリを選びます。選んだリポジトリはどれも、このトークンで書き換えられます。ほかのリポジトリは、plainhub の CLI でも使う場合だけ足してください。**Metadata: Read-only** は GitHub が自動で付けます。ほかの権限は要りません。トークンを作り、ターミナルに貼り付けます。そのアカウントで gh の CLI を使っているなら、そのトークンを agent に使わせることもできます（`plainhub auth --from-gh` で取り込むこともできます）。ただし、gh のトークンはあなたのすべてのリポジトリに届きます
3. PC で、質問したいフォルダに移り、郵便受けを付けて agent を起動します。Claude Code はそのフォルダの中をすべて読めるので、ホームフォルダそのものや、秘密の情報（`.env` ファイルや鍵）があるフォルダは使わないでください。このターミナルは開いたままにしてください。

   ```bash
   plainhub agent --mailbox you/private-repo
   ```

4. スマホで、同じ GitHub のアカウントで PlainHub にサインインし、「Settings」→「AI」→「Connect your own agent」→「From your phone」と進み、`you/private-repo` を入れて「Connect」を押します。PlainHub に一部のリポジトリだけを許可している場合は、郵便受けのリポジトリも許可してください。その画面のメッセージの下にある「Add it on GitHub」を押し（またはリポジトリの一覧で「＋ Add / Remove Repositories」を選び）、リポジトリを選んで保存し、もう一度「Connect」を押します

質問（開いているファイルも一緒に）と答えは、そのリポジトリの `plainhub-chat` ブランチに保存されます。スマホから聞いている間は、PC の電源を入れたまま、スリープしない状態にしておいてください。

## 聞く

AIパネルを開いて質問します。たとえば *このフォルダでまだ終わっていないことは？* や *開いているファイルを要約して* のように聞きます。

- 答えは「Claude Code on this PC」から届きます。PlainHub で開いているファイルも、質問と一緒に送られます（長いファイルは最初の部分だけ）
- Claude Code が作業している間は、どのファイルを読んでいるかがパネルに出ます
- たくさんのファイルを読む深い質問は、20秒以上かかることがあります

## Cockpit モード

最初の設定では、agent は読むだけです。Claude Code にフォルダの中で作業させたい（ファイルを書き換えたり、コマンドを実行したりさせたい）ときは、agent を **Cockpit モード**で起動します。信頼できるフォルダでだけ使ってください。

```bash
cd ~/notes
plainhub agent --cockpit
```

このとき、1行目が `PlainHub agent — Claude Code, Cockpit mode` になります。上と同じく、合言葉で PlainHub とつなぎます。

AIパネルでは、上のボタンに今のモードが出ます。押すと切り替わり、次の質問から新しいモードになります。

- **Plan** — Claude Code は読んで、計画を出します。何も変えません
- **Auto** — Claude Code の auto モード（`--permission-mode auto`）です。Claude Code が安全だと判断したファイルの書き換えとコマンドは、**聞かずに**実行されます。コマンドはあなたの PC で、あなたとして動きます

パネルは、PC でもスマホでも **Plan** で始まります。あなた自身の Claude Code の設定（`~/.claude/settings.json`）で `permissions.defaultMode` を `"auto"` にしている場合は、**Auto** で始まります。フォルダの中の `.claude` の設定では、これを変えられません。

Claude Code が聞くと決めたとき（`ask` の決まりに載っているものも含みます）は、AIパネルにカードが届き、何をしようとしているか（ファイルとその変更、またはコマンド）がそのまま出ます。**Approve** か **Decline** を選んでください。選んだ答えは、そのまま Claude Code に届きます。Approve すると、フォルダの外のファイルを変えることもあります。

- あなた自身の Claude Code の設定（`~/.claude`・フックも）が効きます。確実に止めたいことは、そこに `deny` の決まりを足してください
- フォルダの中の `.claude` の設定からは、agent は **deny** と **ask** の決まりだけを使います。フォルダが自分で権限を増やすことはできません

**ファイルが指示を運んでくることがあります。** 質問には開いているファイルが付き、Claude Code はフォルダの中のほかのファイルも読みます。その中に指示が書かれていると、Claude Code がそれに従うことがあります（プロンプトインジェクション）。人から受け取ったファイルや、よく知らないリポジトリを開いている間は、Auto で質問しないでください。パネルが Plan で始まるのも、これが理由です。

スマホから使うときは、郵便受けを足します（[スマホから聞く](#スマホから聞く) のとおりに用意してください）。

```bash
plainhub agent --cockpit --mailbox you/private-repo
```

スマホでも、パネルは **Plan** で始まります。変更を任せたいときに **Auto** へ切り替えてください。Approve するカードはスマホに届きます。

### 新しいリポジトリと Issue（gh）

PlainHub はリポジトリを作ったり、Issue を書いたりできません。Auto では、Claude Code があなたの PC の GitHub CLI（`gh`）を使い、あなたとして（`gh auth login`）それを行います。PlainHub で開いているリポジトリのファイルは、これまでどおり PlainHub を通り、Approve するカードが出ます。

Claude Code がリポジトリを作ると、PlainHub がそれを開きます。PlainHub に一部のリポジトリだけを許可している場合は、GitHub で新しいリポジトリを選ぶ1手順をカードが案内します。タブに戻ると開きます。

`gh` は、あなたの GitHub のアカウントができることを何でもできます。リポジトリを消すことも、プライベートのリポジトリを公開にすることもできます。これらを AI に任せないでください。あなた自身の Claude Code の設定（`~/.claude/settings.json`）の `deny` と `ask` の一覧に、次の決まりを足します（今ある決まりは残してください）。

```json
{
  "permissions": {
    "deny": [
      "Bash(gh repo delete:*)",
      "Bash(gh repo edit:*)",
      "Bash(gh repo rename:*)",
      "Bash(gh repo archive:*)",
      "Bash(gh auth token:*)"
    ],
    "ask": [
      "Bash(gh repo create:*)",
      "Bash(gh gist create:*)",
      "Bash(gh api:*)"
    ]
  }
}
```

- `gh repo edit` は、リポジトリの公開・非公開と設定を変えます。`gh gist create` は PC のファイルを公開できます。`gh api` は GitHub のどの API も呼べて、消すこともできます。そのため、これらは先に聞くようにします
- Claude Code はこの決まりをコマンドの先頭で照らします。そのため、別のコマンドで包んだもの（`sh -c "…"` など）はすり抜けることがあります。これは守りであって、保証ではありません。こうした変更は、GitHub であなた自身が行ってください

## 止める

- **agent を止める:** そのターミナルで Ctrl+C を押します（またはウィンドウを閉じます）。Claude Code が答えている途中なら、それも止まります
- **PlainHub で使うのをやめる:** 「Settings」→「AI」→「Disconnect」。AIパネルは元の状態に戻ります
- **つないだブラウザをすべて忘れさせる:** `plainhub agent --forget`（次からは新しい合言葉が要ります）

## 読めるもの

`--cockpit` を付けないとき（最初の設定）:

| できる | できない |
|---|---|
| 起動したフォルダ（とその下のフォルダ）のファイルを読む | そのフォルダの外のファイルを読む |
| それらのファイルを検索する | ファイルを書き換える・作る・消す |
| PlainHub で開いているファイルを見る | コマンドを実行する・あなたの MCP サーバーや Claude Code の設定を使う |

[Cockpit モード](#cockpit-モード) では、もっと多くのことができます。Auto では、Claude Code が安全だと判断したファイルの書き換えとコマンドを聞かずに行い、それ以外はパネルであなたに聞きます。`~/.claude` の `deny` の決まりは、このときも効きます。

- 質問できるのは、合言葉でつないだブラウザの、PlainHub 自身のサイトだけです。ほかの人のウェブサイトからは聞けません
- agent は 127.0.0.1 だけで待ち受けます（ポート 47110〜47114）。同じネットワークのほかの機器からは届きません
- `--mailbox` を付けたとき、agent は自分だけが書き込めるプライベートリポジトリだけを使い、あなたが書いた質問にだけ答えます

## 困ったとき

まず、質問したいフォルダで `plainhub doctor` を実行してください。Node.js と Claude Code があるか、agent が使うポートが空いているか、組になったブラウザとスマホ用のトークンがあるかを確かめて、足りない所の直し方を出します。何も変えません。`--mailbox <owner/repo>` を付けると、郵便受けのリポジトリも確かめます。

### node や npm が見つからない

ターミナルで `node` や `npm` が `command not found`（macOS・Linux）や `is not recognized`（Windows）になる、または `node -v` が 18 より古い版を出すときです。[nodejs.org](https://nodejs.org/en/download) から **LTS** 版を入れ、ターミナルを開き直してから、もう一度 `npm i -g plainhub` を実行してください。

### Safari・iPhone・iPad

> Safari and iPhone/iPad browsers can't reach apps on your PC.

PC の Chrome か Edge で PlainHub を開いてください。スマホでは [スマホから聞く](#スマホから聞く) の手順を使います。

### agent が起動していない

> No agent found on this PC. Run `plainhub agent` in your folder first.

> Your agent isn’t running. Start it with `plainhub agent` in your folder, then ask again.

**スマホで開いていますか？** 合言葉が使えるのは、同じ PC のブラウザだけです。[スマホから聞く](#スマホから聞く) の手順で、郵便受けのリポジトリの名前を入れてください。

フォルダで、もう一度 `plainhub agent` を起動してください（ターミナルを閉じた、または PC を再起動したのかもしれません）。Chrome や Edge が「このデバイスのアプリへのアクセス」を聞いたときに「ブロック」を選んでいた場合は、サイトの設定（アドレスの左のアイコン）で許可してから、もう一度試してください。

### Chrome や Edge がローカルネットワークについて聞いてくる

Chrome と Edge は、app.plainhub.dev がこのデバイスのアプリやローカルネットワークにアクセスしてよいかを聞くことがあります。**許可**を選んでください。ページはこの方法で、あなたの PC（127.0.0.1）の agent に届きます。ネットワークのほかの機器は使いません。

### 合言葉が違う

> Wrong code. The code changes each time you connect — enter the newest code in the agent's terminal (the last “Next pairing code”, if there is one).

合言葉は1回しか使えません。ブラウザがつながると、ターミナルに `Next pairing code` が出ます。次はそちらを使ってください。

> Too many wrong codes, so your agent stopped pairing. Restart it (Ctrl+C in its terminal, then run plainhub agent again) and enter the new code it shows.

合言葉を5回間違えると、agent はつなぐのをやめます。Ctrl+C を押して起動し直し、新しい合言葉を入れてください。

### Claude Code が見つからない

AIパネルに次のように出ます。

> Claude Code (claude) was not found on this PC. Install it, then start plainhub agent again.

- 同じターミナルで `claude` が動くか確かめてください
- ホームフォルダそのもので agent を起動していませんか？ 安全のため、agent は読むフォルダの中にあるプログラムを使いません。`claude` はホームフォルダの下に入っていることが多いです。agent を止め（Ctrl+C）、質問したいフォルダに `cd` で移ってから、起動し直してください

### Windows

`claude` が動く PowerShell かコマンドプロンプトで `plainhub agent` を実行します。PowerShell はホームフォルダで開くので、先に `cd` でフォルダに移ってください（[Claude Code が見つからない](#claude-code-が見つからない) を参照）。Ctrl+C を押すかウィンドウを閉じると、Claude Code も止まります。

### Claude Code が古い

> This version of Claude Code cannot run in read-only mode. Update Claude Code (claude update), then start plainhub agent again.

### ポートがすべて使われている

> All agent ports are in use

ほかの `plainhub agent` が動いているのかもしれません。それを止めて（Ctrl+C）、もう一度試してください。

### スマホから: トークンがリポジトリに届かない

`plainhub agent --mailbox …` を起動すると、ターミナルに次のどちらかが出ます。

> <repo> was not found, or your token cannot see it.

> Your token cannot write to <repo>. Run `plainhub auth` again: choose <repo> under "Repository access" and keep "Contents: Read and write".

1つ目は、保存したトークンに郵便受けのリポジトリが入っていない（または名前が違う）ということです。2つ目は、トークンが読むことしかできないということです。もう一度 `plainhub auth` を実行し、[スマホから聞く](#スマホから聞く) の手順2のとおりに新しいトークンを作ってください。「Repository access」で郵便受けのリポジトリを選び、「Contents: Read and write」はそのままにします。

### スマホから: PC が答えない

> Your home PC isn't answering

PC で `plainhub agent --mailbox …` が動いたままか、PC がスリープしていないかを確かめてください。

### スマホから: リポジトリが断られる

> <repo> is public. Questions, answers and the files your agent reads would be public. Use a private repository.

> Other people can write to <repo>

> <repo> is empty. Add any file (for example a README) on GitHub first.

自分のアカウントの下に、ファイルが1つ以上あり、ほかの誰も書き込めない、新しいプライベートリポジトリを使ってください。

### スマホから: リポジトリが見つからない

> <repo> was not found, or PlainHub can't access it.

名前（持ち主/名前）を確かめてください。PlainHub に一部のリポジトリだけを許可している場合は、郵便受けのリポジトリを足します。メッセージの下の「Add it on GitHub」を押し（またはリポジトリの一覧で「＋ Add / Remove Repositories」を選び）、リポジトリを選んで保存してから、もう一度「Connect」を押してください。

GitHub が *This app has changed since you last viewed it* と表示して保存できないときは、先にその画面で新しい権限を確かめて受け入れてから、リポジトリを足してください。
