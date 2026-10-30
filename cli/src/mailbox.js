// plainhub agent --mailbox <owner/repo> — 外出先（スマホ）から家の PC の Claude Code に聞く「郵便受け」（docs/design/DESIGN_byo_agent.md §2 の後半）
//   PC は外から受け付けない: 自分から GitHub の非公開リポの専用ブランチ（plainhub-chat）を見にいき、質問（question.json）を読み、答え（answer.json）を書き足す
//   郵便受けにできるのは「自分だけが書ける非公開のリポ」だけ（公開リポ・組織のリポ・ほかの人も書けるリポは断る＝ほかの人がこの PC に質問できない）
//   見にいくのは ETag つき（変わっていなければ 304＝GitHub の回数制限に数えない）。答えは数秒ごとにまとめて書く（書き込みの上限の内）
//   答え方の決まり（Claude Code の読むだけの起動・時間切れ・長さの上限・会話を続ける決まり・新しい質問で前の答えを止める）は PC と同じ agent-core.js。
//   答えは PC と同じ出来事の流れを answer.json の events に溜めて運ぶ（今の形の status・text なども当面は書く＝古い画面のため）
//   Cockpit モード（plainhub agent --cockpit --mailbox・H2a2）: 承認カードの出来事（permission）はすぐ answer.json に書き、スマホの答え
//   （question.json の { id, answers: [{ permission, allow, card }] }）を、本人のコミットの時だけ Claude Code に返す（質問と同じ確かめ・askedByOwner）。
//   card はスマホが見せたカードの印（agent-spec.js の cardText の SHA-256）。PC が出したカードと違えば断る（途中で書き換えたカードを承認させない）
//   PlainHub のサーバーは通らない（この PC ↔ GitHub ↔ スマホ）
//   連投（QM4・PC の QM1 と同じ決まり）: スマホは question.json に送信を足していく（{ sends: [...], stops: [...], approvals: [...] }・
//   いちばん新しい送信は前の形のまま上にも書く＝古い中継役はそれだけ読み、前を止めて答える）。この中継役は見つけた送信を queue つきで
//   agent-core.js に渡す（PC と同じ道・郵便受けだけの待ち行列は作らない）。答えは送信ごとに answer.json の answers に並べ、1つの書き手が
//   まとめて書く（書き込みの数は1つの答えと同じ）。前の形の質問（古い画面）は前のまま（前の答えを止めて答え、answer.json は1つの答え）
import { createHash } from 'crypto';
import { createAgentCore, cleanQuestion, cleanImages, appendEvent, mailboxEvent } from './agent-core.js';
import { EVENT_VERSION, MAX_ANSWER, MAX_QUEUED, MAILBOX_IMAGES, mailboxMessage, cardText, PERMISSION_ID, CARD_DIGEST, MAX_ANSWERS, MAX_ACTION_RESULT } from './agent-spec.js';

export { MAILBOX_BRANCH, MAILBOX_FILES, HEARTBEAT_MS, MAX_ANSWER } from './agent-spec.js';
import { MAILBOX_BRANCH, MAILBOX_FILES, HEARTBEAT_MS } from './agent-spec.js';
export const POLL_MS = 2000;                    // 質問を見にいく間隔（304 は回数制限に数えない）
export const WRITE_MS = 4000;                   // 答えを書き足す間隔（GitHub の書き込みの上限＝1分に80回・1時間に500回の内）
export const KEEPALIVE_MS = 30000;              // 答えが進まない間（ファイルを読んでいる間）も、この間隔で答えの時刻を書き直す（スマホは止まったと分かる）
export const WRITE_BUDGET_PER_HOUR = 300;       // 1時間の書き込みの予算。超えたら答えは終わりにまとめて書く（GitHub の1時間に500回の上限に届かせない）
export const RECHECK_MS = 10 * 60 * 1000;       // 郵便受けのリポが「自分だけ・非公開」のままか確かめ直す間隔
export const MAX_QUESTION_AGE_MS = 10 * 60 * 1000;  // これより古い質問には答えない（PC が寝ていた間の質問を、何時間も後に急に答えない）
// 1回の問い合わせの上限（2026-10-03 実機: PC のスリープ・回線の切れ目で返らない問い合わせを約2時間半待ち続け、その間の質問を拾わなかった）
export const REQUEST_TIMEOUT_MS = 20000;
export const SLOW_CHECK_MS = 10000;             // 1回の見回りがこれより長くかかったら、ターミナルに1行（観察の記録）
export const CLOCK_JUMP_MS = 60000;             // 待っている間に時計がこれ以上余分に進んだら（スリープからの復帰）、ターミナルに1行
export const BEAT_FLOOR_MS = 60000;             // 時計の側の差で早めて書く生きている印は、戻らない時計でこれだけあける（時計が進み続けても書き込みの上限に届かせない）
// 連投（QM4）の answer.json の大きさの目安（バイト・UTF-8）。超えたら、終わってスマホに1回届けた古い答えから外す（GitHub が中身を返すのは 1MB まで・
//   日本語は1字3バイト＝gen-224 G3 1巡目: 字の数で測ると 1.6MB になり、スマホが読めなかった）
export const MAX_ANSWER_FILE = 700000;
const SEEN_MAX = 500;                           // 受け取った送信の番号を覚えておく数の目安（二重に答えない印・答える期限の内のものは数を超えても消さない）
const API = 'https://api.github.com';
// app/js/github-path.js の isSafeRepo と同じ形
const REPO_NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{0,38}\/[A-Za-z0-9._-]{1,100}$/;
const QUESTION_ID = /^[0-9a-f]{16,64}$/;
const cardDigest = card => createHash('sha256').update(cardText(card)).digest('hex');
const isQuestionId = v => typeof v === 'string' && QUESTION_ID.test(v);
const ENDED = ['done', 'error', 'stopped'];     // answer.json の status のうち、答えが終わったもの

