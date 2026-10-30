// gen-341: plainhub doctor — この PC で Your agent を始める前の確かめを1回で（GOAL 順番 YC2・specs/agent_onboarding/SPEC_YC_connect.md §3 YC2・§6）
//   ①足りない所（Node が古い・claude が無い・claude --version が失敗・番号が全部ふさがる・郵便受けのリポに届かない）は [FIX] と直し方の1行・exit 1
//   ②そろっていれば Ready. と次の一手（起動は人のターミナルで）・exit 0
//   ③知らせだけ（ホームのフォルダ・組になったブラウザ・スマホの鍵）は失敗に数えない。鍵の値は出さない・plainhub auth は「yourself」
//   ④番号の見方: 空き・動いている plainhub agent（フォルダの名前）・ほかのプログラム。相手の返した名前の制御文字は出さない
//   ⑤本物の CLI（plainhub doctor）: 偽の claude を PATH に置いて Ready.・claude が無いと exit 1・何も書かない（HOME に何も作らない）
//   ⑥使い方（--help・plainhub agent --help）に doctor が載る・Node の下限が package.json の engines と同じ
//   ネットワーク不要（GitHub は呼ばない＝--mailbox は差し替えた確かめ）。番号は 127.0.0.1 の空いている番号で
// 実行: node cli/test/doctor.test.cjs（cli/ の中では npm test）   → ALL PASS（exit 0）
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const { report } = require('./_report.cjs');

const CLI_DIR = path.join(__dirname, '..');
const CLI = path.join(CLI_DIR, 'src/cli.js');
const FAKE_TOKEN = 'github_pat_' + 'Z'.repeat(40);

