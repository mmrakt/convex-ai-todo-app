import type { Doc, Id } from '../../../convex/_generated/dataModel';

export interface KanbanBoardProps {
  tasks: Doc<'tasks'>[];
}

export interface KanbanColumnProps {
  title: string;
  status: string;
  tasks: Doc<'tasks'>[];
  onDragStart: (task: Doc<'tasks'>) => void;
  onDragEnd: () => void;
  onDrop: (status: string) => void;
  isDraggedOver: boolean;
  color: string;
}

export interface KanbanCardProps {
  task: Doc<'tasks'>;
  onEdit: (taskId: Id<'tasks'>) => void;
  onDragStart: (task: Doc<'tasks'>) => void;
  onDragEnd: () => void;
}

export interface DragState {
  draggedTask: Doc<'tasks'> | null;
  isDragging: boolean;
}

export interface ColumnConfig {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed' | 'on_hold';
  color: string;
  bgColor: string;
}
