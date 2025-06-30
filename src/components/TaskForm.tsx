import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DatePicker,
  formatDateForInput,
  parseDateFromInput,
  Select,
} from '@/components/ui';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface TaskFormProps {
  taskId?: Id<'tasks'>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ taskId, onSuccess, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const task = useQuery(api.tasks.getTask, taskId ? { taskId } : 'skip');
  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);

  const isEditing = !!taskId;

  useEffect(() => {
    if (isEditing && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setCategory(task.category || '');
      setDeadline(task.deadline ? formatDateForInput(task.deadline) : '');
      setEstimatedTime(task.estimatedTime?.toString() || '');
    }
  }, [isEditing, task]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (estimatedTime && (Number.isNaN(Number(estimatedTime)) || Number(estimatedTime) < 0)) {
      newErrors.estimatedTime = 'Estimated time must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || '',
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        category: category.trim() || '',
        deadline: deadline ? parseDateFromInput(deadline) : undefined,
        estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
      };

      if (isEditing && taskId) {
        await updateTask({
          taskId: taskId,
          ...taskData,
        });
      } else {
        await createTask(taskData);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Task save error:', error);
      setErrors({ submit: 'Failed to save task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('');
    setDeadline('');
    setEstimatedTime('');
    setErrors({});
  };

  return (
    <div className="p-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`block w-full rounded-md border shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none h-10 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  errors.title
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400'
                }`}
                placeholder="Enter task title"
                maxLength={200}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-offset-2 focus:outline-none p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter task description (optional)"
                rows={4}
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Priority
                </label>
                <Select
                  options={PRIORITY_OPTIONS}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Category
                </label>
                <input
                  id="category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-offset-2 focus:outline-none h-10 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Work, Personal"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DatePicker
                label="Deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />

              <div>
                <label
                  htmlFor="estimatedTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Estimated Time (minutes)
                </label>
                <input
                  id="estimatedTime"
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className={`block w-full rounded-md border shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none h-10 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.estimatedTime
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400'
                  }`}
                  placeholder="60"
                  min="1"
                  max="9999"
                />
                {errors.estimatedTime && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.estimatedTime}
                  </p>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-800 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                {isEditing ? 'Update Task' : 'Create Task'}
              </Button>

              {!isEditing && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
              )}

              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
