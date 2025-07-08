import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { Id } from '../../convex/_generated/dataModel';
import {
  useAIAvailability,
  useAIOperations,
  useAIUsage,
  useResearch,
  useTaskDecomposition,
} from './useAI';

// Mock the dependencies
vi.mock('convex/react', () => ({
  useAction: vi.fn(),
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    ai: {
      taskDecomposer: {
        decomposeTask: 'decomposeTask',
      },
      researchAgent: {
        researchTopic: 'researchTopic',
      },
    },
  },
}));

import { useAction } from 'convex/react';

const mockUseAction = useAction as Mock;

describe('useTaskDecomposition', () => {
  const mockDecomposeTaskAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAction.mockReturnValue(mockDecomposeTaskAction);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTaskDecomposition());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.decomposeTask).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should decompose task successfully', async () => {
    const mockResult = {
      subtasks: [
        {
          title: 'Subtask 1',
          description: 'Description 1',
          estimatedTime: 30,
          order: 1,
          dependencies: [],
        },
      ],
      metadata: {
        model: 'gpt-4',
        tokens: 100,
        cost: 0.01,
      },
    };

    mockDecomposeTaskAction.mockResolvedValue(mockResult);
    const { result } = renderHook(() => useTaskDecomposition());

    let decompositionResult: unknown;
    await act(async () => {
      decompositionResult = await result.current.decomposeTask('Test Task', 'Test Description');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(decompositionResult).toEqual(mockResult);
    expect(mockDecomposeTaskAction).toHaveBeenCalledWith({
      taskTitle: 'Test Task',
      taskDescription: 'Test Description',
      userSkills: undefined,
    });
  });

  it('should handle decomposition error', async () => {
    const mockError = new Error('Decomposition failed');
    mockDecomposeTaskAction.mockRejectedValue(mockError);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useTaskDecomposition());

    let decompositionResult: unknown;
    await act(async () => {
      decompositionResult = await result.current.decomposeTask('Test Task', 'Test Description');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Decomposition failed');
    expect(decompositionResult).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Task decomposition error:', mockError);

    consoleSpy.mockRestore();
  });

  it('should handle non-Error exceptions', async () => {
    mockDecomposeTaskAction.mockRejectedValue('String error');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useTaskDecomposition());

    let decompositionResult: unknown;
    await act(async () => {
      decompositionResult = await result.current.decomposeTask('Test Task', 'Test Description');
    });

    expect(result.current.error).toBe('An error occurred while decomposing the task');
    expect(decompositionResult).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useTaskDecomposition());

    act(() => {
      // Simulate setting an error
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useResearch', () => {
  const mockResearchTopicAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAction.mockReturnValue(mockResearchTopicAction);
  });

  it('should research topic successfully', async () => {
    const mockResult = {
      topic: 'Test Topic',
      summary: 'Test Summary',
      sources: [
        {
          title: 'Source 1',
          url: 'https://example.com',
          snippet: 'Test snippet',
          relevance: 0.9,
        },
      ],
      metadata: {
        model: 'gpt-4',
        tokens: 150,
        cost: 0.02,
      },
    };

    mockResearchTopicAction.mockResolvedValue(mockResult);
    const { result } = renderHook(() => useResearch());

    let researchResult: unknown;
    await act(async () => {
      researchResult = await result.current.research('Test Topic', 'task-1' as Id<'tasks'>);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(researchResult).toEqual(mockResult);
    expect(mockResearchTopicAction).toHaveBeenCalledWith({
      topic: 'Test Topic',
      taskId: 'task-1',
      searchDepth: 'basic',
    });
  });

  it('should handle research error', async () => {
    const mockError = new Error('Research failed');
    mockResearchTopicAction.mockRejectedValue(mockError);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useResearch());

    let researchResult: unknown;
    await act(async () => {
      researchResult = await result.current.research('Test Topic', 'task-1' as Id<'tasks'>);
    });

    expect(result.current.error).toBe('Research failed');
    expect(researchResult).toBeNull();

    consoleSpy.mockRestore();
  });
});

