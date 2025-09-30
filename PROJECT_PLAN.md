# Claude Key Portal - 项目开发规划

## 项目概述

Claude Key Portal 是一个为 Claude Relay Service (CRS) 提供用户端界面的Web应用，让用户能够自助注册、管理API密钥，并获取详细的安装配置指导。

### 项目目标
- 提供友好的用户界面，降低CRS使用门槛
- 实现自助式密钥管理，减少人工运维
- 提供清晰的安装指导，提升用户体验
- 建立独立的用户系统，支持未来商业化扩展

### 技术栈
- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Shadcn/ui
- **后端**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL + Redis
- **ORM**: Prisma
- **测试**: Jest + React Testing Library + Supertest
- **部署**: VPS + Caddy + PM2

## TDD开发策略

### 测试金字塔
```
        /\
       /  \  E2E测试 (10%)
      /    \  - Cypress/Playwright
     /──────\
    /        \ 集成测试 (30%)
   /          \ - API测试
  /            \ - 组件交互测试
 /──────────────\
/                \ 单元测试 (60%)
/                 \ - 纯函数测试
└─────────────────┘ - 组件渲染测试
```

### TDD工作流程

1. **Red（红）**: 编写失败的测试
2. **Green（绿）**: 编写最少代码使测试通过
3. **Refactor（重构）**: 优化代码保持测试通过

### 测试覆盖率目标
- 整体覆盖率: ≥ 80%
- 核心业务逻辑: ≥ 95%
- API端点: 100%
- UI组件: ≥ 70%

## Git工作流规范

### 分支策略 (Git Flow)

```
main (生产环境)
  │
  ├── develop (开发主线)
  │     │
  │     ├── feature/user-auth (功能分支)
  │     ├── feature/key-management
  │     └── feature/installation-guide
  │
  ├── release/v1.0.0 (发布分支)
  │
  └── hotfix/critical-bug (紧急修复)
```

### 分支命名规范
- **功能分支**: `feature/功能名称`
- **修复分支**: `fix/问题描述`
- **发布分支**: `release/版本号`
- **热修复**: `hotfix/问题描述`

### Commit规范 (Conventional Commits)

格式: `<type>(<scope>): <subject>`

**类型(type)**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 重构代码
- `test`: 添加测试
- `chore`: 构建/工具链相关
- `perf`: 性能优化

**示例**:
```
feat(auth): 实现JWT认证
fix(api): 修复密钥生成接口错误
test(user): 添加用户注册单元测试
docs(readme): 更新安装说明
```

### Pull Request流程
1. 从`develop`创建功能分支
2. 完成开发和测试
3. 提交PR到`develop`
4. Code Review (至少1人)
5. 通过CI/CD检查
6. Squash merge到`develop`

## 开发迭代计划

### Sprint 1: 基础架构 (Day 1-2)
**目标**: 搭建项目基础架构和开发环境

#### 任务清单
- [x] 项目初始化
  - [x] 创建项目结构
  - [x] 配置TypeScript
  - [x] 配置ESLint/Prettier
  - [x] 配置测试环境

- [ ] 后端基础
  - [ ] Express + TypeScript配置
  - [ ] Prisma + PostgreSQL设置
  - [ ] JWT中间件
  - [ ] 错误处理中间件
  - [ ] API文档(Swagger)

- [ ] 前端基础
  - [ ] Next.js项目配置
  - [ ] UI组件库设置
  - [ ] 路由结构
  - [ ] 全局状态管理
  - [ ] API客户端

#### 测试要求
- [ ] 后端API基础测试套件
- [ ] 前端组件测试环境
- [ ] E2E测试环境配置

### Sprint 2: 用户认证系统 (Day 3-4)
**目标**: 实现完整的用户认证流程

