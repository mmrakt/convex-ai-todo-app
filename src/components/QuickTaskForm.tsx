import { useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { TaskStatus } from './kanban/constants';

interface QuickTaskFormProps {
  status: TaskStatus;
  onCancel: () => void;
  onSuccess: () => void;
}

export function QuickTaskForm({ status, onCancel, onSuccess }: QuickTaskFormProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTask = useMutation(api.tasks.createTask);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        status,
      });

      setTitle('');
      onSuccess();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm border-l-4 border-l-blue-500"
    >
      <div className="flex items-start gap-2">
        <div className="w-4 h-4 mt-1 flex-shrink-0">
          <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="w-full px-0 py-1 text-sm border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500"
            disabled={isSubmitting}
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
