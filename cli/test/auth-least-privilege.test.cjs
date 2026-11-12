// gen-120: CLI・MCP のログインを最小の権限に（GOAL 順番 MC2）
//   前は plainhub auth・plainhub_auth が古い型の鍵（tokens/new?scopes=repo＝全リポに全権限）を案内していた＝アプリ本体の「選んだリポだけ」と食い違い
//   ①案内する画面は fine-grained の鍵（選んだリポだけ・中身の読み書きだけ）②古い型の鍵・gh の鍵も今までどおり保存できるが、全リポに届くと一言
//   ③選んだリポだけの鍵（github_pat_）では一言を出さない ④--from-gh は残す
//   ブラウザは偽の xdg-open（渡された URL を書き残すだけ）・gh も偽物・トークンは一時の HOME。ネットワーク不要。MCP の SDK は偽物で置き換えて動かす
// 実行: node cli/test/auth-least-privilege.test.cjs（cli/ の中では npm test）   → ALL PASS（exit 0）
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { report } = require('./_report.cjs');

const CLI_DIR = path.join(__dirname, '..');
const CLI = path.join(CLI_DIR, 'src', 'cli.js');
const CLASSIC = 'ghp_gen120classic00000000000000000000';
const FINE = 'github_pat_gen120fine_000000000000000000000000';
const GH = 'gho_gen120ghcli0000000000000000000000';

// 偽の GitHub（YA5）: 本物の api.github.com を呼ばない。--require で fetch を置き換え、決めた答えを返して、呼ばれた所と鍵を書き残す
//   api: { status, user, scopes, repos（/user/repos の全部・100件ずつ返す）} か 'down'（届かない）。既定は選んだリポだけの鍵（非公開リポ3つのうち1つ）
const DEFAULT_API = { status: 200, user: { login: 'you', owned_private_repos: 3 }, scopes: null, repos: [{ private: true, owner: { login: 'you' } }] };
const FAKE_FETCH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'auth-least-fetch-')), 'fake-fetch.cjs');
fs.writeFileSync(FAKE_FETCH, `const fs = require('fs');
const api = JSON.parse(process.env.FAKE_GH);
globalThis.fetch = async (url, opts = {}) => {
    fs.appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify({ url: String(url), auth: opts.headers && opts.headers.Authorization }) + '\\n');
    if (api === 'down') throw new TypeError('fetch failed');
    const u = new URL(url);
    if (u.origin !== 'https://api.github.com') throw new TypeError('not GitHub');
    const reply = (status, body, scopes) => new Response(JSON.stringify(body), { status, headers: scopes == null ? {} : { 'x-oauth-scopes': scopes } });
    if (u.pathname === '/user') return reply(api.status, api.status === 200 ? api.user : { message: 'Bad credentials' }, api.scopes);
    if (u.pathname === '/user/repos') {
        const page = Number(u.searchParams.get('page') || 1);
        return reply(200, (api.repos || []).slice((page - 1) * 100, page * 100));
    }
    return reply(404, { message: 'Not Found' });
};
`);

function sandbox({ gh, api = DEFAULT_API } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-least-'));
    const bin = path.join(dir, 'bin');
    const home = path.join(dir, 'home');
    fs.mkdirSync(bin);
    fs.mkdirSync(home);
    const log = path.join(dir, 'opened.log');
    fs.writeFileSync(path.join(bin, 'xdg-open'), `#!/bin/sh\nprintf '%s\\n' "$1" >> '${log}'\n`, { mode: 0o755 });
    if (gh) fs.writeFileSync(path.join(bin, 'gh'), `#!/bin/sh\necho '${gh}'\n`, { mode: 0o755 });
    const apiLog = path.join(dir, 'api.log');
    return {
        home, bin,
        env: { HOME: home, PATH: bin, FAKE_GH: JSON.stringify(api), FAKE_GH_LOG: apiLog },
        calls: () => (fs.existsSync(apiLog) ? fs.readFileSync(apiLog, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []),
        opened: () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []),
        saved: () => { try { return fs.readFileSync(path.join(home, '.config', 'plainhub', 'token'), 'utf8').trim(); } catch { return null; } },
    };
}
function cli(args, { input, box = sandbox() } = {}) {
    const r = spawnSync(process.execPath, ['--require', FAKE_FETCH, CLI, ...args], { env: box.env, input, encoding: 'utf8', timeout: 15000 });
    return { code: r.status, out: r.stdout, all: r.stdout + r.stderr, opened: box.opened(), saved: box.saved(), calls: box.calls() };
}

