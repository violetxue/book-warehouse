/**
 * 本地冒烟验证用：启动嵌入式 PostgreSQL（embedded-postgres）临时实例。
 * 用法：node scripts/pg-smoke.js
 * 环境变量：PG_DATA_DIR（数据目录，默认 ./.pgdata-smoke）
 * 说明：此脚本仅用于本地验证；生产部署请使用独立的 PostgreSQL 服务。
 */
require('dotenv').config();
const path = require('path');
const { default: EmbeddedPostgres } = require('embedded-postgres');

const ROOT = path.resolve(__dirname, '..');
const dataDir = process.env.PG_DATA_DIR || path.join(ROOT, '.pgdata-smoke');
const PG_PORT = Number(process.env.PG_SMOKE_PORT || '5432');

(async () => {
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: PG_PORT,
    user: 'postgres',
    password: 'postgres',
    persistent: true,
    timeout: 120000,
  });

  await pg.initialise();
  console.log('[pg-smoke] PostgreSQL binary initialised');

  try {
    await pg.start();
    console.log(`[pg-smoke] PostgreSQL started on 127.0.0.1:${PG_PORT}`);
  } catch (e) {
    console.log(`[pg-smoke] start note: ${e && e.message ? e.message : e}`);
  }

  try {
    await pg.createDatabase('book_warehouse');
    console.log('[pg-smoke] database book_warehouse ready');
  } catch (e) {
    console.log(`[pg-smoke] createDatabase note: ${e && e.message ? e.message : e}`);
  }

  console.log('[pg-smoke] keeping alive...');
  // keep process alive
  setInterval(() => {}, 1 << 30);
})().catch((e) => {
  console.error('[pg-smoke] failed:', e);
  process.exit(1);
});
