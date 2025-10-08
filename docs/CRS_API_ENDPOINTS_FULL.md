# CRS API 端点完整清单

> **来源**: claude-relay-service 源码分析
> **更新时间**: 2025-10-08
> **状态**: 待验证

---

## 📊 统计和分析 API（P2核心）

### Dashboard 和概览

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/dashboard` | GET | 仪表板数据（概览统计） | ✅ 已验证 |
| `/admin/usage-stats` | GET | 使用统计 | ⏳ 待验证 |
| `/admin/model-stats` | GET | 模型统计 | ⏳ 待验证 |
| `/admin/usage-costs` | GET | 使用费用统计 | ⏳ 待验证 |

### 趋势分析

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/usage-trend` | GET | 使用趋势（总体） | ⏳ 待验证 |
| `/admin/api-keys-usage-trend` | GET | 密钥使用趋势（7天） | ✅ 已验证 |
| `/admin/account-usage-trend` | GET | 账户使用趋势 | ⏳ 待验证 |

### 密钥统计

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/api-keys` | GET | 密钥列表（含统计） | ✅ 已验证 |
| `/admin/api-keys/:keyId/model-stats` | GET | 单个密钥的模型统计 | ⏳ 待验证 |
| `/admin/api-keys/:keyId/cost-debug` | GET | 密钥费用调试信息 | ⏳ 待验证 |

### 账户统计

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/accounts/usage-stats` | GET | 所有账户使用统计 | ⏳ 待验证 |
| `/admin/accounts/:accountId/usage-stats` | GET | 单个账户使用统计 | ⏳ 待验证 |
| `/admin/accounts/:accountId/usage-history` | GET | 账户使用历史 | ⏳ 待验证 |
| `/admin/claude-accounts/usage` | GET | Claude账户使用情况 | ⏳ 待验证 |
| `/admin/claude-console-accounts/:accountId/usage` | GET | Console账户使用 | ⏳ 待验证 |
| `/admin/ccr-accounts/:accountId/usage` | GET | CCR账户使用 | ⏳ 待验证 |

---

## 🔑 密钥管理 API

### 密钥 CRUD

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/api-keys` | GET | 获取密钥列表 | ✅ 已验证 |
| `/admin/api-keys` | POST | 创建密钥 | ⏳ 待验证 |
| `/admin/api-keys/:keyId` | PUT | 更新密钥 | ⏳ 待验证 |
| `/admin/api-keys/:keyId` | DELETE | 删除密钥 | ⏳ 待验证 |
| `/admin/api-keys/:keyId/expiration` | PATCH | 更新过期设置 | ⏳ 待验证 |

### 批量操作

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/api-keys/batch` | POST | 批量创建密钥 | ⏳ 待验证 |
| `/admin/api-keys/batch` | PUT | 批量更新密钥 | ⏳ 待验证 |
| `/admin/api-keys/batch` | DELETE | 批量删除密钥 | ⏳ 待验证 |

### 密钥恢复

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/api-keys/deleted` | GET | 获取已删除密钥 | ⏳ 待验证 |
| `/admin/api-keys/:keyId/restore` | POST | 恢复已删除密钥 | ⏳ 待验证 |
| `/admin/api-keys/:keyId/permanent` | DELETE | 永久删除密钥 | ⏳ 待验证 |
| `/admin/api-keys/deleted/clear-all` | DELETE | 清空回收站 | ⏳ 待验证 |

### 其他

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/api-keys/tags` | GET | 获取所有标签 | ⏳ 待验证 |
| `/admin/supported-clients` | GET | 获取支持的客户端 | ⏳ 待验证 |

---

## 👥 用户管理 API

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/users` | GET | 获取用户列表 | ⏳ 待验证 |

---

## 🏢 账户组管理 API

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/account-groups` | GET | 获取账户组列表 | ⏳ 待验证 |
| `/admin/account-groups` | POST | 创建账户组 | ⏳ 待验证 |
| `/admin/account-groups/:groupId` | GET | 获取账户组详情 | ⏳ 待验证 |
| `/admin/account-groups/:groupId` | PUT | 更新账户组 | ⏳ 待验证 |
| `/admin/account-groups/:groupId` | DELETE | 删除账户组 | ⏳ 待验证 |
| `/admin/account-groups/:groupId/members` | GET | 获取账户组成员 | ⏳ 待验证 |

