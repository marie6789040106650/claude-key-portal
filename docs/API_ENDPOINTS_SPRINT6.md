# Sprint 6 API 端点文档 - 通知系统

> **功能**: 通知系统 (Notification System)
> **版本**: v1.0
> **创建时间**: 2025-10-04

---

## 📋 目录

- [认证说明](#认证说明)
- [通知配置](#通知配置)
  - [GET /api/user/notification-config](#get-apiusernotification-config)
  - [PUT /api/user/notification-config](#put-apiusernotification-config)
- [通知记录](#通知记录)
  - [GET /api/user/notifications](#get-apiusernotifications)
  - [DELETE /api/user/notifications](#delete-apiusernotifications)
- [单个通知操作](#单个通知操作)
  - [GET /api/user/notifications/:id](#get-apiusernotificationsid)
  - [DELETE /api/user/notifications/:id](#delete-apiusernotificationsid)
  - [PUT /api/user/notifications/:id/read](#put-apiusernotificationsidread)
  - [PUT /api/user/notifications/read-all](#put-apiusernotificationsread-all)

---

## 认证说明

所有 API 端点都需要认证。请在请求头中包含 Bearer Token：

```http
Authorization: Bearer <your-token>
```

### 认证错误响应

```json
{
  "error": "Token无效或已过期"
}
```

**HTTP 状态码**: `401 Unauthorized`

---

## 通知配置

### GET /api/user/notification-config

获取当前用户的通知配置。如果配置不存在，将自动创建默认配置。

#### 请求

```http
GET /api/user/notification-config
Authorization: Bearer <token>
```

#### 响应

**成功响应** (`200 OK`):

```json
{
  "id": "config-123",
  "userId": "user-123",
  "channels": {
    "email": {
      "enabled": true,
      "address": "user@example.com"
    },
    "webhook": {
      "enabled": false,
      "url": "",
      "secret": ""
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
      "type": "KEY_CREATED",
      "enabled": true,
      "channels": ["email", "system"]
    }
  ],
  "createdAt": "2025-10-04T10:30:00.000Z",
  "updatedAt": "2025-10-04T10:30:00.000Z"
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 配置 ID |
| `userId` | string | 用户 ID |
| `channels` | object | 渠道配置 |
| `channels.email` | object | 邮件渠道配置 |
| `channels.email.enabled` | boolean | 是否启用邮件通知 |
| `channels.email.address` | string | 接收邮件的地址 |
| `channels.webhook` | object | Webhook 渠道配置 |
| `channels.webhook.enabled` | boolean | 是否启用 Webhook |
| `channels.webhook.url` | string | Webhook URL（必须 HTTPS） |
| `channels.webhook.secret` | string | Webhook 签名密钥 |
| `channels.system` | object | 系统内通知配置 |
| `channels.system.enabled` | boolean | 是否启用系统内通知 |
| `rules` | array | 通知规则数组 |
| `rules[].type` | string | 通知类型（见下表） |
| `rules[].enabled` | boolean | 是否启用该类型通知 |
| `rules[].threshold` | number | 阈值（0-100），用于速率限制警告 |
| `rules[].channels` | array | 该类型通知使用的渠道 |

#### 通知类型

| 类型 | 说明 | 支持阈值 |
|------|------|---------|
| `RATE_LIMIT_WARNING` | API 速率限制警告 | ✅ |
| `KEY_CREATED` | 密钥创建通知 | ❌ |
| `KEY_UPDATED` | 密钥更新通知 | ❌ |
| `KEY_DELETED` | 密钥删除通知 | ❌ |
| `SYSTEM_ANNOUNCEMENT` | 系统公告 | ❌ |

#### 错误响应

**认证失败** (`401`):
```json
{
  "error": "Token无效或已过期"
}
```

**系统错误** (`500`):
```json
{
  "error": "系统错误，请稍后重试"
}
```

---

### PUT /api/user/notification-config

更新当前用户的通知配置。

#### 请求

```http
PUT /api/user/notification-config
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "channels": {
    "email": {
      "enabled": true,
      "address": "newemail@example.com"
    },
    "webhook": {
      "enabled": true,
      "url": "https://example.com/webhook",
      "secret": "your-secret-key"
    },
    "system": {
      "enabled": true
    }
  },
  "rules": [
    {
      "type": "RATE_LIMIT_WARNING",
      "enabled": true,
      "threshold": 90,
      "channels": ["email", "webhook", "system"]
    }
  ]
}
```

#### 验证规则

| 字段 | 规则 | 错误消息 |
|------|------|----------|
| `channels.email.address` | RFC 5322 邮箱格式 | `请提供有效的邮箱地址` |
| `channels.webhook.url` | 必须使用 HTTPS | `Webhook URL 必须使用 HTTPS` |
| `rules[].threshold` | 0-100 之间的整数 | `速率限制阈值必须在 0-100 之间` |
| `channels` | 至少启用一个渠道 | `至少需要启用一个通知渠道` |

#### 响应

**成功响应** (`200 OK`):

```json
{
  "id": "config-123",
  "userId": "user-123",
  "channels": {
    "email": {
      "enabled": true,
      "address": "newemail@example.com"
    },
    "webhook": {
      "enabled": true,
      "url": "https://example.com/webhook",
      "secret": "your-secret-key"
    },
    "system": {
      "enabled": true
    }
  },
  "rules": [
    {
      "type": "RATE_LIMIT_WARNING",
      "enabled": true,
      "threshold": 90,
      "channels": ["email", "webhook", "system"]
    }
  ],
  "createdAt": "2025-10-04T10:30:00.000Z",
  "updatedAt": "2025-10-04T11:15:00.000Z"
}
```

#### 错误响应

**验证失败** (`400`):
```json
{
  "error": "请提供有效的邮箱地址"
}
```

**认证失败** (`401`):
```json
{
  "error": "Token无效或已过期"
}
```

**系统错误** (`500`):
```json
{
  "error": "系统错误，请稍后重试"
}
```

---

## 通知记录

### GET /api/user/notifications

获取当前用户的通知列表，支持分页和筛选。

#### 请求

```http
GET /api/user/notifications?page=1&limit=20&type=RATE_LIMIT_WARNING&unreadOnly=true
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | ❌ | 1 | 页码（从 1 开始） |
| `limit` | number | ❌ | 20 | 每页数量（最大 100） |
| `type` | string | ❌ | - | 通知类型筛选 |
| `status` | string | ❌ | - | 状态筛选（`PENDING`, `SENT`, `FAILED`） |
| `unreadOnly` | boolean | ❌ | false | 仅显示未读通知 |

#### 响应

**成功响应** (`200 OK`):

```json
{
  "notifications": [
    {
      "id": "notif-123",
      "type": "RATE_LIMIT_WARNING",
      "title": "API 速率限制警告",
      "message": "您的 API Key 已达到 90% 速率限制",
      "data": {
        "percentage": 90,
        "keyName": "Production API Key"
      },
      "channel": "email",
      "status": "SENT",
      "sentAt": "2025-10-04T10:35:00.000Z",
      "readAt": null,
      "createdAt": "2025-10-04T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "unreadCount": 12
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `notifications` | array | 通知列表 |
| `notifications[].id` | string | 通知 ID |
| `notifications[].type` | string | 通知类型 |
| `notifications[].title` | string | 通知标题 |
| `notifications[].message` | string | 通知内容 |
| `notifications[].data` | object | 附加数据（可选） |
| `notifications[].channel` | string | 发送渠道（`email`, `webhook`, `system`） |
| `notifications[].status` | string | 发送状态（`PENDING`, `SENT`, `FAILED`） |
| `notifications[].sentAt` | string | 发送时间（ISO 8601） |
| `notifications[].readAt` | string\|null | 阅读时间（ISO 8601） |
| `notifications[].createdAt` | string | 创建时间（ISO 8601） |
| `pagination` | object | 分页信息 |
| `pagination.page` | number | 当前页码 |
| `pagination.limit` | number | 每页数量 |
| `pagination.total` | number | 总记录数 |
| `pagination.totalPages` | number | 总页数 |
| `unreadCount` | number | 未读通知数量 |

#### 错误响应

**认证失败** (`401`):
```json
{
  "error": "Token无效或已过期"
}
```

**系统错误** (`500`):
```json
{
  "error": "系统错误，请稍后重试"
}
```

---

### DELETE /api/user/notifications

批量删除已读通知。为了安全，仅允许删除已读通知。

#### 请求

```http
DELETE /api/user/notifications
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "type": "RATE_LIMIT_WARNING",
  "before": "2025-10-01T00:00:00.000Z"
}
```

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | string | ❌ | 仅删除指定类型的通知 |
| `before` | string | ❌ | 仅删除该时间之前创建的通知（ISO 8601） |

**注意**: 两个参数都是可选的。如果都不提供，将删除所有已读通知。

#### 响应

**成功响应** (`200 OK`):

```json
{
  "message": "已删除 15 条通知",
  "count": 15
}
```

#### 错误响应

**认证失败** (`401`):
```json
{
  "error": "Token无效或已过期"
}
```

**系统错误** (`500`):
```json
{
  "error": "系统错误，请稍后重试"
}
```

---

## 单个通知操作

### GET /api/user/notifications/:id

获取指定通知的详细信息。

#### 请求

```http
GET /api/user/notifications/notif-123
Authorization: Bearer <token>
```

#### URL 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 通知 ID |

#### 响应

**成功响应** (`200 OK`):

```json
{
  "id": "notif-123",
  "type": "KEY_CREATED",
  "title": "新密钥创建成功",
  "message": "您的新 API Key 已创建",
  "data": {
    "keyName": "Development Key",
    "keyId": "key-456"
  },
  "channel": "email",
  "status": "SENT",
  "sentAt": "2025-10-04T10:35:00.000Z",
  "readAt": "2025-10-04T11:00:00.000Z",
  "createdAt": "2025-10-04T10:30:00.000Z"
}
```

#### 错误响应

**通知不存在** (`404`):
```json
{
  "error": "通知不存在"
}
```

**认证失败** (`401`):
```json
{
  "error": "Token无效或已过期"
}
```

**系统错误** (`500`):
```json
{
  "error": "系统错误，请稍后重试"
}
```

---

### DELETE /api/user/notifications/:id

删除指定的通知。只能删除属于当前用户的通知。

#### 请求

```http
DELETE /api/user/notifications/notif-123
Authorization: Bearer <token>
```

#### URL 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 通知 ID |

#### 响应

**成功响应** (`200 OK`):

```json
{
  "message": "通知已删除"
}
```

#### 错误响应

**通知不存在** (`404`):
```json
{
  "error": "通知不存在"
}
```

**认证失败** (`401`):
```json
{
  "error": "Token无效或已过期"
}
```

**系统错误** (`500`):
```json
{
  "error": "系统错误，请稍后重试"
}
```

---

### PUT /api/user/notifications/:id/read

标记指定通知为已读。

#### 请求

```http
PUT /api/user/notifications/notif-123/read
Authorization: Bearer <token>
```

#### URL 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 通知 ID |

#### 响应

**成功响应** (`200 OK`):

```json
{
  "message": "通知已标记为已读",
  "readAt": "2025-10-04T12:00:00.000Z"
}
```

#### 错误响应

**通知不存在** (`404`):
```json
{
  "error": "通知不存在"
}
```

**认证失败** (`401`):
```json
{
  "error": "Token无效或已过期"
}
```

**系统错误** (`500`):
```json
{
  "error": "系统错误，请稍后重试"
}
```

---

### PUT /api/user/notifications/read-all

批量标记通知为已读。

#### 请求

```http
PUT /api/user/notifications/read-all
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "type": "RATE_LIMIT_WARNING",
  "before": "2025-10-04T12:00:00.000Z"
}
```

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | string | ❌ | 仅标记指定类型的通知 |
| `before` | string | ❌ | 仅标记该时间之前创建的通知（ISO 8601） |

**注意**: 两个参数都是可选的。如果都不提供，将标记所有未读通知为已读。

#### 响应

**成功响应** (`200 OK`):

```json
{
  "message": "已标记 8 条通知为已读",
  "count": 8
}
```

#### 错误响应

**认证失败** (`401`):
```json
{
  "error": "Token无效或已过期"
}
```

**系统错误** (`500`):
```json
{
  "error": "系统错误，请稍后重试"
}
```

---

## 💡 使用示例

### 示例 1: 配置邮件通知

```javascript
// 1. 获取当前配置
const configResponse = await fetch('/api/user/notification-config', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const config = await configResponse.json()

// 2. 更新配置启用邮件
config.channels.email.enabled = true
config.channels.email.address = 'user@example.com'

const updateResponse = await fetch('/api/user/notification-config', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channels: config.channels,
    rules: config.rules
  })
})
```

### 示例 2: 获取未读通知

```javascript
const response = await fetch(
  '/api/user/notifications?page=1&limit=10&unreadOnly=true',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
)

const { notifications, unreadCount } = await response.json()

console.log(`您有 ${unreadCount} 条未读通知`)
notifications.forEach(notif => {
  console.log(`${notif.title}: ${notif.message}`)
})
```

### 示例 3: 标记所有通知为已读

```javascript
const response = await fetch('/api/user/notifications/read-all', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})  // 标记所有未读通知
})

const { message, count } = await response.json()
console.log(message)  // "已标记 8 条通知为已读"
```

### 示例 4: 配置 Webhook 通知

```javascript
const response = await fetch('/api/user/notification-config', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channels: {
      email: { enabled: false },
      webhook: {
        enabled: true,
        url: 'https://myapp.com/webhooks/notifications',
        secret: 'my-secret-key-123'
      },
      system: { enabled: true }
    },
    rules: [
      {
        type: 'RATE_LIMIT_WARNING',
        enabled: true,
        threshold: 80,
        channels: ['webhook', 'system']
      }
    ]
  })
})
```

### 示例 5: 清理旧通知

```javascript
// 删除 7 天前的已读通知
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

const response = await fetch('/api/user/notifications', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    before: sevenDaysAgo.toISOString()
  })
})

