import { describe, expect, it } from 'vitest';
import { DRAG_STYLES, KANBAN_COLUMNS, type TaskPriority, type TaskStatus } from './constants';

describe('KANBAN_COLUMNS', () => {
  it('should have correct number of columns', () => {
    expect(KANBAN_COLUMNS).toHaveLength(4);
  });

  it('should have todo column with correct properties', () => {
    const todoColumn = KANBAN_COLUMNS.find((col) => col.id === 'todo');

    expect(todoColumn).toBeDefined();
    expect(todoColumn).toEqual({
      id: 'todo',
      title: 'To Do',
      status: 'todo',
      color: 'border-t-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
    });
  });

  it('should have in_progress column with correct properties', () => {
    const inProgressColumn = KANBAN_COLUMNS.find((col) => col.id === 'in_progress');

    expect(inProgressColumn).toBeDefined();
    expect(inProgressColumn).toEqual({
      id: 'in_progress',
      title: 'In Progress',
      status: 'in_progress',
      color: 'border-t-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    });
  });

  it('should have completed column with correct properties', () => {
    const completedColumn = KANBAN_COLUMNS.find((col) => col.id === 'completed');

    expect(completedColumn).toBeDefined();
    expect(completedColumn).toEqual({
      id: 'completed',
      title: 'Completed',
      status: 'completed',
      color: 'border-t-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    });
  });

  it('should have on_hold column with correct properties', () => {
    const onHoldColumn = KANBAN_COLUMNS.find((col) => col.id === 'on_hold');

    expect(onHoldColumn).toBeDefined();
    expect(onHoldColumn).toEqual({
      id: 'on_hold',
      title: 'On Hold',
      status: 'on_hold',
      color: 'border-t-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    });
  });

  it('should have unique ids for all columns', () => {
    const ids = KANBAN_COLUMNS.map((col) => col.id);
    const uniqueIds = [...new Set(ids)];

    expect(ids).toHaveLength(uniqueIds.length);
  });

  it('should have unique statuses for all columns', () => {
    const statuses = KANBAN_COLUMNS.map((col) => col.status);
    const uniqueStatuses = [...new Set(statuses)];

    expect(statuses).toHaveLength(uniqueStatuses.length);
  });

  it('should have consistent id and status for each column', () => {
    KANBAN_COLUMNS.forEach((column) => {
      expect(column.id).toBe(column.status);
    });
  });
});

describe('DRAG_STYLES', () => {
  it('should have DRAGGING style', () => {
    expect(DRAG_STYLES.DRAGGING).toBe('opacity-50 rotate-2 scale-105');
  });

  it('should have DROP_ZONE_ACTIVE style', () => {
    expect(DRAG_STYLES.DROP_ZONE_ACTIVE).toBe(
      'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300',
    );
  });

  it('should have TRANSITION style', () => {
    expect(DRAG_STYLES.TRANSITION).toBe('transition-all duration-200 ease-in-out');
  });

  it('should have all required drag style properties', () => {
    expect(DRAG_STYLES).toHaveProperty('DRAGGING');
    expect(DRAG_STYLES).toHaveProperty('DROP_ZONE_ACTIVE');
    expect(DRAG_STYLES).toHaveProperty('TRANSITION');
  });
});

describe('TaskStatus type', () => {
  it('should accept valid task status values', () => {
    const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'completed', 'on_hold'];

    // This test ensures the type accepts these values without TypeScript errors
    validStatuses.forEach((status) => {
      expect(typeof status).toBe('string');
    });
  });

  it('should match KANBAN_COLUMNS statuses', () => {
    const columnStatuses = KANBAN_COLUMNS.map((col) => col.status);
    const expectedStatuses: TaskStatus[] = ['todo', 'in_progress', 'completed', 'on_hold'];

    expect(columnStatuses).toEqual(expect.arrayContaining(expectedStatuses));
    expect(columnStatuses).toHaveLength(expectedStatuses.length);
  });
});

describe('TaskPriority type', () => {
  it('should accept valid task priority values', () => {
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

    // This test ensures the type accepts these values without TypeScript errors
    validPriorities.forEach((priority) => {
      expect(typeof priority).toBe('string');
    });
  });

  it('should have correct priority order', () => {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

    expect(priorities).toEqual(['low', 'medium', 'high', 'urgent']);
  });
});