export class MailboxError extends Error {
    constructor(message, { fatal = false } = {}) { super(message); this.fatal = fatal; }  // fatal: 郵便受けにしてはいけないリポ（止める）
}

// 鍵に書く権限が無い（fine-grained で Contents が読むだけ・郵便受けのリポを選んでいない）。どこで落ちても同じ文（手順書の Troubleshooting と同じ・AO2）
//   GitHub は回数の上限でも 403 を返すので、権限の 403（"Resource not accessible"）だけを見る
const cannotWrite = repo => new MailboxError(`Your token cannot write to ${repo}. Run \`plainhub auth\` again: choose ${repo} under "Repository access" and keep "Contents: Read and write".`);
const notAllowed = r => r?.status === 403 && /not accessible/i.test(r.json?.message || '');

export const isMailboxRepo = repo => typeof repo === 'string' && REPO_NAME.test(repo) && !/\/\.{1,2}$/.test(repo);

// GitHub の REST だけを呼ぶ小さな部品（token は api.github.com にだけ送る）。path は呼ぶ側で決めた形だけ
//   1回の問い合わせ（本文を読み終わるまで）は timeoutMs まで。返事が無ければ通信を切って MailboxError（やり直しは呼ぶ側の見回り）
export function githubClient({ token, fetch = globalThis.fetch, timeoutMs = REQUEST_TIMEOUT_MS }) {
    return async (method, path, { body, etag } = {}) => {
        const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'plainhub-agent',
            'X-GitHub-Api-Version': '2022-11-28', ...(etag && { 'If-None-Match': etag }), ...(body && { 'Content-Type': 'application/json' }) };
        const signal = AbortSignal.timeout(timeoutMs);
        // signal を見ない fetch・止まった本文の読み込みでも、上限の時間で必ず戻る
        let onAbort;
        const timedOut = new Promise((_, reject) => {
            onAbort = () => reject(new MailboxError(`GitHub did not answer within ${Math.round(timeoutMs / 1000)} s.`));
            signal.addEventListener('abort', onAbort, { once: true });
        });
        const request = (async () => {
            const res = await fetch(`${API}${path}`, { method, headers, signal, ...(body && { body: JSON.stringify(body) }) });
            let json = null;
            if (res.status !== 304) { try { json = await res.json(); } catch { /* 本文なし */ } }
            return { status: res.status, json, etag: res.headers.get('etag') };
        })();
        try {
            return await Promise.race([request, timedOut]);
        } catch (e) {
            if (signal.aborted) throw new MailboxError(`GitHub did not answer within ${Math.round(timeoutMs / 1000)} s.`);
            throw e;
        } finally {
            signal.removeEventListener('abort', onAbort);
            request.catch(() => {});
        }
    };
}

// 郵便受けに使う鍵を選ぶ（2026-10-04 実機: 保存した CLI の鍵が別のアカウントのもので、自分のリポなのに「not your own repository」で止まった）
//   sources: [{ from, load }] を順に読み、GitHub に聞いたアカウントがリポの持ち主のものを使う（同じ鍵は1回だけ・持ち主が見つかったら残りは読まない）
//   鍵が1つも無ければ null。持ち主の鍵が無ければ、どのアカウントの鍵があったかを示して止める（鍵の中身は出さない）
//   GitHub が返事をしない時はそのまま投げる（別の鍵で黙って進まない）
export async function pickMailboxToken({ repo, sources, client = token => githubClient({ token }) }) {
    const owner = repo.split('/')[0].toLowerCase();
    const seen = new Set();
    const others = [];
    const rejected = [];
    for (const { from, load } of sources) {
        const token = await load();
        if (!token || seen.has(token)) continue;
        seen.add(token);
        const user = await client(token)('GET', '/user');
        const login = user.json?.login;
        if (user.status === 401) { if (!rejected.includes(from)) rejected.push(from); continue; }
        if (user.status !== 200 || typeof login !== 'string') throw new MailboxError(`Could not check your GitHub account (${user.status}).`);
        if (login.toLowerCase() === owner) return { token, login, from };
        if (!others.some(o => o.login === login)) others.push({ login, from });
    }
    if (!seen.size) return null;
    const notAccepted = rejected.length ? `GitHub did not accept the token from ${rejected.join(' or ')}.` : '';
    if (!others.length) throw new MailboxError(`${notAccepted} Run \`plainhub auth\` again (or sign in to the gh CLI).`, { fatal: true });
    const had = others.map(o => `${o.login} (${o.from})`).join(', ');
    const name = repo.split('/')[0];
    throw new MailboxError(`${repo} belongs to ${name}, but your GitHub tokens are for ${had}.${notAccepted && ' ' + notAccepted} Sign in to the gh CLI as ${name} (gh auth login), or run \`plainhub auth\` with a token for ${name}.`, { fatal: true });
}

// 郵便受けにしてよいリポか（自分の非公開リポで、ほかに書ける人がいない）。だめなら理由を MailboxError で
export async function checkMailboxRepo(gh, repo) {
    if (!isMailboxRepo(repo)) throw new MailboxError(`--mailbox needs a repository as owner/name (got ${String(repo).slice(0, 100)})`);
    const user = await gh('GET', '/user');
    if (user.status === 401) throw new MailboxError('GitHub did not accept the saved token. Run `plainhub auth` again.', { fatal: true });
    const login = user.json?.login;
    if (user.status !== 200 || typeof login !== 'string') throw new MailboxError(`Could not check your GitHub account (${user.status}).`);
    const r = await gh('GET', `/repos/${repo}`);
    if (r.status === 404) throw new MailboxError(`${repo} was not found, or your token cannot see it.`);
    if (r.status !== 200) throw new MailboxError(`Could not check ${repo} (${r.status}).`);
    if (r.json?.private !== true) throw new MailboxError(mailboxMessage('mailbox_public', { repo }), { fatal: true });
    if (r.json?.owner?.type !== 'User' || r.json?.owner?.login !== login) {
        throw new MailboxError(mailboxMessage('mailbox_not_own', { repo, login }), { fatal: true });
    }
    if (r.json?.permissions?.push !== true) throw cannotWrite(repo);
    const c = await gh('GET', `/repos/${repo}/collaborators?affiliation=all&per_page=100`);
    if (c.status !== 200 || !Array.isArray(c.json)) throw new MailboxError(`Could not check who can write to ${repo} (${c.status}).`);
    const others = c.json.map(u => u?.login).filter(l => l !== login);
    if (others.length) {
        throw new MailboxError(mailboxMessage('mailbox_others', { repo, others }), { fatal: true });
    }
    return { login };
}

