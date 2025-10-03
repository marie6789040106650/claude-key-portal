# 📚 文档索引 / Documentation Index

> **项目**: Claude Key Portal - CRS 用户管理门户
> **最后更新**: 2025-10-02

---

## 📖 快速导航

### 新手入门
1. [README.md](./README.md) - 项目概览和快速开始
2. [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) - 配置指南

### 项目理解
3. [PROJECT_CORE_DOCS/](./PROJECT_CORE_DOCS/) - 核心文档目录
   - [01_项目背景.md](./PROJECT_CORE_DOCS/01_项目背景.md) - 项目定位和动机
   - [02_功能需求和边界.md](./PROJECT_CORE_DOCS/02_功能需求和边界.md) - 功能范围
   - [03_发展路线图.md](./PROJECT_CORE_DOCS/03_发展路线图.md) - 开发计划

### 开发指南
4. [DEVELOPMENT_READINESS_REPORT.md](./DEVELOPMENT_READINESS_REPORT.md) - 开发准备报告
5. [TDD_GIT_WORKFLOW.md](./TDD_GIT_WORKFLOW.md) - TDD 和 Git 工作流

### 技术规范
6. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - 数据库设计
7. [API_MAPPING_SPECIFICATION.md](./API_MAPPING_SPECIFICATION.md) - API 规范

### 设计规范
8. [UI_DESIGN_SPECIFICATION.md](./UI_DESIGN_SPECIFICATION.md) - UI/UX 设计
9. [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) - 组件库
10. [PAGE_HIERARCHY_AND_MODULES.md](./PAGE_HIERARCHY_AND_MODULES.md) - 页面结构

### 配置文件
11. [.env.local.template](./.env.local.template) - 开发环境配置模板
12. [.env.production.template](./.env.production.template) - 生产环境配置模板

### HTML 原型
13. [prototypes/](./prototypes/) - HTML 静态原型
    - [README.md](./prototypes/README.md) - 原型说明文档

---

## 🎯 按场景查找文档

### 我想了解项目是什么
👉 **README.md** → **PROJECT_CORE_DOCS/01_项目背景.md**

### 我想开始开发
👉 **CONFIGURATION_GUIDE.md** → **DEVELOPMENT_READINESS_REPORT.md** → **TDD_GIT_WORKFLOW.md**

### 我想了解功能范围
👉 **PROJECT_CORE_DOCS/02_功能需求和边界.md**

### 我想了解开发计划
👉 **PROJECT_CORE_DOCS/03_发展路线图.md**

### 我想实现某个 API
👉 **API_MAPPING_SPECIFICATION.md** → **DATABASE_SCHEMA.md**

### 我想实现某个页面
👉 **PAGE_HIERARCHY_AND_MODULES.md** → **UI_DESIGN_SPECIFICATION.md** → **COMPONENT_LIBRARY.md**

---

## 📋 文档清单

### ✅ 保留的核心文档 (13个 + HTML原型)

| 文档 | 用途 | 优先级 |
|-----|------|--------|
| README.md | 项目主文档 | P0 |
| DOCS_INDEX.md | 文档索引 | P0 |
| CONFIGURATION_GUIDE.md | 配置说明 | P0 |
| DEVELOPMENT_READINESS_REPORT.md | 开发准备 | P0 |
| HTML_PROTOTYPE_PLAN.md | 原型开发计划 | P0 |
| TDD_GIT_WORKFLOW.md | 开发流程 | P0 |
| DATABASE_SCHEMA.md | 数据库设计 | P1 |
| API_MAPPING_SPECIFICATION.md | API 规范 | P1 |
| UI_DESIGN_SPECIFICATION.md | UI 设计 | P1 |
| COMPONENT_LIBRARY.md | 组件库 | P1 |
| PAGE_HIERARCHY_AND_MODULES.md | 页面结构 | P1 |
| PROJECT_CORE_DOCS/01_项目背景.md | 项目背景 | P0 |
| PROJECT_CORE_DOCS/02_功能需求和边界.md | 功能需求 | P0 |
| PROJECT_CORE_DOCS/03_发展路线图.md | 路线图 | P0 |
| prototypes/ | HTML 静态原型 | P0 |

### ❌ 已删除的冗余文档 (19个)

- PROJECT_PLAN.md
- TDD_GUIDE.md
- GIT_WORKFLOW.md
- IMPLEMENTATION_DETAILS.md
- SITE_STRUCTURE_ANALYSIS.md
- REVISED_IMPLEMENTATION_PLAN.md
- DETAILED_SITE_STRUCTURE.md
- PAGE_FUNCTIONALITY_SPECS.md
- UI_COMPONENTS_INVENTORY.md
- USER_INTERACTION_FLOWS.md
- PROJECT_OVERVIEW.md
- API_INTERFACE_STANDARDS.md
- ERROR_HANDLING_STANDARDS.md
- IMPLEMENTATION_GUIDE.md
- CRS_INTEGRATION_SPECIFICATION.md
- DEVELOPMENT_PLAN.md
- REVIEW_REPORT.md
- PROJECT_AUDIT_REPORT.md
- PROJECT_REQUIREMENTS_CLARIFICATION.md

---

## 🔍 文档关系图

```
README.md (入口)
    ↓
PROJECT_CORE_DOCS/ (理解项目)
    ├── 01_项目背景.md
    ├── 02_功能需求和边界.md
    └── 03_发展路线图.md
    ↓
CONFIGURATION_GUIDE.md (配置环境)
    ↓
DEVELOPMENT_READINESS_REPORT.md (准备开发)
    ↓
TDD_GIT_WORKFLOW.md (开发流程)
    ↓
技术实现文档 (具体开发)
    ├── DATABASE_SCHEMA.md
    ├── API_MAPPING_SPECIFICATION.md
    ├── UI_DESIGN_SPECIFICATION.md
    ├── COMPONENT_LIBRARY.md
    └── PAGE_HIERARCHY_AND_MODULES.md
```

---

## 📝 文档维护

### 更新频率
- **README.md**: 项目结构变化时
- **CONFIGURATION_GUIDE.md**: 新增配置项时
- **核心文档**: 功能范围或计划变化时
- **技术规范**: 设计决策变化时

### 文档规范
- 使用中文编写
- Markdown 格式
- 包含清晰的章节结构
- 代码示例使用语法高亮
- 及时更新版本和日期

---

## 🤝 贡献指南

### 新增文档
如果需要新增文档：
1. 确认现有文档无法覆盖该内容
2. 在此索引中添加条目
3. 说明文档用途和优先级
4. 提交 PR 并注明理由

### 更新文档
更新文档时：
1. 修改对应的 markdown 文件
2. 更新文档中的"最后更新"日期
3. 如有重大变化，在 README.md 中注明
4. 提交 commit 说明更新内容

---

**文档索引版本**: v1.0
**创建时间**: 2025-10-02
**维护者**: Claude Key Portal Team
