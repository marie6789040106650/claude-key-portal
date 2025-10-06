# 数据库设计文档 / Database Schema Documentation

> **版本**: v2.0
> **数据库**: PostgreSQL 15+
> **ORM**: Prisma 5.20+
> **更新时间**: 2025-10-06

---

## 📋 目录 / Table of Contents

1. [设计原则](#设计原则)
2. [数据模型总览](#数据模型总览)
3. [核心表详解](#核心表详解)
4. [CRS集成映射](#crs集成映射)
5. [索引策略](#索引策略)
6. [数据同步机制](#数据同步机制)

---

## 🎯 设计原则 / Design Principles

### 职责分离原则

```
本地数据库职责：
✅ 用户管理（认证、信息、权限）
✅ 用户-密钥映射关系
✅ 本地扩展功能（备注、标签、收藏）
✅ 通知、审计、监控
✅ 统计数据缓存

CRS负责职责：
🔄 密钥生成和管理
🔄 API请求处理
🔄 使用量统计
🔄 密钥状态控制
```

### 数据一致性策略

1. **双写模式** (Create/Update):
   ```
   Portal → CRS API (创建/更新密钥)
   Portal ← CRS Response (获取crsKeyId)
   Portal → Local DB (创建映射关系)
   ```

2. **定期同步** (Read):
   ```
   Cron Job (每小时) → CRS API (拉取使用统计)
                    → Local DB (更新缓存)
   ```

3. **级联删除**:
   ```
   用户删除 → 删除所有关联会话、密钥、审计日志
   密钥删除 → 删除使用记录、到期提醒
   ```

---

## 📊 数据模型总览 / Data Model Overview

### ER图概览

```
┌──────────────┐
│     User     │────┐
└──────────────┘    │
       │            │
       │ 1:N        │ 1:N
       ▼            ▼
┌──────────────┐  ┌──────────────┐
│   Session    │  │   ApiKey     │────── CRS集成
└──────────────┘  └──────────────┘
                         │
                         │ 1:N
                         ▼
                  ┌──────────────┐
                  │ UsageRecord  │────── CRS同步
                  └──────────────┘
```

### 模块分类

| 模块 | 表数量 | 核心表 | 用途 |
|------|--------|--------|------|
| **用户系统** | 3 | User, Session, PasswordHistory | 认证和用户管理 |
| **密钥管理** | 2 | ApiKey, UsageRecord | CRS密钥映射和使用追踪 |
| **通知系统** | 2 | NotificationConfig, Notification | 消息推送 |
| **数据导出** | 1 | ExportTask | 异步导出任务 |
| **审计日志** | 1 | AuditLog | 操作审计 |
| **系统配置** | 1 | SystemConfig | 全局配置 |
| **统计聚合** | 1 | DailyStatistics | 每日统计缓存 |
| **到期提醒** | 2 | ExpirationSetting, ExpirationReminder | 密钥到期管理 |
| **定时任务** | 1 | CronJobLog | Cron执行日志 |
| **监控告警** | 4 | MonitorMetric, AlertRule, AlertRecord, SystemHealth | 系统监控 |

**总计**: 18个表

---

## 🔍 核心表详解 / Core Tables

### 1. User - 用户表

**职责**: 管理Portal用户（不是CRS用户）

**关键字段**:

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| `id` | UUID | 用户ID（主键） | ✅ PK |
| `email` | String | 邮箱（唯一，可选） | ✅ Unique |
| `phone` | String | 手机（唯一，可选） | ✅ Unique |
| `passwordHash` | String | 密码哈希（bcrypt） | - |
| `nickname` | String | 昵称 | - |
| `crsAdminToken` | Text | CRS管理员Token | - |
| `preferences` | JSON | 用户偏好设置 | - |
| `status` | Enum | 用户状态 | - |
| `inviteCode` | String | 邀请码 | ✅ Unique |

**状态枚举** (`UserStatus`):
```typescript
enum UserStatus {
  ACTIVE      // 正常
  INACTIVE    // 未激活
  SUSPENDED   // 暂停
  DELETED     // 已删除
}
```

**关系**:
- `1:N` → Session（会话）
- `1:N` → ApiKey（密钥）
- `1:N` → Notification（通知）
- `1:N` → AuditLog（审计日志）
- `1:1` → ExpirationSetting（到期配置）
- `1:1` → NotificationConfig（通知配置）
- `M:N` → User（邀请关系：inviter ↔ invitees）

**设计要点**:
```typescript
// 🔐 安全规则
✅ 密码使用bcrypt哈希（成本因子10）
✅ email/phone二选一必填（注册时验证）
✅ inviteCode生成后不可修改
❌ 不存储明文密码
❌ 不允许删除有活跃密钥的用户

// 🔄 生命周期
创建 → INACTIVE（未验证）
验证邮箱/手机 → ACTIVE
管理员操作 → SUSPENDED
用户注销 → DELETED（软删除，保留审计）
```

---

### 2. Session - 会话表

**职责**: 管理用户登录会话和JWT令牌

**关键字段**:

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| `id` | UUID | 会话ID | ✅ PK |
| `userId` | UUID | 用户ID（外键） | ✅ FK |
| `accessToken` | Text | 访问令牌（JWT） | ✅ Unique |
| `refreshToken` | Text | 刷新令牌 | ✅ Unique |
| `deviceId` | String | 设备ID | - |
| `ip` | String | IP地址 | - |
| `userAgent` | Text | 浏览器UA | - |
| `location` | JSON | 地理位置 | - |
| `expiresAt` | DateTime | 过期时间 | ✅ Index |
| `lastActivityAt` | DateTime | 最后活动时间 | - |

**设计要点**:
```typescript
// 🔒 Token策略
accessToken有效期: 24小时
refreshToken有效期: 30天
自动续期: lastActivityAt < 1小时 → 延长expiresAt

// 🗑️ 清理策略
Cron Job每天凌晨: 删除 expiresAt < now() 的会话
用户注销: 删除对应会话
用户删除: 级联删除所有会话（onDelete: Cascade）

// 📊 设备追踪
多设备登录: 允许（同一用户可有多个会话）
设备识别: deviceId + userAgent + ip
地理位置: 通过IP解析存储到location（JSON）
```

---

### 3. ApiKey - API密钥表

**职责**: 映射CRS密钥到Portal用户，添加本地扩展功能

**关键字段**:

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| `id` | UUID | Portal密钥ID | ✅ PK |
| `userId` | UUID | 所属用户 | ✅ FK |
| `crsKeyId` | String | CRS密钥ID | ✅ Unique |
| `crsKey` | String | CRS密钥值 | ✅ Unique |
| `name` | String | 密钥名称（本地） | - |
| `description` | Text | 描述（本地） | - |
| `tags` | String[] | 标签（本地） | - |
| `config` | JSON | 配置（本地） | - |
| `status` | Enum | 状态 | ✅ Index |
| `totalCalls` | BigInt | 总调用次数（缓存） | - |
| `totalTokens` | BigInt | 总Token数（缓存） | - |
| `lastUsedAt` | DateTime | 最后使用时间 | ✅ Index |
| `expiresAt` | DateTime | 过期时间 | ✅ Index |

**状态枚举** (`ApiKeyStatus`):
```typescript
enum ApiKeyStatus {
  ACTIVE        // 正常使用
  INACTIVE      // 已停用
  EXPIRED       // 已过期
  DELETED       // 已删除
  RATE_LIMITED  // 触发限流
}
```

**CRS集成映射**:

| Portal字段 | CRS字段 | 同步方向 | 说明 |
|-----------|---------|----------|------|
| `crsKeyId` | `id` | CRS → Portal | 创建时获取 |
| `crsKey` | `key` | CRS → Portal | 创建时获取 |
| `name` | - | Portal Only | 本地扩展 |
| `description` | - | Portal Only | 本地扩展 |
| `tags` | - | Portal Only | 本地扩展 |
| `config` | - | Portal Only | 本地扩展 |
| `totalCalls` | `/stats` | CRS → Portal | 定期同步 |
| `totalTokens` | `/stats` | CRS → Portal | 定期同步 |
| `lastUsedAt` | `/stats` | CRS → Portal | 定期同步 |

**设计要点**:
```typescript
// 🔄 数据流
创建密钥:
  1. Portal调用 CRS Admin API: POST /admin/api-keys
  2. CRS返回 { id, key, ... }
  3. Portal创建 ApiKey记录（crsKeyId, crsKey, name, ...）

更新密钥:
  1. Portal更新本地字段（name, description, tags）
  2. 如需更新CRS字段 → 调用 CRS Admin API

删除密钥:
  1. Portal调用 CRS Admin API: DELETE /admin/api-keys/:id
  2. CRS删除成功 → Portal软删除（status = DELETED）

// 📊 统计同步
Cron Job每小时:
  1. 调用 CRS Admin API: GET /admin/api-keys/:id/stats
  2. 更新 totalCalls, totalTokens, lastUsedAt

// ⏰ 到期处理
Cron Job每天:
  1. 查询 expiresAt < now() + 7天 的密钥
  2. 发送到期提醒通知
  3. expiresAt < now() → status = EXPIRED
```

---

### 4. UsageRecord - 使用记录表

**职责**: 存储从CRS同步的API使用详情

**关键字段**:

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| `id` | UUID | 记录ID | ✅ PK |
| `apiKeyId` | UUID | 密钥ID | ✅ FK |
| `model` | String | 模型名称 | ✅ Index |
| `endpoint` | String | 请求端点 | - |
| `promptTokens` | Int | 提示Token | - |
| `completionTokens` | Int | 补全Token | - |
| `totalTokens` | Int | 总Token | - |
| `duration` | Int | 响应时间（ms） | - |
| `status` | Int | HTTP状态码 | ✅ Index |
| `errorCode` | String | 错误码 | - |
| `errorMessage` | Text | 错误信息 | - |
| `metadata` | JSON | 元数据 | - |
| `timestamp` | DateTime | 请求时间 | ✅ Index |

**数据来源**:
```typescript
// 🔄 从CRS同步
Cron Job每小时:
  1. 调用 CRS Admin API: GET /admin/api-keys/:id/usage
     参数: { startDate, endDate }
  2. 批量插入新记录到 UsageRecord
  3. 用于生成统计报表和图表

// 📊 查询优化
时间范围查询: WHERE timestamp BETWEEN ? AND ?（使用索引）
按模型统计: GROUP BY model（使用索引）
错误分析: WHERE status >= 400（使用索引）

// 🗑️ 数据清理
保留策略: 90天（配置在 SystemConfig）
Cron Job每月: DELETE FROM usage_records WHERE timestamp < now() - 90天
```

---

### 5. Notification - 通知记录表

**职责**: 存储系统通知和告警消息

**关键字段**:

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| `id` | UUID | 通知ID | ✅ PK |
| `userId` | UUID | 用户ID | ✅ FK |
| `type` | Enum | 通知类型 | - |
| `title` | String | 标题 | - |
| `message` | Text | 内容 | - |
| `data` | JSON | 附加数据 | - |
| `channel` | String | 发送渠道 | - |
| `status` | Enum | 发送状态 | ✅ Index |
| `sentAt` | DateTime | 发送时间 | - |
| `readAt` | DateTime | 阅读时间 | - |

**通知类型** (`NotificationType`):
```typescript
enum NotificationType {
  RATE_LIMIT_WARNING       // 流量告警
  QUOTA_WARNING            // 配额告警
  ERROR_SPIKE              // 错误激增
  KEY_CREATED              // 密钥创建
  KEY_DELETED              // 密钥删除
  KEY_EXPIRED              // 密钥过期
  KEY_EXPIRATION_WARNING   // 密钥即将过期
  SYSTEM_ANNOUNCEMENT      // 系统公告
}
```

**发送渠道**:
```typescript
channels: ["system", "email", "webhook"]

system:   站内消息（Portal内显示）
email:    邮件通知（Nodemailer）
webhook:  Webhook推送（企业微信、钉钉）
```

---

### 6. DailyStatistics - 日统计表

**职责**: 缓存每日聚合统计数据（提升仪表板性能）

**关键字段**:

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| `date` | Date | 统计日期 | ✅ Unique |
| `totalUsers` | Int | 总用户数 | - |
| `activeUsers` | Int | 活跃用户数 | - |
| `newUsers` | Int | 新增用户数 | - |
| `totalKeys` | Int | 总密钥数 | - |
| `activeKeys` | Int | 活跃密钥数 | - |
| `totalCalls` | BigInt | 总调用次数 | - |
| `totalTokens` | BigInt | 总Token数 | - |
| `avgResponseTime` | Int | 平均响应时间 | - |
| `modelStats` | JSON | 模型使用分布 | - |

**数据生成**:
```typescript
// 🔄 每日聚合
Cron Job每天凌晨1点:
  1. 聚合昨天的数据
  2. INSERT OR UPDATE daily_statistics
  3. 用于仪表板快速查询（避免实时聚合）

// 📊 查询示例
近7天统计: WHERE date >= today() - 7天
月度趋势: WHERE date BETWEEN 月初 AND 月末
年度对比: WHERE date IN (今年, 去年) GROUP BY YEAR(date)
```

---

## 🔗 CRS集成映射 / CRS Integration Mapping

### 核心映射关系

```
Portal                          CRS
┌──────────────────┐           ┌──────────────────┐
│  User            │           │                  │
│  - id: UUID      │           │ (无对应用户系统) │
│  - email         │           │                  │
│  - passwordHash  │           │                  │
└──────────────────┘           └──────────────────┘
        │
        │ 1:N
        ▼
┌──────────────────┐           ┌──────────────────┐
│  ApiKey          │  映射关系  │  ApiKey          │
│  - id (Portal)   │◄─────────►│  - id (CRS)      │
│  - crsKeyId      │           │  - key           │
│  - crsKey        │           │  - monthlyLimit  │
│  - name (本地)   │           │  - status        │
│  - tags (本地)   │           │  - createdAt     │
└──────────────────┘           └──────────────────┘
        │                               │
        │ 1:N                           │ 1:N
        ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│  UsageRecord     │◄── 同步 ──│  UsageLog        │
│  - apiKeyId      │           │  - keyId         │
│  - timestamp     │           │  - timestamp     │
│  - totalTokens   │           │  - tokens        │
└──────────────────┘           └──────────────────┘
```

### 数据同步策略

#### 1. 密钥创建（双写）

```typescript
// Step 1: Portal调用CRS API
const crsResponse = await crsClient.createKey({
  name: 'Production Key',
  monthlyLimit: 1000000,
})

// CRS返回:
{
  success: true,
  data: {
    id: 'crs_abc123',           // CRS内部ID
    key: 'sk-ant-api03-xxx',    // 密钥值
    monthlyLimit: 1000000,
    status: 'active',
    createdAt: '2025-10-06T10:00:00Z'
  }
}

// Step 2: Portal创建本地映射
await prisma.apiKey.create({
  data: {
    userId: currentUserId,
    crsKeyId: 'crs_abc123',     // 存储CRS ID
    crsKey: 'sk-ant-api03-xxx', // 存储密钥值
    name: 'Production Key',     // 本地名称
    tags: ['production', 'v1'], // 本地标签
    status: 'ACTIVE',
  }
})
```

#### 2. 统计数据同步（定期拉取）

```typescript
// Cron Job: 每小时执行
async function syncUsageStats() {
  const keys = await prisma.apiKey.findMany({
    where: { status: 'ACTIVE' }
  })

  for (const key of keys) {
    // Step 1: 从CRS获取统计
    const stats = await crsClient.getKeyStats(key.crsKeyId, {
      startDate: lastSyncTime,
      endDate: now()
    })

    // Step 2: 更新本地聚合数据
    await prisma.apiKey.update({
      where: { id: key.id },
      data: {
        totalCalls: stats.totalCalls,
        totalTokens: stats.totalTokens,
        lastUsedAt: stats.lastUsedAt,
      }
    })

    // Step 3: 插入详细记录
    await prisma.usageRecord.createMany({
      data: stats.records.map(r => ({
        apiKeyId: key.id,
        model: r.model,
        totalTokens: r.tokens,
        timestamp: r.timestamp,
        ...
      }))
    })
  }
}
```

#### 3. 密钥删除（同步删除）

```typescript
async function deleteKey(keyId: string) {
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId }
  })

  // Step 1: 删除CRS密钥
  await crsClient.deleteKey(key.crsKeyId)

  // Step 2: 本地软删除（保留历史记录）
  await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      status: 'DELETED',
      deletedAt: new Date()
    }
  })
}
```

---

## 📈 索引策略 / Indexing Strategy

### 索引设计原则

```sql
-- ✅ 创建索引的场景
1. 外键字段（FK）- 加速JOIN查询
2. WHERE条件频繁使用的字段
3. ORDER BY排序字段
4. UNIQUE约束字段

-- ❌ 避免过度索引
1. 读多写少的表才需要多索引
2. 小表（<10,000行）不需要索引
3. 低基数字段（如boolean）不需要索引
```

### 核心索引列表

#### User表索引
```prisma
@@index([email])        // 登录查询: WHERE email = ?
@@index([phone])        // 手机登录: WHERE phone = ?
@@index([inviteCode])   // 邀请码查询: WHERE inviteCode = ?
@@index([createdAt])    // 注册时间排序: ORDER BY createdAt
```

#### ApiKey表索引
```prisma
@@index([userId])       // 用户密钥列表: WHERE userId = ?
@@index([crsKeyId])     // CRS映射查询: WHERE crsKeyId = ?
@@index([status])       // 状态过滤: WHERE status = 'ACTIVE'
@@index([lastUsedAt])   // 最近使用排序: ORDER BY lastUsedAt
@@index([expiresAt])    // 到期检查: WHERE expiresAt < now()
```

#### UsageRecord表索引
```prisma
@@index([apiKeyId])     // 密钥使用记录: WHERE apiKeyId = ?
@@index([timestamp])    // 时间范围查询: WHERE timestamp BETWEEN ? AND ?
@@index([model])        // 模型统计: GROUP BY model
@@index([status])       // 错误分析: WHERE status >= 400
```

#### Session表索引
```prisma
@@index([userId])       // 用户会话列表: WHERE userId = ?
@@index([accessToken])  // Token验证: WHERE accessToken = ?
@@index([expiresAt])    // 过期会话清理: WHERE expiresAt < now()
```

### 复合索引（未来优化）

```prisma
// 如需要，可添加复合索引优化特定查询

// 示例：按用户和状态查询密钥
@@index([userId, status])

// 示例：按时间范围和模型统计
@@index([timestamp, model])
```

---

## 🔄 数据同步机制 / Data Synchronization

### Cron Job调度表

| 任务 | 频率 | 执行时间 | 功能 |
|------|------|----------|------|
| **syncUsageStats** | 每小时 | :00 | 同步CRS使用统计 |
| **cleanupExpiredSessions** | 每天 | 00:00 | 清理过期会话 |
| **checkKeyExpiration** | 每天 | 09:00 | 检查密钥到期 |
| **aggregateDailyStats** | 每天 | 01:00 | 生成日统计 |
| **cleanupOldUsageRecords** | 每月 | 1日 02:00 | 清理90天前记录 |

### 数据一致性保证

```typescript
// 🔒 使用事务确保一致性
async function createKeyWithTransaction(userId: string, data: CreateKeyInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. 调用CRS创建密钥
    const crsKey = await crsClient.createKey(data)

    // 2. 创建本地映射
    const localKey = await tx.apiKey.create({
      data: {
        userId,
        crsKeyId: crsKey.id,
        crsKey: crsKey.key,
        ...
      }
    })

    // 3. 记录审计日志
    await tx.auditLog.create({
      data: {
        userId,
        action: 'KEY_CREATED',
        resourceId: localKey.id,
        ...
      }
    })

    return localKey
  })
}

// 🔄 数据同步重试机制
async function syncWithRetry(fn: () => Promise<void>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await fn()
      return
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(1000 * (i + 1)) // 指数退避
    }
  }
}
```

### 缓存策略

```typescript
// 📦 Redis缓存层（可选）
const CACHE_TTL = {
  USER_INFO: 300,        // 5分钟
  API_KEY_LIST: 60,      // 1分钟
  USAGE_STATS: 3600,     // 1小时
  DAILY_STATS: 86400,    // 24小时
}

// 示例：缓存用户密钥列表
async function getUserKeys(userId: string) {
  const cacheKey = `user:${userId}:keys`

  // 1. 尝试从缓存获取
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // 2. 从数据库查询
  const keys = await prisma.apiKey.findMany({
    where: { userId, status: 'ACTIVE' }
  })

  // 3. 写入缓存
  await redis.setex(cacheKey, CACHE_TTL.API_KEY_LIST, JSON.stringify(keys))

  return keys
}
```

---

## 📝 数据迁移 / Migrations

### Prisma迁移流程

```bash
# 开发环境
npm run db:migrate      # 创建并应用迁移
npm run db:push         # 快速同步schema（不推荐生产）
npm run db:studio       # 可视化查看数据

# 生产环境
npx prisma migrate deploy  # 仅应用迁移（不生成新迁移）
```

### 重要迁移记录

```sql
-- Migration 001: 初始化数据库
CREATE TABLE users ...
CREATE TABLE api_keys ...
...

-- Migration 002: 添加CRS集成字段
ALTER TABLE api_keys ADD COLUMN crs_key_id VARCHAR(255) UNIQUE;
ALTER TABLE api_keys ADD COLUMN crs_key VARCHAR(255) UNIQUE;

-- Migration 003: 添加监控告警系统
CREATE TABLE monitor_metrics ...
CREATE TABLE alert_rules ...
...

-- Migration 004: 添加定时任务日志
CREATE TABLE cron_job_logs ...
```

---

## 🔐 安全考虑 / Security Considerations

### 敏感数据保护

```typescript
// ✅ 安全实践
1. 密码哈希: bcrypt (成本因子10)
2. JWT密钥: 环境变量存储 (JWT_SECRET)
3. CRS Token: 加密存储 (crsAdminToken)
4. API密钥: 仅返回脱敏版本（sk-***-xxx）

// ❌ 安全禁令
1. 不存储明文密码
2. 不在日志中输出敏感信息
3. 不在前端暴露完整API密钥
4. 不在数据库中存储信用卡信息
```

### 数据访问控制

```typescript
// 🔒 行级安全（Row-Level Security）
// Prisma查询自动注入userId过滤

// 用户只能查询自己的密钥
const keys = await prisma.apiKey.findMany({
  where: {
    userId: currentUserId,  // 强制过滤
    status: 'ACTIVE'
  }
})

// 管理员可以查询所有密钥
const allKeys = await prisma.apiKey.findMany({
  where: isAdmin ? {} : { userId: currentUserId }
})
```

### 审计日志

```typescript
// 📝 所有关键操作记录审计日志
await prisma.auditLog.create({
  data: {
    userId,
    action: 'KEY_DELETED',
    resource: 'ApiKey',
    resourceId: keyId,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    status: 'success',
  }
})

// 审计日志保留策略：永久保留
```

---

## 📚 参考文档 / References

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Indexing Best Practices](https://www.postgresql.org/docs/current/indexes.html)
- [DDD_TDD_GIT_STANDARD.md](./DDD_TDD_GIT_STANDARD.md) - 项目架构标准
- [API_MAPPING_SPECIFICATION.md](./API_MAPPING_SPECIFICATION.md) - API规范
- [CRS_API_VERIFICATION.md](./CRS_API_VERIFICATION.md) - CRS集成验证

---

**文档版本**: v2.0
**最后更新**: 2025-10-06
**维护者**: Claude Key Portal Team
**Schema文件**: `prisma/schema.prisma`

---

_"清晰的数据模型，是系统稳定的基石！"_
