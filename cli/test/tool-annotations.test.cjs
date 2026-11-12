// gen-511: MCP の道具の性質（annotations）を実際の動きどおりに書く（GOAL 順番 MA1）
//   性質を書かない道具は「書き換える・外につなぐかもしれない」と一番悪い方に扱われ、公式の一覧に注意書きが出る
//   ①登録した道具（14）のすべてに title と4つの性質（readOnlyHint・destructiveHint・idempotentHint・openWorldHint）がある・正本は tool-docs.js の TOOL_ANNOTATIONS
//   ②性質が実際の動きと食い違わない: 道具を本当に呼び（同じ引数で2回）、ホームと台帳のファイル・ブラウザを開いたか・Git の remote とのやりとり・外への通信を記録して照らす
//     読むだけ＝何も書かず外につながない／外につながない＝ブラウザ・remote・外への通信が無い（127.0.0.1 は数えない）／
//     壊さない＝今あるファイルを変えも消しもしない／2回呼んでも同じ＝2回目は何も変えない。逆の印（書く・外につなぐ・壊す・2回目も変わる）は、そうなる場面が1つはある
//   ネットワーク不要（外への通信は記録して失敗させる）。ブラウザは開かない（偽の powershell.exe・open・xdg-open が記録するだけ）。MCP の SDK は道具を集めるだけの偽物
//   cli/ の中だけで流せる（PS2b・`cd cli && npm test`）。根の一式からは tests/functions/cli-tool-annotations.test.cjs が呼ぶ
// 実行: node cli/test/tool-annotations.test.cjs   → ALL PASS（exit 0）
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

const { report } = require('./_report.cjs');

if (process.platform === 'win32') report([{ name: 'Windows では流さない（偽のブラウザと git が sh）', ok: true }]);

