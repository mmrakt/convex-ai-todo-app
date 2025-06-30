'use client';

import { memo, useState } from 'react';
import type { Doc } from '../../../convex/_generated/dataModel';
import { QuickTaskForm } from '../QuickTaskForm';
import { DRAG_STYLES } from './constants';
import { KanbanCard } from './KanbanCard';
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
  onEditTask: _onEditTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDraggedOver,
  color: _color,
  isTaskBeingDragged,
}: ExtendedKanbanColumnProps) {
  const isEmpty = tasks.length === 0;
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div
      className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-3 min-h-[500px] ${DRAG_STYLES.TRANSITION} ${
        isDraggedOver ? DRAG_STYLES.DROP_ZONE_ACTIVE : ''
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
            {title}
          </h3>
          <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded transition-colors"
          title="Add task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {isEmpty && !showAddForm ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">No tasks</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Add your first task
            </button>
          </div>
        ) : (
          <>
            {tasks.map((task) => (
              <KanbanCard
                key={task._id}
                task={task}
                onEdit={() => {}} // Dummy function since editing is now handled internally
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={isTaskBeingDragged(task)}
              />
            ))}

            {showAddForm && (
              <QuickTaskForm
                status={status}
                onCancel={() => setShowAddForm(false)}
                onSuccess={() => setShowAddForm(false)}
              />
            )}

            {!showAddForm && !isEmpty && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                + Add task
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});
