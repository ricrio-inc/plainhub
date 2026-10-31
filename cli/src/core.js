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
