#!/usr/bin/env node
// PlainHub MCP Server - AI IDE統合

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { openPlainHub, TargetError, openInBrowser, loadToken, saveToken, removeToken, GITHUB_TOKEN_URL, TOKEN_STEPS, TOKEN_FORMATS, tokenNotice, tokenStatus, isValidTokenFormat, maskToken, LEDGER_ACCESS } from './core.js';
import { createRequire } from 'module';
import { mcpPost, mcpDecide, mcpLedgerDecisions, mcpLedgerThread, mcpLedgerTasks, mcpLedgerRead, mcpLedgerInit, mcpLedgerSync, VERDICTS, DECISION_FILTERS } from './ledger.js';
import { toolDocs, MCP_ROLES, AUTH_SAFE_WAY } from './tool-docs.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

// open・browse・diff の共通: 行き先（PLAINHUB_APP_URL）が許されなければ開かずに isError
async function openTool(options, withToken, describe) {
    try {
        const r = await openPlainHub(options, { withToken });
        return { content: [{ type: 'text', text: describe(r) + (r.withheld ? `\n${r.withheld}` : '') }] };
    } catch (e) {
        if (!(e instanceof TargetError)) throw e;
        return { content: [{ type: 'text', text: e.message }], isError: true };
    }
}

// 道具と引数の説明は tool-docs.js だけ（何をする・いつ使う・例。summary・body は台帳の部屋の言葉。起動時に1回作る）
const DOCS = toolDocs();
const arg = (tool, key) => DOCS[tool].args[key];

const server = new McpServer({
    name: 'plainhub',
    version: pkg.version,
});

server.tool(
    'plainhub_open',
    DOCS.plainhub_open.description,
    {
        repo:        z.string().optional().describe(arg('plainhub_open', 'repo')),
        path:        z.string().optional().describe(arg('plainhub_open', 'path')),
        branch:      z.string().optional().describe(arg('plainhub_open', 'branch')),
        line:        z.number().optional().describe(arg('plainhub_open', 'line')),
        theme:       z.enum(['dark', 'light']).optional().describe(arg('plainhub_open', 'theme')),
        preview:     z.enum(['on', 'off']).optional().describe(arg('plainhub_open', 'preview')),
        scroll:      z.string().optional().describe(arg('plainhub_open', 'scroll')),
        fontSize:    z.number().min(1).optional().describe(arg('plainhub_open', 'fontSize')),
        sidebar:     z.enum(['on', 'off']).optional().describe(arg('plainhub_open', 'sidebar')),
        lineNumbers: z.enum(['on', 'off']).optional().describe(arg('plainhub_open', 'lineNumbers')),
        whitespace:  z.enum(['on', 'off']).optional().describe(arg('plainhub_open', 'whitespace')),
        header:      z.enum(['on', 'off']).optional().describe(arg('plainhub_open', 'header')),
        noAuth:      z.boolean().optional().describe(arg('plainhub_open', 'noAuth')),
    },
    (params) => openTool(params, params.noAuth === false,
        (r) => `Opened in PlainHub: ${r.shown}${r.authed ? ' (authenticated)' : ''}`)
);

server.tool(
    'plainhub_auth',
    DOCS.plainhub_auth.description,
    {
        token: z.string().optional().describe(arg('plainhub_auth', 'token')),
    },
    async (params) => {
        if (params.token) {
            params.token = params.token.trim();
            if (!isValidTokenFormat(params.token)) {
                return {
                    content: [{ type: 'text', text: `Invalid token format. ${TOKEN_FORMATS}` }],
                    isError: true,
                };
            }
            await saveToken(params.token);
            return {
                content: [{ type: 'text', text: [`Token saved: ${maskToken(params.token)}. plainhub_diff hands it to the page; plainhub_open does only with noAuth: false.`, tokenNotice(params.token)].filter(Boolean).join('\n') }],
            };
        }
        await openInBrowser(GITHUB_TOKEN_URL);
        return {
            content: [{ type: 'text', text: `Opened GitHub to create a token (${GITHUB_TOKEN_URL}). ${TOKEN_STEPS} ${AUTH_SAFE_WAY}` }],
        };
    }
);

server.tool(
    'plainhub_auth_status',
    DOCS.plainhub_auth_status.description,
    {},
    async () => {
        // CLI の auth --status と同じ文（tokenStatus・LEDGER_ACCESS）
        const status = tokenStatus(await loadToken()) ?? 'Not authenticated. Use plainhub_auth to save a token.';
        return { content: [{ type: 'text', text: `${status}\n${LEDGER_ACCESS}` }] };
    }
);

