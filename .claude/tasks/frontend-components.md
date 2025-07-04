# フロントエンド - UIコンポーネント実装タスク

## 担当エージェント: Frontend Agent

## タスク概要
React/Next.jsを使用したMVPのフロントエンドコンポーネント実装

## 実装内容

### 1. ダッシュボードコンポーネント (src/components/Dashboard.tsx)

#### 機能要件
- 今日のタスク一覧表示
- タスク統計情報（完了数、進行中数など）
- 優先度別タスクサマリー
- 最近の活動履歴

#### UI要素
- ヘッダーセクション（挨拶、日付）
- 統計カード（グリッドレイアウト）
- タスクサマリーカード
- クイックアクションボタン

### 2. タスクリストコンポーネント (src/components/TaskList.tsx)

#### 機能要件
- タスク一覧表示（リスト形式）
- ステータスフィルター（全て、未着手、進行中、完了、保留）
- 優先度フィルター
- ソート機能（期限、優先度、作成日）
- タスクのステータス変更（クリックで切り替え）

#### UI要素
- フィルターバー
- タスクカード（タイトル、期限、優先度、ステータス表示）
- 空状態の表示
- ローディング状態

### 3. タスク作成・編集フォーム (src/components/TaskForm.tsx)

#### 機能要件
- タスク新規作成
- 既存タスク編集
- バリデーション
- リアルタイム保存状態表示

#### フォームフィールド
- タイトル（必須）
- 説明（テキストエリア）
- 優先度選択（ドロップダウン）
- 期限設定（日付ピッカー）
- カテゴリー入力
- 推定時間入力

### 4. 共通UIコンポーネント

#### src/components/ui/ 配下に作成：
- `Button.tsx`: 共通ボタンコンポーネント
- `Card.tsx`: カードコンポーネント
- `Badge.tsx`: ステータス・優先度バッジ
- `Select.tsx`: セレクトボックス
- `DatePicker.tsx`: 日付選択コンポーネント

### 5. スタイリング要件

- Tailwind CSSを使用
- ダークモード対応
- レスポンシブデザイン（モバイル、タブレット、デスクトップ）
- アクセシビリティ対応（aria-label、role属性）

### 6. Convex連携

各コンポーネントで使用するConvexフック：
- `useQuery`: データ取得
- `useMutation`: データ更新
- リアルタイム更新の実装

## 実装時の注意点

- コンポーネントは再利用可能に設計
- 適切なローディング・エラー状態の処理
- TypeScriptの型定義を厳密に
- パフォーマンス最適化（React.memo、useMemoの活用）

## 完了条件

- [ ] Dashboard.tsx が実装済み
- [ ] TaskList.tsx が実装済み
- [ ] TaskForm.tsx が実装済み
- [ ] 共通UIコンポーネントが実装済み
- [ ] 全コンポーネントがレスポンシブ対応
- [ ] Convexとの連携が正常に動作