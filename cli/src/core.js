// PlainHub Core - URL組立 + ブラウザ起動 + トークン管理（SSOT）

import { homedir } from 'os';
import { join } from 'path';
import { readFile, writeFile, mkdir, unlink, chmod } from 'fs/promises';

// 開く先（SSOT）: 既定は本番。環境変数 PLAINHUB_APP_URL で STG・手元に変えられる（撮影・開発用）
//   許すのは下の2つと http://localhost:<port> だけ。保存したトークンを付けるのは本番の時だけ（ほかへ漏らさない）
const BASE_URL = 'https://app.plainhub.dev';
const BASE_URL_ENV = 'PLAINHUB_APP_URL';
const ALLOWED_BASE_URLS = [BASE_URL, 'https://lab.plainhub.pages.dev'];

export class TargetError extends Error {}

// 開く先の origin を返す。許されない値なら TargetError（値そのものは出さない）
export function resolveBaseUrl(env = process.env) {
    const raw = (env[BASE_URL_ENV] ?? '').trim();
    if (!raw) return BASE_URL;
    let u = null;
    try { u = new URL(raw); } catch {}
    const plain = u && !u.username && !u.password && u.pathname === '/' && !/[?#]/.test(raw);
    const local = u && u.protocol === 'http:' && u.hostname === 'localhost' && /^[1-9]\d{0,4}$/.test(u.port) && Number(u.port) <= 65535;
    if (plain && (ALLOWED_BASE_URLS.includes(u.origin) || local)) return u.origin;
    throw new TargetError(`${BASE_URL_ENV} must be ${ALLOWED_BASE_URLS.join(', ')} or http://localhost:<port> (unset = ${BASE_URL}). Nothing was opened.`);
}

// パラメータ定義（SSOT: 追加時はここだけ変更）
const PARAMS = {
    repo:        { url: 'repo' },
    path:        { url: 'path' },
    branch:      { url: 'branch' },
    line:        { url: 'line' },
    theme:       { url: 'theme' },
    preview:     { url: 'preview' },
    scroll:      { url: 'scroll' },
    sidebar:     { url: 'sidebar' },
    fontSize:    { url: 'fontSize' },
    lineNumbers: { url: 'lineNumbers' },
    whitespace:  { url: 'whitespace' },
    header:      { url: 'header' },
    dir:         { url: 'dir' },
    diff:        { url: 'diff' },
    connect:     { url: 'connect' },   // connect=agent: open the screen to connect your own agent (MH1・app/js/url-params.js)
};

// トークン保存パス（SSOT）
const TOKEN_DIR = join(homedir(), '.config', 'plainhub');
const TOKEN_FILE = join(TOKEN_DIR, 'token');
// 鍵を作る GitHub の画面（SSOT・gen-120 GOAL 順番 MC2）: 選んだリポだけに届く fine-grained の鍵。中身の読み書き（contents）だけを選んだ状態で開く
//   リポは URL では選べないので、作る人が「Only select repositories」で選ぶ（TOKEN_STEPS）。メタデータの読み取りは GitHub が必ず付ける
//   古い型の鍵（tokens/new?scopes=repo）は全リポに全権限なので案内しない（アプリ本体の「選んだリポだけ」と合わせる・DESIGN_permissions）
//   URL の項目は GitHub の公式の手順（Pre-filling fine-grained personal access token details using URL parameters）
const GITHUB_TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new?name=PlainHub&description=PlainHub+CLI+and+MCP&expires_in=90&contents=write';
const TOKEN_STEPS = 'On GitHub, under "Repository access" choose "Only select repositories" and pick the repositories PlainHub may use. "Contents: Read and write" is already selected. Then generate the token and copy it.';
const TOKEN_FORMATS = 'GitHub tokens start with github_pat_ (fine-grained), ghp_ (classic), gho_ (gh CLI) or ghu_ (GitHub App)';
// 台帳と鍵（SSOT・gen-125 GOAL 順番 MC3 の⑤）: 台帳の道具（post・decide・ledger）は鍵を使わない。sync は手元の Git のログインで送る
//   PlainHub で見る・決める時に要るのはそのリポだけ（中身の読み書き＝Approve でカードを書き換える）。auth --status・ledger init・README・道具の説明で同じ文
const LEDGER_ACCESS = 'The ledger needs no PlainHub token: its commands work only on files in .agents, and ledger sync pushes them with your Git login, not a PlainHub token. To see a ledger in PlainHub, PlainHub needs only the repository that holds it (Contents: Read and write is enough).';

export { PARAMS, BASE_URL, BASE_URL_ENV, TOKEN_DIR, TOKEN_FILE, GITHUB_TOKEN_URL, TOKEN_STEPS, TOKEN_FORMATS, LEDGER_ACCESS };

// 鍵の形（gen-120・G3 の指摘）: 頭の印だけでなく、残りも GitHub の鍵に使われる文字（英数字と _）だけ。
//   ほかの文字（& # 空白 改行 ’ など）が入った値は保存しない・URL に付けない（#token= の後ろに別の印を足す・PowerShell の引用を抜ける、を防ぐ）
//   頭の印はアプリ（index.html の #token の読み取り）と同じ: ghp_（古い型）・github_pat_（fine-grained）・gho_（gh）・ghu_（GitHub App の利用者）
const TOKEN_PATTERN = /^(?:ghp_|gho_|ghu_|github_pat_)[A-Za-z0-9_]{1,255}$/;

export function isValidTokenFormat(token) {
    return typeof token === 'string' && TOKEN_PATTERN.test(token);
}

// 保存する鍵が全リポに届く型なら、その一言（保存は止めない＝今までの鍵もそのまま使える）。選んだリポだけの鍵なら null
export function tokenNotice(token) {
    const safer = `A fine-grained token for only the repositories you choose is safer: run plainhub auth (${GITHUB_TOKEN_URL}).`;
    if (token.startsWith('ghp_')) return `Note: this is a classic token, so it can reach every repository your account can. ${safer}`;
    if (token.startsWith('gho_')) return `Note: this is the gh CLI's token, so it has the access you gave gh (usually every repository your account can reach). ${safer}`;
    return null;
}

// 貼られた鍵が全部のリポに書けるか（YA5・2026-11-05 実測: 作成画面の Repository access の初期値が All repositories で、案内の1文を読み落とすとそのまま作れた）
//   作成画面の URL ではリポの範囲を選べない（GitHub の公式の URL の項目は name・description・target_name・expires_in・権限だけ）→ 貼られた鍵を GitHub に聞いて確かめる
//   返す形: { verdict: 'all', why } 保存しない／{ verdict: 'rejected' } GitHub が受け付けない＝保存しない／{ verdict: 'ok' }／
//     { verdict: 'unsure' } 届く範囲を見分けられない（保存して一言）／{ verdict: 'unknown' } GitHub に確かめられない（保存して一言）
//   古い型（ghp_）・gh（gho_）: GitHub が返す X-OAuth-Scopes に repo（全部のリポに書ける）か public_repo（全部の公開リポに書ける）があれば all
//   fine-grained（github_pat_）: 鍵が「全部のリポ」かは GitHub に聞けない。自分の非公開リポは選んだ物しか見えない（All repositories なら全部見える）ので、
//     持っている非公開リポ（/user の owned_private_repos）が ALL_REPOS_MIN 個以上あり、その全部に鍵が届けば all。
//     ALL_REPOS_MIN 個より少ない時・組織の鍵（自分の非公開リポに1つも届かない）は見分けられない（メモと郵便受けの2つを選ぶのは手順どおり）＝ unsure
//   App の利用者の鍵（ghu_）は入れた所だけに届く＝聞かない。鍵は api.github.com にだけ送る・鍵の値はどこにも出さない
const GITHUB_API = 'https://api.github.com';
const ALL_REPOS_MIN = 3;
const REACH_PAGES = 10;   // 100件 × 10ページまで数える（それより多い人は数え終わらない＝unknown）
//   時間切れは全部の問い合わせで1つ（gen-505 G3 低-2: 1回ずつだと最悪 11 回分待ち、MCP の側が先に切れた）
export async function tokenReach(token, { fetch = globalThis.fetch, timeoutMs = 15000 } = {}) {
    if (token.startsWith('ghu_')) return { verdict: 'ok' };
    const signal = AbortSignal.timeout(timeoutMs);
    const get = async (path) => {
        const res = await fetch(GITHUB_API + path, { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'plainhub-cli', 'X-GitHub-Api-Version': '2022-11-28' }, signal, redirect: 'error' });
        let json = null;
        try { json = await res.json(); } catch { /* 本文なし */ }
        return { status: res.status, json, scopes: res.headers.get('x-oauth-scopes') };
    };
    try {
        const user = await get('/user');
        if (user.status === 401) return { verdict: 'rejected' };
        const login = user.json?.login;
        if (user.status !== 200 || typeof login !== 'string') return { verdict: 'unknown' };
        if (!token.startsWith('github_pat_')) {
            if (user.scopes == null) return { verdict: 'unknown' };
            const scopes = user.scopes.split(',').map(s => s.trim());
            if (scopes.includes('repo')) return { verdict: 'all', why: 'it has the "repo" scope, so it can write to every repository your account can reach' };
            if (scopes.includes('public_repo')) return { verdict: 'all', why: 'it has the "public_repo" scope, so it can write to every public repository your account can reach' };
            return { verdict: 'ok' };
        }
        const owned = user.json.owned_private_repos;
        if (!Number.isInteger(owned) || owned < 0) return { verdict: 'unknown' };
        if (owned < ALL_REPOS_MIN) return { verdict: 'unsure' };
        let reached = 0;
        for (let page = 1; page <= REACH_PAGES; page++) {
            const r = await get(`/user/repos?affiliation=owner&visibility=private&per_page=100&page=${page}`);
            if (r.status !== 200 || !Array.isArray(r.json)) return { verdict: 'unknown' };
            reached += r.json.filter(x => x?.private === true && typeof x?.owner?.login === 'string' && x.owner.login.toLowerCase() === login.toLowerCase()).length;
            if (reached >= owned) return { verdict: 'all', why: `it can reach all ${owned} private repositories you own (on GitHub, "Repository access" was probably left at "All repositories"; if you picked every repository on purpose, pick only the ones PlainHub needs)` };
            if (r.json.length < 100) return { verdict: reached ? 'ok' : 'unsure' };
        }
        return { verdict: 'unknown' };
    } catch { return { verdict: 'unknown' }; }
}

