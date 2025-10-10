# P2阶段执行计划 - 高价值功能开发

> **创建时间**: 2025-10-08
> **阶段目标**: 开发调用日志、高级搜索、数据导出功能
> **执行策略**: 务实交付路线 - 快速交付价值，持续改进质量
> **状态**: 📋 方案制定中 - 待CRS接口验证

---

## 🎯 战略决策

### 选择：选项B - 务实交付路线 ⭐

**路线图**:
```
✅ P1阶段完成
   ↓
📋 CRS接口验证 (当前阶段)
   ↓
🚀 P2功能开发
   ↓
🔄 TDD流程中持续改进测试
```

**核心原则**:
1. 优先交付用户价值
2. 不让测试问题阻塞功能开发
3. 在TDD流程中自然提升测试质量
4. 7个测试失败不影响功能可用性

---

## 📋 P1收尾工作

### 当前状态

**已完成**:
- ✅ MVP (P0): 100%
- ✅ 本地扩展 (P1): 100%
  - 收藏功能 ✅
  - 备注功能 ✅
  - 标签功能 ✅
  - Toast Mock修复 ✅ (16/23测试通过)

**待处理**:
- ⚠️ 7个测试失败（非阻塞性）
  - 定时器相关: 4个
  - 键盘事件: 2个
  - 视觉状态: 1个

### 合并计划

**分支操作**:
```bash
# 1. 合并P1到develop
git checkout develop
git merge --no-ff feature/p1-missing-features -m "Merge P1: Toast mock fixes and local extensions complete"

# 2. 清理分支
git branch -d feature/p1-missing-features

# 3. 标记里程碑
git tag -a v1.1.0 -m "Milestone 2: P1 Local Extensions Complete"
```

**文档更新**:
- [ ] EXECUTION_PLAN.md - 标记P1为100%完成
- [ ] KNOWN_ISSUES.md - 记录剩余测试问题为ISSUE-004（技术债务）
- [ ] PROJECT_STRUCTURE.md - 更新功能清单

---

## 🔍 CRS接口验证 (前置条件)

### 验证目标

**为什么要验证**:
- ✅ 确认CRS实际返回的数据格式
- ✅ 了解可用的日志查询接口
- ✅ 验证分页、筛选参数
- ✅ 避免基于假设开发导致返工

### CRS部署信息

**服务地址**: https://claude.just-play.fun

**管理员凭据**:
- 用户名: `cr_admin_4ce18cd2`
- 密码: `HCTBMoiK3PZD0eDC`

**API架构**:
- 认证: `POST /web/auth/login`
- Admin API: `/admin/*`

### 待验证接口清单

#### 1. 认证接口
```
POST /web/auth/login
Body: { username, password }
预期: { success: true, token, expiresIn }
```

#### 2. 日志相关接口（待确认）
```
可能的端点:
- GET /admin/logs
- GET /admin/api-keys/:id/logs
- GET /admin/api-keys-usage-trend
- GET /admin/dashboard (可能包含日志摘要)

需要验证:
- 日志数据结构
- 可用筛选参数
- 分页参数
- 时间范围格式
- 响应数据字段
```

#### 3. 统计数据接口
```
已知:
- GET /admin/dashboard - 仪表板数据
- GET /admin/api-keys/:id/stats - 密钥统计
- GET /admin/api-keys-usage-trend - 使用趋势

需要验证:
- 数据结构
- 时间粒度（小时/天/月）
- 统计维度
```

### 验证脚本

创建测试脚本：`scripts/verify-crs-apis.ts`

**功能**:
1. 自动登录获取token
2. 遍历所有可能的日志接口
3. 记录返回数据结构
4. 生成接口文档

**输出**:
- `docs/CRS_API_VERIFICATION.md` - 验证结果
- `docs/CRS_LOG_DATA_STRUCTURE.md` - 日志数据结构

---

## 🚀 P2功能规划 (待接口验证后调整)

