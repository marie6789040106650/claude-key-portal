# Sprint 10: 监控仪表板和前端集成 Todolist

**创建时间**: 2025-10-04
**预计完成**: 2025-10-06
**开发模式**: TDD + 前端组件开发
**分支**: `feature/monitor-dashboard`

---

## 🎯 Sprint 目标

基于Sprint 9的监控后端系统，构建完整的前端监控仪表板，包括：
- 实时系统健康状态展示
- 性能指标可视化图表
- 告警记录管理界面
- 告警规则配置界面
- 响应式设计和用户友好的交互

---

## 📋 任务列表

### Phase 1: 准备工作 ✅
- [x] 创建 `feature/monitor-dashboard` 分支
- [x] 更新 SPRINT_INDEX.md (标记Sprint 10开始)
- [x] 安装前端依赖 (recharts, react-query已安装)

### Phase 2: 🔴 RED - 组件测试编写 ✅
- [x] 编写 SystemHealthCard 组件测试 (22个测试用例)
- [x] 编写 MetricsChart 组件测试 (18个测试用例)
- [x] 编写 AlertsTable 组件测试 (20个测试用例)
- [x] 编写 AlertRuleForm 组件测试 (18个测试用例)
- [x] 提交 RED Phase (commit: 0758376)

**RED Phase 总结**:
- ✅ 4个组件测试文件创建完成
- ✅ 总计 78 个测试用例编写完成
- ✅ 测试覆盖：基本渲染、加载/错误状态、用户交互、表单验证、响应式、A11y

### Phase 3: 🟢 GREEN - 组件实现 ✅
- [x] 实现 SystemHealthCard 组件（健康状态卡片）
- [x] 实现 MetricsChart 组件（使用Recharts）
- [x] 实现 AlertsTable 组件（告警列表）
- [x] 实现 AlertRuleForm 组件（规则配置表单）
- [x] 创建监控仪表板页面 `/dashboard/monitoring`
- [x] 集成React Query数据获取
- [ ] 提交 GREEN Phase

**GREEN Phase 总结**:
- ✅ 4个监控组件实现完成（SystemHealthCard, MetricsChart, AlertsTable, AlertRuleForm）
- ✅ 监控仪表板页面创建完成（`app/(dashboard)/monitoring/page.tsx`）
- ✅ React Query集成完成
  - QueryProvider创建（`components/providers/QueryProvider.tsx`）
  - 在layout.tsx中配置全局Provider
  - 实时数据刷新（每30秒自动刷新）
  - 缓存配置（1分钟staleTime，5分钟缓存）
- ✅ UI组件安装
  - Dialog组件安装（`@radix-ui/react-dialog`）
  - Dialog UI组件创建（`components/ui/dialog.tsx`）
- ✅ 页面功能完整
  - 系统健康状态实时监控
  - 性能指标可视化图表（支持6种指标类型）
  - 告警记录管理（过滤、分页、排序）
  - 告警规则配置（创建、编辑）
  - 关键指标摘要卡片

### Phase 4: 🔵 REFACTOR - 优化和重构
- [ ] 组件性能优化（memo, useMemo, useCallback）
- [ ] 代码质量检查（ESLint, TypeScript）
- [ ] 响应式布局优化
- [ ] 可访问性改进（ARIA标签）
- [ ] 提交 REFACTOR Phase

### Phase 5: 📝 文档和部署
- [ ] 创建 Sprint 10 总结文档
- [ ] 更新组件文档（Storybook或注释）
- [ ] 截图和用户指南
- [ ] 合并到 develop 分支
- [ ] 创建 Sprint 11 todolist

---

## 🎨 UI/UX 设计要求

### 监控仪表板布局
```
+----------------------------------------------------------+
| Header                                                    |
+----------------------------------------------------------+
| System Health Status          |  Key Metrics Summary    |
| - Database: ●                 |  - Avg Response: 120ms  |
| - Redis: ●                    |  - QPS: 15.5            |
| - CRS: ●                      |  - Memory: 150MB        |
+----------------------------------------------------------+
| Performance Metrics Chart (Recharts)                      |
| - 折线图显示24小时趋势                                      |
| - 可切换指标类型（响应时间/QPS/内存）                        |
+----------------------------------------------------------+
| Active Alerts                 | Recent Activity          |
| - WARNING: High Response Time | - Alert Triggered        |
| - CRITICAL: Memory Leak       | - Alert Resolved         |
+----------------------------------------------------------+
```