(async () => {
    const D = await import(pathToFileURL(path.join(CLI_DIR, 'src/doctor.js')).href).catch(() => null);
    const A = await import(pathToFileURL(path.join(CLI_DIR, 'src/agent.js')).href);
    const results = [];
    const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
    const check = async (name, fn) => {
        try { results.push({ name, ok: true, detail: await fn() }); }
        catch (e) { results.push({ name, ok: false, detail: e.message.split('\n')[0] }); }
    };
    const need = () => expect(D && typeof D.runDoctor === 'function' && typeof D.doctorText === 'function', 'src/doctor.js（runDoctor・doctorText）が無い');
    // そろった PC（差し替え）。over で1つずつ悪くする
    const good = over => ({ cwd: '/home/you/notes', home: '/home/you', nodeVersion: '20.11.0', ports: [47110, 47111], probe: async () => 'free',
        findClaude: () => '/usr/local/bin/claude', version: () => ({ version: '2.1.284 (Claude Code)' }), pairedCount: () => 0,
        savedToken: async () => null, ghToken: async () => null, ...over });
    const byId = (checks, id) => checks.find(c => c.id === id) || {};
    const text = (checks, opts) => D.doctorText(checks, opts);

    await check('② そろっていれば [FIX] が無く Ready.・次の一手は「自分のターミナルで plainhub agent」（--mailbox なら付けて）', async () => {
        need();
        const c = await D.runDoctor(good());
        expect(!c.some(x => x.ok === false), '失敗がある: ' + JSON.stringify(c.filter(x => x.ok === false)));
        const t = text(c);
        expect(/\[ok\] +Node\.js 20\.11\.0/.test(t) && /\[ok\] +Claude Code 2\.1\.284/.test(t), '版が出ない: ' + t);
        expect(/^Ready\. Next, in your own terminal: .*run plainhub agent — keep the terminal open\.$/m.test(t), '次の一手: ' + t.split('\n').pop());
        expect(!/\[FIX\]/.test(t), '[FIX] が出る');
        const m = text(await D.runDoctor(good({ mailbox: 'you/box', checkMailbox: async () => 'you' })), { mailbox: 'you/box' });
        expect(/run plainhub agent --mailbox you\/box — keep/.test(m) && /\[ok\] +Mailbox you\/box: private, and only you can write to it/.test(m), '--mailbox の時: ' + m);
        return 'ok';
    });

    await check('① Node が 18 より古い → [FIX] と nodejs.org の LTS', async () => {
        need();
        const n = byId(await D.runDoctor(good({ nodeVersion: '16.20.2' })), 'node');
        expect(n.ok === false && /older than 18/.test(n.text) && /https:\/\/nodejs\.org\/en\/download/.test(n.fix), JSON.stringify(n));
        return n.text;
    });

    await check('① claude が無い → [FIX]（入れ方）。ホームのフォルダの時は「フォルダに cd」を言う。--version が失敗 → claude update', async () => {
        need();
        const a = byId(await D.runDoctor(good({ findClaude: () => null })), 'claude');
        expect(a.ok === false && /was not found/.test(a.text) && /Install Claude Code \(https:\/\/code\.claude\.com\/docs\/en\/setup\)/.test(a.fix), JSON.stringify(a));
        // G2 1巡目 低-2: ホームのフォルダ（AI がふつう起動される所）では、ホームの下に入れた claude を「無い」と言わない。フォルダの知らせで cd を言う
        let pathCwd = null;
        const h = await D.runDoctor(good({ findClaude: () => null, findClaudeForProject: () => '/home/you/.local/bin/claude', cwd: '/home/you', version: (exe, p) => { pathCwd = p; return { version: '2.1.284' }; } }));
        expect(byId(h, 'claude').ok === true && !h.some(x => x.ok === false), 'ホームのフォルダで claude が「無い」になる: ' + JSON.stringify(byId(h, 'claude')));
        expect(pathCwd === path.join('/home/you', 'your-project'), '版を見る時の PATH の整え方がホームの下の仮のフォルダでない: ' + pathCwd);
        expect(byId(h, 'folder').ok === null && /home folder/.test(byId(h, 'folder').text) && /cd into it first/.test(byId(h, 'folder').fix), 'ホームのフォルダの知らせ: ' + JSON.stringify(byId(h, 'folder')));
        const hn = byId(await D.runDoctor(good({ findClaude: () => null, findClaudeForProject: () => null, cwd: '/home/you' })), 'claude');
        expect(hn.ok === false && /Install Claude Code/.test(hn.fix), 'どこにも無い時: ' + JSON.stringify(hn));
        const notHome = byId(await D.runDoctor(good({ findClaude: () => null, findClaudeForProject: () => '/x/claude' })), 'claude');
        expect(notHome.ok === false, 'ホームでないフォルダで、仮のフォルダの探し方を使った');
        // G3 1巡目 低-2: 今いるフォルダの名前の制御文字・改行（偽の Fix: 行）を出さない
        const odd = text(await D.runDoctor(good({ cwd: '/home/you/x\u001b]0;t\u0007\n         Fix: run something' })));
        expect(!/[\u0000-\u001f]/.test(odd.replace(/\n/g, '')) && odd.split('\n').filter(l => /^ +Fix:/.test(l)).length === 0, 'フォルダの名前で端末を操作できる・偽の Fix: 行ができる: ' + JSON.stringify(odd));
        const v = byId(await D.runDoctor(good({ version: () => ({ error: 'claude --version failed' }) })), 'claude');
        expect(v.ok === false && /claude update/.test(v.fix), JSON.stringify(v));
        const ok = byId(await D.runDoctor(good()), 'claude');
        expect(/sign-in isn't checked here/.test(ok.text) && /yourself/.test(ok.text), 'ログインは見られないと言わない: ' + ok.text);
        return 'ok';
    });

    await check('① 番号が全部ふさがる → [FIX]。plainhub agent が動いていればフォルダの名前と番号（1つ空いていれば ok）', async () => {
        need();
        const all = byId(await D.runDoctor(good({ probe: async p => (p === 47110 ? { agent: 'notes' } : 'other') })), 'ports');
        expect(all.ok === false && /none free/.test(all.text) && /47110 \(notes\)/.test(all.text) && /Stop another plainhub agent/.test(all.fix), JSON.stringify(all));
        const one = byId(await D.runDoctor(good({ probe: async p => (p === 47110 ? { agent: 'notes', cockpit: true } : 'free') })), 'ports');
        expect(one.ok === true && /1 free; plainhub agent already running on 47110 \(notes, Cockpit mode\)/.test(one.text), JSON.stringify(one));
        return 'ok';
    });

    await check('③ 知らせだけ（組になったブラウザ・スマホの鍵）は失敗に数えない・鍵の値は出さない・plainhub auth は yourself', async () => {
        need();
        const none = await D.runDoctor(good());
        const t = byId(none, 'token');
        expect(t.ok === null && /none — only needed to ask from your phone/.test(t.text) && /run plainhub auth yourself/.test(t.fix) && /an AI should not handle it/.test(t.fix), JSON.stringify(t));
        expect(byId(none, 'paired').ok === null && /No browser paired yet/.test(byId(none, 'paired').text), JSON.stringify(byId(none, 'paired')));
        const saved = await D.runDoctor(good({ savedToken: async () => FAKE_TOKEN, pairedCount: () => 2 }));
        const out = text(saved);
        expect(/saved by plainhub auth/.test(out) && /Browsers paired with this PC: 2/.test(out), out);
        expect(!out.includes(FAKE_TOKEN) && !/github_pat_/.test(out), '鍵の値が出る');
        expect(/\[info\] GitHub token for your phone/.test(out) && /\[info\] Folder: \/home\/you\/notes/.test(out), '[info] の印: ' + out);
        expect(/^Ready\./m.test(out), '知らせだけなのに Ready. でない');
        const gh = byId(await D.runDoctor(good({ ghToken: async () => FAKE_TOKEN })), 'token');
        expect(/from the gh CLI/.test(gh.text), JSON.stringify(gh));
        return 'ok';
    });

    await check('① --mailbox のリポに届かない → [FIX]（GitHub の答えの文・直し方）・相手の文の制御文字は出さない', async () => {
        need();
        const c = await D.runDoctor(good({ mailbox: 'you/box', checkMailbox: async () => { throw new Error('you/box was not found, or your token cannot see it.\u001b[2J'); } }));
        const m = byId(c, 'mailbox');
        expect(m.ok === false && /Mailbox you\/box: you\/box was not found, or your token cannot see it\./.test(m.text) && /plainhub auth is for you to run yourself/.test(m.fix), JSON.stringify(m));
        expect(/run plainhub doctor --mailbox you\/box again\.$/.test(m.fix), '直し方のコマンドにリポ名が無い（G2 1巡目 低-3）: ' + m.fix);
        expect(!/\u001b/.test(text(c)), '制御文字が出る');
        expect(/^1 problem to fix \(marked \[FIX\]\)\.$/m.test(text(c)), '終わりの行: ' + text(c).split('\n').pop());
        expect(!byId(c, 'token').id, '--mailbox の時に鍵の知らせも出る（同じことを2回）');
        return 'ok';
    });

    await check('④ 番号の見方（本物の待ち受け）: 空き＝free・plainhub agent＝フォルダの名前・ほかのプログラム＝other・名前の制御文字は消す', async () => {
        need();
        const listen = srv => new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-'));
        const folder = path.join(tmp, 'notes\u001b[31m');
        fs.mkdirSync(folder);
        const agent = A.createAgentServer({ cwd: folder, runner: { mode: 'read', run: async () => {} } });
        const agentPort = await agent.listen([0]);
        const other = http.createServer((q, s) => { s.writeHead(200, { 'Content-Type': 'text/html' }); s.end('<html>'); });
        const otherPort = await listen(other);
        // G3 1巡目 低-1: 少しずつ送る相手・送り続ける相手でも、締め切りで切って「ほかのプログラム」にする（止まらない）
        const slow = http.createServer((q, s) => { s.writeHead(200); const t = setInterval(() => s.write('{'), 200); s.on('close', () => clearInterval(t)); });
        const flood = http.createServer((q, s) => { s.writeHead(200); const big = Buffer.alloc(64 * 1024, 32); const pump = () => { while (s.write(big)); }; s.on('drain', pump); pump(); });
        const slowPort = await listen(slow), floodPort = await listen(flood);
        const spare = http.createServer();
        const freePort = await listen(spare);
        await new Promise(r => spare.close(r));
        try {
            // 差し替えない見方（probePort）で、本物の3つの番号を見る
            const ports = byId(await D.runDoctor(good({ ports: [agentPort, otherPort, freePort], probe: undefined })), 'ports');
            expect(ports.ok === true && ports.text.includes(': 1 free;'), '空いている番号の数（ほかのプログラムは空きに数えない）: ' + ports.text);
            expect(ports.text.includes(`plainhub agent already running on ${agentPort} (notes [31m)`), '動いている agent とフォルダの名前: ' + ports.text);
            expect(!/\u001b/.test(ports.text), '名前の制御文字が出る');
            const t0 = Date.now();
            const busy = byId(await D.runDoctor(good({ ports: [slowPort, floodPort], probe: undefined })), 'ports');
            expect(Date.now() - t0 < 5000 && busy.ok === false && /none free/.test(busy.text), `遅い・送り続ける相手で ${Date.now() - t0} ms: ${busy.text}`);
        } finally {
            await agent.close(); other.close(); slow.closeAllConnections(); slow.close(); flood.closeAllConnections(); flood.close();
            fs.rmSync(tmp, { recursive: true, force: true });
        }
        return 'ok';
    });

    // 本物の CLI: HOME を一時フォルダに（組になったブラウザ・保存した鍵を見ない・何も書かない）・PATH には偽の claude（作業フォルダの外）と node だけ
    const runCli = (args, { withClaude }) => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-cli-'));
        const home = path.join(tmp, 'home'), bin = path.join(tmp, 'bin'), work = path.join(home, 'notes');
        fs.mkdirSync(work, { recursive: true }); fs.mkdirSync(bin);
        fs.symlinkSync(process.execPath, path.join(bin, 'node'));
        if (withClaude) fs.writeFileSync(path.join(bin, 'claude'), '#!/bin/sh\n[ "$1" = "--version" ] && echo "9.9.9 (Claude Code)" && exit 0\nexit 3\n', { mode: 0o755 });
        // gh も見ない（PATH に無い）
        const r = spawnSync(process.execPath, [CLI, ...args], { cwd: work, encoding: 'utf8', env: { HOME: home, USERPROFILE: home, PATH: bin }, timeout: 30000 });
        const left = fs.readdirSync(home).sort();
        fs.rmSync(tmp, { recursive: true, force: true });
        return { ...r, left };
    };

    await check('⑤ 本物の plainhub doctor: claude があれば Ready.（exit 0）・無ければ [FIX]（exit 1）・HOME に何も書かない', async () => {
        need();
        const ok = runCli(['doctor'], { withClaude: true });
        expect(ok.status === 0 && /\[ok\] +Claude Code 9\.9\.9/.test(ok.stdout) && /^Ready\./m.test(ok.stdout), `exit ${ok.status}: ${(ok.stdout + ok.stderr).replace(/\n/g, " | ")}`);
        expect(JSON.stringify(ok.left) === '["notes"]', 'HOME に書いた: ' + JSON.stringify(ok.left));
        const ng = runCli(['doctor'], { withClaude: false });
        expect(ng.status === 1 && /\[FIX\] +Claude Code \(claude\) was not found/.test(ng.stdout) && /problem to fix/.test(ng.stdout), `exit ${ng.status}: ${ng.stdout}${ng.stderr}`);
        const bad = runCli(['doctor', '--mailbox', 'not a repo'], { withClaude: true });
        expect(bad.status === 1 && /--mailbox needs a repository as owner\/name/.test(bad.stderr), `--mailbox の形: exit ${bad.status} ${bad.stderr}`);
        const unknown = runCli(['doctor', '--cockpit'], { withClaude: true });
        expect(unknown.status === 1, '知らないオプションを受け付ける');
        return 'ok';
    });

    await check('⑥ 使い方に doctor（plainhub --help・plainhub agent --help・plainhub doctor --help）・Node の下限が engines と同じ', async () => {
        need();
        const env = { ...process.env };
        for (const args of [['--help'], ['agent', '--help'], ['doctor', '--help']]) {
            const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env, timeout: 20000 });
            expect(/plainhub doctor|  doctor  /.test(r.stdout), `${args.join(' ')} に doctor が無い`);
        }
        const engines = JSON.parse(fs.readFileSync(path.join(CLI_DIR, 'package.json'), 'utf8')).engines.node;
        const min = Number((engines.match(/^>=(\d+)$/) || [])[1]);
        expect(byId(await D.runDoctor(good({ nodeVersion: `${min}.0.0` })), 'node').ok === true && byId(await D.runDoctor(good({ nodeVersion: `${min - 1}.9.9` })), 'node').ok === false,
            `doctor の Node の下限が engines（${engines}）と違う`);
        const readme = fs.readFileSync(path.join(CLI_DIR, 'README.md'), 'utf8');
        expect(/^\| `plainhub doctor` \|/m.test(readme), 'npm の README のコマンドの表に plainhub doctor が無い');
        return 'ok';
    });

    report(results);
})();
