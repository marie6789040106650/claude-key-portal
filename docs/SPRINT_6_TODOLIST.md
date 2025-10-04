# Sprint 6 - 通知系统 (Notification System)

> **目标**: 实现完整的通知系统，包括配置管理、通知记录和多渠道发送
> **状态**: 🚀 Ready to Start
> **分支**: `feature/notification-system`
> **预计工期**: 2-3 天
> **前置条件**: Sprint 5 完成 (用户账户管理)

---

## 📋 Sprint 概览

### 核心功能
1. **通知配置管理** - 用户自定义通知规则和渠道
2. **通知记录管理** - 查看、标记已读、删除通知
3. **通知发送服务** - 支持邮件、Webhook、系统内通知

### 技术特性
- 多渠道支持（邮件、Webhook、系统内）
- 灵活的通知规则配置
- 异步发送机制
- 发送状态跟踪
- 批量操作支持

---

## 🎯 功能需求

### 1. 通知配置 API

#### GET /api/user/notification-config
获取用户的通知配置

**响应示例**:
```json
{
  "id": "config-uuid",
  "userId": "user-uuid",
  "channels": {
    "email": {
      "enabled": true,
      "address": "user@example.com"
    },
    "webhook": {
      "enabled": false,
      "url": "https://example.com/webhook"
    },
    "system": {
      "enabled": true
    }
  },
  "rules": [
    {
      "type": "RATE_LIMIT_WARNING",
      "enabled": true,
      "threshold": 80,
      "channels": ["email", "system"]
    },
    {
      "type": "QUOTA_WARNING",
      "enabled": true,
      "threshold": 90,
      "channels": ["email", "webhook", "system"]
    }
  ],
  "createdAt": "2025-10-01T00:00:00.000Z",
  "updatedAt": "2025-10-03T00:00:00.000Z"
}
```

#### PUT /api/user/notification-config
更新通知配置

**请求体**:
```json
{
  "channels": {
    "email": {
      "enabled": true,
      "address": "newemail@example.com"
    },
    "webhook": {
      "enabled": true,
      "url": "https://api.example.com/webhook",
      "secret": "webhook_secret_key"
    }
  },
  "rules": [
    {
      "type": "RATE_LIMIT_WARNING",
      "enabled": true,
      "threshold": 75,
      "channels": ["email"]
    }
  ]
}
```

**验证规则**:
- 邮箱地址格式验证
- Webhook URL 格式验证（https://）
- 阈值范围验证（0-100）
- 至少启用一个通知渠道

---

### 2. 通知记录 API

#### GET /api/user/notifications
获取用户通知列表（分页）

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `type`: 通知类型筛选（可选）
- `status`: 状态筛选（可选）
- `unreadOnly`: 仅未读（可选）

**响应示例**:
```json
{
  "notifications": [
    {
      "id": "notification-uuid",
      "type": "RATE_LIMIT_WARNING",
      "title": "API 速率限制警告",
      "message": "您的 API Key 'Production Key' 已达到80%速率限制",
      "data": {
        "apiKeyId": "key-uuid",
        "apiKeyName": "Production Key",
        "currentRate": 8000,
        "maxRate": 10000,
        "percentage": 80
      },
      "channel": "email",
      "status": "SENT",
      "sentAt": "2025-10-03T10:00:00.000Z",
      "readAt": null,
      "createdAt": "2025-10-03T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "unreadCount": 5
}
```

#### GET /api/user/notifications/[id]
获取单个通知详情

#### PUT /api/user/notifications/[id]/read
标记通知为已读

**响应**:
```json
{
  "message": "通知已标记为已读",
  "readAt": "2025-10-03T11:00:00.000Z"
}
```

#### PUT /api/user/notifications/read-all
批量标记所有未读通知为已读

**请求体**（可选）:
```json
{
  "type": "RATE_LIMIT_WARNING",  // 仅标记特定类型
  "before": "2025-10-03T00:00:00.000Z"  // 仅标记指定时间之前的
}
```

