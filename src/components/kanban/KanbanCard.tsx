'use client';

import { useMutation } from 'convex/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, CardContent, getPriorityBadgeProps } from '@/components/ui';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { TaskDetailModal } from '../TaskDetailModal';
import { TaskEditModal } from '../TaskEditModal';
import { TaskSupportModal } from '../TaskSupportModal';
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
  onEdit: _onEdit,
  onDragStart,
  onDragEnd,
  isDragging,
}: KanbanCardProps) {
  const deleteTask = useMutation(api.tasks.deleteTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHoverPopup, setShowHoverPopup] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
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

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  }, []);

  const handleTitleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!isDragging) {
        setIsEditingTitle(true);
      }
    },
    [isDragging],
  );

  const handleTitleSave = useCallback(async () => {
    if (titleValue.trim() && titleValue !== task.title) {
      try {
        await updateTask({
          taskId: task._id,
          title: titleValue.trim(),
        });
      } catch (error) {
        console.error('Failed to update task title:', error);
        setTitleValue(task.title); // Revert on error
      }
    } else {
      setTitleValue(task.title); // Revert if empty or unchanged
    }
    setIsEditingTitle(false);
  }, [titleValue, task.title, task._id, updateTask]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTitleSave();
      } else if (e.key === 'Escape') {
        setTitleValue(task.title);
        setIsEditingTitle(false);
      }
    },
    [handleTitleSave, task.title],
  );

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    setTitleValue(task.title);
  }, [task.title]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!confirm('Are you sure you want to delete this task?')) {
        return;
      }

      setIsDeleting(true);
      try {
        await deleteTask({ taskId: task._id });
      } catch (error) {
        console.error('Task deletion error:', error);
        // TODO: Add user-facing error notification
      } finally {
        setIsDeleting(false);
      }
    },
    [task._id, deleteTask],
  );

  const handleCheckboxClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isDragging) return;

      const newStatus = task.status === 'completed' ? 'todo' : 'completed';

      try {
        await updateTask({
          taskId: task._id,
          status: newStatus,
        });
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    },
    [task._id, task.status, updateTask, isDragging],
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't open detail modal if we're dragging, editing title, or clicking buttons
      if (isDragging || isEditingTitle) {
        return;
      }

      // Don't open if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT'
      ) {
        return;
      }

      setShowDetailModal(true);
    },
    [isDragging, isEditingTitle],
  );

  const handleMouseEnter = useCallback(() => {
    if (isDragging || isEditingTitle) return;

    hoverTimeoutRef.current = setTimeout(() => {
      setShowHoverPopup(true);
    }, 1000);
  }, [isDragging, isEditingTitle]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowHoverPopup(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="relative">
        <Card
          ref={cardRef}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`cursor-pointer hover:shadow-md border-l-4 ${isOverdue ? 'border-l-red-500' : 'border-l-transparent'} ${DRAG_STYLES.TRANSITION} ${
            isDragging ? DRAG_STYLES.DRAGGING : ''
          } hover:border-l-blue-500 group`}
        >
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <button
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded border-2 transition-colors flex items-center justify-center ${
                      task.status === 'completed'
                        ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={handleCheckboxClick}
                    title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                    type="button"
                  >
                    {task.status === 'completed' && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-label="Task completed"
                      >
                        <title>Task completed checkmark</title>
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  {isEditingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={handleTitleKeyDown}
                      className="text-sm font-medium flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 p-0"
                      disabled={isDragging}
                    />
                  ) : (
                    <button
                      type="button"
                      className={`text-sm font-medium flex-1 cursor-text text-left ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'} hover:bg-gray-50 dark:hover:bg-gray-600 rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors border-none bg-transparent`}
                      onClick={handleTitleClick}
                      aria-label="Edit task title"
                    >
                      {task.title}
                    </button>
                  )}
                </div>
                {isOverdue && (
                  <Badge variant="destructive" size="sm" className="ml-2 flex-shrink-0">
                    Overdue
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
                <span>Updated: {formatDate(task.updatedAt)}</span>
                {task.deadline && (
                  <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                    Due: {formatDate(task.deadline)}
                  </span>
                )}
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSupportModal(true);
                  }}
                  className={`text-xs px-2 py-1 h-auto ${
                    task.aiSupportStatus === 'generating'
                      ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                      : task.aiSupportStatus === 'completed'
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        : task.aiSupportStatus === 'error'
                          ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                          : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                  disabled={isDragging}
                  title={
                    task.aiSupportStatus === 'generating'
                      ? 'AI is working...'
                      : task.aiSupportStatus === 'completed'
                        ? 'AI support available'
                        : task.aiSupportStatus === 'error'
                          ? 'AI support failed'
                          : 'Get AI Support'
                  }
                >
                  {task.aiSupportStatus === 'generating' ? (
                    <div className="w-3 h-3 mr-1 animate-spin border border-orange-500 border-t-transparent rounded-full"></div>
                  ) : (
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="AI lightbulb"
                    >
                      <title>AI lightbulb icon</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  )}
                  AI
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="text-xs px-2 py-1 h-auto"
                  disabled={isDragging}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-xs px-2 py-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isDragging || isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hover Popup */}
        {showHoverPopup && (
          <div className="absolute left-full top-0 ml-2 z-40 w-80">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h3>
                <Badge variant="outline" className="capitalize text-xs">
                  {task.status.replace('_', ' ')}
                </Badge>
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <TaskEditModal
        taskId={task._id}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      <TaskSupportModal
        taskId={task._id}
        taskTitle={task.title}
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      <TaskDetailModal
        taskId={task._id}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  );
});