const formatGap = ms => (ms < 3600000 ? `about ${Math.round(ms / 60000)} min` : `about ${Math.round(ms / 60000)} min (${(ms / 3600000).toFixed(1)} h)`);

const b64 = s => Buffer.from(s, 'utf8').toString('base64');
const fileUrl = (repo, name) => `/repos/${repo}/contents/${name}`;

// 郵便受けの1つのリポ（読むのは決まった3つのファイルだけ）
function mailboxFiles(gh, repo) {
    const shas = {};
    const read = async (name, etag) => {
        const r = await gh('GET', `${fileUrl(repo, name)}?ref=${MAILBOX_BRANCH}`, { etag });
        if (r.status === 304) return { status: 304 };
        if (r.status === 404) { delete shas[name]; return { status: 404, etag: r.etag }; }
        if (r.status !== 200 || typeof r.json?.content !== 'string') return { status: r.status };
        shas[name] = r.json.sha;
        let data = null;
        try { data = JSON.parse(Buffer.from(r.json.content, 'base64').toString('utf8')); } catch { /* 壊れた中身は読まない */ }
        return { status: 200, data, etag: r.etag };
    };
    // 書く。この agent の書き込みは1つずつ（同じブランチへ同時に書くと GitHub が 409 を返す）。
    //   sha が古い・ほかの端末と同時に書いてブランチが先に進んだ（409・422）・返事が上限の時間までに来なかった（GitHub は書いたかもしれない）ときは、読み直して2回までやり直す
    let queue = Promise.resolve();
    const put = async (name, obj, message) => {
        for (let attempt = 0; attempt < 3; attempt++) {
            let r = null;
            try {
                r = await gh('PUT', fileUrl(repo, name), { body: { message, content: b64(JSON.stringify(obj, null, 1) + '\n'), branch: MAILBOX_BRANCH, ...(shas[name] && { sha: shas[name] }) } });
            } catch (e) { if (attempt === 2) throw e; }
            if (r && (r.status === 200 || r.status === 201)) { shas[name] = r.json?.content?.sha; return true; }
            if (notAllowed(r)) throw cannotWrite(repo);
            if (r && r.status !== 409 && r.status !== 422) break;
            await new Promise(res => setTimeout(res, 200 * (attempt + 1)));
            await read(name).catch(() => {});
        }
        throw new MailboxError(`Could not write ${name} to ${repo}.`);
    };
    const write = (name, obj, message) => {
        const p = queue.then(() => put(name, obj, message));
        queue = p.catch(() => {});
        return p;
    };
    // 送信の画像（IP3・置き場所は cleanImageRefs で確かめたもの）: 郵便受けのブランチのその場所のファイルが送信の sha のものか確かめてから、
    //   Git の blob で中身を1回だけ読む（Contents API は 1MB より大きいと中身を返さない）。PC の /ask と同じ画像のブロックにして cleanImages を通す
    //   読めなければ MailboxError（その送信には Claude Code を起動せずに答えの error で知らせる）
    const readImages = async (refs) => {
        const blocks = [];
        for (const ref of refs) {
            const meta = await gh('GET', `${fileUrl(repo, ref.path)}?ref=${MAILBOX_BRANCH}`);
            if (meta.status !== 200 || meta.json?.type !== 'file' || meta.json?.sha !== ref.sha) throw new MailboxError(`Your PC could not read an image of this message (${meta.status}). Paste it and send again.`);
            // 大きすぎるファイルは読まない（スマホは MAILBOX_IMAGES.maxBytes の内に縮めて置く・G3 1巡目: 数十 MB の blob をそのまま読んでいた）
            if (!(meta.json.size <= MAILBOX_IMAGES.maxBytes)) throw new MailboxError(`An image of this message is too large (over ${MAILBOX_IMAGES.maxBytes / 1024 / 1024} MB). Paste a smaller one and send again.`);
            const blob = await gh('GET', `/repos/${repo}/git/blobs/${ref.sha}`);
            if (blob.status !== 200 || blob.json?.encoding !== 'base64' || typeof blob.json?.content !== 'string') throw new MailboxError(`Your PC could not read an image of this message (${blob.status}). Paste it and send again.`);
            blocks.push({ type: 'image', source: { type: 'base64', media_type: ref.media_type, data: blob.json.content.replace(/\s/g, '') } });
        }
        const images = cleanImages(blocks);
        if (!images) throw new MailboxError('An image of this message could not be passed on to Claude Code. Paste it and send again.');
        return images;
    };
    return { read, write, readImages };
}

