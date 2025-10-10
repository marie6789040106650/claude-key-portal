# Sprint 8 Todolist: 定时任务和自动化

> **Sprint**: 8 - Cron Job定时任务系统
> **创建时间**: 2025-10-04
> **状态**: 📋 待开始
> **预计工期**: 3-4 天

---

## 🎯 Sprint 目标

实现定时任务系统，自动执行：
- API Key 到期检查和提醒
- 使用统计数据同步
- 过期密钥自动清理
- 系统健康检查

---

## 📋 任务清单

### Phase 1: 基础设施搭建

#### 🔴 RED: 编写测试（第1天）

- [ ] **创建 feature/cron-jobs 分支**
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/cron-jobs
  ```

- [ ] **Cron Job 执行器测试**
  - [ ] `tests/unit/cron/cron-runner.test.ts`
    - 应该能够注册和执行定时任务
    - 应该能够处理并发任务
    - 应该能够记录执行日志
    - 应该能够处理任务失败

- [ ] **到期检查任务测试**
  - [ ] `tests/unit/cron/expiration-check.test.ts`
    - 应该在每日09:00执行
    - 应该调用 ExpirationCheckService
    - 应该记录执行结果
    - 应该在失败时发送告警

- [ ] **数据同步任务测试**
  - [ ] `tests/unit/cron/data-sync.test.ts`
    - 应该定期从CRS同步使用数据
    - 应该更新本地统计缓存
    - 应该处理CRS不可用情况

- [ ] **清理任务测试**
  - [ ] `tests/unit/cron/cleanup.test.ts`
    - 应该删除过期的ExpirationReminder记录
    - 应该删除过期的Session记录
    - 应该删除旧的AuditLog记录

- [ ] **提交 RED Phase**
  ```bash
  git add tests/unit/cron/
  git commit -m "test: Sprint 8 - Cron Job定时任务测试 (🔴 RED)"
  ```

#### 🟢 GREEN: 实现功能（第2-3天）

- [ ] **Cron Runner 实现**
  - [ ] `lib/cron/cron-runner.ts`
    - 使用 node-cron 库
    - 任务注册和调度
    - 错误处理和重试
    - 执行日志记录

- [ ] **到期检查任务**
  - [ ] `lib/cron/jobs/expiration-check.ts`
    - 每日09:00执行
    - 调用 ExpirationCheckService.checkExpirations()
    - 记录检查结果（总数、发送数、失败数）

- [ ] **数据同步任务**
  - [ ] `lib/cron/jobs/data-sync.ts`
    - 每小时执行一次
    - 从CRS同步密钥使用数据
    - 更新本地缓存

- [ ] **清理任务**
  - [ ] `lib/cron/jobs/cleanup.ts`
    - 每日00:00执行
    - 清理90天前的提醒记录
    - 清理过期的Session
    - 清理6个月前的AuditLog

- [ ] **CLI 启动脚本**
  - [ ] `scripts/cron/start.ts`
    - 初始化所有定时任务
    - 信号处理（SIGTERM, SIGINT）
    - 优雅退出

- [ ] **提交 GREEN Phase**
  ```bash
  git add lib/cron/ scripts/cron/
  git commit -m "feat: Sprint 8 - 实现Cron Job定时任务系统 (🟢 GREEN)"
  ```

#### 🔵 REFACTOR: 重构优化（第3天）

- [ ] **代码质量检查**
  - [ ] TypeScript类型检查通过
  - [ ] ESLint通过
  - [ ] 所有测试通过

- [ ] **性能优化**
  - [ ] 添加任务执行超时控制
  - [ ] 优化数据库批量查询
  - [ ] 添加任务队列（避免重复执行）

- [ ] **监控和告警**
  - [ ] 任务执行失败告警
  - [ ] 执行时间过长告警
  - [ ] 执行结果统计

- [ ] **提交 REFACTOR Phase**
  ```bash
  git add .
  git commit -m "refactor: Sprint 8 - Cron Job优化和监控 (🔵 REFACTOR)"
  ```

---

### Phase 2: 部署配置（第4天）

- [ ] **环境配置**
  - [ ] 添加 `.env` 配置项
    ```bash
    # Cron Job配置
    ENABLE_CRON=true
    EXPIRATION_CHECK_CRON=0 9 * * *
    DATA_SYNC_CRON=0 * * * *
    CLEANUP_CRON=0 0 * * *
    ```

- [ ] **Docker支持**
  - [ ] 更新 `Dockerfile`
    - 添加cron脚本启动
    - 多进程管理（主应用 + cron）

  - [ ] 更新 `docker-compose.yml`
    - 添加cron服务
    - 配置环境变量

- [ ] **文档更新**
  - [ ] 创建 `SPRINT_8_SUMMARY.md`
    - Sprint总结
    - 技术亮点
    - 遇到的问题和解决方案

  - [ ] 创建 `CRON_JOBS_GUIDE.md`
    - 定时任务配置指南
    - 任务执行监控
    - 故障排查

  - [ ] 更新 `SPRINT_INDEX.md`
    - 添加Sprint 8记录
    - 更新项目统计

---

## 🧪 测试目标

### 测试覆盖率
- **目标**: 100% (所有核心逻辑)
- **最低要求**: 80%

### 预计测试数
- Cron Runner: 8个测试
- Expiration Check Job: 6个测试
- Data Sync Job: 8个测试
- Cleanup Job: 6个测试
- **总计**: 28个测试

---

## 📦 依赖包

### 新增依赖
```json
{
  "dependencies": {
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/node-cron": "^3.0.11"
  }
}
```

### 安装命令
```bash
npm install node-cron
npm install -D @types/node-cron
```

---

## 📊 数据模型

### CronJobLog（新增）

```prisma
model CronJobLog {
  id       String @id @default(uuid())
  jobName  String
  status   CronJobStatus
  startAt  DateTime @default(now())
  endAt    DateTime?
  duration Int?              // 执行时长（毫秒）
  result   Json?             // 执行结果
  error    String?  @db.Text

  @@index([jobName])
  @@index([status])
  @@index([startAt])
  @@map("cron_job_logs")
}

