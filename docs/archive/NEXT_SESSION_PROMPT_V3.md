# Claude Key Portal - 下一阶段工作提示词 (v3)

> **自动生成时间**: 2025-10-10
> **当前任务**: P2.9 Task 5 - 加载进度指示器

---

## 📋 快速启动（复制到新窗口）

```
项目路径: /Users/bypasser/claude-project/0930/claude-key-portal
当前分支: feature/p2-usage-analytics

当前任务: P2.9 Task 5 - 加载进度指示器

已完成任务:
✅ Task 1: CRS趋势API集成（12/12测试通过）
✅ Task 2: CRS降级状态提示（10/10测试通过）
✅ Task 3: 手动刷新功能（已集成到Stats页面）
✅ Task 4: Toast错误提示优化（17/17测试通过）

下一步:
开始Task 5 - 优化Stats页面的加载状态，添加骨架屏或进度指示器，提升用户体验

参考文档: docs/NEXT_SESSION_PROMPT_V3.md

请开始Task 5的开发工作。
```

---

## ✅ 最新完成（2025-10-10）

### P2.9 Task 4 - Toast错误提示优化 ✅

**TDD流程完成**:
- 🔴 RED: 7个Toast错误提示测试（数据加载、刷新、CRS重试）
- 🟢 GREEN: 实现Toast错误通知（17/17测试通过）

**交付物**:
- ✅ 测试: `tests/unit/app/dashboard/stats/error-toast.test.tsx` (+316行, 7/7 passed)
- ✅ 功能: `app/dashboard/stats/page.tsx` - 集成Toast错误提示
- ✅ 文档: `docs/P2.9_TASK4_COMPLETION_SUMMARY.md` (+306行)

**核心功能**:
- ✅ **数据加载失败Toast** - 自动显示加载错误提示
- ✅ **手动刷新成功/失败Toast** - 刷新操作的用户反馈
- ✅ **CRS重试成功/失败Toast** - CRS服务状态变化通知
- ✅ **保留原有错误UI** - Toast作为补充，不替代错误卡片
- ✅ **用户友好体验** - 清晰的成功/失败消息

**Toast消息设计**:
| 场景 | Toast类型 | 标题 | 描述 |
|-----|----------|-----|-----|
| 数据加载失败 | 错误（红色） | 加载失败 | 无法获取统计数据，请稍后重试 |
| 手动刷新成功 | 成功（绿色） | 刷新成功 | 统计数据已更新 |
| 手动刷新失败 | 错误（红色） | 刷新失败 | 无法刷新统计数据，请稍后重试 |
| CRS连接成功 | 成功（绿色） | CRS连接成功 | CRS服务已恢复，显示完整数据 |
| CRS重试失败 | 错误（红色） | CRS重试失败 | CRS服务仍然不可用，已显示本地数据 |

**Git提交**:
```
f742928 docs(p2.9): Task 4 completion summary - Toast error notifications ✅
153055e feat(stats): implement Toast error notifications (🟢 GREEN)
63a4872 test(stats): add Toast error notification tests (🔴 RED)
```

**测试结果**:
```bash
✅ CrsStatusAlert: 10/10 passed
✅ error-toast: 7/7 passed
✅ 总计: 17/17 passed (100%)
```

---

## 🎯 当前进度状态

### P2.9 - UI/UX完善任务进度

| Task | 功能 | 工作量 | 测试 | 状态 |
|------|-----|--------|------|------|
| Task 1 | CRS趋势API集成 | 4-6h | 12/12 | ✅ 完成 |
| Task 2 | CRS降级状态提示 | 1-2h | 10/10 | ✅ 完成 |
| Task 3 | 手动刷新功能 | 1h | 已集成 | ✅ 完成 |
| Task 4 | Toast错误提示 | 1-2h | 17/17 | ✅ 完成 |
| Task 5 | 加载进度指示器 | 1-2h | TBD | ⭐ 当前 |

**已完成**: 7-11小时（Task 1-4）
**剩余工作量**: 1-2小时（Task 5）
**P2.9完成度**: 80% (4/5任务完成)

---

## 📋 下一任务：P2.9 Task 5 - 加载进度指示器 ⭐

### 任务目标

优化Stats页面的加载状态显示，添加骨架屏（Skeleton）或进度条，提升用户体验，让用户明确知道数据正在加载中。

### 当前问题

