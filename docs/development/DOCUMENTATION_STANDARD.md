# 文档管理标准 (Documentation Standard)

> **版本**: v1.0
> **生效日期**: 2025-10-04
> **适用范围**: Claude Key Portal 项目所有文档

---

## 🎯 文档管理原则

### 核心理念
```
清晰 > 完美
一致 > 多样
及时 > 详尽
```

### 强制规则
- ✅ **每个 Sprint 必须完成三类文档**（规划、总结、API 文档）
- ✅ **文档必须在规定时机创建**（不得延后或提前）
- ✅ **命名必须遵循标准格式**（不允许自创格式）
- ✅ **所有文档必须使用 Markdown 格式**
- ✅ **文档必须提交到 Git 版本控制**

---

## 📁 文档目录结构

### 标准目录组织
```
claude-key-portal/
├── README.md                      # 项目入口文档（必需）
├── CLAUDE.md                      # 项目配置文档（必需）
├── DOCS_INDEX.md                  # 文档索引（必需）
│
├── docs/                          # 文档目录
│   ├── SPRINT_INDEX.md            # Sprint 索引
│   ├── DOCUMENTATION_STANDARD.md  # 本文档
│   │
│   ├── SPRINT_X_TODOLIST.md       # Sprint 规划文档
│   ├── SPRINT_X_SUMMARY.md        # Sprint 总结文档
│   ├── API_ENDPOINTS_SPRINTX.md   # API 文档（如有）
│   │
│   ├── PROJECT_CORE_DOCS/         # 核心设计文档
│   │   ├── API_MAPPING_SPECIFICATION.md
│   │   ├── DATABASE_SCHEMA.md
│   │   ├── TDD_GIT_WORKFLOW.md
│   │   └── UI_DESIGN_SPECIFICATION.md
│   │
│   └── archives/                  # 历史文档归档
│       ├── audits/                # 审计报告
│       └── deprecated/            # 废弃文档
│
└── prototypes/                    # HTML 原型文件
```

---

## 📝 Sprint 文档规范

### 1. SPRINT_X_TODOLIST.md（规划文档）

#### 创建时机
- ⏰ **Sprint N-1 结束时**创建 Sprint N 的 TODOLIST
- 📍 例如：Sprint 5 结束时创建 `SPRINT_6_TODOLIST.md`

#### 命名格式
```
SPRINT_{数字}_TODOLIST.md

✅ 正确: SPRINT_6_TODOLIST.md
❌ 错误: sprint-6-todo.md, Sprint6_TODO.md, SPRINT_06_TODOLIST.md
```

#### 必需内容
```markdown
# Sprint X - {功能名称}

> **目标**: 一句话描述核心目标
> **状态**: 🚀 Ready to Start / 🚧 In Progress / ✅ Completed
> **分支**: `feature/xxx`
> **预计工期**: X-X 天
> **前置条件**: Sprint Y 完成

## 📋 Sprint 概览
### 核心功能
### 技术特性

## 🎯 功能需求
### 1. 功能模块 A
#### API 端点 1
#### API 端点 2

## 🗂️ 数据库模型
### 新增/修改模型

## 🔧 技术实现要点
### 1. 关键技术
### 2. 安全考虑

## ✅ TDD 测试规划
### Phase 1: 🔴 RED - 编写测试
### Phase 2: 🟢 GREEN - 实现功能
### Phase 3: 🔵 REFACTOR - 优化代码

## 📦 新依赖安装
## 🔐 环境变量需求
## 📊 成功指标
## 🚀 下一步计划 (Sprint X+1)
```

#### 模板文件
参考: `docs/SPRINT_6_TODOLIST.md`

---

### 2. SPRINT_X_SUMMARY.md（总结文档）

#### 创建时机
- ⏰ **Sprint X 结束并合并到 develop 后**立即创建
- 📍 例如：Sprint 5 feature 分支合并到 develop 后创建 `SPRINT_5_SUMMARY.md`

#### 命名格式
```
SPRINT_{数字}_SUMMARY.md

✅ 正确: SPRINT_5_SUMMARY.md
❌ 错误: sprint-5-summary.md, Sprint5_SUMMARY.md
```

#### 必需内容
```markdown
# Sprint X 完成总结 - {功能名称}

> **Sprint 周期**: YYYY-MM-DD
> **状态**: ✅ 已完成并合并到 develop
> **分支**: `feature/xxx`
> **开发方法**: TDD (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)

## 📊 Sprint 概览
### 目标达成情况
### 新增代码统计
### 测试统计

## 🎯 功能实现详情
### 1. 功能模块 A
#### API 实现
#### 核心功能
#### 测试覆盖

## 🗄️ 数据库更新
### 新增模型
### Migration 记录

## 🛠️ 技术实现亮点
### 1. 安全性强化
### 2. 性能优化

## 🐛 问题与解决方案
### 问题 1: 描述
**现象**: xxx
**原因**: xxx
**解决方案**: xxx
**提交**: commit message

## 📦 依赖更新
## 📝 Git 提交历史
## 💡 经验总结
## 📈 进度对比
## 🚀 下一步计划 (Sprint X+1)
```