// 貼られた鍵を保存してよいか（CLI の plainhub auth と MCP の plainhub_auth の同じ文・YA5）。保存しない時は { error }、保存する時は { note }（無ければ null）
//   GitHub に届かない時（オフライン・時間切れ）は保存して確かめられなかったと一言（今までの動きより悪くしない）
export async function tokenSaveCheck(token, opts) {
    const reach = await tokenReach(token, opts);
    if (reach.verdict === 'rejected') return { error: 'Not saved: GitHub did not accept this token (it may be expired, revoked or mistyped). Create a new one and run plainhub auth again.' };
    if (reach.verdict === 'all') {
        return { error: `Not saved: this token can write to every repository: ${reach.why}. Create a new token at ${GITHUB_TOKEN_URL} — under "Repository access" choose "Only select repositories" and pick only the repositories PlainHub needs — and run plainhub auth again. You can delete the token you pasted on GitHub (Settings > Developer settings > Personal access tokens).` };
    }
    //   古い型・gh の鍵はリポを選べない＝その鍵の一言（tokenNotice）。fine-grained は「Only select repositories」を選んだかの確かめ（gen-505 G2 中・G3 低-1・低-3）
    if (reach.verdict === 'unknown' && !token.startsWith('github_pat_')) {
        return { note: ['Could not check with GitHub which repositories this token can write to.', tokenNotice(token)].filter(Boolean).join(' ') };
    }
    if (reach.verdict === 'unknown' || reach.verdict === 'unsure') {
        const lead = reach.verdict === 'unknown' ? 'Could not check with GitHub which repositories this token can write to.' : 'PlainHub cannot tell from GitHub whether this token reaches only the repositories you chose.';
        return { note: `${lead} Make sure you chose "Only select repositories" for it on GitHub; if you left "All repositories", create a new one (${GITHUB_TOKEN_URL}) and run plainhub auth again.` };
    }
    return { note: tokenNotice(token) };
}

