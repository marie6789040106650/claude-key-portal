#!/bin/bash

# API全面验证脚本
# 项目: Claude Key Portal
# 用途: 自动测试所有20个API端点

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BASE_URL="http://localhost:3000"
REPORT_FILE="docs/verification/reports/01-api-test-report.md"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# 测试统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# 临时变量
TOKEN=""
TEST_USER_EMAIL="api-test-$(date +%s)@example.com"
TEST_USER_PASSWORD="TestPass123!@#"
TEST_USER_NICKNAME="API Test User"
KEY_ID=""

# 工具函数
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 执行API测试
test_api() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local auth=$5
    local expected_status=$6

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo ""
    echo "测试 #$TOTAL_TESTS: $description"
    echo "  方法: $method"
    echo "  端点: $endpoint"

    # 构建curl命令
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"

    if [ "$auth" = "true" ] && [ -n "$TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $TOKEN'"
    fi

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi

    curl_cmd="$curl_cmd $BASE_URL$endpoint"

    # 执行请求
    local start_time=$(python3 -c 'import time; print(int(time.time() * 1000))')
    local response=$(eval $curl_cmd)
    local end_time=$(python3 -c 'import time; print(int(time.time() * 1000))')
    local response_time=$((end_time - start_time))

    # 提取状态码和响应体
    local status_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    # 验证状态码
    if [ "$status_code" = "$expected_status" ]; then
        print_success "状态码: $status_code (预期: $expected_status) - ${response_time}ms"
        PASSED_TESTS=$((PASSED_TESTS + 1))

        # 检查响应时间
        if [ $response_time -gt 500 ]; then
            print_warning "响应时间过长: ${response_time}ms (预期 < 500ms)"
            WARNINGS=$((WARNINGS + 1))
        fi

        # 打印响应数据（仅前200字符）
        echo "  响应: $(echo "$body" | cut -c1-200)"

        echo "$body"  # 返回完整响应体供后续使用
    else
        print_error "状态码: $status_code (预期: $expected_status)"
        print_error "响应: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo ""  # 返回空字符串
    fi
}

# 提取JSON字段
extract_json_field() {
    local json=$1
    local field=$2
    echo "$json" | grep -o "\"$field\":\"[^\"]*\"" | sed "s/\"$field\":\"\([^\"]*\)\"/\1/"
}

# 初始化报告
init_report() {
    mkdir -p "$(dirname "$REPORT_FILE")"
    cat > "$REPORT_FILE" << EOF
# 阶段1: API接口验证 - 报告

> **执行时间**: $TIMESTAMP
> **测试环境**: $BASE_URL
> **自动化**: scripts/test-all-apis.sh

---

## 📊 执行摘要

EOF
}

# 更新报告摘要
update_report_summary() {
    local pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    local status="❌ 失败"

    if [ $pass_rate -ge 90 ]; then
        status="✅ 通过"
    elif [ $pass_rate -ge 70 ]; then
        status="⚠️ 部分通过"
    fi

    cat >> "$REPORT_FILE" << EOF
- **总体结果**: $status
- **通过率**: $PASSED_TESTS/$TOTAL_TESTS ($pass_rate%)
- **失败数**: $FAILED_TESTS
- **警告数**: $WARNINGS

---

## 📝 详细测试结果

EOF
}

# 添加章节标题到报告
add_section() {
    echo -e "\n### $1\n" >> "$REPORT_FILE"
}