**现有加载状态**:
```typescript
// 当前实现 (app/dashboard/stats/page.tsx:133-148)
if (isLoading) {
  return (
    <div className="container mx-auto py-8">
      <div data-testid="stats-skeleton" className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}
```

**存在的问题**:
- ❌ 骨架屏过于简单，形状不匹配实际内容
- ❌ 没有显示加载进度百分比
- ❌ 没有加载提示文字
- ❌ 动画不够流畅
- ❌ 与实际内容布局差异较大

### 优化目标

**目标效果**:
- ✅ 骨架屏匹配实际内容结构（概览卡片、图表、表格）
- ✅ 流畅的脉冲动画
- ✅ 可选：显示加载进度文字提示
- ✅ 可选：分阶段加载（概览 → 图表 → 表格）
- ✅ 保持现有`data-testid="stats-skeleton"`以兼容测试

### 技术方案

#### 方案1：优化现有骨架屏（推荐，1-2h）

**优点**:
- 实现简单，改进现有代码
- 无需引入新组件
- 与实际布局高度匹配

**实现要点**:
```typescript
// 1. 匹配实际布局结构
<div className="container mx-auto py-8 space-y-6">
  {/* 标题区域骨架 */}
  <div className="flex items-center justify-between">
    <div className="h-10 bg-muted animate-pulse rounded w-32" />
    <div className="flex gap-2">
      <div className="h-9 w-20 bg-muted animate-pulse rounded" />
      <div className="h-10 w-28 bg-muted animate-pulse rounded" />
    </div>
  </div>

  {/* 概览卡片骨架（4个） */}
  <div className="grid gap-6 md:grid-cols-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i}>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted animate-pulse rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded w-20" />
        </CardContent>
      </Card>
    ))}
  </div>

  {/* 筛选器骨架 */}
  <div className="grid gap-6 md:grid-cols-2">
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted animate-pulse rounded w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted animate-pulse rounded w-24" />
      </CardHeader>
      <CardContent>
        <div className="h-10 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  </div>

  {/* 趋势图骨架 */}
  <Card>
    <CardHeader>
      <div className="h-6 bg-muted animate-pulse rounded w-24" />
    </CardHeader>
    <CardContent>
      <div className="h-[300px] bg-muted animate-pulse rounded" />
    </CardContent>
  </Card>

  {/* 表格骨架 */}
  <Card>
    <CardHeader>
      <div className="h-6 bg-muted animate-pulse rounded w-24" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-12 bg-muted animate-pulse rounded flex-1" />
            <div className="h-12 bg-muted animate-pulse rounded w-24" />
            <div className="h-12 bg-muted animate-pulse rounded w-24" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
</div>
```

#### 方案2：使用Shadcn Skeleton组件（备选，2-3h）

**优点**:
- 更专业的骨架屏组件
- 可复用性强
- 动画效果统一

**实现要点**:
```bash
# 1. 安装Shadcn Skeleton组件
npx shadcn-ui@latest add skeleton

# 2. 使用Skeleton组件
import { Skeleton } from '@/components/ui/skeleton'

<Card>
  <CardHeader>
    <Skeleton className="h-4 w-24" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-8 w-20" />
  </CardContent>
</Card>
```

### TDD开发流程

#### 🔴 RED阶段（可选）

虽然这是UI改进，但可以添加基本测试：

```typescript
// tests/unit/app/dashboard/stats/skeleton.test.tsx
describe('Stats Page - Loading Skeleton', () => {
  it('显示骨架屏时应包含所有主要区域', () => {
    render(<StatsPageSkeleton />)

    // 验证骨架屏包含所有区域
    expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument()

    // 验证标题区域
    expect(screen.getByTestId('skeleton-header')).toBeInTheDocument()

    // 验证概览卡片（4个）
    const summaryCards = screen.getAllByTestId('skeleton-summary-card')
    expect(summaryCards).toHaveLength(4)

    // 验证筛选器
    expect(screen.getByTestId('skeleton-filters')).toBeInTheDocument()

    // 验证趋势图
    expect(screen.getByTestId('skeleton-chart')).toBeInTheDocument()

    // 验证表格
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument()
  })

  it('骨架屏应有脉冲动画', () => {
    render(<StatsPageSkeleton />)

    const skeleton = screen.getByTestId('stats-skeleton')
    expect(skeleton).toHaveClass('animate-pulse')
  })
})
```