### 功能1: 调用日志查询 (优先级P0)

**用户价值**: 最高 - 了解API使用情况，排查问题

**功能范围** (待验证后确认):
- 📊 日志列表展示
- 🔍 多维度筛选
  - 时间范围
  - 密钥ID
  - HTTP状态码
  - 模型类型
  - 错误/成功状态
- 📄 分页加载
- 📈 统计概览
  - 总调用次数
  - 成功率
  - 平均响应时间
  - 错误分布

**技术架构** (待数据验证):
```
表现层: app/dashboard/logs/page.tsx
├─ LogList 组件
├─ LogFilter 组件
└─ LogStats 组件

应用层: lib/application/logs/
├─ list-logs.usecase.ts
└─ get-log-stats.usecase.ts

基础设施层: lib/infrastructure/external/
└─ crs-client.ts (扩展日志方法)
```

**数据流** (假设，待验证):
```
1. 用户选择筛选条件
2. Portal调用 GET /api/logs?filters
3. Portal代理 CRS GET /admin/logs?filters
4. CRS返回日志数据
5. Portal缓存1分钟
6. 前端展示
```

**TDD开发流程**:
```
并行任务组1:
├─ 🔴 RED: 日志API测试 (tests/unit/app/api/logs.test.ts)
├─ 🟢 GREEN: 实现日志API (app/api/logs/route.ts)
└─ 🔵 REFACTOR: 优化缓存和错误处理

并行任务组2:
├─ 🔴 RED: 日志列表UI测试 (tests/unit/components/logs/LogList.test.tsx)
├─ 🟢 GREEN: 实现日志列表组件 (components/logs/LogList.tsx)
└─ 🔵 REFACTOR: 提取通用表格组件

并行任务组3:
├─ 🔴 RED: 筛选功能测试 (tests/unit/components/logs/LogFilter.test.tsx)
├─ 🟢 GREEN: 实现筛选器组件 (components/logs/LogFilter.tsx)
└─ 🔵 REFACTOR: 优化性能和用户体验
```

**预计工期**: 1-1.5天 (取决于CRS接口复杂度)

---

### 功能2: 高级搜索筛选 (优先级P1)

**用户价值**: 高 - 提升密钥管理效率

**功能范围**:
- 🏷️ 标签组合筛选
  - AND逻辑: 同时包含多个标签
  - OR逻辑: 包含任一标签
- ⭐ 收藏状态筛选
- 📅 创建时间范围
- 🔢 使用量排序
  - 总调用次数
  - 最近7天调用
  - 错误率
- 💾 保存搜索条件（本地存储）

**技术实现**:
```
组件: components/keys/AdvancedFilter.tsx
├─ TagFilter (标签选择)
├─ DateRangeFilter (时间范围)
├─ SortOptions (排序选项)
└─ SavedFilters (保存的筛选)

状态管理: React Context
└─ FilterContext (全局筛选状态)
```

**TDD开发流程**:
```
并行任务:
├─ 🔴 RED: 高级筛选测试
├─ 🟢 GREEN: 实现筛选逻辑
└─ 🔵 REFACTOR: 优化UI和性能
```

**预计工期**: 0.5天

---

### 功能3: 数据导出 (优先级P2)

**用户价值**: 中 - 方便数据分析和备份

**功能范围**:
- 📊 CSV格式导出
  - 密钥列表
  - 使用统计
  - 调用日志
- 📄 JSON格式导出
- ⚙️ 导出字段选择
- 📦 批量导出支持
- 📅 导出历史记录

**技术实现**:
```
客户端:
├─ components/export/ExportDialog.tsx
└─ lib/utils/export.ts (CSV/JSON生成)

服务端:
└─ app/api/export/route.ts (流式导出大数据)
```

**TDD开发流程**:
```
并行任务:
├─ 🔴 RED: 导出功能测试
├─ 🟢 GREEN: 实现CSV/JSON导出
└─ 🔵 REFACTOR: 优化大数据处理
```