// 保存した鍵の状態（CLI の auth --status と MCP の plainhub_auth_status の同じ文・gen-125）: 型と届く範囲。
//   形の違う値は Authenticated と言わない（openPlainHub は渡さない）・値も出さない。鍵が無ければ null（呼ぶ側が始め方を足す）
export function tokenStatus(token) {
    if (!token) return null;
    if (!isValidTokenFormat(token)) return `The saved token does not look like a GitHub token, so it is not handed to PlainHub. Save a new one with plainhub auth. ${TOKEN_FORMATS}.`;
    //   fine-grained・App の鍵でも、作る時・入れる時に「All repositories」を選べば全リポに届く（gen-125 G3）＝言い切らない
    const reach = token.startsWith('github_pat_') ? 'This is a fine-grained token: it reaches only the repositories you chose on GitHub (every repository if you chose "All repositories").'
        : token.startsWith('ghu_') ? 'This is a GitHub App user token: it reaches only the repositories the app was installed on.'
        : tokenNotice(token);
    return `Authenticated: ${maskToken(token)}\n${reach}`;
}

// gh CLI の鍵。user を渡すと、gh にログインしているそのアカウントの鍵（gh 2.40 から。古い gh・そのアカウントが無ければ null）
//   引数はシェルを通さずに渡す。github.com の鍵だけ（gh の既定の行き先が別のサーバーでも）
//   ホームのフォルダで動かす（Windows は今いるフォルダの gh.exe を PATH より先に探す。clone したリポに置かれた gh.exe を動かさない）
export async function loadGhToken({ user } = {}) {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const args = ['auth', 'token', '--hostname', 'github.com', ...(user ? ['--user', user] : [])];
    try {
        const { stdout } = await promisify(execFile)('gh', args, { timeout: 5000, windowsHide: true, cwd: homedir() });
        const token = stdout.trim();
        return token || null;
    } catch { return null; }
}

