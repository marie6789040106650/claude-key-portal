# 新窗口提示词自动生成模板

> **用途**: 每个阶段任务完成后，自动生成下一任务的新窗口提示词
> **创建时间**: 2025-10-10

---

## 📋 标准化流程

### 阶段1：任务完成确认

每个任务完成后，确保以下事项：

- [ ] ✅ 所有测试通过
- [ ] ✅ Git提交规范正确
- [ ] ✅ 完成文档已创建
- [ ] ✅ 代码已推送到远程分支

### 阶段2：生成新窗口提示词

**执行命令**:
```bash
# 在任务完成后，要求Claude生成新窗口提示词
# 使用以下指令：

"任务完成，请生成新窗口继续提示词"
```

**Claude会自动**:
1. 更新`NEXT_SESSION_PROMPT_V*.md`（版本号递增）
2. 标记当前任务为已完成
3. 准备下一任务的详细说明
4. 提供快速启动代码块

---

## 📝 提示词模板结构

### 必需部分

```markdown
# Claude Key Portal - 下一阶段工作提示词 (v{version})

## 📋 快速启动（复制到新窗口）

```
项目路径: /Users/bypasser/claude-project/0930/claude-key-portal
当前分支: {branch_name}

当前任务: {current_task}

已完成任务:
✅ {completed_task_1}
✅ {completed_task_2}
...

下一步:
{next_task_description}

参考文档: docs/NEXT_SESSION_PROMPT_V{version}.md

请开始{next_task}的开发工作。
```

## ✅ 最新完成（{date}）

### {completed_task_name} ✅

**TDD流程完成**:
- 🔴 RED: {test_description}
- 🟢 GREEN: {implementation_description}
- 🔵 REFACTOR: {refactor_description} (如有)

**交付物**:
- ✅ 测试: {test_files}
- ✅ 功能: {implementation_files}
- ✅ 文档: {documentation_files}

**核心功能**:
- ✅ {feature_1}
- ✅ {feature_2}
...

**Git提交**:
```
{commit_1}
{commit_2}
...
```

**测试结果**:
```
{test_results}
```

## 🎯 当前进度状态

{progress_table}

## 📋 下一任务：{next_task} ⭐

### 任务目标
{task_objective}

### 当前问题
{current_issues}

### 优化目标
{optimization_goals}

### 技术方案
{technical_approach}

### TDD开发流程
{tdd_workflow}

### 实施步骤
{implementation_steps}

### 验收标准
{acceptance_criteria}

### 工作量估算
{time_estimation}

## 🔧 开发规范（必须遵循）
{development_standards}

## 📚 核心文档参考
{reference_documents}

## 🚨 重要提醒
{important_reminders}

## 🎯 开始命令
{startup_commands}

## 💡 快速参考
{quick_reference}

## 📝 任务完成后
{post_completion_checklist}
```

---

## 🔄 版本控制规范

### 版本号规则

- **v1.0**: 初始版本
- **v2.0**: 重大任务完成后（如完成一个完整的P2.x任务）
- **v2.1**: 子任务完成后（如P2.9 Task 1完成）
- **v3.0**: 新阶段开始（如从P2进入P3）

### 文件命名

```
NEXT_SESSION_PROMPT_V{major}.{minor}.md
示例:
- NEXT_SESSION_PROMPT_V1.0.md  # 初始版本
- NEXT_SESSION_PROMPT_V2.0.md  # P2.8完成
- NEXT_SESSION_PROMPT_V2.1.md  # P2.9 Task 1完成
- NEXT_SESSION_PROMPT_V3.0.md  # P2.9 Task 4完成
```

### Git提交规范

```bash
git add docs/NEXT_SESSION_PROMPT_V*.md
git commit -m "docs(workflow): add next session prompt v{version} for {next_task}

新窗口提示词自动生成:
- 标记{completed_task}为已完成
- 准备{next_task}
- 详细的技术方案和实施步骤
- {progress_info}

下一任务: {next_task_brief}

Files: docs/NEXT_SESSION_PROMPT_V{version}.md"
```

---

## 📊 提示词生成清单

每次生成新窗口提示词时，确保包含：

### 基础信息
- [ ] 项目路径
- [ ] 当前分支
- [ ] 当前任务名称
- [ ] 已完成任务列表
- [ ] 下一任务描述

### 最新完成任务
- [ ] TDD流程说明（RED/GREEN/REFACTOR）
- [ ] 交付物清单（测试/功能/文档）
- [ ] 核心功能列表
- [ ] Git提交记录
- [ ] 测试结果统计

### 进度跟踪
- [ ] 当前进度表格
- [ ] 完成度百分比
- [ ] 剩余工作量估算

### 下一任务详情
- [ ] 任务目标明确
- [ ] 当前问题分析
- [ ] 优化目标清晰
- [ ] 技术方案完整
- [ ] TDD流程说明
- [ ] 实施步骤详细
- [ ] 验收标准明确
- [ ] 工作量估算

### 辅助信息
- [ ] 开发规范
- [ ] 核心文档参考
- [ ] 重要提醒
- [ ] 开始命令
- [ ] 快速参考
- [ ] 完成后清单

---

## 🎯 快速启动代码块模板

每次新窗口提示词必须包含以下代码块，方便用户直接复制粘贴：

```
项目路径: /Users/bypasser/claude-project/0930/claude-key-portal
当前分支: feature/p2-usage-analytics

当前任务: {TaskName}

已完成任务:
✅ Task 1: {Description} ({TestResults})
✅ Task 2: {Description} ({TestResults})
✅ Task 3: {Description} ({TestResults})

下一步:
{NextTaskDescription}

参考文档: docs/NEXT_SESSION_PROMPT_V{Version}.md

请开始{NextTask}的开发工作。
```