**响应**:
```json
{
  "message": "已标记 12 条通知为已读",
  "count": 12
}
```

#### DELETE /api/user/notifications/[id]
删除单个通知

#### DELETE /api/user/notifications
批量删除已读通知

**请求体**（可选）:
```json
{
  "type": "SYSTEM_ANNOUNCEMENT",  // 仅删除特定类型
  "before": "2025-10-01T00:00:00.000Z"  // 仅删除指定时间之前的
}
```

---

### 3. 通知发送服务

#### 内部服务 API（非 HTTP 端点）

```typescript
// lib/services/notification-service.ts

interface SendNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  channels?: string[]  // 不指定则使用用户配置
}

class NotificationService {
  /**
   * 发送通知到所有启用的渠道
   */
  async send(input: SendNotificationInput): Promise<Notification>

  /**
   * 发送邮件通知
   */
  private async sendEmail(notification: Notification): Promise<void>

  /**
   * 发送 Webhook 通知
   */
  private async sendWebhook(notification: Notification): Promise<void>

  /**
   * 创建系统内通知
   */
  private async createSystemNotification(notification: Notification): Promise<void>

  /**
   * 检查是否应该发送通知（根据规则）
   */
  private shouldSendNotification(
    userId: string,
    type: NotificationType
  ): Promise<boolean>
}
```

#### 通知触发场景

1. **RATE_LIMIT_WARNING** - API Key 达到速率限制阈值
2. **QUOTA_WARNING** - API Key 配额使用达到阈值
3. **ERROR_SPIKE** - 错误率突然增加
4. **KEY_CREATED** - 新 API Key 创建成功
5. **KEY_DELETED** - API Key 被删除
6. **KEY_EXPIRED** - API Key 即将过期或已过期
7. **SYSTEM_ANNOUNCEMENT** - 系统公告

---

## 🗂️ 数据库模型

### NotificationConfig (已存在)
```prisma
model NotificationConfig {
  id                String    @id @default(uuid())
  userId            String    @unique

  // 渠道配置
  channels          Json      // { email: { enabled, address }, webhook: { enabled, url, secret }, system: { enabled } }

  // 通知规则
  rules             Json      @default("[]")  // [{ type, enabled, threshold, channels }]

  // 时间
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@map("notification_configs")
}
```

### Notification (已存在)
```prisma
model Notification {
  id                String    @id @default(uuid())
  userId            String

  // 通知内容
  type              NotificationType
  title             String
  message           String    @db.Text
  data              Json?

  // 发送状态
  channel           String
  status            NotificationStatus @default(PENDING)
  sentAt            DateTime?
  readAt            DateTime?

  // 错误信息
  error             String?   @db.Text

  // 时间
  createdAt         DateTime  @default(now())

  // 关系
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("notifications")
}

enum NotificationType {
  RATE_LIMIT_WARNING
  QUOTA_WARNING
  ERROR_SPIKE
  KEY_CREATED
  KEY_DELETED
  KEY_EXPIRED
  SYSTEM_ANNOUNCEMENT
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  READ
}
```

---

## 🔧 技术实现要点

### 1. 邮件发送

使用 **Nodemailer** + **SMTP**

```typescript
// lib/email/mailer.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    ...options,
  })
}
```

### 2. Webhook 发送

使用 **fetch** 带签名验证

```typescript
// lib/webhook/client.ts
import crypto from 'crypto'

export async function sendWebhook(options: {
  url: string
  secret: string
  payload: any
}) {
  const signature = crypto
    .createHmac('sha256', options.secret)
    .update(JSON.stringify(options.payload))
    .digest('hex')

  await fetch(options.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
    },
    body: JSON.stringify(options.payload),
  })
}
```

### 3. 异步发送队列

使用 **BullMQ** + **Redis**

