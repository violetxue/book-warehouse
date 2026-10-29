import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Search,
  Upload,
  BookOpen,
  PackageOpen,
  Trash2,
  Library,
  Filter,
  Edit3,
  X,
  CheckSquare,
} from 'lucide-react';
import { logger, axiosForBackend } from '@client/src/lib/platform';
import { toast } from 'sonner';
import { useDebounce } from '@client/src/hooks/useDebounce';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@client/src/components/ui/empty';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@client/src/components/ui/sheet';
import BookCard from './BookCard';
import FolderSidebar from './FolderSidebar';
import UploadDialog from './UploadDialog';
import BookPreviewDialog from './BookPreviewDialog';
import MoveBookDialog from './MoveBookDialog';
import RenameBookDialog from './RenameBookDialog';
import BatchRenameDialog from './BatchRenameDialog';
import {
  useBooks,
  useDeleteBook,
  useReorderBook,
  useFolders,
  useBatchDelete,
} from '@client/src/hooks/useBooks';
import {
  FILE_TYPES,
  FILE_TYPE_LABELS,
  type Book,
} from '@shared/api.interface';

const BookshelfPage = () => {
  const [keyword, setKeyword] = useState('');
  const [fileType, setFileType] = useState<string>('all');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);
  const [moveBook, setMoveBook] = useState<Book | null>(null);
  const [renameBook, setRenameBook] = useState<Book | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchRenameOpen, setBatchRenameOpen] = useState(false);
  const [page] = useState(1);
  const [pageSize] = useState(100);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const debouncedKeyword = useDebounce(keyword, 300);
  const { data: folders = [] } = useFolders();

  const queryParams = useMemo(() => {
    const params: {
      keyword?: string;
      fileType?: string;
      folderId?: string;
      page: number;
      pageSize: number;
    } = { page, pageSize };
    if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
    if (fileType && fileType !== 'all') params.fileType = fileType;
    if (folderId !== null) params.folderId = folderId;
    return params;
  }, [debouncedKeyword, fileType, folderId, page, pageSize]);

  const { data, isLoading, isError, error } = useBooks(queryParams);
  const deleteBookMutation = useDeleteBook();
  const reorderMutation = useReorderBook();
  const batchDeleteMutation = useBatchDelete();

  useEffect(() => {
    if (!selectMode) {
      setSelectedIds([]);
    }
  }, [selectMode]);

  useEffect(() => {
    setSelectedIds([]);
  }, [folderId, keyword, fileType]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allIds = (data?.items ?? []).map((b: Book) => b.id);
    if (selectedIds.length === allIds.length && allIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  }, [data?.items, selectedIds.length]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    try {
      await batchDeleteMutation.mutateAsync(selectedIds);
      setSelectMode(false);
      setSelectedIds([]);
      if (previewBook && selectedIds.includes(previewBook.id)) {
        setPreviewBook(null);
      }
    } catch {
      // error handled by mutation onError
    }
  }, [selectedIds, batchDeleteMutation, previewBook]);

  const currentFolderName = useMemo(() => {
    if (folderId === null) return '全部书籍';
    return folders.find((f) => f.id === folderId)?.name ?? '全部书籍';
  }, [folderId, folders]);

  const handlePreview = useCallback((book: Book) => {
    setPreviewBook(book);
  }, []);

  const handleDownload = useCallback((book: Book) => {
    try {
      const a = document.createElement('a');
      a.href = book.downloadUrl;
      a.download = book.title + '.' + book.fileType;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      logger.error('下载失败', err);
      toast.error('下载失败，请稍后重试');
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const currentTotal = data?.total ?? 0;
    if (currentTotal === 0) {
      toast.warning('书库是空的，没有可下载的书籍');
      return;
    }
    try {
      const res = await axiosForBackend.get('/api/books/download/all', {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'books-library.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('打包下载成功');
    } catch (err) {
      logger.error('打包下载失败', err);
      toast.error('打包下载失败，请稍后重试');
    }
  }, [data?.total]);

  const handleUploadSuccess = useCallback(() => {
    setUploadOpen(false);
  }, []);

  const handleDelete = useCallback((book: Book) => {
    setDeleteBook(book);
  }, []);

  const handleMove = useCallback((book: Book) => {
    setMoveBook(book);
  }, []);

  const handleRename = useCallback((book: Book) => {
    setRenameBook(book);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteBook) return;
    try {
      await deleteBookMutation.mutateAsync(deleteBook.id);
      if (previewBook?.id === deleteBook.id) {
        setPreviewBook(null);
      }
      setDeleteBook(null);
    } catch {
      // error handled by mutation onError
    }
  }, [deleteBook, deleteBookMutation, previewBook?.id]);

  const handleReorder = useCallback(
    (id: string, direction: 'up' | 'down') => {
      reorderMutation.mutate({ id, direction });
    },
    [reorderMutation],
  );

  const books = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <FolderSidebar
          currentFolderId={folderId}
          onSelectFolder={setFolderId}
        />
      </div>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="打开文件夹"
                >
                  <Library className="h-5 w-5 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>文件夹</SheetTitle>
                </SheetHeader>
                <div className="h-full overflow-y-auto py-4">
                  <FolderSidebar
                    currentFolderId={folderId}
                    onSelectFolder={(id) => {
                      setFolderId(id);
                      setFilterSheetOpen(false);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-foreground">
                  清爽书库
                </h1>
                <p className="text-xs text-muted-foreground">
                  护眼淡绿 · 阅读更舒适
                </p>
              </div>
              <h1 className="text-base font-semibold text-foreground sm:hidden">
                清爽书库
              </h1>
            </div>

            <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索书名、作者..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-9"
                />
              </div>
              {selectMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedIds([]);
                  }}
                >
                  <X className="h-4 w-4" />
                  取消选择
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectMode(true)}
                    className="hidden sm:flex"
                  >
                    <CheckSquare className="h-4 w-4" />
                    多选
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    className="hidden sm:flex"
                  >
                    <PackageOpen className="h-4 w-4" />
                    打包下载
                  </Button>
                </>
              )}
              <Button
                size="sm"
                onClick={() => setUploadOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">上传书籍</span>
                <span className="sm:hidden">上传</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                {currentFolderName}
              </h2>
              {!isLoading && total > 0 && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  共 <span className="font-medium text-primary">{total}</span> 本
                </p>
              )}
            </div>

            {selectMode && books.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  已选 <span className="font-semibold text-primary">{selectedIds.length}</span> / {books.length} 本
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="h-7 px-2 text-xs"
                >
                  {selectedIds.length === books.length ? '取消全选' : '全选'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBatchRenameOpen(true)}
                  disabled={selectedIds.length === 0}
                  className="h-7 px-2 text-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  批量重命名
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleBatchDelete}
                  disabled={selectedIds.length === 0 || batchDeleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {batchDeleteMutation.isPending ? '删除中...' : '批量删除'}
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="hidden flex-wrap gap-1.5 sm:flex">
                <Badge
                  variant={fileType === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFileType('all')}
                >
                  全部
                </Badge>
                {FILE_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={fileType === type ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFileType(type)}
                  >
                    {FILE_TYPE_LABELS[type]}
                  </Badge>
                ))}
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="sm:hidden"
                    aria-label="筛选"
                  >
                    <Filter className="h-4 w-4" />
                    筛选
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto rounded-t-2xl">
                  <div className="space-y-4 pb-8 pt-2">
                    <h3 className="text-sm font-medium text-foreground">
                      文件类型筛选
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={fileType === 'all' ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setFileType('all')}
                      >
                        全部
                      </Badge>
                      {FILE_TYPES.map((type) => (
                        <Badge
                          key={type}
                          variant={fileType === type ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setFileType(type)}
                        >
                          {FILE_TYPE_LABELS[type]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border/60"
                >
                  <Skeleton className="h-32 w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="flex gap-1.5 px-3 pb-3">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-7 w-7" />
                    <div className="ml-auto flex gap-1.5">
                      <Skeleton className="h-7 w-7" />
                      <Skeleton className="h-7 w-7" />
                      <Skeleton className="h-7 w-7" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <Empty className="my-16">
              <EmptyMedia variant="icon">
                <BookOpen className="h-6 w-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>加载失败</EmptyTitle>
                <EmptyDescription>
                  {error instanceof Error
                    ? error.message
                    : '书籍列表加载失败，请稍后重试'}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  重新加载
                </Button>
              </EmptyContent>
            </Empty>
          )}

          {!isLoading && !isError && books.length === 0 && (
            <Empty className="my-16">
              <EmptyMedia variant="icon">
                <BookOpen className="h-6 w-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>这里还没有书</EmptyTitle>
                <EmptyDescription>
                  {keyword
                    ? '没有找到匹配的书籍，换个关键词试试'
                    : folderId
                      ? '这个文件夹还是空的，把书籍移进来吧'
                      : '上传你的第一本书，开始构建你的私人书库'}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {!keyword && !folderId && (
                  <Button onClick={() => setUploadOpen(true)}>
                    <Upload className="h-4 w-4" />
                    上传书籍
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          )}

          {!isLoading && !isError && books.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book: Book, index: number) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === books.length - 1}
                  selectable={selectMode}
                  selected={selectedIds.includes(book.id)}
                  onSelect={toggleSelect}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onMove={handleMove}
                  onRename={handleRename}
                  onReorder={handleReorder}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <button
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg sm:hidden"
        onClick={() => setUploadOpen(true)}
        aria-label="上传书籍"
      >
        <Upload className="h-6 w-6" />
      </button>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
        folderId={folderId}
      />

      <BookPreviewDialog
        book={previewBook}
        onOpenChange={(open) => {
          if (!open) setPreviewBook(null);
        }}
      />

      <MoveBookDialog
        book={moveBook}
        open={moveBook !== null}
        onOpenChange={(open) => {
          if (!open) setMoveBook(null);
        }}
      />

      <RenameBookDialog
        book={renameBook}
        open={renameBook !== null}
        onOpenChange={(open) => {
          if (!open) setRenameBook(null);
        }}
      />

      <BatchRenameDialog
        selectedIds={selectedIds}
        open={batchRenameOpen}
        onOpenChange={(open) => {
          if (!open) setBatchRenameOpen(false);
        }}
      />

      <AlertDialog
        open={deleteBook !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteBook(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              删除书籍
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除《
              <span className="font-medium text-foreground">
                {deleteBook?.title}
              </span>
              》吗？
              <br />
              此操作不可撤销，文件将从书库中永久移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={confirmDelete}
              disabled={deleteBookMutation.isPending}
            >
              {deleteBookMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookshelfPage;
