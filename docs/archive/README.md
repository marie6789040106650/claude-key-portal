# 提示词历史版本归档

> **用途**: 保存历史版本的新窗口提示词，便于追溯项目进度

---

## 📋 版本历史

| 版本 | 日期 | 完成任务 | 下一任务 | 说明 |
|------|------|---------|---------|------|
| V2.0 | 2025-10-10 | P2.9 Task 2 - CRS降级状态提示 | P2.9 Task 3 - 手动刷新 | Task 2完成后版本 |
| V3.0 | 2025-10-10 | P2.9 Task 4 - Toast错误提示 | P2.9 Task 5 - 加载进度 | Task 4完成后版本（当前最新）|

---

## 📝 版本命名规则

```
NEXT_SESSION_PROMPT_V{major}.{minor}.md

major: 重大任务完成或新阶段开始
minor: 子任务完成（通常为0）

示例:
- V1.0 - 项目初始化
- V2.0 - P2.8完成
- V3.0 - P2.9 Task 4完成
```

---

## 🔄 归档流程

### 每次生成新版本时：

1. **移动旧版本到archive/**
   ```bash
   git mv docs/NEXT_SESSION_PROMPT_V{old}.md docs/archive/
   ```

2. **创建新版本在docs/**
   ```bash
   # 新版本保存在 docs/NEXT_SESSION_PROMPT_V{new}.md
   ```

3. **更新archive/README.md**
   ```bash
   # 添加版本历史记录
   ```

4. **提交到Git**
   ```bash
   git add docs/archive/ docs/NEXT_SESSION_PROMPT_V{new}.md
   git commit -m "docs(workflow): archive v{old} and create v{new}"
   ```

---

## 📂 目录结构

```
docs/
├── NEXT_SESSION_PROMPT_V{latest}.md   ← 当前使用（最新版本）
├── NEW_SESSION_PROMPT_TEMPLATE.md     ← 生成模板
└── archive/
    ├── README.md                       ← 本文件
    ├── NEXT_SESSION_PROMPT_V2.0.md    ← 历史版本
    └── NEXT_SESSION_PROMPT_V1.0.md    ← 历史版本（如有）
```

---

## 💡 为什么要归档？

### 优点
1. **保持整洁** - docs根目录只有最新版本
2. **追溯历史** - 可查看项目进度演变
3. **便于查找** - 最新版本一目了然
4. **Git记录** - 配合Git提交历史，完整追踪

### 查找历史版本
```bash
# 方式1: 查看archive目录
ls docs/archive/

# 方式2: 查看Git历史
git log --all --full-history -- "**/NEXT_SESSION_PROMPT_V*.md"

# 方式3: 查看某个版本的内容
git show HEAD~5:docs/NEXT_SESSION_PROMPT_V2.md
```

---

## 🚨 注意事项

1. **只归档，不删除** - 历史版本保留在archive/和Git中
2. **最新版本在根目录** - 便于快速查找
3. **更新README** - 每次归档都更新版本历史表
4. **Git提交规范** - 使用统一的commit message格式

---

**最后更新**: 2025-10-10
**当前最新版本**: V3.0