---

## 🔐 认证 API

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/web/auth/login` | POST | 管理员登录 | ✅ 已验证 |
| `/web/auth/logout` | POST | 管理员登出 | ⏳ 待验证 |
| `/web/auth/user` | GET | 获取当前用户 | ⏳ 待验证 |
| `/web/auth/refresh` | POST | 刷新Token | ⏳ 待验证 |
| `/web/auth/change-password` | POST | 修改密码 | ⏳ 待验证 |

---

## 🤖 Claude 账户管理 API

### OAuth 流程

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/claude-accounts/generate-auth-url` | POST | 生成OAuth URL | ⏳ 待验证 |
| `/admin/claude-accounts/exchange-code` | POST | 交换授权码 | ⏳ 待验证 |
| `/admin/claude-accounts/generate-setup-token-url` | POST | 生成Setup Token URL | ⏳ 待验证 |
| `/admin/claude-accounts/exchange-setup-token-code` | POST | 交换Setup Token | ⏳ 待验证 |

### CRUD

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/claude-accounts` | GET | 获取Claude账户列表 | ⏳ 待验证 |
| `/admin/claude-accounts` | POST | 创建Claude账户 | ⏳ 待验证 |
| `/admin/claude-accounts/:accountId` | PUT | 更新Claude账户 | ⏳ 待验证 |
| `/admin/claude-accounts/:accountId` | DELETE | 删除Claude账户 | ⏳ 待验证 |

### 账户操作

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/claude-accounts/:accountId/update-profile` | POST | 更新账户信息 | ⏳ 待验证 |
| `/admin/claude-accounts/update-all-profiles` | POST | 批量更新账户信息 | ⏳ 待验证 |
| `/admin/claude-accounts/:accountId/refresh` | POST | 刷新账户 | ⏳ 待验证 |
| `/admin/claude-accounts/:accountId/reset-status` | POST | 重置状态 | ⏳ 待验证 |

---

## 🎮 Claude Console 账户 API

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/claude-console-accounts` | GET | 获取列表 | ⏳ 待验证 |
| `/admin/claude-console-accounts` | POST | 创建账户 | ⏳ 待验证 |
| `/admin/claude-console-accounts/:accountId` | PUT | 更新账户 | ⏳ 待验证 |
| `/admin/claude-console-accounts/:accountId` | DELETE | 删除账户 | ⏳ 待验证 |
| `/admin/claude-console-accounts/:accountId/toggle` | PUT | 切换状态 | ⏳ 待验证 |
| `/admin/claude-console-accounts/reset-all-usage` | POST | 重置所有使用量 | ⏳ 待验证 |

---

## 🌐 其他平台账户 API

### Gemini 账户

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/gemini-accounts/generate-auth-url` | POST | 生成OAuth URL | ⏳ 待验证 |
| `/admin/gemini-accounts/poll-auth-status` | POST | 轮询授权状态 | ⏳ 待验证 |
| `/admin/gemini-accounts/exchange-code` | POST | 交换授权码 | ⏳ 待验证 |
| `/admin/gemini-accounts` | GET | 获取列表 | ⏳ 待验证 |
| `/admin/gemini-accounts` | POST | 创建账户 | ⏳ 待验证 |
| `/admin/gemini-accounts/:accountId` | PUT | 更新账户 | ⏳ 待验证 |
| `/admin/gemini-accounts/:accountId` | DELETE | 删除账户 | ⏳ 待验证 |
| `/admin/gemini-accounts/:accountId/refresh` | POST | 刷新账户 | ⏳ 待验证 |