// 専用のブランチが無ければ、ふだんの履歴とつながらない空のブランチ（agent.json と空の question.json だけ）を作る
export async function ensureMailboxBranch(gh, repo, agentInfo) {
    const ref = await gh('GET', `/repos/${repo}/git/ref/heads/${MAILBOX_BRANCH}`);
    if (ref.status === 200) return false;
    if (notAllowed(ref)) throw cannotWrite(repo);
    if (ref.status !== 404) throw new MailboxError(`Could not check the ${MAILBOX_BRANCH} branch in ${repo} (${ref.status}).`);
    // 空の question.json も置く（無いファイルを見にいくと 404 で ETag が付かず、毎回 GitHub の回数制限に数えられる）
    const tree = await gh('POST', `/repos/${repo}/git/trees`, { body: { tree: [
        { path: MAILBOX_FILES.agent, mode: '100644', type: 'blob', content: JSON.stringify(agentInfo, null, 1) + '\n' },
        { path: MAILBOX_FILES.question, mode: '100644', type: 'blob', content: '{}\n' },
    ] } });
    if (notAllowed(tree)) throw cannotWrite(repo);
    if (tree.status === 409) throw new MailboxError(`${repo} is empty. Add any file (for example a README) on GitHub first.`);
    if (tree.status !== 201) throw new MailboxError(`Could not create the mailbox in ${repo} (${tree.status}).`);
    const commit = await gh('POST', `/repos/${repo}/git/commits`, { body: { message: 'PlainHub agent mailbox', tree: tree.json.sha, parents: [] } });
    if (notAllowed(commit)) throw cannotWrite(repo);
    if (commit.status !== 201) throw new MailboxError(`Could not create the mailbox in ${repo} (${commit.status}).`);
    const made = await gh('POST', `/repos/${repo}/git/refs`, { body: { ref: `refs/heads/${MAILBOX_BRANCH}`, sha: commit.json.sha } });
    if (notAllowed(made)) throw cannotWrite(repo);
    if (made.status !== 201 && made.status !== 422) throw new MailboxError(`Could not create the ${MAILBOX_BRANCH} branch in ${repo} (${made.status}).`);
    return true;
}

// 承認カードの答え: 新しい方から MAX_ANSWERS 件（スマホは答えた分を全部書く＝古い方を残すと、多い時に最後の答えが届かない）
const cleanAnswers = list => list.slice(-MAX_ANSWERS).filter(a => a && typeof a.permission === 'string' && PERMISSION_ID.test(a.permission))
    .map(a => ({ permission: a.permission, allow: a.allow === true, card: typeof a.card === 'string' && CARD_DIGEST.test(a.card) ? a.card : null }));

// 画面の見た目の操作の答え（AX1・連投の形の results）: 新しい方から MAX_ANSWERS 件・番号は PC が出した action の番号の形・結果の文は MAX_ACTION_RESULT 字まで
const cleanResults = list => list.slice(-MAX_ANSWERS).filter(r => r && typeof r.action === 'string' && PERMISSION_ID.test(r.action) && typeof r.ok === 'boolean')
    .map(r => ({ action: r.action, ok: r.ok, text: typeof r.text === 'string' ? r.text.slice(0, MAX_ACTION_RESULT) : '' }));

// 質問を確かめて、使う値だけにする（だめなら null）
//   { id, cancel: true }: やめて／{ id, answers: [{ permission, allow }] }: 承認カードの答え（Cockpit モード・この質問で答えた分を全部）／ほかは質問
//   actions（AX1）: 画面の見た目の操作の一覧を読むのは連投の形の送信だけ（前の形には画面の答えの置き場が無い）
export function parseQuestion(q, now = Date.now(), { actions = false } = {}) {
    if (!q || typeof q !== 'object' || !isQuestionId(q.id)) return null;
    if (q.cancel === true) return { id: q.id, cancel: true };
    const at = Date.parse(q.at);
    if (!Number.isFinite(at) || now - at > MAX_QUESTION_AGE_MS || at - now > 5 * 60 * 1000) return null;
    if (Array.isArray(q.answers)) return { id: q.id, answers: cleanAnswers(q.answers) };
    const question = cleanQuestion(q, { actions, imageRefs: true });   // PC の /ask と同じ確かめ（画像は置き場所だけ・IP3）
    return question && { id: q.id, ...question };
}

// 連投の形の question.json（QM4）を確かめて、使う値だけにする（この形でなければ null＝前の形として parseQuestion で読む）
//   sends: 送信（parseQuestion と同じ確かめ・古い送信は捨てる・どれも queue つき＝PC の連投と同じ道）・stops: Stop した送信の番号・
//   approvals: 承認カードの答え（新しい方から MAX_ANSWERS 件・どの送信のカードかは PC が出したカードの番号で分かる）・
//   results: 画面の見た目の操作の答え（AX1・承認と同じく PC が出した番号で分かる）
export function parseSends(q, now = Date.now()) {
    if (!q || typeof q !== 'object' || !Array.isArray(q.sends)) return null;
    const sends = [];
    for (const s of q.sends.slice(-MAX_QUEUED)) {
        const one = s && typeof s === 'object' && !Array.isArray(s.answers) && s.cancel !== true ? parseQuestion(s, now, { actions: true }) : null;
        if (one && !sends.some(x => x.id === one.id)) sends.push({ ...one, queue: true });
    }
    const stops = (Array.isArray(q.stops) ? q.stops.slice(-MAX_QUEUED) : []).filter(isQuestionId);
    const approvals = cleanAnswers(Array.isArray(q.approvals) ? q.approvals : []);
    const results = cleanResults(Array.isArray(q.results) ? q.results : []);
    return { sends, stops, approvals, results };
}

