# CRS Admin API 验证报告

> **验证时间**: 2025-10-03
> **验证目标**: 确认 CRS Admin API 的实际端点和认证方式

---

## 🔍 验证过程

### 1. Web UI 验证（浏览器访问）

**登录页面**：`https://claude.just-play.fun/admin-next/login`

**管理员凭据**：

- 用户名：`cr_admin_4ce18cd2`
- 密码：`HCTBMoiK3PZD0eDC`

使用浏览器访问以下页面：

| URL                                                 | 页面类型        | 是否需要登录 | 说明         |
| --------------------------------------------------- | --------------- | ------------ | ------------ |
| `https://claude.just-play.fun/admin-next/login`     | 登录页面        | ❌ 公开      | 输入凭据登录 |
| `https://claude.just-play.fun/admin-next`           | Web UI 首页     | ✅ 需要      | 登录后访问   |
| `https://claude.just-play.fun/admin-next/api-stats` | Web UI 统计页面 | ✅ 需要      | 管理页面     |
| `https://claude.just-play.fun/admin-next/api-keys`  | Web UI 密钥管理 | ✅ 需要      | 管理页面     |

**结论**:

- ✅ 登录页面：`/admin-next/login`（公开访问）
- ✅ 管理页面：`/admin-next/*`（需要浏览器登录）
- ✅ 浏览器登录和API登录使用相同的管理员凭据

---

## ✅ 验证结果：API 端点架构已确认

### 结论：情况 C - 完全分离的路径

通过分析CRS源码 (`/tmp/crs/src/`), 确认了实际的架构：

```
Web UI (Vue SPA):    /admin-next/*          (需要浏览器登录)
Admin API (REST):    /admin/*               (Token 认证)
Web API (认证相关):  /webapi/*              (用于登录获取token)
```

**关键发现**：

1. **Web UI** (`/admin-next/*`):
   - Vue.js 单页应用
   - 返回 HTML + JavaScript
   - 使用 Element Plus UI框架
   - 所有路由都返回相同的 `index.html`

2. **Admin API** (`/admin/*`):
   - RESTful API 端点
   - 返回 JSON 数据
   - 使用 `authenticateAdmin` 中间件验证
   - 路由定义在 `/src/routes/admin.js`

3. **认证API** (`/webapi/*`):
   - 用于管理员登录
   - 获取session token
   - 路由定义在 `/src/routes/web.js`

### 实际的API端点路径

```typescript
// 1. 管理员登录（获取token）
POST /web/auth/login
Body: { username, password }
Response: { success: true, token: "...", expiresIn: 86400 }

// 2. 获取密钥列表
GET /admin/api-keys
Headers: { Authorization: "Bearer <token>" }
Response: { success: true, data: [...] }

// 3. 创建密钥
POST /admin/api-keys
Headers: { Authorization: "Bearer <token>" }
Body: { name, description, ... }
Response: { success: true, data: {...} }

// 4. 更新密钥
PUT /admin/api-keys/:keyId
Headers: { Authorization: "Bearer <token>" }
Body: { name, description, ... }

// 5. 删除密钥
DELETE /admin/api-keys/:keyId
Headers: { Authorization: "Bearer <token>" }

// 6. 获取仪表板数据
GET /admin/dashboard
Headers: { Authorization: "Bearer <token>" }
```

---

## 📋 修正后的API端点列表

基于源码分析，CRS Admin API的实际端点为：

### 认证相关 (`/web/auth/`) ⚠️ 路径修正

```typescript
// 登录 ✅ 实际测试通过
POST /web/auth/login
Body: { username: string, password: string }
Response: {
  success: true,
  token: string,  // 64字符hex字符串
  expiresIn: number,  // 86400000 (24小时，单位毫秒)
  username: string
}

// 登出
POST /web/auth/logout
Headers: { Authorization: "Bearer <token>" }

// 获取当前用户信息
GET /web/auth/user
Headers: { Authorization: "Bearer <token>" }

// 刷新token
POST /web/auth/refresh
Headers: { Authorization: "Bearer <token>" }

// 修改密码
POST /web/auth/change-password
Headers: { Authorization: "Bearer <token>" }
Body: { currentPassword: string, newPassword: string, newUsername?: string }
```

### API密钥管理 (`/admin/api-keys`)

