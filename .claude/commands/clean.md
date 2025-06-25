# クリーンアップコマンド

## 概要
プロジェクトのクリーンアップとリセットを実行する

## 基本クリーンアップ
```bash
# 依存関係再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## ビルドキャッシュクリア
```bash
# 全体ビルドキャッシュクリア
pnpm build --force

# Turboキャッシュクリア
npx turbo clean
```

## テストキャッシュクリア
```bash
# Vitestキャッシュクリア
pnpm test --clearCache
```

## モバイル関連クリーンアップ
```bash
cd apps/mobile

# Tauriキャッシュクリア
pnpm tauri clean

# Rustコンパイル結果クリア
cargo clean
```

## 完全リセット
```bash
# 全キャッシュとnode_modules削除
rm -rf node_modules apps/*/node_modules pnpm-lock.yaml
rm -rf .turbo apps/*/.turbo
rm -rf target apps/*/src-tauri/target

# 再インストール
pnpm install

# 基本チェック
pnpm check-types
pnpm check
pnpm test:run
```

## Git関連クリーンアップ
```bash
# 未追跡ファイル削除（注意して実行）
git clean -fd

# 未追跡ファイル確認
git clean -n
```