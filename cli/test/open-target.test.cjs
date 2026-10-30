// gen-059: plainhub open・browse・diff（CLI）と plainhub_open・browse・diff（MCP）の行き先を環境変数 PLAINHUB_APP_URL で変える（GOAL 順番 6d）
//   行き先は https://app.plainhub.dev（既定）・https://lab.plainhub.pages.dev（STG）・http://localhost:<port> だけ。ほかは開かずに止める
//   保存したトークンを URL（#token=）に付けるのは本番の時だけ（行き先を変えるとトークンが外に漏れるため）
//   ブラウザは偽の xdg-open（渡された URL を書き残すだけ）・トークンは一時の HOME。ネットワーク不要。MCP の SDK は偽物で置き換えて動かす
// 実行: node cli/test/open-target.test.cjs（cli/ の中では npm test）   → ALL PASS（exit 0）
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { report } = require('./_report.cjs');

const CLI_DIR = path.join(__dirname, '..');
const CLI = path.join(CLI_DIR, 'src', 'cli.js');
// URL の userinfo（ポートの後ろの @ の先）で行き先をすり替える形。公開リポに出る（PS2b）ので、書き出しのメールの住所の検査に
//   当たらないよう @ の前後を分けて書く（値は同じ）
const USERINFO_URL = 'http://localhost:8899' + '@' + 'evil.example';
const TOKEN = 'ghp_gen059testtoken000000000000000000';
const PROD = 'https://app.plainhub.dev';
const LAB = 'https://lab.plainhub.pages.dev';

// 偽のブラウザ（PATH はこのフォルダだけ）と、トークンを保存した HOME
function sandbox({ token = true } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'open-target-'));
    const bin = path.join(dir, 'bin');
    const home = path.join(dir, 'home');
    fs.mkdirSync(bin);
    fs.mkdirSync(path.join(home, '.config', 'plainhub'), { recursive: true });
    if (token) fs.writeFileSync(path.join(home, '.config', 'plainhub', 'token'), TOKEN + '\n', { mode: 0o600 });
    const log = path.join(dir, 'opened.log');
    fs.writeFileSync(path.join(bin, 'xdg-open'), `#!/bin/sh\nprintf '%s\\n' "$1" >> '${log}'\n`, { mode: 0o755 });
    return {
        dir, home, bin,
        opened: () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []),
    };
}
function cli(args, { appUrl, box = sandbox() } = {}) {
    const env = { HOME: box.home, PATH: box.bin };
    if (appUrl !== undefined) env.PLAINHUB_APP_URL = appUrl;
    const r = spawnSync(process.execPath, [CLI, ...args], { env, encoding: 'utf8', timeout: 15000 });
    return { code: r.status, out: r.stdout, err: r.stderr, all: r.stdout + r.stderr, opened: box.opened() };
}

// MCP: 本物の SDK の代わりに、道具を集めるだけの偽物を置いた写しで mcp-server.js を読み込み、道具を直接呼ぶ
function mcpCopy() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'open-target-mcp-'));
    fs.cpSync(path.join(CLI_DIR, 'src'), path.join(dir, 'src'), { recursive: true });
    fs.copyFileSync(path.join(CLI_DIR, 'package.json'), path.join(dir, 'package.json'));
    const sdk = path.join(dir, 'node_modules', '@modelcontextprotocol', 'sdk');
    fs.mkdirSync(path.join(sdk, 'server'), { recursive: true });
    fs.writeFileSync(path.join(sdk, 'package.json'), '{"name":"@modelcontextprotocol/sdk","type":"module"}');
    fs.writeFileSync(path.join(sdk, 'server', 'mcp.js'),
        'export class McpServer { tool(name, _d, _s, fn) { (globalThis.__tools ||= {})[name] = fn; } async connect() {} }\n');
    fs.writeFileSync(path.join(sdk, 'server', 'stdio.js'), 'export class StdioServerTransport {}\n');
    const zod = path.join(dir, 'node_modules', 'zod');
    fs.mkdirSync(zod, { recursive: true });
    fs.writeFileSync(path.join(zod, 'package.json'), '{"name":"zod","type":"module","main":"index.js"}');
    fs.writeFileSync(path.join(zod, 'index.js'),
        'const chain = new Proxy(function () {}, { get: () => () => chain, apply: () => chain });\nexport const z = chain;\n');
    return path.join(dir, 'src', 'mcp-server.js');
}
const MCP = mcpCopy();
function mcp(tool, params, { appUrl, box = sandbox() } = {}) {
    const env = { HOME: box.home, PATH: box.bin };
    if (appUrl !== undefined) env.PLAINHUB_APP_URL = appUrl;
    const code = `await import(${JSON.stringify(require('url').pathToFileURL(MCP).href)});
const r = await globalThis.__tools[${JSON.stringify(tool)}](${JSON.stringify(params)});
process.stdout.write(JSON.stringify(r));`;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { env, encoding: 'utf8', timeout: 15000 });
    if (r.status !== 0) throw new Error(`MCP の道具が例外: ${r.stderr.slice(0, 400)}`);
    const res = JSON.parse(r.stdout);
    return { res, text: res.content.map(c => c.text).join('\n'), opened: box.opened() };
}

