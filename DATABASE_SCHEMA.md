# Claude Key Portal - 数据库结构设计

## 一、数据库选型

### PostgreSQL 15+

- **原因**：
  - 强大的JSON支持（用于灵活存储配置）
  - 完善的事务支持
  - 优秀的性能和扩展性
  - 丰富的索引类型
  - 社区活跃，生态完善

### Redis 7+

- **用途**：
  - Session存储
  - API响应缓存
  - 速率限制计数器
  - 实时数据缓存

## 二、Prisma Schema 定义

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 用户系统
// ============================================

// 用户表
model User {
  id                String    @id @default(uuid())

  // 认证信息
  email             String?   @unique
  phone             String?   @unique
  passwordHash      String

  // 个人信息
  nickname          String?
  avatar            String?
  bio               String?

  // CRS关联
  crsAdminToken     String?   @db.Text // CRS管理员Token

  // 偏好设置
  preferences       Json      @default("{}")
  // 示例结构：
  // {
  //   "language": "zh-CN",
  //   "timezone": "Asia/Shanghai",
  //   "theme": "light",
  //   "notifications": {
  //     "email": true,
  //     "webhook": false
  //   }
  // }

  // 状态
  status            UserStatus @default(ACTIVE)
  emailVerified     Boolean   @default(false)
  phoneVerified     Boolean   @default(false)

  // 邀请信息
  invitedBy         String?   // 邀请人ID
  inviteCode        String?   @unique // 个人邀请码

  // 时间戳
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?

  // 关系
  apiKeys           ApiKey[]
  sessions          Session[]
  notifications     Notification[]
  auditLogs         AuditLog[]
  invitees          User[]    @relation("UserInvites")
  inviter           User?     @relation("UserInvites", fields: [invitedBy], references: [id])

  @@index([email])
  @@index([phone])
  @@index([inviteCode])
  @@index([createdAt])
  @@map("users")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}

// 会话表
model Session {
  id                String    @id @default(uuid())
  userId            String

  // Token信息
  accessToken       String    @unique @db.Text
  refreshToken      String    @unique @db.Text

  // 设备信息
  deviceId          String?
  deviceName        String?
  ip                String
  userAgent         String    @db.Text
  location          Json?     // {country, region, city}

  // 时间
  createdAt         DateTime  @default(now())
  expiresAt         DateTime
  lastActivityAt    DateTime  @default(now())

  // 关系
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([accessToken])
  @@index([refreshToken])
  @@index([expiresAt])
  @@map("sessions")
}

// ============================================
// API密钥管理
// ============================================

// API密钥表
model ApiKey {
  id                String    @id @default(uuid())
  userId            String

  // CRS关联
  crsKeyId          String    @unique // CRS中的密钥ID
  crsKey            String    @unique // 实际的密钥值（加密存储）

  // 基本信息
  name              String
  description       String?   @db.Text
  tags              String[]  @default([])

  // 配置
  config            Json      @default("{}")
  // 示例结构：
  // {
  //   "limits": {
  //     "rateLimit": 60,
  //     "dailyQuota": 10000,
  //     "monthlyQuota": 300000
  //   },
  //   "allowedModels": ["claude-3-sonnet", "claude-3-haiku"],
  //   "ipWhitelist": ["1.2.3.4", "5.6.7.0/24"],
  //   "refererWhitelist": ["https://example.com"]
  // }

  // 状态
  status            ApiKeyStatus @default(ACTIVE)

  // 统计信息（定期从CRS同步）
  totalCalls        BigInt    @default(0)
  totalTokens       BigInt    @default(0)
  lastUsedAt        DateTime?

  // 时间
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  expiresAt         DateTime? // 过期时间

  // 关系
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  usageRecords      UsageRecord[]

  @@index([userId])
  @@index([crsKeyId])
  @@index([status])
  @@index([createdAt])
  @@index([lastUsedAt])
  @@map("api_keys")
}

enum ApiKeyStatus {
  ACTIVE
  INACTIVE
  EXPIRED
  DELETED
  RATE_LIMITED
}

