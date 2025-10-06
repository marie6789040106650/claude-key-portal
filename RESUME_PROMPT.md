# 继续执行重组工作 - 提示词模板

> **用途**: 在新的对话窗口中复制此提示词，让Claude继续执行DDD Lite重组工作

---

## 📋 提示词（直接复制使用）

```
我正在进行 Claude Key Portal 项目的 DDD Lite 架构重组。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

核心文档：
1. 执行计划（主文档）: docs/EXECUTION_PLAN.md
2. 代码复用分析: docs/CODE_REUSE_ANALYSIS.md
3. 重组方案: docs/REFACTORING_PLAN.md
4. 快速参考: NEXT_STEPS.md

当前状态：
- 当前分支: feature/project-structure-cleanup
- 已完成: Phase 0-1 (领域层创建, 20%)
- 下一步: Phase 2 (基础设施层迁移)

请你：
1. 阅读 docs/EXECUTION_PLAN.md 了解完整计划
2. 检查当前进度和待完成任务
3. 继续执行下一个Phase的工作
4. 严格遵循TDD流程 (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)
5. 每完成一个任务立即更新 EXECUTION_PLAN.md 文档

开始工作吧！
```

---

## 📝 使用说明

### 在新窗口使用此提示词的步骤：

1. **复制上面的提示词**（在 ``` 代码块内的全部内容）

2. **打开新的Claude对话窗口**

3. **粘贴提示词并发送**

4. **Claude会自动**：
   - ✅ 读取 `docs/EXECUTION_PLAN.md`
   - ✅ 检查当前进度（Phase、任务状态）
   - ✅ 继续执行下一个待完成的任务
   - ✅ 更新文档进度

### 如果需要指定从某个特定Phase开始：

```
我正在进行 Claude Key Portal 项目的 DDD Lite 架构重组。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

核心文档：docs/EXECUTION_PLAN.md

请你：
1. 阅读执行计划文档
2. 从 Phase X.X 开始继续执行（替换为具体Phase）
3. 严格遵循TDD流程
4. 及时更新文档进度

开始 Phase X.X 的工作！
```

---

## 🔍 Claude会自动做的事情

当收到上述提示词后，Claude会：

1. **读取关键文档**
   ```bash
   Read: docs/EXECUTION_PLAN.md
   Read: NEXT_STEPS.md
   ```

2. **检查进度**
   - 查看哪些Phase已完成 ✅
   - 找到下一个待执行的任务 🔴

3. **继续工作**
   - 按照TDD流程执行
   - 创建测试文件
   - 实现功能
   - 重构优化

4. **更新文档**
   - 更新任务状态（🔴 → 🟢 → ✅）
   - 更新完成度百分比
   - 记录Git提交

---

## 🎯 预期对话流程

**你发送提示词后，Claude会回复类似**：

```
✅ 已读取执行计划文档

当前进度：
- Phase 0-1: ✅ 完成 (20%)
- Phase 2.1: 🔴 待开始 (持久化层)

下一步任务：
- [ ] 移动Prisma文件
- [ ] 创建UserRepository测试
- [ ] 实现UserRepository

开始执行 Phase 2.1...
```

然后Claude会自动开始工作！

---

## 💡 高级用法

### 1. 检查进度但不执行

```
检查 Claude Key Portal 项目的重组进度。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal
执行计划: docs/EXECUTION_PLAN.md

请告诉我：
1. 当前完成了哪些Phase
2. 下一步要做什么
3. 预计还需要多少时间

不要开始执行，只报告进度。
```

### 2. 更新文档

```
更新 Claude Key Portal 项目的执行计划文档。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

我已经手动完成了：
- Phase 2.1: UserRepository
- Phase 2.2: PasswordService

请更新 docs/EXECUTION_PLAN.md 中对应的任务状态为 ✅
并更新总体完成度百分比。
```

### 3. 跳过某个Phase

```
继续 Claude Key Portal 项目的重组工作。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal
执行计划: docs/EXECUTION_PLAN.md

跳过 Phase 2，直接从 Phase 3（应用层）开始执行。

请更新文档并开始工作。
```

---

## 📊 文档结构速查

```
claude-key-portal/
├── NEXT_STEPS.md              # 快速参考（一页纸）
├── RESUME_PROMPT.md           # 本文档（提示词模板）
└── docs/
    ├── EXECUTION_PLAN.md      # ⭐ 主文档（详细计划+进度）
    ├── CODE_REUSE_ANALYSIS.md # 代码复用分析
    ├── REFACTORING_PLAN.md    # 技术方案
    └── REFACTORING_SUMMARY.md # 工作总结
```

---

## ✅ 快速测试

**测试Claude是否正确理解**：

复制下面的简短版提示词测试：

```
继续 Claude Key Portal DDD重组。
路径: /Users/bypasser/claude-project/0930/claude-key-portal
执行计划: docs/EXECUTION_PLAN.md

检查进度并继续下一个任务。
```

如果Claude回复了当前进度和下一步行动，说明一切正常！

---

**创建时间**: 2025-10-06
**最后更新**: 2025-10-06
**文档版本**: v1.0
