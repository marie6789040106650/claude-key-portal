# Sprint 7 API 端点文档

> **Sprint**: 7 - API Key 到期提醒系统
> **日期**: 2025-10-04
> **状态**: ✅ 完成

---

## 📋 目录

1. [API Key 到期时间管理](#api-key-到期时间管理)
2. [用户提醒配置管理](#用户提醒配置管理)

---

## API Key 到期时间管理

### PATCH /api/keys/[id]

更新 API Key 的到期时间。

**认证**: 需要 JWT Token
**权限**: 只能修改自己的密钥

#### 请求参数

**URL 参数**:
- `id` (string, required): API Key ID

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**:
```typescript
{
  expiresAt?: string | null  // ISO 8601 日期时间格式，null表示永不过期
}
```

**字段说明**:
- `expiresAt`:
  - ISO 8601 格式：`"2025-12-31T23:59:59.000Z"`
  - 不能设置为过去的时间
  - `null` 表示清除到期时间（永不过期）
  - 可选字段，不传则不修改

#### 响应

**成功响应 (200 OK)**:
```typescript
{
  "key": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "crsKeyId": "crs-key-456",
    "name": "Production API Key",
    "keyPrefix": "sk-proj-",
    "keyMasked": "sk-proj-****AB12",
    "description": "Production environment key",
    "status": "ACTIVE",
    "tags": ["production", "api"],
    "monthlyLimit": 1000000,
    "monthlyUsage": 45000,
    "totalTokens": 2500000,
    "totalRequests": 15000,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastUsedAt": "2025-10-04T08:30:00.000Z",
    "expiresAt": "2025-12-31T23:59:59.000Z"  // 新设置的到期时间
  }
}
```

**错误响应**:

- **400 Bad Request** - 无效的到期时间
  ```json
  {
    "error": "到期时间不能设置为过去"
  }
  ```
  或
  ```json
  {
    "error": "无效的日期格式"
  }
  ```

- **401 Unauthorized** - 未认证
  ```json
  {
    "error": "Token已过期"
  }
  ```

- **403 Forbidden** - 无权操作
  ```json
  {
    "error": "无权限操作此密钥"
  }
  ```

- **404 Not Found** - 密钥不存在
  ```json
  {
    "error": "密钥不存在"
  }
  ```

#### 示例

**设置到期时间**:
```bash
curl -X PATCH https://api.example.com/api/keys/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "expiresAt": "2025-12-31T23:59:59.000Z"
  }'
```

**更新到期时间**:
```bash
curl -X PATCH https://api.example.com/api/keys/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "expiresAt": "2026-06-30T23:59:59.000Z"
  }'
```

**清除到期时间（设为永不过期）**:
```bash
curl -X PATCH https://api.example.com/api/keys/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "expiresAt": null
  }'
```

**同时修改多个字段**:
```bash
curl -X PATCH https://api.example.com/api/keys/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Key (Renewed)",
    "description": "Renewed until end of 2025",
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "tags": ["production", "api", "renewed"]
  }'
```

#### 验证规则

1. **日期格式验证**:
   - 必须是有效的 ISO 8601 日期时间格式
   - 例如：`"2025-12-31T23:59:59.000Z"`

2. **时间范围验证**:
   - 不能设置为过去的时间
   - 必须大于当前时间

3. **null 值处理**:
   - `null` 表示清除到期时间
   - 密钥将永不过期

4. **权限验证**:
   - 只能修改自己的密钥
   - 已删除的密钥不能修改

---

## 用户提醒配置管理

### GET /api/user/expiration-settings

获取当前用户的到期提醒配置。

**认证**: 需要 JWT Token

#### 请求参数

**Headers**:
```
Authorization: Bearer {token}
```

#### 响应

**成功响应 (200 OK)**:
```typescript
{
  "id": "setting-123",
  "userId": "user-456",
  "reminderDays": [7, 3, 1],        // 提前提醒的天数列表（降序）
  "notifyChannels": ["email", "system"],  // 通知渠道列表
  "enabled": true,                   // 是否启用提醒
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-10-04T10:00:00.000Z"
}
```

**字段说明**:
- `reminderDays`: 提前提醒的天数数组
  - 默认：`[7, 3, 1]` (7天、3天、1天前提醒)
  - 范围：1-30天
  - 自动去重并降序排序

- `notifyChannels`: 通知渠道数组
  - 可选值：`["email", "webhook", "system"]`
  - 默认：`["system"]`

- `enabled`: 是否启用提醒
  - `true`: 启用（发送提醒）
  - `false`: 禁用（不发送提醒）

**首次获取自动创建**:
如果用户还没有配置，系统会自动创建默认配置并返回。

**错误响应**:

- **401 Unauthorized** - 未认证
  ```json
  {
    "error": "请先登录"
  }
  ```

- **500 Internal Server Error** - 服务器错误
  ```json
  {
    "error": "系统错误，请稍后重试"
  }
  ```

#### 示例

```bash
curl -X GET https://api.example.com/api/user/expiration-settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### PUT /api/user/expiration-settings

更新当前用户的到期提醒配置。

**认证**: 需要 JWT Token

#### 请求参数

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**:
```typescript
{
  reminderDays?: number[],      // 可选：提前提醒的天数列表
  notifyChannels?: string[],    // 可选：通知渠道列表
  enabled?: boolean              // 可选：是否启用提醒
}
```

**字段说明**:
- `reminderDays` (可选):
  - 每个值范围：1-30
  - 至少需要1个值
  - 会自动去重并降序排序
  - 例如：`[7, 3, 1, 3]` → `[7, 3, 1]`

- `notifyChannels` (可选):
  - 有效值：`"email"`, `"webhook"`, `"system"`
  - 至少需要1个渠道
  - 例如：`["email", "system"]`

- `enabled` (可选):
  - `true`: 启用提醒
  - `false`: 禁用提醒

**注意**: 至少需要提供一个字段进行更新。

#### 响应

**成功响应 (200 OK)**:
```typescript
{
  "id": "setting-123",
  "userId": "user-456",
  "reminderDays": [7, 3, 1],
  "notifyChannels": ["email", "system"],
  "enabled": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-10-04T10:30:00.000Z"  // 更新时间
}
```

**错误响应**:

- **400 Bad Request** - 验证失败
  ```json
  {
    "error": "提醒天数必须在 1-30 之间"
  }
  ```
  或
  ```json
  {
    "error": "至少需要设置一个提醒天数"
  }
  ```
  或
  ```json
  {
    "error": "至少需要选择一个通知渠道"
  }
  ```
  或
  ```json
  {
    "error": "无效的通知渠道，只支持 email、webhook、system"
  }
  ```
  或
  ```json
  {
    "error": "JSON格式不正确"
  }
  ```

- **401 Unauthorized** - 未认证
  ```json
  {
    "error": "Token已过期"
  }
  ```

- **500 Internal Server Error** - 服务器错误
  ```json
  {
    "error": "系统错误，请稍后重试"
  }
  ```

#### 示例

**更新提醒天数**:
```bash
curl -X PUT https://api.example.com/api/user/expiration-settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "reminderDays": [14, 7, 3, 1]
  }'
```

**更新通知渠道**:
```bash
curl -X PUT https://api.example.com/api/user/expiration-settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "notifyChannels": ["email", "webhook", "system"]
  }'
