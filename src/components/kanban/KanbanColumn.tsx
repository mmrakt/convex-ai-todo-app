'use client';

import { memo } from 'react';
import { DRAG_STYLES } from './constants';
import { KanbanCard } from './KanbanCard';
import type { Doc } from '../../../convex/_generated/dataModel';
import type { KanbanColumnProps } from './types';

interface ExtendedKanbanColumnProps extends Omit<KanbanColumnProps, 'onDrop'> {
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isTaskBeingDragged: (task: Doc<'tasks'>) => boolean;
}

export const KanbanColumn = memo(function KanbanColumn({
  title,
  status,
  tasks,
  onEditTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDraggedOver,
  color,
  isTaskBeingDragged,
}: ExtendedKanbanColumnProps) {
  const isEmpty = tasks.length === 0;

  return (
    <div
      className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[600px] ${DRAG_STYLES.TRANSITION} ${
        isDraggedOver ? DRAG_STYLES.DROP_ZONE_ACTIVE : ''
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className={`border-t-4 ${color} bg-white dark:bg-gray-700 rounded-t-lg mb-4`}>
        <div className="px-4 py-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
            {title}
            <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {isEmpty ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">タスクがありません</p>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task._id}
              task={task}
              onEdit={onEditTask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={isTaskBeingDragged(task)}
            />
          ))
        )}
      </div>
    </div>
  );
});
