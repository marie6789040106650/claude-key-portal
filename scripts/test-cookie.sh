#!/bin/bash
COOKIE_JAR=$(mktemp)

# 登录并保存Cookie
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"testuser@example.com","password":"Test@1234"}' \
  -c "$COOKIE_JAR" > /dev/null

echo "=== Cookie文件内容 ==="
cat "$COOKIE_JAR"
echo ""

echo "=== 使用Cookie测试Dashboard ==="
curl -v http://localhost:3000/api/dashboard \
  -b "$COOKIE_JAR" 2>&1 | grep -E "Cookie:|HTTP/1"

rm -f "$COOKIE_JAR"
