import { useAction } from 'convex/react';
import { useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

// タスク分解フックの返り値型
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

// リサーチフックの返り値型
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

// タスク分解フック
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
        err instanceof Error ? err.message : 'タスクの分解中にエラーが発生しました';
      setError(errorMessage);
      console.error('タスク分解エラー:', err);
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

// リサーチフック
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
      const errorMessage = err instanceof Error ? err.message : 'リサーチ中にエラーが発生しました';
      setError(errorMessage);
      console.error('リサーチエラー:', err);
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

// AI機能の利用状況を管理するフック
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

// 統合AI操作フック
export const useAIOperations = () => {
  const { decomposeTask, isLoading: isDecomposing, error: decomposeError } = useTaskDecomposition();
  const { research, isLoading: isResearching, error: researchError } = useResearch();
  const { trackUsage, ...usage } = useAIUsage();

  // タスクを分解してサブタスクを作成
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

  // トピックをリサーチして結果を取得
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
    // 操作
    decomposeAndCreateSubtasks,
    researchAndTrack,

    // 状態
    isDecomposing,
    isResearching,
    isLoading: isDecomposing || isResearching,

    // エラー
    decomposeError,
    researchError,
    hasError: !!(decomposeError || researchError),

    // 使用状況
    usage,
  };
};

// AI機能の可用性チェック
export const useAIAvailability = () => {
  const checkAvailability = () => {
    // 環境変数の存在をクライアントサイドで直接チェックはできない
    // 実際の実装では、サーバーサイドのエンドポイントから取得する
    return {
      isAvailable: true, // 初期値
      supportedModels: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'],
      limitations: {
        maxTokens: 4000,
        rateLimit: '100 requests/minute',
      },
    };
  };

  return checkAvailability();
};