const CLI_DIR = path.join(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-tool-annotations-'));
process.on('exit', () => fs.rmSync(TMP, { recursive: true, force: true }));   // 途中で落ちても一時フォルダを残さない
const REAL_GIT = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
const KEYS = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'];

// 偽物の SDK と zod を置いた写し。tool(name, description, schema, annotations?, cb) の性質と動かし方を集める
function mcpCopy() {
    const dir = path.join(TMP, 'cli');
    fs.cpSync(path.join(CLI_DIR, 'src'), path.join(dir, 'src'), { recursive: true });
    fs.copyFileSync(path.join(CLI_DIR, 'package.json'), path.join(dir, 'package.json'));
    const sdk = path.join(dir, 'node_modules', '@modelcontextprotocol', 'sdk');
    fs.mkdirSync(path.join(sdk, 'server'), { recursive: true });
    fs.writeFileSync(path.join(sdk, 'package.json'), '{"name":"@modelcontextprotocol/sdk","type":"module"}');
    // 本物の SDK と同じ読み方: 最後が動かし方、説明と引数の形の後ろにもう1つ物があれば性質
    fs.writeFileSync(path.join(sdk, 'server', 'mcp.js'),
        'export class McpServer { tool(name, ...rest) { const cb = rest.pop(); (globalThis.__tools ||= {})[name] = { annotations: rest.length >= 3 ? rest[2] : undefined, cb }; } async connect() {} }\n');
    fs.writeFileSync(path.join(sdk, 'server', 'stdio.js'), 'export class StdioServerTransport {}\n');
    const zod = path.join(dir, 'node_modules', 'zod');
    fs.mkdirSync(zod, { recursive: true });
    fs.writeFileSync(path.join(zod, 'package.json'), '{"name":"zod","type":"module","main":"index.js"}');
    fs.writeFileSync(path.join(zod, 'index.js'),
        'const node = () => new Proxy(function () {}, { get: () => () => node(), apply: () => node() });\nexport const z = node();\n');
    return path.join(dir, 'src', 'mcp-server.js');
}
const MCP = mcpCopy();

// 外につながる動きの記録: ブラウザを開く偽のコマンド・Git の remote とのやりとり（push・pull・fetch など）・外への通信（fetch・http(s)）
const LOG = path.join(TMP, 'events.log');
fs.writeFileSync(LOG, '');
const BIN = path.join(TMP, 'bin');
fs.mkdirSync(BIN);
for (const b of ['powershell.exe', 'open', 'xdg-open']) {
    fs.writeFileSync(path.join(BIN, b), `#!/bin/sh\necho "browser ${b}" >> "${LOG}"\nexit 0\n`, { mode: 0o755 });
}
fs.writeFileSync(path.join(BIN, 'git'), `#!/bin/sh
sub=""; skip=0
for a in "$@"; do
  if [ $skip = 1 ]; then skip=0; continue; fi
  case "$a" in -C|-c) skip=1 ;; -*) ;; *) sub="$a"; break ;; esac
done
case "$sub" in push|pull|fetch|ls-remote|clone|remote-https) echo "git $sub" >> "${LOG}" ;; esac
exec "${REAL_GIT}" "$@"
`, { mode: 0o755 });
const PRELOAD = path.join(TMP, 'net.mjs');
fs.writeFileSync(PRELOAD, `import fs from 'fs'; import { createRequire, syncBuiltinESMExports } from 'module';
const log = (w) => fs.appendFileSync(${JSON.stringify(LOG)}, 'net ' + w + '\\n');
const local = (h) => /^(127\\.0\\.0\\.1|localhost|::1|\\[::1\\])$/.test(String(h || ''));
globalThis.fetch = async (u) => { const h = new URL(String(u?.url ?? u)).hostname; if (!local(h)) log(h); throw new TypeError('fetch failed (network is off in this test)'); };
const require = createRequire(import.meta.url);
for (const m of ['http', 'https']) {
  const mod = require(m);
  for (const k of ['request', 'get']) { const orig = mod[k]; mod[k] = function (o, ...r) { const h = typeof o === 'string' || o instanceof URL ? new URL(String(o)).hostname : (o?.hostname ?? o?.host); if (!local(h)) { log(m + '://' + h); throw new Error('network is off in this test'); } return orig.call(this, o, ...r); }; }
}
syncBuiltinESMExports();
`);

const git = (cwd, ...args) => {
    const r = spawnSync(REAL_GIT, args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't' } });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
    return r.stdout.trim();
};
const OLD_TOKEN = 'github_pat_' + 'A'.repeat(40);
const NEW_TOKEN = 'github_pat_' + 'B'.repeat(40);

// 場面ごとに新しいホーム（保存した鍵あり）と台帳（GitHub の名前の remote を指す Git のリポ・remote はローカルの bare）
let n = 0;
function prepare({ fresh = false, remoteChange = false } = {}) {
    const root = path.join(TMP, `s${++n}`);
    const home = path.join(root, 'home');
    fs.mkdirSync(path.join(home, '.config', 'plainhub'), { recursive: true });
    fs.writeFileSync(path.join(home, '.config', 'plainhub', 'token'), OLD_TOKEN + '\n', { mode: 0o600 });
    const remote = path.join(root, 'remote.git');
    git(root, 'init', '-q', '--bare', '-b', 'main', remote);
    const ledger = path.join(root, 'ledger');
    git(root, 'init', '-q', '-b', 'main', ledger);
    git(ledger, 'remote', 'add', 'origin', remote);
    git(ledger, 'config', 'user.name', 't');
    git(ledger, 'config', 'user.email', 't');   // メールの住所の形は書かない（cli/test は公開リポに出る・公開前の検査が止める）
    fs.writeFileSync(path.join(ledger, 'README.md'), 'hello\n');
    if (!fresh) {
        const r = call(home, ledger, [['plainhub_ledger_init', { language: 'en' }],
            ['plainhub_post', { thread: 'fix-login-timeout', role: 'dev', verdict: 'info', summary: 'Started: keep users signed in' }],
            ['plainhub_decide', { id: '2026-10-08-ship-login-fix', summary: 'Ship the login fix?' }]]);
        if (r.errors.length) throw new Error(`台帳の用意: ${r.errors.join(' / ')}`);
    }
    git(ledger, 'add', '-A');
    git(ledger, 'commit', '-q', '-m', 'start');
    git(ledger, 'push', '-q', '-u', 'origin', 'main');
    // 相手が発言を消し、.agents の外のファイルを書き換えて送ってある（受け取ると手元でも消える・変わる）
    if (remoteChange) {
        const other = path.join(root, 'other');
        git(root, 'clone', '-q', remote, other);
        fs.rmSync(path.join(other, '.agents', 'threads', 'fix-login-timeout', '01-dev.md'));
        fs.writeFileSync(path.join(other, 'README.md'), 'changed by someone else\n');
        git(other, 'commit', '-q', '-am', 'remove a message');
        git(other, 'push', '-q', 'origin', 'main');
    }
    fs.writeFileSync(LOG, '');
    return { home, ledger, remote };
}

