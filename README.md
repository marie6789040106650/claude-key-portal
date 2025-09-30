# Claude Key Portal

> 🚀 为 Claude Relay Service (CRS) 提供用户友好的前端门户，实现自助式API密钥管理和安装指导。

## 📋 项目概述

Claude Key Portal 是一个独立的Web应用，为已部署的 Claude Relay Service 提供用户端界面，让用户能够：

- 🔐 **自助注册账号** - 快速创建账户，开始使用服务
- 🔑 **管理API密钥** - 生成、查看、删除API密钥
- 📊 **监控使用情况** - 实时查看API调用统计和额度
- 📚 **获取安装指导** - 详细的多平台Claude Code安装教程
- 🎯 **一键配置** - 自动生成包含CRS地址的配置脚本

## 🏗️ 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + Shadcn/ui
- **状态管理**: Zustand
- **API请求**: Axios + React Query

### 后端
- **运行时**: Node.js 18+
- **框架**: Express
- **数据库**: PostgreSQL + Redis
- **ORM**: Prisma
- **认证**: JWT + Refresh Token

### 部署
- **Web服务器**: Caddy
- **进程管理**: PM2
- **平台**: VPS

## 🚀 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm 或 yarn

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/yourusername/claude-key-portal.git
cd claude-key-portal
```

2. **安装依赖**
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

必要的环境变量：
```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/claude_key_portal"
REDIS_URL="redis://localhost:6379"

# JWT配置
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# CRS API配置
CRS_API_URL="https://claude.just-play.fun"
CRS_API_KEY="your-crs-admin-key"

# 应用配置
NEXT_PUBLIC_API_URL="http://localhost:4000"
PORT=4000
```

4. **初始化数据库**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. **启动开发服务器**
```bash
# 启动后端（新终端）
cd backend
npm run dev

# 启动前端（新终端）
cd frontend
npm run dev
```

访问 http://localhost:3000 查看应用

## 📁 项目结构

```
claude-key-portal/
├── frontend/                # Next.js前端应用
│   ├── app/                # App Router页面
│   ├── components/         # React组件
│   ├── lib/               # 工具函数
│   └── public/            # 静态资源
│
├── backend/                # Express后端API
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据模型
│   │   └── routes/        # 路由定义
│   └── prisma/            # 数据库schema
│
├── docs/                   # 项目文档
│   ├── PROJECT_PLAN.md    # 详细项目规划
│   ├── TDD_GUIDE.md       # TDD开发指南
│   └── GIT_WORKFLOW.md    # Git工作流规范
│
└── deploy/                 # 部署配置
    ├── Caddyfile          # Caddy配置
    └── ecosystem.config.js # PM2配置
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行E2E测试
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage
```

### 测试覆盖率目标
- 整体覆盖率: ≥ 80%
- 核心业务逻辑: ≥ 95%
- API端点: 100%

## 📦 部署

### 生产环境部署

1. **构建应用**
```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd ../backend
npm run build
```

2. **配置Caddy**
```caddy
your-domain.com {
    # 前端静态文件
    handle /static/* {
        root * /var/www/claude-key-portal/frontend/out
        file_server
    }

    # API代理
    handle /api/* {
        reverse_proxy localhost:4000
    }

    # Next.js应用
    handle {
        reverse_proxy localhost:3000
    }
}
```

3. **使用PM2启动**
```bash
# 启动所有服务
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save
pm2 startup
```

4. **配置自动部署**
```bash
# 使用部署脚本
./deploy/deploy.sh production
```

## 🔧 开发指南

### Git工作流

我们使用Git Flow工作流：

```bash
# 创建功能分支
git checkout -b feature/your-feature develop

# 提交代码（遵循Conventional Commits）
git commit -m "feat(auth): 添加用户注册功能"

# 创建Pull Request到develop分支
```

详见 [GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)

### TDD开发流程

1. **编写失败的测试** (Red)
2. **编写最少代码使测试通过** (Green)
3. **重构代码** (Refactor)

详见 [TDD_GUIDE.md](docs/TDD_GUIDE.md)

## 🎯 功能路线图

### Phase 1: MVP (当前)
- ✅ 用户认证系统
- ✅ API密钥管理
- ✅ 安装指导页面
- ✅ 使用统计面板
- ✅ 中文界面

### Phase 2: 功能增强
- ⏳ 支付系统集成
- ⏳ 邀请码功能
- ⏳ 数据分析面板
- ⏳ 移动端优化

### Phase 3: 商业化
- ⏳ 多级定价方案
- ⏳ 推广联盟系统
- ⏳ 工单系统
- ⏳ 多语言支持

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

请确保：
- 代码通过所有测试
- 遵循项目的代码规范
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙋 常见问题

### 如何重置密码？
在登录页面点击"忘记密码"，输入注册邮箱即可收到重置链接。

### API密钥有使用限制吗？
每个密钥的默认额度为10000次调用，用完后需要充值或创建新密钥。

### 支持哪些平台的安装？
目前支持 Windows (WSL)、macOS 和 Linux 平台的安装指导。

### 如何联系技术支持？
请通过 [support@example.com](mailto:support@example.com) 联系我们。

## 🔗 相关链接

- [Claude Relay Service](https://github.com/Wei-Shaw/claude-relay-service) - 后端CRS项目
- [项目文档](docs/) - 详细开发文档
- [API文档](http://localhost:4000/api-docs) - Swagger API文档（开发环境）

---

Made with ❤️ by Claude Key Portal Team