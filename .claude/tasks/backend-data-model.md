# バックエンド - データモデル定義タスク

## 担当エージェント: Backend Agent 1

## タスク概要
Convexを使用したデータモデルの定義とタスクCRUD APIの実装

## 実装内容

### 1. Convexスキーマ定義 (convex/schema.ts)

以下のテーブルを定義する：

#### users テーブル
```typescript
{
  email: v.string(),
  name: v.string(),
  skills: v.array(v.string()),
  preferences: v.object({
    theme: v.string(),
    notifications: v.boolean(),
    language: v.string(),
  }),
}
```

#### tasks テーブル
```typescript
{
  userId: v.id("users"),
  title: v.string(),
  description: v.string(),
  status: v.union(
    v.literal("todo"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("on_hold")
  ),
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("urgent")
  ),
  deadline: v.optional(v.number()), // Unix timestamp
  category: v.string(),
  estimatedTime: v.optional(v.number()), // 分単位
  actualTime: v.optional(v.number()), // 分単位
  createdAt: v.number(),
  updatedAt: v.number(),
}
```

#### subtasks テーブル
```typescript
{
  taskId: v.id("tasks"),
  title: v.string(),
  completed: v.boolean(),
  order: v.number(),
  createdAt: v.number(),
}
```

### 2. タスクCRUD API実装

#### convex/tasks.ts に以下の関数を実装：

- `createTask`: 新規タスク作成
- `getTasks`: ユーザーのタスク一覧取得（フィルタリング・ソート対応）
- `getTask`: 単一タスク取得
- `updateTask`: タスク更新
- `deleteTask`: タスク削除
- `updateTaskStatus`: タスクステータス更新

#### convex/subtasks.ts に以下の関数を実装：

- `createSubtask`: サブタスク作成
- `updateSubtask`: サブタスク更新
- `deleteSubtask`: サブタスク削除
- `toggleSubtask`: サブタスク完了状態切り替え

### 3. 実装時の注意点

- 認証が必要な関数は `mutation` や `query` に認証チェックを追加
- タイムスタンプは自動で設定
- 削除時は関連するサブタスクも削除（カスケード削除）
- エラーハンドリングを適切に実装

## 完了条件

- [ ] schema.ts にテーブル定義が完成
- [ ] tasks.ts に全CRUD関数が実装済み
- [ ] subtasks.ts にサブタスク関連関数が実装済み
- [ ] 各関数の型定義が正しく設定されている
- [ ] エラーハンドリングが実装されている