```typescript
// lib/queue/notification-queue.ts
import { Queue, Worker } from 'bullmq'

const notificationQueue = new Queue('notifications', {
  connection: redisConfig,
})

const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { notificationId } = job.data
    await notificationService.processNotification(notificationId)
  },
  { connection: redisConfig }
)

export async function queueNotification(notificationId: string) {
  await notificationQueue.add('send', { notificationId })
}
```

---

## ✅ TDD 测试规划

### 通知配置 API 测试 (15 tests)

**成功场景**:
- ✅ 应该返回用户通知配置（首次访问自动创建默认配置）
- ✅ 应该成功更新邮件渠道配置
- ✅ 应该成功更新 Webhook 渠道配置
- ✅ 应该成功更新通知规则
- ✅ 应该同时更新多个渠道和规则

**验证场景**:
- ✅ 应该验证邮箱地址格式
- ✅ 应该验证 Webhook URL 格式（必须 https://）
- ✅ 应该验证阈值范围（0-100）
- ✅ 应该验证至少启用一个渠道

**错误场景**:
- ✅ 应该拒绝未认证的请求
- ✅ 应该处理数据库错误

### 通知记录 API 测试 (18 tests)

**查询场景**:
- ✅ 应该返回用户通知列表（分页）
- ✅ 应该按类型筛选通知
- ✅ 应该按状态筛选通知
- ✅ 应该仅返回未读通知
- ✅ 应该返回未读数量统计
- ✅ 应该正确处理分页参数

**单个通知操作**:
- ✅ 应该返回通知详情
- ✅ 应该成功标记通知为已读
- ✅ 应该成功删除通知

**批量操作**:
- ✅ 应该批量标记所有未读通知为已读
- ✅ 应该批量标记特定类型通知为已读
- ✅ 应该批量删除已读通知
- ✅ 应该批量删除特定类型通知

**错误场景**:
- ✅ 应该拒绝未认证的请求
- ✅ 应该拒绝访问其他用户的通知
- ✅ 应该处理通知不存在的情况
- ✅ 应该处理数据库错误

### 通知发送服务测试 (12 tests)

**发送逻辑**:
- ✅ 应该根据用户配置选择渠道
- ✅ 应该成功发送邮件通知
- ✅ 应该成功发送 Webhook 通知
- ✅ 应该创建系统内通知
- ✅ 应该支持同时发送到多个渠道

**规则检查**:
- ✅ 应该检查通知类型是否启用
- ✅ 应该检查阈值条件
- ✅ 应该跳过禁用的规则

**错误处理**:
- ✅ 应该处理邮件发送失败
- ✅ 应该处理 Webhook 发送失败
- ✅ 应该记录发送错误
- ✅ 应该更新通知状态

**总计**: 45 个测试

---

## 📝 开发任务分解

### Phase 1: 🔴 RED - 编写测试 (Day 1)

#### Task 1.1: 通知配置测试
```bash
# 创建测试文件
touch tests/unit/user/notification-config.test.ts

# 编写15个测试
git add tests/unit/user/notification-config.test.ts
git commit -m "test: add notification config API tests (🔴 RED)"
```

#### Task 1.2: 通知记录测试
```bash
# 创建测试文件
touch tests/unit/user/notifications.test.ts

# 编写18个测试
git add tests/unit/user/notifications.test.ts
git commit -m "test: add notifications API tests (🔴 RED)"
```

#### Task 1.3: 通知服务测试
```bash
# 创建测试文件
touch tests/unit/services/notification-service.test.ts

# 编写12个测试
git add tests/unit/services/notification-service.test.ts
git commit -m "test: add notification service tests (🔴 RED)"
```

**验证**: 运行 `npm test` - 应该有 45 个测试失败

---

### Phase 2: 🟢 GREEN - 实现功能 (Day 2)

#### Task 2.1: 通知配置 API
```bash
# 创建 API 路由
mkdir -p app/api/user/notification-config
touch app/api/user/notification-config/route.ts

# 实现 GET 和 PUT
git add app/api/user/notification-config/
git commit -m "feat: implement notification config API (🟢 GREEN)"
```

