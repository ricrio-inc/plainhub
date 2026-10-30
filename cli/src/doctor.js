// plainhub doctor — この PC で Your agent を始める前の確かめを1回で（GOAL YC2・specs/agent_onboarding/SPEC_YC_connect.md §3）
//   見るのは実際に見られる項目だけ: Node の版・claude が見つかるか（と版）・待ち受けの番号・組になったブラウザ・郵便受けの鍵（と --mailbox のリポ）
//   何も変えない（書かない・起動しない・鍵を見せない）。Claude Code のログインは claude を起こさずには確かめられない → 版まで（ログインは人に案内する）
//   足りない所があれば、それぞれ直し方を1行で出し、exit 1（AI が読んで次の一手を決められる・人が読んでも分かる）
//   鍵・トークン・--cockpit・起動は人がする（AGENT_SETUP.md）→ 直し方の文は、AI に任せない所を「yourself」と書く
import http from 'http';
import { homedir } from 'os';
import { resolve, join } from 'path';
import { spawnSync } from 'child_process';
import { AGENT_PORTS } from './agent-spec.js';
import { resolveCommand, childEnv } from './agent-core.js';

const MIN_NODE_MAJOR = 18;   // cli/package.json の engines と同じ（試験 cli-doctor が突き合わせる）
const NODE_DOWNLOAD = 'https://nodejs.org/en/download';
const CLAUDE_CODE_SETUP = 'https://code.claude.com/docs/en/setup';
const PROBE_MS = 1500;
const MAX_HELLO = 4096;   // plainhub agent の hello はこれより十分小さい
const VERSION_MS = 15000;

// 相手（番号の先のプログラム・claude の出力）が返した文は、画面に出す前に1行・短く・制御文字なしに
const plain = (s, max = 80) => String(s ?? '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// 待ち受けの番号の1つを見る: 'free'（空き）・{ agent: <フォルダ> }（plainhub agent が動いている）・'other'（ほかのプログラム）
//   hello は Origin と Host を見る（agent.js）ので、本番のサイトから来た形で聞く。中身は読むだけ（組にならない）
//   相手が遅い・送り続ける時も止まらない: 全体の締め切り（timeoutMs）と本文の上限（MAX_HELLO）を超えたら切って 'other'（gen-341 G3 低-1）
function probePort(port, { origin = 'https://app.plainhub.dev', timeoutMs = PROBE_MS } = {}) {
    return new Promise((resolveProbe) => {
        let req;
        const timer = setTimeout(() => done('other'), timeoutMs);
        let settled = false;
        function done(v) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolveProbe(v);
            req?.destroy();
        }
        req = http.get({ host: '127.0.0.1', port, path: '/plainhub-agent/hello', headers: { Origin: origin, Host: `127.0.0.1:${port}` } }, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (c) => { body += c; if (body.length > MAX_HELLO) done('other'); });
            res.on('end', () => {
                try {
                    const j = JSON.parse(body);
                    if (res.statusCode === 200 && j?.app === 'plainhub-agent') return done({ agent: plain(j.folder) || 'unnamed folder', cockpit: j.readOnly === false });
                } catch { /* plainhub agent ではない */ }
                done('other');
            });
            res.on('error', () => done('other'));
        });
        req.on('error', (e) => done(e.code === 'ECONNREFUSED' ? 'free' : 'other'));
    });
}

