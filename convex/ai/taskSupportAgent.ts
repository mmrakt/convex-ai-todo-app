import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { action } from "../_generated/server";
import {
  calculateCost,
  checkRateLimit,
  MODEL_CONFIG,
} from "./config";

export const supportTask = action({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; content?: string; error?: string }> => {
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

      const { text: supportContent, usage } = await generateText({
        model: openai(MODEL_CONFIG.model),
        prompt,
        temperature: MODEL_CONFIG.temperature,
        maxTokens: MODEL_CONFIG.maxTokens,
      });

      const cost = calculateCost(usage?.totalTokens || 0);

      await ctx.runMutation(api.tasks.updateMemo, {
        id: args.taskId,
        memo: supportContent,
      });

      await ctx.runMutation(api.ai.logAIContent, {
        taskId: args.taskId,
        type: "suggestion",
        content: supportContent,
        metadata: {
          model: MODEL_CONFIG.model,
          tokens: usage?.totalTokens || 0,
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
