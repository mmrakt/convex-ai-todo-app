import { useAction, useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from './ui/Button';

interface TaskSupportModalProps {
  taskId: Id<'tasks'>;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskSupportModal({ taskId, taskTitle, isOpen, onClose }: TaskSupportModalProps) {
  const supportTask = useAction(api.ai.taskSupportAgent.supportTask);
  const task = useQuery(api.tasks.get, { id: taskId });
  const [isRequestingNew, setIsRequestingNew] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGetSupport = async () => {
    setIsRequestingNew(true);
    setError('');

    try {
      const result = await supportTask({ taskId });

      if (!result.success) {
        setError(result.error || 'Failed to get task support');
      }
      // Note: We don't need to handle success case here since the task
      // will be updated in the database and useQuery will automatically
      // reflect the new state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsRequestingNew(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  // Determine current states based on task data
  const isGenerating = task?.aiSupportStatus === 'generating';
  const hasContent = task?.aiSupportContent && task?.aiSupportStatus === 'completed';
  const hasError = task?.aiSupportStatus === 'error' || error;
  const isLoading = isGenerating || isRequestingNew;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  AI Task Support
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get AI assistance for: {taskTitle}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="flex-1 overflow-y-auto p-6">
          {!hasContent && !hasError && !isLoading && (
            <div className="text-center py-12">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Ready to help!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Click the button below to get AI-powered insights, execution plans, and helpful
                resources for your task.
              </p>
              <Button onClick={handleGetSupport} disabled={isLoading} className="px-6 py-3">
                Get AI Support
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {isGenerating ? 'Analyzing your task...' : 'Starting AI analysis...'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isGenerating
                  ? 'AI is creating a comprehensive support plan for you. You can continue working while this runs in the background.'
                  : 'Initiating AI support request...'}
              </p>
            </div>
          )}

          {hasError && (
            <div className="text-center py-12">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                Something went wrong
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-6">
                {error || 'Failed to generate AI support'}
              </p>
              <Button onClick={handleGetSupport} disabled={isLoading} variant="secondary">
                Try Again
              </Button>
            </div>
          )}

          {hasContent && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                Generated{' '}
                {task?.aiSupportGeneratedAt
                  ? new Date(task.aiSupportGeneratedAt).toLocaleString()
                  : 'recently'}
              </div>
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{
                  __html: (task?.aiSupportContent || '')
                    .replace(/\n/g, '<br>')
                    .replace(/^#{1,6}\s+(.+)$/gm, (match, title) => {
                      const level = match.indexOf(' ');
                      return `<h${level} class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">${title}</h${level}>`;
                    })
                    .replace(
                      /^\*\*(.+)\*\*$/gm,
                      '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>',
                    )
                    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                    .replace(
                      /^\d+\.\s+\*\*(.+)\*\*:\s*(.+)$/gm,
                      '<div class="mb-3"><strong class="font-semibold text-gray-900 dark:text-gray-100">$1:</strong> $2</div>',
                    ),
                }}
              />
            </div>
          )}
        </div>

        {hasContent && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <div className="flex gap-3">
              <Button onClick={handleGetSupport} variant="secondary" disabled={isLoading}>
                {isLoading ? 'Regenerating...' : 'Regenerate'}
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
