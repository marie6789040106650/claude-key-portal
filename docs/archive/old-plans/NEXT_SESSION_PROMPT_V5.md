# Claude Key Portal - P3.1 测试修复启动提示词

> **创建时间**: 2025-10-10
> **当前阶段**: P3.1 - 测试修复
> **目标**: 提升测试通过率从52%到80%+

---

## 📋 快速启动（复制到新窗口）

```
项目路径: /Users/bypasser/claude-project/0930/claude-key-portal
当前分支: feature/p2-usage-analytics (即将切换到 feature/p3-test-fixes)

当前任务: P3.1 - 测试修复行动计划

背景:
✅ P2.9已完成 - Stats页面UI/UX完善 (100%)
⚠️ 测试问题 - 当前通过率52% (504/969)，需提升到80%+

下一步:
1. 查看测试修复计划: docs/P3.1_TEST_FIX_PLAN.md
2. 创建修复分支: git checkout -b feature/p3-test-fixes
3. 分析测试失败原因
4. 按Day 1-3计划修复

参考文档: docs/P3.1_TEST_FIX_PLAN.md

请开始P3.1测试修复工作。
```

---

## ✅ 前置完成情况

### P2.9 - Stats页面UI/UX完善 ✅ 100%完成

| Task | 功能 | 测试 | 状态 |
|------|-----|------|------|
| Task 1 | CRS趋势API集成 | 12/12 | ✅ |
| Task 2 | CRS降级状态提示 | 10/10 | ✅ |
| Task 3 | 手动刷新功能 | 已集成 | ✅ |
| Task 4 | Toast错误提示 | 17/17 | ✅ |
| Task 5 | 加载进度指示器 | 已完成 | ✅ |

**最新提交**:
```bash
dcabee2 docs: add next steps summary for P3 phase
275a13a docs(p3): add execution plan - pragmatic approach
762c352 docs(p2.9): Task 5 completion summary - loading skeleton ✅
c90c6df feat(stats): improve loading skeleton UI (🟢 GREEN)
```

---

## 🎯 P3.1 任务目标

### 核心目标
**提升测试通过率: 52% → 80%+**

### 当前测试状态
```
测试通过率: 52% (504/969)
├── 通过: 504个
├── 失败: 51个  ← 需要修复
└── 跳过: 414个 ← 需要评估

测试套件状态:
├── 通过: 34个
├── 失败: 17个
└── 跳过: 17个
```

### 工作量估算
- **预计时间**: 2-3天
- **优先级**: ⭐⭐⭐ 最高

---

## 📋 3天修复计划

### Day 1: Mock测试修复 (8小时)

**上午任务**:
- [ ] Task 1.1: Toast Mock统一配置
  - 创建 `tests/setup/toast-mock.ts`
  - 统一所有测试的Toast mock

- [ ] Task 1.2: 修复Toast相关测试
  ```bash
  npm test -- --testPathPattern=toast
  ```

- [ ] Task 1.3: 修复定时器测试
  ```bash
  npm test -- --testPathPattern=timer
  ```

**下午任务**:
- [ ] Task 1.4: 修复事件处理测试
  ```bash
  npm test -- --testPathPattern=event
  ```

- [ ] Task 1.5: 验证修复效果
  ```bash
  npm test -- --coverage
  ```

**验收标准**:
- [ ] Toast测试全部通过
- [ ] 定时器测试全部通过
- [ ] 事件处理测试全部通过

---

### Day 2: 跳过测试处理 (8小时)

**上午任务**:
- [ ] Task 2.1: 列出所有跳过测试
  ```bash
  grep -r "\.skip\|xit\|xdescribe" tests/ > skipped_tests.txt
  ```

- [ ] Task 2.2: 分类评估
  - 核心业务测试 → 必须启用
  - UI交互测试 → 评估后启用
  - 边界情况测试 → 可保持跳过

- [ ] Task 2.3: 启用核心测试
  - 移除 `.skip`
  - 修复测试代码

**下午任务**:
- [ ] Task 2.4: 运行启用的测试
  ```bash
  npm test
  ```

- [ ] Task 2.5: 修复失败测试
  - 逐个解决问题

- [ ] Task 2.6: 删除过时测试
  ```bash
  git rm <obsolete-test-files>
  ```

**验收标准**:
- [ ] 核心测试全部启用
- [ ] 过时测试已删除
- [ ] 测试通过率 > 75%

---

### Day 3: 稳定性优化 (6小时)

**上午任务**:
- [ ] Task 3.1: 添加测试隔离
  ```typescript
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  afterEach(() => {
    cleanup()
    jest.clearAllTimers()
  })
  ```

- [ ] Task 3.2: 修复异步测试
  - 统一使用 `async/await`
  - 避免测试竞态条件

- [ ] Task 3.3: 优化测试配置
  ```javascript
  // jest.config.js
  {
    maxWorkers: 4,
    testTimeout: 10000,
    clearMocks: true,
  }
  ```

**下午任务**:
- [ ] Task 3.4: 完整测试运行
  ```bash
  npm test -- --coverage
  ```

- [ ] Task 3.5: CI/CD验证
  ```bash
  git push origin feature/p3-test-fixes
  ```

- [ ] Task 3.6: 创建完成文档
  - `docs/P3.1_COMPLETION_SUMMARY.md`