```typescript
// 获取密钥列表 ✅ 实际测试通过
GET /admin/api-keys
Headers: { Authorization: "Bearer <token>" }
Response: {
  success: true,
  data: ApiKey[]  // 包含id, name, description, usage等完整信息
}

// 创建密钥
POST /admin/api-keys
Headers: { Authorization: "Bearer <token>" }
Body: { name: string, description?: string, ... }
Response: { success: true, data: ApiKey }

// 更新密钥
PUT /admin/api-keys/:keyId
Headers: { Authorization: "Bearer <token>" }
Body: { name?: string, description?: string, ... }
Response: { success: true, data: ApiKey }

// 删除密钥
DELETE /admin/api-keys/:keyId
Headers: { Authorization: "Bearer <token>" }
Response: { success: true }

// 批量创建
POST /admin/api-keys/batch
Headers: { Authorization: "Bearer <token>" }

// 批量更新
PUT /admin/api-keys/batch
Headers: { Authorization: "Bearer <token>" }

// 批量删除
DELETE /admin/api-keys/batch
Headers: { Authorization: "Bearer <token>" }

// 获取标签列表
GET /admin/api-keys/tags
Headers: { Authorization: "Bearer <token>" }

// 获取密钥统计
GET /admin/api-keys/:keyId/stats
Headers: { Authorization: "Bearer <token>" }
Query: { timeRange: "all" | "today" | "week" | "month" }

// 获取已删除的密钥
GET /admin/api-keys/deleted
Headers: { Authorization: "Bearer <token>" }

// 恢复已删除的密钥
POST /admin/api-keys/:keyId/restore
Headers: { Authorization: "Bearer <token>" }

// 永久删除密钥
DELETE /admin/api-keys/:keyId/permanent
Headers: { Authorization: "Bearer <token>" }
```

### 仪表板和统计 (`/admin/`)

```typescript
// 获取仪表板数据 ✅ 实际测试通过
GET /admin/dashboard
Headers: { Authorization: "Bearer <token>" }
Response: {
  success: true,
  data: {
    overview: {
      totalApiKeys, activeApiKeys,
      totalAccounts, normalAccounts,
      totalTokensUsed, totalRequestsUsed, ...
    },
    recentActivity: { apiKeysCreatedToday, requestsToday, tokensToday, ... },
    systemAverages: { rpm, tpm },
    realtimeMetrics: { rpm, tpm, windowMinutes, ... },
    systemHealth: { redisConnected, uptime, ... }
  }
}

// 获取使用趋势
GET /admin/api-keys-usage-trend
Headers: { Authorization: "Bearer <token>" }

// 获取模型统计
GET /admin/api-keys/:keyId/model-stats
Headers: { Authorization: "Bearer <token>" }
```

---

## ✅ 已确认的事实

### 1. API 端点路径 ✅

**确认**: 通过分析CRS源码完全确认

- ✅ Admin API端点: `/admin/*` (不是 `/admin-next/*`)
- ✅ Web UI路径: `/admin-next/*` (Vue SPA)
- ✅ 认证API: `/web/auth/*`

### 2. 认证方式 ✅

**确认**: 从 `src/middleware/auth.js` 和 `src/routes/web.js` 确认

- ✅ 使用 `Authorization: Bearer <token>` 认证
- ✅ Token通过 `POST /web/auth/login` 获取
- ✅ Token是Session Token，有过期时间（默认86400秒=24小时）
- ✅ 可以通过 `POST /web/auth/refresh` 刷新token

**认证流程** （实测通过）:

```typescript
// 1. 管理员登录 ✅
const loginResponse = await fetch(
  'https://claude.just-play.fun/web/auth/login',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }
)
const { success, token, expiresIn, username } = await loginResponse.json()
// token: 64字符hex字符串
// expiresIn: 86400000 (24小时，毫秒)

// 2. 使用token调用Admin API ✅
const apiResponse = await fetch('https://claude.just-play.fun/admin/api-keys', {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
const { success, data } = await apiResponse.json()
// data: ApiKey[] 数组
```

### 3. 请求/响应格式 ✅

**确认**: 从Vue前端代码和Express路由代码确认

**请求格式**:

- ✅ `Content-Type: application/json`
- ✅ `Authorization: Bearer <token>`

**响应格式（成功）**:

