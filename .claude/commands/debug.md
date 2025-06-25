# デバッグコマンド

## 概要
開発中のデバッグとトラブルシューティングを支援する

## 基本デバッグ
```bash
# 型エラーチェック
pnpm check-types

# リント結果詳細表示
pnpm lint

# テストの詳細実行
pnpm test:ui
```

## モバイルデバッグ
```bash
cd apps/mobile

# iOSデバッグモード
pnpm debug:ios

# Androidデバッグモード  
pnpm debug:android

# Tauri環境情報
pnpm tauri:info
```

## 環境確認
```bash
# Node.js環境確認
node --version
pnpm --version

# Rust環境確認（モバイル用）
cd apps/mobile && pnpm rust:targets
```

## よくある問題の解決
```bash
# node_modules再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install

# TypeScript型キャッシュクリア
pnpm check-types --force

# テストキャッシュクリア
pnpm test:run --clearCache
```