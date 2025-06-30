import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';
import type { TaskStatus } from '@/components/kanban/constants';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { useErrorHandler } from './useErrorHandler';

export interface UseDragAndDropReturn {
  draggedTask: Doc<'tasks'> | null;
  isUpdating: boolean;
  error: ReturnType<typeof useErrorHandler>['error'];
  handleDragStart: (task: Doc<'tasks'>) => void;
  handleDragEnd: () => void;
  handleDrop: (newStatus: string) => Promise<void>;
  isTaskBeingDragged: (task: Doc<'tasks'>) => boolean;
  getDropZoneProps: (status: string) => {
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    isDraggedOver: boolean;
  };
  clearError: () => void;
}

export function useDragAndDrop(): UseDragAndDropReturn {
  const [draggedTask, setDraggedTask] = useState<Doc<'tasks'> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTask = useMutation(api.tasks.updateTask);
  const { error, handleError, clearError } = useErrorHandler();

  const handleDragStart = useCallback((task: Doc<'tasks'>) => {
    setDraggedTask(task);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  const handleDrop = useCallback(
    async (newStatus: string) => {
      if (!draggedTask || draggedTask.status === newStatus) {
        return;
      }

      setIsUpdating(true);
      try {
        await updateTask({
          taskId: draggedTask._id,
          status: newStatus as TaskStatus,
        });
      } catch (error) {
        handleError(error, 'Failed to update task status');
      } finally {
        setIsUpdating(false);
        setDraggedTask(null);
      }
    },
    [draggedTask, updateTask, handleError],
  );

  const isTaskBeingDragged = useCallback(
    (task: Doc<'tasks'>) => {
      return draggedTask?._id === task._id;
    },
    [draggedTask],
  );

  const getDropZoneProps = useCallback(
    (status: string) => {
      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
      };

      const handleDropEvent = (e: React.DragEvent) => {
        e.preventDefault();
        handleDrop(status);
      };

      const isDraggedOver = draggedTask !== null && draggedTask.status !== status;

      return {
        onDragOver: handleDragOver,
        onDrop: handleDropEvent,
        isDraggedOver,
      };
    },
    [draggedTask, handleDrop],
  );

  return {
    draggedTask,
    isUpdating,
    error,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    isTaskBeingDragged,
    getDropZoneProps,
    clearError,
  };
}
