// Your agent の決まりの値の正本（中継役の側・docs/design/DESIGN_agent_unify.md §2）
//   PC（agent.js）と郵便受け（mailbox.js）は、ここの値と agent-core.js の決まりだけを使う（届け方ごとに値を持たない）
//   ブラウザ（app/js/local-agent.js・mailbox-agent.js）は別に配るので同じ値の写しを持つ → tests/functions/agent-spec-same.test.cjs で同じかを確かめる

// 出来事（イベント）の形の版。古い中継役と新しい画面が混ざった時に分かるように、出来事ごとに v を付ける
export const EVENT_VERSION = 1;
// 出来事の種類: text（答えの文の追加）・tool（道具の使用・target は読んでいる場所）・thinking（考えている）・
//   permission（Cockpit モードだけ: Claude Code が道具を使う前に本人の承認を求めている・id への答えで続く）・
//   stopped（止めた・reason は STOP_REASONS）・error（kind は ERROR_KINDS・message は人に見せる文）・done（いつも最後に1つ・end は END_STATES・今の起動のしかた＝mode など hello と同じ形も付ける）
//   accepted（連投・QM1: Claude Code がこの送信を受け取った＝--replay-user-messages の印・会話の番号 sessionId つき）・turn_end（Claude Code の1回の作業が終わった＝result）
//   self（QM0b: 答えのあいだに Claude Code が自分で始めた作業の始まり・why は 'scheduled'＝予約／'task'＝裏で頼んだ Agent が動いている／'background'＝裏の作業の結果を受けて続けた。PC の /watch の流れだけ・
//   その流れの出来事にはどれも answer＝その作業の番号が付く）
//   版（EVENT_VERSION）は上げない: 足したのは知らない種類を捨てる読み手（cleanEvent）が読み飛ばせる種類だけ。上げると郵便受けの v の照合で古い画面と合わなくなる。
//   連投を使えるかは hello と pair（と答えの done・AM1q）の queue: true で、答えのあいだの作業を見られるかは watch: true で伝える（images と同じ）
//   action（AX1: Claude Code が画面の見た目の操作＝AI パネルが質問に添えた一覧の道具を呼んだ・id・name・input。画面は内蔵の AI と同じ executeTool で行い、結果を id への答えで返す。
//   一覧を受け取るかは hello・pair・答えの done の actions: true で伝える）
//   action_end（GO6: 書く・消す操作＝確認のカードを出す操作の待ちが、どこかで片付いた・id。画面の答え・時間切れ・止めた・別のタブの答えのどれでも。
//   画面はその id のカードがまだ開いていれば閉じる＝中継役が断った後に Run で書けない。知らない種類を捨てる古い画面は読み飛ばす）
export const EVENT_TYPES = ['text', 'tool', 'thinking', 'permission', 'action', 'action_end', 'accepted', 'turn_end', 'self', 'stopped', 'error', 'done'];
// 止まった理由: 使う人が止めた（ブラウザを閉じた・スマホの Stop）・新しい質問が来たので前の答えを止めた
export const STOP_REASONS = ['stopped', 'replaced'];
// エラーの種類（中継役で起きるもの）。届け方の失敗（PC に届かない・郵便受けが読めない）は届け方ごと（ブラウザの側）
export const ERROR_KINDS = ['timeout', 'too_long', 'failed'];
// 1つの答えの終わり方（done の end）
export const END_STATES = ['complete', ...STOP_REASONS, ...ERROR_KINDS];

