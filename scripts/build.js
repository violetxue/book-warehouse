/**
 * 独立部署构建脚本（跨平台，替代原平台 scripts/build.sh）
 * 1. 清理 dist
 * 2. nest build（server → dist/server）
 * 3. vite build（client → dist/client）
 * 4. 拷贝 client/public 静态资源到 dist/client（favicon 等）
 * 5. 拷贝 .env（若存在）到 dist/.env
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log('== 清理 dist ==');
rmrf(path.join(root, 'dist'));

console.log('== 构建 server（nest build → dist/server）==');
run('npx nest build');

console.log('== 构建 client（vite build → dist/client）==');
run('npx vite build --config vite.config.ts');

console.log('== 拷贝 client/public → dist/client ==');
copyDir(path.join(root, 'client', 'public'), path.join(root, 'dist', 'client'));

console.log('== 拷贝 .env → dist/.env ==');
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) fs.copyFileSync(envFile, path.join(root, 'dist', '.env'));

console.log('\n构建完成：');
console.log('  - 后端: dist/server/main.js');
console.log('  - 前端: dist/client/index.html');
console.log('运行: npm start（node dist/server/main.js）');
