import { useMemo, useState, useCallback } from 'react';
import { FolderOpen, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { useFolders, useMoveBook } from '@client/src/hooks/useBooks';
import type { Book } from '@shared/api.interface';

interface MoveBookDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MoveBookDialog = ({ book, open, onOpenChange }: MoveBookDialogProps) => {
  const { data: folders = [] } = useFolders();
  const moveMutation = useMoveBook();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const currentFolderId = useMemo(
    () => book?.folderId ?? null,
    [book?.folderId],
  );

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen && book) {
        setSelectedFolderId(book.folderId ?? null);
      }
      onOpenChange(newOpen);
    },
    [book, onOpenChange],
  );

  const handleConfirm = useCallback(() => {
    if (!book) return;
    if (selectedFolderId === currentFolderId) {
      onOpenChange(false);
      return;
    }
    moveMutation.mutate(
      { id: book.id, folderId: selectedFolderId },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  }, [book, selectedFolderId, currentFolderId, moveMutation, onOpenChange]);

  const folderItems = useMemo(
    () => [
      { id: null, name: '全部书籍（根目录）' },
      ...folders.map((f) => ({ id: f.id, name: f.name })),
    ],
    [folders],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            移动到文件夹
          </DialogTitle>
          <DialogDescription>
            选择目标文件夹，将《{book?.title}》移入其中。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto py-2">
          {folderItems.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              暂无文件夹
            </p>
          )}
          {folderItems.map((item) => (
            <button
              key={item.id ?? 'root'}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedFolderId === item.id
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-foreground hover:bg-muted'
              }`}
              onClick={() => setSelectedFolderId(item.id)}
            >
              {selectedFolderId === item.id && (
                <Check className="h-4 w-4 shrink-0" />
              )}
              {selectedFolderId !== item.id && (
                <div className="h-4 w-4 shrink-0" />
              )}
              <span className="flex-1 truncate">{item.name}</span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={moveMutation.isPending}
          >
            {moveMutation.isPending ? '移动中...' : '确认移动'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveBookDialog;
