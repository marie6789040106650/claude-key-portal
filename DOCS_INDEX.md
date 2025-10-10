# 📚 文档导航中心

**Claude Key Portal** 完整文档索引 - 快速找到你需要的文档

---

## 🚀 快速开始

### 新人必读（按顺序阅读）

1. [README.md](./README.md) - 项目入口和快速开始
2. [项目背景](./PROJECT_CORE_DOCS/01_项目背景.md) - 为什么做这个项目
3. [功能需求和边界](./PROJECT_CORE_DOCS/02_功能需求和边界.md) - 做什么，不做什么
4. [发展路线图](./PROJECT_CORE_DOCS/03_发展路线图.md) - 如何做，分几步

### 核心配置

- [CLAUDE.md](./CLAUDE.md) - AI开发配置和项目铁律
- [REUSABLE_STANDARDS.md](./REUSABLE_STANDARDS.md) - 可复用标准（用于下个项目）
- [PROJECT_CLEANUP_FINAL.md](./PROJECT_CLEANUP_FINAL.md) - 最新项目清理报告

---

## 📖 技术参考 → [docs/reference/](./docs/reference/)

**完整索引**: [docs/reference/README.md](./docs/reference/README.md)

### 核心参考文档

- [API规范](./docs/reference/API_MAPPING_SPECIFICATION.md) - Portal和CRS的API映射关系（32KB）
- [数据库设计](./docs/reference/DATABASE_SCHEMA.md) - Prisma schema和数据表结构（22KB）
- [组件库](./docs/reference/COMPONENT_LIBRARY.md) - Shadcn/ui组件使用文档（47KB）
- [UI设计规范](./docs/reference/UI_DESIGN_SPECIFICATION.md) - 设计系统和样式指南（29KB）

### 集成和架构

- [CRS集成验证](./docs/reference/CRS_API_VERIFICATION.md) - CRS API测试和验证报告
- [项目结构分析](./docs/reference/PROJECT_STRUCTURE_ANALYSIS.md) - 目录结构说明
- [保留但未使用资源](./docs/reference/RESERVED_BUT_UNUSED.md) - 未来功能清单

---

## 🔧 开发指南 → [docs/development/](./docs/development/)

**完整索引**: [docs/development/README.md](./docs/development/README.md)

### 必读规范 ⭐

- [DDD+TDD+Git标准](./docs/development/DDD_TDD_GIT_STANDARD.md) - **完整开发标准（必读！）** （30KB）
  - DDD Lite分层架构
  - TDD强制执行流程
  - Git提交规范
  - 质量标准

- [TDD工作流](./docs/development/TDD_GIT_WORKFLOW.md) - 测试驱动开发详细流程（35KB）
  - 🔴 RED → 🟢 GREEN → 🔵 REFACTOR
  - Git工作流集成
  - 实战示例

- [开发最佳实践](./docs/development/DEVELOPMENT_BEST_PRACTICES.md) - 编码规范和设计模式（18KB）

### 集成和测试

- [CRS集成标准](./docs/development/CRS_INTEGRATION_STANDARD.md) - CRS集成开发规范
- [测试策略](./docs/development/TESTING_STRATEGY.md) - 测试分层、覆盖率要求
- [集成测试快速开始](./docs/development/QUICK_START_INTEGRATION_TESTING.md) - 快速开始指南
- [跳过的测试](./docs/development/TESTS_SKIPPED_UNIMPLEMENTED.md) - 暂时跳过的测试清单

### 文档和问题

- [文档标准](./docs/development/DOCUMENTATION_STANDARD.md) - 文档编写和管理规范
- [已知问题](./docs/development/KNOWN_ISSUES.md) - 当前已知问题列表

---

## 🚀 部署配置 → [docs/deployment/](./docs/deployment/)

**完整索引**: [docs/deployment/README.md](./docs/deployment/README.md)

### 快速开始

- [配置指南](./docs/deployment/CONFIGURATION_GUIDE.md) - 环境变量完整配置说明
- [部署清单](./docs/deployment/DEPLOYMENT_CHECKLIST.md) - 上线前完整检查清单

### 部署平台

- [Vercel部署指南](./docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md) - **推荐方案（详细步骤）** ⭐
- [部署平台分析](./docs/deployment/DEPLOYMENT_PLATFORM_ANALYSIS.md) - Vercel vs Cloudflare vs Docker

### 环境配置