# 添加测试结果到报告
add_test_result() {
    local status=$1
    local endpoint=$2
    local description=$3
    local response_time=$4
    local http_status=$5

    echo "- [$status] $endpoint: $description" >> "$REPORT_FILE"
    echo "  - 响应时间: ${response_time}ms" >> "$REPORT_FILE"
    echo "  - HTTP状态: $http_status" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# 完成报告
finalize_report() {
    cat >> "$REPORT_FILE" << EOF

---

## 📈 性能数据

- **平均响应时间**: 待计算
- **通过测试**: $PASSED_TESTS
- **失败测试**: $FAILED_TESTS
- **警告**: $WARNINGS

---

## 🔄 下一步

EOF

    if [ $((PASSED_TESTS * 100 / TOTAL_TESTS)) -ge 90 ]; then
        echo "✅ API验证通过，可以进入阶段2 - 用户旅程测试" >> "$REPORT_FILE"
    else
        echo "❌ API验证未通过，需要修复失败的测试" >> "$REPORT_FILE"
    fi
}

# ============================================
# 开始测试
# ============================================

print_header "Claude Key Portal API 全面验证"
echo "时间: $TIMESTAMP"
echo "环境: $BASE_URL"

init_report

# ============================================
# 1.1 认证接口 (3个)
# ============================================
print_header "1.1 认证接口测试 (3个)"
add_section "1.1 认证接口 (3/3)"

# 1. 健康检查
response=$(test_api "GET" "/api/health" "健康检查" "" "false" "200")

# 2. 用户注册
response=$(test_api "POST" "/api/auth/register" "用户注册" \
    "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\",\"nickname\":\"$TEST_USER_NICKNAME\"}" \
    "false" "201")

# 3. 用户登录
response=$(test_api "POST" "/api/auth/login" "用户登录" \
    "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" \
    "false" "200")

# 提取Token（注意：API返回的是accessToken不是token）
if [ -n "$response" ]; then
    TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"\([^"]*\)"/\1/')
    if [ -n "$TOKEN" ]; then
        print_success "获取到Token: ${TOKEN:0:20}..."
    else
        print_error "无法提取Token，后续测试可能失败"
    fi
fi

# ============================================
# 1.2 用户管理接口 (3个)
# ============================================
print_header "1.2 用户管理接口测试 (3个)"
add_section "1.2 用户管理接口 (3/3)"

# 4. 获取用户信息
test_api "GET" "/api/user/profile" "获取用户信息" "" "true" "200"

# 5. 更新用户信息 (使用PUT方法)
test_api "PUT" "/api/user/profile" "更新用户昵称" \
    "{\"nickname\":\"Updated Test User\"}" \
    "true" "200"

# 6. 修改密码
test_api "POST" "/api/user/password" "修改用户密码" \
    "{\"oldPassword\":\"$TEST_USER_PASSWORD\",\"newPassword\":\"NewPass123!@#\"}" \
    "true" "200"

# 更新密码变量
TEST_USER_PASSWORD="NewPass123!@#"

# ============================================
# 1.3 密钥管理接口 (8个)
# ============================================
print_header "1.3 密钥管理接口测试 (8个)"
add_section "1.3 密钥管理接口 (8/8)"

# 7. 创建密钥
response=$(test_api "POST" "/api/keys" "创建新密钥" \
    "{\"name\":\"Test API Key\",\"description\":\"测试用密钥\"}" \
    "true" "201")

# 提取密钥ID
if [ -n "$response" ]; then
    KEY_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | sed 's/"id":"\([^"]*\)"/\1/' | head -1)
    if [ -n "$KEY_ID" ]; then
        print_success "创建的密钥ID: $KEY_ID"
    else
        print_warning "无法提取密钥ID，部分测试将跳过"
    fi
fi

# 8. 获取密钥列表
test_api "GET" "/api/keys" "获取密钥列表" "" "true" "200"

if [ -n "$KEY_ID" ]; then
    # 9. 获取密钥详情
    test_api "GET" "/api/keys/$KEY_ID" "获取密钥详情" "" "true" "200"

    # 10. 更新密钥
    test_api "PUT" "/api/keys/$KEY_ID" "更新密钥信息" \
        "{\"name\":\"Updated Key Name\",\"description\":\"更新后的描述\"}" \
        "true" "200"

    # 11. 切换密钥状态 (使用isActive字段)
    test_api "PATCH" "/api/keys/$KEY_ID/status" "禁用密钥" \
        "{\"isActive\":false}" \
        "true" "200"

    test_api "PATCH" "/api/keys/$KEY_ID/status" "启用密钥" \
        "{\"isActive\":true}" \
        "true" "200"

    # 12. 重命名密钥
    test_api "PUT" "/api/keys/$KEY_ID/rename" "重命名密钥" \
        "{\"name\":\"Renamed Key\"}" \
        "true" "200"

    # 13. 更新描述
    test_api "PUT" "/api/keys/$KEY_ID/description" "更新密钥描述" \
        "{\"description\":\"新的密钥描述\"}" \
        "true" "200"
