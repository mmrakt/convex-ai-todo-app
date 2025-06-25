# モバイルアプリ開発コマンド

## 概要
Tauriモバイルアプリの開発・ビルド・デプロイを行う

## iOS開発
```bash
cd apps/mobile
pnpm tauri:dev:ios
```

## Android開発
```bash
cd apps/mobile
pnpm tauri:dev:android
```

## 初期セットアップ
```bash
cd apps/mobile
pnpm ios:init        # iOS初期化
pnpm android:init    # Android初期化
```

## プロダクションビルド
```bash
cd apps/mobile
pnpm tauri:build:ios      # iOS本番ビルド
pnpm tauri:build:android  # Android本番ビルド
```

## デバッグ
```bash
cd apps/mobile
pnpm debug:ios       # iOSデバッグモード
pnpm debug:android   # Androidデバッグモード
```

## 環境確認
```bash
cd apps/mobile
pnpm tauri:info      # Tauri環境情報
pnpm rust:targets    # Rust対応ターゲット一覧
```