#### 🟢 GREEN阶段

**步骤1**: 提取骨架屏组件（可选）

```typescript
// components/stats/StatsSkeleton.tsx
export function StatsSkeleton() {
  return (
    <div data-testid="stats-skeleton" className="container mx-auto py-8 space-y-6">
      {/* 标题区域 */}
      <div data-testid="skeleton-header" className="flex items-center justify-between">
        {/* ... */}
      </div>

      {/* 概览卡片 */}
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} data-testid="skeleton-summary-card">
            {/* ... */}
          </Card>
        ))}
      </div>

      {/* 筛选器 */}
      <div data-testid="skeleton-filters" className="grid gap-6 md:grid-cols-2">
        {/* ... */}
      </div>

      {/* 趋势图 */}
      <Card data-testid="skeleton-chart">
        {/* ... */}
      </Card>

      {/* 表格 */}
      <Card data-testid="skeleton-table">
        {/* ... */}
      </Card>
    </div>
  )
}
```

**步骤2**: 在页面中使用

```typescript
// app/dashboard/stats/page.tsx
import { StatsSkeleton } from '@/components/stats/StatsSkeleton'

if (isLoading) {
  return <StatsSkeleton />
}
```

### 实施步骤

```bash
# 1. 确认环境
cd /Users/bypasser/claude-project/0930/claude-key-portal
git status
git log --oneline -5  # 确认Task 4已提交

# 2. 🔴 RED: 创建测试（可选）
touch tests/unit/components/stats/StatsSkeleton.test.tsx
# 编写骨架屏组件测试

# 3. 运行测试验证失败
npm test -- StatsSkeleton.test.tsx

# 4. 🟢 GREEN: 实现骨架屏组件
touch components/stats/StatsSkeleton.tsx
# 实现优化的骨架屏组件

# 5. 更新Stats页面
# 在 app/dashboard/stats/page.tsx 中使用新的骨架屏组件

# 6. 测试验证
npm run dev
# 访问 http://localhost:3000/dashboard/stats
# 刷新页面，观察加载状态

# 7. 运行测试确认通过
npm test -- stats

# 8. 提交代码
git add components/stats/StatsSkeleton.tsx
git add app/dashboard/stats/page.tsx
git add tests/unit/components/stats/StatsSkeleton.test.tsx  # 如有
git commit -m "feat(stats): improve loading skeleton UI (🟢 GREEN)

- 创建StatsSkeleton组件，匹配实际内容布局
- 优化骨架屏结构（标题、概览卡片、筛选器、图表、表格）
- 保留data-testid以兼容现有测试
- 使用Card组件提升视觉一致性
- 添加流畅的脉冲动画

Task: P2.9 Task 5 - 加载进度指示器"

# 9. 创建完成文档
touch docs/P2.9_TASK5_COMPLETION_SUMMARY.md
# 记录Task 5的完成情况

git add docs/P2.9_TASK5_COMPLETION_SUMMARY.md
git commit -m "docs(p2.9): Task 5 completion summary - loading skeleton ✅"

# 10. 更新下一阶段提示词
# 标记P2.9为完成状态
```

### 验收标准

- [ ] 骨架屏匹配实际内容布局（标题、卡片、图表、表格）
- [ ] 使用Card组件保持视觉一致性
- [ ] 保留`data-testid="stats-skeleton"`
- [ ] 脉冲动画流畅自然
- [ ] 所有测试通过
- [ ] 代码提交规范（包含TDD phase）

### 工作量估算

- **开发时间**: 1-2小时
- **测试时间**: 30分钟（可选）
- **文档时间**: 30分钟
- **总计**: 2-3小时

---

## 📊 P2.9 完整完成清单

完成Task 5后，P2.9阶段将100%完成：

- [x] Task 1: CRS趋势API集成 ✅ (12/12测试通过)
- [x] Task 2: CRS降级状态提示 ✅ (10/10测试通过)
- [x] Task 3: 手动刷新功能 ✅ (已集成)
- [x] Task 4: Toast错误提示优化 ✅ (17/17测试通过)
- [ ] Task 5: 加载进度指示器 ← 最后一个任务

**P2.9完成后**:
- 所有UI/UX改进完成
- Stats页面功能完整
- 用户体验优化完成
- 准备进入P3阶段（待定）

---

## 🔧 开发规范（必须遵循）

### 1. TDD流程（推荐）