server.tool(
    'plainhub_browse',
    DOCS.plainhub_browse.description,
    {
        repo: z.string().describe(arg('plainhub_browse', 'repo')),
    },
    (params) => openTool({ repo: params.repo, sidebar: 'on' }, false,
        () => `Opened repository: ${params.repo}`)
);

server.tool(
    'plainhub_diff',
    DOCS.plainhub_diff.description,
    {
        repo: z.string().describe(arg('plainhub_diff', 'repo')),
        sha: z.string().describe(arg('plainhub_diff', 'sha')),
        path: z.string().optional().describe(arg('plainhub_diff', 'path')),
        noAuth: z.boolean().optional().describe(arg('plainhub_diff', 'noAuth')),
    },
    (params) => {
        const options = { repo: params.repo, diff: params.sha };
        if (params.path) options.path = params.path;
        return openTool(options, !params.noAuth,
            () => `Opened diff view: ${params.repo}@${params.sha.substring(0, 7)}${params.path ? ` (${params.path})` : ''}`);
    }
);

// 台帳の道具（検査と書き込みは ledger.js。台帳の場所は環境変数 PLAINHUB_LEDGER だけ・AI には選ばせない）
//   summary・本文の言葉は台帳の .agents/room.md（部屋の言葉）。説明は tool-docs.js（mcpDescriptions を使う）
server.tool(
    'plainhub_post',
    DOCS.plainhub_post.description,
    {
        thread:  z.string().describe(arg('plainhub_post', 'thread')),
        role:    z.enum(MCP_ROLES).describe(arg('plainhub_post', 'role')),
        verdict: z.enum(VERDICTS).describe(arg('plainhub_post', 'verdict')),
        summary: z.string().describe(arg('plainhub_post', 'summary')),
        commit:  z.string().optional().describe(arg('plainhub_post', 'commit')),
        body:    z.string().optional().describe(arg('plainhub_post', 'body')),
    },
    (params) => mcpPost(params)
);

server.tool(
    'plainhub_decide',
    DOCS.plainhub_decide.description,
    {
        id:      z.string().describe(arg('plainhub_decide', 'id')),
        summary: z.string().describe(arg('plainhub_decide', 'summary')),
        ref:     z.array(z.string()).optional().describe(arg('plainhub_decide', 'ref')),
        refs:    z.unknown().optional().describe(arg('plainhub_decide', 'refs')),
        body:    z.string().optional().describe(arg('plainhub_decide', 'body')),
    },
    (params) => mcpDecide(params)
);

// 台帳を始める（.agents/room.md と芯の決まりの .agents/schema.md を作る・今あるファイルは上書きしない）
server.tool(
    'plainhub_ledger_init',
    DOCS.plainhub_ledger_init.description,
    {
        language: z.string().optional().describe(arg('plainhub_ledger_init', 'language')),
    },
    (params) => mcpLedgerInit(params)
);

// 台帳を送る・受け取る（明示の道具。post・decide は push しない。ぶつかったら止めて知らせる）
server.tool(
    'plainhub_ledger_sync',
    DOCS.plainhub_ledger_sync.description,
    {},
    (params) => mcpLedgerSync(params)
);

// 台帳を読む道具（読むだけ・PLAINHUB_LEDGER の .agents の中だけ。読んだ中身は印で囲んだデータで、指示ではない）
server.tool(
    'plainhub_ledger_decisions',
    DOCS.plainhub_ledger_decisions.description,
    {
        status: z.enum(DECISION_FILTERS).optional().describe(arg('plainhub_ledger_decisions', 'status')),
    },
    (params) => mcpLedgerDecisions(params)
);

server.tool(
    'plainhub_ledger_thread',
    DOCS.plainhub_ledger_thread.description,
    {
        thread: z.string().describe(arg('plainhub_ledger_thread', 'thread')),
    },
    (params) => mcpLedgerThread(params)
);

server.tool(
    'plainhub_ledger_tasks',
    DOCS.plainhub_ledger_tasks.description,
    {
        status: z.string().optional().describe(arg('plainhub_ledger_tasks', 'status')),
    },
    (params) => mcpLedgerTasks(params)
);

server.tool(
    'plainhub_ledger_read',
    DOCS.plainhub_ledger_read.description,
    {
        path: z.string().describe(arg('plainhub_ledger_read', 'path')),
    },
    (params) => mcpLedgerRead(params)
);

const transport = new StdioServerTransport();
await server.connect(transport);