// MCP: 本物の SDK の代わりに、道具と説明を集めるだけの偽物を置いた写しで mcp-server.js を読み込み、道具を直接呼ぶ（open-target.test.cjs と同じ）
function mcpCopy() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-least-mcp-'));
    fs.cpSync(path.join(CLI_DIR, 'src'), path.join(dir, 'src'), { recursive: true });
    fs.copyFileSync(path.join(CLI_DIR, 'package.json'), path.join(dir, 'package.json'));
    const sdk = path.join(dir, 'node_modules', '@modelcontextprotocol', 'sdk');
    fs.mkdirSync(path.join(sdk, 'server'), { recursive: true });
    fs.writeFileSync(path.join(sdk, 'package.json'), '{"name":"@modelcontextprotocol/sdk","type":"module"}');
    fs.writeFileSync(path.join(sdk, 'server', 'mcp.js'),
        'export class McpServer { tool(name, d, ...r) { (globalThis.__tools ||= {})[name] = r.at(-1); (globalThis.__desc ||= {})[name] = d; } async connect() {} }\n');
    fs.writeFileSync(path.join(sdk, 'server', 'stdio.js'), 'export class StdioServerTransport {}\n');
    const zod = path.join(dir, 'node_modules', 'zod');
    fs.mkdirSync(zod, { recursive: true });
    fs.writeFileSync(path.join(zod, 'package.json'), '{"name":"zod","type":"module","main":"index.js"}');
    // describe の文も集める（道具の引数の説明に古い案内が残っていないか）
    fs.writeFileSync(path.join(zod, 'index.js'),
        'const chain = new Proxy(function () {}, { get: (_t, k) => k === "describe" ? (s) => ((globalThis.__args ||= []).push(s), chain) : () => chain, apply: () => chain });\nexport const z = chain;\n');
    return path.join(dir, 'src', 'mcp-server.js');
}
const MCP = mcpCopy();
function mcp(tool, params, { box = sandbox() } = {}) {
    const code = `await import(${JSON.stringify(require('url').pathToFileURL(MCP).href)});
const r = await globalThis.__tools[${JSON.stringify(tool)}](${JSON.stringify(params)});
process.stdout.write(JSON.stringify({ r, desc: globalThis.__desc[${JSON.stringify(tool)}], args: globalThis.__args }));`;
    const r = spawnSync(process.execPath, ['--require', FAKE_FETCH, '--input-type=module', '-e', code], { env: box.env, encoding: 'utf8', timeout: 15000 });
    if (r.status !== 0) throw new Error(`MCP の道具が例外: ${r.stderr.slice(0, 400)}`);
    const { r: res, desc, args } = JSON.parse(r.stdout);
    return { res, desc, args, text: res.content.map(c => c.text).join('\n'), opened: box.opened(), saved: box.saved() };
}

// 案内する画面が「選んだリポだけ・中身の読み書きだけ」の鍵の作成か
function isLeastPrivilegeUrl(s) {
    const u = new URL(s);
    if (u.origin !== 'https://github.com' || u.pathname !== '/settings/personal-access-tokens/new') return `行き先が fine-grained の作成画面でない: ${s}`;
    if (u.searchParams.has('scopes')) return `古い型の scopes が付いている: ${s}`;
    if (u.searchParams.get('contents') !== 'write') return `中身の読み書き（contents=write）が選ばれていない: ${s}`;
    const known = new Set(['name', 'description', 'target_name', 'expires_in', 'contents', 'metadata']);
    const extra = [...u.searchParams.keys()].filter(k => !known.has(k));
    if (extra.length) return `中身の読み書きより多い権限を求めている: ${extra.join(', ')}`;
    if ((u.searchParams.get('name') || '').length > 40) return '名前が GitHub の上限（40文字）を超える';
    return null;
}

