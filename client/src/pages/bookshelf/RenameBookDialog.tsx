import { useState, useCallback, useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { useRenameBook } from '@client/src/hooks/useBooks';
import type { Book } from '@shared/api.interface';

interface RenameBookDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RenameBookDialog = ({
  book,
  open,
  onOpenChange,
}: RenameBookDialogProps) => {
  const [name, setName] = useState('');
  const renameMutation = useRenameBook();

  useEffect(() => {
    if (open && book) {
      setName(book.title);
    }
  }, [open, book]);

  const handleConfirm = useCallback(() => {
    if (!book || !name.trim()) return;
    renameMutation.mutate(
      { id: book.id, title: name.trim() },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  }, [book, name, renameMutation, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            重命名书籍
          </DialogTitle>
          <DialogDescription>
            修改书籍的显示名称。
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            书籍名称
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入新名称"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!name.trim() || renameMutation.isPending}
          >
            {renameMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameBookDialog;