describe('useAIUsage', () => {
  it('should initialize with zero usage', () => {
    const { result } = renderHook(() => useAIUsage());

    expect(result.current.totalCost).toBe(0);
    expect(result.current.totalTokens).toBe(0);
    expect(result.current.requestCount).toBe(0);
  });

  it('should track usage correctly', () => {
    const { result } = renderHook(() => useAIUsage());

    act(() => {
      result.current.trackUsage({ tokens: 100, cost: 0.01 });
    });

    expect(result.current.totalCost).toBe(0.01);
    expect(result.current.totalTokens).toBe(100);
    expect(result.current.requestCount).toBe(1);

    act(() => {
      result.current.trackUsage({ tokens: 50, cost: 0.005 });
    });

    expect(result.current.totalCost).toBe(0.015);
    expect(result.current.totalTokens).toBe(150);
    expect(result.current.requestCount).toBe(2);
  });

  it('should reset usage', () => {
    const { result } = renderHook(() => useAIUsage());

    act(() => {
      result.current.trackUsage({ tokens: 100, cost: 0.01 });
    });

    expect(result.current.totalCost).toBe(0.01);

    act(() => {
      result.current.resetUsage();
    });

    expect(result.current.totalCost).toBe(0);
    expect(result.current.totalTokens).toBe(0);
    expect(result.current.requestCount).toBe(0);
  });
});

describe('useAIOperations', () => {
  const mockDecomposeTaskAction = vi.fn();
  const mockResearchTopicAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAction.mockImplementation((action) => {
      if (action === 'decomposeTask') return mockDecomposeTaskAction;
      if (action === 'researchTopic') return mockResearchTopicAction;
      return vi.fn();
    });
  });

  it('should decompose and track usage', async () => {
    const mockResult = {
      subtasks: [
        {
          title: 'Subtask 1',
          description: 'Desc 1',
          estimatedTime: 30,
          order: 1,
          dependencies: [],
        },
      ],
      metadata: { model: 'gpt-4', tokens: 100, cost: 0.01 },
    };

    mockDecomposeTaskAction.mockResolvedValue(mockResult);
    const { result } = renderHook(() => useAIOperations());

    let subtasks: unknown;
    await act(async () => {
      subtasks = await result.current.decomposeAndCreateSubtasks('Test Task', 'Test Description');
    });

    expect(subtasks).toEqual(mockResult.subtasks);
    expect(result.current.usage.totalCost).toBe(0.01);
    expect(result.current.usage.totalTokens).toBe(100);
    expect(result.current.usage.requestCount).toBe(1);
  });

  it('should research and track usage', async () => {
    const mockResult = {
      topic: 'Test Topic',
      summary: 'Summary',
      sources: [],
      metadata: { model: 'gpt-4', tokens: 150, cost: 0.02 },
    };

    mockResearchTopicAction.mockResolvedValue(mockResult);
    const { result } = renderHook(() => useAIOperations());

    let researchResult: unknown;
    await act(async () => {
      researchResult = await result.current.researchAndTrack('Test Topic', 'task-1' as Id<'tasks'>);
    });

    expect(researchResult).toEqual(mockResult);
    expect(result.current.usage.totalCost).toBe(0.02);
    expect(result.current.usage.totalTokens).toBe(150);
    expect(result.current.usage.requestCount).toBe(1);
  });

  it('should handle combined loading states', () => {
    const { result } = renderHook(() => useAIOperations());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });
});

describe('useAIAvailability', () => {
  it('should return availability information', () => {
    const { result } = renderHook(() => useAIAvailability());

    expect(result.current.isAvailable).toBe(true);
    expect(result.current.supportedModels).toEqual(['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet']);
    expect(result.current.limitations).toEqual({
      maxTokens: 4000,
      rateLimit: '100 requests/minute',
    });
  });
});
