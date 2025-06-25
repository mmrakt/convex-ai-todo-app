# デプロイコマンド

## 概要
本番環境へのデプロイを実行する

## プリデプロイチェック
```bash
# 全体チェック
pnpm check-types
pnpm check  
pnpm test:run
pnpm build
```

## モバイルアプリデプロイ
```bash
cd apps/mobile

# iOS本番ビルド
pnpm tauri:build:ios

# Android本番ビルド
pnpm tauri:build:android
```

## デプロイ前チェックリスト
1. [ ] TypeScript型チェック通過
2. [ ] リント・フォーマットチェック通過
3. [ ] 全テスト通過
4. [ ] プロダクションビルド成功
5. [ ] 環境変数設定確認
6. [ ] 依存関係セキュリティチェック

## 推奨デプロイフロー
```bash
# 1. コード品質チェック
pnpm check-types && pnpm check && pnpm test:run

# 2. ビルドテスト
pnpm build

# 3. モバイルビルド（必要に応じて）
cd apps/mobile && pnpm tauri:build:ios
cd apps/mobile && pnpm tauri:build:android
```