- [生产环境设置](./docs/deployment/PRODUCTION_ENVIRONMENT_SETUP.md) - 生产配置和安全加固
- [GitHub配置](./docs/deployment/GITHUB_SETUP_GUIDE.md) - CI/CD配置
- [生成的密钥](./docs/deployment/GENERATED_SECRETS.md) - JWT密钥等敏感信息

---

## 📦 发布历史 → [docs/releases/](./docs/releases/)

**完整索引**: [docs/releases/README.md](./docs/releases/README.md)

### 版本列表

- [v2.0.0 (2025-10-10)](./docs/releases/v2.0.0.md) - **当前版本**
  - MVP清理版
  - 删除63MB CRS源码
  - 移除P3未来功能
  - 优化文档结构
  - 明确项目边界

---

## 📚 项目核心文档 → [PROJECT_CORE_DOCS/](./PROJECT_CORE_DOCS/)

这些文档定义了项目的本质和边界，是理解项目的基础。

- [README](./PROJECT_CORE_DOCS/README.md) - 核心文档索引
- [01_项目背景](./PROJECT_CORE_DOCS/01_项目背景.md) - 为什么做这个项目
- [02_功能需求和边界](./PROJECT_CORE_DOCS/02_功能需求和边界.md) - 做什么，不做什么
- [03_发展路线图](./PROJECT_CORE_DOCS/03_发展路线图.md) - 如何做，分几步

---

## 🗂️ 历史存档 → [docs/archive/](./docs/archive/)

### Sprint开发记录

- [Sprint历程总览](./docs/archive/sprints/SPRINT_INDEX.md) - 完整的Sprint开发历程
- Sprint 0-14 的详细记录和总结

### 其他存档

- [CRS验证记录](./docs/archive/crs-verification/) - CRS API验证历史
- [审计报告](./docs/archive/audits/) - 项目审计记录
- [测试报告](./docs/archive/testing/) - 测试分析记录
- [旧文档](./docs/archive/root-old-docs/) - 历史文档归档

---

## 🔍 快速查找指南

### 我需要...

**开始开发？**
1. → [DDD+TDD+Git标准](./docs/development/DDD_TDD_GIT_STANDARD.md)
2. → [TDD工作流](./docs/development/TDD_GIT_WORKFLOW.md)
3. → [CRS集成标准](./docs/development/CRS_INTEGRATION_STANDARD.md)

**了解API？**
→ [API规范](./docs/reference/API_MAPPING_SPECIFICATION.md)

**查看数据库？**
→ [数据库设计](./docs/reference/DATABASE_SCHEMA.md)

**部署项目？**
1. → [配置指南](./docs/deployment/CONFIGURATION_GUIDE.md)
2. → [Vercel部署指南](./docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md)
3. → [部署清单](./docs/deployment/DEPLOYMENT_CHECKLIST.md)

**使用组件？**
→ [组件库](./docs/reference/COMPONENT_LIBRARY.md)

**了解设计规范？**
→ [UI设计规范](./docs/reference/UI_DESIGN_SPECIFICATION.md)

**查看已知问题？**
→ [已知问题](./docs/development/KNOWN_ISSUES.md)

**为下个项目做准备？**
→ [REUSABLE_STANDARDS.md](./REUSABLE_STANDARDS.md)

---

## 📊 文档统计

```
根目录文档: 5 个（核心）
PROJECT_CORE_DOCS/: 4 个（项目定位）
docs/reference/: 8 个（技术参考）
docs/development/: 10 个（开发指南）
docs/deployment/: 8 个（部署配置）
docs/releases/: 2 个（发布历史）
docs/archive/: 120+ 个（历史存档）

文档总大小: ~2MB
项目总大小: ~85MB（已清理）
```

---

## 🎯 文档维护规范

### 添加新文档时

1. **确定分类** - 参考、开发、部署还是发布？
2. **放入正确目录** - docs/reference/、docs/development/、docs/deployment/、docs/releases/
3. **更新子目录README** - 添加到对应目录的README.md
4. **更新本索引** - 在DOCS_INDEX.md中添加链接

### 文档命名规范

- 使用大写和下划线：`API_MAPPING_SPECIFICATION.md`
- 描述性名称：说明文档内容
- 避免缩写：完整单词更易理解

---

**最后更新**: 2025-10-10
**版本**: v3.0 - 文档重组版
**维护者**: Claude Development Team

---

_"好的文档组织，让开发效率翻倍！"_
