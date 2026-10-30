// gen-347: claude を起こす時の子の環境を1か所（agent-core.js の childEnv）で作る（GOAL 順番 YC2b・由来 gen-341/06-security）
//   ①childEnv: PATH（Path も）を safePathDirs の項目だけに・NoDefaultCurrentDirectoryInExePath=1（Windows で今いるフォルダの偽の node を探さない）・親の会話の印を外す
//   ②plainhub doctor の claude --version（Windows の claude.cmd）の子の環境にも同じ印が入る・PATH が整う・親の会話の印が無い
//   ③agent-core（plainhub agent の起動）と doctor が同じ childEnv を使い、doctor が自分で子の環境を組み立てない
//   直す前の版（1db0453）では①②③とも落ちる（childEnv が無い・doctor の子の環境に印が無い）
// 実行: node cli/test/child-env.test.cjs（cli/ の中では npm test）   → ALL PASS（exit 0）
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { report } = require('./_report.cjs');

const CLI_DIR = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(CLI_DIR, f), 'utf8');

(async () => {
    const C = await import(pathToFileURL(path.join(CLI_DIR, 'src/agent-core.js')).href);
    const D = await import(pathToFileURL(path.join(CLI_DIR, 'src/doctor.js')).href);
    const results = [];
    const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
    const check = async (name, fn) => {
        try { results.push({ name, ok: true, detail: await fn() }); }
        catch (e) { results.push({ name, ok: false, detail: e.message.split('\n')[0] }); }
    };
    // 場所はこの PC の書き方（agent-windows と同じ・試験は Windows の決まり＝platform: 'win32' の分かれ道を見る）
    const work = path.join(os.tmpdir(), 'evil-repo'), bin = path.join(os.tmpdir(), 'nodejs');
    const winEnv = { Path: ['.', work, path.join(work, 'node_modules', '.bin'), bin].join(';'), PATH: work + ';' + bin, CLAUDECODE: '1', CLAUDE_BG_SESSION_PERMISSION_RULES: 'x', HOME: os.homedir() };

    await check('① childEnv: PATH を整え・今のフォルダを探さない印・親の会話の印を外す', () => {
        expect(typeof C.childEnv === 'function', 'agent-core.js に childEnv が無い');
        const e = C.childEnv(winEnv, { cwd: work, platform: 'win32' });
        expect(e.NoDefaultCurrentDirectoryInExePath === '1', '印が無い');
        expect(e.Path === bin && e.PATH === bin, 'Path=' + e.Path + ' PATH=' + e.PATH);
        expect(!('CLAUDECODE' in e) && !('CLAUDE_BG_SESSION_PERMISSION_RULES' in e), '親の会話の印が残る');
        expect(e.HOME === winEnv.HOME, 'ほかの値が消えた');
        expect(winEnv.CLAUDECODE === '1', '元の env を書き換えた');
        const l = C.childEnv({ PATH: ['/w/node_modules/.bin', '/usr/bin'].join(':') }, { cwd: '/w', platform: 'linux' });
        expect(l.PATH === '/usr/bin', 'linux の PATH=' + l.PATH);
        return 'ok';
    });

    await check('② doctor の claude --version（Windows の claude.cmd）の子の環境にも印', async () => {
        const calls = [];
        const spawn = (file, args, opts) => { calls.push({ file, args, opts }); return { status: 0, stdout: '2.1.300 (Claude Code)\n' }; };
        const checks = await D.runDoctor({ cwd: work, env: winEnv, platform: 'win32', nodeVersion: '22.0.0', home: path.join(os.tmpdir(), 'home-x'),
            ports: [], probe: async () => 'free', findClaude: () => path.join(bin, 'claude.cmd'), spawn });
        const c = checks.find(x => x.id === 'claude');
        expect(c && c.ok === true && /2\.1\.300/.test(c.text), '版: ' + JSON.stringify(c));
        expect(calls.length === 1 && calls[0].args[0] === '--version', '呼び方: ' + JSON.stringify(calls.map(x => x.args)));
        const env = calls[0].opts.env;
        expect(env.NoDefaultCurrentDirectoryInExePath === '1', '子の環境に今のフォルダを探さない印が無い');
        expect(env.Path === bin && env.PATH === bin, '子の Path=' + env.Path + ' PATH=' + env.PATH);
        expect(!('CLAUDECODE' in env), '親の会話の印が子に渡る');
        expect(calls[0].opts.shell === true && calls[0].opts.cwd === work, 'shell 経由・フォルダ');
        return 'ok';
    });

    await check('③ agent と doctor が同じ childEnv を使う（doctor が自分で組み立てない）', () => {
        const core = read('src/agent-core.js');
        const doc = read('src/doctor.js');
        expect(/env:\s*childEnv\(env,/.test(core), 'agent の起動が childEnv を使っていない');
        expect(/import\s*\{[^}]*\bchildEnv\b[^}]*\}\s*from '\.\/agent-core\.js'/.test(doc), 'doctor が agent-core の childEnv を読んでいない');
        expect(/env:\s*childEnv\(env,/.test(doc), 'doctor の --version が childEnv を使っていない');
        expect(!/\bsafePathDirs\s*\(|NoDefaultCurrentDirectoryInExePath|parentSessionEnv|PARENT_SESSION_ENV/.test(doc), 'doctor が自分で子の環境を組み立てている');
        expect((core.match(/NoDefaultCurrentDirectoryInExePath: '1'/g) || []).length === 1, 'agent-core の中で印を書く所が1か所でない');
        return 'ok';
    });

    report(results);
})();