const { message, count } = await response.json()
console.log(`已删除 ${count} 条旧通知`)
```

---

## 🔒 Webhook 签名验证

当配置 Webhook 时，系统会使用 HMAC SHA256 算法对请求进行签名。

### Webhook 请求格式

```http
POST https://your-webhook-url.com/notifications
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256-signature>
User-Agent: Claude-Key-Portal-Webhook/1.0
```

```json
{
  "id": "notif-123",
  "type": "RATE_LIMIT_WARNING",
  "title": "API 速率限制警告",
  "message": "您的 API Key 已达到 90% 速率限制",
  "data": {
    "percentage": 90
  },
  "createdAt": "2025-10-04T10:30:00.000Z"
}
```

### 签名验证示例

#### Node.js 验证

```javascript
const crypto = require('crypto')

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// 使用示例
app.post('/webhooks/notifications', (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const secret = 'my-secret-key-123'

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // 处理通知
  const { type, title, message, data } = req.body
  console.log(`收到通知: ${title}`)

  res.json({ success: true })
})
```

#### Python 验证

```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload, signature, secret):
    payload_str = json.dumps(payload, separators=(',', ':'))
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

# 使用示例 (Flask)
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhooks/notifications', methods=['POST'])
def handle_notification():
    signature = request.headers.get('X-Webhook-Signature')
    secret = 'my-secret-key-123'

    if not verify_webhook_signature(request.json, signature, secret):
        return {'error': 'Invalid signature'}, 401

    # 处理通知
    data = request.json
    print(f"收到通知: {data['title']}")

    return {'success': True}
