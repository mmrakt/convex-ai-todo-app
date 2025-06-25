# AI機能セットアップガイド

## 概要

このプロジェクトはOpenAI/Claude APIを使用したAI機能を提供します：
- **タスク分解**: 大きなタスクを実行可能な小タスクに自動分解
- **リサーチエージェント**: トピックに関する情報収集と要約

## セットアップ手順

### 1. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成：

```bash
cp .env.example .env.local
```

### 2. 必須環境変数の設定

#### JWT_PRIVATE_KEY（認証機能に必要）
Convex Authで使用するJWT秘密鍵を生成して設定：

```bash
# 1. ランダムな64文字の文字列を生成
openssl rand -hex 32

# 2. 生成された文字列をConvexの環境変数として設定
# 例: pnpm convex env set JWT_PRIVATE_KEY <生成された文字列>
pnpm convex env set JWT_PRIVATE_KEY 06d4b00a89e20194338b72892e58ef714947ea6d7aa55f87822360722b49d0c9

# 3. 設定確認
pnpm convex env list
```

**重要**: JWT_PRIVATE_KEYは`.env.local`ではなく、`convex env set`コマンドで設定する必要があります。

### 3. APIキーの取得と設定

#### OpenAI API（推奨）
1. [OpenAI Platform](https://platform.openai.com/)でアカウント作成
2. APIキーを生成
3. `.env.local`の`OPENAI_API_KEY`に設定

#### Claude API（オプション）
1. [Anthropic Console](https://console.anthropic.com/)でアカウント作成
2. APIキーを生成
3. `.env.local`の`ANTHROPIC_API_KEY`に設定

### 4. 依存関係のインストール

```bash
pnpm install
```

### 5. 開発サーバーの起動

```bash
pnpm dev
```

## ⚠️ トラブルシューティング

### ログイン/登録エラー

#### `Missing environment variable JWT_PRIVATE_KEY`
**原因**: JWT秘密鍵がConvexの環境変数として設定されていない  
**解決方法**:
1. JWT秘密鍵を生成: `openssl rand -hex 32`
2. Convexの環境変数として設定: `pnpm convex env set JWT_PRIVATE_KEY <生成された値>`
3. 設定確認: `pnpm convex env list`

**注意**: `.env.local`ではなく、必ず`convex env set`コマンドを使用してください。

#### `InvalidAccountId`
**原因**: ユーザーアカウントが存在しない、またはスキーマの競合  
**解決方法**:
1. まず新規ユーザー登録を行う
2. その後、同じ認証情報でログイン

## 使用方法

### フロントエンドでの利用

```tsx
import { useTaskDecomposition, useResearch } from '@/hooks/useAI';

const TaskComponent = () => {
  const { decomposeTask, isLoading, error } = useTaskDecomposition();
  const { research } = useResearch();

  const handleDecompose = async () => {
    const result = await decomposeTask(
      "Webアプリケーションの開発",
      "React + TypeScriptでTodoアプリを作成する",
      ["React", "TypeScript"]
    );
    
    if (result) {
      console.log("分解されたサブタスク:", result.subtasks);
    }
  };

  const handleResearch = async (taskId: string) => {
    const result = await research(
      "React開発のベストプラクティス",
      taskId as Id<"tasks">
    );
    
    if (result) {
      console.log("リサーチ結果:", result.summary);
    }
  };
};
```

### Convex Actionの直接呼び出し

```tsx
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

const action = useAction(api.ai.taskDecomposer.decomposeTask);
const result = await action({
  taskTitle: "タスクタイトル",
  taskDescription: "タスクの詳細説明"
});
```

## AI機能の詳細

### タスク分解API

- **ファイル**: `convex/ai/taskDecomposer.ts`
- **機能**: 大きなタスクを実行可能な小タスクに分解
- **入力**: タスクタイトル、説明、ユーザーのスキル
- **出力**: サブタスク配列（タイトル、説明、推定時間、実行順序）

### リサーチエージェント

- **ファイル**: `convex/ai/researchAgent.ts`
- **機能**: Web検索結果の要約と情報整理
- **入力**: 検索トピック、タスクID
- **出力**: 要約、重要ポイント、参考リンク

### データベーススキーマ

AIで生成されたコンテンツは`aiContents`テーブルに保存されます：

```typescript
aiContents: {
  taskId: Id<"tasks">,
  type: "decomposition" | "research" | "suggestion",
  content: string,
  metadata?: {
    model: string,
    tokens: number,
    cost: number,
  },
  createdAt: number,
}
```

## コスト管理

- トークン使用量とコストは自動計算
- `useAIUsage`フックで使用状況を追跡
- レート制限機能で過剰使用を防止

## トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - `.env.local`にAPIキーが正しく設定されているか確認
   - APIキーの権限とクォータを確認

2. **レート制限エラー**
   - しばらく時間を置いてから再試行
   - 必要に応じて`AI_CONFIG.RATE_LIMIT`を調整

3. **モデルエラー**
   - 指定したモデルが利用可能か確認
   - `AI_MODEL`環境変数を確認

### ログの確認

開発者ツールのコンソールでエラーログを確認してください。

## 今後の拡張予定

- [ ] 実際のWeb検索API連携
- [ ] より高度なプロンプトエンジニアリング
- [ ] ユーザー別のAI設定カスタマイズ
- [ ] AI生成コンテンツの評価システム