### 告警记录页面
```
+----------------------------------------------------------+
| Filters                                                   |
| [Status ▼] [Severity ▼] [Time Range ▼] [Search]         |
+----------------------------------------------------------+
| Alert ID | Rule       | Status   | Severity | Triggered  |
| alert-1  | High CPU   | FIRING   | WARNING  | 2m ago     |
| alert-2  | Low Disk   | RESOLVED | CRITICAL | 1h ago     |
+----------------------------------------------------------+
| Pagination: < 1 2 3 4 5 >                                |
+----------------------------------------------------------+
```

### 告警规则配置页面
```
+----------------------------------------------------------+
| Rule Name: [                                             ]|
| Metric:    [Response Time ▼]                            |
| Condition: [Greater Than ▼] Threshold: [1000] ms        |
| Severity:  [WARNING ▼]                                   |
| Channels:  ☑ Email  ☑ Webhook  ☐ System                 |
| [Save Rule]  [Cancel]                                    |
+----------------------------------------------------------+
| Existing Rules                                           |
| - High Response Time (ENABLED)  [Edit] [Disable]        |
| - Memory Leak (DISABLED)        [Edit] [Enable]         |
+----------------------------------------------------------+
```

---

## 🧪 测试要求

### 组件测试覆盖
- **SystemHealthCard**:
  - 渲染健康/降级/不健康状态
  - 显示响应时间
  - 错误状态处理

- **MetricsChart**:
  - 正确渲染图表数据
  - 指标类型切换
  - 空数据状态
  - 加载状态

- **AlertsTable**:
  - 渲染告警列表
  - 过滤功能
  - 分页功能
  - 排序功能

- **AlertRuleForm**:
  - 表单验证（必填字段）
  - 提交成功/失败处理
  - 编辑现有规则

### 集成测试
- [ ] 监控仪表板页面加载
- [ ] API数据获取和展示
- [ ] 实时数据更新（Polling或WebSocket）

---

## 📦 技术栈

### 前端框架
- **React 18**: 组件库
- **Next.js 14**: 路由和SSR
- **TypeScript**: 类型安全

### 数据管理
- **React Query**: 数据获取和缓存
- **Zustand**: 全局状态管理（可选）

### UI组件
- **Shadcn/ui**: 基础组件库
- **Recharts**: 图表可视化
- **Tailwind CSS**: 样式

### 测试
- **Jest**: 单元测试
- **React Testing Library**: 组件测试

---

## 🔗 依赖关系

### 前置条件
- ✅ Sprint 9完成（监控后端系统）
- ✅ 监控API端点可用
- ✅ Prisma schema已更新

### 外部依赖
- Recharts (如未安装):
  ```bash
  npm install recharts
  ```

---

## 📊 性能目标

- **首屏加载时间**: <2秒
- **图表渲染时间**: <500ms
- **API响应时间**: <200ms
- **组件渲染优化**: 使用React.memo减少不必要的重渲染

---

## 🚀 验收标准

- [ ] 所有组件测试通过
- [ ] TypeScript无类型错误
- [ ] ESLint无警告
- [ ] 响应式设计在移动端和桌面端均正常
- [ ] 图表正确显示数据
- [ ] 告警列表支持过滤和分页
- [ ] 告警规则可以创建、编辑、禁用
- [ ] 实时数据更新（每30秒刷新）
- [ ] 文档完整（组件文档+总结文档）

---

## 📝 备注

### 可选功能（时间允许）
- [ ] WebSocket实时推送（替代轮询）
- [ ] 导出报告功能（PDF/CSV）
- [ ] 自定义仪表板布局
- [ ] 暗色主题支持

### 已知限制
- API测试在Sprint 9中跳过，需在集成测试中验证
- 实时数据暂时使用轮询（未来可升级WebSocket）

---

**创建者**: Sprint 9 Team
**开始日期**: 2025-10-04
**预计工时**: 16小时
**优先级**: 高