// opts: gh（githubClient）・repo・runner（agent.js の claudeRunner と同じ形）・log・agentName・folder・login
//   timing: { pollMs, writeMs, heartbeatMs, recheckMs, slowMs, jumpMs, beatFloorMs }（テスト用）・now（時刻）・mono（スリープの間は進まない時計）
//   timeoutMs・maxAnswer（テスト用・既定は agent-spec.js）
export function createMailbox({ gh, repo, runner, log = () => {}, agentName = 'Claude Code', folder = '', login = '', now = Date.now, mono = () => performance.now(),
    timeoutMs, maxAnswer, pollMs = POLL_MS, writeMs = WRITE_MS, keepaliveMs = KEEPALIVE_MS, writeBudget = WRITE_BUDGET_PER_HOUR, heartbeatMs = HEARTBEAT_MS, recheckMs = RECHECK_MS,
    slowMs = SLOW_CHECK_MS, jumpMs = CLOCK_JUMP_MS, beatFloorMs = BEAT_FLOOR_MS, userSettings, actionTimeoutMs, cardActionTimeoutMs } = {}) {
    const files = mailboxFiles(gh, repo);
    // 郵便受けの会話は郵便受けで始めたものだけ続けられる（PC とは別の芯）。受け取るもの: 連投（QM4・agent.json と答えの done で queue: true を伝える）
    //   画面の見た目の操作（AX1・agent.json と答えの done で actions: true を伝える）: 連投の形の送信だけ（答えは question.json の results）
    //   貼った画像（IP3・images: true）: 送信には置き場所だけ。中身は受け取った時に readImages で読み、PC と同じ images で Claude Code に渡す
    const core = createAgentCore({ runner, timeoutMs, maxAnswer, userSettings, takes: { images: true, queue: true, actions: true }, actionTimeoutMs, cardActionTimeoutMs });
    let questionEtag = null;
    let lastId = null;            // 答えた（答えている）質問（前の形）
    let pending = null;           // まだ答えていない質問（前の形）
    let current = null;           // { id, ac }（前の形）
    let stopped = false;
    // 連投の形（QM4）: seen＝受け取った送信の番号（二重に答えない）・live＝答えている／待っている送信（id → { id, ac }）・
    //   entries＝answer.json の answers に書く答え（id → 答えの state・古い順）
    //   handedTo＝送信 A の作業を後の送信 B が受け取って続けた（A の流れは終わった）: A の Stop は B を止める（PC の Stop と同じ「今の作業」・gen-224 G2 1巡目）
    //   stopsDone＝使った Stop（1回だけ使う）
    const seen = new Map();       // id → 受け取った時刻
    const live = new Map();
    const entries = new Map();
    const handedTo = new Map();
    const stopsDone = new Map();
    const remember = (map, id) => {
        map.set(id, now());
        for (const [k, t] of map) { if (map.size <= SEEN_MAX || now() - t <= MAX_QUESTION_AGE_MS) break; map.delete(k); }
    };
    const see = id => remember(seen, id);
    // 間隔は時計（now）と、戻らない時計（mono）の長い方で測る（gen-089）: 時計が戻っても（時刻合わせ）mono で決まった間隔で確かめ直し・
    //   生きている印を続け、スリープからの復帰（mono は進まず時計だけ進む）では時計の側ですぐ確かめ直す
    //   時刻が数でない（NaN）時は「長くたった」に倒す（gen-090: 前は比べると偽になり、確かめ直しを飛ばした）
    const stamp = () => ({ wall: now(), tick: mono() });
    const elapsed = (s) => { const d = Math.max(now() - s.wall, mono() - s.tick); return Number.isNaN(d) ? Infinity : d; };
    // 生きている印: 時計の側で早めるのは、戻らない時計で beatFloorMs あいた時だけ（gen-090: 時計が見回りのたびに進み続けると毎回書いた）
    //   戻らない時計が数でない時は早めない（G2・G3: 前は比べると偽になるのを打ち消して、見回りのたびに書いた）
    const beatDue = () => elapsed(lastBeat) >= heartbeatMs && mono() - lastBeat.tick >= Math.min(heartbeatMs, beatFloorMs);
    const never = { wall: -Infinity, tick: -Infinity };
    let lastBeat = never, lastCheck = stamp();   // lastCheck: 最後に確かめ直しが「通った」時刻（失敗している間は質問に答えない）
    let failures = 0;
    const shown = new Map();      // 出した承認カード（カードの番号 → { digest: カードの印, id: 送信の番号 }）。答えを受けたら・その答えが終わったら消す（答えは1回だけ）
    const asked = new Map();      // 画面に頼んだ見た目の操作（AX1・操作の番号 → 送信の番号）。答えを受けたら・その答えが終わったら消す（答えは1回だけ）
    const writeTimes = [];        // 1時間の書き込みの予算
    const overBudget = () => {
        while (writeTimes.length && now() - writeTimes[0] > 3600000) writeTimes.shift();
        return writeTimes.length >= writeBudget;
    };
    // mode: Claude Code の起動のしかた（read＝読むだけ・cockpit＝本人の設定と権限のモードで動く）。スマホの見出しと案内はこれに従う
    //   permissionModes（cockpit の時・H2b）: 質問ごとに選べる権限のモード。これがある中継役にだけ、スマホは Plan／Auto の切り替えを出す
    //   defaultPermissionMode（ck-003）: 最初のモード（利用者の Claude Code の設定の defaultMode が auto の時だけ auto・agent-core.js の userDefaultPermissionMode）
    const info = () => ({ app: 'plainhub-agent', version: 1, events: EVENT_VERSION, agent: agentName, folder, ...core.modeInfo(), readOnly: core.mode !== 'cockpit', seen: new Date(now()).toISOString() });

    const write = (name, obj, message) => { writeTimes.push(now()); return files.write(name, obj, message); };

    async function beat() {
        lastBeat = stamp();
        await write(MAILBOX_FILES.agent, info(), 'PlainHub agent: still here');
    }

    // 質問を書いたのが本人か（最後に question.json を変えたコミットの author）。ほかの GitHub App・鍵で書かれた質問には答えない
    async function askedByOwner() {
        if (!login) return true;
        const r = await gh('GET', `/repos/${repo}/commits?sha=${MAILBOX_BRANCH}&path=${MAILBOX_FILES.question}&per_page=1`);
        if (r.status !== 200 || !Array.isArray(r.json)) throw new MailboxError(`Could not check who wrote the question (${r.status}).`);
        return r.json[0]?.author?.login === login;
    }

    async function start() {
        await ensureMailboxBranch(gh, repo, info());
        await files.read(MAILBOX_FILES.agent);
        await beat();
        if ((await files.read(MAILBOX_FILES.question)).status === 404) await write(MAILBOX_FILES.question, {}, 'PlainHub agent mailbox');
        // 前に答えた質問には答え直さない。途中で止まった答え（前に動いていた agent が落ちた）は、スマホが待ち続けないように閉じる
        const a = await files.read(MAILBOX_FILES.answer);
        // 連投の形の question.json にある送信のうち、前の中継役が答えたかもしれないもの（answer.json が読めない時は全部・読める時は最後に書いた時より前）
        //   には答え直さない（答えから外れた古い送信・読めないほど大きな answer.json で、同じ作業をもう一度しない＝gen-224 G3 1巡目）
        const unreadable = a.status !== 404 && !(a.status === 200 && a.data && typeof a.data === 'object');
        if (unreadable || Array.isArray(a.data?.answers)) {
            const q = await files.read(MAILBOX_FILES.question);
            const lastAt = unreadable ? Infinity : Date.parse(a.data.at);
            if (q.status === 200 && Array.isArray(q.data?.sends)) {
                for (const m of q.data.sends) if (isQuestionId(m?.id) && !(Date.parse(m.at) > lastAt)) see(m.id);
            }
        }
        if (a.status === 200 && Array.isArray(a.data?.answers)) {
            // 連投の形: 並んでいる答えの送信には答え直さない・途中の答えは閉じる
            let open = false;
            const answers = a.data.answers.filter(e => isQuestionId(e?.id)).map((e) => {
                see(e.id);
                if (ENDED.includes(e.status)) return e;
                open = true;
                return { ...e, status: 'error', error: 'Your PC\'s agent restarted before finishing this answer. Ask again.' };
            });
            if (open) await write(MAILBOX_FILES.answer, { v: EVENT_VERSION, answers, at: new Date(now()).toISOString() }, 'PlainHub agent: answer (interrupted)');
        } else if (a.status === 200 && isQuestionId(a.data?.id)) {
            lastId = a.data.id;
            if (a.data.status === 'received' || a.data.status === 'thinking') {
                await write(MAILBOX_FILES.answer, { id: a.data.id, status: 'error', text: typeof a.data.text === 'string' ? a.data.text.slice(0, MAX_ANSWER) : '',
                    error: 'Your PC\'s agent restarted before finishing this answer. Ask again.', at: new Date(now()).toISOString() }, 'PlainHub agent: answer (interrupted)');
            }
        }
    }

    // 1回見にいく（変わっていれば質問を拾う）。答えている途中なら「やめて」も拾う
    async function poll() {
        const q = await files.read(MAILBOX_FILES.question, questionEtag);
        if (q.status === 304 || q.status === 404) { if (q.etag) questionEtag = q.etag; return; }
        if (q.status !== 200) throw new MailboxError(`Could not read the mailbox (${q.status}).`);
        const doc = parseSends(q.data, now());
        if (doc) return takeSends(doc, q.etag);
        const parsed = parseQuestion(q.data, now());
        // 新しいもの（やめて・承認の答え・まだ答えていない質問）だけ、書いたのが本人かを確かめる
        const fresh = parsed && (parsed.cancel || parsed.answers || parsed.id !== lastId);
        // ETag を覚えるのは、書き手を確かめ終わってから（確かめる問い合わせが失敗したら、次の見回りでこの質問をもう一度読む）
        //   承認の答えは、本人を確かめられる時（login が分かっている時）だけ使う
        if (fresh && (!(await askedByOwner()) || (parsed.answers && !login))) { questionEtag = q.etag; log(parsed.answers ? 'Ignored an approval that was not written by you.' : 'Ignored a question that was not written by you.'); return; }
        questionEtag = q.etag;
        if (!fresh) return;
        if (parsed.answers) {
            // 今答えている質問で出したカードだけ（出していない id・答えた id は使わない）。見せたカードの印が出したカードと違えば断る
            if (current?.id !== parsed.id) return;
            takeApprovals(parsed.answers.filter(a => shown.get(a.permission)?.id === parsed.id));
            return;
        }
        if (parsed.cancel) {
            if (current?.id === parsed.id) { log('The question was stopped on the other device.'); current.ac.abort(); }
            if (pending?.id === parsed.id) pending = null;
            return;
        }
        if (parsed.id === current?.id) return;
        // 新しい質問が来たら、前の答えは止める（スマホを読み直して聞き直したとき、前の答えが終わるまで待たせない）
        if (current) { log('A new question arrived — stopping the previous answer.'); current.ac.abort('replaced'); }
        pending = parsed;
    }

    // 承認カードの答え: 出したカードだけ（出していない番号・答えた番号は使わない）。見せたカードの印が出したカードと違えば断る
    function takeApprovals(list) {
        for (const a of list) {
            const want = shown.get(a.permission);
            if (!want) continue;
            shown.delete(a.permission);
            if (a.card !== want.digest) log('Declined an approval: the card on your phone was not the one this PC sent.');
            core.answer(a.permission, a.allow && a.card === want.digest);
        }
    }

    // 連投の形の question.json（QM4）: Stop・承認の答え・まだ受け取っていない送信を、書いたのが本人の時だけ使う。
    //   送信は届いた順に agent-core.js へ（queue つき＝答えている途中なら止めずに Claude Code に渡す・PC の連投と同じ道）
    async function takeSends({ sends, stops, approvals, results = [] }, etag) {
        const fresh = sends.filter(s => !seen.has(s.id) && !stops.includes(s.id));
        // 今の作業: その送信か、その作業を受け取って続けている後の送信
        const working = (id) => { for (let n = 0; id && n < MAX_QUEUED * 2; n++, id = handedTo.get(id)) if (live.has(id)) return live.get(id); return null; };
        const stopNow = stops.filter(id => !stopsDone.has(id) && (working(id) || sends.some(s => s.id === id && !seen.has(id))));
        const answersNow = approvals.filter(a => shown.has(a.permission));
        const resultsNow = results.filter(r => asked.has(r.action));
        // ETag を覚えるのは、書き手を確かめ終わってから（前の形と同じ）。画面の操作の答えも承認と同じく、本人を確かめられる時だけ使う
        if ((fresh.length || stopNow.length || answersNow.length || resultsNow.length) && (!(await askedByOwner()) || ((answersNow.length || resultsNow.length) && !login))) {
            questionEtag = etag;
            log(answersNow.length && !fresh.length ? 'Ignored an approval that was not written by you.' : 'Ignored a question that was not written by you.');
            return;
        }
        questionEtag = etag;
        for (const id of stopNow) {
            see(id);
            remember(stopsDone, id);
            const slot = working(id);
            if (slot) { log('A message was stopped on the other device.'); slot.ac.abort(); }
        }
        takeApprovals(answersNow);
        for (const r of resultsNow) { asked.delete(r.action); core.result(r.action, r.ok, r.text); }
        for (const q of fresh) {
            if (stopped) return;
            see(q.id);
            const slot = { id: q.id, ac: new AbortController() };
            live.set(q.id, slot);
            answer(q, slot, { entry: true }).catch(e => log(e.message));
        }
    }

    // answer.json を書く1つの書き手（前の形の答えも、連投の形の答えも）。doc(): その時に書く中身
    //   force: 必ず書く（受け取った・終わった・承認カード）。それ以外は writeMs ごとに変わった分だけ・変わらなくても keepaliveMs ごとに時刻だけ。
    //   前の書き込みが終わっていなければ積まない（GitHub の返事が遅い時に書き込みが溜まり、終わりの知らせが遅れない）。予算を超えたら終わりまで書かない
    //   道具の使用も writeMs ごと（events に全部溜まるので、間の分も消えない。早めて書くと長く読み続ける答えで1時間の予算を使い切り、
    //   書き込みが止まってスマホが「PC が止まった」とあきらめた＝gen-099 の G2・G3 の指摘）
    //   連投の形の答えは、書いている間に来た「必ず書く」を次の1回にまとめる（同じ見回りで受け取った20の送信で40回書かない＝gen-224 G3 1巡目）
    let written = '', lastWrite = never, writing = Promise.resolve(), inFlight = 0, nextForce = null;
    const flush = (doc, force) => {
        if (force && inFlight && doc === entriesDoc) return nextForce || (nextForce = writing.then(() => { nextForce = null; return flush(doc, true); }));
        const body = doc();
        const snap = JSON.stringify(body);
        const since = elapsed(lastWrite);
        if (!force && (inFlight || overBudget() || since < writeMs || (snap === written && since < keepaliveMs))) return writing;
        written = snap; lastWrite = stamp();
        const at = new Date(now()).toISOString();
        const obj = Array.isArray(body.answers) ? { ...body, answers: body.answers.map(e => ({ ...e, at })), at } : { ...body, at };
        inFlight++;
        writing = writing.then(() => write(MAILBOX_FILES.answer, obj, `PlainHub agent: answer (${body.status || 'queue'})`)).catch(e => log(e.message)).finally(() => { inFlight--; });
        return writing;
    };
    // 連投の形の answer.json: 送信ごとの答え（PC と同じ出来事の流れ events・status・会話の番号・エラー）を古い順に。
    //   終わってスマホに1回書いた答えは、MAX_QUEUED 件より多い時と大きすぎる時に古い方から外す（答えている・待っている送信は外さない）
    const entriesDoc = () => {
        const out = state => ({ id: state.id, v: state.v, status: state.status, events: state.events,
            ...(state.sessionId && { sessionId: state.sessionId }), ...(state.error && { error: state.error }) });
        const gone = state => ENDED.includes(state.status) && state.delivered;
        const bytes = v => Buffer.byteLength(JSON.stringify(v));
        let size = bytes([...entries.values()].map(out));
        for (const [id, state] of entries) {
            if (entries.size <= MAX_QUEUED && size <= MAX_ANSWER_FILE) break;
            if (gone(state)) { entries.delete(id); size -= bytes(out(state)); }
        }
        for (const state of entries.values()) if (ENDED.includes(state.status)) state.delivered = true;
        return { v: EVENT_VERSION, answers: [...entries.values()].map(out) };
    };

    // entry: 連投の形の送信（答えは answer.json の answers の1つ・slot は live に入っている）。無ければ前の形（answer.json はこの答え1つ）
    async function answer(q, slot = { id: q.id, ac: new AbortController() }, { entry = false } = {}) {
        if (!entry) { lastId = q.id; current = slot; }
        const { ac } = slot;
        // events: PC と同じ出来事の流れ（agent-core.js）を溜めたもの。status・text・tool・target・thinking・error・sessionId は今の画面のための写し（前の形だけ書く）
        const state = { id: q.id, v: EVENT_VERSION, status: 'received', text: '', events: [], at: '' };
        if (entry) entries.set(q.id, state);
        const doc = entry ? entriesDoc : () => state;
        const refs = q.imageRefs || [];
        log(`${entry ? 'Message' : 'Question'} from the mailbox${q.context.path ? ` (open file: ${q.context.path})` : ''}${refs.length ? ` with ${refs.length} image${refs.length > 1 ? 's' : ''}` : ''}`);
        await flush(doc, true);
        state.status = 'thinking';
        const timer = setInterval(() => flush(doc, false), Math.max(200, writeMs / 2));
        if (stopped) ac.abort();   // 受け取ったと書く間に止められていたら、Claude Code を起動しない（止めた後に子を残さない）
        let end = 'failed';
        try {
            // 画像は受け取った時に1回だけ読む（読めなければ Claude Code を起動せずに知らせる）
            if (refs.length && !ac.signal.aborted) q = { ...q, images: await files.readImages(refs) };
            await core.ask(q, (ev) => {
                ev = mailboxEvent(ev);   // コマンドは名前だけ（answer.json はリポの履歴に残る・gen-249 SF1b）
                // 画面の見た目の操作は、1時間の書き込みの予算を超えていたら画面に出さずに断る（書く間隔を待たずに書くので・G3 1巡目）
                if (ev.type === 'action' && overBudget()) { core.result(ev.id, false, 'PlainHub did not run this: the mailbox has used its GitHub writes for this hour. Try again later.'); return; }
                appendEvent(state.events, ev);
                if (ev.type === 'done') { end = ev.end; if (ev.sessionId) state.sessionId = ev.sessionId; }
                else if (ev.type === 'accepted' && entry) {
                    // Claude Code がこの送信を読んだ: まだ終わっていない前の送信の作業は、ここから続く（前の流れはこの後に終わる）
                    for (const [id, other] of entries) if (id !== q.id && other.accepted && !ENDED.includes(other.status)) handedTo.set(id, q.id);
                    state.accepted = true;
                    while (handedTo.size > SEEN_MAX) handedTo.delete(handedTo.keys().next().value);
                }
                else if (ev.type === 'text') { state.text = (state.text + ev.text).slice(0, MAX_ANSWER); delete state.tool; delete state.target; delete state.thinking; }
                else if (ev.type === 'tool') {
                    if (!state.text) {
                        // 読んでいる場所（target）は今の画面にも出す。場所の無い知らせ（道具の始まり）では前の道具の場所を消す（別の道具の名前と食い違わせない）
                        state.tool = ev.name;
                        if (ev.target) state.target = ev.target;
                        else delete state.target;
                        delete state.thinking;
                    }
                } else if (ev.type === 'thinking' && !state.text) {
                    // 読み終えて考えている。最後に読んだ場所は残す（読むのは一瞬で、書くのは数秒ごと＝消すと今の画面に場所が届かない）
                    if (state.tool) state.thinking = true;
                }
                else if (ev.type === 'error') state.error = ev.message;
                // 承認カードは書く間隔を待たずに書く（Claude Code は答えまで止まって待つ・本人の操作の数だけなので書き込みの上限に届かない）
                if (ev.type === 'permission') { shown.set(ev.id, { digest: cardDigest(ev), id: q.id }); flush(doc, true); }
                // 画面の見た目の操作も書く間隔を待たない（Claude Code は答えまで待つ・AX1）
                if (ev.type === 'action') { asked.set(ev.id, q.id); flush(doc, true); }
            }, { signal: ac.signal });
        } catch (e) {
            // 画像が読めなかった（MailboxError）はその文のまま（スマホに出す・ターミナルにも1行）
            if (e instanceof MailboxError) log(e.message);
            state.error = (e instanceof MailboxError ? e.message : `Agent error: ${e.message}`).slice(0, 500);
        } finally {
            clearInterval(timer);
            for (const [id, card] of shown) if (card.id === q.id) shown.delete(id);
            for (const [id, from] of asked) if (from === q.id) asked.delete(id);
            if (current === slot) current = null;
            if (live.get(q.id) === slot) live.delete(q.id);
        }
        state.status = end === 'complete' ? 'done' : end === 'stopped' || end === 'replaced' ? 'stopped' : 'error';
        delete state.tool;
        delete state.target;
        delete state.thinking;
        await flush(doc, true);
        await writing;
    }

    // ずっと回す（stop() まで）。通信の失敗は待ってからやり直す
    //   観察の記録（2026-10-04 オーナー「エビデンスのある対策から」）: 1回の見回りが長くかかった時・待っている間に時計が急に進んだ時（スリープからの復帰）に1行
    async function run() {
        //   時計の比べ合わせは1周の頭から次の頭まで（問い合わせの最中にスリープした分も入れる＝2026-10-03 の実機はこの形）
        let wall = now(), tick = mono(), slow = false;
        while (!stopped) {
            const w = now(), started = mono();
            const gap = (w - wall) - (started - tick);   // スリープの間は mono が進まず、時計（now）だけ進む
            wall = w; tick = started;
            if (gap >= jumpMs) log(`Mailbox: the clock jumped ahead ${formatGap(gap)} (this PC was probably asleep) — checking the mailbox again now.`);
            try {
                // 確かめ直しが通るまでは質問を拾わない（通信の失敗の間も、ほかの人が書けるようになったリポに答えない）
                if (elapsed(lastCheck) >= recheckMs) { await checkMailboxRepo(gh, repo); lastCheck = stamp(); }
                await poll();
                if (beatDue()) await beat();
                failures = 0;
                if (pending && !current && !stopped) {   // 見にいく間に止められていたら答え始めない
                    const q = pending; pending = null;
                    current = { id: q.id, ac: new AbortController() };
                    answer(q, current).catch(e => log(e.message));
                }
            } catch (e) {
                if (e instanceof MailboxError && e.fatal) {
                    log(`Mailbox stopped: ${e.message}`); stopped = true; current?.ac.abort(); for (const slot of live.values()) slot.ac.abort(); break;
                }
                if (++failures === 1) log(`Mailbox: ${e.message || e} — retrying`);
            }
            const took = mono() - started;
            if (took >= slowMs && !slow) log(`Mailbox: one check of GitHub took ${Math.round(took / 1000)} s.`);   // 続けて遅い間は最初の1回だけ
            slow = took >= slowMs;
            await new Promise(r => setTimeout(r, failures ? Math.min(30000, pollMs * 5) : pollMs));
        }
    }

    return {
        start, poll, run, answer,
        get pending() { return pending; },
        get busy() { return !!current || live.size > 0; },
        stop: () => { stopped = true; current?.ac.abort(); for (const slot of live.values()) slot.ac.abort(); },
    };
}
