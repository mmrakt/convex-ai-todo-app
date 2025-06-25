# AI機能 - エージェント実装タスク

## 担当エージェント: AI Integration Agent

## タスク概要
OpenAI/Claude APIを使用したAIタスク分解機能とリサーチエージェントの実装

## 実装内容

### 1. AIタスク分解API (convex/ai/taskDecomposer.ts)

#### 機能要件
- 大きなタスクを実行可能な小タスクに分解
- ユーザーのスキルレベルを考慮（初期はデフォルト設定）
- 分解されたタスクに推定時間を設定

#### 実装関数
```typescript
export const decomposeTask = action({
  args: {
    taskTitle: v.string(),
    taskDescription: v.string(),
    userSkills: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // OpenAI/Claude APIを使用してタスク分解
    // 返り値: サブタスクの配列
  },
});
```

#### AIプロンプト例
```
以下のタスクを実行可能な小さなステップに分解してください：
タイトル: {taskTitle}
説明: {taskDescription}
ユーザーのスキル: {userSkills}

各サブタスクには以下を含めてください：
- タイトル
- 推定所要時間（分）
- 実行順序
```

### 2. リサーチエージェント基本実装 (convex/ai/researchAgent.ts)

#### 機能要件
- Web検索APIを使用した情報収集（初期はモック実装でOK）
- 収集した情報の要約・整理
- タスクに関連する参考情報の提供

#### 実装関数
```typescript
export const researchTopic = action({
  args: {
    topic: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    // 1. Web検索API呼び出し（または初期はモック）
    // 2. OpenAI/Claude APIで情報を要約
    // 3. 結果をタスクに関連付けて保存
  },
});
```

### 3. AI設定管理 (convex/ai/config.ts)

#### 環境変数設定
```typescript
// OpenAI APIキー
process.env.OPENAI_API_KEY
// Claude APIキー（オプション）
process.env.ANTHROPIC_API_KEY
// 使用するモデル
process.env.AI_MODEL // "gpt-4", "gpt-3.5-turbo", "claude-3"
```

#### レート制限とエラーハンドリング
- API呼び出しのレート制限実装
- エラー時のフォールバック処理
- コスト管理のためのトークン数計測

### 4. AIコンテンツ保存用スキーマ (convex/schema.ts に追加)

```typescript
aiContents: defineTable({
  taskId: v.id("tasks"),
  type: v.union(
    v.literal("decomposition"),
    v.literal("research"),
    v.literal("suggestion")
  ),
  content: v.string(),
  metadata: v.optional(v.object({
    model: v.string(),
    tokens: v.number(),
    cost: v.number(),
  })),
  createdAt: v.number(),
}),
```

### 5. フロントエンド連携フック (src/hooks/useAI.ts)

```typescript
export const useTaskDecomposition = () => {
  const decomposeTask = useAction(api.ai.taskDecomposer.decomposeTask);
  // ローディング状態、エラーハンドリング等
};

export const useResearch = () => {
  const research = useAction(api.ai.researchAgent.researchTopic);
  // ローディング状態、エラーハンドリング等
};
```

## 実装時の注意点

- APIキーは環境変数で管理（.env.localに設定）
- エラーハンドリングを確実に実装
- コスト管理のため、APIコール数を最小限に
- 初期実装ではモックレスポンスでもOK
- プロンプトエンジニアリングで品質向上

## 完了条件

- [ ] taskDecomposer.ts が実装済み
- [ ] researchAgent.ts が基本実装済み
- [ ] AI設定管理が実装済み
- [ ] AIコンテンツ保存スキーマが定義済み
- [ ] フロントエンド連携フックが実装済み
- [ ] 環境変数が適切に設定されている