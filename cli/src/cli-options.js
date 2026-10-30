// PlainHub CLI - open のオプションの定義（SSOT・gen-374・GOAL 順番 DS3b）
//   plainhub --help の Options・open の読み取り（cli.js）・公開リポの docs/CLI.md と docs/ja/CLI.md のオプションの表（tools/site-build/build.mjs）は全部ここから作る。
//   オプションや範囲を足す・変える時はここだけ変える（docs に手で写さない＝表は node tools/site-build/build.mjs で書き直す）
//   key: 値を取るオプション（options[key] に入れる・core.js の PARAMS の名前）／set: 値を取らないオプション（open の状態を変える）
//   value: 表の「値」の列（英日で違えば { en, ja }）／usage: --help の1行／en・ja: 表の「説明」の列
//   表の文: Markdown の記号（[ ] ` * _ ~ | \）・URL・< > & @・改行は書かない（表を崩す・リンクを足す・ビルドが止める）
//   依存なし（試験とビルドが別のプロセスで読む）

// フォントの大きさの範囲（--help と表の両方に出す1か所）
const FONT_SIZE = { min: 10, max: 32 };

/** @public 読むのは cli.js と tools/site-build/build.mjs（別のプロセスで import する＝knip には見えない） */
export const OPEN_OPTIONS = [
    { flags: ['-r', '--repo'], key: 'repo', value: 'owner/name', usage: 'Repository (owner/name)', en: 'Repository', ja: 'リポジトリ指定' },
    { flags: ['-b', '--branch'], key: 'branch', value: 'string', usage: 'Git branch name', en: 'Git branch', ja: 'Git ブランチ指定' },
    { flags: ['-l', '--line'], key: 'line', value: { en: 'number', ja: '数値' }, usage: 'Jump to line number', en: 'Jump to line', ja: '行番号ジャンプ' },
    { flags: ['-n'], set: { noOpen: true }, value: '', usage: "Print URL only (don't open browser)", en: "Print URL only (don't open browser)", ja: 'URL のみ出力（ブラウザを開かない）' },
    { flags: ['--theme'], key: 'theme', value: 'dark/light', usage: 'Theme (dark/light)', en: 'Editor theme', ja: 'エディタテーマ' },
    { flags: ['--preview'], key: 'preview', value: 'on/off', usage: 'Markdown preview (on/off)', en: 'Markdown preview', ja: 'Markdown プレビュー' },
    { flags: ['--scroll'], key: 'scroll', value: 'string', usage: 'Scroll to heading in preview (section name)', en: 'Scroll to a heading in preview', ja: 'プレビューの見出しにスクロール' },
    { flags: ['--sidebar'], key: 'sidebar', value: 'on/off', usage: 'Show sidebar (on/off)', en: 'Sidebar visibility', ja: 'サイドバー表示' },
    { flags: ['--fontSize'], key: 'fontSize', value: `${FONT_SIZE.min}-${FONT_SIZE.max}`, usage: `Font size (${FONT_SIZE.min}-${FONT_SIZE.max})`, en: 'Font size', ja: 'フォントサイズ' },
    { flags: ['--lineNumbers'], key: 'lineNumbers', value: 'on/off', usage: 'Show line numbers (on/off)', en: 'Line numbers', ja: '行番号表示' },
    { flags: ['--whitespace'], key: 'whitespace', value: 'on/off', usage: 'Show whitespace (on/off)', en: 'Whitespace characters', ja: '不可視文字表示' },
    { flags: ['--header'], key: 'header', value: 'on/off', usage: 'Show header (on/off)', en: 'Header visibility', ja: 'ヘッダー表示' },
    { flags: ['--with-auth'], set: { noAuth: false }, value: '', usage: 'Pass saved CLI token to browser (default: off)', en: 'Pass the saved token to the browser (off by default)', ja: '保存したトークンをブラウザに渡す（既定はオフ）' },
    { flags: ['--no-auth'], set: { noAuth: true }, value: '', usage: "Don't pass CLI token (default)", en: "Don't pass the saved token (default)", ja: '保存したトークンを渡さない（既定）' },
];

// --help の Options の行（左の欄の幅は今の --help と同じ 16 文字）
export function openOptionsUsage() {
    return OPEN_OPTIONS.map(o => `  ${o.flags.join(', ').padEnd(16)}${o.usage}`).join('\n');
}

// open の引数の1つを読む: 値を取るオプションは options に入れて次の位置を返す。知らない引数は null
export function readOpenOption(args, i, options, state) {
    const o = OPEN_OPTIONS.find(x => x.flags.includes(args[i]));
    if (!o) return null;
    if (o.key) {
        options[o.key] = args[i + 1];
        return i + 1;
    }
    Object.assign(state, o.set);
    return i;
}
