// plainhub agent — 自分の AI エージェント（まず Claude Code）を PlainHub の AI パネルにつなぐ（docs/design/DESIGN_byo_agent.md・この PC・読むだけ）
//   127.0.0.1 だけで待ち、決まったサイト（Origin）から・合言葉で組になったブラウザからの質問だけを、起動したフォルダの Claude Code に渡す
//   Claude Code は読むだけ（Read・Grep・Glob）・フォルダの外は読めない（--restricted）・MCP もほかの設定も読まない。古くて決まりを守れない版なら動かさない
//   Cockpit モード（--cockpit で明示した時だけ・H2a・H2b）: 本人の Claude Code の設定と、AI パネルで選んだ権限のモード（Plan／Auto）で動き、確認が要る操作は組になったブラウザの AI パネルに承認カードを出して、その答えを Claude Code に返す（/permission）
//   質問とファイルの中身は PlainHub のサーバーを通らない（ブラウザ ↔ この PC ↔ 利用者のサブスクの Claude だけ）
import http from 'http';
import crypto from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { AGENT_PORTS, EVENT_VERSION, MAX_IMAGE_BODY } from './agent-spec.js';
import { createAgentCore, cleanQuestion } from './agent-core.js';

// 答え方の決まり（Claude Code の起動・時間切れ・長さの上限・会話を続ける決まり）は agent-core.js・値は agent-spec.js（郵便受けと共通）。ここは PC の届け方だけ
export { AGENT_PORTS, ASK_TIMEOUT_MS, MAX_PROMPT, MAX_CONTENT, MAX_IMAGE_BODY } from './agent-spec.js';
export { CLAUDE_ARGS, COCKPIT_ARGS, userDefaultPermissionMode, permissionCard, systemPrompt, userContent, resolveCommand, stopAllClaude, MAX_TARGET, toolTarget, claudeRunner } from './agent-core.js';
// 既定は本番だけ（ck-003）。STG（lab）・プレビュー・手元の配信は --origin で足す（isAllowedExtraOrigin）
export const DEFAULT_ORIGINS = ['https://app.plainhub.dev'];
export const PAIR_MAX_FAILURES = 5;      // 合言葉をこの回数まちがえたら、起動し直すまで組にしない（総当たりを止める）
export const MAX_BODY = 256 * 1024;
export const MAX_PAIRINGS = 20;
export const MAX_WATCHERS = 8;          // 同時に開けておける /watch の数（ふつうはタブごとに1つ・gen-194 G3 1巡目: 上限が無く、たくさん開くと中継役のメモリを使った）
export const MAX_WATCH_BACKLOG = 1024 * 1024;   // 読まれずに溜まった /watch の出来事がこれを超えたら、その流れを閉じる（画面はもう一度開く）

const TOO_LARGE = Symbol('too_large');
const PAIRINGS_FILE = join(homedir(), '.config', 'plainhub', 'agent-pairings.json');

// --origin で足せるのは、手元の配信（http://localhost:<番号>・http://127.0.0.1:<番号>）と PlainHub のプレビュー（https://<名前>.plainhub.pages.dev）だけ
export function isAllowedExtraOrigin(origin) {
    return /^http:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/.test(origin)
        || /^https:\/\/[a-z0-9-]{1,63}\.plainhub\.pages\.dev$/.test(origin);
}

export function newPairingCode() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// 合言葉を人に見せる形（ターミナルの起動の表示・つないだ後の Next の両方がここを通る）。スペースを入れずに6桁を続けて出す
//   （前は起動時だけ「941 391」・Next は「710065」とばらばらだった・2026-10-06 オーナー「スペースなしのほうがわかりやすい」）
//   入力はスペースあり・なしのどちらも受け付ける（/pair で空白を取り除く）
export function showPairingCode(code) {
    return String(code).replace(/\s/g, '');
}

const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