#### 模板文件
参考: `docs/SPRINT_5_SUMMARY.md`

---

### 3. API_ENDPOINTS_SPRINTX.md（API 文档）

#### 创建时机
- ⏰ **Sprint 结束时**，如果该 Sprint 包含新增或修改的 API
- 📍 如果没有 API 变更，则不需要创建此文档

#### 命名格式
```
API_ENDPOINTS_SPRINT{数字}.md

✅ 正确: API_ENDPOINTS_SPRINT5.md
❌ 错误: api-sprint5.md, API_Sprint5.md
```

#### 必需内容
```markdown
# Sprint X API 端点文档

## 功能模块 A

### API 端点 1
#### 请求
```json
{
  "field": "value"
}
```

#### 响应 (200)
```json
{
  "result": "data"
}
```

#### 错误响应
- 400: 描述
- 401: 描述
- 500: 描述

### API 端点 2
...

## 数据模型更新
## 安全特性
## 测试覆盖
```

#### 模板文件
参考: `docs/API_ENDPOINTS_SPRINT5.md`

---

## 📚 核心文档规范

### README.md（项目入口）

#### 位置
项目根目录

#### 必需内容
```markdown
# Claude Key Portal

## 项目简介
一句话描述 + 核心价值

## 快速开始
### 环境要求
### 安装步骤
### 运行项目

## 文档索引
[链接到 DOCS_INDEX.md]

## 技术栈
## 开发规范
## 贡献指南
## 许可证
```

---

### DOCS_INDEX.md（文档索引）

#### 位置
项目根目录

#### 必需内容
```markdown
# 文档索引

## 核心文档
- [项目配置](./CLAUDE.md)
- [文档标准](./docs/DOCUMENTATION_STANDARD.md)
- [TDD 工作流](./docs/PROJECT_CORE_DOCS/TDD_GIT_WORKFLOW.md)

## Sprint 开发历程
[链接到 SPRINT_INDEX.md]

## 设计文档
- [API 规范](./docs/PROJECT_CORE_DOCS/API_MAPPING_SPECIFICATION.md)
- [数据库设计](./docs/PROJECT_CORE_DOCS/DATABASE_SCHEMA.md)
- [UI 设计](./docs/PROJECT_CORE_DOCS/UI_DESIGN_SPECIFICATION.md)

## API 文档
- [Sprint 5 API](./docs/API_ENDPOINTS_SPRINT5.md)

## 测试文档
- [测试策略](./docs/TESTING_STRATEGY.md)
- [集成测试](./docs/QUICK_START_INTEGRATION_TESTING.md)
```

---

### SPRINT_INDEX.md（Sprint 索引）

#### 位置
`docs/SPRINT_INDEX.md`

#### 必需内容
```markdown
# Sprint 开发历程

| Sprint | 功能 | 规划 | 总结 | API 文档 | 状态 |
|--------|------|------|------|---------|------|
| Sprint 0 | 项目初始化 | - | ✅ | - | ✅ |
| Sprint 3 | 安装指导 | ⚠️ | ✅ | ⚠️ | ✅ |
| Sprint 4 | 密钥管理 | ✅ | ✅ | ⚠️ | ✅ |
| Sprint 5 | 账户设置 | ✅ | ✅ | ✅ | ✅ |
| Sprint 6 | 通知系统 | ✅ | ⏳ | ⏳ | 🚧 |

✅ 已完成  ⏳ 待创建  ⚠️ 缺失  🚧 进行中
```

---

## 🔄 文档更新流程

### Sprint 开始前
```bash
# 1. 上一个 Sprint 结束时创建下一个 Sprint 的 TODOLIST
git checkout develop
vim docs/SPRINT_X_TODOLIST.md
git add docs/SPRINT_X_TODOLIST.md
git commit -m "docs: add Sprint X todolist"
```

### Sprint 进行中
```bash
# 2. 开发过程中更新 TODOLIST（如有需要）
git add docs/SPRINT_X_TODOLIST.md
git commit -m "docs: update Sprint X todolist with XXX"
```

