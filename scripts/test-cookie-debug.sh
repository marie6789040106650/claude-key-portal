#!/bin/bash
COOKIE_JAR=$(mktemp)

# 登录
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"testuser@example.com","password":"Test@1234"}' \
  -c "$COOKIE_JAR" > /dev/null

echo "=== 测试Cookie调试endpoint ==="
curl -s http://localhost:3000/api/debug/cookies -b "$COOKIE_JAR"

rm -f "$COOKIE_JAR"
