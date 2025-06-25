import { useAction, useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  getPriorityBadgeProps,
  getStatusBadgeProps,
  Select,
} from './ui';

const STATUS_OPTIONS = [
  { value: '', label: 'すべてのステータス' },
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '完了' },
  { value: 'on_hold', label: '保留' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'すべての優先度' },
  { value: 'urgent', label: '緊急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: '更新日時順' },
  { value: 'createdAt', label: '作成日時順' },
  { value: 'deadline', label: '期限順' },
  { value: 'priority', label: '優先度順' },
];

interface TaskListProps {
  onEditTask?: (taskId: Id<'tasks'>) => void;
  onCreateTask?: () => void;
}

export function TaskList({ onEditTask, onCreateTask }: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');

  const tasks = useQuery(api.tasks.getTasks, {
    status: statusFilter
      ? (statusFilter as 'todo' | 'in_progress' | 'completed' | 'on_hold')
      : undefined,
    priority: priorityFilter ? (priorityFilter as 'low' | 'medium' | 'high' | 'urgent') : undefined,
  });

  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  if (tasks === undefined) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`filter-skeleton-${Math.random()}-${i}`}
                className="h-10 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`task-skeleton-${Math.random()}-${i}`}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline - b.deadline;
      case 'priority': {
        const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      case 'createdAt':
        return b.createdAt - a.createdAt;
      default:
        return b.updatedAt - a.updatedAt;
    }
  });

  const handleStatusChange = async (taskId: Id<'tasks'>, status: string) => {
    try {
      await updateTask({
        taskId: taskId,
        status: status as 'todo' | 'in_progress' | 'completed' | 'on_hold',
      });
    } catch (error) {
      console.error('ステータス更新エラー:', error);
    }
  };

  const handleDeleteTask = async (taskId: Id<'tasks'>) => {
    if (confirm('本当にこのタスクを削除しますか？')) {
      try {
        await deleteTask({ taskId: taskId });
      } catch (error) {
        console.error('タスク削除エラー:', error);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">タスク一覧</h1>
        <Button onClick={onCreateTask}>新しいタスクを作成</Button>
      </div>

      <Card variant="outlined">
        <CardHeader>
          <CardTitle>フィルター・ソート</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="ステータスで絞り込み"
            />
            <Select
              options={PRIORITY_OPTIONS}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              placeholder="優先度で絞り込み"
            />
            <Select
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              placeholder="並び順"
            />
          </div>
        </CardContent>
      </Card>

      {sortedTasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              タスクがありません
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              新しいタスクを作成して、作業を始めましょう！
            </p>
            <Button onClick={onCreateTask}>最初のタスクを作成</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onStatusChange={handleStatusChange}
              onEdit={() => onEditTask?.(task._id)}
              onDelete={() => handleDeleteTask(task._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: {
    _id: Id<'tasks'>;
    title: string;
    description?: string;
    status: string;
    priority: string;
    category?: string;
    createdAt: number;
    updatedAt: number;
    deadline?: number;
    estimatedTime?: number;
    memo?: string;
  };
  onStatusChange: (taskId: Id<'tasks'>, status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskItem({ task, onStatusChange, onEdit, onDelete }: TaskItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const supportTask = useAction(api.ai.taskSupportAgent.supportTask);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = task.deadline && task.deadline < Date.now() && task.status !== 'completed';

  return (
    <Card
      variant="outlined"
      className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300 dark:border-red-700' : ''}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {task.title}
              </h3>
              {isOverdue && (
                <Badge variant="destructive" size="sm">
                  期限切れ
                </Badge>
              )}
            </div>

            {task.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge {...getStatusBadgeProps(task.status)} />
              <Badge {...getPriorityBadgeProps(task.priority)} />
              {task.category && (
                <Badge variant="secondary" size="sm">
                  {task.category}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>作成: {formatDate(task.createdAt)}</span>
              <span>更新: {formatDate(task.updatedAt)}</span>
              {task.deadline && (
                <span className={isOverdue ? 'text-red-600 dark:text-red-400' : ''}>
                  期限: {formatDate(task.deadline)}
                </span>
              )}
              {task.estimatedTime && <span>見積: {task.estimatedTime}分</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Select
              options={[
                { value: 'todo', label: '未着手' },
                { value: 'in_progress', label: '進行中' },
                { value: 'completed', label: '完了' },
                { value: 'on_hold', label: '保留' },
              ]}
              value={task.status}
              onChange={(e) => onStatusChange(task._id, e.target.value)}
              size="sm"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    const result = await supportTask({ taskId: task._id });
                    if (result.success) {
                      setShowSnackbar({ type: 'success', message: 'タスクサポートが完了しました' });
                      setTimeout(() => setShowSnackbar(null), 3000);
                    } else {
                      setShowSnackbar({
                        type: 'error',
                        message: result.error || 'エラーが発生しました',
                      });
                      setTimeout(() => setShowSnackbar(null), 5000);
                    }
                  } catch {
                    setShowSnackbar({
                      type: 'error',
                      message: 'タスクサポートの実行中にエラーが発生しました',
                    });
                    setTimeout(() => setShowSnackbar(null), 5000);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                title="AIエージェントでタスクをサポート"
              >
                {isProcessing ? <span className="animate-spin">⚙️</span> : <span>🤖</span>}
              </Button>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                編集
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                削除
              </Button>
            </div>
          </div>
        </div>
        {task.memo && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              AIサポート内容
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{task.memo}</pre>
            </div>
          </div>
        )}
      </CardContent>
      {showSnackbar && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all transform translate-y-0 ${
            showSnackbar.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {showSnackbar.message}
        </div>
      )}
    </Card>
  );
}
