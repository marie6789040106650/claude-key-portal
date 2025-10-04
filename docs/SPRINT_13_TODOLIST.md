# Sprint 13 - 密钥使用统计和可视化

**阶段**: 📋 PLANNED
**预计时间**: 8-10 小时
**开始时间**: 2025-10-04
**开发分支**: `feature/usage-stats`

---

## 🎯 Sprint 目标

### 核心目标
- ✅ 实现密钥使用统计展示页面
- ✅ 可视化图表展示使用趋势
- ✅ 单个密钥详细统计
- ✅ 导出功能（CSV）
- ✅ 完整的测试覆盖

### 技术栈
- **前端**: React + TypeScript + Recharts
- **数据获取**: React Query
- **图表**: Recharts（复用 Sprint 10）
- **导出**: papaparse (CSV)
- **测试**: Jest + RTL

---

## 📋 任务列表

### Phase 1: 准备和 API 验证
**预计时间**: 1 小时
**目标**: 验证现有 API 并规划数据结构

- [ ] 扫描已完成的 Sprint 内容
- [ ] 检查现有统计 API（Sprint 4）
  - [ ] `GET /api/dashboard` - 仪表板数据
  - [ ] `GET /api/stats/usage` - 使用统计
- [ ] 分析 API 响应格式
- [ ] 确定需要的额外 API（如果有）
- [ ] 创建数据类型定义
- [ ] Git 提交文档

### Phase 2: 统计页面测试（🔴 RED）
**预计时间**: 1.5 小时
**目标**: 先写测试，TDD 驱动开发

- [ ] 创建 `tests/unit/pages/UsageStatsPage.test.tsx`
  - [ ] 页面加载和数据获取测试
  - [ ] 时间范围选择测试
  - [ ] 密钥筛选测试
  - [ ] 图表渲染测试
  - [ ] 导出功能测试
  - [ ] 错误处理测试
- [ ] 创建 `tests/unit/components/StatsChart.test.tsx`
  - [ ] 时间趋势图测试
  - [ ] 数据点交互测试
  - [ ] 空数据处理测试
- [ ] 创建 `tests/unit/components/StatsTable.test.tsx`
  - [ ] 表格渲染测试
  - [ ] 排序功能测试
  - [ ] 分页测试
- [ ] Git 提交测试（🔴 RED）

### Phase 3: 统计组件实现（🟢 GREEN）
**预计时间**: 2.5 小时
**目标**: 实现组件让测试通过

- [ ] 创建 `components/stats/StatsChart.tsx`
  - [ ] 使用 Recharts LineChart
  - [ ] 时间趋势可视化
  - [ ] Tooltip 交互
  - [ ] 响应式设计
- [ ] 创建 `components/stats/StatsTable.tsx`
  - [ ] 密钥统计表格
  - [ ] 排序和分页
  - [ ] 详情链接
- [ ] 创建 `components/stats/DateRangePicker.tsx`
  - [ ] 时间范围选择
  - [ ] 预设快捷选项（今天、本周、本月等）
- [ ] 创建 `components/stats/KeyFilter.tsx`
  - [ ] 密钥多选筛选
  - [ ] 全选/取消全选
- [ ] 确保所有测试通过
- [ ] Git 提交实现（🟢 GREEN）

### Phase 4: 统计页面实现（🟢 GREEN）
**预计时间**: 1.5 小时
**目标**: 整合组件到统计页面

- [ ] 创建 `app/dashboard/stats/page.tsx`
  - [ ] React Query 数据获取
  - [ ] 时间范围状态管理
  - [ ] 密钥筛选状态管理
  - [ ] 布局和响应式设计
- [ ] 集成所有统计组件
  - [ ] StatsChart
  - [ ] StatsTable
  - [ ] DateRangePicker
  - [ ] KeyFilter
- [ ] 添加加载状态
- [ ] 添加错误处理
- [ ] 确保测试通过
- [ ] Git 提交页面（🟢 GREEN）

### Phase 5: 导出功能（🟢 GREEN）
**预计时间**: 1 小时
**目标**: 实现数据导出

- [ ] 安装 `papaparse` 库
- [ ] 创建 `lib/utils/export.ts`
  - [ ] CSV 导出函数
  - [ ] 数据格式化
  - [ ] 文件下载
- [ ] 添加导出按钮到统计页面
- [ ] 测试导出功能
- [ ] Git 提交导出功能（🟢 GREEN）

### Phase 6: 单个密钥详细统计（🟢 GREEN）
**预计时间**: 1.5 小时
**目标**: 实现密钥详情页统计部分

- [ ] 创建 `app/dashboard/keys/[id]/page.tsx`
  - [ ] 密钥基本信息
  - [ ] 使用统计卡片
  - [ ] 使用趋势图表
  - [ ] 最近请求列表
- [ ] 创建 API 端点 `GET /api/keys/[id]/stats`
  - [ ] 密钥使用统计
  - [ ] 时间范围参数
  - [ ] 返回详细数据
- [ ] 测试密钥详情页
- [ ] Git 提交密钥详情（🟢 GREEN）

### Phase 7: 优化和重构（🔵 REFACTOR）
**预计时间**: 1 小时
**目标**: 代码优化和性能提升

- [ ] 提取公共逻辑到 hooks
  - [ ] `useStatsData` hook
  - [ ] `useDateRange` hook
- [ ] 性能优化
  - [ ] React Query 缓存配置
  - [ ] 组件 memo 优化
  - [ ] 图表性能优化
- [ ] 代码审查和重构
- [ ] Git 提交重构（🔵 REFACTOR）

