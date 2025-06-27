'use client';

import { useMutation } from 'convex/react';
import { memo, useCallback, useState } from 'react';
import { Badge, Button, Card, CardContent, getPriorityBadgeProps } from '@/components/ui';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { DRAG_STYLES } from './constants';

interface KanbanCardProps {
  task: Doc<'tasks'>;
  onEdit: (taskId: Id<'tasks'>) => void;
  onDragStart: (task: Doc<'tasks'>) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export const KanbanCard = memo(function KanbanCard({
  task,
  onEdit,
  onDragStart,
  onDragEnd,
  isDragging,
}: KanbanCardProps) {
  const deleteTask = useMutation(api.tasks.deleteTask);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const isOverdue = task.deadline && task.deadline < Date.now() && task.status !== 'completed';

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      onDragStart(task);
      e.dataTransfer.effectAllowed = 'move';
    },
    [task, onDragStart],
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(task._id);
    },
    [task._id, onEdit],
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!confirm('本当にこのタスクを削除しますか？')) {
        return;
      }

      setIsDeleting(true);
      try {
        await deleteTask({ taskId: task._id });
      } catch (error) {
        console.error('タスク削除エラー:', error);
        // TODO: Add user-facing error notification
      } finally {
        setIsDeleting(false);
      }
    },
    [task._id, deleteTask],
  );

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-move hover:shadow-md ${DRAG_STYLES.TRANSITION} ${
        isDragging ? DRAG_STYLES.DRAGGING : ''
      } ${isOverdue ? 'border-red-300 dark:border-red-700' : ''}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
              {task.title}
            </h4>
            {isOverdue && (
              <Badge variant="destructive" size="sm" className="ml-2 flex-shrink-0">
                期限切れ
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            <Badge {...getPriorityBadgeProps(task.priority)} size="sm" />
            {task.category && (
              <Badge variant="secondary" size="sm">
                {task.category}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>更新: {formatDate(task.updatedAt)}</span>
            {task.deadline && (
              <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                期限: {formatDate(task.deadline)}
              </span>
            )}
          </div>

          <div className="flex gap-1 pt-2 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="flex-1 text-xs"
              disabled={isDragging}
            >
              編集
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="text-xs"
              disabled={isDragging || isDeleting}
            >
              {isDeleting ? '削除中...' : '削除'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
