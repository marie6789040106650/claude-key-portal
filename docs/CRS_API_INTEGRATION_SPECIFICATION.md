# CRS API 对接规范

> **创建时间**: 2025-10-09
> **基于版本**: CRS v1.x
> **验证状态**: ✅ 已完整验证
> **测试报告**: `CRS_INTEGRATION_TEST_REPORT.json`

---

## 📋 目录

- [1. 概述](#1-概述)
- [2. 认证流程](#2-认证流程)
- [3. API密钥管理](#3-api密钥管理)
- [4. 统计查询](#4-统计查询)
- [5. 错误处理](#5-错误处理)
- [6. 最佳实践](#6-最佳实践)

---

## 1. 概述

### 1.1 集成架构

```
Claude Key Portal (本地)
    ↓
    ├─→ CRS Admin API (管理API)
    │   - 认证获取token
    │   - 创建/更新/删除API Key
    │   - 管理员操作
    │
    └─→ CRS Public Stats API (公开统计API)
        - 查询密钥统计
        - 查询模型使用
        - 用户自助查询
```

### 1.2 CRS服务信息

| 项目 | 值 |
|------|-----|
| **生产地址** | https://claude.just-play.fun |
| **Admin API基础路径** | `/admin` |
| **Public Stats API基础路径** | `/apiStats/api` |
| **认证API基础路径** | `/web/auth` |

### 1.3 验证结果

| API类别 | 端点数 | 成功率 | 平均响应时间 |
|---------|--------|--------|-------------|
| 认证API | 4 | 100% | ~2000ms (首次) |
| Admin API | 9+ | 100% | ~700ms |
| Public Stats API | 5 | 100% | ~450ms |

---

## 2. 认证流程

### 2.1 管理员登录

**端点**: `POST /web/auth/login`

**用途**: 获取Admin API的Bearer token

**请求格式**:

```typescript
interface LoginRequest {
  username: string  // Admin用户名
  password: string  // Admin密码
}
```

**请求示例**:

```bash
curl -X POST https://claude.just-play.fun/web/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cr_admin_4ce18cd2",
    "password": "HCTBMoiK3PZD0eDC"
  }'
```

**响应格式**:

```typescript
interface LoginResponse {
  success: boolean
  token: string      // JWT token (64字符)
  expiresIn: number  // 过期时间（毫秒，默认24小时=86400000）
  username: string   // 用户名确认
}
```

**成功响应示例**:

```json
{
  "success": true,
  "token": "ea856b890cbc22ca08ae4b2c97f3989ae2af2a2be119f2bd534c1680c3948758",
  "expiresIn": 86400000,
  "username": "cr_admin_4ce18cd2"
}
```

**使用Token**:

```typescript
// 后续Admin API请求都需要在header中携带
headers: {
  "Authorization": `Bearer ${token}`
}
```

**注意事项**:

1. ✅ Token有效期24小时，需要定期刷新或重新登录
2. ✅ Token存储建议使用httpOnly cookie或加密存储
3. ⚠️ 不要在前端明文存储token

---

## 3. API密钥管理

### 3.1 创建API Key

**端点**: `POST /admin/api-keys`

**认证**: 需要Bearer token

**请求格式**:

```typescript
interface CreateApiKeyRequest {
  // 必填字段
  name: string                    // 密钥名称（1-100字符）

  // 可选字段 - 基本信息
  description?: string            // 描述（0-500字符）
  tokenLimit?: number | null      // Token限制（null=无限制）
  expiresAt?: string | null       // 过期时间（ISO格式或null）

  // 可选字段 - 权限
  permissions?: string[]          // 权限数组 ["claude", "gemini", "openai"]

  // 可选字段 - 限流
  concurrencyLimit?: number       // 并发限制（0=无限制）
  rateLimitWindow?: number        // 速率限制窗口（分钟）
  rateLimitRequests?: number      // 窗口内请求数限制
  rateLimitCost?: number          // 窗口内费用限制

  // 可选字段 - 模型限制
  enableModelRestriction?: boolean
  restrictedModels?: string[]

  // 可选字段 - 客户端限制
  enableClientRestriction?: boolean
  allowedClients?: string[]

  // 可选字段 - 费用限制
  dailyCostLimit?: number         // 每日费用限制（美元）
  totalCostLimit?: number         // 总费用限制（美元）
  weeklyOpusCostLimit?: number    // 每周Opus费用限制

  // 可选字段 - 标签和元数据
  tags?: string[]                 // 标签数组
  icon?: string                   // 图标

  // 可选字段 - 激活模式
  expirationMode?: 'fixed' | 'activation'
  activationDays?: number         // 激活后有效天数
  activationUnit?: 'hours' | 'days'
}
```

**最简请求示例**:

```json
{
  "name": "My Portal Key",
  "description": "Portal用户的API密钥",
  "permissions": ["claude"]
}
```

**完整请求示例**:

```json
{
  "name": "Portal-User-123",
  "description": "用户ID 123的API密钥",
  "tokenLimit": null,
  "expiresAt": null,
  "permissions": ["claude"],
  "concurrencyLimit": 5,
  "rateLimitWindow": 60,
  "rateLimitRequests": 100,
  "dailyCostLimit": 10.0,
  "totalCostLimit": 100.0,
  "tags": ["portal", "user-123"],
  "expirationMode": "activation",
  "activationDays": 30,
  "activationUnit": "days"
}
```

**响应格式**:

```typescript
interface CreateApiKeyResponse {
  success: boolean
  data: {
    // 核心字段
    id: string                      // UUID格式的密钥ID
    apiKey: string                  // 实际的API密钥（cr_开头）
    name: string
    description: string

    // 限制字段
    tokenLimit: number              // 0表示无限制
    concurrencyLimit: number
    rateLimitWindow: number
    rateLimitRequests: number
    rateLimitCost: number

    // 状态字段
    isActive: boolean               // 是否激活
    isActivated: boolean            // 是否已被激活使用
    activatedAt: string             // 激活时间（ISO格式）
    createdAt: string               // 创建时间（ISO格式）
    expiresAt: string               // 过期时间（空字符串表示永不过期）

    // 账户关联
    claudeAccountId: string
    geminiAccountId: string
    openaiAccountId: string
    azureOpenaiAccountId: string
    bedrockAccountId: string

    // 权限和限制
    permissions: string[]
    enableModelRestriction: boolean
    restrictedModels: string[]
    enableClientRestriction: boolean
    allowedClients: string[]

    // 费用限制
    dailyCostLimit: number
    totalCostLimit: number
    weeklyOpusCostLimit: number

    // 元数据
    tags: string[]
    activationDays: number
    activationUnit: string
    expirationMode: string
    createdBy: string               // 创建者（"admin"）
  }
}
```

**成功响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "fbb20fe2-2dae-42ce-9061-5786a4aa5067",
    "apiKey": "cr_7183f5b1628102bf1cdfc8d3cfb71e87895f07f451b62690af7f47586b7e3c65",
    "name": "Portal-User-123",
    "description": "用户ID 123的API密钥",
    "tokenLimit": 0,
    "concurrencyLimit": 0,
    "rateLimitWindow": 0,
    "rateLimitRequests": 0,
    "rateLimitCost": 0,
    "isActive": true,
    "claudeAccountId": "",
    "geminiAccountId": "",
    "openaiAccountId": "",
    "azureOpenaiAccountId": "",
    "bedrockAccountId": "",
    "permissions": ["claude"],
    "enableModelRestriction": false,
    "restrictedModels": [],
    "enableClientRestriction": false,
    "allowedClients": [],
    "dailyCostLimit": 0,
    "totalCostLimit": 0,
    "weeklyOpusCostLimit": 0,
    "tags": ["portal", "user-123"],
    "activationDays": 0,
    "activationUnit": "days",
    "expirationMode": "fixed",
    "isActivated": true,
    "activatedAt": "2025-10-09T14:17:21.944Z",
    "createdAt": "2025-10-09T14:17:21.944Z",
    "expiresAt": "",
    "createdBy": "admin"
  }
}
```

**Portal集成建议**:

1. **保存映射关系**:
   ```typescript
   await prisma.apiKey.create({
     data: {
       userId: user.id,
       crsKeyId: response.data.id,        // CRS的UUID
       crsKey: response.data.apiKey,      // 实际的API key
       name: response.data.name,
       // ... 其他字段
     }
   })
   ```

2. **默认配置**:
   - `permissions: ["claude"]` - 只需要Claude权限
   - `tokenLimit: null` - 不限制token
   - `expiresAt: null` - 永不过期
   - `tags: ["portal", `user-${userId}`]` - 便于识别

### 3.2 删除API Key

**端点**: `DELETE /admin/api-keys/:keyId`

**认证**: 需要Bearer token

**路径参数**:
- `keyId`: API Key的UUID（创建时返回的`id`字段）

**请求示例**:

```bash
curl -X DELETE https://claude.just-play.fun/admin/api-keys/fbb20fe2-2dae-42ce-9061-5786a4aa5067 \
  -H "Authorization: Bearer ${token}"
```

**响应格式**:

```typescript
interface DeleteApiKeyResponse {
  success: boolean
  message: string
}
```

**成功响应示例**:

```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

---

## 4. 统计查询

### 4.1 获取Key ID

**端点**: `POST /apiStats/api/get-key-id`

**认证**: 需要API Key（不是Bearer token）

**用途**: 将API key转换为key ID，用于后续查询

**请求格式**:

```typescript
interface GetKeyIdRequest {
  apiKey: string  // 实际的API密钥（cr_开头）
}
```

**请求示例**:

```json
{
  "apiKey": "cr_7183f5b1628102bf1cdfc8d3cfb71e87895f07f451b62690af7f47586b7e3c65"
}
```

**响应格式**:

```typescript
interface GetKeyIdResponse {
  success: boolean
  data: {
    id: string  // Key的UUID
  }
}
```

**成功响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "fbb20fe2-2dae-42ce-9061-5786a4aa5067"
  }
}
```

**Portal集成建议**:

由于创建API Key时已经返回了`id`，通常不需要调用此接口。此接口主要用于：
- 用户只有API key但不知道ID的场景
- 验证API key有效性

### 4.2 查询用户统计

**端点**: `POST /apiStats/api/user-stats`

**认证**: 需要apiKey或apiId

**请求格式**:

```typescript
interface UserStatsRequest {
  apiKey?: string  // 方式1：使用API key
  apiId?: string   // 方式2：使用key ID（推荐）
}
```

**请求示例（使用apiId）**:

```json
{
  "apiId": "fbb20fe2-2dae-42ce-9061-5786a4aa5067"
}
```

**响应格式**:

```typescript
interface UserStatsResponse {
  success: boolean
  data: {
    // 基本信息
    id: string
    name: string
    description: string
    isActive: boolean
    createdAt: string
    expiresAt: string
    expirationMode: string
    isActivated: boolean
    activationDays: number
    activatedAt: string
    permissions: string

    // 使用统计
    usage: {
      total: {
        tokens: number           // 总tokens（已废弃，使用allTokens）
        inputTokens: number      // 输入tokens
        outputTokens: number     // 输出tokens
        cacheCreateTokens: number // 缓存创建tokens
        cacheReadTokens: number   // 缓存读取tokens
        allTokens: number        // 所有tokens总和
        requests: number         // 请求次数
        cost: number             // 费用（美元）
        formattedCost: string    // 格式化费用（如"$0.000000"）
      }
    }

    // 限制信息
    limits: {
      tokenLimit: number
      concurrencyLimit: number
      rateLimitWindow: number
      rateLimitRequests: number
      rateLimitCost: number
      dailyCostLimit: number
      totalCostLimit: number
      weeklyOpusCostLimit: number

      // 当前窗口状态
      currentWindowRequests: number
      currentWindowTokens: number
      currentWindowCost: number
      currentDailyCost: number
      currentTotalCost: number
      weeklyOpusCost: number

      // 窗口时间
      windowStartTime: string | null
      windowEndTime: string | null
      windowRemainingSeconds: number | null
    }

    // 账户信息
    accounts: {
      claudeAccountId: string | null
      geminiAccountId: string | null
      openaiAccountId: string | null
      details: any | null
    }

    // 限制配置
    restrictions: {
      enableModelRestriction: boolean
      restrictedModels: string[]
      enableClientRestriction: boolean
      allowedClients: string[]
    }
  }
}
```

**成功响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "fbb20fe2-2dae-42ce-9061-5786a4aa5067",
    "name": "Portal-Integration-Test-1760019441405",
    "description": "Portal API集成测试用密钥",
    "isActive": true,
    "createdAt": "2025-10-09T14:17:21.944Z",
    "expiresAt": "",
    "expirationMode": "fixed",
    "isActivated": true,
    "activationDays": 0,
    "activatedAt": "2025-10-09T14:17:21.944Z",
    "permissions": "claude",
    "usage": {
      "total": {
        "tokens": 0,
        "inputTokens": 0,
        "outputTokens": 0,
        "cacheCreateTokens": 0,
        "cacheReadTokens": 0,
        "allTokens": 0,
        "requests": 0,
        "cost": 0,
        "formattedCost": "$0.000000"
      }
    },
    "limits": {
      "tokenLimit": 0,
      "concurrencyLimit": 0,
      "rateLimitWindow": 0,
      "rateLimitRequests": 0,
      "rateLimitCost": 0,
      "dailyCostLimit": 0,
      "totalCostLimit": 0,
      "weeklyOpusCostLimit": 0,
      "currentWindowRequests": 0,
      "currentWindowTokens": 0,
      "currentWindowCost": 0,
      "currentDailyCost": 0,
      "currentTotalCost": 0,
      "weeklyOpusCost": 0,
      "windowStartTime": null,
      "windowEndTime": null,
      "windowRemainingSeconds": null
    },
    "accounts": {
      "claudeAccountId": null,
      "geminiAccountId": null,
      "openaiAccountId": null,
      "details": null
    },
    "restrictions": {
      "enableModelRestriction": false,
      "restrictedModels": [],
      "enableClientRestriction": false,
      "allowedClients": []
    }
  }
}
```

**Portal集成建议**:

1. **缓存统计数据**:
   ```typescript
   // 缓存1分钟
   const cacheKey = `stats:${apiId}`
   const cached = await redis.get(cacheKey)
   if (cached) return JSON.parse(cached)

   const stats = await fetchCrsStats(apiId)
   await redis.setex(cacheKey, 60, JSON.stringify(stats))
   return stats
   ```

2. **显示关键指标**:
   - `usage.total.requests` - 总请求数
   - `usage.total.allTokens` - 总token数
   - `usage.total.formattedCost` - 总费用
   - `limits.currentDailyCost` - 今日费用

### 4.3 查询模型统计

**端点**: `POST /apiStats/api/user-model-stats`

**请求格式**:

```typescript
interface UserModelStatsRequest {
  apiId: string                    // Key ID
  period: 'daily' | 'monthly'      // 统计周期
}
```

**请求示例**:

```json
{
  "apiId": "fbb20fe2-2dae-42ce-9061-5786a4aa5067",
  "period": "daily"
}
```

**响应格式**:

```typescript
interface UserModelStatsResponse {
  success: boolean
  data: Array<{
    model: string                // 模型名称
    requests: number             // 请求次数
    inputTokens: number          // 输入tokens
    outputTokens: number         // 输出tokens
    cacheCreateTokens: number    // 缓存创建tokens
    cacheReadTokens: number      // 缓存读取tokens
    allTokens: number            // 所有tokens
    cost: number                 // 费用
    formatted?: {                // 格式化费用
      input?: string
      output?: string
      cacheCreate?: string
      cacheRead?: string
      total?: string
    }
  }>
  period: string                 // 返回的周期
}
```

**成功响应示例**（有数据）:

```json
{
  "success": true,
  "data": [
    {
      "model": "claude-3-5-sonnet-20241022",
      "requests": 25,
      "inputTokens": 15420,
      "outputTokens": 3210,
      "cacheCreateTokens": 0,
      "cacheReadTokens": 0,
      "allTokens": 18630,
      "cost": 0.0612,
      "formatted": {
        "input": "$0.046260",
        "output": "$0.014940",
        "cacheCreate": "$0.000000",
        "cacheRead": "$0.000000",
        "total": "$0.061200"
      }
    }
  ],
  "period": "daily"
}
```

**成功响应示例**（无数据）:

```json
{
  "success": true,
  "data": [],
  "period": "daily"
}
```

---

## 5. 错误处理

### 5.1 常见HTTP状态码

| 状态码 | 说明 | 场景 |
|--------|------|------|
| 200 | 成功 | 正常响应 |
| 400 | 请求错误 | 参数验证失败 |
| 401 | 未认证 | Token无效或过期 |
| 403 | 无权限 | 非管理员访问Admin API |
| 404 | 不存在 | 资源不存在 |
| 500 | 服务器错误 | CRS内部错误 |

### 5.2 错误响应格式

```typescript
interface ErrorResponse {
  success: false
  error: string        // 错误类型
  message: string      // 错误详细信息
}
```

**示例**:

```json
{
  "success": false,
  "error": "Invalid API key",
  "message": "API key is disabled"
}
```

### 5.3 Portal错误处理策略

```typescript
try {
  const response = await fetch(crsUrl, options)
  const data = await response.json()

  if (!response.ok) {
    // HTTP错误
    if (response.status === 401) {
      // Token过期，重新登录
      return Result.fail(new CrsAuthError('Token expired'))
    }

    if (response.status === 503) {
      // 服务不可用，使用缓存
      return Result.ok(getCachedData())
    }

    return Result.fail(new CrsApiError(data.error, data.message))
  }

  if (!data.success) {
    // 业务错误
    return Result.fail(new CrsApiError(data.error, data.message))
  }

  return Result.ok(data.data)

} catch (error) {
  // 网络错误
  if (error.name === 'AbortError') {
    return Result.fail(new CrsTimeoutError())
  }
  return Result.fail(new CrsUnavailableError())
}
```

---

## 6. 最佳实践

### 6.1 认证管理

**Token缓存策略**:

```typescript
class CrsClient {
  private token: string | null = null
  private tokenExpiry: number = 0

  async getToken(): Promise<string> {
    // 提前5分钟刷新
    if (this.token && Date.now() < this.tokenExpiry - 300000) {
      return this.token
    }

    // 重新登录
    const { token, expiresIn } = await this.login()
    this.token = token
    this.tokenExpiry = Date.now() + expiresIn

    return token
  }
}
```

### 6.2 请求频率控制

```typescript
// 最小请求间隔500ms
const MIN_REQUEST_INTERVAL = 500

let lastRequestTime = 0

async function callCrsApi(url: string, options: any) {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest)
  }

  lastRequestTime = Date.now()
  return fetch(url, options)
}
```

### 6.3 数据缓存

```typescript
// 统计数据缓存1分钟
const STATS_CACHE_TTL = 60

async function getUserStats(apiId: string) {
  const cacheKey = `crs:stats:${apiId}`

  // 尝试从缓存获取
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // 从CRS获取
  const stats = await crsClient.getUserStats(apiId)

  // 缓存结果
  await redis.setex(cacheKey, STATS_CACHE_TTL, JSON.stringify(stats))

  return stats
}
```

### 6.4 错误监控

```typescript
// 记录CRS API错误
async function callCrsApi(endpoint: string, options: any) {
  const startTime = Date.now()

  try {
    const response = await fetch(endpoint, options)
    const responseTime = Date.now() - startTime

    // 记录慢请求
    if (responseTime > 3000) {
      logger.warn('Slow CRS API request', {
        endpoint,
        responseTime,
      })
    }

    return response
  } catch (error) {
    // 记录错误
    logger.error('CRS API request failed', {
      endpoint,
      error: error.message,
      responseTime: Date.now() - startTime,
    })

    throw error
  }
}
```

### 6.5 降级策略

```typescript
async function getUserStatsWithFallback(apiId: string) {
  try {
    // 设置5秒超时
    const stats = await Promise.race([
      crsClient.getUserStats(apiId),
      sleep(5000).then(() => Promise.reject(new TimeoutError()))
    ])

    return Result.ok(stats)

  } catch (error) {
    // 降级：返回缓存数据
    const cached = await getCachedStats(apiId)
    if (cached) {
      return Result.ok(cached, { fromCache: true })
    }

    // 降级：返回空数据
    return Result.ok({
      usage: { total: { requests: 0, allTokens: 0, cost: 0 } },
      limits: {}
    }, { degraded: true })
  }
}
```

---

## 附录

### A. 完整的请求/响应示例

详见 `CRS_INTEGRATION_TEST_REPORT.json`

### B. TypeScript类型定义

```typescript
// docs/types/crs-api.d.ts
export interface CrsApiKeyData {
  id: string
  apiKey: string
  name: string
  description: string
  // ... 完整类型定义
}

export interface CrsUserStats {
  id: string
  name: string
  usage: {
    total: {
      requests: number
      allTokens: number
      cost: number
      formattedCost: string
    }
  }
  limits: {
    // ... 完整类型定义
  }
}
```

### C. 错误代码表

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| `Invalid API key` | API key无效或已禁用 | 检查key是否正确，是否被禁用 |
| `Token expired` | Token已过期 | 重新登录获取新token |
| `Rate limit exceeded` | 超过速率限制 | 等待窗口重置或降低请求频率 |
| `Insufficient permissions` | 权限不足 | 检查API key权限配置 |

---

**文档版本**: v1.0
**最后更新**: 2025-10-09
**维护者**: Claude Key Portal Team