虽然是UI改进，但可以遵循TDD：

```
🔴 RED: 先写测试（验证骨架屏结构）
🟢 GREEN: 实现功能（优化骨架屏组件）
🔵 REFACTOR: 重构优化（提取可复用组件）
```

### 2. Git提交规范

```bash
# 格式
<type>(<scope>): <subject> (<tdd-phase>)

# 示例
test(stats): add loading skeleton tests (🔴 RED)
feat(stats): improve loading skeleton UI (🟢 GREEN)
refactor(stats): extract skeleton component (🔵 REFACTOR)
```

### 3. UI设计原则

- **一致性**: 使用Card组件保持视觉统一
- **准确性**: 骨架屏匹配实际内容结构
- **流畅性**: 脉冲动画自然舒适
- **可访问性**: 保留测试ID和语义化标签

---

## 📚 核心文档参考

### 必读文档

1. **项目配置**:
   - `CLAUDE.md` - 项目开发规范
   - `DDD_TDD_GIT_STANDARD.md` - DDD+TDD综合标准

2. **UI组件**:
   - `components/ui/card.tsx` - Card组件
   - `components/ui/skeleton.tsx` - Skeleton组件（如需安装）

3. **当前实现**:
   - `app/dashboard/stats/page.tsx` - Stats页面（第133-148行）
   - `components/stats/*` - Stats相关组件

### Shadcn/ui组件参考

- **Card**: https://ui.shadcn.com/docs/components/card
- **Skeleton**: https://ui.shadcn.com/docs/components/skeleton

---

## 🚨 重要提醒

1. **保持兼容性**:
   - 保留`data-testid="stats-skeleton"`
   - 不破坏现有测试

2. **视觉一致性**:
   - 使用项目现有的Card组件
   - 遵循设计系统颜色规范

3. **性能优化**:
   - 避免过度动画
   - 保持骨架屏轻量级

4. **测试覆盖**:
   - 虽然是UI改进，建议添加基本测试
   - 确保骨架屏结构完整

---

## 🎯 开始命令

```bash
# 1. 确认位置和分支
cd /Users/bypasser/claude-project/0930/claude-key-portal
git branch  # 应在 feature/p2-usage-analytics

# 2. 检查状态和Task 4完成情况
git status
git log --oneline -5
# 应看到:
# f742928 docs(p2.9): Task 4 completion summary ✅
# 153055e feat(stats): implement Toast (🟢 GREEN)
# 63a4872 test(stats): add Toast tests (🔴 RED)

# 3. 开始Task 5 - 加载进度指示器
# 方式1: 直接优化现有骨架屏（推荐）
# 编辑 app/dashboard/stats/page.tsx

# 方式2: 创建独立组件（更规范）
mkdir -p components/stats
touch components/stats/StatsSkeleton.tsx

# 4. 开始开发
# 实现优化的骨架屏...
```

---

## 💡 快速参考

### 常用命令

```bash
# 运行开发服务器
npm run dev

# 运行测试
npm test -- stats
npm test -- StatsSkeleton.test.tsx  # 特定测试

# Git操作
git status
git add .
git commit -m "..."
git push origin feature/p2-usage-analytics
```

### Tailwind CSS动画类

```css
animate-pulse         /* 脉冲动画 */
transition-all        /* 平滑过渡 */
duration-200          /* 过渡时长 */
```

---

## 📝 任务完成后

1. **验证功能**:
   - 刷新Stats页面，观察骨架屏效果
   - 确认骨架屏匹配实际布局
   - 检查动画流畅性

2. **运行测试**:
   - 确保所有测试通过
   - 检查测试覆盖率

3. **提交代码**:
   - Git提交规范
   - 推送到远程分支

4. **创建完成文档**:
   - 记录Task 5完成情况
   - 标记P2.9为100%完成

5. **准备下一阶段**:
   - 更新NEXT_SESSION_PROMPT
   - 规划P3阶段任务（如有）

---

**准备好了吗？开始P2.9最后一个任务吧！** 🚀

完成Task 5后，P2.9阶段将全部完成，Stats页面的UI/UX优化达到最佳状态！

---

_"验证代码 → TDD开发 → 更新文档 → 持续迭代"_

**版本**: v3.0
**创建时间**: 2025-10-10
**最后更新**: 2025-10-10 (Task 4完成，准备Task 5)
**P2.9完成度**: 80% (4/5任务完成)
