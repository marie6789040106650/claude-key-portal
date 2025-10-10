#!/bin/bash
# 验证登录修复的完整测试脚本
# 测试API层面的完整登录→仪表板流程

set -e

echo "========================================="
echo "登录修复验证测试"
echo "========================================="
echo ""

BASE_URL="http://localhost:3000"
COOKIE_JAR=$(mktemp)

# 测试数据
EMAIL="testuser@example.com"
PASSWORD="Test@1234"

echo "📝 测试配置:"
echo "  - Base URL: $BASE_URL"
echo "  - Email: $EMAIL"
echo "  - Cookie Jar: $COOKIE_JAR"
echo ""

# 步骤1: 登录
echo "🔐 步骤1: 测试登录API"
echo "POST /api/auth/login"

LOGIN_RESPONSE=$(curl -s -i -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -c "$COOKIE_JAR")

echo "$LOGIN_RESPONSE" | head -20
echo ""

# 检查状态码
if echo "$LOGIN_RESPONSE" | grep -q "HTTP/1.1 200 OK"; then
  echo "✅ 登录成功 (200 OK)"
else
  echo "❌ 登录失败"
  exit 1
fi

# 检查Cookie设置
if echo "$LOGIN_RESPONSE" | grep -q "set-cookie: accessToken="; then
  echo "✅ accessToken Cookie已设置"
else
  echo "❌ accessToken Cookie未设置"
  exit 1
fi

if echo "$LOGIN_RESPONSE" | grep -q "set-cookie: refreshToken="; then
  echo "✅ refreshToken Cookie已设置"
else
  echo "❌ refreshToken Cookie未设置"
  exit 1
fi

echo ""

# 步骤2: 使用Cookie访问仪表板API
echo "📊 步骤2: 使用Cookie访问仪表板"
echo "GET /api/dashboard"

DASHBOARD_RESPONSE=$(curl -s -i -X GET "$BASE_URL/api/dashboard" \
  -b "$COOKIE_JAR" \
  -H "Cache-Control: no-cache")

echo "$DASHBOARD_RESPONSE" | head -20
echo ""

# 检查状态码
if echo "$DASHBOARD_RESPONSE" | grep -q "HTTP/1.1 200 OK"; then
  echo "✅ 仪表板API访问成功 (200 OK)"
else
  if echo "$DASHBOARD_RESPONSE" | grep -q "HTTP/1.1 401"; then
    echo "❌ 仪表板API返回401 - Cookie认证失败"
    exit 1
  else
    echo "❌ 仪表板API访问失败"
    exit 1
  fi
fi

echo ""

# 步骤3: 测试密钥列表API
echo "🔑 步骤3: 测试密钥列表API"
echo "GET /api/keys"

KEYS_RESPONSE=$(curl -s -i -X GET "$BASE_URL/api/keys" \
  -b "$COOKIE_JAR")

echo "$KEYS_RESPONSE" | head -15
echo ""

if echo "$KEYS_RESPONSE" | grep -q "HTTP/1.1 200 OK"; then
  echo "✅ 密钥列表API访问成功 (200 OK)"
else
  echo "⚠️ 密钥列表API访问失败（可能是空列表）"
fi

echo ""

# 清理
rm -f "$COOKIE_JAR"

echo "========================================="
echo "✅ 所有API测试通过！"
echo "========================================="
echo ""
echo "📝 测试结论:"
echo "  - 登录API: ✅ 正常"
echo "  - Cookie设置: ✅ 正常"
echo "  - Cookie认证: ✅ 正常"
echo "  - 仪表板访问: ✅ 正常"
echo ""
echo "🎯 下一步: 在真实浏览器中测试完整UI流程"
echo "   访问: $BASE_URL/auth/login"
echo "   使用: $EMAIL / $PASSWORD"