enum CronJobStatus {
  RUNNING
  SUCCESS
  FAILED
}
```

---

## 🔧 技术栈

### 核心技术
- **node-cron**: 定时任务调度
- **Prisma**: 日志和数据访问
- **TypeScript**: 类型安全

### 架构模式
- **Job Pattern**: 独立的任务模块
- **Factory Pattern**: 任务创建工厂
- **Observer Pattern**: 任务状态监听

---

## ⚠️ 注意事项

### 1. 时区处理
- 所有cron表达式使用UTC时区
- 需要根据服务器时区调整

### 2. 并发控制
- 同一任务不能重复执行
- 使用分布式锁（Redis）或数据库锁

### 3. 失败重试
- 关键任务需要重试机制
- 最多重试3次
- 指数退避策略

### 4. 日志清理
- 定期清理旧的CronJobLog
- 保留最近30天的记录

---

## 🎯 完成标准

### 功能标准
- [x] 所有定时任务正常执行
- [x] 任务失败时发送告警
- [x] 执行日志完整记录
- [x] 支持手动触发任务

### 测试标准
- [x] 28/28 tests passing (100%)
- [x] TypeScript编译通过
- [x] ESLint通过

### 文档标准
- [x] SPRINT_8_SUMMARY.md
- [x] CRON_JOBS_GUIDE.md
- [x] 更新SPRINT_INDEX.md

---

## 🚀 部署流程

### 1. 合并到develop
```bash
git checkout develop
git merge feature/cron-jobs --no-ff
```

### 2. 运行迁移
```bash
npx prisma migrate dev --name add_cron_job_log
npx prisma generate
```

### 3. 启动Cron服务
```bash
# 开发环境
npm run dev:cron

# 生产环境
npm run build
npm run start:cron
```

### 4. 验证任务执行
```bash
# 查看日志
tail -f logs/cron.log

# 检查数据库
npx prisma studio
```

---

## 📈 预期成果

### 自动化能力
- ✅ 每日自动检查到期密钥
- ✅ 每小时同步CRS数据
- ✅ 每日清理过期数据
- ✅ 任务执行监控和告警

### 系统稳定性
- ✅ 减少手动运维工作
- ✅ 提高数据一致性
- ✅ 及时发现系统问题

---

## 🔄 下一步规划

### Sprint 9 候选功能
1. **数据导出系统**
   - 导出密钥列表（CSV/Excel）
   - 导出使用统计报告
   - 导出审计日志

2. **高级搜索和过滤**
   - 多条件组合搜索
   - 保存搜索条件
   - 搜索历史记录

3. **API限流和配额管理**
   - 用户级别限流
   - 密钥级别配额
   - 超限告警

---

**Todolist创建时间**: 2025-10-04
**创建者**: Claude
**状态**: 📋 待开始

---

_"自动化是提升效率的关键！"_
