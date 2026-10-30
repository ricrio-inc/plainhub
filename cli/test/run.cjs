// cli/ の試験をまとめて流す（PS2b・`cd cli && npm test`）。cli/test/*.test.cjs を1本ずつ別のプロセスで流し、1本でも落ちたら exit 1
//   根の package.json・node_modules に頼らない（ネットワーク・ブラウザ不要）。根の一式からは tests/functions/cli-*.test.cjs が同じ試験を呼ぶ
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.cjs')).sort();
if (!files.length) { console.error('試験が1本も無い: ' + __dirname); process.exit(1); }
const failed = [];
for (const f of files) {
    console.log(`\n=== ${f}`);
    const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit' });
    if (r.status !== 0) failed.push(`${f}（exit ${r.status ?? r.signal}）`);
}
console.log(`\n${files.length - failed.length}/${files.length} files passed`);
for (const f of failed) console.log('FAIL  ' + f);
process.exit(failed.length ? 1 : 0);
