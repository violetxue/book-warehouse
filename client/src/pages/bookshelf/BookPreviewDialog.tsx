import { useEffect, useState } from 'react';
import { Download, X, Loader2, AlertCircle, FileText } from 'lucide-react';
import { logger } from '@client/src/lib/platform';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { getApiErrorMessage } from '@client/src/lib/api-error';
import {
  FILE_TYPE_LABELS,
  formatFileSize,
  isFileType,
} from '@shared/api.interface';
import type { Book } from '@shared/api.interface';

interface BookPreviewDialogProps {
  book: Book | null;
  onOpenChange: (open: boolean) => void;
}

type PreviewStatus = 'loading' | 'success' | 'error';

// 检测预览库是否可用
function hasPdfJs(): boolean {
  try {
    // 动态检查，不实际导入
    return false;
  } catch {
    return false;
  }
}

function hasDocxPreview(): boolean {
  return false;
}

function hasXlsx(): boolean {
  return false;
}

function hasPptxPreview(): boolean {
  return false;
}

function getTypeLabel(fileType: string): string {
  if (isFileType(fileType)) return FILE_TYPE_LABELS[fileType];
  return FILE_TYPE_LABELS.other;
}

const PREVIEWABLE_TYPES = new Set(['pdf', 'txt', 'docx', 'xlsx', 'pptx']);

const BookPreviewDialog = ({
  book,
  onOpenChange,
}: BookPreviewDialogProps) => {
  const [status, setStatus] = useState<PreviewStatus>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [txtContent, setTxtContent] = useState<string>('');
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const open = book !== null;

  useEffect(() => {
    if (!book) return;

    setStatus('loading');
    setErrorMsg('');
    setTxtContent('');
    setIframeLoaded(false);

    const fileType = book.fileType;

    // TXT 类型：fetch 内容后用 pre 展示
    if (fileType === 'txt') {
      const controller = new AbortController();
      fetch(book.downloadUrl, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          setTxtContent(text);
          setStatus('success');
        })
        .catch((err) => {
          if ((err as { name?: string }).name === 'AbortError') return;
          logger.error('TXT 文件加载失败', err);
          setErrorMsg('文件加载失败，请下载后查看');
          setStatus('error');
        });

      return () => controller.abort();
    }

    // PDF 类型：优先 iframe 预览（浏览器内置 PDF 阅读器）
    if (fileType === 'pdf') {
      // 用 iframe 加载，大多数浏览器自带 PDF 阅读器
      setStatus('success');
      return;
    }

    // docx / xlsx / pptx：库未安装时降级
    if (fileType === 'docx' && !hasDocxPreview()) {
      setErrorMsg('当前未安装 docx 预览组件，请下载后查看');
      setStatus('error');
      return;
    }
    if (fileType === 'xlsx' && !hasXlsx()) {
      setErrorMsg('当前未安装 xlsx 预览组件，请下载后查看');
      setStatus('error');
      return;
    }
    if (fileType === 'pptx' && !hasPptxPreview()) {
      setErrorMsg('当前未安装 pptx 预览组件，请下载后查看');
      setStatus('error');
      return;
    }

    // 其他不支持预览的格式
    if (!PREVIEWABLE_TYPES.has(fileType)) {
      setErrorMsg('该格式暂不支持在线预览，请下载后查看');
      setStatus('error');
    }
  }, [book]);

  const handleDownload = () => {
    if (!book) return;
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
      toast.error(getApiErrorMessage(err, '下载失败'));
    }
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const handleIframeError = () => {
    setIframeLoaded(true);
    setErrorMsg('预览加载失败，请下载后查看');
    setStatus('error');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[85vh] max-w-5xl flex-col p-0 sm:max-w-[90vw]"
        showCloseButton={false}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between border-b px-6 py-3">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="truncate max-w-[60vw]">{book?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              下载
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="关闭预览"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 元信息 */}
        <div className="flex items-center gap-4 border-b bg-muted/30 px-6 py-2 text-sm text-muted-foreground">
          <span>格式：{book ? getTypeLabel(book.fileType) : ''}</span>
          <span>大小：{book ? formatFileSize(book.fileSize) : ''}</span>
          <span>作者：{book?.author || '未知作者'}</span>
        </div>

        {/* 预览内容 */}
        <div className="relative flex-1 overflow-hidden bg-muted/20">
          {status === 'loading' && (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>加载中...</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex h-full w-full items-center justify-center p-8">
              <div className="flex max-w-md flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div>
                  <p className="font-medium text-foreground">无法预览</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {errorMsg}
                  </p>
                </div>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  下载文件
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && book?.fileType === 'txt' && (
            <pre className="h-full w-full overflow-auto p-6 text-sm font-mono text-foreground whitespace-pre-wrap break-words">
              {txtContent}
            </pre>
          )}

          {status === 'success' && book?.fileType === 'pdf' && (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span>PDF 加载中...</span>
                  </div>
                </div>
              )}
              <iframe
                src={book.downloadUrl}
                title={book.title}
                className="h-full w-full border-0"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookPreviewDialog;