else
    print_warning "跳过密钥操作测试（无有效密钥ID）"
    WARNINGS=$((WARNINGS + 5))
fi

# ============================================
# 1.4 本地扩展功能接口 (5个)
# ============================================
print_header "1.4 本地扩展功能接口测试 (5个)"
add_section "1.4 本地扩展功能接口 (5/5)"

if [ -n "$KEY_ID" ]; then
    # 14. 收藏密钥
    test_api "PATCH" "/api/keys/$KEY_ID/favorite" "收藏密钥" \
        "{\"isFavorite\":true}" \
        "true" "200"

    # 15. 更新备注
    test_api "PATCH" "/api/keys/$KEY_ID/notes" "更新备注" \
        "{\"description\":\"这是一个本地备注\"}" \
        "true" "200"

    # 16. 添加标签
    test_api "POST" "/api/keys/$KEY_ID/tags" "添加标签" \
        "{\"tags\":[\"production\",\"v1.0\"]}" \
        "true" "200"

    # 17. 删除标签
    test_api "DELETE" "/api/keys/$KEY_ID/tags?tag=v1.0" "删除标签" \
        "" "true" "200"
else
    print_warning "跳过本地扩展功能测试（无有效密钥ID）"
    WARNINGS=$((WARNINGS + 4))
fi

# 18. 获取标签列表
test_api "GET" "/api/tags?sort=usage" "获取标签列表" "" "true" "200"

# ============================================
# 1.5 统计数据接口 (5个)
# ============================================
print_header "1.5 统计数据接口测试 (5个)"
add_section "1.5 统计数据接口 (5/5)"

# 19. 仪表板数据
test_api "GET" "/api/dashboard" "仪表板数据" "" "true" "200"

# 20. 使用统计
test_api "GET" "/api/stats/usage?timeRange=7d" "使用统计" "" "true" "200"

if [ -n "$KEY_ID" ]; then
    # 21. 使用对比
    test_api "GET" "/api/stats/compare?keyIds=$KEY_ID" "使用对比" "" "true" "200"
else
    print_warning "跳过使用对比测试（无有效密钥ID）"
    WARNINGS=$((WARNINGS + 1))
fi

# 22. 排行榜
test_api "GET" "/api/stats/leaderboard" "排行榜" "" "true" "200"

# 23. 导出数据
test_api "GET" "/api/stats/usage/export?format=json" "导出使用数据" "" "true" "200"

# ============================================
# 1.6 安装指导接口 (1个)
# ============================================
print_header "1.6 安装指导接口测试 (1个)"
add_section "1.6 安装指导接口 (1/1)"

if [ -n "$KEY_ID" ]; then
    # 24. 生成安装脚本 (使用macos平台)
    test_api "POST" "/api/install/generate" "生成安装脚本" \
        "{\"keyId\":\"$KEY_ID\",\"platform\":\"macos\",\"environment\":\"development\"}" \
        "true" "200"
else
    print_warning "跳过安装指导测试（无有效密钥ID）"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# 清理测试数据（可选）
# ============================================
print_header "清理测试数据"

if [ -n "$KEY_ID" ]; then
    print_warning "保留测试密钥以便后续验证（ID: $KEY_ID）"
    # 如果需要删除，取消下面的注释：
    # test_api "DELETE" "/api/keys/$KEY_ID" "删除测试密钥" "" "true" "200"
fi

# ============================================
# 生成报告
# ============================================
print_header "测试完成 - 生成报告"

update_report_summary
finalize_report

echo ""
echo "============================================"
echo "测试统计:"
echo "  总测试数: $TOTAL_TESTS"
echo "  通过: $PASSED_TESTS"
echo "  失败: $FAILED_TESTS"
echo "  警告: $WARNINGS"
echo "  通过率: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"
echo "============================================"
echo ""
echo "📄 完整报告已生成: $REPORT_FILE"
echo ""

# 返回退出码
if [ $FAILED_TESTS -eq 0 ]; then
    print_success "所有测试通过！"
    exit 0
else
    print_error "存在失败的测试，请检查报告"
    exit 1
fi
