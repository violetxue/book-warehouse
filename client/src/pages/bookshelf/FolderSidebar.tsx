import { useState, useCallback } from 'react';
import {
  Folder,
  FolderPlus,
  Trash2,
  Pencil,
  Check,
  X,
  Library,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
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
  useFolders,
  useCreateFolder,
  useDeleteFolder,
  useRenameFolder,
} from '@client/src/hooks/useBooks';
import type { Folder as FolderType } from '@shared/api.interface';

interface FolderSidebarProps {
  currentFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

const FolderSidebar = ({
  currentFolderId,
  onSelectFolder,
}: FolderSidebarProps) => {
  const { data: folders = [], isLoading } = useFolders();
  const createFolderMutation = useCreateFolder();
  const deleteFolderMutation = useDeleteFolder();
  const renameFolderMutation = useRenameFolder();

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FolderType | null>(null);

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate(
      { name: newFolderName.trim() },
      {
        onSuccess: () => {
          setNewFolderName('');
          setShowNewFolder(false);
        },
      },
    );
  }, [newFolderName, createFolderMutation]);

  const handleStartRename = useCallback((folder: FolderType) => {
    setEditingId(folder.id);
    setEditingName(folder.name);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }
    renameFolderMutation.mutate(
      { id: editingId, name: editingName.trim() },
      {
        onSuccess: () => setEditingId(null),
      },
    );
  }, [editingId, editingName, renameFolderMutation]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteFolderMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        if (currentFolderId === deleteTarget.id) {
          onSelectFolder(null);
        }
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteFolderMutation, currentFolderId, onSelectFolder]);

  return (
    <aside className="w-56 shrink-0 border-r border-border/60 bg-secondary/30 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">文件夹</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setShowNewFolder(true)}
          aria-label="新建文件夹"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      {showNewFolder && (
        <div className="mb-3 flex gap-1">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="文件夹名称"
            size={1}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setShowNewFolder(false);
                setNewFolderName('');
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-primary"
            onClick={handleCreateFolder}
            aria-label="确认创建"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              setShowNewFolder(false);
              setNewFolderName('');
            }}
            aria-label="取消"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <nav className="space-y-0.5">
        <button
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
            currentFolderId === null
              ? 'bg-primary/15 text-primary font-medium'
              : 'text-foreground hover:bg-muted/60'
          }`}
          onClick={() => onSelectFolder(null)}
        >
          <Library className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">全部书籍</span>
        </button>

        {isLoading && (
          <div className="py-2 text-center text-xs text-muted-foreground">
            加载中...
          </div>
        )}

        {!isLoading &&
          folders.map((folder) => (
            <div key={folder.id} className="group">
              {editingId === folder.id ? (
                <div className="flex items-center gap-1 rounded-md px-2 py-1.5">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-7 text-sm"
                    size={1}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-primary"
                    onClick={handleConfirmRename}
                    aria-label="确认"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setEditingId(null)}
                    aria-label="取消"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    currentFolderId === folder.id
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <button
                    className="flex flex-1 items-center gap-2 truncate text-left"
                    onClick={() => onSelectFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {folder.bookCount ?? 0}
                    </span>
                  </button>
                  <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleStartRename(folder)}
                      aria-label="重命名"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive/70 hover:text-destructive"
                      onClick={() => setDeleteTarget(folder)}
                      aria-label="删除文件夹"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </nav>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除文件夹</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除文件夹「{deleteTarget?.name}」吗？
              <br />
              文件夹中的书籍将移出到全部书籍中，文件本身不会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={deleteFolderMutation.isPending}
            >
              {deleteFolderMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

export default FolderSidebar;
