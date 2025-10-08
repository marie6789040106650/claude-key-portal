# Claude Key Portal - 通用继续提示词

> 在任何对话窗口使用此提示词可无缝继续项目开发

---

## 🎯 标准继续提示词

```
继续 Claude Key Portal 项目开发。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

请你：
1. 检查当前Git分支和状态
2. 读取 docs/EXECUTION_PLAN.md 了解执行计划
3. 读取 docs/KNOWN_ISSUES.md 了解已知问题
4. 检查当前进度（哪些阶段已完成，下一步是什么）
5. 继续执行下一个待完成的任务
6. 严格遵循TDD流程 (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)
7. 每完成一个任务立即更新相关文档

**并行执行原则**: 如果下一步任务可以并行执行（例如多个独立的模块删除、多个独立的测试修复），请同时创建它们的测试和实现，提高效率。

如果发现计划文档不存在或已完成所有工作，请告诉我当前状态。

开始吧！
```

---

## 📋 针对特定阶段的提示词

### 1. 移除过度设计功能阶段

```
继续 Claude Key Portal 项目的过度设计功能移除工作。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

当前阶段: 移除过度设计功能（~1400行代码）

请你：
1. 检查当前分支（应该在 feature/remove-overengineered-features）
2. 读取 docs/PROJECT_BOUNDARY_REVIEW.md 了解需要移除的功能
3. 按照并行原则同时移除以下独立模块：
   - 监控系统 (app/api/monitor/*)
   - 会话管理 (app/api/user/sessions/*)
   - 过期设置 (app/api/user/expiration-settings/* 和相关页面)
4. 单独处理通知系统（较复杂）
5. 每完成一组移除后运行测试验证
6. 更新 docs/EXECUTION_PLAN.md

开始执行并行移除任务！
```

---

### 2. 修复测试问题阶段

```
继续 Claude Key Portal 项目的测试修复工作。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

当前任务: 修复Toast Mock缺失问题（23个测试失败）

请你：
1. 检查当前分支
2. 读取 docs/KNOWN_ISSUES.md 了解问题详情（ISSUE-001）
3. 同时修复以下测试文件的Toast Mock：
   - tests/unit/components/keys/FavoriteButton.test.tsx
   - tests/unit/components/keys/NotesEditor.test.tsx
   - tests/unit/components/keys/TagSelector.test.tsx
4. 运行测试验证修复效果
5. 更新 docs/KNOWN_ISSUES.md 标记问题为已解决

开始并行修复测试！
```

---

### 3. P2功能开发阶段

```
继续 Claude Key Portal 项目的P2阶段功能开发。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

当前阶段: P2功能开发

请你：
1. 检查当前分支和状态
2. 读取 docs/EXECUTION_PLAN.md 的P2规划
3. 读取 PROJECT_CORE_DOCS/02_功能需求和边界.md 确认P2需求
4. 按照优先级开发：
   - 调用日志查询（代理CRS）
   - 高级搜索和筛选
   - 数据导出功能（CSV、JSON）
5. 严格遵循TDD流程
6. 每完成一个功能更新文档

**重要**: 本系统是CRS的用户管理门户，只代理CRS功能，不过度设计。

开始P2功能开发！
```

---

## 🔍 诊断和审查提示词

### 检查项目状态

```
检查 Claude Key Portal 项目的当前状态。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

请你：
1. 检查Git分支和最近的提交
2. 读取 docs/EXECUTION_PLAN.md
3. 读取 docs/PROJECT_BOUNDARY_REVIEW.md
4. 读取 docs/KNOWN_ISSUES.md
5. 运行 npm test 检查测试状态
6. 运行 npm run build 检查构建状态
7. 总结当前进度和下一步建议

给我一个完整的项目状态报告！
```

---

### 边界审查

```
对 Claude Key Portal 项目进行边界审查。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

请你：
1. 读取 PROJECT_CORE_DOCS/02_功能需求和边界.md
2. 列出所有已实现的API端点和页面
3. 对比需求文档，识别：
   - 过度设计的功能（需求外）
   - 缺失的功能（需求内）
4. 更新 docs/PROJECT_BOUNDARY_REVIEW.md
5. 更新 docs/KNOWN_ISSUES.md
6. 提供行动建议

开始边界审查！
```

---

## ⚠️ 使用注意事项

### 项目铁律

1. **CRS依赖原则**: 本系统是CRS的用户管理门户
   - ✅ 代理CRS Admin API
   - ❌ 不实现密钥生成逻辑
   - ❌ 不过度设计

2. **TDD强制执行**: 所有功能必须遵循
   - 🔴 RED: 先写测试
   - 🟢 GREEN: 实现功能
   - 🔵 REFACTOR: 重构优化

3. **并行执行优先**: 独立任务应同时进行
   - ✅ 多个API删除可并行
   - ✅ 多个测试修复可并行
   - ❌ 有依赖的任务必须串行

4. **文档同步更新**: 每完成任务立即更新
   - docs/EXECUTION_PLAN.md - 执行计划
   - docs/KNOWN_ISSUES.md - 问题追踪
   - docs/PROJECT_BOUNDARY_REVIEW.md - 边界审查

### Git规范

```bash
# Commit消息格式
type(scope): subject (🔴 RED|🟢 GREEN|🔵 REFACTOR)

# 分支命名
feature/<phase>-<feature-name>
fix/<issue-id>-<short-description>
refactor/<description>
docs/<description>
```

---

## 📚 核心文档索引

**必读文档**:
1. `docs/EXECUTION_PLAN.md` - 执行计划和进度
2. `docs/KNOWN_ISSUES.md` - 已知问题和解决方案
3. `docs/PROJECT_BOUNDARY_REVIEW.md` - 边界审查报告
4. `PROJECT_CORE_DOCS/02_功能需求和边界.md` - 需求定义
5. `DDD_TDD_GIT_STANDARD.md` - 开发标准

**配置文件**:
- `CLAUDE.md` - 项目级配置
- `API_MAPPING_SPECIFICATION.md` - API规范
- `DATABASE_SCHEMA.md` - 数据库设计

---

## 🚀 快速上手示例

### 示例1: 新窗口继续开发

```
继续 Claude Key Portal 项目开发。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

请检查当前状态并继续下一步工作。如果有可以并行执行的任务，请同时进行。

开始吧！
```

### 示例2: 从特定任务恢复

```
继续 Claude Key Portal 项目。

项目路径: /Users/bypasser/claude-project/0930/claude-key-portal

我上次在移除过度设计功能，请继续完成剩余的移除任务。

按照并行原则执行！
```

---

**创建时间**: 2025-10-08
**适用版本**: 所有开发阶段
**维护者**: Claude Key Portal Team