### CCR 账户

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/ccr-accounts` | GET | 获取列表 | ⏳ 待验证 |
| `/admin/ccr-accounts` | POST | 创建账户 | ⏳ 待验证 |
| `/admin/ccr-accounts/:accountId` | PUT | 更新账户 | ⏳ 待验证 |
| `/admin/ccr-accounts/:accountId` | DELETE | 删除账户 | ⏳ 待验证 |
| `/admin/ccr-accounts/:accountId/toggle` | PUT | 切换状态 | ⏳ 待验证 |
| `/admin/ccr-accounts/:accountId/toggle-schedulable` | PUT | 切换可调度状态 | ⏳ 待验证 |
| `/admin/ccr-accounts/:accountId/reset-usage` | POST | 重置使用量 | ⏳ 待验证 |
| `/admin/ccr-accounts/:accountId/reset-status` | POST | 重置状态 | ⏳ 待验证 |
| `/admin/ccr-accounts/reset-all-usage` | POST | 重置所有使用量 | ⏳ 待验证 |

### Bedrock 账户

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/bedrock-accounts` | GET | 获取列表 | ⏳ 待验证 |
| `/admin/bedrock-accounts` | POST | 创建账户 | ⏳ 待验证 |
| `/admin/bedrock-accounts/:accountId` | PUT | 更新账户 | ⏳ 待验证 |
| `/admin/bedrock-accounts/:accountId` | DELETE | 删除账户 | ⏳ 待验证 |
| `/admin/bedrock-accounts/:accountId/toggle` | PUT | 切换状态 | ⏳ 待验证 |
| `/admin/bedrock-accounts/:accountId/test` | POST | 测试连接 | ⏳ 待验证 |

---

## 🔧 系统管理 API

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/admin/cleanup` | POST | 清理过期数据 | ⏳ 待验证 |
| `/admin/claude-code-headers` | GET | 获取Claude Code请求头 | ⏳ 待验证 |
| `/admin/claude-code-headers/:accountId` | DELETE | 删除请求头 | ⏳ 待验证 |

---

## 📈 ApiStats API (用户级统计)

| 端点 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/apiStats/api/get-key-id` | POST | 获取密钥ID | ⏳ 待验证 |
| `/apiStats/api/user-stats` | POST | 用户统计 | ⏳ 待验证 |
| `/apiStats/api/batch-stats` | POST | 批量统计 | ⏳ 待验证 |
| `/apiStats/api/batch-model-stats` | POST | 批量模型统计 | ⏳ 待验证 |
| `/apiStats/api/user-model-stats` | POST | 用户模型统计 | ⏳ 待验证 |

---

## 📊 统计数据总结

### 已发现的核心统计端点（P2高价值）

1. **Dashboard**: `/admin/dashboard` ✅
2. **使用趋势**: `/admin/api-keys-usage-trend` ✅
3. **使用统计**: `/admin/usage-stats` ⭐ 新发现
4. **模型统计**: `/admin/model-stats` ⭐ 新发现
5. **费用统计**: `/admin/usage-costs` ⭐ 新发现
6. **总体趋势**: `/admin/usage-trend` ⭐ 新发现
7. **账户趋势**: `/admin/account-usage-trend` ⭐ 新发现
8. **密钥模型统计**: `/admin/api-keys/:keyId/model-stats` ⭐ 新发现
9. **账户统计**: `/admin/accounts/usage-stats` ⭐ 新发现
10. **账户历史**: `/admin/accounts/:accountId/usage-history` ⭐ 新发现

### 优先验证列表

**第一批**（基础 + Dashboard）:
- `/web/auth/login` ✅
- `/admin/dashboard` ✅
- `/admin/api-keys` ✅

**第二批**（核心统计）:
- `/admin/usage-stats`
- `/admin/model-stats`
- `/admin/usage-costs`
- `/admin/usage-trend`

**第三批**（趋势和历史）:
- `/admin/account-usage-trend`
- `/admin/api-keys/:keyId/model-stats`
- `/admin/accounts/usage-stats`
- `/admin/accounts/:accountId/usage-history`

**第四批**（密钥管理）:
- `/admin/api-keys` POST
- `/admin/api-keys/:keyId` PUT
- `/admin/api-keys/:keyId` DELETE
- `/admin/api-keys/tags`

---

**总端点数**: 120+
**已验证**: 3
**待验证**: 117+
**P2核心**: 10个统计端点

**下一步**: 创建分组验证脚本