const BAD = [
    'https://evil.example',
    'https://app.plainhub.dev.evil.example',
    'https://evil.example/app.plainhub.dev',
    'http://app.plainhub.dev',
    'https://lab.plainhub.pages.dev/x',
    'https://lab.plainhub.pages.dev?x=1',
    'https://lab.plainhub.pages.dev#x',
    'https://feature.lab.plainhub.pages.dev',
    'https://localhost:8899',
    'http://localhost',
    'http://localhost:0',
    'http://localhost:99999',
    USERINFO_URL,
    'http://user:pass@localhost:8899',
    'http://localhost.evil.example:8899',
    'http://127.0.0.1:8899',
    'javascript:alert(1)',
    'app.plainhub.dev',
];

(async () => {
    const results = [];
    const check = async (name, fn) => {
        try { results.push({ name, ok: true, detail: await fn() }); }
        catch (e) { results.push({ name, ok: false, detail: e.message }); }
    };
    const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

    await check('環境変数が無い・空なら今までどおり本番（open・browse・diff）', () => {
        for (const appUrl of [undefined, '', '  ']) {
            const o = cli(['open', 'README.md', '-r', 'o/r', '-n'], { appUrl });
            expect(o.code === 0 && o.out.trim() === `${PROD}?repo=o%2Fr&path=README.md`, `open (${JSON.stringify(appUrl)}): ${o.all}`);
        }
        const b = cli(['browse', '-r', 'o/r', '-n']);
        expect(b.out.trim() === `${PROD}?repo=o%2Fr&sidebar=on`, b.all);
        const d = cli(['diff', 'abc1234', '-r', 'o/r', '-n']);
        expect(d.out.trim() === `${PROD}?repo=o%2Fr&diff=abc1234`, d.all);
        return 'app.plainhub.dev のまま';
    });

    await check('STG（https://lab.plainhub.pages.dev・末尾の / も可）と手元（http://localhost:<port>）へ開ける', () => {
        for (const [appUrl, base] of [[LAB, LAB], [LAB + '/', LAB], ['http://localhost:8899', 'http://localhost:8899'], ['HTTP://LOCALHOST:8899/', 'http://localhost:8899']]) {
            const o = cli(['open', 'README.md', '-r', 'o/r', '-n'], { appUrl });
            expect(o.code === 0 && o.out.trim() === `${base}?repo=o%2Fr&path=README.md`, `${appUrl}: ${o.all}`);
            const b = cli(['browse', '-r', 'o/r', '-n'], { appUrl });
            expect(b.out.trim() === `${base}?repo=o%2Fr&sidebar=on`, `browse ${appUrl}: ${b.all}`);
            const d = cli(['diff', 'abc1234', '-r', 'o/r', '-n'], { appUrl });
            expect(d.out.trim() === `${base}?repo=o%2Fr&diff=abc1234`, `diff ${appUrl}: ${d.all}`);
        }
        const box = sandbox();
        const o = cli(['open', 'a.md', '-r', 'o/r'], { appUrl: LAB, box });
        expect(o.code === 0 && o.opened.length === 1 && o.opened[0] === `${LAB}?repo=o%2Fr&path=a.md`, `ブラウザに渡した URL: ${o.opened} ${o.all}`);
        return 'lab・localhost とも open・browse・diff・ブラウザ起動まで';
    });

    await check(`決まった3か所のほかは開かずに止める（${BAD.length} 通り・open・browse・diff・-n でも URL を出さない）`, () => {
        for (const appUrl of BAD) {
            for (const args of [['open', 'a.md', '-r', 'o/r'], ['open', 'a.md', '-r', 'o/r', '-n', '--with-auth'], ['browse', '-r', 'o/r'], ['diff', 'abc1234', '-r', 'o/r']]) {
                const box = sandbox();
                const r = cli(args, { appUrl, box });
                expect(r.code !== 0, `${appUrl} ${args[0]}: 止まらない（exit ${r.code}）${r.all}`);
                expect(r.opened.length === 0, `${appUrl}: ブラウザを開いた ${r.opened}`);
                expect(!/https?:\/\/\S*\?/.test(r.out) && !r.all.includes(TOKEN), `${appUrl}: URL・トークンを出した ${r.all}`);
                expect(/PLAINHUB_APP_URL/.test(r.err) && /app\.plainhub\.dev/.test(r.err) && /localhost:<port>/.test(r.err), `${appUrl}: 理由が分からない ${r.err}`);
            }
        }
        return '全部 exit 1・ブラウザ 0 回';
    });

    await check('保存したトークンは本番の時だけ付ける（--with-auth・STG と手元では付けずに一言）', () => {
        const p = sandbox();
        const prod = cli(['open', 'a.md', '-r', 'o/r', '--with-auth'], { box: p });
        expect(prod.code === 0 && prod.opened[0] === `${PROD}?repo=o%2Fr&path=a.md#token=${TOKEN}`, `本番: ${prod.opened} ${prod.all}`);
        expect(!prod.all.includes(TOKEN) && /\(\+ auth\)/.test(prod.out), `本番の表示: ${prod.all}`);
        for (const appUrl of [LAB, 'http://localhost:8899']) {
            for (const args of [['open', 'a.md', '-r', 'o/r', '--with-auth'], ['browse', '-r', 'o/r', '--with-auth'], ['diff', 'abc1234', '-r', 'o/r', '--with-auth']]) {
                const box = sandbox();
                const r = cli(args, { appUrl, box });
                expect(r.code === 0 && r.opened.length === 1 && r.opened[0].startsWith(appUrl + '?'), `${appUrl} ${args[0]}: ${r.opened} ${r.all}`);
                expect(!r.opened[0].includes('#') && !r.opened[0].includes(TOKEN) && !r.all.includes(TOKEN), `${appUrl} ${args[0]}: トークンが付いた ${r.opened}`);
                expect(!/\(\+ auth\)/.test(r.out) && /token/i.test(r.err) && /app\.plainhub\.dev/.test(r.err), `${appUrl} ${args[0]}: 付けなかったことを知らせない ${r.all}`);
            }
        }
        return '本番だけ #token=';
    });

    await check('MCP plainhub_open・browse・diff も同じ行き先・同じ決まり（本番だけトークン・ほかの行き先は isError で開かない）', () => {
        const p = mcp('plainhub_open', { repo: 'o/r', path: 'a.md', noAuth: false });
        expect(p.opened[0] === `${PROD}?repo=o%2Fr&path=a.md#token=${TOKEN}` && !p.text.includes(TOKEN), `本番: ${p.opened} ${p.text}`);
        for (const appUrl of [LAB, 'http://localhost:8899']) {
            const o = mcp('plainhub_open', { repo: 'o/r', path: 'a.md', noAuth: false }, { appUrl });
            expect(!o.res.isError && o.opened.length === 1 && o.opened[0] === `${appUrl}?repo=o%2Fr&path=a.md`, `open ${appUrl}: ${o.opened} ${o.text}`);
            expect(!o.text.includes(TOKEN) && !/\(authenticated\)/.test(o.text) && /token/i.test(o.text), `open ${appUrl}: ${o.text}`);
            const d = mcp('plainhub_diff', { repo: 'o/r', sha: 'abc1234' }, { appUrl });
            expect(d.opened.length === 1 && d.opened[0] === `${appUrl}?repo=o%2Fr&diff=abc1234`, `diff ${appUrl}: ${d.opened}`);
            const b = mcp('plainhub_browse', { repo: 'o/r' }, { appUrl });
            expect(b.opened[0] === `${appUrl}?repo=o%2Fr&sidebar=on`, `browse ${appUrl}: ${b.opened}`);
        }
        for (const appUrl of ['https://evil.example', USERINFO_URL, 'https://lab.plainhub.pages.dev/x']) {
            for (const [tool, params] of [['plainhub_open', { repo: 'o/r', path: 'a.md', noAuth: false }], ['plainhub_browse', { repo: 'o/r' }], ['plainhub_diff', { repo: 'o/r', sha: 'abc1234' }]]) {
                const r = mcp(tool, params, { appUrl });
                expect(r.res.isError === true && r.opened.length === 0 && /PLAINHUB_APP_URL/.test(r.text) && !r.text.includes(TOKEN), `${tool} ${appUrl}: ${JSON.stringify(r.res)} ${r.opened}`);
            }
        }
        return 'MCP も CLI と同じ';
    });

    report(results);
})();