**关键要素**:
1. **项目路径** - 绝对路径
2. **当前分支** - Git分支名称
3. **当前任务** - 简明任务名称
4. **已完成任务** - 列表格式，包含测试结果
5. **下一步** - 清晰的下一步行动
6. **参考文档** - 完整提示词文档路径
7. **行动指令** - 明确的开始指令

---

## 📝 示例：Task完成后对话

### 用户输入

```
Task 4完成，请生成新窗口继续提示词
```

### Claude应该做的事

1. **确认Task 4完成状态**
   - 检查测试结果
   - 检查Git提交
   - 检查文档创建

2. **创建新版本提示词**
   - 文件名：`NEXT_SESSION_PROMPT_V{new_version}.md`
   - 内容包含所有必需部分
   - 快速启动代码块

3. **提交到Git**
   - 规范的commit message
   - 包含版本号和下一任务信息

4. **输出新窗口提示词**
   - 显示快速启动代码块
   - 说明文档位置
   - 提供后续指导

### Claude输出示例

```markdown
## ✅ Task 4 完成总结

已完成：Toast错误提示优化
测试：17/17 passed
提交：3个commits

## 📋 新窗口继续提示词

已创建：`docs/NEXT_SESSION_PROMPT_V3.md`

**快速启动（复制到新窗口）**:

```
项目路径: /Users/bypasser/claude-project/0930/claude-key-portal
当前分支: feature/p2-usage-analytics

当前任务: P2.9 Task 5 - 加载进度指示器

已完成任务:
✅ Task 1: CRS趋势API集成（12/12测试通过）
✅ Task 2: CRS降级状态提示（10/10测试通过）
✅ Task 3: 手动刷新功能（已集成）
✅ Task 4: Toast错误提示（17/17测试通过）

下一步:
优化Stats页面的加载骨架屏，提升用户体验

参考文档: docs/NEXT_SESSION_PROMPT_V3.md

请开始Task 5的开发工作。
```

**详细文档**: `docs/NEXT_SESSION_PROMPT_V3.md`（609行）

**下一任务**:
- 任务名称：P2.9 Task 5 - 加载进度指示器
- 工作量：1-2小时
- TDD流程：🟢 GREEN（UI改进）
- 完成后：P2.9达到100%完成

**Git提交**:
```
adddcf4 docs(workflow): add next session prompt v3 for Task 5
```
```

---

## 🔧 自动化建议（未来优化）

### 脚本化生成（可选）

```bash
#!/bin/bash
# scripts/generate-next-session-prompt.sh

# 用法: ./scripts/generate-next-session-prompt.sh <completed_task> <next_task>

COMPLETED_TASK=$1
NEXT_TASK=$2
CURRENT_VERSION=$(ls docs/NEXT_SESSION_PROMPT_V*.md | tail -1 | grep -o 'V[0-9.]*' | tr -d 'V')
NEW_VERSION=$(echo "$CURRENT_VERSION + 0.1" | bc)

# 生成新的提示词文件
cat > "docs/NEXT_SESSION_PROMPT_V${NEW_VERSION}.md" <<EOF
# Claude Key Portal - 下一阶段工作提示词 (v${NEW_VERSION})

## 📋 快速启动（复制到新窗口）

\`\`\`
项目路径: $(pwd)
当前分支: $(git branch --show-current)

当前任务: ${NEXT_TASK}

已完成任务:
$(git log --oneline -10 | grep "✅" | sed 's/^/✅ /')

下一步:
开始${NEXT_TASK}的开发工作

参考文档: docs/NEXT_SESSION_PROMPT_V${NEW_VERSION}.md
\`\`\`

...
EOF

# 提交到Git
git add "docs/NEXT_SESSION_PROMPT_V${NEW_VERSION}.md"
git commit -m "docs(workflow): add next session prompt v${NEW_VERSION} for ${NEXT_TASK}"

echo "✅ 新窗口提示词已生成: docs/NEXT_SESSION_PROMPT_V${NEW_VERSION}.md"
```

### Claude自动化（推荐）

每次任务完成后，直接告诉Claude：

```
任务完成，生成新窗口提示词
```

Claude会自动：
1. 分析Git提交历史
2. 检查测试结果
3. 确定下一任务
4. 生成完整提示词
5. 提交到Git
6. 输出快速启动代码块

---

## 📚 相关文档

- `docs/NEXT_SESSION_PROMPT_V*.md` - 历史版本提示词
- `CLAUDE.md` - 项目开发规范
- `DDD_TDD_GIT_STANDARD.md` - TDD标准流程
- `docs/P2_EXECUTION_PLAN.md` - P2阶段执行计划

---

## 🎯 最佳实践

### 1. 及时生成

每完成一个任务立即生成新窗口提示词，不要等到多个任务完成后批量生成。

### 2. 信息完整

确保提示词包含所有必要信息，新窗口可以零上下文开始工作。

### 3. 格式规范

使用统一的格式和结构，便于快速定位关键信息。

### 4. 版本管理

遵循版本号规范，便于追踪项目进度历史。

### 5. Git提交

每次生成新提示词都要提交到Git，保持文档和代码同步。

---

**模板版本**: v1.0
**创建时间**: 2025-10-10
**适用场景**: 所有阶段性任务完成后
**使用频率**: 每个任务完成后使用一次
