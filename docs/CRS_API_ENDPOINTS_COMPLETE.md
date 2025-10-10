# CRS API 完整端点列表

> **分析时间**: 2025-10-08
> **CRS版本**: 最新主分支
> **源码路径**: `.temp/claude-relay-service/src/routes/`

---

## 📋 端点统计

| 分类 | 端点数量 | 需要认证 |
|-----|---------|---------|
| 认证和用户 | 5 | 部分 |
| 公开统计查询 | 5 | 否 |
| 用户管理 | 1 | 是 |
| API Key管理 | 17 | 是 |
| 账户组管理 | 6 | 是 |
| Claude账户管理 | 13 | 是 |
| Claude Console账户 | 13 | 是 |
| CCR账户管理 | 10 | 是 |
| Bedrock账户管理 | 9 | 是 |
| Gemini账户管理 | 8 | 是 |
| OpenAI账户管理 | 12 | 是 |
| Azure OpenAI账户 | 10 | 是 |
| OpenAI Responses账户 | 8 | 是 |
| 统计和仪表板 | 13 | 是 |
| 系统设置 | 6 | 是 |
| **总计** | **136** | - |

---

## 🔐 认证和用户管理 (web.js)

### POST /web/auth/login
管理员登录

**请求**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "token": "string",
  "expiresIn": 86400000,
  "username": "string"
}
```

---

### POST /web/auth/logout
管理员登出

---

### POST /web/auth/change-password
修改管理员密码

**请求**:
```json
{
  "newUsername": "string",
  "currentPassword": "string",
  "newPassword": "string"
}
```

---

### GET /web/auth/user
获取当前管理员信息

**响应**:
```json
{
  "success": true,
  "user": {
    "username": "string",
    "loginTime": "ISO8601",
    "lastActivity": "ISO8601"
  }
}
```

---

### POST /web/auth/refresh
刷新Token

---

## 📊 公开统计查询 (apiStats.js)

### POST /api/get-key-id
获取API Key对应的ID

**请求**:
```json
{
  "apiKey": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

---

### POST /api/user-stats
用户统计查询（支持apiKey或apiId）

**请求**:
```json
{
  "apiKey": "string",  // 或
  "apiId": "uuid"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "usage": { /* 使用统计 */ },
    "limits": { /* 限制信息 */ },
    "accounts": { /* 绑定账户 */ },
    "restrictions": { /* 限制设置 */ }
  }
}
```

---

### POST /api/batch-stats
批量统计查询（最多30个）

**请求**:
```json
{
  "apiIds": ["uuid1", "uuid2", ...]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "aggregated": { /* 聚合统计 */ },
    "individual": [ /* 个体统计 */ ]
  }
}
```

---

### POST /api/batch-model-stats
批量模型统计查询

**请求**:
```json
{
  "apiIds": ["uuid1", "uuid2"],
  "period": "daily|monthly"
}
```

---

### POST /api/user-model-stats
用户模型统计查询

**请求**:
```json
{
  "apiKey": "string",  // 或
  "apiId": "uuid",
  "period": "daily|monthly"
}
```

---

## 👥 用户管理 (admin.js)

### GET /admin/users
获取所有用户列表

---

## 🔑 API Key管理 (admin.js)

### GET /admin/api-keys
获取所有API Key列表

### GET /admin/api-keys/:keyId/cost-debug
调试API Key费用统计

### GET /admin/supported-clients
获取支持的客户端列表

### GET /admin/api-keys/tags
获取所有标签

### POST /admin/api-keys
创建新的API Key

### POST /admin/api-keys/batch
批量创建API Keys

### PUT /admin/api-keys/batch
批量更新API Keys

### PUT /admin/api-keys/:keyId
更新单个API Key

### PATCH /admin/api-keys/:keyId/expiration
更新API Key过期时间

### DELETE /admin/api-keys/batch
批量删除API Keys

### DELETE /admin/api-keys/:keyId
删除单个API Key（软删除）

### GET /admin/api-keys/deleted
获取已删除的API Keys

### POST /admin/api-keys/:keyId/restore
恢复已删除的API Key

### DELETE /admin/api-keys/:keyId/permanent
永久删除API Key

### DELETE /admin/api-keys/deleted/clear-all
清空所有已删除的API Keys

### GET /admin/api-keys/:keyId/model-stats
获取单个API Key的模型统计

---

## 📁 账户组管理 (admin.js)

### POST /admin/account-groups
创建账户组

### GET /admin/account-groups
获取所有账户组

### GET /admin/account-groups/:groupId
获取单个账户组详情

### PUT /admin/account-groups/:groupId
更新账户组

### DELETE /admin/account-groups/:groupId
删除账户组

### GET /admin/account-groups/:groupId/members
获取账户组成员

---

## 🤖 Claude账户管理 (admin.js)

### POST /admin/claude-accounts/generate-auth-url
生成OAuth授权URL

### POST /admin/claude-accounts/exchange-code
交换Authorization Code

### POST /admin/claude-accounts/generate-setup-token-url
生成Setup Token URL

### POST /admin/claude-accounts/exchange-setup-token-code
交换Setup Token Code

### GET /admin/claude-accounts
获取所有Claude账户

### GET /admin/claude-accounts/usage
获取Claude账户使用统计

### POST /admin/claude-accounts
创建Claude账户

### PUT /admin/claude-accounts/:accountId
更新Claude账户

### DELETE /admin/claude-accounts/:accountId
删除Claude账户

### POST /admin/claude-accounts/:accountId/update-profile
更新单个账户Profile

### POST /admin/claude-accounts/update-all-profiles
更新所有账户Profile

### POST /admin/claude-accounts/:accountId/refresh
刷新账户Token

### POST /admin/claude-accounts/:accountId/reset-status
重置账户状态

### PUT /admin/claude-accounts/:accountId/toggle-schedulable
切换账户可调度状态

---

## 🖥️ Claude Console账户管理 (admin.js)

### GET /admin/claude-console-accounts
获取所有Console账户

### POST /admin/claude-console-accounts
创建Console账户

### PUT /admin/claude-console-accounts/:accountId
更新Console账户

### DELETE /admin/claude-console-accounts/:accountId
删除Console账户

### PUT /admin/claude-console-accounts/:accountId/toggle
切换账户启用状态

### PUT /admin/claude-console-accounts/:accountId/toggle-schedulable
切换可调度状态

### GET /admin/claude-console-accounts/:accountId/usage
获取账户使用统计

### POST /admin/claude-console-accounts/:accountId/reset-usage
重置账户使用量

### POST /admin/claude-console-accounts/:accountId/reset-status
重置账户状态

### POST /admin/claude-console-accounts/reset-all-usage
重置所有账户使用量

---

## 🔗 CCR账户管理 (admin.js)

### GET /admin/ccr-accounts
获取所有CCR账户

### POST /admin/ccr-accounts
创建CCR账户

### PUT /admin/ccr-accounts/:accountId
更新CCR账户

### DELETE /admin/ccr-accounts/:accountId
删除CCR账户

### PUT /admin/ccr-accounts/:accountId/toggle
切换账户启用状态

### PUT /admin/ccr-accounts/:accountId/toggle-schedulable
切换可调度状态

### GET /admin/ccr-accounts/:accountId/usage
获取账户使用统计

### POST /admin/ccr-accounts/:accountId/reset-usage
重置账户使用量

### POST /admin/ccr-accounts/:accountId/reset-status
重置账户状态

### POST /admin/ccr-accounts/reset-all-usage
重置所有账户使用量

---

## ☁️ Bedrock账户管理 (admin.js)

### GET /admin/bedrock-accounts
获取所有Bedrock账户

### POST /admin/bedrock-accounts
创建Bedrock账户

### PUT /admin/bedrock-accounts/:accountId
更新Bedrock账户

### DELETE /admin/bedrock-accounts/:accountId
删除Bedrock账户

### PUT /admin/bedrock-accounts/:accountId/toggle
切换账户启用状态

### PUT /admin/bedrock-accounts/:accountId/toggle-schedulable
切换可调度状态

### POST /admin/bedrock-accounts/:accountId/test
测试账户连接

---

## 🌟 Gemini账户管理 (admin.js)

### POST /admin/gemini-accounts/generate-auth-url
生成OAuth授权URL

### POST /admin/gemini-accounts/poll-auth-status
轮询授权状态

### POST /admin/gemini-accounts/exchange-code
交换Authorization Code

### GET /admin/gemini-accounts
获取所有Gemini账户

### POST /admin/gemini-accounts
创建Gemini账户

### PUT /admin/gemini-accounts/:accountId
更新Gemini账户

### DELETE /admin/gemini-accounts/:accountId
删除Gemini账户

### POST /admin/gemini-accounts/:accountId/refresh
刷新账户Token

### PUT /admin/gemini-accounts/:accountId/toggle-schedulable
切换可调度状态

---

## 🔵 OpenAI账户管理 (admin.js)

### POST /admin/openai-accounts/generate-auth-url
生成OAuth授权URL

### POST /admin/openai-accounts/exchange-code
交换Authorization Code

### GET /admin/openai-accounts
获取所有OpenAI账户

### POST /admin/openai-accounts
创建OpenAI账户

### PUT /admin/openai-accounts/:id
更新OpenAI账户

### DELETE /admin/openai-accounts/:id
删除OpenAI账户

### PUT /admin/openai-accounts/:id/toggle
切换账户启用状态

### POST /admin/openai-accounts/:accountId/reset-status
重置账户状态

### PUT /admin/openai-accounts/:accountId/toggle-schedulable
切换可调度状态

---

## 🔷 Azure OpenAI账户管理 (admin.js)

### GET /admin/azure-openai-accounts
获取所有Azure OpenAI账户

### POST /admin/azure-openai-accounts
创建Azure OpenAI账户

### PUT /admin/azure-openai-accounts/:id
更新Azure OpenAI账户

### DELETE /admin/azure-openai-accounts/:id
删除Azure OpenAI账户

### PUT /admin/azure-openai-accounts/:id/toggle
切换账户启用状态

### PUT /admin/azure-openai-accounts/:id/toggle-schedulable
切换可调度状态

### POST /admin/azure-openai-accounts/:id/health-check
健康检查

### POST /admin/azure-openai-accounts/health-check-all
批量健康检查

### POST /admin/migrate-api-keys-azure
迁移API Keys到Azure

---

## 🔶 OpenAI Responses账户管理 (admin.js)

### GET /admin/openai-responses-accounts
获取所有OpenAI Responses账户

### POST /admin/openai-responses-accounts
创建OpenAI Responses账户

### PUT /admin/openai-responses-accounts/:id
更新OpenAI Responses账户

### DELETE /admin/openai-responses-accounts/:id
删除OpenAI Responses账户

### PUT /admin/openai-responses-accounts/:id/toggle-schedulable
切换可调度状态

### PUT /admin/openai-responses-accounts/:id/toggle
切换账户启用状态

### POST /admin/openai-responses-accounts/:id/generate-jwt-token
生成JWT Token

### POST /admin/openai-responses-accounts/:id/reset-status
重置账户状态

### POST /admin/openai-responses-accounts/:id/reset-usage
重置账户使用量

---

## 📊 统计和仪表板 (admin.js)

### GET /admin/dashboard
获取仪表板数据 ⭐ 核心统计接口

**响应字段**:
- overview: 系统概览（总密钥数、激活密钥数、总账户数等）
- recentActivity: 今日活动（今日创建的密钥、今日请求数、今日Token数）
- systemAverages: 系统平均值（RPM、TPM）
- realtimeMetrics: 实时指标
- systemHealth: 系统健康状态（Redis连接、Claude账户健康、Gemini账户健康）

### GET /admin/usage-stats
获取使用统计

### GET /admin/model-stats
获取模型统计

### POST /admin/cleanup
清理数据

### GET /admin/usage-trend
获取使用趋势

### GET /admin/account-usage-trend
获取账户使用趋势

### GET /admin/api-keys-usage-trend
获取API Keys使用趋势 ⭐ 核心趋势接口

**响应字段**:
- granularity: 粒度（day）
- topApiKeys: Top使用API Keys
- totalApiKeys: 总密钥数
- data: 每日数据数组（日期 + 各API Key的使用统计）

### GET /admin/usage-costs
获取使用费用

### GET /admin/accounts/usage-stats
获取所有账户使用统计

### GET /admin/accounts/:accountId/usage-stats
获取单个账户使用统计

### GET /admin/accounts/:accountId/usage-history
获取账户使用历史

---

## ⚙️ 系统设置 (admin.js)

### GET /admin/claude-code-headers
获取Claude Code Headers

### DELETE /admin/claude-code-headers/:accountId
删除Claude Code Headers

### GET /admin/check-updates
检查更新

### GET /admin/oem-settings
获取OEM设置

### PUT /admin/oem-settings
更新OEM设置

### GET /admin/claude-code-version
获取Claude Code版本

### POST /admin/claude-code-version/clear
清除Claude Code版本缓存

---

## 🎯 Portal需要的核心API

根据Portal功能需求，以下是必须集成的核心API：

### 1. 认证相关
- ✅ POST /web/auth/login
- ✅ POST /web/auth/logout
- ✅ GET /web/auth/user
- ✅ POST /web/auth/refresh

### 2. API Key管理
- ✅ GET /admin/api-keys
- ✅ POST /admin/api-keys
- ✅ PUT /admin/api-keys/:keyId
- ✅ DELETE /admin/api-keys/:keyId
- ✅ GET /admin/api-keys/tags
- ⚠️ PATCH /admin/api-keys/:keyId/expiration (可选)

### 3. 统计和仪表板
- ✅ GET /admin/dashboard
- ✅ GET /admin/api-keys-usage-trend
- ⚠️ GET /admin/api-keys/:keyId/model-stats (P2功能)
- ⚠️ GET /admin/usage-stats (P2功能)
- ⚠️ GET /admin/model-stats (P2功能)

### 4. 公开统计（用户自查）
- ✅ POST /api/get-key-id
- ✅ POST /api/user-stats
- ⚠️ POST /api/user-model-stats (P2功能)
- ⚠️ POST /api/batch-stats (未来功能)

---

## 📝 注意事项

### 认证要求
- `/admin/*` 端点都需要 `authenticateAdmin` 中间件认证
- 需要在请求头中携带 `Authorization: Bearer <token>`
- Token通过 POST /web/auth/login 获取

### 请求格式
- 所有POST/PUT请求都使用 `Content-Type: application/json`
- GET请求参数通过URL参数或路径参数传递

### 响应格式
```json
{
  "success": true,
  "data": { /* 响应数据 */ }
}
```

或错误时：
```json
{
  "error": "错误类型",
  "message": "错误描述"
}
```

---

**文档生成时间**: 2025-10-08
**下一步**: 创建分组的API验证脚本