// 子のプロセスで mcp-server.js を読み込み、道具を順に呼ぶ（呼ぶたびに、その後のファイルの写しと記録を返す）
function call(home, ledger, calls) {
    const code = `await import(${JSON.stringify(pathToFileURL(MCP).href)});
const fs = await import('fs'); const path = await import('path');
const snap = () => { const out = {}; for (const base of [process.env.HOME, process.env.PLAINHUB_LEDGER]) { const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.name === '.git' && d === process.env.PLAINHUB_LEDGER) continue; if (e.isDirectory()) walk(p); else out[p] = fs.readFileSync(p, 'utf8'); } }; walk(base); } return out; };
const start = snap();
const steps = [];
for (const [name, args] of JSON.parse(process.argv[1])) {
  let error = null;
  try { const r = await globalThis.__tools[name].cb(args); if (r?.isError) error = r.content.map((c) => c.text).join(' '); } catch (e) { error = e.message; }
  steps.push({ files: snap(), events: fs.readFileSync(${JSON.stringify(LOG)}, 'utf8'), error });
}
process.stdout.write(JSON.stringify({ start, annotations: Object.fromEntries(Object.entries(globalThis.__tools).map(([k, v]) => [k, v.annotations ?? null])), steps }));`;
    const r = spawnSync(process.execPath, ['--import', pathToFileURL(PRELOAD).href, '--input-type=module', '-e', code, JSON.stringify(calls)],
        { env: { HOME: home, PATH: `${BIN}:${process.env.PATH}`, PLAINHUB_LEDGER: ledger, GIT_CONFIG_NOSYSTEM: '1' }, cwd: ledger, encoding: 'utf8', timeout: 60000 });
    if (r.status !== 0) throw new Error(`mcp-server.js を動かせない: ${(r.stderr || '').slice(0, 400)}`);
    const out = JSON.parse(r.stdout);
    return { ...out, errors: out.steps.map((s) => s.error).filter(Boolean) };
}
const remoteHead = (remote) => git(remote, 'rev-parse', 'main');

// 道具ごとの場面（引数・用意）。逆の印の確かめは、その道具のどれかの場面で起きれば足りる
const SCENES = [
    ['plainhub_open', { repo: 'octocat/hello-world', path: 'README.md' }],
    ['plainhub_open', { theme: 'dark' }],
    ['plainhub_auth', {}],
    ['plainhub_auth', { token: NEW_TOKEN }],
    ['plainhub_auth_status', {}],
    ['plainhub_browse', { repo: 'octocat/hello-world' }],
    ['plainhub_diff', { repo: 'octocat/hello-world', sha: '1a2b3c4' }],
    ['plainhub_post', { thread: 'fix-login-timeout', role: 'reviewer', verdict: 'pass', summary: 'Passed: the login test' }],
    ['plainhub_decide', { id: '2026-10-09-ship-docs', summary: 'Ship the docs?' }],
    ['plainhub_ledger_init', { language: 'en' }, { fresh: true }],
    ['plainhub_ledger_sync', {}, { before: [['plainhub_post', { thread: 'fix-login-timeout', role: 'dev', verdict: 'info', summary: 'Committed: the fix' }]] }],
    ['plainhub_ledger_sync', {}, { remoteChange: true }],
    ['plainhub_ledger_decisions', {}],
    ['plainhub_ledger_thread', { thread: 'fix-login-timeout' }],
    ['plainhub_ledger_tasks', {}],
    ['plainhub_ledger_read', { path: 'threads/fix-login-timeout/01-dev.md' }],
    ['plainhub_agent_check', {}],
];

