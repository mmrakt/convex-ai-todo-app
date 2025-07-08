'use client';

import { memo, useMemo } from 'react';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Id } from '../../../convex/_generated/dataModel';
import { ErrorNotification } from '../ui/ErrorNotification';
import { KANBAN_COLUMNS } from './constants';
import { KanbanColumn } from './KanbanColumn';
import type { KanbanBoardProps } from './types';

export const KanbanBoard = memo(function KanbanBoard({
  tasks,
}: {
  tasks: KanbanBoardProps['tasks'];
}) {
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

  const handleEditTask = (taskId: Id<'tasks'>) => {
    // TODO: Implement task editing functionality
    console.log('Edit task:', taskId);
  };
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Task Board</h2>
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Total Tasks: {totalTasks}</span>
          <span>Completed: {completedTasks}</span>
          <span>Completion Rate: {completionRate}%</span>
        </div>
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
              onEditTask={handleEditTask}
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
            "{draggedTask.title}" is being moved...
            {isUpdating && <span className="ml-2 animate-pulse">Updating...</span>}
          </p>
        </div>
      )}

      {error && <ErrorNotification error={error} onClose={clearError} />}
    </div>
  );
});
