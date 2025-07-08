import { useQuery } from 'convex/react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { TaskEditModal } from './TaskEditModal';
import { TaskSupportModal } from './TaskSupportModal';
import { Badge, getPriorityBadgeProps } from './ui';
import { Button } from './ui/Button';

// Safe markdown content renderer component
function MarkdownContent({ content }: { content: string }) {
  // Parse the content safely
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listKey = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc ml-6 mb-4">
            {currentList.map((item, idx) => (
              <li key={`list-item-${listKey}-${item.slice(0, 20)}-${idx}`} className="mb-1">
                {item}
              </li>
            ))}
          </ul>,
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        flushList();
        const level = headerMatch[1].length;
        const HeaderTag = `h${Math.min(level, 6)}` as keyof React.JSX.IntrinsicElements;
        elements.push(
          <HeaderTag
            key={`header-${index}-${line.slice(0, 20)}`}
            className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100"
          >
            {headerMatch[2]}
          </HeaderTag>,
        );
        return;
      }

      // Bold text
      const boldMatch = line.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        flushList();
        elements.push(
          <strong
            key={`bold-${index}-${boldMatch[1].slice(0, 20)}`}
            className="font-semibold text-gray-900 dark:text-gray-100 block mb-2"
          >
            {boldMatch[1]}
          </strong>,
        );
        return;
      }

      // List items
      const listMatch = line.match(/^-\s+(.+)$/);
      if (listMatch) {
        currentList.push(listMatch[1]);
        return;
      }

      // Numbered list with bold
      const numberedMatch = line.match(/^\d+\.\s+\*\*(.+)\*\*:\s*(.+)$/);
      if (numberedMatch) {
        flushList();
        elements.push(
          <div key={`numbered-${index}-${numberedMatch[1].slice(0, 20)}`} className="mb-3">
            <strong className="font-semibold text-gray-900 dark:text-gray-100">
              {numberedMatch[1]}:
            </strong>{' '}
            {numberedMatch[2]}
          </div>,
        );
        return;
      }

      // Regular text (non-empty lines)
      if (line.trim()) {
        flushList();
        elements.push(
          <p
            key={`paragraph-${index}-${line.slice(0, 20)}`}
            className="mb-2 text-gray-900 dark:text-gray-100"
          >
            {line}
          </p>,
        );
      }
    });

    flushList();
    return elements;
  };

  return <div className="markdown-content">{parseContent(content)}</div>;
}

interface TaskDetailModalProps {
  taskId: Id<'tasks'>;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, isOpen, onClose }: TaskDetailModalProps) {
  const task = useQuery(api.tasks.get, { id: taskId });
  const latestSupport = useQuery(api.aiContents.getLatestSupport, { taskId });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200); // Match the animation duration
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (!isOpen || !task) return null;

  const isOverdue = task.deadline && task.deadline < Date.now() && task.status !== 'completed';

  return (
    <>
      <div
        className={`fixed inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-none z-50 transition-all duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-center min-h-full p-4">
          <div
            ref={modalRef}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 max-w-2xl w-full max-h-[120vh] overflow-hidden transform transition-all duration-200 ${
              isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-6 h-6 mt-1 flex-shrink-0">
                    <div
                      className={`w-6 h-6 rounded border-2 ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <svg
                          className="w-4 h-4 text-white m-1"
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
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2
                      className={`text-xl font-semibold ${
                        task.status === 'completed'
                          ? 'line-through text-gray-500 dark:text-gray-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {task.title}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge {...getPriorityBadgeProps(task.priority)} />
                      {task.category && <Badge variant="secondary">{task.category}</Badge>}
                      <Badge variant="outline" className="capitalize">
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Close modal"
                  >
                    <title>Close modal</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Created
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(task.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Updated
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(task.updatedAt)}</p>
                </div>
                {task.deadline && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Deadline
                    </h3>
                    <p
                      className={`${
                        isOverdue
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {formatDate(task.deadline)}
                    </p>
                  </div>
                )}
              </div>

              {/* Time tracking */}
              {(task.estimatedTime || task.actualTime) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Tracking
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {task.estimatedTime && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Estimated:</span>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {formatDuration(task.estimatedTime)}
                        </p>
                      </div>
                    )}
                    {task.actualTime && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Actual:</span>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {formatDuration(task.actualTime)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Memo/Notes */}
              {task.memo && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg max-h-100 overflow-y-auto">
                    <div className="text-sm">
                      <MarkdownContent content={task.memo} />
                    </div>
                  </div>
                </div>
              )}

              {/* AI Support Status */}
              {task.aiSupportStatus && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Support
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          task.aiSupportStatus === 'completed'
                            ? 'default'
                            : task.aiSupportStatus === 'generating'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {task.aiSupportStatus === 'completed'
                          ? 'Available'
                          : task.aiSupportStatus === 'generating'
                            ? 'Generating...'
                            : 'Failed'}
                      </Badge>
                      {task.aiSupportGeneratedAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(task.aiSupportGeneratedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {latestSupport?.metadata && task.aiSupportStatus === 'completed' && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500 dark:text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-label="AI model"
                        >
                          <title>AI model</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                          />
                        </svg>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {latestSupport.metadata.provider
                            ? `${latestSupport.metadata.provider.charAt(0).toUpperCase() + latestSupport.metadata.provider.slice(1)} - ${latestSupport.metadata.model}`
                            : latestSupport.metadata.model}
                        </span>
                        {latestSupport.metadata.tokens && (
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            • {latestSupport.metadata.tokens.toLocaleString()} tokens
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSupportModal(true)}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="AI support"
                  >
                    <title>AI support lightbulb icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  AI Support
                </Button>
                <Button onClick={() => setShowEditModal(true)} variant="secondary">
                  Edit Task
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TaskEditModal
        taskId={taskId}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Support Modal */}
      <TaskSupportModal
        taskId={taskId}
        taskTitle={task.title}
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </>
  );
}
