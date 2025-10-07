#!/bin/bash

# ===================================
# Vercel 环境变量配置脚本
# ===================================
# 使用方法：
# 1. 填入下方的 UPSTASH_REDIS_REST_TOKEN
# 2. 运行: bash vercel-env-setup.sh
# ===================================

# ⚠️ 必填：请从 Upstash 控制台获取并填入Token
# 访问: https://console.upstash.com/redis/87712ca2-c4de-4462-ab2b-7a17acf94cd8
# 点击 "Details" 标签 → "REST" → 点击眼睛图标显示 Token → 复制
UPSTASH_REDIS_REST_TOKEN="AUcZAAIncDJhNmU4ZTdjZmE5YmE0MjUyOTNlNWRlYjRjMWJhMThjMnAyMTgyMDE"

# ===================================
# 以下配置无需修改
# ===================================

echo "🚀 开始配置Vercel环境变量..."
echo ""

# 检查Token是否已填写
if [ "$UPSTASH_REDIS_REST_TOKEN" == "[请填入你的Token]" ]; then
    echo "❌ 错误: 请先填入 UPSTASH_REDIS_REST_TOKEN"
    echo ""
    echo "获取步骤:"
    echo "1. 访问: https://console.upstash.com/redis/87712ca2-c4de-4462-ab2b-7a17acf94cd8"
    echo "2. 点击 'Connect' 区域的 'REST' 标签"
    echo "3. 点击眼睛图标显示 Token"
    echo "4. 复制 Token 值并粘贴到本脚本中"
    echo ""
    exit 1
fi

echo "📝 添加环境变量到 Vercel Production..."
echo ""

# 添加环境变量函数
add_env() {
    local key=$1
    local value=$2
    echo "→ 添加: $key"
    echo "$value" | vercel env add "$key" production --force 2>/dev/null || true
}

# 添加所有环境变量
add_env "NEXT_PUBLIC_DOMAIN" "https://portal.just-play.fun"
add_env "DATABASE_URL" "postgresql://postgres.gvcfrzaxfehydtxiaxcw:DrvsiLusxqKXCwZrRYWILoM4JfbHl1VqBgFt94kXtuY=@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
add_env "UPSTASH_REDIS_REST_URL" "https://next-woodcock-18201.upstash.io"
add_env "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
add_env "CRS_BASE_URL" "https://claude.just-play.fun"
add_env "CRS_ADMIN_USERNAME" "cr_admin_4ce18cd2"
add_env "CRS_ADMIN_PASSWORD" "HCTBMoiK3PZD0eDC"
add_env "NEXTAUTH_SECRET" "WtgIGc3Gb9ZZlRXKfrJlNsXQnL2KZIC+/ewg0zle1Rk="
add_env "NEXTAUTH_URL" "https://portal.just-play.fun"
add_env "JWT_SECRET" "x7rj2zVduSBOcO2UkQrbxfGSjlgylBuKXsTcRgZoQXA="
add_env "JWT_EXPIRES_IN" "24h"
add_env "NODE_ENV" "production"

echo ""
echo "✅ 环境变量配置完成！"
echo ""
echo "📋 已配置的环境变量:"
vercel env ls production

echo ""
echo "🎯 下一步操作:"
echo "1. 运行数据库迁移: npx dotenv -e .env.production -- npx prisma migrate deploy"
echo "2. 部署到Vercel: vercel --prod"