```

**禁用提醒**:
```bash
curl -X PUT https://api.example.com/api/user/expiration-settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

**同时更新多个字段**:
```bash
curl -X PUT https://api.example.com/api/user/expiration-settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "reminderDays": [30, 14, 7, 3, 1],
    "notifyChannels": ["email", "system"],
    "enabled": true
  }'
```

#### 验证规则

1. **reminderDays 验证**:
   - 每个值必须是整数
   - 范围：1-30
   - 至少需要1个值
   - 自动去重
   - 自动降序排序

2. **notifyChannels 验证**:
   - 只接受：`email`、`webhook`、`system`
   - 至少需要1个渠道
   - 无效渠道会被拒绝

3. **enabled 验证**:
   - 只接受布尔值：`true` 或 `false`

---

## 🔔 通知消息格式

### KEY_EXPIRATION_WARNING 通知

当 API Key 即将到期时，系统会发送此类型的通知。

#### 通知数据结构

```typescript
{
  userId: string,
  type: 'KEY_EXPIRATION_WARNING',
  title: 'API Key 即将到期',
  message: string,  // 根据剩余天数生成
  data: {
    apiKeyId: string,
    apiKeyName: string,
    daysRemaining: number,
    expiresAt: string  // ISO 8601 格式
  }
}
```

