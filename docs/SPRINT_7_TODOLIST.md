# Sprint 7 任务清单 - API Key 到期提醒

> **Sprint**: 7
> **功能**: API Key 到期提醒系统 (API Key Expiration Reminders)
> **分支**: `feature/expiration-reminders` (待创建)
> **状态**: 📋 规划中
> **预计开始**: 2025-10-05

---

## 🎯 Sprint 目标

实现 API Key 到期提醒功能，包括：

1. **到期时间管理**: 支持为 API Key 设置到期时间
2. **自动检查任务**: 定时检查即将到期的 API Key
3. **通知发送**: 集成 Sprint 6 的通知系统发送提醒
4. **提醒配置**: 用户可配置提醒时间（提前多少天）

---

## 📋 任务列表

### 🔴 RED Phase - 编写测试

- [ ] 1. **创建 feature/expiration-reminders 分支**
  - 从 develop 创建新分支
  - 确保基于最新代码

- [ ] 2. **编写 API 测试 - 到期时间管理**
  - PUT /api/keys/:id 更新测试（添加 expiresAt 字段）
  - GET /api/keys 返回测试（验证 expiresAt 和 isExpiring 字段）
  - 验证到期时间格式
  - 验证到期时间不能早于当前时间

- [ ] 3. **编写 API 测试 - 提醒配置**
  - GET /api/user/expiration-settings - 获取提醒配置
  - PUT /api/user/expiration-settings - 更新提醒配置
  - 验证提醒天数范围（1-30 天）
  - 验证默认配置创建

- [ ] 4. **编写服务测试 - 到期检查逻辑**
  - 检查即将到期的 API Key（7 天内）
  - 过滤已发送提醒的 Key
  - 计算剩余天数
  - 生成提醒数据

- [ ] 5. **编写集成测试 - 通知发送**
  - 调用通知服务发送提醒
  - 验证通知内容包含正确信息
  - 验证提醒记录更新

- [ ] 6. **提交 RED Phase**
  - 确保所有测试失败（功能未实现）
  - Git commit: `test: add API key expiration reminder tests (🔴 RED)`

### 🟢 GREEN Phase - 实现功能

- [ ] 7. **数据库模型更新**
  - ApiKey 模型添加 expiresAt 字段（可选）
  - 创建 ExpirationSetting 模型（用户提醒配置）
  - 创建 ExpirationReminder 模型（提醒记录）
  - 运行 Prisma 迁移

- [ ] 8. **实现到期时间管理 API**
  - 更新 PUT /api/keys/:id 支持 expiresAt
  - 更新 GET /api/keys 返回 expiresAt 和 isExpiring
  - 添加到期时间验证逻辑

- [ ] 9. **实现提醒配置 API**
  - GET /api/user/expiration-settings - 返回或创建默认配置
  - PUT /api/user/expiration-settings - 更新配置
  - 验证提醒天数范围

- [ ] 10. **实现到期检查服务**
  - 创建 ExpirationCheckService
  - 实现 checkExpiringKeys() 方法
  - 计算剩余天数逻辑
  - 过滤逻辑（已提醒、已删除等）

- [ ] 11. **集成通知系统**
  - 调用 NotificationService 发送提醒
  - 创建提醒记录防止重复发送
  - 生成通知内容（标题、消息、附加数据）

- [ ] 12. **实现定时任务**
  - 创建检查任务脚本（scripts/check-expiring-keys.ts）
  - 配置执行频率（每日一次）
  - 添加错误处理和日志

- [ ] 13. **提交 GREEN Phase**
  - 确保所有测试通过
  - Git commit: `feat: implement API key expiration reminders (🟢 GREEN)`

### 🔵 REFACTOR Phase - 优化代码

- [ ] 14. **代码审查和优化**
  - 检查代码重复
  - 提取共用逻辑
  - 优化查询性能
  - 添加必要的索引

- [ ] 15. **测试覆盖率检查**
  - 确保覆盖率 > 80%
  - 补充边界情况测试
  - 修复测试问题

- [ ] 16. **性能优化**
  - 优化到期检查查询
  - 批量处理提醒发送
  - 添加缓存（如需要）

- [ ] 17. **提交 REFACTOR Phase**
  - Git commit: `refactor: optimize expiration reminder system (🔵 REFACTOR)`

### 📝 文档和收尾

- [ ] 18. **创建 Sprint 7 SUMMARY**
  - 功能实现总结
  - 测试报告
  - 问题和解决方案
  - 经验教训

- [ ] 19. **创建 API 文档**
  - API_ENDPOINTS_SPRINT7.md
  - 包含所有端点说明
  - 请求/响应示例
  - 定时任务说明

