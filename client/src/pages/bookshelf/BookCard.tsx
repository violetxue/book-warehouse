import {
  Eye,
  Download,
  Trash2,
  ChevronUp,
  ChevronDown,
  FolderPlus,
  Edit3,
} from 'lucide-react';
import { Checkbox } from '@client/src/components/ui/checkbox';
import { Card, CardContent, CardFooter } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import {
  FILE_TYPE_LABELS,
  formatFileSize,
  isFileType,
} from '@shared/api.interface';
import type { Book } from '@shared/api.interface';

interface BookCardProps {
  book: Book;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onPreview: (book: Book) => void;
  onDownload: (book: Book) => void;
  onDelete: (book: Book) => void;
  onMove: (book: Book) => void;
  onRename: (book: Book) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-rose-100 text-rose-700 border-rose-200',
  epub: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  txt: 'bg-sky-100 text-sky-700 border-sky-200',
  docx: 'bg-blue-100 text-blue-700 border-blue-200',
  xlsx: 'bg-green-100 text-green-700 border-green-200',
  pptx: 'bg-orange-100 text-orange-700 border-orange-200',
  mobi: 'bg-purple-100 text-purple-700 border-purple-200',
  azw: 'bg-amber-100 text-amber-700 border-amber-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

const FILE_TYPE_SPINE: Record<string, string> = {
  pdf: 'bg-gradient-to-br from-rose-500 to-rose-400',
  epub: 'bg-gradient-to-br from-emerald-500 to-emerald-400',
  txt: 'bg-gradient-to-br from-sky-500 to-sky-400',
  docx: 'bg-gradient-to-br from-blue-500 to-blue-400',
  xlsx: 'bg-gradient-to-br from-green-500 to-green-400',
  pptx: 'bg-gradient-to-br from-orange-500 to-orange-400',
  mobi: 'bg-gradient-to-br from-purple-500 to-purple-400',
  azw: 'bg-gradient-to-br from-amber-500 to-amber-400',
  other: 'bg-gradient-to-br from-gray-500 to-gray-400',
};

function getTypeLabel(fileType: string): string {
  if (isFileType(fileType)) return FILE_TYPE_LABELS[fileType];
  return FILE_TYPE_LABELS.other;
}

function getColorClass(fileType: string): string {
  return FILE_TYPE_COLORS[fileType] ?? FILE_TYPE_COLORS.other;
}

function getSpineClass(fileType: string): string {
  return FILE_TYPE_SPINE[fileType] ?? FILE_TYPE_SPINE.other;
}

const BookCard = ({
  book,
  index,
  isFirst,
  isLast,
  selectable = false,
  selected = false,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
  onMove,
  onRename,
  onReorder,
}: BookCardProps) => {
  const typeLabel = getTypeLabel(book.fileType);
  const colorClass = getColorClass(book.fileType);
  const spineClass = getSpineClass(book.fileType);

  return (
    <Card
      className="group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      data-ai-section-type="card-list"
    >
      <div className={`relative h-32 ${spineClass} flex items-center justify-center`}>
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/15" />
        {selectable && (
          <div className="absolute right-2 top-2">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onSelect?.(book.id)}
              className="h-5 w-5 rounded-full border-white/70 bg-white/25 backdrop-blur-sm data-[state=checked]:bg-white data-[state=checked]:text-primary"
              aria-label={`选择 ${book.title}`}
            />
          </div>
        )}
        <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-xs font-semibold text-white backdrop-blur-sm">
          {index + 1}
        </div>
        <div className="flex flex-col items-center gap-2 text-white">
          <Badge
            variant="outline"
            className={`border-white/40 bg-white/20 text-white backdrop-blur-sm ${colorClass}`}
          >
            {typeLabel}
          </Badge>
          <span className="text-xs opacity-80">
            {formatFileSize(book.fileSize)}
          </span>
        </div>
      </div>

      <CardContent className="flex-1 pt-3">
        <h3
          className="line-clamp-2 text-sm font-semibold text-foreground"
          title={book.title}
        >
          {book.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {book.author || '未知作者'}
        </p>
      </CardContent>

      <CardFooter className="gap-1.5 pt-0">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onReorder(book.id, 'up')}
            disabled={isFirst}
            aria-label="上移"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onReorder(book.id, 'down')}
            disabled={isLast}
            aria-label="下移"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="ml-auto flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => onMove(book)}
            aria-label="移动到文件夹"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => onRename(book)}
            aria-label="重命名"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onPreview(book)}
            aria-label="预览"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onDownload(book)}
            aria-label="下载"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(book)}
            aria-label={`删除 ${book.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BookCard;