### Sprint 结束后
```bash
# 3. 创建 SUMMARY 文档
vim docs/SPRINT_X_SUMMARY.md
git add docs/SPRINT_X_SUMMARY.md
git commit -m "docs: add Sprint X summary"

# 4. 如果有 API 变更，创建 API 文档
vim docs/API_ENDPOINTS_SPRINTX.md
git add docs/API_ENDPOINTS_SPRINTX.md
git commit -m "docs: add Sprint X API documentation"

# 5. 更新 SPRINT_INDEX.md
vim docs/SPRINT_INDEX.md
git add docs/SPRINT_INDEX.md
git commit -m "docs: update Sprint index for Sprint X"
```

---

## 📏 文档质量标准

### 文档完整性检查清单

#### TODOLIST 文档
- [ ] 标题格式正确
- [ ] 包含所有必需章节
- [ ] TDD 任务分解清晰
- [ ] 测试规划详细
- [ ] 预计工期合理

#### SUMMARY 文档
- [ ] 标题格式正确
- [ ] 测试统计准确
- [ ] 问题记录完整
- [ ] Git 提交历史清晰
- [ ] 经验总结有价值

#### API 文档
- [ ] 所有端点都有文档
- [ ] 请求/响应示例完整
- [ ] 错误码说明清晰
- [ ] 认证要求明确

---

## 🚫 禁止事项

### 命名禁忌
```
❌ 使用小写: sprint_5_todolist.md
❌ 使用连字符: SPRINT-5-TODOLIST.md
❌ 使用前导零: SPRINT_05_TODOLIST.md
❌ 自创格式: Sprint5_Plan.md
❌ 中文命名: Sprint5规划.md
```

### 内容禁忌
```
❌ 空文档或占位文档
❌ 仅有标题无内容
❌ 复制粘贴未修改的模板
❌ 过时信息未更新
❌ 与实际代码不一致的文档
```

### 时机禁忌
```
❌ Sprint 开始很久后才创建 TODOLIST
❌ Sprint 结束后拖延创建 SUMMARY
❌ 在错误的分支创建文档
❌ 合并前忘记创建文档
```

---

## ✅ 文档审查清单

### 每个 Sprint 结束时
- [ ] SPRINT_X_TODOLIST.md 存在且完整
- [ ] SPRINT_X_SUMMARY.md 已创建
- [ ] API_ENDPOINTS_SPRINTX.md 已创建（如有 API 变更）
- [ ] SPRINT_INDEX.md 已更新
- [ ] 所有文档已提交到 develop 分支
- [ ] 文档命名符合标准
- [ ] 文档内容完整准确

---

## 📋 文档模板

### 快速创建模板

#### 创建 TODOLIST
```bash
cp docs/templates/SPRINT_TODOLIST_TEMPLATE.md docs/SPRINT_X_TODOLIST.md
# 然后填充内容
```

#### 创建 SUMMARY
```bash
cp docs/templates/SPRINT_SUMMARY_TEMPLATE.md docs/SPRINT_X_SUMMARY.md
# 然后填充内容
```

#### 创建 API 文档
```bash
cp docs/templates/API_ENDPOINTS_TEMPLATE.md docs/API_ENDPOINTS_SPRINTX.md
# 然后填充内容
```

---

## 🎯 执行监督

### 自动化检查（未来实现）
```bash
# Git pre-commit hook 检查文档完整性
./scripts/check-docs.sh

# CI/CD 流程检查
- Sprint 合并时检查是否有对应文档
- 文档命名格式验证
- 文档必需章节检查
```

### 人工审查
- Code Review 时检查文档更新
- Sprint 结束时进行文档审计
- 每 5 个 Sprint 进行一次全面文档审查

---

## 📊 文档指标

### 质量指标
```
文档完整率 = 已完成文档数 / 应有文档数 × 100%

目标: ≥ 95%
```

### 及时性指标
```
文档创建延迟 = 文档创建日期 - 应创建日期

目标: ≤ 1 天
```

---

## 🔄 标准更新

### 更新流程
1. 提出修改建议
2. 团队讨论并达成共识
3. 更新本文档
4. 更新版本号和生效日期
5. 通知所有开发者

### 版本历史
- v1.0 (2025-10-04): 初始版本，建立基本标准

---

## 📞 参考资源

### 文档示例
- 优秀 TODOLIST: `docs/SPRINT_6_TODOLIST.md`
- 优秀 SUMMARY: `docs/SPRINT_5_SUMMARY.md`
- 优秀 API 文档: `docs/API_ENDPOINTS_SPRINT5.md`

### 相关标准
- [TDD 工作流](./PROJECT_CORE_DOCS/TDD_GIT_WORKFLOW.md)
- [Git Commit 规范](./PROJECT_CORE_DOCS/TDD_GIT_WORKFLOW.md#commit-规范)

---

**标准制定者**: Claude
**审批日期**: 2025-10-04
**下次审查**: Sprint 10 结束时

---

_"文档标准化，是团队协作的保障！"_