// 使用记录表（定期从CRS同步）
model UsageRecord {
  id                String    @id @default(uuid())
  apiKeyId          String

  // 请求信息
  model             String
  endpoint          String
  method            String

  // Token使用
  promptTokens      Int
  completionTokens  Int
  totalTokens       Int

  // 性能
  duration          Int       // 毫秒
  status            Int       // HTTP状态码

  // 错误信息
  errorCode         String?
  errorMessage      String?   @db.Text

  // 元数据
  metadata          Json?
  // {
  //   "ip": "1.2.3.4",
  //   "userAgent": "...",
  //   "referer": "..."
  // }

  // 时间
  timestamp         DateTime  @default(now())

  // 关系
  apiKey            ApiKey    @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  @@index([apiKeyId])
  @@index([timestamp])
  @@index([model])
  @@index([status])
  @@map("usage_records")
}

// ============================================
// 通知系统
// ============================================

// 通知配置表
model NotificationConfig {
  id                String    @id @default(uuid())
  userId            String    @unique

  // 渠道配置
  channels          Json
  // {
  //   "email": {
  //     "enabled": true,
  //     "address": "user@example.com",
  //     "verified": true
  //   },
  //   "webhook": {
  //     "enabled": false,
  //     "url": "https://...",
  //     "secret": "..."
  //   },
  //   "sms": {
  //     "enabled": false,
  //     "phone": "+86...",
  //     "verified": false
  //   }
  // }

  // 通知规则
  rules             Json      @default("[]")
  // [
  //   {
  //     "id": "rule_1",
  //     "name": "速率限制告警",
  //     "trigger": {
  //       "type": "rate_limit",
  //       "condition": "rate > threshold",
  //       "threshold": 80
  //     },
  //     "channels": ["email", "webhook"],
  //     "enabled": true
  //   }
  // ]

  // 时间
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@map("notification_configs")
}