// 組になったブラウザの鍵は、ハッシュだけを残す（起動し直しても組み直さなくてよい）
export function fileTokenStore(file = PAIRINGS_FILE) {
    const read = () => {
        try {
            const list = JSON.parse(readFileSync(file, 'utf8'));
            return Array.isArray(list) ? list.filter(p => typeof p?.hash === 'string') : [];
        } catch { return []; }
    };
    return {
        has: hash => read().some(p => p.hash === hash),
        count: () => read().length,   // plainhub doctor（組になったブラウザの数だけ・鍵は見せない）
        add: hash => {
            const list = [...read(), { hash, created: new Date().toISOString() }].slice(-MAX_PAIRINGS);
            mkdirSync(join(file, '..'), { recursive: true, mode: 0o700 });
            writeFileSync(file, JSON.stringify(list, null, 2) + '\n', { mode: 0o600 });
        },
        clear: () => { if (existsSync(file)) unlinkSync(file); },
    };
}

export function memoryTokenStore() {
    const set = new Set();
    return { has: h => set.has(h), add: h => { set.add(h); }, clear: () => set.clear() };
}

// この PC の届け方が受け取るもの（正本・hello・pair・答えの done で伝え、/ask の確かめにも使う）
//   images: 貼った画像（IP1・中身は /ask の本文に。郵便受けも IP3 から受け取る＝画像は別のファイル・mailbox.js）
//   queue: 答えの途中の送信を止めずに Claude Code に渡す（QM1・無い版では画面は今までどおり止めて送る。郵便受けも QM4 から同じ＝mailbox.js）
//   watch: 答えのあいだに Claude Code が自分で始めた作業（予約・裏の作業の結果）を /watch で流す（QM0b）
//   actions: 質問に添えた画面の見た目の操作の一覧を Claude Code に渡し、呼ばれたら action の出来事にして /action の答えを返す（AX1）
const TAKES = Object.freeze({ images: true, queue: true, watch: true, actions: true });

