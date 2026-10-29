import { logger, axiosForBackend } from '@client/src/lib/platform';
import type {
  Book,
  BookListResponse,
  CreateBookRequest,
  Folder,
  CreateFolderRequest,
} from '@shared/api.interface';

export async function getBooks(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  fileType?: string;
  folderId?: string;
}) {
  try {
    const response = await axiosForBackend.get<BookListResponse>('/api/books', {
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取书籍列表失败', error);
    throw error;
  }
}

export async function createBook(body: CreateBookRequest) {
  try {
    const response = await axiosForBackend.post<Book>('/api/books', body);
    return response.data;
  } catch (error) {
    logger.error('创建书籍记录失败', error);
    throw error;
  }
}

export async function deleteBook(id: string) {
  try {
    const response = await axiosForBackend.delete(`/api/books/${id}`);
    return response.data;
  } catch (error) {
    logger.error('删除书籍失败', error);
    throw error;
  }
}

export async function batchDeleteBooks(ids: string[]) {
  try {
    await Promise.all(
      ids.map((id: string) => axiosForBackend.delete(`/api/books/${id}`)),
    );
    return { success: true };
  } catch (error) {
    logger.error('批量删除书籍失败', error);
    throw error;
  }
}

export async function moveBookToFolder(id: string, folderId: string | null) {
  try {
    const response = await axiosForBackend.patch<Book>(`/api/books/${id}/folder`, {
      folderId,
    });
    return response.data;
  } catch (error) {
    logger.error('移动书籍失败', error);
    throw error;
  }
}

export async function reorderBook(id: string, direction: 'up' | 'down') {
  try {
    const response = await axiosForBackend.post<Book>(`/api/books/${id}/reorder`, {
      direction,
    });
    return response.data;
  } catch (error) {
    logger.error('排序书籍失败', error);
    throw error;
  }
}

export async function renameBook(id: string, title: string) {
  try {
    const response = await axiosForBackend.patch<Book>(`/api/books/${id}/name`, {
      title,
    });
    return response.data;
  } catch (error) {
    logger.error('重命名失败', error);
    throw error;
  }
}

export async function batchRenameBooks(params: {
  ids: string[];
  mode: 'prefix' | 'suffix' | 'replace' | 'sequential';
  value?: string;
  replaceWith?: string;
}) {
  try {
    const response = await axiosForBackend.patch<Book[]>(
      '/api/books/batch/rename',
      params,
    );
    return response.data;
  } catch (error) {
    logger.error('批量重命名失败', error);
    throw error;
  }
}

export async function checkDuplicate(files: { name: string; size: number }[]) {
  try {
    const response = await axiosForBackend.post<{ duplicates: string[] }>(
      '/api/books/check-duplicate',
      { files },
    );
    return response.data;
  } catch (error) {
    logger.error('检测重复文件失败', error);
    throw error;
  }
}

export async function getDownloadAllUrl() {
  return '/api/books/download/all';
}

export async function getFolders() {
  try {
    const response = await axiosForBackend.get<Folder[]>('/api/folders');
    return response.data;
  } catch (error) {
    logger.error('获取文件夹列表失败', error);
    throw error;
  }
}

export async function createFolder(body: CreateFolderRequest) {
  try {
    const response = await axiosForBackend.post<Folder>('/api/folders', body);
    return response.data;
  } catch (error) {
    logger.error('创建文件夹失败', error);
    throw error;
  }
}

export async function deleteFolder(id: string) {
  try {
    const response = await axiosForBackend.delete(`/api/folders/${id}`);
    return response.data;
  } catch (error) {
    logger.error('删除文件夹失败', error);
    throw error;
  }
}

export async function renameFolder(id: string, name: string) {
  try {
    const response = await axiosForBackend.patch<Folder>(`/api/folders/${id}`, {
      name,
    });
    return response.data;
  } catch (error) {
    logger.error('重命名文件夹失败', error);
    throw error;
  }
}