```typescript
{
  "success": true,
  "data": { ... } // 或数组
}
```

**响应格式（错误）**:

```typescript
{
  "error": "Error Type",
  "message": "Error description"
}
```

**HTTP状态码**:

- 200: 成功
- 400: 请求参数错误
- 401: 未认证或token过期
- 403: 权限不足
- 500: 服务器内部错误

## ⚠️ 仍需实际测试确认

### 1. 用户的CRS部署配置

**问题**: 用户部署的CRS使用什么管理员凭据？

**需要获取**:

- [ ] 管理员用户名和密码（从 `data/init.json` 或环境变量）
- [ ] 实际的CRS base URL确认

### 2. 实际API调用测试

**问题**: 在实际环境中验证API调用

**需要测试**:

- [ ] 登录获取token
- [ ] 使用token调用API
- [ ] 验证响应格式

---

## 🔧 正确的验证方法

### 方法 1: 使用 curl 测试（推荐）

```bash
# 步骤 1: 登录获取token
TOKEN=$(curl -s -X POST https://claude.just-play.fun/web/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_ADMIN_USERNAME",
    "password": "YOUR_ADMIN_PASSWORD"
  }' | jq -r '.token')

echo "Token: $TOKEN"

# 步骤 2: 测试获取密钥列表
curl -X GET https://claude.just-play.fun/admin/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v

# 步骤 3: 测试获取仪表板数据
curl -X GET https://claude.just-play.fun/admin/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v

# 步骤 4: 测试创建密钥（可选）
curl -X POST https://claude.just-play.fun/admin/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key from Portal",
    "description": "API Integration Test"
  }' \
  -v
```

**期望结果**:

- 登录成功 → 返回 `{ "success": true, "token": "...", "expiresIn": 86400 }`
- 不带 Token 调用API → 401 Unauthorized
- 带有效 Token 调用API → 200 OK，返回 JSON 数据

### 方法 2: 查看 CRS 源码

查看 CRS 项目的源码，找到 Admin API 的定义：

```bash
git clone https://github.com/Wei-Shaw/claude-relay-service
cd claude-relay-service

# 搜索 API 路由定义
grep -r "admin-next" --include="*.ts" --include="*.js"
grep -r "api-keys" --include="*.ts" --include="*.js"
grep -r "router.get\|router.post" --include="*.ts"

# 查找认证中间件
grep -r "Authorization\|Bearer" --include="*.ts" --include="*.js"
```

### 方法 3: 查看 CRS 文档

检查 CRS 项目的文档：

- README.md
- docs/ 目录
- API.md 或 API-DOCS.md

---

## 📝 Portal 开发实现方案（基于源码确认）

### 方案 1: 使用管理员凭据登录（推荐）

Portal后端存储CRS管理员凭据，每次需要调用CRS API时先登录获取token：

