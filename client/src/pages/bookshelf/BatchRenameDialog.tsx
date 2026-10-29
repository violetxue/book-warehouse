import { useState, useCallback, useMemo } from 'react';
import { Edit3, Hash } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@client/src/components/ui/radio-group';
import { Label } from '@client/src/components/ui/label';
import { useBatchRename } from '@client/src/hooks/useBooks';

interface BatchRenameDialogProps {
  selectedIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RenameMode = 'prefix' | 'suffix' | 'replace' | 'sequential';

const MODE_OPTIONS: { value: RenameMode; label: string; hint: string }[] = [
  { value: 'prefix', label: '添加前缀', hint: '在原书名前添加文字' },
  { value: 'suffix', label: '添加后缀', hint: '在原书名后添加文字' },
  { value: 'replace', label: '替换文字', hint: '将指定文字替换为新文字' },
  { value: 'sequential', label: '顺序编号', hint: '统一前缀 + 序号命名' },
];

const BatchRenameDialog = ({
  selectedIds,
  open,
  onOpenChange,
}: BatchRenameDialogProps) => {
  const [mode, setMode] = useState<RenameMode>('sequential');
  const [value, setValue] = useState('书籍');
  const [replaceWith, setReplaceWith] = useState('');
  const batchRenameMutation = useBatchRename();

  const count = selectedIds.length;

  const canSubmit = useMemo(() => {
    if (count === 0) return false;
    if (mode === 'replace') return value !== '';
    if (mode === 'sequential') return value.trim() !== '';
    return value !== '';
  }, [count, mode, value]);

  const handleConfirm = useCallback(() => {
    if (!canSubmit) return;
    batchRenameMutation.mutate(
      {
        ids: selectedIds,
        mode,
        value: value || undefined,
        replaceWith: mode === 'replace' ? replaceWith : undefined,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  }, [
    canSubmit,
    batchRenameMutation,
    selectedIds,
    mode,
    value,
    replaceWith,
    onOpenChange,
  ]);

  const handleModeChange = useCallback((newMode: string) => {
    setMode(newMode as RenameMode);
    if (newMode === 'sequential') {
      setValue('书籍');
    } else if (newMode === 'prefix' || newMode === 'suffix') {
      setValue('');
    } else if (newMode === 'replace') {
      setValue('');
      setReplaceWith('');
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            批量重命名
          </DialogTitle>
          <DialogDescription>
            已选择 <span className="font-medium text-primary">{count}</span> 本书，请选择重命名方式。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <RadioGroup
            value={mode}
            onValueChange={handleModeChange}
            className="space-y-2"
          >
            {MODE_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  mode === opt.value
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border hover:bg-muted/30'
                }`}
              >
                <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} />
                <Label
                  htmlFor={`mode-${opt.value}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium text-foreground">
                    {opt.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {opt.hint}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {mode === 'prefix' && (
            <div>
              <Label className="mb-1.5 block text-sm">前缀文字</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="例：[精选]"
                autoFocus
              />
            </div>
          )}

          {mode === 'suffix' && (
            <div>
              <Label className="mb-1.5 block text-sm">后缀文字</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="例：(已读)"
                autoFocus
              />
            </div>
          )}

          {mode === 'replace' && (
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block text-sm">查找内容</Label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="输入要替换的文字"
                  autoFocus
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">替换为</Label>
                <Input
                  value={replaceWith}
                  onChange={(e) => setReplaceWith(e.target.value)}
                  placeholder="输入新文字（留空则删除）"
                />
              </div>
            </div>
          )}

          {mode === 'sequential' && (
            <div>
              <Label className="mb-1.5 block text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  名称前缀
                </div>
              </Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="例：我的书籍"
                autoFocus
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                将按当前顺序重命名为：{value || '书籍'} 1、{value || '书籍'} 2、{value || '书籍'} 3 ...
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canSubmit || batchRenameMutation.isPending}
          >
            {batchRenameMutation.isPending ? '重命名中...' : '确认重命名'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchRenameDialog;