#### Task 2.2: 通知记录 API
```bash
# 创建 API 路由
mkdir -p app/api/user/notifications
touch app/api/user/notifications/route.ts
touch app/api/user/notifications/[id]/route.ts
touch app/api/user/notifications/read-all/route.ts

# 实现所有端点
git add app/api/user/notifications/
git commit -m "feat: implement notifications API (🟢 GREEN)"
```

#### Task 2.3: 通知发送服务
```bash
# 创建服务模块
mkdir -p lib/services
touch lib/services/notification-service.ts
touch lib/email/mailer.ts
touch lib/webhook/client.ts

# 实现发送逻辑
git add lib/services/ lib/email/ lib/webhook/
git commit -m "feat: implement notification service (🟢 GREEN)"
```

**验证**: 运行 `npm test` - 所有测试应该通过

---

### Phase 3: 🔵 REFACTOR - 优化代码 (Day 2)

#### Task 3.1: 代码重构
- 提取通用验证函数
- 优化数据库查询
- 统一错误处理
- 添加代码注释

```bash
git add .
git commit -m "refactor: optimize notification system code (🔵 REFACTOR)"
```

#### Task 3.2: 性能优化
- 实现通知缓存
- 批量操作优化
- 索引优化建议

---

### Phase 4: 验证和文档 (Day 3)

#### Task 4.1: 全面测试
```bash
# 运行所有测试
npm test

# 检查覆盖率
npm run test:coverage

# 预期结果: 287 passed, 8 skipped (295 total)
```

#### Task 4.2: 更新文档
```bash
# 创建 API 文档
touch docs/API_ENDPOINTS_SPRINT6.md

# 编写完整的 API 规范
git add docs/API_ENDPOINTS_SPRINT6.md
git commit -m "docs: add Sprint 6 API documentation"
```

#### Task 4.3: 合并到 develop
```bash
git checkout develop
git merge feature/notification-system --no-ff -m "merge: Sprint 6 - Notification System 功能完成"
git branch -d feature/notification-system
```

---

## 🔐 环境变量需求

```bash
# .env.local 添加以下配置

# SMTP 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Claude Key Portal <noreply@claudekey.com>"

# Redis 配置（异步队列）
REDIS_URL=redis://localhost:6379

# Webhook 配置
WEBHOOK_TIMEOUT=5000  # 5秒超时
WEBHOOK_RETRY=2       # 重试2次
```

---

## 📦 新依赖安装

```bash
# 邮件发送
npm install nodemailer
npm install -D @types/nodemailer

# 异步队列（可选，后期优化）
npm install bullmq ioredis
npm install -D @types/ioredis
```

---

## 🎨 UI 组件需求（Sprint 7）

本 Sprint 仅实现后端 API，UI 组件留待 Sprint 7 实现：

- 通知配置页面
- 通知列表组件
- 通知详情弹窗
- 未读数量徽章
- 通知中心面板

---

## 📊 成功指标

- ✅ 45 个新测试全部通过
- ✅ 测试覆盖率 > 85%
- ✅ TypeScript 无错误
- ✅ ESLint 无警告
- ✅ 所有 API 端点正常工作
- ✅ 邮件和 Webhook 发送成功
- ✅ API 文档完整

---

## 🚀 下一步计划 (Sprint 7)

1. **通知系统 UI** - 用户界面实现
2. **数据导出功能** - 导出 API Keys 和使用记录
3. **使用统计 Dashboard** - 可视化数据展示

---

## 📝 备注

### 关于 BullMQ
第一版可以先同步发送通知，后期如果需要处理大量通知时再引入队列系统。

### 关于邮件模板
第一版使用简单的 HTML 模板，后期可以引入专业的邮件模板系统（如 MJML）。

### 关于通知去重
如果短时间内触发多次相同通知，应该合并或限流。这个逻辑可以在 `NotificationService` 中实现。

---

**Sprint 负责人**: Claude
**预计完成时间**: 2025-10-06
**文档版本**: v1.0
**最后更新**: 2025-10-03