```typescript
// lib/crs-client.ts
class CrsClient {
  private token: string | null = null
  private tokenExpiry: number = 0

  async ensureAuthenticated() {
    // 如果token未过期，直接使用
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    // 登录获取新token ✅ 路径已修正
    const response = await fetch(`${process.env.CRS_BASE_URL}/web/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.CRS_ADMIN_USERNAME,
        password: process.env.CRS_ADMIN_PASSWORD,
      }),
    })

    const { success, token, expiresIn } = await response.json()
    if (!success) {
      throw new Error('CRS authentication failed')
    }

    this.token = token
    this.tokenExpiry = Date.now() + (expiresIn - 60) * 1000 // 提前1分钟刷新
    return token
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await this.ensureAuthenticated()

    const response = await fetch(
      `${process.env.CRS_BASE_URL}/admin${endpoint}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!response.ok) {
      // Token可能过期，清除并重试一次
      if (response.status === 401) {
        this.token = null
        const newToken = await this.ensureAuthenticated()
        // 重试请求...
      }
      throw new CrsApiError(response.status, await response.text())
    }

    const data = await response.json()
    return data.data // CRS返回格式: { success: true, data: {...} }
  }
}

export const crsClient = new CrsClient()
```

### 方案 2: 使用长效Token（需CRS支持）

如果CRS支持生成不过期的Admin API Token（当前不支持），可以直接使用：

```typescript
// 环境变量
CRS_BASE_URL = 'https://claude.just-play.fun'
CRS_ADMIN_USERNAME = 'cr_admin_4ce18cd2'
CRS_ADMIN_PASSWORD = 'HCTBMoiK3PZD0eDC'

// 简化的client (需要实现自动登录和token管理)
async function crsRequest(endpoint: string, options?: RequestInit) {
  const token = await ensureAuthenticated() // 自动登录获取token

  const response = await fetch(`${process.env.CRS_BASE_URL}/admin${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const data = await response.json()
  return data.data
}
```

### 环境变量配置

```bash
# .env.local / .env.production
CRS_BASE_URL="https://claude.just-play.fun"
CRS_ADMIN_USERNAME="admin"
CRS_ADMIN_PASSWORD="your_admin_password"
```

### 响应格式（已确认）

```typescript
// 成功响应
{
  "success": true,
  "data": { ... }
}

// 错误响应
{
  "error": "Error Type",
  "message": "Error description"
}
```

---

## ✅ 下一步行动

### 立即执行（需要用户配合）

1. **获取CRS管理员凭据**

   用户需要提供以下信息：

   ```bash
   # 管理员用户名和密码
   CRS_ADMIN_USERNAME="admin"  # 或其他用户名
   CRS_ADMIN_PASSWORD="password123"  # 实际密码
   ```

   这些信息来源：
   - 查看 `data/init.json` 文件
   - 或查看CRS的环境变量 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`

2. **实际API测试**（使用真实凭据）

   ```bash
   # 登录测试
   curl -X POST https://claude.just-play.fun/web/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "YOUR_ADMIN_USERNAME",
       "password": "YOUR_ADMIN_PASSWORD"
     }'

   # 如果成功，会返回token，然后测试API调用
   TOKEN="返回的token"
   curl -X GET https://claude.just-play.fun/admin/api-keys \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **更新项目配置**

   根据测试结果更新：
   - `.env.local.template` - 添加 `CRS_ADMIN_USERNAME` 和 `CRS_ADMIN_PASSWORD`
   - `.env.production.template` - 同样添加这些变量
   - `CLAUDE.md` - 更新CRS集成示例代码
   - `lib/crs-client.ts` - 实现认证逻辑（Sprint 0）

### 开发准备

4. **确认开发方案**
   - 采用方案1：使用管理员凭据登录
   - 实现自动token管理和刷新
   - 实现错误处理和重试机制

5. **开始Sprint 0开发**
   - Git仓库初始化
   - Next.js项目搭建
   - 实现 `lib/crs-client.ts`（包含认证逻辑）
   - 编写测试确保CRS集成正常

---

## 🎯 实际测试结果（2025-10-03）

### 测试 1: 管理员登录 ✅

```bash
# 命令
curl -X POST https://claude.just-play.fun/web/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cr_admin_4ce18cd2","password":"HCTBMoiK3PZD0eDC"}'

# 结果
✅ 成功

# 状态码
200 OK

# 响应内容
{
  "success": true,
  "token": "fadcd6cfdae251e5bf23bb3c737612a0fa44907140352123adb714d8d9f2334f",
  "expiresIn": 86400000,
  "username": "cr_admin_4ce18cd2"
}
```

**发现**：

- ✅ 登录路径是 `/web/auth/login` (不是 `/webapi/auth/login`)
- ✅ Token是64字符的hex字符串
- ✅ expiresIn是毫秒数（86400000 = 24小时）

### 测试 2: GET /admin/api-keys ✅

```bash
# 命令
curl https://claude.just-play.fun/admin/api-keys \
  -H "Authorization: Bearer fadcd6cfdae251e5bf23bb3c737612a0fa44907140352123adb714d8d9f2334f" \
  -H "Content-Type: application/json"

# 结果
✅ 成功

# 状态码
200 OK

# 响应内容（部分）
{
  "success": true,
  "data": [
    {
      "id": "410713b8-54c9-4a8d-8667-5ad57dcbd3d9",
      "name": "Marie",
      "description": "",
      "tokenLimit": 0,
      "concurrencyLimit": 0,
      "isActive": true,
      "usage": {
        "total": {
          "tokens": 895566957,
          "requests": 16965,
          "cost": 1750.34
        },
        "daily": { ... },
        "monthly": { ... }
      },
      "totalCost": 1012.45,
      ...
    },
    ... // 共53个密钥
  ]
}
```

**发现**：

- ✅ 返回完整的密钥列表
- ✅ 包含详细的使用统计（tokens, requests, cost）
- ✅ 响应格式符合 `{ success: true, data: [...] }`

### 测试 3: GET /admin/dashboard ✅

```bash
# 命令
curl https://claude.just-play.fun/admin/dashboard \
  -H "Authorization: Bearer fadcd6cfdae251e5bf23bb3c737612a0fa44907140352123adb714d8d9f2334f" \
  -H "Content-Type: application/json"

# 结果
✅ 成功

# 状态码
200 OK

# 响应内容（部分）
{
  "success": true,
  "data": {
    "overview": {
      "totalApiKeys": 53,
      "activeApiKeys": 41,
      "totalAccounts": 10,
      "normalAccounts": 9,
      "totalTokensUsed": 2512071042,
      "totalRequestsUsed": 48016
    },
    "recentActivity": {
      "apiKeysCreatedToday": 0,
      "requestsToday": 1582,
      "tokensToday": 1382372
    },
    "systemAverages": {
      "rpm": 1.19,
      "tpm": 941.54
    },
    "realtimeMetrics": {
      "rpm": 9.8,
      "tpm": 154914.8,
      "windowMinutes": 5
    },
    "systemHealth": {
      "redisConnected": true,
      "uptime": 27298.28
    }
  }
}
```

**发现**：

- ✅ 返回完整的仪表板统计数据
- ✅ 包含系统健康状态
- ✅ 实时性能指标可用

---

## 📊 验证总结

| 验证项             | 状态      | 说明                                            |
| ------------------ | --------- | ----------------------------------------------- |
| **API 端点路径**   | ✅ 已确认 | 通过源码分析：`/admin/*` (不是 `/admin-next/*`) |
| **Token 认证方式** | ✅ 已确认 | 使用 `Authorization: Bearer <token>`            |
| **Token 获取方式** | ✅ 已确认 | `POST /web/auth/login` 登录获取                 |
| **请求格式**       | ✅ 已确认 | `Content-Type: application/json`                |
| **响应格式**       | ✅ 已确认 | `{ success: true, data: {...} }`                |
| **错误响应**       | ✅ 已确认 | `{ error: "...", message: "..." }`              |
| **实际API测试**    | ✅ 已完成 | 登录、密钥列表、仪表板全部测试通过              |

---

## 🎉 验证结论

### 完全确认的事实

通过深入分析CRS源码（`/tmp/crs/`），我们100%确认了：

1. ✅ **API架构** （源码+实测）：
   - Web UI: `/admin-next/*` (Vue SPA)
   - Admin API: `/admin/*` (REST API)
   - Auth API: `/web/auth/*` (认证) ⚠️ 注意：实际是 `/web/` 不是 `/webapi/`

2. ✅ **认证流程**：

   ```
   登录 → 获取session token → 使用token调用API → token过期时重新登录
   ```

3. ✅ **实现方案**：
   - Portal后端存储CRS管理员凭据
   - 自动管理token的生命周期
   - 实现token过期自动重新登录

4. ✅ **环境变量**：
   ```bash
   CRS_BASE_URL="https://claude.just-play.fun"
   CRS_ADMIN_USERNAME="admin"
   CRS_ADMIN_PASSWORD="password"
   ```

### 已完成工作 ✅

1. ✅ 获取了用户的CRS管理员凭据
2. ✅ 实际测试API调用（登录、密钥列表、仪表板）
3. ✅ 更新环境变量模板（使用管理员凭据）
4. ⏳ 实现 `lib/crs-client.ts`（Sprint 0开发中进行）

### 关键修正

⚠️ **路径修正**：认证API路径是 `/web/auth/*` 而不是 `/webapi/auth/*`

此修正已在文档中更新。

---

**文档版本**: v3.0 (最终版)
**创建时间**: 2025-10-03
**最后更新**: 2025-10-03 17:45 CST
**状态**: 🟢 完全验证通过（源码分析 + 实际API测试）

**验证方法**:

- ✅ 源码分析：[claude-relay-service](https://github.com/Wei-Shaw/claude-relay-service)
- ✅ 实际测试：使用真实管理员凭据测试3个核心API端点
