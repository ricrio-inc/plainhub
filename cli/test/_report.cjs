// cli/ の試験の結果の出し方（PS2b・cli/ の中だけで動く＝根の tests/security/_harness.cjs の report と同じ出力・playwright に頼らない）
const maskSecrets = text => String(text).replace(/\b(gh[pousr]_|github_pat_|sk-ant-)[A-Za-z0-9_-]{8,}/g, '$1***');

function report(results) {
    for (const { name, ok, detail } of results) console.log(maskSecrets(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`));
    const failed = results.filter(r => !r.ok).length;
    console.log(failed ? `\n${failed} FAILED` : '\nALL PASS');
    // 落ちた確かめの名前を最後にも出す（根の一式は出力の最後の5行しか残さない）
    for (const r of results.filter(r => !r.ok).slice(0, 3)) console.log(maskSecrets(`FAIL  ${r.name.slice(0, 80)}${r.detail ? '  — ' + String(r.detail).slice(0, 120) : ''}`));
    process.exit(failed ? 1 : 0);
}

module.exports = { maskSecrets, report };
