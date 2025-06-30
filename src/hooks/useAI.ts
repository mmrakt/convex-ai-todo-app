import { useAction } from 'convex/react';
import { useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

// Task decomposition hook return type
type TaskDecompositionResult = {
  subtasks: Array<{
    title: string;
    description: string;
    estimatedTime: number;
    order: number;
    dependencies: string[];
  }>;
  metadata: {
    model: string;
    tokens: number;
    cost: number;
  };
};

// Research hook return type
type ResearchResult = {
  topic: string;
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }>;
  metadata: {
    model: string;
    tokens: number;
    cost: number;
  };
};

// Task decomposition hook
export const useTaskDecomposition = () => {
  const decomposeTaskAction = useAction(api.ai.taskDecomposer.decomposeTask);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decomposeTask = async (
    taskTitle: string,
    taskDescription: string,
    userSkills?: string[],
  ): Promise<TaskDecompositionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await decomposeTaskAction({
        taskTitle,
        taskDescription,
        userSkills,
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while decomposing the task';
      setError(errorMessage);
      console.error('Task decomposition error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    decomposeTask,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

// Research hook
export const useResearch = () => {
  const researchTopicAction = useAction(api.ai.researchAgent.researchTopic);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const research = async (
    topic: string,
    taskId: Id<'tasks'>,
    searchDepth: 'basic' | 'detailed' = 'basic',
  ): Promise<ResearchResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await researchTopicAction({
        topic,
        taskId,
        searchDepth,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during research';
      setError(errorMessage);
      console.error('Research error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    research,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

// Hook to manage AI feature usage
export const useAIUsage = () => {
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  const trackUsage = (metadata: { tokens: number; cost: number }) => {
    setTotalCost((prev) => prev + metadata.cost);
    setTotalTokens((prev) => prev + metadata.tokens);
    setRequestCount((prev) => prev + 1);
  };

  const resetUsage = () => {
    setTotalCost(0);
    setTotalTokens(0);
    setRequestCount(0);
  };

  return {
    totalCost,
    totalTokens,
    requestCount,
    trackUsage,
    resetUsage,
  };
};

// Integrated AI operations hook
export const useAIOperations = () => {
  const { decomposeTask, isLoading: isDecomposing, error: decomposeError } = useTaskDecomposition();
  const { research, isLoading: isResearching, error: researchError } = useResearch();
  const { trackUsage, ...usage } = useAIUsage();

  // Decompose task and create subtasks
  const decomposeAndCreateSubtasks = async (
    taskTitle: string,
    taskDescription: string,
    userSkills?: string[],
  ) => {
    const result = await decomposeTask(taskTitle, taskDescription, userSkills);

    if (result) {
      trackUsage(result.metadata);
      return result.subtasks;
    }

    return null;
  };

  // Research topic and get results
  const researchAndTrack = async (
    topic: string,
    taskId: Id<'tasks'>,
    searchDepth: 'basic' | 'detailed' = 'basic',
  ) => {
    const result = await research(topic, taskId, searchDepth);

    if (result) {
      trackUsage(result.metadata);
      return result;
    }

    return null;
  };

  return {
    // Operations
    decomposeAndCreateSubtasks,
    researchAndTrack,

    // State
    isDecomposing,
    isResearching,
    isLoading: isDecomposing || isResearching,

    // Errors
    decomposeError,
    researchError,
    hasError: !!(decomposeError || researchError),

    // Usage stats
    usage,
  };
};

// AI feature availability check
export const useAIAvailability = () => {
  const checkAvailability = () => {
    // Cannot directly check environment variables on client side
    // In actual implementation, fetch from server-side endpoint
    return {
      isAvailable: true, // Initial value
      supportedModels: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'],
      limitations: {
        maxTokens: 4000,
        rateLimit: '100 requests/minute',
      },
    };
  };

  return checkAvailability();
};
