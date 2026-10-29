/* eslint-disable */
/**
 * 独立部署版数据库 Schema。
 * 原平台自动生成版本依赖 PG 扩展类型 user_profile / file_attachment（仅平台数据库存在），
 * 已适配为标准的 uuid / varchar 类型，可在任意 PostgreSQL 实例上运行。
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  customType,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const folders = pgTable(
  'folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    parentId: uuid('parent_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz('_created_at', { precision: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    // System field: Creator（独立部署为普通 varchar，免登录模式下固定为 anonymous）
    createdBy: varchar('_created_by', { length: 64 }),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz('_updated_at', { precision: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    // System field: Updater（独立部署为普通 varchar）
    updatedBy: varchar('_updated_by', { length: 64 }),
  },
  (table) => [
    index('idx_folders_parent_id').on(table.parentId),
    index('idx_folders_sort_order').on(table.sortOrder),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [folders.id],
      name: 'folders_parent_id_fkey',
    }).onDelete('set null'),
  ],
);

export const books = pgTable(
  'books',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    author: varchar('author', { length: 255 }),
    filePath: text('file_path').notNull(),
    bucketId: varchar('bucket_id', { length: 255 }).notNull(),
    downloadUrl: text('download_url').notNull(),
    fileType: varchar('file_type', { length: 50 }).notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull().default(0),
    description: text('description'),
    folderId: uuid('folder_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz('_created_at', { precision: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    // System field: Creator（独立部署为普通 varchar，免登录模式下固定为 anonymous）
    createdBy: varchar('_created_by', { length: 64 }),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz('_updated_at', { precision: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    // System field: Updater（独立部署为普通 varchar）
    updatedBy: varchar('_updated_by', { length: 64 }),
  },
  (table) => [
    index('idx_books_title').on(table.title),
    index('idx_books_file_type').on(table.fileType),
    index('idx_books_created_at').on(table.createdAt),
    index('idx_books_folder_id').on(table.folderId),
    index('idx_books_sort_order').on(table.sortOrder),
    foreignKey({
      columns: [table.folderId],
      foreignColumns: [folders.id],
      name: 'books_folder_id_fkey',
    }).onDelete('set null'),
  ],
);

// table aliases
export const booksTable = books;
export const foldersTable = folders;
