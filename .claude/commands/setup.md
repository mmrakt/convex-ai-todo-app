# プロジェクトセットアップコマンド

## 概要
プロジェクトの初期セットアップを行う

## 基本セットアップ
```bash
# 依存関係インストール
pnpm install

# 型チェック
pnpm check-types

# リント・フォーマット
pnpm check

# テスト実行
pnpm test:run
```

## 開発環境起動
```bash
# Web開発サーバー起動
pnpm dev

# または特定のアプリ起動
cd apps/mobile && pnpm dev
```

## モバイル開発環境セットアップ
```bash
cd apps/mobile

# iOS/Androidプラットフォーム初期化
pnpm ios:init
pnpm android:init

# 環境確認
pnpm tauri:info
```

## 推奨セットアップ順序
1. `pnpm install` - 依存関係インストール
2. `pnpm check-types` - 型チェック
3. `pnpm check` - コード品質チェック
4. `pnpm test:run` - テスト実行
5. `pnpm dev` - 開発サーバー起動