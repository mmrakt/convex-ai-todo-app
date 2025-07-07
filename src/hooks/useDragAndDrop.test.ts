import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { useDragAndDrop } from './useDragAndDrop';

// Mock the dependencies
vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
}));

vi.mock('./useErrorHandler', () => ({
  useErrorHandler: vi.fn(),
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    tasks: {
      updateTask: 'updateTask',
    },
  },
}));

import { useMutation } from 'convex/react';
import type { Doc } from '../../convex/_generated/dataModel';
import { useErrorHandler } from './useErrorHandler';

const mockUseMutation = useMutation as Mock;
const mockUseErrorHandler = useErrorHandler as Mock;

describe('useDragAndDrop', () => {
  const mockUpdateTask = vi.fn();
  const mockHandleError = vi.fn();
  const mockClearError = vi.fn();

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

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(mockUpdateTask);
    mockUseErrorHandler.mockReturnValue({
      error: null,
      handleError: mockHandleError,
      clearError: mockClearError,
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDragAndDrop());

    expect(result.current.draggedTask).toBeNull();
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle drag start', () => {
    const { result } = renderHook(() => useDragAndDrop());

    act(() => {
      result.current.handleDragStart(mockTask);
    });

    expect(result.current.draggedTask).toBe(mockTask);
  });

  it('should handle drag end', () => {
    const { result } = renderHook(() => useDragAndDrop());

    act(() => {
      result.current.handleDragStart(mockTask);
    });

    expect(result.current.draggedTask).toBe(mockTask);

    act(() => {
      result.current.handleDragEnd();
    });

    expect(result.current.draggedTask).toBeNull();
  });

  it('should handle drop with status change', async () => {
    mockUpdateTask.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDragAndDrop());

    act(() => {
      result.current.handleDragStart(mockTask);
    });

    await act(async () => {
      await result.current.handleDrop('in_progress');
    });

    expect(mockUpdateTask).toHaveBeenCalledWith({
      taskId: mockTask._id,
      status: 'in_progress',
    });
    expect(result.current.draggedTask).toBeNull();
  });

  it('should not handle drop when no task is dragged', async () => {
    const { result } = renderHook(() => useDragAndDrop());

    await act(async () => {
      await result.current.handleDrop('in_progress');
    });

    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it('should not handle drop when status is unchanged', async () => {
    const { result } = renderHook(() => useDragAndDrop());

    act(() => {
      result.current.handleDragStart(mockTask);
    });

    await act(async () => {
      await result.current.handleDrop('todo');
    });

    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it('should handle drop error', async () => {
    const mockError = new Error('Update failed');
    mockUpdateTask.mockRejectedValue(mockError);
    const { result } = renderHook(() => useDragAndDrop());

    act(() => {
      result.current.handleDragStart(mockTask);
    });

    await act(async () => {
      await result.current.handleDrop('in_progress');
    });

    expect(mockHandleError).toHaveBeenCalledWith(mockError, 'Failed to update task status');
    expect(result.current.draggedTask).toBeNull();
  });

  it('should check if task is being dragged', () => {
    const { result } = renderHook(() => useDragAndDrop());
    const otherTask = { ...mockTask, _id: 'task-2' as Id<'tasks'> };

    expect(result.current.isTaskBeingDragged(mockTask)).toBe(false);

    act(() => {
      result.current.handleDragStart(mockTask);
    });

    expect(result.current.isTaskBeingDragged(mockTask)).toBe(true);
    expect(result.current.isTaskBeingDragged(otherTask)).toBe(false);
  });

  it('should provide correct drop zone props', () => {
    const { result } = renderHook(() => useDragAndDrop());

    act(() => {
      result.current.handleDragStart(mockTask);
    });

    const dropZoneProps = result.current.getDropZoneProps('in_progress');

    expect(dropZoneProps.isDraggedOver).toBe(true);
    expect(typeof dropZoneProps.onDragOver).toBe('function');
    expect(typeof dropZoneProps.onDrop).toBe('function');
  });

  it('should handle drag over event', () => {
    const { result } = renderHook(() => useDragAndDrop());
    const mockEvent = {
      preventDefault: vi.fn(),
    } as React.DragEvent;

    const dropZoneProps = result.current.getDropZoneProps('in_progress');
    dropZoneProps.onDragOver(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should handle drop event', () => {
    const { result } = renderHook(() => useDragAndDrop());
    const mockEvent = {
      preventDefault: vi.fn(),
    } as React.DragEvent;

    let dropZoneProps: ReturnType<typeof result.current.getDropZoneProps>;

    act(() => {
      result.current.handleDragStart(mockTask);
      dropZoneProps = result.current.getDropZoneProps('in_progress');
    });

    act(() => {
      dropZoneProps.onDrop(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should indicate no drag over when no task is dragged', () => {
    const { result } = renderHook(() => useDragAndDrop());

    const dropZoneProps = result.current.getDropZoneProps('in_progress');

    expect(dropZoneProps.isDraggedOver).toBe(false);
  });

  it('should indicate no drag over when status is same', () => {
    const { result } = renderHook(() => useDragAndDrop());

    act(() => {
      result.current.handleDragStart(mockTask);
    });

    const dropZoneProps = result.current.getDropZoneProps('todo');

    expect(dropZoneProps.isDraggedOver).toBe(false);
  });
});