### Phase 8: 集成测试和修复
**预计时间**: 1 小时
**目标**: 全面测试和问题修复

- [ ] 运行所有测试
- [ ] 手动测试所有功能
  - [ ] 统计页面交互
  - [ ] 图表响应式
  - [ ] 导出功能
  - [ ] 密钥详情页
- [ ] 修复发现的问题
- [ ] 确保测试覆盖率 > 80%
- [ ] Git 提交修复

### Phase 9: 文档和合并
**预计时间**: 0.5 小时
**目标**: 完成文档并合并到 develop

- [ ] 创建 `docs/SPRINT_13_SUMMARY.md`
- [ ] 更新 `docs/SPRINT_INDEX.md`
- [ ] 运行所有测试确保通过
- [ ] ESLint 检查
- [ ] Git 提交文档
- [ ] 合并到 develop 分支

---

## ✅ 完成标准

- [ ] 统计页面完整实现
- [ ] 图表可视化流畅
- [ ] 导出功能正常
- [ ] 密钥详情页展示统计
- [ ] 所有测试通过
- [ ] 测试覆盖率 > 80%
- [ ] 无 ESLint 错误
- [ ] 响应式设计良好
- [ ] 用户体验流畅

---

## 📊 预期成果

### 功能列表
1. **统计页面** (`/dashboard/stats`)
   - 总体使用统计
   - 时间趋势图表
   - 密钥使用排行
   - 时间范围筛选
   - 密钥筛选
   - CSV 导出

2. **密钥详情页** (`/dashboard/keys/[id]`)
   - 密钥基本信息
   - 使用统计卡片
   - 使用趋势图表
   - 最近请求列表

3. **图表组件**
   - StatsChart - 时间趋势图
   - StatsTable - 统计表格
   - DateRangePicker - 时间选择
   - KeyFilter - 密钥筛选

### 测试目标
- 统计页面测试: 20+ tests
- 图表组件测试: 15+ tests
- 密钥详情测试: 10+ tests
- **总计**: 45+ tests

### API 端点
- ✅ `GET /api/dashboard` (已存在)
- ✅ `GET /api/stats/usage` (已存在)
- 🆕 `GET /api/keys/[id]/stats` (新增)

---

## 🎨 UI/UX 设计要点

### 统计页面布局
```
┌─────────────────────────────────────────────┐
│ 统计概览                                      │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │总请求│ │总Token│ │平均RT│ │错误率│         │
│ └─────┘ └─────┘ └─────┘ └─────┘            │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ 筛选器                                        │
│ [时间范围 ▼] [密钥筛选 ▼] [导出CSV]         │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ 使用趋势图表 (Recharts LineChart)           │
│                                              │
│        ╱╲                                    │
│       ╱  ╲      ╱╲                          │
│      ╱    ╲    ╱  ╲                         │
│  ───╯      ╲──╯    ╰───                     │
│                                              │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ 密钥使用排行表格                              │
│ ┌──────┬────────┬────────┬────────┐        │
│ │密钥名│ 请求数  │ Token  │ 详情   │        │
│ ├──────┼────────┼────────┼────────┤        │
│ │key-1 │ 1,234  │ 56,789 │ [查看] │        │
│ └──────┴────────┴────────┴────────┘        │
└─────────────────────────────────────────────┘
```

### 交互要点
- 时间范围变化 → 自动刷新图表
- 密钥筛选 → 实时更新数据
- 图表 Tooltip → 显示详细数据
- 导出按钮 → 下载 CSV 文件
- 表格排序 → 点击列头排序

---

## 🔧 技术实现要点

### React Query 配置
```typescript
useQuery({
  queryKey: ['stats', 'usage', dateRange, selectedKeys],
  queryFn: () => fetchUsageStats(dateRange, selectedKeys),
  staleTime: 5 * 60 * 1000, // 5分钟
  refetchOnWindowFocus: false,
})
```

### Recharts 集成
```typescript
<LineChart data={stats}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="requests" stroke="#8884d8" />
  <Line type="monotone" dataKey="tokens" stroke="#82ca9d" />
</LineChart>
```

### CSV 导出
```typescript
import Papa from 'papaparse'

function exportToCSV(data: StatsData[]) {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `stats-${Date.now()}.csv`
  link.click()
}
```

---

## 🚨 潜在风险和应对

### 风险1: 数据量过大导致图表性能问题
**应对**:
- 限制时间范围（默认最近 7 天）
- 实现数据采样（大数据集时）
- 使用虚拟化列表

### 风险2: API 响应格式不匹配
**应对**:
- Phase 1 提前验证 API
- 添加数据格式转换层
- 完善 TypeScript 类型

### 风险3: 图表库兼容性问题
**应对**:
- 复用 Sprint 10 的 Recharts 配置
- 参考已有的图表组件
- 充分测试不同数据场景

---

## 📝 相关文档

- [SPRINT_12_SUMMARY.md](./SPRINT_12_SUMMARY.md) - 上一个 Sprint 总结
- [SPRINT_10_SUMMARY.md](./SPRINT_10_SUMMARY.md) - 监控仪表板参考
- [API_ENDPOINTS_SPRINT4.md](./API_ENDPOINTS_SPRINT4.md) - 统计 API 规范
- [TDD_GIT_WORKFLOW.md](../TDD_GIT_WORKFLOW.md) - 开发工作流

---

**创建时间**: 2025-10-04
**状态**: 📋 待开始
**优先级**: 高（核心用户价值功能）
**依赖**: Sprint 4 统计 API、Sprint 10 图表组件

---

_"数据可视化让用户更直观地了解密钥使用情况！"_
