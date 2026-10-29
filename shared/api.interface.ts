/* 前后端共享的类型写在这里 */

export interface Book {
  id: string;
  title: string;
  author: string | null;
  downloadUrl: string;
  fileType: string;
  fileSize: number;
  description: string | null;
  folderId: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface BookListResponse {
  items: Book[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateBookRequest {
  title: string;
  author?: string;
  filePath: string;
  bucketId: string;
  downloadUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  bookCount?: number;
  createdAt: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface UpdateBookFolderRequest {
  folderId: string | null;
}

export interface ReorderBookRequest {
  direction: 'up' | 'down';
}

export interface RenameBookRequest {
  title: string;
}

export interface BatchRenameRequest {
  ids: string[];
  mode: 'prefix' | 'suffix' | 'replace' | 'sequential';
  value?: string;
  replaceWith?: string;
}

export interface CheckDuplicateRequest {
  files: { name: string; size: number }[];
}

export interface CheckDuplicateResponse {
  duplicates: string[];
}

export const FILE_TYPES = ['pdf', 'epub', 'txt', 'docx', 'xlsx', 'pptx', 'mobi', 'azw', 'other'] as const;
export type FileType = (typeof FILE_TYPES)[number];
export const isFileType = (v: string): v is FileType =>
  (FILE_TYPES as readonly string[]).includes(v);
export const FILE_TYPE_LABELS: Record<FileType, string> = {
  pdf: 'PDF',
  epub: 'EPUB',
  txt: 'TXT',
  docx: 'Word',
  xlsx: 'Excel',
  pptx: 'PPT',
  mobi: 'MOBI',
  azw: 'AZW',
  other: '其他',
};

export function getFileTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (FILE_TYPES.includes(ext as FileType)) return ext;
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
}
