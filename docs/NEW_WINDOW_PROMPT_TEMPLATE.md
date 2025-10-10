# 新窗口通用提示词模板

> **用途**: 开启新终端时的标准化启动提示词
> **原则**: 简洁、清晰、自适应

---

## 📋 通用提示词（复制到新窗口）

```
项目: Claude Key Portal
路径: /Users/bypasser/claude-project/0930/claude-key-portal

请执行以下操作：
1. 检查项目状态（分支、最新提交、待办任务）
2. 读取下一阶段任务（如果有 NEXT_SESSION_PROMPT 文件）
3. 开始工作

使用命令: /check-status
```

---

## 🤖 Claude自动执行流程

当你在新窗口输入上述提示词后，Claude会自动：

### 1. 检查项目状态
```bash
# 自动执行
cd /Users/bypasser/claude-project/0930/claude-key-portal
git branch  # 查看当前分支
git status  # 查看工作区状态
git log --oneline -5  # 查看最近提交
```

### 2. 读取任务文档
```bash
# 按优先级查找任务文档
ls docs/NEXT_SESSION_PROMPT_V*.md | sort -V | tail -1  # 最新版本提示词
ls docs/*_EXECUTION_PLAN.md  # 执行计划
ls docs/NEXT_STEPS_SUMMARY.md  # 下一步总结
```

### 3. 展示任务信息
- 当前分支和状态
- 最近的工作内容
- 下一步任务说明
- 相关文档列表

### 4. 询问如何开始
- 是否继续之前的任务？
- 是否开始新任务？
- 是否需要详细计划？

---

## 📝 简化版提示词（推荐）

```
claude-key-portal
继续上次的工作
```

**解释**:
- 第一行：项目名称（Claude会识别项目路径）
- 第二行：意图说明（Claude会自动读取状态和任务）

---

## 🎯 适配不同场景

### 场景1: 继续之前的任务
```
项目: claude-key-portal
继续上次的工作
```

### 场景2: 开始新任务
```
项目: claude-key-portal
开始新任务: P3.1测试修复
参考: docs/P3.1_TEST_FIX_PLAN.md
```

### 场景3: 快速修复
```
项目: claude-key-portal
快速修复: [描述问题]
```

### 场景4: 查看状态
```
项目: claude-key-portal
查看当前状态和下一步任务
```

---

## 🔧 自定义Slash命令（可选）

### /check-status
自动检查项目状态并展示下一步任务

**实现**:
```bash
# 创建别名
alias check-status='cd /Users/bypasser/claude-project/0930/claude-key-portal && \
  echo "📍 当前分支:" && git branch --show-current && \
  echo -e "\n📝 最近提交:" && git log --oneline -3 && \
  echo -e "\n📋 下一步任务:" && \
  (ls docs/NEXT_SESSION_PROMPT_V*.md 2>/dev/null | sort -V | tail -1 | xargs cat | head -30)'
```

### /start-task <name>
开始新任务并创建分支

**实现**:
```bash
alias start-task='function _start_task() {
  cd /Users/bypasser/claude-project/0930/claude-key-portal
  git checkout -b "feature/$1"
  echo "✅ 已创建分支: feature/$1"
}; _start_task'
```

---

## 📚 文档查找优先级

Claude会按以下顺序查找任务文档：

1. **最新提示词**: `docs/NEXT_SESSION_PROMPT_V*.md` (最高版本号)
2. **执行计划**: `docs/P*_EXECUTION_PLAN.md`
3. **任务计划**: `docs/P*_TASK*_PLAN.md`
4. **下一步总结**: `docs/NEXT_STEPS_SUMMARY.md`
5. **项目文档**: `PROJECT_CORE_DOCS/`

---

## ✅ 最简提示词（推荐使用）

### 方式1: 极简版
```
claude-key-portal
```

Claude会自动：
- ✅ 识别项目路径
- ✅ 检查Git状态
- ✅ 读取最新任务文档
- ✅ 展示下一步行动

### 方式2: 带意图版
```
claude-key-portal
[你的意图，如: 继续测试修复 / 开始新功能 / 查看状态]
```

### 方式3: 指定任务版
```
claude-key-portal
任务: P3.1测试修复
文档: docs/P3.1_TEST_FIX_PLAN.md
```

---

## 🎨 Claude响应模板

当你输入简化提示词后，Claude会按以下格式回应：

```
## 📍 项目状态

**项目**: Claude Key Portal
**路径**: /Users/bypasser/claude-project/0930/claude-key-portal
**分支**: feature/xxx
**状态**: [clean / modified / ...]

## 📝 最近工作

[最近3次提交]

## 📋 下一步任务

[从NEXT_SESSION_PROMPT读取的任务说明]

## 🚀 开始方式

你想要:
1. 继续之前的任务？
2. 开始新任务？
3. 查看详细计划？

请告诉我你的选择。
```

---

## 💡 使用建议

### ✅ 推荐做法
```
# 最简洁 - 让Claude自动判断
claude-key-portal

# 明确意图 - 清晰表达
claude-key-portal
继续P3.1测试修复

# 指定文档 - 精确定位
claude-key-portal
参考: docs/P3.1_TEST_FIX_PLAN.md
```

### ❌ 避免做法
```
# 不要过于详细
claude-key-portal
项目路径是xxx，分支是xxx，最近的提交是xxx...
(这些Claude会自动检查)

# 不要重复文档内容
claude-key-portal
下一步要做xxx，然后xxx，最后xxx...
(直接引用文档即可)
```

---

## 🔄 与自动化监控器集成

### claude-monitor配合使用

**当前任务完成时**:
```bash
# 标记完成并更新提示词
claude-monitor done "下一阶段任务说明"
```

**新窗口自动打开时**:
- 自动显示提示词
- 自动读取任务文档
- 自动展示下一步

**手动启动新窗口**:
```
claude-key-portal
```

---

## 📋 完整示例

### 示例1: 早上开始工作
```
你: claude-key-portal

Claude:
📍 项目状态
- 分支: feature/p3-test-fixes
- 状态: clean
- 最近提交: test: fix toast mock issues

📋 下一步任务
继续P3.1测试修复 - Day 2: 启用跳过测试
参考: docs/P3.1_TEST_FIX_PLAN.md

🚀 继续工作吗？
```

### 示例2: 切换任务
```
你:
claude-key-portal
开始P3.2核心功能开发

Claude:
📍 切换到新任务
- 当前: P3.1已完成
- 新任务: P3.2核心功能开发
- 文档: docs/P3.2_CORE_FEATURES_PLAN.md

创建新分支吗？
```

---

## 🎯 核心优势

### 1. 简洁高效
- 一行搞定项目定位
- 自动读取上下文
- 无需重复信息

### 2. 自适应强
- 自动识别最新任务
- 智能展示相关文档
- 灵活匹配意图

### 3. 一致性好
- 标准化流程
- 统一的回应格式
- 可预期的行为

### 4. 易于维护
- 文档驱动
- 约定优于配置
- 自动化友好

---

## 📖 总结

**最推荐的通用提示词**:

```
claude-key-portal
```

就这么简单！Claude会自动完成剩下的工作。

如果需要明确意图:

```
claude-key-portal
[你的意图/任务名称]
```

**原则**:
- ✅ 简洁优于详细
- ✅ 意图优于步骤
- ✅ 引用优于复制

---

_"简单就是美 - 让AI帮你处理繁琐的上下文加载！"_