// 通知记录表
model Notification {
  id                String    @id @default(uuid())
  userId            String

  // 通知内容
  type              NotificationType
  title             String
  message           String    @db.Text
  data              Json?     // 额外数据

  // 发送状态
  channel           String    // email, webhook, sms
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

// ============================================
// 数据导出
// ============================================

// 导出任务表
model ExportTask {
  id                String    @id @default(uuid())
  userId            String

  // 任务配置
  type              ExportType
  format            ExportFormat
  filters           Json      // 导出筛选条件
  fields            String[]  // 导出字段

  // 状态
  status            ExportStatus @default(PROCESSING)
  progress          Int       @default(0) // 0-100

  // 结果
  fileUrl           String?
  fileSize          BigInt?   // 字节
  recordCount       Int?
  expiresAt         DateTime? // 下载链接过期时间

  // 错误
  error             String?   @db.Text

  // 时间
  createdAt         DateTime  @default(now())
  completedAt       DateTime?

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("export_tasks")
}

enum ExportType {
  KEYS
  USAGE
  LOGS
}

enum ExportFormat {
  CSV
  JSON
  EXCEL
}

enum ExportStatus {
  PROCESSING
  COMPLETED
  FAILED
  EXPIRED
}

// ============================================
// 审计日志
// ============================================

// 审计日志表
model AuditLog {
  id                String    @id @default(uuid())
  userId            String?   // 可能是系统操作

  // 操作信息
  action            String    // create_key, delete_key, login, etc.
  resource          String    // keys, users, sessions, etc.
  resourceId        String?

  // 详细信息
  details           Json?
  // {
  //   "before": {...},
  //   "after": {...},
  //   "changes": [...]
  // }

  // 元数据
  ip                String
  userAgent         String    @db.Text

  // 结果
  status            String    // success, failed
  error             String?   @db.Text

  // 时间
  timestamp         DateTime  @default(now())

  // 关系
  user              User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([timestamp])
  @@map("audit_logs")
}

// ============================================
// 系统配置
// ============================================

// 系统配置表
model SystemConfig {
  id                String    @id @default(uuid())

  // 配置键值
  key               String    @unique
  value             Json

  // 元数据
  description       String?   @db.Text
  category          String    // general, feature, limit, etc.

  // 时间
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([category])
  @@map("system_configs")
}

// ============================================
// 统计数据（聚合表）
// ============================================

// 日统计表
model DailyStatistics {
  id                String    @id @default(uuid())
  date              DateTime  @db.Date

  // 全局统计
  totalUsers        Int       @default(0)
  activeUsers       Int       @default(0)
  newUsers          Int       @default(0)

  totalKeys         Int       @default(0)
  activeKeys        Int       @default(0)
  newKeys           Int       @default(0)

  totalCalls        BigInt    @default(0)
  totalTokens       BigInt    @default(0)
  totalErrors       Int       @default(0)

  // 性能指标
  avgResponseTime   Int       @default(0) // 毫秒
  p95ResponseTime   Int       @default(0)
  p99ResponseTime   Int       @default(0)

  // 模型分布
  modelStats        Json      @default("{}")
  // {
  //   "claude-3-opus": { calls: 1000, tokens: 100000 },
  //   "claude-3-sonnet": { calls: 2000, tokens: 150000 }
  // }

  // 时间
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([date])
  @@index([date])
  @@map("daily_statistics")
}
```

## 三、索引策略

### 1. 主键索引

所有表都使用 UUID 作为主键，PostgreSQL 自动创建 B-Tree 索引。

### 2. 唯一索引

```sql
-- 用户表
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX idx_users_invite_code ON users(invite_code) WHERE invite_code IS NOT NULL;

-- 会话表
CREATE UNIQUE INDEX idx_sessions_access_token ON sessions(access_token);
CREATE UNIQUE INDEX idx_sessions_refresh_token ON sessions(refresh_token);

-- API密钥表
CREATE UNIQUE INDEX idx_api_keys_crs_key_id ON api_keys(crs_key_id);
CREATE UNIQUE INDEX idx_api_keys_crs_key ON api_keys(crs_key);
```

### 3. 复合索引

```sql
-- 使用记录查询优化
CREATE INDEX idx_usage_records_key_time ON usage_records(api_key_id, timestamp DESC);
CREATE INDEX idx_usage_records_key_model ON usage_records(api_key_id, model);

-- 审计日志查询优化
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id, timestamp DESC);

-- 通知查询优化
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status, created_at DESC);
```

### 4. 部分索引

```sql
-- 仅索引活跃密钥
CREATE INDEX idx_active_keys ON api_keys(user_id, created_at DESC)
WHERE status = 'ACTIVE';

-- 仅索引未读通知
CREATE INDEX idx_unread_notifications ON notifications(user_id, created_at DESC)
WHERE read_at IS NULL;

-- 仅索引失败的任务
CREATE INDEX idx_failed_exports ON export_tasks(user_id, created_at DESC)
WHERE status = 'FAILED';
```

### 5. JSON 索引

```sql
-- 用户偏好语言
CREATE INDEX idx_users_language ON users USING GIN ((preferences->'language'));

-- 密钥配置的模型
CREATE INDEX idx_keys_models ON api_keys USING GIN ((config->'allowedModels'));

-- 使用记录的元数据
CREATE INDEX idx_usage_metadata ON usage_records USING GIN (metadata);
```

## 四、数据加密策略

### 1. 密码加密

```typescript
import bcrypt from 'bcrypt'

// 注册时加密密码
const saltRounds = 10
const passwordHash = await bcrypt.hash(password, saltRounds)

// 登录时验证密码
const isValid = await bcrypt.compare(password, user.passwordHash)
```

### 2. API密钥加密

```typescript
import crypto from 'crypto'

// 加密配置
const algorithm = 'aes-256-gcm'
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32字节

// 加密密钥
function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // 格式: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