// opts: cwd（読ませるフォルダ）・origins（受け付けるサイト）・runner（mode は runner.mode＝claudeRunner の mode）・tokens（組の鍵の置き場）・log・code（最初の合言葉）・timeoutMs・maxAnswer（テスト用・既定は agent-spec.js）
export function createAgentServer({ cwd = process.cwd(), origins = DEFAULT_ORIGINS, runner, tokens = memoryTokenStore(), log = () => {}, code = newPairingCode(), agentName = 'Claude Code', timeoutMs, maxAnswer, userSettings, actionTimeoutMs, cardActionTimeoutMs } = {}) {
    const allowed = new Set(origins);
    const core = createAgentCore({ runner, timeoutMs, maxAnswer, userSettings, takes: TAKES, actionTimeoutMs, cardActionTimeoutMs });
    let pairCode = code;
    let failures = 0;
    let port = 0;
    let watching = 0;   // 開いている /watch の数

    const json = (res, status, obj) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(obj));
    };
    const bearer = req => {
        const m = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(req.headers.authorization || '');
        return m && tokens.has(sha256(m[1])) ? m[1] : null;
    };
    // max: 読む上限（/ask だけ画像の付く質問のために MAX_IMAGE_BODY まで読む・読んだ大きさは req.bodySize）
    const readBody = (req, max = MAX_BODY) => new Promise((resolve) => {
        let size = 0; const chunks = [];
        req.on('data', (c) => {
            size += c.length;
            req.bodySize = size;
            if (size <= max) return chunks.push(c);
            req.pause();   // 残りは読まない（413 を返して接続を閉じる）
            resolve(TOO_LARGE);
        });
        req.on('end', () => {
            try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { resolve(undefined); }
        });
        req.on('error', () => resolve(TOO_LARGE));
    });

    const server = http.createServer(async (req, res) => {
        // 別の名前でこの番号に来た（DNS rebinding）・決まったサイト以外・Origin の無い呼び出しは、中身を見ずに断る
        const host = req.headers.host || '';
        if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return json(res, 403, { error: 'host' });
        const origin = req.headers.origin;
        if (!origin || !allowed.has(origin)) return json(res, 403, { error: 'origin' });
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Max-Age', '600');
            if (req.headers['access-control-request-private-network'] === 'true') res.setHeader('Access-Control-Allow-Private-Network', 'true');
            res.writeHead(204); return res.end();
        }
        const url = req.url.split('?')[0];

        if (req.method === 'GET' && url === '/plainhub-agent/hello') {
            // modeInfo に受け取るもの（TAKES＝images・queue・watch）も入っている（答えの done も同じ）
            return json(res, 200, { app: 'plainhub-agent', version: 1, events: EVENT_VERSION, agent: agentName, folder: basename(cwd), ...core.modeInfo(), readOnly: core.mode !== 'cockpit', paired: !!bearer(req) });
        }
        if (req.method !== 'POST' || !/^application\/json\s*(;|$)/i.test(req.headers['content-type'] || '')) return json(res, 404, { error: 'not_found' });

        if (url === '/plainhub-agent/pair') {
            if (failures >= PAIR_MAX_FAILURES) return json(res, 429, { error: 'locked' });
            const body = await readBody(req);
            // 本文を読む間に、ほかの接続が回数を使い切っていないか（同時に送って5回の制限を超えさせない）
            if (failures >= PAIR_MAX_FAILURES) return json(res, 429, { error: 'locked' });
            const given = String(body?.code ?? '').replace(/\s/g, '');
            const ok = given.length === pairCode.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(pairCode));
            if (!ok) {
                failures++;
                log(failures >= PAIR_MAX_FAILURES
                    ? `Wrong pairing code ${failures} times — pairing is locked. Restart plainhub agent to pair again.`
                    : `Wrong pairing code (${failures}/${PAIR_MAX_FAILURES}).`);
                return json(res, failures >= PAIR_MAX_FAILURES ? 429 : 401, { error: failures >= PAIR_MAX_FAILURES ? 'locked' : 'wrong_code', remaining: PAIR_MAX_FAILURES - failures });
            }
            const token = crypto.randomBytes(32).toString('base64url');
            tokens.add(sha256(token));
            pairCode = newPairingCode();   // 1回使った合言葉は使えない
            log(`Paired with a browser on ${origin}. Next pairing code: ${showPairingCode(pairCode)}`);
            return json(res, 200, { token, agent: agentName, folder: basename(cwd), ...core.modeInfo() });
        }

        if (url === '/plainhub-agent/ask') {
            if (!bearer(req)) return json(res, 401, { error: 'not_paired' });
            const body = await readBody(req, MAX_IMAGE_BODY);
            // 上限を広げるのは画像の付く質問だけ（画像の無い質問は前と同じ MAX_BODY）
            if (body === TOO_LARGE || (req.bodySize > MAX_BODY && !(Array.isArray(body?.images) && body.images.length))) {
                res.setHeader('Connection', 'close');
                res.on('finish', () => req.socket.destroy());
                return json(res, 413, { error: 'too_large' });
            }
            const question = cleanQuestion(body, TAKES);
            if (!question) return json(res, 400, { error: 'prompt' });
            // 答えている途中の次の質問は、queue が付いていれば止めずに Claude Code に渡し（連投・QM1）、無ければ前の答えを止めてから答える（agent-core.js）。
            //   ブラウザが閉じたら（Stop）、この質問の分だけ止める（答えている作業なら interrupt・待っている送信なら流れを閉じるだけ）
            const ac = new AbortController();
            res.on('close', () => { if (!res.writableEnded) ac.abort(); });
            res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
            log(`Question from ${origin}${question.context.path ? ` (open file: ${question.context.path})` : ''}${question.images.length ? ` with ${question.images.length} image${question.images.length > 1 ? 's' : ''}` : ''}`);
            await core.ask(question, (ev) => {
                if (!res.writableEnded) res.write(JSON.stringify(ev) + '\n');
                if (ev.type === 'done' && !res.writableEnded) res.end();
            }, { signal: ac.signal });
            return;
        }
        // 答えのあいだの作業（QM0b）: 組になったブラウザが開けておく流れ。Claude Code が自分で始めた作業ごとに self → 答えと同じ出来事 → done
        //   （どれにも answer＝作業の番号）。ブラウザが閉じたらやめる。答えの /ask と違い、閉じても作業は止めない（止めるのは /stop）
        if (url === '/plainhub-agent/watch') {
            if (!bearer(req)) return json(res, 401, { error: 'not_paired' });
            if (watching >= MAX_WATCHERS) return json(res, 429, { error: 'too_many' });
            watching++;
            res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
            res.flushHeaders();
            const unwatch = core.watch((ev) => {
                if (res.writableEnded) return;
                if (res.writableLength > MAX_WATCH_BACKLOG) return res.destroy();
                res.write(JSON.stringify(ev) + '\n');
            });
            res.on('close', () => { watching--; unwatch(); });
            return;
        }
        // 答えのあいだの作業の Stop（{ answer }・今の作業だけ止める＝Claude Code の Esc と同じ）
        if (url === '/plainhub-agent/stop') {
            if (!bearer(req)) return json(res, 401, { error: 'not_paired' });
            const body = await readBody(req);
            if (body === TOO_LARGE || typeof body?.answer !== 'string') return json(res, 400, { error: 'bad_request' });
            if (!core.stopAnswer(body.answer)) return json(res, 404, { error: 'unknown' });
            log('You stopped work your agent started on its own.');
            return json(res, 200, { ok: true });
        }
        // Cockpit モードの承認カードの答え（{ id, allow: true | false }）。組になったブラウザだけ・待っている id だけ・1回だけ
        if (url === '/plainhub-agent/permission') {
            if (!bearer(req)) return json(res, 401, { error: 'not_paired' });
            const body = await readBody(req);
            if (body === TOO_LARGE || typeof body?.id !== 'string' || typeof body.allow !== 'boolean') return json(res, 400, { error: 'bad_request' });
            if (!core.answer(body.id, body.allow)) return json(res, 404, { error: 'unknown' });
            log(body.allow ? 'You approved a change in PlainHub.' : 'You declined a change in PlainHub.');
            return json(res, 200, { ok: true });
        }
        // 画面の見た目の操作の答え（AX1・{ id, ok: true | false, text }）。組になったブラウザだけ・待っている id だけ・1回だけ
        if (url === '/plainhub-agent/action') {
            if (!bearer(req)) return json(res, 401, { error: 'not_paired' });
            const body = await readBody(req);
            if (body === TOO_LARGE || typeof body?.id !== 'string' || typeof body.ok !== 'boolean' || typeof body.text !== 'string') return json(res, 400, { error: 'bad_request' });
            if (!core.result(body.id, body.ok, body.text)) return json(res, 404, { error: 'unknown' });
            return json(res, 200, { ok: true });
        }
        return json(res, 404, { error: 'not_found' });
    });

    return {
        server,
        get code() { return pairCode; },
        get port() { return port; },
        // 決まった番号のうち空いているものを使う（127.0.0.1 だけ）
        listen: async (ports = AGENT_PORTS) => {
            for (const p of ports) {
                const ok = await new Promise((resolve, reject) => {
                    const onErr = (e) => { server.off('listening', onOk); e.code === 'EADDRINUSE' ? resolve(false) : reject(e); };
                    const onOk = () => { server.off('error', onErr); resolve(true); };
                    server.once('error', onErr);
                    server.once('listening', onOk);
                    server.listen(p, '127.0.0.1');
                });
                if (ok) { port = server.address().port; return port; }
            }
            throw new Error(`All agent ports are in use (${ports.join(', ')}). Stop another plainhub agent and try again.`);
        },
        close: () => new Promise((r) => { server.close(() => r()); server.closeAllConnections(); }),
    };
}
