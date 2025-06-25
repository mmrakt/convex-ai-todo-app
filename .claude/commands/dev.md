# Development Commands

## Start Development

```bash
pnpm dev
```

個別アプリの起動:

```bash
# Web app
pnpm --filter web dev

# Mobile app  
pnpm --filter mobile dev
```

## Build

```bash
pnpm build
```

個別アプリのビルド:

```bash
# Web app
pnpm --filter web build

# Mobile app
pnpm --filter mobile build
```

## Code Quality

```bash
# リント（自動修正あり）
pnpm lint

# フォーマット
pnpm format

# リント + フォーマット
pnpm check

# 型チェック
pnpm check-types
```

## Dependencies

```bash
# ワークスペース全体の依存関係インストール
pnpm install

# 特定のワークスペースに依存関係を追加
pnpm --filter web add next
pnpm --filter mobile add @tauri-apps/api

# 開発依存関係として追加
pnpm --filter ui add -D typescript
```

## Testing

```bash
# 全テスト実行
pnpm test

# ウォッチモード
pnpm test:watch

# カバレッジ付き
pnpm test:coverage
```
