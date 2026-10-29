import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createBook,
  deleteBook,
  batchDeleteBooks,
  getBooks,
  getFolders,
  createFolder,
  deleteFolder,
  renameFolder,
  moveBookToFolder,
  reorderBook,
  renameBook,
  batchRenameBooks,
  checkDuplicate,
} from '@client/src/api/books';
import { getApiErrorMessage } from '@client/src/lib/api-error';
import type {
  BookListResponse,
  CreateBookRequest,
  Folder,
  CreateFolderRequest,
} from '@shared/api.interface';

interface UseBooksParams {
  keyword?: string;
  fileType?: string;
  folderId?: string;
  page?: number;
  pageSize?: number;
}

export function useBooks(params: UseBooksParams) {
  return useQuery<BookListResponse>({
    queryKey: ['books', params],
    queryFn: () => getBooks(params),
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBookRequest) => createBook(body),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '创建书籍记录失败'));
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBook(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('删除成功');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '删除失败'));
    },
  });
}

export function useBatchDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => batchDeleteBooks(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('批量删除成功');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '批量删除失败'));
    },
  });
}

export function useMoveBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      moveBookToFolder(id, folderId),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('移动成功');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '移动失败'));
    },
  });
}

export function useReorderBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 'up' | 'down' }) =>
      reorderBook(id, direction),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '排序失败'));
    },
  });
}

export function useRenameBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      renameBook(id, title),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('重命名成功');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '重命名失败'));
    },
  });
}

export function useBatchRename() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      ids: string[];
      mode: 'prefix' | 'suffix' | 'replace' | 'sequential';
      value?: string;
      replaceWith?: string;
    }) => batchRenameBooks(params),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('批量重命名成功');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '批量重命名失败'));
    },
  });
}

export function useCheckDuplicate() {
  return useMutation({
    mutationFn: (files: { name: string; size: number }[]) =>
      checkDuplicate(files),
    retry: false,
  });
}

export function useFolders() {
  return useQuery<Folder[]>({
    queryKey: ['folders'],
    queryFn: () => getFolders(),
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFolderRequest) => createFolder(body),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('文件夹创建成功');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '创建文件夹失败'));
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['folders'] });
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('文件夹删除成功');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '删除文件夹失败'));
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameFolder(id, name),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('重命名成功');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '重命名失败'));
    },
  });
}
