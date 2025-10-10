# 保留但未使用的资源

**目的**: 记录项目中保留但暂未使用的资源，避免误删或重复创建

**创建日期**: 2025-10-10
**更新策略**: 当资源开始使用时，从此文档移除该项

---

## 📦 数据库表

### UsageRecord（使用记录表）

**状态**: 已创建，未使用

**原因**:
- 调用日志查询功能属于 P2 功能（V1.5）
- MVP 不需要本地存储调用记录
- 应该直接从 CRS 获取实时数据

**Schema**:
```prisma
model UsageRecord {
  id               String   @id @default(uuid())
  apiKeyId         String
  model            String
  endpoint         String
  method           String
  promptTokens     Int
  completionTokens Int
  totalTokens      Int
  duration         Int
  status           Int
  errorCode        String?
  errorMessage     String?  @db.Text
  metadata         Json?
  timestamp        DateTime @default(now())
  apiKey           ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  @@index([apiKeyId])
  @@index([timestamp])
  @@index([model])
  @@index([status])
  @@map("usage_records")
}
```

**使用时机**:
- P2 开发时
- 需要离线日志查询时
- 需要高级数据分析时

---

### DailyStatistics（日统计表）

**状态**: 已创建，未使用

**原因**:
- 本地统计聚合属于 P2 优化功能
- MVP 直接从 CRS 获取实时统计即可
- 避免数据不一致问题

**Schema**:
```prisma
model DailyStatistics {
  id              String   @id @default(uuid())
  date            DateTime @db.Date
  totalUsers      Int      @default(0)
  activeUsers     Int      @default(0)
  newUsers        Int      @default(0)
  totalKeys       Int      @default(0)
  activeKeys      Int      @default(0)
  newKeys         Int      @default(0)
  totalCalls      BigInt   @default(0)
  totalTokens     BigInt   @default(0)
  totalErrors     Int      @default(0)
  avgResponseTime Int      @default(0)
  p95ResponseTime Int      @default(0)
  p99ResponseTime Int      @default(0)
  modelStats      Json     @default("{}")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([date])
  @@index([date])
  @@map("daily_statistics")
}
```

**使用时机**:
- P2 开发时
- CRS 性能不足时（需要缓存）
- 需要离线报告时

---

### PasswordHistory（密码历史表）

**状态**: 已创建，未使用

**原因**:
- 密码历史验证属于安全增强功能（P2）
- MVP 基础密码强度验证已足够
- 增加用户注册复杂度

**Schema**:
```prisma
model PasswordHistory {
  id             String   @id @default(uuid())
  userId         String
  hashedPassword String
  createdAt      DateTime @default(now())
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("password_history")
}
```

**使用时机**:
- P2 安全增强时
- 企业客户要求时
- 合规需求时

---

## 🎨 UI组件

### 监控组件（已移至 archives/future-features/monitor/）

**组件列表**:
- `AlertRuleForm.tsx` (12KB) - 告警规则配置表单
- `AlertsTable.tsx` (9.5KB) - 告警列表展示
- `MetricsChart.tsx` (6.4KB) - 指标图表
- `SystemHealthCard.tsx` (5.3KB) - 系统健康卡片

**状态**: 已实现，未集成

**原因**:
- 监控告警系统属于 P3 功能（V2.0）
- MVP 不需要系统监控
- 用户规模小，人工检查即可

**存储位置**: `archives/future-features/monitor/`

**使用时机**:
- P3 开发时
- 用户规模达到 100+ 时
- 需要自动告警时

---

### 设置组件（已移至 archives/future-features/settings/）

**组件列表**:
- `NotificationsTab.tsx` (6.1KB) - 通知设置
- `ExpirationTab.tsx` (7.6KB) - 过期管理设置

**状态**: 已实现，未集成

**原因**:
- 通知功能属于 P3 功能
- 过期管理可能属于 P2 功能
- MVP 不需要复杂的设置

**存储位置**: `archives/future-features/settings/`

**使用时机**:
- P2/P3 开发时
- 用户反馈需要时
- 功能稳定后添加

---

## 📝 配置文件

暂无保留但未使用的配置文件。

---

## 🔧 工具函数

暂无保留但未使用的工具函数。

---

## 📚 文档

### 已移至 archives/docs/

- `PROJECT_CLEANUP_REPORT.md` - 旧版清理报告
- `PROJECT_CLEANUP_SUMMARY.md` - 旧版清理总结
- `PROJECT_FINAL_SUMMARY.md` - 旧版最终总结

**原因**: 内容重复，已合并到 `PROJECT_CLEANUP_FINAL.md`

---

## ⚠️ 注意事项

### 为什么保留这些资源？

1. **数据库表**:
   - 已通过 migration 创建
   - 删除需要回滚，有风险
   - 保留表结构不影响性能
   - 未来启用功能时可直接使用

2. **组件**:
   - 已经实现，代码质量良好
   - 移至 archives 便于未来复用
   - 不占用编译体积（未导入）

3. **文档**:
   - 归档保留历史记录
   - 便于回溯开发过程

### 何时启用这些资源？

1. **检查优先级**:
   - P0 功能 100% 完成
   - P1 功能 100% 完成
   - 当前功能稳定运行

2. **确认需求**:
   - 用户明确反馈需要
   - 有明确的使用场景
   - 符合产品路线图

3. **评估成本**:
   - 开发成本
   - 维护成本
   - 用户学习成本

### 清理策略

```
何时删除：
- P3 规划取消该功能
- 明确不会使用
- 有更好的替代方案

删除流程：
1. 在此文档标记为"待删除"
2. 保留一个版本周期（1-2个月）
3. 确认无影响后删除
4. 从此文档移除该项
```

---

## 📊 统计信息

```
保留但未使用的资源统计：

数据库表: 3 张
  - UsageRecord
  - DailyStatistics
  - PasswordHistory

UI组件: 6 个
  - 监控组件: 4 个
  - 设置组件: 2 个

文档: 3 个（已归档）

总占用空间: ~50KB（不含数据库表）
对项目影响: 无（未导入/未引用）
```

---

## 🔄 更新记录

| 日期 | 操作 | 资源 | 原因 |
|------|------|------|------|
| 2025-10-10 | 创建文档 | - | 初始化资源清单 |
| 2025-10-10 | 移至 archives | 监控组件、设置组件 | P3功能，暂不需要 |
| 2025-10-10 | 标记保留 | 3张数据库表 | Migration已执行 |

---

**维护责任**: 项目负责人
**审查周期**: 每个版本发布前
**下次审查**: V1.0 发布前

---

_"保留但不使用，比删除后重建要容易得多"_