#### 用户故事
```gherkin
Feature: 用户认证
  作为一个新用户
  我想要注册账号并登录
  以便管理我的API密钥

  Scenario: 用户注册
    Given 我在注册页面
    When 我输入有效的邮箱和密码
    And 点击注册按钮
    Then 系统应该创建账号并自动登录

  Scenario: 用户登录
    Given 我有一个已注册的账号
    When 我输入正确的邮箱和密码
    Then 系统应该允许我访问仪表盘
```

#### 任务清单
- [ ] 后端API
  - [ ] POST /api/auth/register
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/refresh
  - [ ] POST /api/auth/logout
  - [ ] POST /api/auth/reset-password

- [ ] 前端页面
  - [ ] 注册页面
  - [ ] 登录页面
  - [ ] 忘记密码页面
  - [ ] 认证守卫(Auth Guard)

#### 测试清单
- [ ] 单元测试
  - [ ] 密码加密函数
  - [ ] JWT生成/验证
  - [ ] 邮箱验证

- [ ] 集成测试
  - [ ] 注册流程
  - [ ] 登录流程
  - [ ] Token刷新

- [ ] E2E测试
  - [ ] 完整注册流程
  - [ ] 登录并访问受保护页面

### Sprint 3: 密钥管理功能 (Day 5-6)
**目标**: 实现API密钥的CRUD操作

#### 用户故事
```gherkin
Feature: API密钥管理
  作为一个登录用户
  我想要管理我的API密钥
  以便在Claude Code中使用

  Scenario: 生成新密钥
    Given 我在密钥管理页面
    When 我点击"生成新密钥"
    And 输入密钥名称
    Then 系统应该生成一个新的API密钥

  Scenario: 查看密钥列表
    Given 我有多个API密钥
    When 我访问密钥管理页面
    Then 我应该看到所有密钥的列表和状态
```

#### 任务清单
- [ ] 后端API
  - [ ] GET /api/keys (获取密钥列表)
  - [ ] POST /api/keys (创建密钥)
  - [ ] PUT /api/keys/:id (更新密钥)
  - [ ] DELETE /api/keys/:id (删除密钥)
  - [ ] GET /api/keys/:id/usage (使用统计)

- [ ] 前端页面
  - [ ] 密钥列表页面
  - [ ] 创建密钥对话框
  - [ ] 密钥详情卡片
  - [ ] 使用统计图表

#### 测试清单
- [ ] 单元测试
  - [ ] 密钥生成算法
  - [ ] 密钥加密存储
  - [ ] 额度计算

- [ ] 集成测试
  - [ ] 密钥CRUD操作
  - [ ] 权限验证
  - [ ] 并发控制

### Sprint 4: 安装指导系统 (Day 7)
**目标**: 提供详细的多平台安装教程

#### 任务清单
- [ ] 静态页面
  - [ ] Windows安装指南
  - [ ] macOS安装指南
  - [ ] Linux安装指南
  - [ ] 常见问题FAQ

- [ ] 动态功能
  - [ ] 安装脚本生成器
  - [ ] 配置文件生成
  - [ ] 环境检测脚本
  - [ ] 复制到剪贴板

#### 测试清单
- [ ] 单元测试
  - [ ] 脚本生成函数
  - [ ] 配置模板渲染

- [ ] E2E测试
  - [ ] 安装流程完整性
  - [ ] 脚本复制功能

### Sprint 5: CRS集成与部署 (Day 8)
**目标**: 与CRS API集成并部署上线

#### 任务清单
- [ ] CRS集成
  - [ ] API代理配置
  - [ ] 密钥同步机制
  - [ ] 使用量数据同步
  - [ ] 错误处理和重试

- [ ] 部署准备
  - [ ] 环境变量配置
  - [ ] 数据库迁移脚本
  - [ ] Caddy配置
  - [ ] PM2配置
  - [ ] 部署脚本

#### 测试清单
- [ ] 集成测试
  - [ ] CRS API调用
  - [ ] 数据同步验证
  - [ ] 故障恢复测试

- [ ] 性能测试
  - [ ] 负载测试
  - [ ] 并发测试
  - [ ] 响应时间测试