**预计工期**: 0.5天

---

## 📈 质量保证策略

### 测试标准

**新功能要求** (严格执行):
- ✅ 测试覆盖率 > 90%
- ✅ TDD流程强制执行 (RED → GREEN → REFACTOR)
- ✅ 每个PR必须包含测试
- ✅ 所有测试必须通过才能合并

**技术债务管理**:
- 📝 创建 ISSUE-004: P1剩余7个测试失败
- 🎯 在P2 REFACTOR阶段修复50%以上
- 📊 每周测试覆盖率报告
- 🔄 持续改进，不阻塞交付

### 代码质量检查

**Pre-commit Hook** (已配置):
```
✅ TypeScript类型检查
✅ ESLint无错误
✅ Prettier格式化
✅ 测试通过
✅ Git commit规范
```

**PR合并条件**:
```
✅ 所有新增代码有测试
✅ CI构建通过
✅ 代码审查通过
✅ 测试覆盖率达标
✅ 文档更新完整
```

---

## 🎯 里程碑规划

### Milestone 3: P2功能完成

**目标日期**: 2025-10-11 (预计3天)

**交付内容**:
- ✅ 调用日志查询功能
- ✅ 高级搜索筛选
- ✅ 数据导出功能
- ✅ 整体测试覆盖率 > 85%
- ✅ P1技术债务解决 > 50%

**成功标准**:
- 用户能够查看和筛选API调用日志
- 用户能够使用多维度筛选密钥
- 用户能够导出数据为CSV/JSON
- 所有新功能测试通过
- 无阻塞性bug

---

## ⚡ 执行原则

### 并行开发

遵循项目规范，最大化效率：
1. API和UI并行开发
2. 多个独立功能模块并行TDD
3. 测试和实现同步进行
4. 使用多个终端并行运行测试

### 迭代交付

每个功能独立分支：
```
feature/p2-usage-logs
feature/p2-advanced-search
feature/p2-data-export
```

每个功能完成后立即合并到develop，不等整个P2完成。

### 持续集成

每次提交：
- 自动运行测试
- 检查代码质量
- 更新覆盖率报告
- 部署到Preview环境（如果配置）

---

## 📝 下一步行动

### 立即执行

1. **创建CRS验证脚本** ✅ 当前任务
   - 脚本位置: `scripts/verify-crs-apis.ts`
   - 输出文档: `docs/CRS_API_VERIFICATION.md`

2. **验证CRS接口**
   - 登录获取token
   - 测试所有日志相关接口
   - 记录真实数据结构

3. **基于验证结果调整计划**
   - 更新P2功能范围
   - 调整技术架构
   - 重新评估工期

### 验证后执行

4. **合并P1分支**
   - 执行Git合并操作
   - 更新文档
   - 打tag标记里程碑

5. **启动P2开发**
   - 创建功能分支
   - 开始TDD流程
   - 并行开发功能

---

## 📊 风险评估

### 高风险项

**CRS接口不符合预期** (中等概率)
- **影响**: 需要调整功能范围或实现方式
- **缓解**: 提前验证接口，及时调整计划
- **应对**: 如果CRS没有日志接口，降级为统计数据展示

**技术债务积累** (低概率)
- **影响**: 测试覆盖率下降，代码质量问题
- **缓解**: 严格执行TDD，每个PR检查覆盖率
- **应对**: 设置覆盖率阈值，低于85%自动阻止合并

### 机会点

**CRS接口超出预期** (可能性高)
- **机会**: 可能支持更多高级功能
- **利用**: 快速实现额外价值功能
- **示例**: 实时日志推送、错误告警等

---

**计划版本**: v1.0
**创建者**: Claude Key Portal Team
**审批状态**: 待CRS接口验证后审批
**下次更新**: CRS验证完成后

---

_"先验证假设，再开发功能 - 避免无效工作！"_ 🎯
