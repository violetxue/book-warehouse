import { useCallback, useRef, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, Copy } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Progress } from '@client/src/components/ui/progress';
import { Badge } from '@client/src/components/ui/badge';
import {
  formatFileSize,
  getFileTypeFromFileName,
} from '@shared/api.interface';
import { useCreateBook, useCheckDuplicate } from '@client/src/hooks/useBooks';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  folderId: string | null;
}

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  errorMsg?: string;
}

const UploadDialog = ({ open, onOpenChange, onSuccess, folderId }: UploadDialogProps) => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [duplicateNames, setDuplicateNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createBookMutation = useCreateBook();
  const checkDuplicateMutation = useCheckDuplicate();

  const genId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const detectDuplicates = useCallback(async (files: File[]) => {
    if (files.length === 0) return [];
    try {
      const fileList = files.map((f: File) => ({
        name: f.name.replace(/\.[^.]+$/, ''),
        size: f.size,
      }));
      const result = await checkDuplicateMutation.mutateAsync(fileList);
      return result.duplicates;
    } catch {
      return [];
    }
  }, [checkDuplicateMutation]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const duplicates = await detectDuplicates(fileArray);

    const newItems: UploadItem[] = fileArray
      .filter((file: File) => {
        const baseName = file.name.replace(/\.[^.]+$/, '');
        return !duplicates.includes(baseName);
      })
      .map((file: File) => ({
        id: genId(),
        file,
        progress: 0,
        status: 'pending' as const,
      }));

    if (duplicates.length > 0) {
      toast.warning(
        `检测到 ${duplicates.length} 个重复文件，已自动跳过`,
        {
          description: duplicates.slice(0, 3).join('、') + (duplicates.length > 3 ? ` 等 ${duplicates.length} 个` : ''),
          duration: 4000,
        },
      );
      setDuplicateNames(duplicates);
    }

    setItems((prev) => [...prev, ...newItems]);
  }, [detectDuplicates]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadSingleFile = async (item: UploadItem): Promise<boolean> => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: 'uploading' as const, progress: 0 } : i,
      ),
    );

    try {
      const dataloom = await getDataloom();
      const bucketId = getDefaultBucketId();

      const { data, error } = await dataloom.storage
        .from(bucketId)
        .uploadFile(item.file);

      if (error || !data) {
        const errMsg =
          error?.message ??
          ('error_msg' in (error as unknown as Record<string, unknown>)
            ? String((error as unknown as Record<string, unknown>).error_msg)
            : '未知错误');
        throw new Error('上传失败: ' + errMsg);
      }

      const { download_url: downloadUrl, file_path: filePath } = data;

      const fileType = getFileTypeFromFileName(item.file.name);
      const title = item.file.name.replace(/\.[^.]+$/, '');

      await createBookMutation.mutateAsync({
        title,
        filePath,
        bucketId,
        downloadUrl,
        fileType,
        fileSize: item.file.size,
        folderId: folderId ?? undefined,
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'success' as const, progress: 100 } : i,
        ),
      );
      return true;
    } catch (error) {
      logger.error('上传文件失败', item.file.name, error);
      const errMsg =
        error instanceof Error ? error.message : '上传失败，请重试';
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'error' as const, errorMsg: errMsg }
            : i,
        ),
      );
      return false;
    }
  };

  const handleStartUpload = async () => {
    const pendingItems = items.filter((i) => i.status === 'pending');
    if (pendingItems.length === 0) return;

    const results = await Promise.all(
      pendingItems.map((item) => uploadSingleFile(item)),
    );
    const successCount = results.filter(Boolean).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      toast.success(`成功上传 ${successCount} 个文件`);
      onSuccess();
    }
    if (failCount > 0) {
      toast.error(`${failCount} 个文件上传失败`);
    }
  };

  const handleClose = () => {
    if (items.some((i) => i.status === 'uploading')) {
      return;
    }
    setItems([]);
    setDuplicateNames([]);
    onOpenChange(false);
  };

  const hasPending = items.some((i) => i.status === 'pending');
  const isUploading = items.some((i) => i.status === 'uploading');
  const allDone = items.length > 0 && items.every((i) => i.status !== 'pending' && i.status !== 'uploading');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>上传书籍</DialogTitle>
        </DialogHeader>

        {/* 拖拽区域 */}
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-foreground">
              拖拽文件到这里，或点击选择文件
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              支持 PDF、EPUB、TXT、Word、Excel、PPT 等多种格式
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* 文件列表 */}
        {items.length > 0 && (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {item.file.name}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {formatFileSize(item.file.size)}
                    </Badge>
                  </div>
                  {item.status === 'uploading' && (
                    <Progress value={item.progress} className="mt-2 h-1.5" />
                  )}
                  {item.status === 'error' && (
                    <p className="mt-1 text-xs text-destructive">
                      {item.errorMsg}
                    </p>
                  )}
                  {item.status === 'pending' && duplicateNames.includes(item.file.name.replace(/\.[^.]+$/, '')) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                      <Copy className="h-3 w-3" />
                      重复文件已跳过
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  {item.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      aria-label="移除文件"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部操作 */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {items.length} 个文件
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {allDone ? '关闭' : '取消'}
            </Button>
            <Button
              onClick={handleStartUpload}
              disabled={!hasPending || isUploading}
            >
              {isUploading ? '上传中...' : '开始上传'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
