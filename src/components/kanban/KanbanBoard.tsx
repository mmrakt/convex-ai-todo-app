'use client';

import { memo, useMemo } from 'react';
import { Button } from '@/components/ui';
import { ErrorNotification } from '@/components/ui/ErrorNotification';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { KANBAN_COLUMNS } from './constants';
import { KanbanColumn } from './KanbanColumn';
import type { KanbanBoardProps } from './types';

export const KanbanBoard = memo(function KanbanBoard({
  tasks,
  onEditTask,
  onCreateTask,
}: KanbanBoardProps) {
  const {
    draggedTask,
    isUpdating,
    error,
    handleDragStart,
    handleDragEnd,
    getDropZoneProps,
    isTaskBeingDragged,
    clearError,
  } = useDragAndDrop();

  const getTasksByStatus = useMemo(() => {
    return (status: string) => tasks.filter((task) => task.status === status);
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">タスクボード</h2>
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>総タスク数: {totalTasks}</span>
            <span>完了: {completedTasks}</span>
            <span>完了率: {completionRate}%</span>
          </div>
        </div>
        <Button onClick={onCreateTask} size="lg">
          新規タスク作成
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          const dropZoneProps = getDropZoneProps(column.status);

          return (
            <KanbanColumn
              key={column.id}
              title={column.title}
              status={column.status}
              tasks={columnTasks}
              onEditTask={onEditTask}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              color={column.color}
              isTaskBeingDragged={isTaskBeingDragged}
              {...dropZoneProps}
            />
          );
        })}
      </div>

      {draggedTask && (
        <div className="fixed bottom-4 left-4 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg px-4 py-2 shadow-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            "{draggedTask.title}" を移動中...
            {isUpdating && <span className="ml-2 animate-pulse">更新中...</span>}
          </p>
        </div>
      )}

      {error && <ErrorNotification error={error} onClose={clearError} />}
    </div>
  );
});