## 测试文件结构

```
tests/
├── unit/                 # 单元测试
│   ├── backend/
│   │   ├── services/     # 服务层测试
│   │   ├── utils/        # 工具函数测试
│   │   └── validators/   # 验证器测试
│   └── frontend/
│       ├── components/   # 组件测试
│       └── utils/        # 前端工具测试
│
├── integration/          # 集成测试
│   ├── api/             # API端点测试
│   └── database/        # 数据库操作测试
│
├── e2e/                 # 端到端测试
│   ├── auth.spec.ts     # 认证流程
│   ├── keys.spec.ts     # 密钥管理
│   └── install.spec.ts  # 安装指导
│
└── fixtures/            # 测试数据
    ├── users.json
    └── keys.json
```

## 质量保证

### 代码质量指标
- **代码覆盖率**: ≥ 80%
- **技术债务比率**: < 5%
- **代码重复率**: < 3%
- **圈复杂度**: < 10

### CI/CD流程
```yaml
pipeline:
  - lint        # 代码规范检查
  - test:unit   # 单元测试
  - test:int    # 集成测试
  - build       # 构建检查
  - test:e2e    # E2E测试
  - security    # 安全扫描
  - deploy      # 部署
```

### 代码审查清单
- [ ] 是否遵循编码规范？
- [ ] 是否有相应的测试？
- [ ] 测试覆盖率是否达标？
- [ ] 是否有破坏性变更？
- [ ] 文档是否更新？
- [ ] 性能影响评估？
- [ ] 安全考虑？

## 项目里程碑

### Milestone 1: MVP发布 (Week 1)
- ✅ 基础功能完成
- ✅ 测试覆盖率达标
- ✅ 部署到生产环境
- ✅ 基础文档完成

### Milestone 2: 功能增强 (Week 2-3)
- ⏳ 支付系统集成
- ⏳ 邀请码功能
- ⏳ 数据分析面板
- ⏳ 移动端优化

### Milestone 3: 商业化 (Month 2)
- ⏳ 定价策略实施
- ⏳ 推广系统
- ⏳ 客服系统
- ⏳ 数据报表

## 风险管理

### 技术风险
1. **CRS API变更**: 制定API版本策略，保持向后兼容
2. **性能瓶颈**: 实施缓存策略，使用Redis
3. **安全漏洞**: 定期安全审计，及时更新依赖

### 业务风险
1. **用户增长过快**: 准备扩容方案，使用负载均衡
2. **恶意使用**: 实施rate limiting和异常检测
3. **数据丢失**: 定期备份，异地容灾

## 文档规范

### 代码注释
- 所有公共API必须有JSDoc注释
- 复杂业务逻辑需要详细说明
- TODO注释必须包含负责人和期限

### API文档
- 使用OpenAPI 3.0规范
- 包含请求/响应示例
- 说明错误码和处理方式

### 用户文档
- 快速开始指南
- API使用说明
- 故障排查指南
- 视频教程链接

## 监控与运维

### 监控指标
- **应用性能**: 响应时间、吞吐量、错误率
- **系统资源**: CPU、内存、磁盘、网络
- **业务指标**: 注册用户、活跃用户、API调用量
- **安全指标**: 登录失败、异常请求、攻击检测

### 告警策略
- **P0级**: 服务不可用，立即通知
- **P1级**: 功能故障，15分钟内响应
- **P2级**: 性能下降，1小时内处理
- **P3级**: 一般问题，工作时间处理

### 备份策略
- **数据库**: 每日增量备份，每周全量备份
- **配置文件**: Git版本控制
- **用户数据**: 加密存储，定期归档

## 项目联系方式

- **项目负责人**: [YOUR_NAME]
- **技术支持**: [SUPPORT_EMAIL]
- **项目仓库**: [GITHUB_REPO]
- **文档地址**: [DOCS_URL]

---

更新时间: 2025-01-01
版本: v1.0.0