export const ASK_TIMEOUT_MS = 10 * 60 * 1000;   // 1つの答えの時間切れ（中継役の1か所・PC もスマホも）
// 起動したままの Claude Code（QM0・docs/design/DESIGN_ai_panel_queue.md §3）: 会話ごとに1つ起動したまま、次の送信は同じ起動の入力に書く
export const IDLE_MS = 10 * 60 * 1000;          // この間なにも送られなければ入力を閉じて終える（PC の資源のため・次の送信で --resume して続ける）
export const MAX_ALIVE = 3;                     // 起動したままにしておく数の上限（超えたら一番長く使っていないものを閉じる）
// 連投（QM1）で1つの会話に待たせておける送信の数（答えている送信も含む）。超えた送信は受け取らずに知らせる（中継役の資源を守る・gen-193 G3 1巡目）
export const MAX_QUEUED = 20;
export const KILL_GRACE_MS = 3000;              // 起動ごと止める時、プロセスの組に SIGTERM を送ってから SIGKILL するまでの時間（裏の道具が残らないように・QM0b ④）
export const INTERRUPT_GRACE_MS = 5000;         // 止める（stream-json の interrupt）を送ってから作業の終わりを待つ時間。来なければ起動ごと止める
export const MAX_ANSWER = 100000;               // 答えの長さの上限（字）。超えたら知らせてから切る（黙って切らない）
export const MAX_PROMPT = 20000;
export const MAX_CONTENT = 12000;               // AI パネル（ai-panel.js の agentContext）と同じ上限
// 画像の付く質問（IP1・docs/design/DESIGN_ai_panel_image_paste.md）: PC の /ask の本文の上限だけを広げる（画像の無い質問は agent.js の MAX_BODY のまま）。
//   値は Anthropic の Messages API の1回の要求の上限（32 MB）。1枚の大きさ・形式・枚数は Claude Code（その先の API）が正で、PlainHub は自分の上限を持たない
//   （大きな画像は Claude Code が縮め、読めない画像は Claude Code がそう答える＝2.1.284 で実測）
export const MAX_IMAGE_BODY = 32 * 1024 * 1024;
// 画像のブロック（Anthropic の形 { type: 'image', source: { type: 'base64', media_type, data } }）として受け取る形。url などほかの source は受け取らない
//   （Claude Code にこの PC から外の URL を読みに行かせない）
export const IMAGE_MEDIA_TYPE = /^image\/[a-z0-9][a-z0-9.+-]{0,49}$/i;
export const MAX_EVENTS = 500;                  // 郵便受けの answer.json に溜める出来事の数の上限（文は続けてまとめるので、主に道具の使用の数・GitHub が中身を返す 1MB に届かせない）
export const MAX_PERMISSION_TEXT = 100000;      // 承認カードに出す中身（Write の本文・Edit の前後）の上限（字）。超えたら見せずに断る（見せていない中身を承認させない）
// 画面の見た目の操作（AX1・Your agent からテーマ・文字の大きさ・一覧の開閉・表示の切り替え・読み上げ・ファイルを開く）
//   AI パネルが質問に添える一覧（目録 app/js/github-ops.js の Your agent に渡す印の操作・SSOT はブラウザ）の上限と、呼ばれた操作を画面が行って答えるまで待つ時間
//   （スマホの郵便受けは見回りと書き込みで数秒〜十数秒かかる＝2026-10-20 オーナー「数秒の遅れは許す」）。時間内に答えが無ければ断る（画面を閉じていた）
export const MAX_ACTIONS = 20;
export const ACTION_TIMEOUT_MS = 60 * 1000;
export const MAX_ACTION_RESULT = 2000;          // 画面が返す結果の文の上限（字）
export const MAX_ACTION_CALLS = 20;            // 1つの答えで呼べる回数（他人のリポの文の指示で何百回も呼ばれて、郵便受けの書き込み・GitHub の上限を使い切らない・G3 1巡目）
// 道具の危険度の印（GO1・docs/design/DESIGN_github_ops.md §1a）: 操作の目録（ブラウザの app/js/github-ops.js）は道具ごとにこの語を1つ持つ。
//   read＝GitHub から読むだけ・view＝画面だけ変わる・write＝足す／書き換える（確認のカード）・destructive＝消す／場所が変わる（カード＋警告）。
//   語と MCP の注釈（Claude Code に見せる印・Plan は readOnlyHint の無い道具を確認に回す）の対応はここが正本。中継役は目録の写しを持たない
export const RISKS = ['read', 'view', 'write', 'destructive'];
export const RISK_ANNOTATIONS = {
    read: { readOnlyHint: true },
    view: { readOnlyHint: true },
    write: { readOnlyHint: false, destructiveHint: false },
    destructive: { readOnlyHint: false, destructiveHint: true },
};
// Your agent に渡す印（画面が質問に添え、中継役が受け取る）。AGENT_RISKS はいつでも（読むだけの接続・Plan も＝見た目の操作・AX1、
//   GitHub から読むだけの道具＝窓と同じ検索 search_files・ファイルを読む read_file など・XS10・DESIGN_github_ops.md §1a「read はいつでも」）。
//   AUTO_AGENT_RISKS は Cockpit モードで Auto の時だけ足す（GO6・DESIGN_github_ops.md §1a）。呼ばれても実行はブラウザの executeTool の1か所で、
//   画面が内蔵の AI と同じ確認のカードを出し、Run の時だけ書く（中継役・Claude Code は二重に聞かない）。どの印をいつ渡すかは agent-core.js の agentRisks
export const AGENT_RISKS = ['read', 'view'];
export const AUTO_AGENT_RISKS = ['write', 'destructive'];
// Your agent が画面の道具でなく PC の gh で行う操作（GO7・DESIGN_github_ops.md §2b）: PlainHub の App にはリポを作る・Issue に書く権限が無い。
//   目録（app/js/github-ops.js）の agent: 'gh' の道具はちょうどこれ（github-ops-catalog が比べる）。値は Claude Code への指示に並べる gh のコマンド
//   （agent-core.js の systemPrompt・cmd.exe が特別に読む文字を含めない）
export const GH_OPS = { create_repo: 'gh repo create', create_issue: 'gh issue create', comment_issue: 'gh issue comment', update_issue: 'gh issue edit' };
// 確認のカードを出す操作（AUTO_AGENT_RISKS）は、本人が読んで押すまで待つ → 画面の答えを待つ時間は答えの時間切れと同じ（ACTION_TIMEOUT_MS は見た目の操作だけ）
export const CARD_ACTION_TIMEOUT_MS = ASK_TIMEOUT_MS;
export const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Claude Code の起動の決まり（中継役の中だけで使う・H2a・docs/design/DESIGN_handsfree_agent.md §6）
//   read（既定・一般の人）: 読むだけ・フォルダの外は読まない・MCP なし・利用者の設定（許可の規則・既定のモード）を読まない・確認が要るものは全部断る
//   cockpit（`plainhub agent --cockpit` と明示した時だけ）: 同じ Claude Code を遠くから操作する窓（H2b）。何を許すかは Claude Code の設定と権限のモードが正本
//     （PlainHub・中継役は許可や禁止の表を持たない）。権限のモードは質問ごとに AI パネルが選ぶ（PERMISSION_MODES・Claude Code の名前のまま）:
//       plan: 読む・調べる・案を出すだけ。--permission-mode plan に加えて道具を読む3つ（PLAN_TOOLS）だけにする
//         （Claude Code の plan は、設定の allow の規則にあるコマンドを止めない・ExitPlanMode の承認で plan を抜けて動く＝2.1.284 で実測 → 中継役は plan の時、読む道具のほかは聞かずに断る）
//       auto: PC の Cockpit と同じ。道具は Claude Code の既定（Bash も含む）・--permission-mode auto（使えない PC では Claude Code が default で動く）
//     確認が要る操作は Claude Code が呼び出した側（中継役）に聞き（--permission-prompts host・stdio）、AI パネルの承認カードの答えをそのまま返す
//     （PC の画面でも、スマホの郵便受けでも同じ。郵便受けの答えは本人のコミットの時だけ使う＝mailbox.js）
//     Claude Code に読ませる設定は利用者の設定（~/.claude/settings.json・hooks も含む＝PC のターミナルと同じ）だけ（--setting-sources user）。起動したフォルダの設定は
//     clone した他人のリポにもあり、apiKeyHelper（コマンド）・env（通信の行き先）・hooks がカードなしで効いた（gen-141 の G3 2巡目）→ フォルダの設定からは、
//     狭める規則（deny・ask）だけを中継役が取り出して --settings で渡す（FOLDER_SETTINGS・agent-core.js の cockpitSettings）。読める場所（additionalDirectories）を
//     広げるのは利用者の設定だけ（フォルダの設定の "/" や "~" で、家の PC のどこでもカードなしに読めた＝gen-152 の G2・G3 1巡目）
export const AGENT_MODES = ['read', 'cockpit'];
export const PERMISSION_MODES = ['plan', 'auto'];        // Cockpit モードの中の権限のモード（届かない・知らない値は plan＝安全な方）
export const PLAN_TOOLS = ['Read', 'Grep', 'Glob'];      // plan の時の道具（読む・調べるだけ）
export const FILE_TOOLS = ['Read', 'Grep', 'Glob', 'Edit', 'Write'];   // 承認カードを道具ごとの形（ファイル・前後・全文・探すもの）で見せる道具。Bash はコマンド、ほかの道具は引数の全文で見せる
export const CLAUDE_ARGS = {
    // どちらも入力は stream-json（会話ごとに起動したまま・QM0）。--replay-user-messages は Claude Code が送信を受け取った印（QM2 の灰色の戻り）
    read: ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--input-format', 'stream-json', '--replay-user-messages',
        '--restricted', '--strict-mcp-config', '--tools', 'Read,Grep,Glob',
        '--permission-mode', 'dontAsk', '--permission-prompts', 'none'],
    // --tools と --permission-mode は auto の値（plan の時は agent-core.js の claudeArgs が PLAN_TOOLS と plan に置き換える）
    cockpit: ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--input-format', 'stream-json', '--replay-user-messages',
        '--strict-mcp-config', '--tools', 'default',
        '--permission-mode', 'auto', '--permission-prompts', 'host', '--permission-prompt-tool', 'stdio',
        '--setting-sources', 'user', '--settings', '{}'],
};
// claude を起動する時に外す環境変数（親の Claude Code の会話・合図の印・AE1 gen-234）。中継役を Claude Code の中（Cockpit の Bash など）から起動すると
//   これを受け継ぎ、起動する claude が「その会話の子」として動いた（2026-10-21 スマホの質問が渡した1秒後に中断）。Claude Code は自分の道具の下で動くものに
//   この印を付け、独り立ちの会話を起こす時は外す（2.1.284 の作り）。中継役の claude は利用者の独り立ちの会話なので、どこから起動されても外す（同じ動き）。
//   裏の会話の印（CLAUDE_CODE_SESSION_KIND・CLAUDE_BG_*）も外す: 受け継ぐと許可の規則が広がった（CLAUDE_BG_SESSION_PERMISSION_RULES＝G3 1巡目に本物で確認）。
//   利用者の設定（CLAUDE_CONFIG_DIR・API キー・CLAUDE_CODE_USE_BEDROCK・CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC・CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS など）は外さない。
//   名前は大文字で比べる（Windows）。末尾の * はその文字で始まる名前すべて
export const PARENT_SESSION_ENV = ['CLAUDECODE', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_CODE_SESSION_ATTENDED', 'CLAUDE_CODE_ENTRYPOINT',
    'CLAUDE_CODE_EXECPATH', 'CLAUDE_CODE_MESSAGING_SOCKET', 'CLAUDE_CODE_MESSAGING_TOKEN', 'CLAUDE_CODE_BRIDGE_SESSION_ID', 'CLAUDE_CODE_HOST_SESSION_ID',
    'CLAUDE_CODE_SESSION_KIND', 'CLAUDE_CODE_COORDINATOR_MODE', 'CLAUDE_CODE_SSE_PORT', 'CLAUDE_CODE_INVOKED_SKILLS', 'CLAUDE_CODE_CHROME_MCP_ORG_DENIED',
    'CLAUDE_CODE_EVAL_INTERVIEW_SESSION', 'CLAUDE_PID', 'CLAUDE_EFFORT', 'AI_AGENT', 'TRACEPARENT', 'CLAUDE_BG_*'];