#### 消息内容示例

**7天前提醒**:
```
您的 API Key "Production API Key" 将在 7 天后到期，请及时续期。
```

**3天前提醒**:
```
您的 API Key "Production API Key" 将在 3 天后到期，请及时续期。
```

**1天前提醒**:
```
您的 API Key "Production API Key" 将在 1 天后到期，请及时续期！
```

#### 邮件通知示例

**Subject**: `API Key 即将到期`

**Body**:
```html
<html>
  <body>
    <h2>API Key 即将到期提醒</h2>
    <p>您的 API Key "Production API Key" 将在 7 天后到期，请及时续期。</p>

    <table>
      <tr>
        <td><strong>密钥名称:</strong></td>
        <td>Production API Key</td>
      </tr>
      <tr>
        <td><strong>剩余天数:</strong></td>
        <td>7 天</td>
      </tr>
      <tr>
        <td><strong>到期时间:</strong></td>
        <td>2025-10-11T00:00:00.000Z</td>
      </tr>
    </table>

    <p>
      <a href="https://portal.example.com/keys">立即续期</a>
    </p>
  </body>
</html>
```

---

## 🔄 业务流程

### 到期检查流程

```
1. 定时任务触发 (每日09:00)
   ↓
2. ExpirationCheckService.checkExpirations()
   ↓
3. 查询所有有到期时间且未过期的密钥
   ↓
4. 对每个密钥：
   ├─ 获取用户提醒配置
   ├─ 计算剩余天数
   ├─ 检查是否匹配提醒天数 (7, 3, 1)
   ├─ 检查是否已发送过该阶段提醒
   ├─ 发送多渠道通知 (email, webhook, system)
   └─ 创建提醒记录（防止重复发送）
   ↓
5. 完成
```

### 提醒配置流程

```
用户首次访问
   ↓
GET /api/user/expiration-settings
   ↓
配置不存在？
   ├─ 是 → 创建默认配置 → 返回
   └─ 否 → 直接返回现有配置

用户修改配置
   ↓
PUT /api/user/expiration-settings
   ↓
验证输入
   ├─ reminderDays: 1-30, 至少1个
   ├─ notifyChannels: email/webhook/system, 至少1个
   └─ enabled: boolean
   ↓
更新配置
   ├─ 去重提醒天数
   ├─ 降序排序
   └─ 保存到数据库
   ↓
返回更新后的配置
```

---

## 📊 数据模型

### ExpirationSetting

```prisma
model ExpirationSetting {
  id             String   @id @default(uuid())
  userId         String   @unique
  reminderDays   Int[]    @default([7, 3, 1])
  notifyChannels String[] @default(["system"])
  enabled        Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  user           User     @relation(...)
}
```

### ExpirationReminder

```prisma
model ExpirationReminder {
  id           String   @id @default(uuid())
  apiKeyId     String
  reminderDays Int
  sentAt       DateTime @default(now())
  apiKey       ApiKey   @relation(...)

  @@unique([apiKeyId, reminderDays])
}
```

### ApiKey (扩展)

```prisma
model ApiKey {
  // ... existing fields
  expiresAt           DateTime?
  expirationReminders ExpirationReminder[]

  @@index([expiresAt])
}
```

---

## 🔐 权限说明

### API Key 到期时间管理
- **修改权限**: 仅密钥所有者
- **查看权限**: 通过 GET /api/keys/[id] 查看

### 提醒配置管理
- **修改权限**: 仅当前用户
- **查看权限**: 仅当前用户

---

## ⚠️ 注意事项

1. **时区处理**:
   - 所有时间使用 UTC 时区
   - 前端需要根据用户时区显示

2. **提醒去重**:
   - 同一密钥同一阶段只发送一次提醒
   - 通过 unique 约束保证

3. **配置缓存**:
   - 提醒配置可能被缓存
   - 修改后立即生效于下次检查

4. **默认配置**:
   - 首次访问自动创建
   - 默认值：7、3、1天，系统通知

5. **通知发送**:
   - 异步发送，不阻塞检查流程
   - 失败时不创建提醒记录（下次重试）

---

**文档版本**: v1.0
**最后更新**: 2025-10-04
**维护者**: Claude Key Portal Team