// 頭の印と末尾4文字だけ（gen-125: 前は先頭8文字＋末尾4文字で、短い鍵はほぼ見えた）。印の後ろが16文字未満なら末尾も出さない
export function maskToken(token) {
    const prefix = (token.match(/^(?:github_pat_|gh[a-z]_)/) || [''])[0];
    const rest = token.length - prefix.length;
    return prefix + '...' + (rest >= 16 ? token.slice(-4) : '');
}

export async function loadToken() {
    try {
        const token = (await readFile(TOKEN_FILE, 'utf-8')).trim();
        return token || null;
    } catch { return null; }
}

export async function saveToken(token) {
    await mkdir(TOKEN_DIR, { recursive: true });
    await writeFile(TOKEN_FILE, token.trim() + '\n', { mode: 0o600 });
    await chmod(TOKEN_FILE, 0o600);   // mode は新しく作る時だけ効く。前からあるファイルも本人だけに（gen-120）
}

export async function removeToken() {
    try { await unlink(TOKEN_FILE); return true; }
    catch { return false; }
}

export function buildUrl(options, { token, env } = {}) {
    const base = resolveBaseUrl(env);
    const params = new URLSearchParams();
    for (const [key, def] of Object.entries(PARAMS)) {
        if (options[key] != null) {
            params.set(def.url, String(options[key]));
        }
    }
    const qs = params.toString();
    let url = qs ? `${base}?${qs}` : base;
    if (token && base === BASE_URL && isValidTokenFormat(token)) url += `#token=${encodeURIComponent(token)}`;
    return url;
}

// git の remote の URL → GitHub の 'owner/name'（GitHub でない・形が違えば null）。鍵や user は読み捨てる（返すのは owner/name だけ・PG3）
//   https・ssh・git の URL と scp の形（github.com:owner/name.git の前に user と ＠ が付く形）。ホストは github.com だけ
const GITHUB_OWNER = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
const GITHUB_NAME = /^[A-Za-z0-9._-]{1,100}$/;
export function githubRepoFromRemote(remote) {
    if (typeof remote !== 'string') return null;
    const s = remote.trim();
    let host, path;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
        let u;
        try { u = new URL(s); } catch { return null; }
        if (!['https:', 'http:', 'ssh:', 'git:', 'git+ssh:', 'ssh+git:'].includes(u.protocol) || u.search || u.hash || /[?#]/.test(s)) return null;
        [host, path] = [u.hostname, u.pathname];
    } else {
        const scp = /^(?:[^@/\s:]+@)?([^@/\s:]+):([^\s]+)$/.exec(s);
        if (!scp) return null;
        [host, path] = [scp[1], scp[2]];
    }
    if (host.toLowerCase() !== 'github.com') return null;
    const m = /^\/?([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(path);
    if (!m || !GITHUB_OWNER.test(m[1]) || !GITHUB_NAME.test(m[2]) || /^\.+$/.test(m[2])) return null;
    return `${m[1]}/${m[2]}`;
}

// 開く（CLI・MCP の open・browse・diff の共通の入口）。行き先を先に確かめ、本番でなければトークンを読みもしない
//   shown はトークンを除いた URL。withheld はトークンを頼まれたが本番でないので付けなかった時の一言
export async function openPlainHub(options, { withToken = false, open = true, env } = {}) {
    const base = resolveBaseUrl(env);
    const token = withToken && base === BASE_URL ? await loadToken() : null;
    const url = buildUrl(options, { token, env });
    if (open) await openInBrowser(url);
    return {
        shown: url.replace(/#.*/, ''),
        authed: url.includes('#token='),
        withheld: withToken && base !== BASE_URL ? `Saved token not passed: it is only sent to ${BASE_URL} (opening ${base}).` : null,
    };
}

export async function openInBrowser(url) {
    const { spawn } = await import('child_process');

    const trySpawn = (cmd, args) => new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
        child.unref();
        child.on('error', reject);
        setTimeout(resolve, 500);
    });

    // WSL → Windows browser (escape single quotes for PowerShell)
    const safeUrl = url.replace(/'/g, "''");
    try { await trySpawn('powershell.exe', ['-Command', `Start-Process '${safeUrl}'`]); return; } catch {}
    // macOS
    try { await trySpawn('open', [url]); return; } catch {}
    // Linux
    try { await trySpawn('xdg-open', [url]); } catch {}
}