- [ ] 20. **更新 SPRINT_INDEX**
  - 添加 Sprint 7 链接
  - 更新状态为完成

- [ ] 21. **更新 README**
  - 添加到期提醒功能说明
  - 更新测试统计
  - 更新 Sprint 进度

- [ ] 22. **提交文档**
  - Git commit: `docs: add Sprint 7 summary and API documentation`

### 🚀 部署和验证

- [ ] 23. **合并到 develop 分支**
  - 切换到 develop
  - 合并 feature/expiration-reminders
  - 解决冲突（如有）

- [ ] 24. **运行完整测试套件**
  - 确保所有测试通过
  - 检查覆盖率

- [ ] 25. **配置定时任务**
  - 添加 cron 配置（生产环境）
  - 或使用 Vercel Cron Jobs
  - 验证任务执行

- [ ] 26. **创建 Sprint 8 TODOLIST**
  - 规划下一个 Sprint
  - Git commit: `docs: add Sprint 8 todolist`

---

## 🗂️ 技术设计

### 数据库模型

#### ExpirationSetting (用户提醒配置)

```prisma
model ExpirationSetting {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 提醒配置
  enabled           Boolean  @default(true)
  reminderDays      Int      @default(7)  // 提前多少天提醒（1-30）

  // 时间戳
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

#### ExpirationReminder (提醒记录)

```prisma
model ExpirationReminder {
  id            String   @id @default(cuid())
  apiKeyId      String
  apiKey        ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  // 提醒信息
  remindedAt    DateTime @default(now())
  expiresAt     DateTime  // API Key 到期时间（快照）
  daysRemaining Int       // 剩余天数（快照）

  // 通知 ID（关联 Sprint 6 通知系统）
  notificationId String?

  @@unique([apiKeyId, remindedAt])
  @@index([apiKeyId])
}
```

#### ApiKey 模型更新

```prisma
model ApiKey {
  // ... 现有字段 ...

  expiresAt         DateTime?  // 到期时间（可选）

  // 关系
  expirationReminders ExpirationReminder[]
}
```

### API 端点设计

#### 1. GET /api/user/expiration-settings

获取用户的到期提醒配置。

**响应**:
```json
{
  "id": "setting-123",
  "userId": "user-123",
  "enabled": true,
  "reminderDays": 7
}
```

#### 2. PUT /api/user/expiration-settings

更新用户的到期提醒配置。

**请求**:
```json
{
  "enabled": true,
  "reminderDays": 14
}
```

#### 3. PUT /api/keys/:id

更新 API Key（添加 expiresAt 支持）。

**请求**:
```json
{
  "name": "Production Key",
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

#### 4. GET /api/keys

获取 API Key 列表（添加到期信息）。

**响应**:
```json
{
  "keys": [
    {
      "id": "key-123",
      "name": "Production Key",
      "expiresAt": "2025-12-31T23:59:59.000Z",
      "isExpiring": false,
      "daysRemaining": 90
    }
  ]
}
```

### 服务层设计

#### ExpirationCheckService

```typescript
class ExpirationCheckService {
  /**
   * 检查即将到期的 API Key
   * 返回需要发送提醒的 Key 列表
   */
  async findExpiringKeys(): Promise<ExpiringKey[]> {
    // 1. 获取所有启用提醒的用户配置
    // 2. 查找未到期但即将到期的 Key
    // 3. 过滤已发送提醒的 Key（24小时内不重复）
    // 4. 计算剩余天数
    // 5. 返回结果
  }

  /**
   * 发送到期提醒
   */
  async sendExpirationReminders(): Promise<void> {
    const expiringKeys = await this.findExpiringKeys()

    for (const key of expiringKeys) {
      // 1. 调用 NotificationService 发送通知
      // 2. 创建 ExpirationReminder 记录
      // 3. 错误处理
    }
  }

  /**
   * 计算剩余天数
   */
  private calculateDaysRemaining(expiresAt: Date): number {
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }
}
```

### 定时任务

#### scripts/check-expiring-keys.ts

```typescript
import { ExpirationCheckService } from '@/lib/services/expiration-check-service'

async function main() {
  console.log('开始检查即将到期的 API Key...')

  const service = new ExpirationCheckService()

  try {
    await service.sendExpirationReminders()
    console.log('检查完成')
  } catch (error) {
    console.error('检查失败:', error)
    process.exit(1)
  }
}

main()
```

#### package.json

```json
{
  "scripts": {
    "check-expiring-keys": "tsx scripts/check-expiring-keys.ts"
  }
}
```

#### Vercel Cron (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring-keys",
      "schedule": "0 9 * * *"
    }
  ]
}
```

或使用 API Route:

```typescript
// app/api/cron/check-expiring-keys/route.ts
export async function GET(request: NextRequest) {
  // 验证 Cron Secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = new ExpirationCheckService()
  await service.sendExpirationReminders()

  return NextResponse.json({ success: true })
}
```

### 通知内容设计

#### 提醒通知

**类型**: `KEY_EXPIRING`

**示例**:

```json
{
  "type": "KEY_EXPIRING",
  "title": "API Key 即将到期",
  "message": "您的 API Key \"Production Key\" 将在 7 天后到期",
  "data": {
    "keyId": "key-123",
    "keyName": "Production Key",
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "daysRemaining": 7
  }
}
```

---

## 🧪 测试策略

### 单元测试

1. **API 测试**
   - 到期时间设置和验证
   - 提醒配置 CRUD
   - 边界情况（过去时间、无效格式）

2. **服务测试**
   - 到期检查逻辑
   - 剩余天数计算
   - 提醒发送逻辑
   - 重复提醒过滤

### 集成测试

1. **端到端流程**
   - 设置到期时间
   - 触发检查任务
   - 验证通知发送
   - 验证提醒记录创建

2. **定时任务测试**
   - 手动执行脚本
   - 验证日志输出
   - 验证错误处理

---

## 📊 验收标准

### 功能验收

- [ ] ✅ 用户可以为 API Key 设置到期时间
- [ ] ✅ 用户可以配置提醒天数（1-30 天）
- [ ] ✅ 系统每日自动检查即将到期的 Key
- [ ] ✅ 发送通知到用户配置的渠道
- [ ] ✅ 不重复发送提醒（24小时内）
- [ ] ✅ API Key 列表显示到期状态

### 质量验收

- [ ] ✅ 测试覆盖率 > 80%
- [ ] ✅ 所有测试通过
- [ ] ✅ TypeScript 类型完整
- [ ] ✅ 错误处理完善
- [ ] ✅ 性能优化（批量处理）

### 文档验收

- [ ] ✅ API 文档完整
- [ ] ✅ Sprint SUMMARY 详细
- [ ] ✅ 定时任务配置说明
- [ ] ✅ 使用示例清晰

---

## 💡 技术亮点

1. **智能提醒**: 根据用户配置的天数提前提醒
2. **防重复机制**: 24小时内不重复发送相同提醒
3. **批量处理**: 高效处理大量 API Key 检查
4. **灵活配置**: 用户可自定义提醒时间
5. **通知集成**: 复用 Sprint 6 的多渠道通知系统
6. **定时任务**: 自动化每日检查，无需手动干预

---

## 🎓 预期挑战

### 1. 时区处理

**问题**: 用户可能在不同时区，到期时间需要准确

**解决**:
- 统一使用 UTC 时间存储
- 前端显示时转换为用户时区
- 计算剩余天数时使用 UTC

### 2. 重复提醒控制

**问题**: 避免短时间内多次发送相同提醒

**解决**:
- 使用 ExpirationReminder 表记录提醒历史
- 查询时过滤 24 小时内已提醒的 Key
- 考虑使用 Redis 缓存提高性能

### 3. 大量 Key 的性能

**问题**: 系统中可能有成千上万个 API Key

**解决**:
- 使用数据库索引优化查询
- 分批处理（每批 100 个）
- 异步发送通知
- 考虑使用消息队列（未来）

### 4. 定时任务可靠性

**问题**: 确保定时任务稳定执行

**解决**:
- 添加完整的错误处理和日志
- 使用 Vercel Cron（云端可靠性高）
- 或使用外部 Cron 服务（如 cron-job.org）
- 添加任务执行监控

---

## 📅 时间规划

| 阶段 | 预计时间 | 任务 |
|------|---------|------|
| 🔴 RED | 2-3 小时 | 编写所有测试用例 |
| 🟢 GREEN | 4-5 小时 | 实现所有功能 |
| 🔵 REFACTOR | 1-2 小时 | 优化和重构 |
| 📝 文档 | 1-2 小时 | 编写文档 |
| 🚀 部署 | 1 小时 | 合并和配置 |
| **总计** | **9-13 小时** | **完整 Sprint** |

---

## 🔗 参考资源

- [Sprint 6 通知系统](./SPRINT_6_SUMMARY.md)
- [API 文档规范](./DOCUMENTATION_STANDARD.md)
- [TDD 工作流](../TDD_GIT_WORKFLOW.md)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Prisma 数据迁移](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**创建时间**: 2025-10-04
**创建者**: Claude Key Portal Team
**下一步**: 创建 feature/expiration-reminders 分支并开始 🔴 RED Phase

---

_"提前提醒，防患未然！"_