// Cockpit モードで、起動したフォルダの設定から取り出すもの（files の順に読み、permissions のこの2つだけ・1つにつき max 件まで・1つの値は maxLength 字まで）
export const FOLDER_SETTINGS = { files: ['.claude/settings.json', '.claude/settings.local.json'], permissions: ['deny', 'ask'], max: 200, maxLength: 500, maxBytes: 1024 * 1024 };

// 郵便受けの承認の答えに付ける「見せたカード」の印の元（スマホはこの文字の SHA-256 を答えに付け、PC は自分が出したカードと比べる・
//   途中で answer.json のカードを書き換えられても、見せていない操作を承認させない＝gen-152 の G3 1巡目）。ブラウザの写しも同じ形
//   Bash のコマンド・ほかの道具の引数（H2b）は、ある時だけ後ろに足す（ファイルのカードの印は前の版と同じ）
export const cardText = c => JSON.stringify([c.tool, c.path, c.outside === true, c.replaceAll === true, c.oldText ?? null, c.newText ?? null, c.content ?? null, c.pattern ?? null,
    ...(c.command != null || c.input != null ? [c.command ?? null, c.input ?? null] : [])]);
// 郵便受けの承認の答えの形（PC はこの形だけを使い、スマホもこの形だけを信じる）: カードの番号（agent-core.js の randomUUID）・
//   cardText の SHA-256（16進）・1つの質問の答えの数の上限
export const PERMISSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const CARD_DIGEST = /^[0-9a-f]{64}$/;
export const MAX_ANSWERS = 50;

