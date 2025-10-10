# 开发指南

本目录包含开发规范、工作流程和最佳实践文档。

## 📋 核心规范

### 必读文档 ⭐

- [DDD+TDD+Git标准](./DDD_TDD_GIT_STANDARD.md) - **完整开发标准（必读！）**
  - DDD Lite分层架构
  - TDD强制执行流程
  - Git提交规范
  - 质量标准

- [TDD工作流](./TDD_GIT_WORKFLOW.md) - 测试驱动开发详细流程
  - 🔴 RED → 🟢 GREEN → 🔵 REFACTOR
  - Git工作流集成
  - 实战示例

- [开发最佳实践](./DEVELOPMENT_BEST_PRACTICES.md) - 编码规范和设计模式

## 🔧 集成和测试

### CRS集成

- [CRS集成标准](./CRS_INTEGRATION_STANDARD.md) - CRS集成开发规范
- [集成测试快速开始](./QUICK_START_INTEGRATION_TESTING.md) - 快速开始指南

### 测试策略

- [测试策略](./TESTING_STRATEGY.md) - 测试分层、覆盖率要求
- [跳过的测试](./TESTS_SKIPPED_UNIMPLEMENTED.md) - 暂时跳过的测试清单

## 📚 文档和问题

- [文档标准](./DOCUMENTATION_STANDARD.md) - 文档编写和管理规范
- [已知问题](./KNOWN_ISSUES.md) - 当前已知问题列表

---

## 💡 快速开始

### 新人上手路径

1. **Day 1**: 阅读 [DDD+TDD+Git标准](./DDD_TDD_GIT_STANDARD.md)
2. **Day 2**: 实践 [TDD工作流](./TDD_GIT_WORKFLOW.md)
3. **Day 3**: 参考 [开发最佳实践](./DEVELOPMENT_BEST_PRACTICES.md)
4. **Day 4**: 学习 [CRS集成标准](./CRS_INTEGRATION_STANDARD.md)

### 开发流程速查

```bash
# 1. 创建分支
git checkout -b feature/your-feature

# 2. TDD开发
# 🔴 RED: 写测试
npm test  # 失败
git commit -m "test(scope): add test (🔴 RED)"

# 🟢 GREEN: 写实现
npm test  # 通过
git commit -m "feat(scope): implement feature (🟢 GREEN)"

# 🔵 REFACTOR: 重构
npm test  # 仍然通过
git commit -m "refactor(scope): optimize code (🔵 REFACTOR)"

# 3. 推送和PR
git push origin feature/your-feature
```

---

**返回**: [文档导航中心](../../DOCS_INDEX.md) | [项目首页](../../README.md)
