"use node";

import { v } from "convex/values";
import { Ollama } from "ollama";
import { api } from "../_generated/api";
import { action } from "../_generated/server";
import { checkRateLimit, estimateTokens, OLLAMA_CONFIG } from "./config";

export const supportTask = action({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; content?: string; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("認証が必要です");
    }

    try {
      await checkRateLimit(ctx, identity.subject);

      const task: any = await ctx.runQuery(api.tasks.get, { id: args.taskId });
      if (!task) {
        throw new Error("タスクが見つかりません");
      }

      const prompt: string = `
あなたは優秀なタスクサポートAIアシスタントです。
以下のタスクについて、ユーザーがタスクを遂行するために役立つ情報を収集し、
実行計画を立てて、マークダウン形式でサポート内容をまとめてください。

タスク情報:
- タイトル: ${task.title}
- 説明: ${task.description}
- カテゴリ: ${task.category}
- 優先度: ${task.priority}
${
  task.deadline
    ? `- 期限: ${new Date(task.deadline).toLocaleDateString("ja-JP")}`
    : ""
}

以下の観点から包括的なサポートを提供してください：

1. **タスクの背景と目的の整理**
   - なぜこのタスクが重要なのか
   - 期待される成果

2. **実行計画の策定**
   - 具体的なステップ
   - 推奨される順序
   - 各ステップの所要時間目安

3. **関連情報とリソース**
   - 参考になる情報源
   - 必要なツールやサービス
   - 学習リソース（該当する場合）

4. **実行時の注意点**
   - よくある落とし穴
   - 成功のためのコツ

5. **次のアクション**
   - 最初に取り組むべきこと
   - チェックポイント

マークダウン形式で、読みやすく構造化された形式で出力してください。
`;

      let supportContent: string;

      try {
        const ollama = new Ollama({ host: OLLAMA_CONFIG.baseUrl });

        const response = await ollama.chat({
          model: OLLAMA_CONFIG.model,
          messages: [{ role: "user", content: prompt }],
          options: {
            temperature: OLLAMA_CONFIG.temperature,
            num_predict: OLLAMA_CONFIG.maxTokens,
          },
        });

        supportContent = response.message.content;
      } catch (ollamaError) {
        console.warn(
          "Ollama実行エラー、フォールバック応答を使用:",
          ollamaError
        );
        // フォールバック: 静的なテンプレート応答
        supportContent = `
# タスクサポート: ${task.title}

## タスクの背景と目的の整理
このタスクは「${task.title}」として設定されており、以下の説明があります：
${task.description || "説明が提供されていません"}

## 実行計画の策定
1. **情報収集**: タスクに関連する情報やリソースを集める
2. **計画立案**: 具体的なステップに分解する
3. **実行**: 計画に従って段階的に進める
4. **確認**: 各ステップの完了を確認する

## 関連情報とリソース
- カテゴリ: ${task.category}
- 優先度: ${task.priority}
${
  task.deadline
    ? `- 期限: ${new Date(task.deadline).toLocaleDateString("ja-JP")}`
    : ""
}

## 実行時の注意点
- 優先度が${task.priority}なので、適切なリソース配分を心がけてください
- 期限がある場合は、余裕を持ったスケジュールを組みましょう

## 次のアクション
まずは情報収集から始めて、具体的な計画を立てることをお勧めします。

*注意: この応答はOllamaが利用できない場合のフォールバック応答です。*
        `;
      }

      // Ollamaはローカル実行なのでコストは0
      const cost = 0;
      const totalTokens =
        estimateTokens(prompt) + estimateTokens(supportContent);

      await ctx.runMutation(api.tasks.updateMemo, {
        id: args.taskId,
        memo: supportContent,
      });

      await ctx.runMutation(api.ai.logAIContent, {
        taskId: args.taskId,
        type: "suggestion",
        content: supportContent,
        metadata: {
          model: OLLAMA_CONFIG.model,
          tokens: totalTokens,
          cost,
        },
      });

      return { success: true, content: supportContent };
    } catch (error) {
      console.error("タスクサポートエラー:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "タスクサポートの実行中にエラーが発生しました",
      };
    }
  },
});