(async () => {
    const results = [];
    const check = async (name, fn) => {
        try { results.push({ name, ok: true, detail: await fn() }); }
        catch (e) { results.push({ name, ok: false, detail: e.message }); }
    };
    const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

    await check('plainhub auth: 開く画面は fine-grained の鍵（選んだリポだけ・中身の読み書きだけ）で、リポの選び方を案内する', () => {
        const o = cli(['auth'], { input: FINE + '\n' });
        expect(o.opened.length === 1, `ブラウザで開いた数: ${o.opened.length}`);
        const bad = isLeastPrivilegeUrl(o.opened[0]);
        expect(!bad, bad);
        expect(/Only select repositories/.test(o.out), `リポの選び方の案内が無い: ${o.out}`);
        expect(!/"repo" scope/.test(o.all), `古い案内（"repo" scope）が残っている: ${o.all}`);
        expect(o.out.includes(o.opened[0]), `ブラウザが開かない時のための URL が出ていない: ${o.out}`);
        return o.opened[0];
    });

    await check('plainhub auth: 選んだリポだけの鍵（github_pat_）は保存し、注意の一言は出さない', () => {
        const o = cli(['auth'], { input: FINE + '\n' });
        expect(o.code === 0 && o.saved === FINE, `保存されない: ${o.all}`);
        expect(!/Note:/.test(o.out), `余計な注意が出た: ${o.out}`);
        return 'saved';
    });

    await check('plainhub auth: 鍵をパイプで渡せる（echo … | plainhub auth）・改行が無くても・CRLF でも、その鍵だけを保存する', () => {
        for (const input of [FINE + '\n', FINE, FINE + '\r\n', FINE + '\nextra\n']) {
            const o = cli(['auth'], { input });
            expect(o.code === 0 && o.saved === FINE, `${JSON.stringify(input.slice(-8))}: ${o.saved} / ${o.all.slice(-200)}`);
        }
        return '4 通り';
    });

    // YA5 から: repo・public_repo の付いた古い型の鍵は全部のリポに書ける＝保存しない（下の YA5 の試験）。付いていない古い型の鍵は今までどおり保存して一言
    await check('plainhub auth: 古い型の鍵（ghp_・repo の権限なし）は保存するが、全リポに届くことと、選んだリポだけの鍵の作り方を一言', () => {
        const o = cli(['auth'], { input: CLASSIC + '\n', box: sandbox({ api: { ...DEFAULT_API, scopes: 'read:user, gist' } }) });
        expect(o.code === 0 && o.saved === CLASSIC, `保存されない（今までの鍵が使えなくなる）: ${o.all}`);
        expect(/classic token/.test(o.out) && /every repository/.test(o.out), `全リポに届く注意が無い: ${o.out}`);
        const url = (o.out.match(/https:\/\/github\.com\/settings\/[^\s)]+/g) || []).pop();
        expect(url && !isLeastPrivilegeUrl(url), `注意の中の行き先が選んだリポだけの鍵でない: ${url}`);
        expect(!o.out.includes(CLASSIC), '鍵そのものを表示した');
        return 'saved + note';
    });

    await check('plainhub auth: 形の違う値は保存しない（エラーに受け付ける形を出す）', () => {
        const o = cli(['auth'], { input: 'not-a-token\n' });
        expect(o.code === 1 && o.saved === null, `保存された: ${o.all}`);
        expect(/github_pat_/.test(o.all), `受け付ける形の説明が無い: ${o.all}`);
        return 'rejected';
    });

    // YA5（2026-11-05 実測）: 作成画面の Repository access の初期値が All repositories で、案内の1文を読み落とすと全部のリポに書ける鍵ができた
    //   → 貼られた鍵を GitHub に聞き、全部のリポに書けるなら保存せず理由と作り直し方を出す（鍵の値は出さない）
    const PRIVATE = n => Array.from({ length: n }, () => ({ private: true, owner: { login: 'You' } }));
    const ALL_FINE = { status: 200, user: { login: 'you', owned_private_repos: 150 }, scopes: null, repos: PRIVATE(150) };
    const ALL_CASES = [
        ['fine-grained・All repositories（非公開リポ150個の全部に届く・2ページ）', FINE, ALL_FINE, /all 150 private repositories/],
        ['fine-grained・All repositories（非公開リポ3個）', FINE, { ...ALL_FINE, user: { login: 'you', owned_private_repos: 3 }, repos: PRIVATE(3) }, /all 3 private repositories/],
        ['古い型・repo', CLASSIC, { ...DEFAULT_API, scopes: 'read:user, repo' }, /"repo" scope/],
        ['古い型・public_repo', CLASSIC, { ...DEFAULT_API, scopes: 'public_repo' }, /"public_repo" scope/],
        ['gh の鍵を貼った・repo', GH, { ...DEFAULT_API, scopes: 'gist, read:org, repo, workflow' }, /"repo" scope/],
    ];
    await check('YA5 plainhub auth: 全部のリポに書ける鍵は保存せず、理由と「Only select repositories」で作り直す道を出す（鍵の値は出さない）', () => {
        for (const [name, token, api, why] of ALL_CASES) {
            const o = cli(['auth'], { input: token + '\n', box: sandbox({ api }) });
            expect(o.code === 1 && o.saved === null, `${name}: 保存された（exit ${o.code}）: ${o.all.slice(-300)}`);
            expect(/Not saved/.test(o.all) && why.test(o.all), `${name}: 理由が出ない: ${o.all.slice(-300)}`);
            expect(/Only select repositories/.test(o.all.split('Paste your GitHub token')[1] || '') && o.all.includes('https://github.com/settings/personal-access-tokens/new?'), `${name}: 作り直す道が無い: ${o.all.slice(-300)}`);
            expect(!o.all.includes(token), `${name}: 鍵そのものを表示した`);
        }
        return `${ALL_CASES.length} 通りを保存しない`;
    });

    await check('YA5 plainhub auth: 鍵は api.github.com にだけ送り、選んだリポだけの鍵（非公開リポの一部・2個以下）は保存する', () => {
        const o = cli(['auth'], { input: FINE + '\n', box: sandbox({ api: { ...ALL_FINE, repos: PRIVATE(149) } }) });
        expect(o.code === 0 && o.saved === FINE && !/Note:|Could not check/.test(o.out), `150個のうち149個: ${o.all.slice(-300)}`);
        expect(o.calls.length >= 2 && o.calls.every(c => c.url.startsWith('https://api.github.com/') && c.auth === 'Bearer ' + FINE), `問い合わせ: ${JSON.stringify(o.calls).replace(FINE, '<鍵>')}`);
        // 見分けられない時（非公開リポが2つ以下・組織の鍵＝自分の非公開リポに届かない）は保存して「Only select repositories を選んだか」の一言（gen-505 G2 中・G3 低-1）
        for (const [name, api] of [['メモと郵便受けの2つ', { ...ALL_FINE, user: { login: 'you', owned_private_repos: 2 }, repos: PRIVATE(2) }],
            ['非公開リポなし', { ...ALL_FINE, user: { login: 'you', owned_private_repos: 0 }, repos: [] }],
            ['組織の鍵', { ...ALL_FINE, user: { login: 'you', owned_private_repos: 5 }, repos: [] }]]) {
            const o2 = cli(['auth'], { input: FINE + '\n', box: sandbox({ api }) });
            const after = o2.out.split('Token saved')[1] || '';
            expect(o2.code === 0 && o2.saved === FINE && /cannot tell/.test(after) && /Only select repositories/.test(after), `${name}: ${o2.all.slice(-300)}`);
        }
        return 'ok';
    });

    await check('YA5 確かめられない時の一言は鍵の型で分ける: 古い型は「選べない・fine-grained が安全」で、Only select repositories を勧めない（gen-505 G3 低-3）', () => {
        const o = cli(['auth'], { input: CLASSIC + '\n', box: sandbox({ api: 'down' }) });
        const after = o.out.split('Token saved')[1] || '';
        expect(o.code === 0 && o.saved === CLASSIC && /Could not check/.test(after) && /classic token/.test(after) && !/Only select repositories/.test(after), `古い型: ${o.all.slice(-300)}`);
        return 'ok';
    });

    await check('YA5 GitHub が答えない時の待ちは全部で1つの上限（ページを何枚めくっても上限を超えない・gen-505 G3 低-2）', () => {
        // 偽の GitHub はどの問い合わせにも 300ms で答える（待ちの途中で上限が来たらそこで切れる）。全部で1つの上限（1000ms）なら、
        //   4回目（900ms〜）の途中で切れて 4回まで。1回ごとの上限や上限なしなら、1回ずつは間に合うので /user と 10 ページの 11 回を全部めくる。
        //   回数で見る（gen-516: 前は経った時間 < 1000ms で見ていて、上限 700ms との差 300ms を重い関門で超えて落ちた。
        //   上限の時計は絶対の時刻なので、機械が重くて答えが遅れると回数は減るだけで、4回を超えることは無い）
        const code = `const { tokenReach } = await import(${JSON.stringify(require('url').pathToFileURL(path.join(CLI_DIR, 'src', 'core.js')).href)});
let calls = 0;
const fetch = (url, { signal }) => { calls++; const u = new URL(url); const body = u.pathname === '/user' ? { login: 'you', owned_private_repos: 5000 } : Array.from({ length: 100 }, () => ({ private: true, owner: { login: 'x' } }));
  return new Promise((res, rej) => { if (signal?.aborted) return rej(signal.reason);
    const t = setTimeout(() => res(new Response(JSON.stringify(body), { status: 200 })), 300);
    signal?.addEventListener('abort', () => { clearTimeout(t); rej(signal.reason); }, { once: true }); }); };
const t = Date.now(); const r = await tokenReach('${FINE}', { fetch, timeoutMs: 1000 });
process.stdout.write(JSON.stringify({ r, ms: Date.now() - t, calls }));`;
        const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8', timeout: 15000 });
        const { r: res, ms, calls } = JSON.parse(r.stdout || '{}');
        expect(res && res.verdict === 'unknown' && calls >= 1 && calls <= 4, `上限で切れずにめくり続けた・答えが違う: ${r.stdout} ${r.stderr.slice(0, 300)}`);
        return `${calls}回・${ms}ms`;
    });

    await check('YA5 plainhub auth: GitHub が受け付けない鍵は保存しない。GitHub に届かない時は保存して「確かめられなかった」と一言', () => {
        const bad = cli(['auth'], { input: FINE + '\n', box: sandbox({ api: { ...DEFAULT_API, status: 401 } }) });
        expect(bad.code === 1 && bad.saved === null && /did not accept/.test(bad.all), `401: ${bad.all.slice(-300)}`);
        const down = cli(['auth'], { input: FINE + '\n', box: sandbox({ api: 'down' }) });
        expect(down.code === 0 && down.saved === FINE && /Could not check/.test(down.out) && /Only select repositories/.test(down.out.split('Token saved')[1] || ''), `届かない: ${down.all.slice(-300)}`);
        return 'ok';
    });

    await check('YA5 MCP plainhub_auth（鍵あり）: 全部のリポに書ける鍵は保存せずエラー（CLI と同じ文）', () => {
        for (const [name, token, api, why] of ALL_CASES) {
            const m = mcp('plainhub_auth', { token }, { box: sandbox({ api }) });
            expect(m.res.isError && m.saved === null && why.test(m.text) && /Only select repositories/.test(m.text), `${name}: ${m.text}`);
            expect(!m.text.includes(token), `${name}: 鍵そのものを返した`);
        }
        return `${ALL_CASES.length} 通り`;
    });

    await check('plainhub auth --from-gh は残す（ブラウザ不要）。gh の鍵は gh に与えた権限なので一言', () => {
        const o = cli(['auth', '--from-gh'], { box: sandbox({ gh: GH }) });
        expect(o.code === 0 && o.saved === GH, `取り込めない: ${o.all}`);
        expect(o.opened.length === 0, 'ブラウザを開いた');
        expect(/gh CLI's token/.test(o.out), `gh の鍵の注意が無い: ${o.out}`);
        return 'imported + note';
    });

    await check('plainhub --help: auth の説明が「選んだリポだけ」', () => {
        const o = cli(['--help']);
        const line = o.out.split('\n').find(l => /^\s+auth\s{2,}/.test(l)) || '';
        expect(/only the repositories you choose/.test(line), `auth の行: ${line}`);
        return line.trim();
    });

    await check('MCP plainhub_auth（鍵なし）: fine-grained の画面を開き、リポの選び方を返す。説明文にも古い案内が無い', () => {
        const m = mcp('plainhub_auth', {});
        expect(m.opened.length === 1, `開いた数: ${m.opened.length}`);
        const bad = isLeastPrivilegeUrl(m.opened[0]);
        expect(!bad, bad);
        expect(/Only select repositories/.test(m.text), `案内が無い: ${m.text}`);
        const all = [m.text, m.desc, ...(m.args || [])].join('\n');
        expect(!/"repo" scope|Personal Access Token/.test(all), `古い案内が残っている: ${all.slice(0, 300)}`);
        expect(/only the repositories/.test(m.desc), `道具の説明: ${m.desc}`);
        return m.opened[0];
    });

    await check('MCP plainhub_auth（鍵あり）: 古い型は保存して一言・選んだリポだけの鍵は一言なし', () => {
        const a = mcp('plainhub_auth', { token: CLASSIC }, { box: sandbox({ api: { ...DEFAULT_API, scopes: 'read:user' } }) });
        expect(a.saved === CLASSIC && /classic token/.test(a.text), `古い型: ${a.text}`);
        const b = mcp('plainhub_auth', { token: FINE });
        expect(b.saved === FINE && !/Note:/.test(b.text), `fine-grained: ${b.text}`);
        const c = mcp('plainhub_auth', { token: 'nope' });
        expect(c.res.isError && c.saved === null && /github_pat_/.test(c.text), `形の違う値: ${c.text}`);
        return 'ok';
    });

    await check('README の「Authentication」: 選んだリポだけの鍵が推奨で、古い型の鍵を推奨しない', () => {
        const md = fs.readFileSync(path.join(CLI_DIR, 'README.md'), 'utf8');
        const sec = md.split('## Authentication')[1]?.split('\n## ')[0] || '';
        const first = sec.split('\n').find(l => /^1\./.test(l)) || '';
        expect(/Fine-grained/i.test(first) && /recommended/.test(first), `1番目の方法: ${first}`);
        expect(!/scopes=repo|"repo" scope/.test(md), 'README に古い型の案内が残っている');
        return first.slice(0, 80);
    });

    // gen-120 2巡目（G3 の指摘・中・前から）: 鍵の形は頭の印しか見ていなかった → 印の無い文字の入った値が保存され、
    //   open --with-auth で #token= の後ろにそのまま付いた（& で別の印を足す・WSL の PowerShell の '…' を ’ で抜ける）
    const EVIL = ['ghp_X&internal_device=on', 'ghp_SECRET\u2019; Start-Process calc; \u2018', 'github_pat_A B', 'gho_x#y', 'ghp_'];
    await check('鍵の形: 英数字と _ 以外の入った値は保存しない（CLI・MCP）。前後の空白は外して保存する', () => {
        for (const bad of EVIL) {
            const o = cli(['auth'], { input: bad + '\n' });
            expect(o.code === 1 && o.saved === null, `CLI が保存した: ${JSON.stringify(bad)} → ${JSON.stringify(o.saved)}`);
            const m = mcp('plainhub_auth', { token: bad });
            expect(m.res.isError && m.saved === null, `MCP が保存した: ${JSON.stringify(bad)}`);
        }
        const o = cli(['auth'], { input: '  ' + FINE + '  \n' });
        expect(o.code === 0 && o.saved === FINE, `前後の空白: ${o.all.slice(-200)}`);
        const m = mcp('plainhub_auth', { token: ' ' + FINE + '\n' });
        expect(m.saved === FINE, `MCP の前後の空白: ${m.text}`);
        return `${EVIL.length} 通りを拒否`;
    });

    await check('前から保存されていた形の違う値は、open --with-auth でも URL に付けない', () => {
        const box = sandbox();
        fs.mkdirSync(path.join(box.home, '.config', 'plainhub'), { recursive: true });
        fs.writeFileSync(path.join(box.home, '.config', 'plainhub', 'token'), EVIL[0] + '\n', { mode: 0o600 });
        const o = cli(['open', 'a.md', '-r', 'o/r', '--with-auth'], { box });
        expect(o.opened.length === 1 && !o.opened[0].includes('#'), `URL: ${o.opened[0]}`);
        const box2 = sandbox();
        fs.mkdirSync(path.join(box2.home, '.config', 'plainhub'), { recursive: true });
        fs.writeFileSync(path.join(box2.home, '.config', 'plainhub', 'token'), FINE + '\n', { mode: 0o600 });
        const g = cli(['open', 'a.md', '-r', 'o/r', '--with-auth'], { box: box2 });
        expect(g.opened.length === 1 && g.opened[0].endsWith('#token=' + FINE), `正しい鍵は今までどおり付く: ${g.opened[0]}`);
        return 'ok';
    });

    await check('前からあるトークンのファイルが誰でも読める（0644）なら、保存の時に本人だけ（0600）にする', () => {
        if (process.platform === 'win32') return 'skip (win32)';
        const box = sandbox();
        const file = path.join(box.home, '.config', 'plainhub', 'token');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, 'old\n');
        fs.chmodSync(file, 0o644);
        const o = cli(['auth'], { input: FINE + '\n', box });
        const mode = fs.statSync(file).mode & 0o777;
        expect(o.saved === FINE && mode === 0o600, `mode: ${mode.toString(8)}`);
        return '0600';
    });

    await check('gh が鍵でない値を返したら取り込まない', () => {
        const o = cli(['auth', '--from-gh'], { box: sandbox({ gh: 'gho_a&b' }) });
        expect(o.code === 1 && o.saved === null, `取り込んだ: ${o.all}`);
        return 'rejected';
    });

    report(results);
})();
