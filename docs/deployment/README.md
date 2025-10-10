# 部署和配置

本目录包含部署指南、环境配置和生产环境设置文档。

## 🚀 快速开始

### 第一次部署？

1. **配置环境** → [配置指南](./CONFIGURATION_GUIDE.md)
2. **选择平台** → [部署平台分析](./DEPLOYMENT_PLATFORM_ANALYSIS.md)
3. **执行部署** → [Vercel部署指南](./VERCEL_DEPLOYMENT_GUIDE.md)（推荐）
4. **上线检查** → [部署清单](./DEPLOYMENT_CHECKLIST.md)

---

## 📋 配置指南

### 环境配置

- [配置指南](./CONFIGURATION_GUIDE.md) - 环境变量完整配置说明
  - 数据库配置
  - Redis配置
  - CRS集成配置
  - JWT密钥配置

- [生成的密钥](./GENERATED_SECRETS.md) - JWT密钥等敏感信息

### 生产环境

- [生产环境设置](./PRODUCTION_ENVIRONMENT_SETUP.md) - 生产环境完整配置
  - 安全加固
  - 性能优化
  - 监控配置
  - 备份策略

---

## 🎯 部署平台

### 推荐方案：Vercel ⭐

- [Vercel部署指南](./VERCEL_DEPLOYMENT_GUIDE.md) - **推荐阅读**
  - 零配置部署
  - 免费额度充足
  - 完整Prisma支持
  - 自动HTTPS和CDN

### 平台对比

- [部署平台分析](./DEPLOYMENT_PLATFORM_ANALYSIS.md) - Vercel vs Cloudflare vs Docker
  - 技术对比
  - 成本分析
  - 选型建议

---

## ⚙️ GitHub和CI/CD

- [GitHub配置](./GITHUB_SETUP_GUIDE.md) - GitHub Actions CI/CD配置
- [部署清单](./DEPLOYMENT_CHECKLIST.md) - 上线前完整检查清单

---

## 💡 常见部署场景

### 场景1: 首次部署到Vercel

```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署预览
vercel

# 4. 生产部署
vercel --prod
```

参考: [Vercel部署指南](./VERCEL_DEPLOYMENT_GUIDE.md)

### 场景2: 配置环境变量

1. 复制配置模板: `cp .env.local.template .env.local`
2. 填写实际值（参考[配置指南](./CONFIGURATION_GUIDE.md)）
3. 生成JWT密钥: `openssl rand -base64 32`

### 场景3: 数据库迁移

```bash
# 开发环境
npx prisma migrate dev

# 生产环境
npx prisma migrate deploy
```

---

## 📊 部署状态检查

### 健康检查端点

```bash
# 检查服务状态
curl https://your-domain.com/api/health

# 预期响应
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### 常见问题

参考: [已知问题](../development/KNOWN_ISSUES.md)

---

**返回**: [文档导航中心](../../DOCS_INDEX.md) | [项目首页](../../README.md)
