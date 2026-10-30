// 中継役の中の MCP サーバー（AX0・Your agent に PlainHub の道具を渡す・仕様＝cockpit plainhub-evolve/specs/agent_ui_actions/SPEC.md §4）
//   Claude Code の起動に --mcp-config の type: "sdk" のサーバーを登録すると、Claude Code はそのサーバーへの MCP の送信（JSON-RPC）を
//   stream-json の制御の往復（control_request の subtype: "mcp_message"）で呼び出した側（中継役）に送ってくる。中継役は答えを
//   control_response の response.mcp_response で返す（Agent SDK の createSdkMcpServer と同じ往復・2.1.284 で実測＝tests/lab/agent-sdk-mcp.probe.cjs）。
//   子のプロセスも通信の口も増えない（stdio の MCP サーバーを子として起動して中継する案より部品が少ない）。
//   道具は --allowedTools の mcp__<name>__* で聞かずに使える（読むだけの起動の dontAsk・Auto）。それが無いと dontAsk は断り、Auto は確認（can_use_tool）を送ってくる。
//   Plan は allowedTools にあっても読むだけの印（annotations.readOnlyHint: true）の無い道具を確認に回す → 画面の操作（ファイルも GitHub も変えない）には印を付ける
//   依存なし（agent-core.js と同じ。@modelcontextprotocol/sdk を読まずに、使う4つの送信だけを受ける）
export const MCP_SERVER = 'plainhub';
export const MAX_TOOL_TEXT = 100000;   // 道具の結果・誤りの文の上限（字・答えの上限 MAX_ANSWER と同じ大きさ）
export const MCP_PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];   // 答えられる版（新しい順・知らない版を求められたら先頭を返す＝MCP の決まり）

// Claude Code の起動に足す引数（--strict-mcp-config と一緒に使う＝利用者や起動したフォルダの MCP サーバーは読まない）
//   --mcp-config・--allowedTools は後ろの値をいくつでも取る → 後ろには必ず別の --引数を置く（位置の引数を続けない＝G2・G3 1巡目）
export const mcpArgs = (name = MCP_SERVER) => [
    '--mcp-config', JSON.stringify({ mcpServers: { [name]: { type: 'sdk', name } } }),
    '--allowedTools', `mcp__${name}__*`,
];

// tools: [{ name, description, inputSchema, annotations? }]（Claude Code に見せる一覧）・call(name, args) → 結果の文（Promise 可・無ければ空の文・MAX_TOOL_TEXT 字まで）。
//   投げたら isError の結果にする（文にできない物を投げても落ちない）。引数の形（inputSchema）を確かめて許すキーだけを取り出すのは call の側（AX1 の invalidToolInput）
//   一覧に無い道具・引数が物でない呼び出しは call を呼ばずに断る。返すのは JSON-RPC の答え（通知には答えが無いので null）
export function mcpServer({ name = MCP_SERVER, version = '0', tools = [], call } = {}) {
    const list = tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema, ...(t.annotations && { annotations: t.annotations }) }));
    const known = new Set(list.map(t => t.name));
    const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
    const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
    // 結果を文にする（null・undefined は空・文にできない物＝null-prototype などは fallback）
    const text = (v, fallback = '') => { if (v == null) return fallback; try { return String(v); } catch { return fallback; } };
    return async function handle(message) {
        if (!message || typeof message !== 'object' || typeof message.method !== 'string') return fail(message?.id ?? null, -32600, 'Invalid request');
        const { id, method, params } = message;
        if (id === undefined || id === null) return null;   // 通知（notifications/initialized など）
        if (method === 'initialize') {
            const v = MCP_PROTOCOLS.includes(params?.protocolVersion) ? params.protocolVersion : MCP_PROTOCOLS[0];
            return ok(id, { protocolVersion: v, capabilities: { tools: {} }, serverInfo: { name, version } });
        }
        if (method === 'ping') return ok(id, {});
        if (method === 'tools/list') return ok(id, { tools: list });
        if (method === 'tools/call') {
            const tool = params?.name, args = params?.arguments === undefined ? {} : params.arguments;   // 引数は省いてよい（MCP の決まり）・null は形の違い
            if (typeof tool !== 'string' || !known.has(tool)) return fail(id, -32602, `Unknown tool: ${String(tool).slice(0, 100)}`);
            if (typeof args !== 'object' || Array.isArray(args) || args === null) return fail(id, -32602, 'Invalid arguments');
            try {
                return ok(id, { content: [{ type: 'text', text: text(await call(tool, args)).slice(0, MAX_TOOL_TEXT) }] });
            } catch (e) {
                return ok(id, { content: [{ type: 'text', text: text(e?.message || e, 'The tool failed.').slice(0, 500) }], isError: true });
            }
        }
        return fail(id, -32601, `Method not found: ${method.slice(0, 100)}`);
    };
}

// Claude Code の control_request（mcp_message）への control_response。別のサーバーの名前・形の違う送信は断る（error）
//   通知にも答えを返す（Claude Code は答えを待つ・中身は使わない＝Agent SDK と同じ空の答え）
export async function mcpControl(ev, handle, name = MCP_SERVER) {
    const r = ev?.request, id = ev?.request_id;
    if (r?.subtype !== 'mcp_message' || r.server_name !== name) return { type: 'control_response', response: { subtype: 'error', request_id: id, error: `Unknown MCP server: ${String(r?.server_name).slice(0, 100)}` } };
    const res = await handle(r.message);
    return { type: 'control_response', response: { subtype: 'success', request_id: id, response: { mcp_response: res ?? { jsonrpc: '2.0', id: 0, result: {} } } } };
}