const results = [];
const check = (name, fn) => {
    try { results.push({ name, ok: true, detail: fn() }); }
    catch (e) { results.push({ name, ok: false, detail: e.message }); }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

// 場面を動かして、呼ぶ前・1回目の後・2回目の後を比べる
const seen = {};
const runs = SCENES.map(([tool, args, opts = {}]) => {
    const env = prepare(opts);
    const pre = (opts.before || []).length ? call(env.home, env.ledger, opts.before) : null;
    if (pre?.errors.length) throw new Error(`${tool} の用意: ${pre.errors.join(' / ')}`);
    fs.writeFileSync(LOG, '');
    const h0 = remoteHead(env.remote);
    const r = call(env.home, env.ledger, [[tool, args], [tool, args]]);
    const [s1, s2] = r.steps;
    const f0 = r.start;
    const ev1 = s1.events.split('\n').filter(Boolean);
    const ev2 = s2.events.split('\n').filter(Boolean).slice(ev1.length);
    const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((p) => a[p] !== b[p]);
    const run = {
        tool, args, annotations: r.annotations, error: s1.error,
        written1: changed(f0, s1.files),
        written2: changed(s1.files, s2.files),
        lost: Object.keys(f0).filter((p) => s1.files[p] !== f0[p]).concat(Object.keys(s1.files).filter((p) => s2.files[p] !== s1.files[p])),
        ev1, ev2, pushed: remoteHead(env.remote) !== h0,
    };
    (seen[tool] ||= []).push(run);
    return run;
});
const ann = runs[0].annotations;
const short = (p) => p.replace(TMP, '');
const label = (r) => `${r.tool} ${JSON.stringify(r.args)}`;

check('①登録した道具（14）のすべてに title と4つの性質がある（true か false・書かない欄が無い）', () => {
    const names = Object.keys(ann);
    expect(names.length === 14, `道具の数: ${names.length}`);
    const bad = names.filter((n) => !ann[n] || typeof ann[n].title !== 'string' || !ann[n].title.trim() || KEYS.some((k) => typeof ann[n][k] !== 'boolean'));
    expect(!bad.length, `性質が無い・足りない: ${bad.map((n) => `${n}=${JSON.stringify(ann[n])}`).join(' / ')}`);
    expect(names.every((n) => seen[n]), `場面の無い道具: ${names.filter((n) => !seen[n]).join(', ')}`);
    return `${names.length} tools`;
});

check('①性質の正本は tool-docs.js の TOOL_ANNOTATIONS（登録はそれを渡すだけ）', () => {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', `const m = await import(${JSON.stringify(pathToFileURL(path.join(CLI_DIR, 'src', 'tool-docs.js')).href)}); process.stdout.write(JSON.stringify(m.TOOL_ANNOTATIONS ?? null));`], { encoding: 'utf8', env: {} });
    const docs = JSON.parse(r.stdout || 'null');
    expect(docs && typeof docs === 'object', 'tool-docs.js に TOOL_ANNOTATIONS が無い');
    const differ = Object.keys(ann).filter((n) => JSON.stringify(docs[n]) !== JSON.stringify(ann[n]));
    expect(!differ.length, `登録の性質が TOOL_ANNOTATIONS と違う: ${differ.join(', ')}`);
    const extra = Object.keys(docs).filter((n) => !Object.hasOwn(ann, n));
    expect(!extra.length, `登録していない道具の性質: ${extra.join(', ')}`);
    const src = fs.readFileSync(path.join(CLI_DIR, 'src', 'mcp-server.js'), 'utf8');
    expect(!/readOnlyHint|openWorldHint|destructiveHint|idempotentHint/.test(src), 'mcp-server.js に性質を直接書いている');
    return 'ok';
});

check('②どの場面も道具がふつうに動いた（失敗の結果を性質の確かめに使わない）', () => {
    const failed = runs.filter((r) => r.error);
    expect(!failed.length, failed.map((r) => `${label(r)}: ${r.error.slice(0, 160)}`).join(' / '));
    return `${runs.length} scenes`;
});

check('②読むだけ（readOnlyHint: true）の道具は、何も書かず・ブラウザを開かず・外につながない', () => {
    const bad = runs.filter((r) => ann[r.tool]?.readOnlyHint !== false && (r.written1.length || r.written2.length || r.ev1.length || r.ev2.length || r.pushed));
    expect(!bad.length, bad.map((r) => `${label(r)}: ${[...r.written1, ...r.written2].map(short).concat(r.ev1, r.ev2).join(', ')}`).join(' / '));
    return Object.keys(ann).filter((n) => ann[n]?.readOnlyHint).join(', ');
});

check('②書く・動かす（readOnlyHint: false）道具は、そうなる場面がある（ファイルを書く・ブラウザを開く・外につなぐ）', () => {
    const bad = Object.keys(ann).filter((n) => ann[n]?.readOnlyHint === false && !seen[n].some((r) => r.written1.length || r.ev1.length || r.pushed));
    expect(!bad.length, `何も変えないのに読むだけの印が無い: ${bad.join(', ')}`);
    return 'ok';
});

check('②外につながない（openWorldHint: false）道具は、ブラウザを開かず・Git の remote とやりとりせず・外に通信しない（127.0.0.1 は数えない）', () => {
    const bad = runs.filter((r) => ann[r.tool]?.openWorldHint !== true && (r.ev1.length || r.ev2.length || r.pushed));
    expect(!bad.length, bad.map((r) => `${label(r)}: ${[...r.ev1, ...r.ev2].join(', ')}${r.pushed ? ' push' : ''}`).join(' / '));
    return 'ok';
});

check('②外につなぐ（openWorldHint: true）道具は、そうなる場面がある', () => {
    const bad = Object.keys(ann).filter((n) => ann[n]?.openWorldHint === true && !seen[n].some((r) => r.ev1.length || r.pushed));
    expect(!bad.length, `外につながないのに外につなぐ印: ${bad.join(', ')}`);
    return Object.keys(ann).filter((n) => ann[n]?.openWorldHint).map((n) => `${n}: ${[...new Set(seen[n].flatMap((r) => r.ev1))].join('・')}`).join(' / ');
});

check('②壊さない（destructiveHint: false）道具は、今あるファイルを変えも消しもしない（足すだけ）', () => {
    const bad = runs.filter((r) => ann[r.tool]?.destructiveHint !== true && r.lost.length);
    expect(!bad.length, bad.map((r) => `${label(r)}: ${r.lost.map(short).join(', ')}`).join(' / '));
    return 'ok';
});

check('②壊しうる（destructiveHint: true）道具は、今あるファイルを置き換える・消す場面がある（plainhub_auth: 保存した鍵を新しい鍵に・plainhub_ledger_sync: 相手が消した発言が手元でも消える）', () => {
    const bad = Object.keys(ann).filter((n) => ann[n]?.destructiveHint === true && !seen[n].some((r) => r.lost.length));
    expect(!bad.length, `今あるファイルを変えないのに壊しうる印: ${bad.join(', ')}`);
    return Object.keys(ann).filter((n) => ann[n]?.destructiveHint).join(', ');
});

check('②2回呼んでも同じ（idempotentHint: true）道具は、同じ引数の2回目に何も変えない', () => {
    const bad = runs.filter((r) => ann[r.tool]?.idempotentHint === true && (r.written2.length || r.ev2.length));
    expect(!bad.length, bad.map((r) => `${label(r)}: ${r.written2.map(short).concat(r.ev2).join(', ')}`).join(' / '));
    return 'ok';
});

check('②2回目も変わる（idempotentHint: false）道具は、そうなる場面がある', () => {
    const bad = Object.keys(ann).filter((n) => ann[n]?.idempotentHint === false && !seen[n].some((r) => r.written2.length || r.ev2.length));
    expect(!bad.length, `2回目は何も変えないのに印が false: ${bad.join(', ')}`);
    return 'ok';
});

report(results);