// claude --version（会話は始めない）。Windows の claude.cmd は shell 経由でしか動かない＝起動と同じ決まり（危ない文字を含む場所なら動かさない）
//   pathCwd: 子に渡す PATH を整える時の「読ませるフォルダ」（ホームのフォルダで確かめる時はホームの下の仮のフォルダ＝ ~/.nvm などの node を残す）
//   子の環境は plainhub agent の起動と同じ childEnv（今いるフォルダの偽の node を探さない・親の会話の印を外す＝gen-341 G3 中・YC2b）
function claudeVersion(exe, { cwd, pathCwd = cwd, env = process.env, platform = process.platform, spawn = spawnSync } = {}) {
    const viaShell = platform === 'win32' && /\.cmd$/i.test(exe);
    if (viaShell && /["%&|<>^!]/.test(exe)) return { error: 'its folder name has characters plainhub agent cannot start safely' };
    const r = spawn(viaShell ? `"${exe}"` : exe, ['--version'], { cwd, env: childEnv(env, { cwd: pathCwd, platform }), shell: viaShell, windowsHide: true, timeout: VERSION_MS, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (r.error || r.status !== 0) return { error: r.error?.code === 'ETIMEDOUT' ? 'claude --version did not finish' : 'claude --version failed' };
    return { version: plain(String(r.stdout).split('\n')[0], 60) };
}

// 全部の確かめ。deps は試験で差し替える（ふだんはこの PC の本物）
//   返す: [{ id, ok: true | false | null（知らせだけ・失敗に数えない）, text, fix? }]
export async function runDoctor({
    cwd = process.cwd(), env = process.env, platform = process.platform, nodeVersion = process.versions.node, home = homedir(),
    ports = AGENT_PORTS, probe = probePort, findClaude = () => resolveCommand('claude', { cwd, env, platform }),
    // ホームのフォルダそのものでは、plainhub agent はホームの下に入れたプログラムを使わない（作業フォルダの中のプログラムは使わない決まり）。
    //   その時は、ホームの下の仮のプロジェクトのフォルダで起動したとして探す（AI はふつうホームで起動される＝見つからないと言わない・gen-341 G2 低-2）
    projectCwd = join(home, 'your-project'),
    findClaudeForProject = () => resolveCommand('claude', { cwd: projectCwd, env, platform }),
    spawn = spawnSync, version = (exe, pathCwd) => claudeVersion(exe, { cwd, pathCwd, env, platform, spawn }), pairedCount = () => 0,
    savedToken = async () => null, ghToken = async () => null, mailbox, checkMailbox,
} = {}) {
    const checks = [];
    const major = Number(String(nodeVersion).split('.')[0]);
    checks.push(major >= MIN_NODE_MAJOR
        ? { id: 'node', ok: true, text: `Node.js ${nodeVersion}` }
        : { id: 'node', ok: false, text: `Node.js ${nodeVersion} is older than ${MIN_NODE_MAJOR}`, fix: `Install the LTS version from ${NODE_DOWNLOAD}, open a new terminal, then run npm i -g plainhub again.` });

    // 作業フォルダの中のプログラムは使わない（agent と同じ safePathDirs）→ ホームのフォルダそのものでは claude が見つからないことがある
    const atHome = resolve(cwd) === resolve(home);
    const exe = findClaude() || (atHome ? findClaudeForProject() : null);
    if (!exe) {
        checks.push({ id: 'claude', ok: false, text: 'Claude Code (claude) was not found',
            fix: `Install Claude Code (${CLAUDE_CODE_SETUP}), check that claude runs in this terminal, then run plainhub doctor again.` });
    } else {
        const v = version(exe, atHome ? projectCwd : cwd);
        checks.push(v.error
            ? { id: 'claude', ok: false, text: `Claude Code was found, but ${v.error}`, fix: 'Update Claude Code (claude update), then run plainhub doctor again.' }
            : { id: 'claude', ok: true, text: `Claude Code ${v.version || '(version unknown)'} — sign-in isn't checked here: if you haven't, run claude once yourself and sign in` });
    }
    checks.push(atHome
        ? { id: 'folder', ok: null, text: `This folder is your home folder (${plain(cwd, 200)})`, fix: 'Start plainhub agent in the folder you want to ask about (cd into it first), not in your home folder itself.' }
        : { id: 'folder', ok: null, text: `Folder: ${plain(cwd, 200)} — plainhub agent started here can read everything in it` });

    const seen = await Promise.all(ports.map(p => probe(p)));
    const agents = seen.map((s, i) => (s?.agent !== undefined ? `${ports[i]} (${s.agent}${s.cockpit ? ', Cockpit mode' : ''})` : null)).filter(Boolean);
    const free = seen.filter(s => s === 'free').length;
    const range = `${ports[0]}–${ports[ports.length - 1]}`;
    checks.push(free
        ? { id: 'ports', ok: true, text: `Ports ${range}: ${free} free${agents.length ? `; plainhub agent already running on ${agents.join(', ')}` : ''}` }
        : { id: 'ports', ok: false, text: `Ports ${range}: none free${agents.length ? ` (plainhub agent running on ${agents.join(', ')})` : ''}`,
            fix: 'Stop another plainhub agent (Ctrl+C in its terminal), or the program using these ports, then try again.' });

    const paired = pairedCount();
    checks.push({ id: 'paired', ok: null, text: paired ? `Browsers paired with this PC: ${paired}` : 'No browser paired yet — after you start plainhub agent, enter the 6-digit code it shows in PlainHub on this PC' });

    // 郵便受け（スマホから）の鍵: あるかだけ（値は見せない）。--mailbox を付けた時だけ、そのリポに届くかを GitHub に聞く
    const saved = !!(await savedToken());
    const gh = saved ? false : !!(await ghToken());
    if (mailbox === undefined) {
        checks.push(saved || gh
            ? { id: 'token', ok: null, text: `GitHub token for your phone: ${saved ? 'saved by plainhub auth' : 'from the gh CLI'} (add --mailbox <owner/repo> to check the repository)` }
            : { id: 'token', ok: null, text: 'GitHub token for your phone: none — only needed to ask from your phone', fix: 'To use your phone, run plainhub auth yourself (it asks for a token; an AI should not handle it).' });
    } else {
        try {
            const login = await checkMailbox(mailbox);
            checks.push({ id: 'mailbox', ok: true, text: `Mailbox ${mailbox}: private, and only ${plain(login, 40)} can write to it` });
        } catch (e) {
            checks.push({ id: 'mailbox', ok: false, text: `Mailbox ${plain(mailbox, 100)}: ${plain(e.message, 300)}`,
                fix: `Fix it as the message says (plainhub auth is for you to run yourself), then run plainhub doctor --mailbox ${plain(mailbox, 100)} again.` });
        }
    }
    return checks;
}

const MARK = { true: '[ok]  ', false: '[FIX] ', null: '[info]' };

// 端末に出す形（ASCII の印・Windows の端末でも崩れない）。最後の行で、次の一手か、直す数を言う
export function doctorText(checks, { mailbox } = {}) {
    const lines = ['PlainHub doctor — checks this PC for "Your agent" (it changes nothing)'];
    for (const c of checks) {
        lines.push(`  ${MARK[c.ok]} ${c.text}`);
        if (c.fix) lines.push(`         ${c.ok === false ? 'Fix' : 'Note'}: ${c.fix}`);
    }
    const bad = checks.filter(c => c.ok === false).length;
    lines.push('', bad
        ? `${bad} problem${bad > 1 ? 's' : ''} to fix (marked [FIX]).`
        : `Ready. Next, in your own terminal: cd into the folder you want to ask about and run plainhub agent${mailbox ? ` --mailbox ${mailbox}` : ''} — keep the terminal open.`);
    return lines.join('\n');
}
