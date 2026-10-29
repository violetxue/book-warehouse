/**
 * 初始化 PostgreSQL 数据库（建表 + 索引）
 * 用法：npm run db:init
 * 环境变量：DATABASE_URL（默认 postgres://postgres:postgres@localhost:5432/book_warehouse）
 *
 * 要求：目标 PostgreSQL 实例已运行，且 DATABASE_URL 指向的数据库已存在。
 */
require('dotenv').config();
const postgres = require('postgres');

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/book_warehouse';

const SQL = `
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  parent_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by varchar(64),
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by varchar(64),
  CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON folders(sort_order);

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  author varchar(255),
  file_path text NOT NULL,
  bucket_id varchar(255) NOT NULL,
  download_url text NOT NULL,
  file_type varchar(50) NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  description text,
  folder_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by varchar(64),
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by varchar(64),
  CONSTRAINT books_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_file_type ON books(file_type);
CREATE INDEX IF NOT EXISTS idx_books_folder_id ON books(folder_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(_created_at);
CREATE INDEX IF NOT EXISTS idx_books_sort_order ON books(sort_order);
`;

(async () => {
  const client = postgres(DATABASE_URL, { max: 1 });
  try {
    const safeUrl = DATABASE_URL.replace(/(:\/\/[^:/]+:)[^@]*@/, '$1***@');
    console.log(`连接数据库: ${safeUrl}`);
    await client.unsafe(SQL);
    console.log('数据库表结构初始化完成（folders / books 及索引）✓');
  } catch (err) {
    console.error('数据库初始化失败：', err && err.message ? err.message : err);
    console.error('请确认 PostgreSQL 已启动，且 DATABASE_URL 指向的数据库已创建（例如：createdb book_warehouse）。');
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();
