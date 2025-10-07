# Claude Key Portal

> CRS (Claude Relay Service) 的用户管理门户 - 让密钥管理变得简单

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## 📌 项目简介

**Claude Key Portal** 是 [CRS (Claude Relay Service)](https://github.com/Wei-Shaw/claude-relay-service) 的用户管理门户，为用户提供友好的 Web 界面来管理 API 密钥、查看使用统计和获取安装指导。

### 核心特性

- ✅ **用户友好** - 简洁直观的界面，降低 CRS 使用门槛
- ✅ **密钥管理** - 轻松创建、查看、更新和删除 API 密钥
- ✅ **数据可视化** - 直观的图表展示使用统计和趋势
- ✅ **安装指导** - 完整的 Claude Code/Codex 配置步骤
- ✅ **用户设置** - 个人资料、安全设置、通知配置一应俱全
- ✅ **个性化** - 备注、标签、收藏等本地扩展功能

---

## 🎯 项目定位

### 与 CRS 的关系

```
┌─────────────────────────────────┐
│   Claude Key Portal (本项目)     │
│   用户界面层                      │
│                                 │
│   - 用户注册登录                  │
│   - 密钥管理界面                  │
│   - 数据可视化                    │
│   - 安装指导                      │
└─────────────────────────────────┘
                │
                │ 调用 Admin API
                ↓
┌─────────────────────────────────┐
│         CRS                     │
│    核心业务逻辑层                │
│                                 │
│   - 密钥生成和存储                │
│   - API 请求中转                 │
│   - 使用量统计                    │
│   - 速率限制                      │
└─────────────────────────────────┘
```

### 职责边界

| 功能           | Portal | CRS |
| -------------- | ------ | --- |
| **用户管理**   | ✅     | ❌  |
| **密钥生成**   | ❌     | ✅  |
| **密钥验证**   | ❌     | ✅  |
| **使用统计**   | ❌     | ✅  |
| **界面展示**   | ✅     | ❌  |
| **数据可视化** | ✅     | ❌  |
| **安装指导**   | ✅     | ❌  |

---

## 🎨 查看原型

HTML 静态原型已完成，可直接在浏览器中查看：

```bash
# 方式1: 直接打开
open prototypes/index.html

# 方式2: 使用本地服务器
cd prototypes
python3 -m http.server 8000
# 访问 http://localhost:8000
```

**原型包含**:

- ✅ 首页/欢迎页
- ✅ 登录/注册页面
- ✅ 仪表板（带图表）
- ✅ 密钥管理
- ✅ 安装指导
- ✅ 用户设置

详见 [prototypes/README.md](./prototypes/README.md)

### 🎨 功能亮点：用户设置和个人中心

完整的用户设置系统已在 **Sprint 14** 中实现，提供全面的账户管理功能：

#### 个人资料
- ✅ **头像显示** - 支持中英文首字母头像，确定性颜色生成
- ✅ **昵称编辑** - 1-50字符验证
- ✅ **个人简介** - 最多500字符，Markdown支持
- ✅ **实时验证** - React Hook Form + Zod 表单验证

#### 安全设置
- ✅ **密码修改** - 强度实时显示（弱/中/强）
- ✅ **密码要求** - 至少8位，包含大小写、数字、特殊字符
- ✅ **活跃会话管理** - 查看所有登录设备
- ✅ **远程注销** - 单个设备或一键注销所有其他设备
- ✅ **确认对话框** - 防止误操作

#### 通知设置
- ✅ **通知类型** - 密钥创建/删除、使用量告警、安全告警、系统更新
- ✅ **通知渠道** - 邮件、Webhook、系统通知
- ✅ **乐观更新** - 即时UI反馈，自动保存
- ✅ **错误恢复** - 失败时自动回滚

#### 到期提醒
- ✅ **动态配置** - 添加/删除提醒天数（1-30天）
- ✅ **多渠道提醒** - 支持多种通知方式
- ✅ **实时验证** - 天数范围检查和错误提示

**技术亮点**:
- 92.30% 测试覆盖率
- TypeScript 类型完整
- 可复用的自定义 Hooks
- 优化的用户体验（加载状态、错误提示）

---

## 🚀 快速开始

### 前置要求

- Node.js 20.x
- PostgreSQL 15+
- Redis 7+
- 已部署的 CRS 实例

### 环境变量

复制配置模板并填写实际值：

```bash
# 开发环境
cp .env.local.template .env.local

# 生产环境
cp .env.production.template .env.production
```

**必需配置**：

- `DATABASE_URL` - PostgreSQL 数据库连接
- `REDIS_URL` - Redis 连接
- `CRS_BASE_URL` - CRS服务地址
- `CRS_ADMIN_USERNAME` - CRS管理员用户名
- `CRS_ADMIN_PASSWORD` - CRS管理员密码
- `JWT_SECRET` - 生成命令：`openssl rand -base64 32`

### 安装和运行

```bash
# 克隆仓库
git clone https://github.com/yourusername/claude-key-portal.git
cd claude-key-portal

# 安装依赖
npm install

# 数据库迁移
npx prisma migrate dev

# 运行开发服务器
npm run dev
```

访问 http://localhost:3000

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm run test:coverage

# 运行特定测试
npm test -- --testNamePattern="user registration"
```

---

## 📚 文档

### 📖 完整文档索引

👉 查看 [**DOCS_INDEX.md**](./DOCS_INDEX.md) - 文档导航中心

### 快速开始文档

- [**CONFIGURATION_GUIDE.md**](./CONFIGURATION_GUIDE.md) - 环境配置指南
- [**DEVELOPMENT_READINESS_REPORT.md**](./DEVELOPMENT_READINESS_REPORT.md) - 开发准备报告
- [**TDD_GIT_WORKFLOW.md**](./TDD_GIT_WORKFLOW.md) - TDD 和 Git 工作流

### Sprint 开发文档

- [**docs/SPRINT_INDEX.md**](./docs/SPRINT_INDEX.md) - Sprint 开发历程总览
- [**docs/DOCUMENTATION_STANDARD.md**](./docs/DOCUMENTATION_STANDARD.md) - 文档管理标准
- **Sprint 规划和总结**:
  - Sprint 3: [TODOLIST (缺失)]() | [SUMMARY](./docs/SPRINT_3_SUMMARY.md) | [API 文档](./docs/API_ENDPOINTS_SPRINT3.md)
  - Sprint 4: [TODOLIST](./docs/SPRINT_4_TODOLIST.md) | [SUMMARY](./docs/SPRINT_4_SUMMARY.md) | [API 文档 (待补齐)]()
  - Sprint 5: [TODOLIST](./docs/SPRINT_5_TODOLIST.md) | [SUMMARY](./docs/SPRINT_5_SUMMARY.md) | [API 文档](./docs/API_ENDPOINTS_SPRINT5.md)
  - Sprint 6: [TODOLIST](./docs/SPRINT_6_TODOLIST.md) | [SUMMARY (待创建)]() | [API 文档 (待创建)]()

### 核心文档

- [**PROJECT_CORE_DOCS/**](./PROJECT_CORE_DOCS/) - 项目核心文档目录
  - [01\_项目背景.md](./PROJECT_CORE_DOCS/01_项目背景.md) - 项目定位和动机
  - [02\_功能需求和边界.md](./PROJECT_CORE_DOCS/02_功能需求和边界.md) - 功能范围
  - [03\_发展路线图.md](./PROJECT_CORE_DOCS/03_发展路线图.md) - 开发路线图

### 技术规范

- [**DATABASE_SCHEMA.md**](./DATABASE_SCHEMA.md) - 数据库设计
- [**API_MAPPING_SPECIFICATION.md**](./API_MAPPING_SPECIFICATION.md) - API 规范
- [**UI_DESIGN_SPECIFICATION.md**](./UI_DESIGN_SPECIFICATION.md) - UI/UX 设计
- [**COMPONENT_LIBRARY.md**](./COMPONENT_LIBRARY.md) - 组件库
- [**PAGE_HIERARCHY_AND_MODULES.md**](./PAGE_HIERARCHY_AND_MODULES.md) - 页面结构

### 项目审计报告

- [**PROJECT_STRUCTURE_AUDIT.md**](./docs/PROJECT_STRUCTURE_AUDIT.md) - 项目结构审计（2025-10-04）

---

## 🏗️ 技术栈

### 前端

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS + Shadcn/ui
- **状态管理**: Zustand
- **数据获取**: React Query
- **图表**: Recharts

### 后端

- **运行时**: Node.js 20 LTS
- **API**: Next.js API Routes
- **ORM**: Prisma
- **数据库**: PostgreSQL 15+
- **缓存**: Redis 7+
- **认证**: JWT

### 开发工具

- **测试**: Jest + Testing Library
- **E2E**: Playwright
- **Lint**: ESLint + Prettier
- **CI/CD**: GitHub Actions
- **版本控制**: Git + GitHub

---

## 📁 项目结构

```
claude-key-portal/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 认证页面组
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/            # 仪表板页面组
│   │   ├── page.tsx            # Dashboard
│   │   ├── keys/               # 密钥管理
│   │   ├── usage/              # 使用统计
│   │   ├── install/            # 安装指导
│   │   └── settings/           # 用户设置
│   └── api/                    # API Routes
│       ├── auth/
│       ├── keys/
│       ├── dashboard/
│       └── stats/
├── components/                 # React 组件
│   ├── ui/                     # Shadcn/ui 组件
│   ├── charts/                 # 图表组件
│   └── layout/                 # 布局组件
├── lib/                        # 工具库
│   ├── prisma.ts               # Prisma 客户端
│   ├── redis.ts                # Redis 客户端
│   ├── crs-client.ts           # CRS 客户端
│   ├── jwt.ts                  # JWT 工具
│   └── validation/             # 验证 schema
├── tests/                      # 测试文件
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   └── e2e/                    # 端到端测试
├── prisma/                     # Prisma schema
│   ├── schema.prisma
│   └── migrations/
├── PROJECT_CORE_DOCS/          # 核心文档
├── public/                     # 静态资源
└── docs/                       # 其他文档
```

---

## 🔧 开发流程

### TDD 工作流

我们遵循严格的 TDD (测试驱动开发) 流程：

```bash
# 1. 🔴 RED - 编写失败的测试
git checkout -b feature/user-login
# 编写测试文件
git commit -m "test: add user login test cases"
npm test  # ❌ 失败

# 2. 🟢 GREEN - 实现功能让测试通过
# 编写实现代码
git commit -m "feat: implement user login endpoint"
npm test  # ✅ 通过

# 3. 🔵 REFACTOR - 重构代码
# 优化代码结构
git commit -m "refactor: extract login validation logic"
npm test  # ✅ 仍然通过

# 4. 推送并创建 PR
git push origin feature/user-login
```

详细的 TDD 和 Git 工作流请参考 [TDD_GIT_WORKFLOW.md](./TDD_GIT_WORKFLOW.md)

### Git 分支策略

```
main (生产)
  ├── develop (开发)
  │   ├── feature/user-auth
  │   ├── feature/keys-crud
  │   └── feature/dashboard
  ├── hotfix/critical-bug
  └── release/v1.0.0
```

### Commit 规范

```
<type>(<scope>): <subject>

type: test, feat, fix, refactor, docs, style, perf, chore
scope: auth, keys, stats, ui, etc.
subject: 简短描述
```

示例:

```bash
test: add user registration validation test
feat: implement user registration endpoint
refactor: extract email validation logic
docs: update API documentation
```

---

## 🧪 测试策略

### 测试金字塔

```
        /\
       /  \
      / E2E \     ←── 10% (关键用户流程)
     /------\
    /        \
   / Integr.  \   ←── 20% (API + 数据库)
  /------------\
 /              \
/      Unit       \ ←── 70% (业务逻辑)
\----------------/
```

### 覆盖率要求

- **总体**: > 80%
- **Services**: > 90%
- **API Routes**: > 85%
- **Components**: > 75%

---

## 📦 部署

### 部署策略

**主要方案**: **Vercel 部署** (生产环境)

本项目优先使用 Vercel 部署，免费额度足够支撑初期运营。

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署到预览环境
vercel

# 生产部署
vercel --prod
```

**选择 Vercel 的原因**:

- ✅ **零配置部署** - Next.js 官方平台，开箱即用
- ✅ **完整 Prisma 支持** - 直连 PostgreSQL，无需额外配置
- ✅ **免费额度充足** - 100 GB 带宽/月，足够 1000+ 用户使用
- ✅ **最佳开发体验** - Git 集成、Preview 部署、实时日志
- ✅ **自动优化** - HTTPS、CDN、图片优化全自动

**成本估算**（Hobby 免费计划）:

- 带宽: 100 GB/月（预计1000用户使用 ~30 GB）
- 构建: 6000 分钟/月
- 函数调用: 无限次
- **预计成本**: **$0/月**

---

### 备选方案：Docker 自托管 (可选)

**注意**: 仅在以下情况考虑自托管

- Vercel 免费额度耗尽（月访问量 > 10万）
- 企业内网部署需求
- 需要完全控制基础设施

项目已配置 Docker 支持，但**优先使用 Vercel**。Docker 配置文件位于：

- `Dockerfile` - 生产环境构建
- `docker-compose.yml` - 本地开发环境
- `docker-compose.prod.yml` - 生产部署（含 Nginx）

<details>
<summary>Docker 部署指令（点击展开）</summary>

```bash
# 本地开发环境
docker-compose up

# 生产部署
docker-compose -f docker-compose.prod.yml up -d
```

详见项目中的 Docker 配置文件。

</details>

---

### 不推荐：Cloudflare Pages ⚠️

**重要提示**: 由于技术限制，不推荐使用 Cloudflare Pages

**原因**:

- ❌ Cloudflare Workers 不支持 TCP 连接
- ❌ Prisma 需要 Data Proxy（额外 $25/月）
- ❌ 需要重写大量代码（340+ 小时）
- ❌ 实际成本更高（$25/月 vs Vercel $0/月）

**如果一定要使用**，需要：

1. 使用 Prisma Data Proxy（付费服务）
2. 或替换为 Supabase JS SDK（放弃 Prisma）
3. 重写认证逻辑（替换 bcrypt）

详见: [部署平台对比分析](./DEPLOYMENT_PLATFORM_ANALYSIS.md)

---

## 🛣️ 开发进度

### 当前状态

| Sprint | 功能 | 规划 | 总结 | 状态 |
|--------|------|------|------|------|
| Sprint 0 | 项目初始化 | - | [AUDIT](./docs/SPRINT_0_AUDIT_REPORT.md) | ✅ |
| Sprint 2 | CRS 集成基础 | - | [SUMMARY](./docs/SPRINT_2_SUMMARY.md) | ✅ |
| Sprint 3 | 安装指导 | - | [SUMMARY](./docs/SPRINT_3_SUMMARY.md) | ✅ |
| Sprint 4 | 密钥管理 | [TODO](./docs/SPRINT_4_TODOLIST.md) | [SUMMARY](./docs/SPRINT_4_SUMMARY.md) | ✅ |
| Sprint 5 | 账户设置 API | [TODO](./docs/SPRINT_5_TODOLIST.md) | [SUMMARY](./docs/SPRINT_5_SUMMARY.md) | ✅ |
| Sprint 6 | 通知系统 | [TODO](./docs/SPRINT_6_TODOLIST.md) | [SUMMARY](./docs/SPRINT_6_SUMMARY.md) | ✅ |
| Sprint 7 | API Key到期提醒 | [TODO](./docs/SPRINT_7_TODOLIST.md) | [SUMMARY](./docs/SPRINT_7_SUMMARY.md) | ✅ |
| Sprint 8 | Cron Job定时任务 | [TODO](./docs/SPRINT_8_TODOLIST.md) | [SUMMARY](./docs/SPRINT_8_SUMMARY.md) | ✅ |
| Sprint 9 | 监控告警系统 | [TODO](./docs/SPRINT_9_TODOLIST.md) | [SUMMARY](./docs/SPRINT_9_SUMMARY.md) | ✅ |
| Sprint 10 | 监控仪表板前端 | [TODO](./docs/SPRINT_10_TODOLIST.md) | [SUMMARY](./docs/SPRINT_10_SUMMARY.md) | ✅ |
| Sprint 11 | 用户认证和仪表板 | [TODO](./docs/SPRINT_11_TODOLIST.md) | [SUMMARY](./docs/SPRINT_11_SUMMARY.md) | ✅ |
| Sprint 12 | 密钥管理UI | [TODO](./docs/SPRINT_12_TODOLIST.md) | [SUMMARY](./docs/SPRINT_12_SUMMARY.md) | ✅ |
| Sprint 13 | 密钥使用统计可视化 | [TODO](./docs/SPRINT_13_TODOLIST.md) | [SUMMARY](./docs/SPRINT_13_SUMMARY.md) | ✅ |
| Sprint 14 | 用户设置和个人中心UI | [TODO](./docs/SPRINT_14_TODOLIST.md) | [SUMMARY](./docs/SPRINT_14_SUMMARY.md) | ✅ |

**图例**: ✅ 已完成 | 🚧 进行中

完整的 Sprint 历程详见 [**SPRINT_INDEX.md**](./docs/SPRINT_INDEX.md)

### 测试统计

```
总测试数: 658 个
通过:     658 个 (100%)
跳过:       0 个 (0%)
失败:       0 个 (0%)

测试覆盖率: > 85% (超过目标)
设置组件覆盖率: 92.30%
```

**最新成果** (Sprint 14):
- ✅ 用户设置和个人中心 UI 完整实现
- ✅ 61 个新增测试全部通过
- ✅ 92.30% 测试覆盖率

### Phase 1: 基础功能 ✅ (已完成)

- [x] **Sprint 0**: 项目初始化和 TDD 环境
  - [x] Git 仓库和分支策略
  - [x] Next.js 14 + TypeScript 搭建
  - [x] Prisma + PostgreSQL 配置
  - [x] Jest 测试环境
- [x] **Sprint 2**: CRS 集成基础
  - [x] CRS Client 封装
  - [x] 用户认证系统（注册/登录）
  - [x] JWT 令牌管理
- [x] **Sprint 3**: 安装指导
  - [x] 多平台脚本生成 (macOS/Linux/Windows)
  - [x] 环境变量配置
  - [x] 安装说明生成
- [x] **Sprint 4**: 密钥管理
  - [x] 密钥 CRUD 操作（代理 CRS）
  - [x] 密钥列表展示
  - [x] 统计数据 Dashboard
- [x] **Sprint 5**: 账户设置
  - [x] 用户资料管理（GET/PUT）
  - [x] 密码修改和强度验证
  - [x] 会话管理（列表/登出设备）

### Phase 2: 增强功能 🚧 (进行中)

- [x] ~~Sprint 1: 用户认证~~ (已合并到 Sprint 2)
- [ ] **Sprint 6**: 通知系统 ← 当前 Sprint
  - [ ] 通知配置 API
  - [ ] 通知记录 API
  - [ ] 邮件通知服务
  - [ ] Webhook 通知支持
- [ ] Sprint 7: 数据可视化优化
- [ ] Sprint 8: 性能优化和缓存

### Phase 3: 生产部署 📋 (计划中)

- [ ] 环境配置和安全加固
- [ ] 监控和日志系统
- [ ] Vercel 部署上线

### Phase 4: 功能扩展 🌟 (未来)

- [ ] 个性化功能（备注、标签、收藏）
- [ ] 高级统计和分析
- [ ] 团队协作功能
- [ ] 移动端优化

详细路线图请参考 [03\_发展路线图.md](./PROJECT_CORE_DOCS/03_发展路线图.md)

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 遵循 TDD 流程开发
4. 提交代码 (`git commit -m 'feat: add amazing feature'`)
5. 推送到分支 (`git push origin feature/amazing-feature`)
6. 创建 Pull Request

### 代码规范

- 遵循 ESLint 规则
- 使用 TypeScript strict 模式
- 所有功能必须有测试
- Commit 消息遵循规范
- PR 必须通过 Code Review

---

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Prisma](https://www.prisma.io/) - ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [CRS](https://github.com/Wei-Shaw/claude-relay-service) - Claude Relay Service

---

## 📞 联系我们

- **Issues**: [GitHub Issues](https://github.com/yourusername/claude-key-portal/issues)
- **Email**: support@example.com

---

**Made with ❤️ by Claude Key Portal Team**
