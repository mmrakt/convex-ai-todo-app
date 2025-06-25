#!/bin/bash

echo "🚀 Convex AI Todo App - 環境設定セットアップ"
echo "============================================"

# .env.localの存在確認
if [ -f ".env.local" ]; then
  echo "⚠️  .env.localが既に存在します。"
  read -p "上書きしますか？ (y/n): " overwrite
  if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
    echo "セットアップを中止しました。"
    exit 0
  fi
fi

# .env.exampleから.env.localをコピー
echo "📁 .env.exampleから.env.localを作成中..."
cp .env.example .env.local

# JWT_PRIVATE_KEYを生成
echo "🔐 JWT秘密鍵を生成中..."
JWT_KEY=$(openssl rand -hex 32)

# Convexの環境変数として設定
echo "🔧 ConvexにJWT秘密鍵を設定中..."
pnpm convex env set JWT_PRIVATE_KEY $JWT_KEY

echo "✅ JWT_PRIVATE_KEYがConvexに設定されました"
echo "   設定確認: pnpm convex env list"

echo "✅ 基本設定が完了しました！"
echo ""
echo "📝 次にやること："
echo "1. .env.localファイルを開く"
echo "2. OpenAI APIキー（OPENAI_API_KEY）を設定"
echo "3. Convex設定（CONVEX_DEPLOYMENT, VITE_CONVEX_URL）を設定"
echo ""
echo "🔗 APIキー取得方法："
echo "- OpenAI: https://platform.openai.com/api-keys"
echo "- Claude: https://console.anthropic.com/"
echo ""
echo "🚀 セットアップ完了後は以下を実行："
echo "pnpm install"
echo "pnpm dev"