// 届け方の値
export const AGENT_PORTS = [47110, 47111, 47112, 47113, 47114];   // PC: ブラウザが探しにくる番号（app/_headers の connect-src と同じ）
export const MAILBOX_BRANCH = 'plainhub-chat';                     // スマホ: 郵便受けのブランチとファイル
export const MAILBOX_FILES = { agent: 'agent.json', question: 'question.json', answer: 'answer.json' };
// 郵便受けで送る画像（IP3）: 画像は question.json に入れず（GitHub が中身を返すのは 1MB まで・2秒ごとの見回りで読み直さない）、この置き場所に
//   1枚ずつ別のファイルとして先に置き、送信には { path, sha, media_type } だけを書く。スマホ（app/js/mailbox-agent.js）が書き、中継役（mailbox.js）が
//   受け取った時に1回だけ読む。max: 1回の送信の枚数（郵便受けは書き込みの予算があるので自前の上限・PC の /ask は Claude Code に任せたまま）。
//   types: 置く形式と拡張子（スマホは縮めた後この形式にする・image-block.js の shrinkImage）
//   maxBytes: 1枚の大きさの上限（バイト・Base64 にして Anthropic の1枚の上限 5MB に収まる・スマホは縮めてこの内にし、中継役はこれより大きいファイルを読まない）
export const MAILBOX_IMAGES = { dir: 'images', max: 4, maxBytes: 3.5 * 1024 * 1024, types: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' } };
// 送信 id の n 枚目（0 から）の置き場所（形式が types に無ければ null）。スマホも中継役もこれで作って比べる（形を2か所に書かない）
export const mailboxImagePath = (id, n, mediaType) => (Object.hasOwn(MAILBOX_IMAGES.types, mediaType) ? `${MAILBOX_IMAGES.dir}/${id}-${n}.${MAILBOX_IMAGES.types[mediaType]}` : null);
export const HEARTBEAT_MS = 10 * 60 * 1000;     // 郵便受けの「生きている印」を書く間隔（ブラウザはこの2倍より古ければ知らせる）

// 人に見せる文（中継役で起きるエラー・言葉は英語の正本）
export const MESSAGES = {
    timeout: `Your agent took longer than ${ASK_TIMEOUT_MS / 60000} minutes, so it stopped this answer. Ask again, perhaps about a smaller part.`,
    too_long: `The answer was longer than ${MAX_ANSWER.toLocaleString('en-US')} characters, so it was cut here.`,
    // 郵便受けにできないリポを断る文（PC の mailbox.js とスマホの mailbox-agent.js で同じ・手順書の困った時の節もこの言葉）。{名前} は mailboxMessage で埋める
    mailbox_public: '{repo} is public. Questions, answers and the files your agent reads would be public. Use a private repository.',
    mailbox_not_own: '{repo} is not your own repository. Use a private repository under your account ({login}/…), so only you can ask your PC questions.',
    // 画面の見た目の操作を行えなかった時に Claude Code へ返す文（AX1）
    action_no_page: 'PlainHub did not run this: the page that asked is closed or did not answer in time. Tell the user, and do not try again unless they ask.',
    action_unknown: 'PlainHub has no answer from the page for this change, so it may or may not have been made. Tell the user to check the repository in PlainHub, and do not try again unless they ask.',
    mailbox_others: 'Other people can write to {repo} ({others}), so they could ask your PC questions. Use a private repository only you can access.',
};
// MESSAGES の文の {名前} を埋める（others は名前の配列 → 3人まで並べて、それより多ければ …。名前が文字でなければ someone）
export const mailboxMessage = (key, vars) => MESSAGES[key].replace(/\{(\w+)\}/g, (_, k) => (k === 'others'
    ? vars.others.slice(0, 3).map(l => (typeof l === 'string' && l ? l : 'someone')).join(', ') + (vars.others.length > 3 ? ', …' : '')
    : String(vars[k])));
