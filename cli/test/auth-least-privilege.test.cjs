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

function sandbox({ gh } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-least-'));
    const bin = path.join(dir, 'bin');
    const home = path.join(dir, 'home');
    fs.mkdirSync(bin);
    fs.mkdirSync(home);
    const log = path.join(dir, 'opened.log');
    fs.writeFileSync(path.join(bin, 'xdg-open'), `#!/bin/sh\nprintf '%s\\n' "$1" >> '${log}'\n`, { mode: 0o755 });
    if (gh) fs.writeFileSync(path.join(bin, 'gh'), `#!/bin/sh\necho '${gh}'\n`, { mode: 0o755 });
    return {
        home, bin,
        opened: () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []),
        saved: () => { try { return fs.readFileSync(path.join(home, '.config', 'plainhub', 'token'), 'utf8').trim(); } catch { return null; } },
    };
}
function cli(args, { input, box = sandbox() } = {}) {
    const r = spawnSync(process.execPath, [CLI, ...args], { env: { HOME: box.home, PATH: box.bin }, input, encoding: 'utf8', timeout: 15000 });
    return { code: r.status, out: r.stdout, all: r.stdout + r.stderr, opened: box.opened(), saved: box.saved() };
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
        'export class McpServer { tool(name, d, _s, fn) { (globalThis.__tools ||= {})[name] = fn; (globalThis.__desc ||= {})[name] = d; } async connect() {} }\n');
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
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { env: { HOME: box.home, PATH: box.bin }, encoding: 'utf8', timeout: 15000 });
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

    await check('plainhub auth: 古い型の鍵（ghp_）も今までどおり保存するが、全リポに届くことと、選んだリポだけの鍵の作り方を一言', () => {
        const o = cli(['auth'], { input: CLASSIC + '\n' });
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
        const a = mcp('plainhub_auth', { token: CLASSIC });
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
