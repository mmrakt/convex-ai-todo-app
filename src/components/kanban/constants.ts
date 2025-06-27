export const KANBAN_COLUMNS = [
  {
    id: 'todo',
    title: '未着手',
    status: 'todo' as const,
    color: 'border-t-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
  },
  {
    id: 'in_progress',
    title: '進行中',
    status: 'in_progress' as const,
    color: 'border-t-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    id: 'completed',
    title: '完了',
    status: 'completed' as const,
    color: 'border-t-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    id: 'on_hold',
    title: '保留',
    status: 'on_hold' as const,
    color: 'border-t-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
] as const;

export const DRAG_STYLES = {
  DRAGGING: 'opacity-50 rotate-2 scale-105',
  DROP_ZONE_ACTIVE: 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300',
  TRANSITION: 'transition-all duration-200 ease-in-out',
} as const;

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'on_hold';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
