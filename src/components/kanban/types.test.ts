import { describe, expect, it } from 'vitest';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import type {
  ColumnConfig,
  DragState,
  KanbanBoardProps,
  KanbanCardProps,
  KanbanColumnProps,
} from './types';

// Mock task data for testing
const mockTask: Doc<'tasks'> = {
  _id: 'task-1' as Id<'tasks'>,
  _creationTime: Date.now(),
  title: 'Test Task',
  description: 'Test Description',
  status: 'todo',
  priority: 'medium',
  createdAt: Date.now(),
  userId: 'user-1' as Id<'users'>,
};

const mockTasks: Doc<'tasks'>[] = [mockTask];

describe('KanbanBoardProps', () => {
  it('should accept valid props structure', () => {
    const props: KanbanBoardProps = {
      tasks: mockTasks,
    };

    expect(props.tasks).toBeDefined();
    expect(Array.isArray(props.tasks)).toBe(true);
    expect(props.tasks).toHaveLength(1);
    expect(props.tasks[0]).toEqual(mockTask);
  });

  it('should accept empty tasks array', () => {
    const props: KanbanBoardProps = {
      tasks: [],
    };

    expect(props.tasks).toEqual([]);
  });
});

describe('KanbanColumnProps', () => {
  it('should accept valid props structure', () => {
    const mockHandlers = {
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onDrop: vi.fn(),
    };

    const props: KanbanColumnProps = {
      title: 'Test Column',
      status: 'todo',
      tasks: mockTasks,
      onDragStart: mockHandlers.onDragStart,
      onDragEnd: mockHandlers.onDragEnd,
      onDrop: mockHandlers.onDrop,
      isDraggedOver: false,
      color: 'border-t-blue-500',
    };

    expect(props.title).toBe('Test Column');
    expect(props.status).toBe('todo');
    expect(props.tasks).toEqual(mockTasks);
    expect(typeof props.onDragStart).toBe('function');
    expect(typeof props.onDragEnd).toBe('function');
    expect(typeof props.onDrop).toBe('function');
    expect(props.isDraggedOver).toBe(false);
    expect(props.color).toBe('border-t-blue-500');
  });

  it('should accept isDraggedOver as true', () => {
    const props: KanbanColumnProps = {
      title: 'Test Column',
      status: 'in_progress',
      tasks: [],
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onDrop: vi.fn(),
      isDraggedOver: true,
      color: 'border-t-green-500',
    };

    expect(props.isDraggedOver).toBe(true);
  });
});

describe('KanbanCardProps', () => {
  it('should accept valid props structure', () => {
    const mockHandlers = {
      onEdit: vi.fn(),
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
    };

    const props: KanbanCardProps = {
      task: mockTask,
      onEdit: mockHandlers.onEdit,
      onDragStart: mockHandlers.onDragStart,
      onDragEnd: mockHandlers.onDragEnd,
    };

    expect(props.task).toEqual(mockTask);
    expect(typeof props.onEdit).toBe('function');
    expect(typeof props.onDragStart).toBe('function');
    expect(typeof props.onDragEnd).toBe('function');
  });

  it('should accept task with different properties', () => {
    const differentTask: Doc<'tasks'> = {
      ...mockTask,
      _id: 'task-2' as Id<'tasks'>,
      title: 'Different Task',
      status: 'completed',
      priority: 'high',
    };

    const props: KanbanCardProps = {
      task: differentTask,
      onEdit: vi.fn(),
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
    };

    expect(props.task.title).toBe('Different Task');
    expect(props.task.status).toBe('completed');
    expect(props.task.priority).toBe('high');
  });
});

describe('DragState', () => {
  it('should accept null draggedTask', () => {
    const dragState: DragState = {
      draggedTask: null,
      isDragging: false,
    };

    expect(dragState.draggedTask).toBeNull();
    expect(dragState.isDragging).toBe(false);
  });

  it('should accept valid draggedTask', () => {
    const dragState: DragState = {
      draggedTask: mockTask,
      isDragging: true,
    };

    expect(dragState.draggedTask).toEqual(mockTask);
    expect(dragState.isDragging).toBe(true);
  });

  it('should handle inconsistent states', () => {
    // Test case where draggedTask is null but isDragging is true
    const inconsistentState: DragState = {
      draggedTask: null,
      isDragging: true,
    };

    expect(inconsistentState.draggedTask).toBeNull();
    expect(inconsistentState.isDragging).toBe(true);
  });
});

describe('ColumnConfig', () => {
  it('should accept valid column configuration', () => {
    const config: ColumnConfig = {
      id: 'todo',
      title: 'To Do',
      status: 'todo',
      color: 'border-t-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
    };

    expect(config.id).toBe('todo');
    expect(config.title).toBe('To Do');
    expect(config.status).toBe('todo');
    expect(config.color).toBe('border-t-gray-400');
    expect(config.bgColor).toBe('bg-gray-50 dark:bg-gray-800');
  });

  it('should accept all valid status values', () => {
    const statuses: ColumnConfig['status'][] = ['todo', 'in_progress', 'completed', 'on_hold'];

    statuses.forEach((status, index) => {
      const config: ColumnConfig = {
        id: status,
        title: `Column ${index}`,
        status,
        color: `border-t-color-${index}`,
        bgColor: `bg-color-${index}`,
      };

      expect(config.status).toBe(status);
    });
  });

  it('should allow different id and status', () => {
    const config: ColumnConfig = {
      id: 'custom-id',
      title: 'Custom Column',
      status: 'in_progress',
      color: 'border-t-blue-500',
      bgColor: 'bg-blue-50',
    };

    expect(config.id).toBe('custom-id');
    expect(config.status).toBe('in_progress');
    expect(config.id).not.toBe(config.status);
  });
});

describe('Type consistency', () => {
  it('should maintain consistent task structure across interfaces', () => {
    const task = mockTask;

    // Test that the same task can be used in different interfaces
    const boardProps: KanbanBoardProps = { tasks: [task] };
    const columnProps: KanbanColumnProps = {
      title: 'Test',
      status: 'todo',
      tasks: [task],
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onDrop: vi.fn(),
      isDraggedOver: false,
      color: 'border-t-blue-500',
    };
    const cardProps: KanbanCardProps = {
      task,
      onEdit: vi.fn(),
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
    };
    const dragState: DragState = {
      draggedTask: task,
      isDragging: true,
    };

    expect(boardProps.tasks[0]).toBe(task);
    expect(columnProps.tasks[0]).toBe(task);
    expect(cardProps.task).toBe(task);
    expect(dragState.draggedTask).toBe(task);
  });

  it('should maintain consistent status type across interfaces', () => {
    const status = 'in_progress';

    const columnProps: KanbanColumnProps = {
      title: 'Test',
      status,
      tasks: [],
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onDrop: vi.fn(),
      isDraggedOver: false,
      color: 'border-t-blue-500',
    };

    const columnConfig: ColumnConfig = {
      id: 'test',
      title: 'Test',
      status,
      color: 'border-t-blue-500',
      bgColor: 'bg-blue-50',
    };

    expect(columnProps.status).toBe(status);
    expect(columnConfig.status).toBe(status);
  });
});