```

---

## 📞 常见问题

### Q: 如何知道通知是否发送成功？

A: 查看通知的 `status` 字段：
- `PENDING`: 等待发送
- `SENT`: 发送成功
- `FAILED`: 发送失败（`error` 字段包含错误信息）

### Q: Webhook 一直失败怎么办？

A: 检查以下几点：
1. URL 必须使用 HTTPS
2. 服务器响应时间应在 10 秒内
3. 返回 2xx 状态码
4. 正确验证签名

### Q: 可以自定义邮件模板吗？

A: 当前版本使用固定模板，自定义模板功能计划在未来版本实现。

### Q: 通知会保留多久？

A: 通知永久保留，除非用户手动删除。建议定期清理已读通知。

### Q: 如何避免通知轰炸？

A: 使用规则配置控制通知频率，或禁用不需要的通知类型。

---

## 🚀 最佳实践

### 1. 合理配置通知渠道

- **邮件**: 用于重要通知（密钥创建、删除）
- **Webhook**: 用于系统集成和自动化
- **系统内**: 用于非紧急提醒

### 2. 设置合适的阈值

```json
{
  "type": "RATE_LIMIT_WARNING",
  "threshold": 80,  // 80% 时提醒，留有处理时间
  "channels": ["email", "system"]
}
```

### 3. 定期清理通知

每周或每月清理已读通知，保持系统整洁：

```javascript
// 删除 30 天前的已读通知
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

await fetch('/api/user/notifications', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    before: thirtyDaysAgo.toISOString()
  })
})
```

### 4. Webhook 错误处理

在 Webhook 接收端实现重试逻辑：

```javascript
async function handleNotification(notification, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await processNotification(notification)
      return true
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(Math.pow(2, i) * 1000)  // 指数退避
    }
  }
}
```

---

**版本**: v1.0
**维护者**: Claude Key Portal Team
**文档更新**: 2025-10-04

---

_"清晰的 API 文档，是开发者的最好伙伴！"_