// 解密密钥
function decryptApiKey(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

### 3. 敏感信息脱敏

```typescript
// 邮箱脱敏
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const maskedLocal = local[0] + '***' + local[local.length - 1]
  return `${maskedLocal}@${domain}`
}

// 手机号脱敏
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// API密钥脱敏
function maskApiKey(key: string): string {
  if (key.length <= 8) return '***'
  return `${key.slice(0, 4)}...${key.slice(-4)}`
}
```

## 五、数据迁移策略

### 1. 版本控制

```typescript
// prisma/migrations/
// 20250101000000_init/
// 20250102000000_add_invites/
// 20250103000000_add_notifications/
```

### 2. 迁移脚本示例

```sql
-- 20250101000000_init/migration.sql
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

### 3. 数据种子

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建系统配置
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'max_keys_per_user',
        value: { value: 10 },
        category: 'limit',
        description: '每个用户最多可创建的密钥数量',
      },
      {
        key: 'default_rate_limit',
        value: { value: 60 },
        category: 'limit',
        description: '默认速率限制（请求/分钟）',
      },
    ],
  })

  // 创建管理员账户
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      nickname: 'Admin',
      emailVerified: true,
      inviteCode: 'ADMIN123',
    },
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## 六、数据备份策略

### 1. 自动备份脚本

```bash
#!/bin/bash
# backup.sh

# 配置
BACKUP_DIR="/var/backups/postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATABASE="claude_portal"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -U postgres -d $DATABASE -F c -f $BACKUP_DIR/${DATABASE}_${TIMESTAMP}.dump

# 压缩备份
gzip $BACKUP_DIR/${DATABASE}_${TIMESTAMP}.dump

# 删除旧备份
find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

# 上传到云存储（可选）
# aws s3 cp $BACKUP_DIR/${DATABASE}_${TIMESTAMP}.dump.gz s3://backups/
```

### 2. 定时任务

```cron
# crontab -e

# 每天凌晨2点执行备份
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1

# 每周日凌晨3点执行完整备份
0 3 * * 0 /path/to/full_backup.sh >> /var/log/backup.log 2>&1
```

### 3. 恢复脚本

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# 解压备份
gunzip -c $BACKUP_FILE > /tmp/restore.dump

# 恢复数据库
pg_restore -U postgres -d claude_portal -c /tmp/restore.dump

# 清理
rm /tmp/restore.dump

echo "Restore completed"
```

## 七、性能优化建议

### 1. 连接池配置

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // 连接池配置
  pool_size = 20
  pool_timeout = 30
  connection_timeout = 10
}
```

### 2. 查询优化

```typescript
// 使用 select 减少数据传输
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    nickname: true,
    // 不查询 passwordHash
  },
})

// 使用 include 避免 N+1 查询
const keys = await prisma.apiKey.findMany({
  include: {
    user: {
      select: {
        id: true,
        email: true,
      },
    },
  },
})

// 使用分页
const keys = await prisma.apiKey.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: {
    createdAt: 'desc',
  },
})
```

### 3. 批量操作

```typescript
// 批量插入
await prisma.usageRecord.createMany({
  data: records,
  skipDuplicates: true,
})

// 批量更新
await prisma.$transaction(
  keys.map((key) =>
    prisma.apiKey.update({
      where: { id: key.id },
      data: { status: 'INACTIVE' },
    })
  )
)
```

## 八、数据归档策略

### 1. 归档规则

```typescript
// 每月归档上月数据
async function archiveOldRecords() {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  // 归档使用记录
  await prisma.$executeRaw`
    INSERT INTO usage_records_archive
    SELECT * FROM usage_records
    WHERE timestamp < ${lastMonth}
  `

  // 删除已归档数据
  await prisma.usageRecord.deleteMany({
    where: {
      timestamp: {
        lt: lastMonth,
      },
    },
  })
}
```

### 2. 归档表结构

```sql
-- 归档表（使用分区表）
CREATE TABLE usage_records_archive (
  LIKE usage_records INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- 按月分区
CREATE TABLE usage_records_2024_01 PARTITION OF usage_records_archive
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE usage_records_2024_02 PARTITION OF usage_records_archive
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

---

更新时间: 2025-01-01
版本: v1.0.0