**验收标准**:
- [ ] 测试通过率 ≥ 80%
- [ ] 测试执行稳定
- [ ] CI/CD通过
- [ ] 文档更新完成

---

## 🔧 常用命令速查

### 测试相关
```bash
# 查看所有测试
npm test -- --listTests

# 只运行失败的测试
npm test -- --onlyFailures

# 详细错误信息
npm test -- --verbose

# 单个测试文件
npm test -- <test-file-path>

# 覆盖率报告
npm test -- --coverage
open coverage/lcov-report/index.html
```

### 分支操作
```bash
# 创建修复分支
git checkout -b feature/p3-test-fixes

# 查看状态
git status
git log --oneline -5

# 提交规范
git commit -m "test: fix toast mock issues (🔴 RED)"
git commit -m "test: enable skipped core tests (🟢 GREEN)"
git commit -m "test: optimize test isolation (🔵 REFACTOR)"
```

---

## 🔍 问题诊断指南

### Mock问题排查
```typescript
// ❌ 常见错误
const { toast } = useToast()
// TypeError: useToast is not a function

// ✅ 正确Mock
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))
```

### 定时器问题排查
```typescript
// ❌ 常见错误
setTimeout(() => { /* ... */ }, 1000)
// 测试超时

// ✅ 正确处理
jest.useFakeTimers()
// ... 执行代码
jest.runAllTimers()
jest.useRealTimers()
```

### 异步测试问题
```typescript
// ❌ 错误写法
test('async test', () => {
  fetchData().then(data => {
    expect(data).toBe('result')
  })
})

// ✅ 正确写法
test('async test', async () => {
  const data = await fetchData()
  expect(data).toBe('result')
})
```

---

## 📚 核心文档参考

### 必读文档
1. **P3.1详细计划**: `docs/P3.1_TEST_FIX_PLAN.md` ⭐
2. **P3总体规划**: `docs/P3_EXECUTION_PLAN.md`
3. **TDD标准**: `DDD_TDD_GIT_STANDARD.md`
4. **项目规范**: `CLAUDE.md`

### 测试配置
- `jest.config.js` - Jest配置
- `tests/setup/` - 测试环境配置
- `.github/workflows/` - CI/CD配置

---

## ✅ 开始前检查清单

- [ ] 项目路径正确: `/Users/bypasser/claude-project/0930/claude-key-portal`
- [ ] 已阅读 `docs/P3.1_TEST_FIX_PLAN.md`
- [ ] 理解测试修复3天计划
- [ ] 创建修复分支 `feature/p3-test-fixes`
- [ ] 查看当前测试状态
  ```bash
  npm test 2>&1 | tee test-status.log
  ```

---

## 🚀 启动命令（复制执行）

```bash
# 1. 确认项目路径
cd /Users/bypasser/claude-project/0930/claude-key-portal

# 2. 查看当前分支和状态
git branch
git status
git log --oneline -5

# 3. 查看详细修复计划
cat docs/P3.1_TEST_FIX_PLAN.md

# 4. 创建修复分支
git checkout -b feature/p3-test-fixes

# 5. 查看测试状态（保存到日志）
npm test 2>&1 | tee test-status-initial.log

# 6. 分析失败测试
grep "FAIL" test-status-initial.log

# 7. 开始Day 1修复
# 按照 P3.1_TEST_FIX_PLAN.md 的Day 1计划执行
```

---

## 📊 成功标准

### P3.1完成标准
- [ ] 测试通过率 ≥ 80% (至少775/969)
- [ ] 修复所有失败测试 (51个)
- [ ] 启用关键跳过测试
- [ ] 测试执行时间 < 30秒
- [ ] CI/CD稳定通过

### 代码质量标准
- [ ] 测试隔离良好
- [ ] 异步测试稳定
- [ ] Mock配置统一
- [ ] 无警告和错误

### 文档标准
- [ ] 修复过程记录完整
- [ ] 问题解决方案文档化
- [ ] 测试最佳实践更新

---

## 💡 重要提醒

### 核心原则
1. **先分析后修复** - 理解失败原因再动手
2. **一次修一类** - Mock、定时器、事件分别处理
3. **保持测试隔离** - 避免测试间相互影响
4. **记录解决方案** - 为后续提供参考

### Git提交规范
```bash
# TDD标记必须
test: fix toast mock issues (🔴 RED)
test: enable skipped core tests (🟢 GREEN)
test: optimize test isolation (🔵 REFACTOR)

# 文档更新
docs(p3.1): add test fix summary
```

### 避免陷阱
- ❌ 不要跳过失败测试（用.skip）
- ❌ 不要删除重要测试
- ❌ 不要修改业务代码来让测试通过
- ✅ 修复测试代码和Mock配置
- ✅ 保持业务逻辑不变

---

## 🎯 下一步行动

执行以下命令开始P3.1：

```bash
cd /Users/bypasser/claude-project/0930/claude-key-portal
git checkout -b feature/p3-test-fixes
npm test 2>&1 | tee test-status-initial.log
```

然后按照 **Day 1 → Day 2 → Day 3** 的计划执行。

**准备好了吗？开始修复测试，提升代码质量！** 🔧

---

**版本**: v5.0
**创建时间**: 2025-10-10
**任务**: P3.1 测试修复
**预计完成**: 2025-10-13

---

_"稳定的测试是高质量代码的基础！"_
