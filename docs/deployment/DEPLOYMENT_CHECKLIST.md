# 🚀 生产部署检查清单

> **日期**: 2025-10-07
> **部署人**: _____
> **环境**: Production (Vercel)

---

## ✅ 部署前检查（Pre-Deployment）

### 代码质量

- [ ] 所有测试通过 (`npm test`)
- [ ] TypeScript编译成功 (`npx tsc --noEmit`)
- [ ] ESLint检查通过 (`npm run lint`)
- [ ] 生产构建成功 (`npm run build`)
- [ ] Git工作树干净 (`git status`)

### 环境准备

- [ ] Vercel账号已创建并登录
- [ ] Supabase PostgreSQL数据库已创建
- [ ] Upstash Redis已配置
- [ ] CRS服务正常运行
- [ ] 域名DNS已配置

---

## 🔧 配置检查（Configuration）

### 1. Vercel配置文件

- [ ] `vercel.json` 已创建
- [ ] `.vercelignore` 已创建
- [ ] `next.config.js` 已更新（移除standalone模式）

### 2. 环境变量生成

- [ ] JWT_SECRET已生成
  ```bash
  openssl rand -base64 32
  # 结果: _________________
  ```

- [ ] NEXTAUTH_SECRET已生成
  ```bash
  openssl rand -base64 32
  # 结果: _________________
  ```

### 3. 数据库准备

- [ ] 数据库连接字符串已确认
  ```
  DATABASE_URL=postgresql://postgres.gvcfrzaxfehydtxiaxcw:...
  ```

- [ ] 数据库迁移已准备
  ```bash
  npx prisma migrate deploy --preview-feature
  ```

### 4. Redis配置

- [ ] Upstash REST API Token已获取
  ```
  UPSTASH_REDIS_REST_URL=https://next-woodcock-18201.upstash.io
  UPSTASH_REDIS_REST_TOKEN=_________________
  ```

---

## 📦 Vercel环境变量配置

### 必需变量（13个）

```bash
# 域名
[ ] NEXT_PUBLIC_DOMAIN="https://portal.just-play.fun"

# 数据库
[ ] DATABASE_URL="postgresql://postgres.gvcfrzaxfehydtxiaxcw:DrvsiLusxqKXCwZrRYWILoM4JfbHl1VqBgFt94kXtuY=@aws-1-us-west-1.pooler.supabase.com:6543/postgres"

# Redis (选择一种方案)
[ ] UPSTASH_REDIS_REST_URL="https://next-woodcock-18201.upstash.io"
[ ] UPSTASH_REDIS_REST_TOKEN="[从控制台复制]"

# CRS集成
[ ] CRS_BASE_URL="https://claude.just-play.fun"
[ ] CRS_ADMIN_USERNAME="cr_admin_4ce18cd2"
[ ] CRS_ADMIN_PASSWORD="HCTBMoiK3PZD0eDC"

# JWT认证
[ ] NEXTAUTH_SECRET="[生成的密钥]"
[ ] NEXTAUTH_URL="https://portal.just-play.fun"
[ ] JWT_SECRET="[生成的密钥]"
[ ] JWT_EXPIRES_IN="24h"

# 应用环境
[ ] NODE_ENV="production"
```

### 可选变量（R2存储）

```bash
[ ] R2_BUCKET_NAME="claude-portal"
[ ] R2_ACCESS_KEY_ID="c16e3c386460a2e0926b4de73d963205"
[ ] R2_SECRET_ACCESS_KEY="edce45a36e121d760d5c28496461224a69ffc0e4af3b0f695829f88b4caa17bd"
[ ] R2_ENDPOINT="https://5fe8e7d41200626ce0d3e24d15fbbfd2.r2.cloudflarestorage.com"
[ ] R2_ACCOUNT_ID="5fe8e7d41200626ce0d3e24d15fbbfd2"
```

---

## 🗄️ 数据库迁移

### 本地执行（连接生产数据库）

```bash
# 1. 创建临时生产环境文件
[ ] cp .env.production.template .env.production

# 2. 填写所有环境变量
[ ] vi .env.production

# 3. 运行迁移
[ ] npx dotenv -e .env.production -- npx prisma migrate deploy

# 4. 生成Prisma Client
[ ] npx dotenv -e .env.production -- npx prisma generate

# 5. （可选）运行seed
[ ] npx dotenv -e .env.production -- npx prisma db seed

# 6. 删除临时文件
[ ] rm .env.production
```

### 验证迁移

```bash
# 检查数据库表
[ ] 访问Supabase控制台
[ ] 确认所有表已创建
[ ] 检查索引是否正确
```

---

## 🚀 Vercel部署

### 方法1: CLI部署（推荐）

```bash
# 1. 安装Vercel CLI
[ ] npm install -g vercel

# 2. 登录Vercel
[ ] vercel login

# 3. 链接项目
[ ] vercel link

# 4. 部署到生产环境
[ ] vercel --prod
```

### 方法2: Dashboard部署

```bash
# 1. 访问Vercel Dashboard
[ ] https://vercel.com/new

# 2. 导入Git仓库
[ ] 选择 claude-key-portal

# 3. 配置项目
[ ] Framework: Next.js
[ ] Root Directory: ./
[ ] Build Command: npm run build

# 4. 添加环境变量
[ ] 复制粘贴所有环境变量

# 5. 部署
[ ] 点击 "Deploy"
```

---

## 🔍 部署验证

### 1. 构建成功

- [ ] Vercel构建日志显示成功
- [ ] 没有TypeScript错误
- [ ] 没有ESLint错误

### 2. 健康检查

访问：`https://portal.just-play.fun/api/monitor/health`

```json
[ ] {
  "success": true,
  "data": {
    "database": "HEALTHY",
    "redis": "HEALTHY",
    "crs": "HEALTHY"
  }
}
```

### 3. 功能验证

#### 认证功能

- [ ] 访问注册页面：`/register`
- [ ] 创建测试账号
- [ ] 登录成功
- [ ] JWT Token正确生成
- [ ] 退出登录

#### 密钥管理

- [ ] 访问密钥页面：`/keys`
- [ ] 创建测试密钥
- [ ] 查看密钥列表
- [ ] 编辑密钥信息
- [ ] 删除测试密钥

#### CRS集成

- [ ] 密钥创建同步到CRS
- [ ] 访问CRS Admin后台验证
- [ ] 密钥删除同步到CRS

#### 统计功能

- [ ] 访问Dashboard：`/dashboard`
- [ ] 查看使用统计
- [ ] 图表正常显示

### 4. Cron任务验证

- [ ] 访问Vercel Dashboard → Cron Jobs
- [ ] 确认3个任务已注册：
  - [ ] monitor-job (每5分钟)
  - [ ] expiration-check-job (每天9am)
  - [ ] alert-check-job (每15分钟)
- [ ] 查看执行日志

---

## 🌐 域名和SSL

### DNS配置

```bash
# 在域名服务商（Cloudflare/阿里云等）配置
[ ] 类型: CNAME
[ ] 名称: portal
[ ] 值: cname.vercel-dns.com
[ ] TTL: 3600
```

### SSL证书

- [ ] Vercel自动配置Let's Encrypt证书
- [ ] HTTPS访问正常
- [ ] SSL证书有效期检查

---

## 📊 监控配置

### Vercel Analytics

- [ ] 启用Vercel Analytics
- [ ] 配置错误追踪
- [ ] 设置告警通知

### 日志查看

```bash
# 实时查看日志
[ ] vercel logs --follow

# 查看生产日志
[ ] vercel logs --prod
```

---

## 🔒 安全检查

### 环境变量安全

- [ ] 所有敏感信息在Vercel环境变量中
- [ ] `.env.production` 未提交到Git
- [ ] `.gitignore` 包含所有敏感文件

### API安全

- [ ] CRS凭据未暴露在客户端
- [ ] JWT密钥强度足够（>32字符）
- [ ] API端点有认证保护

### 数据库安全

- [ ] Supabase防火墙规则正确
- [ ] 数据库用户权限最小化
- [ ] 定期备份策略启用

---

## 📝 部署后任务

### 立即执行

- [ ] 通知团队部署完成
- [ ] 更新项目文档（部署日期、URL等）
- [ ] 创建监控Dashboard
- [ ] 记录部署问题和解决方案

### 24小时内

- [ ] 检查所有Cron任务执行情况
- [ ] 审查错误日志
- [ ] 验证数据库性能
- [ ] 检查API响应时间

### 1周内

- [ ] 收集用户反馈
- [ ] 性能优化调整
- [ ] 安全审计
- [ ] 备份恢复测试

---

## 🆘 回滚计划

### 如果部署失败

```bash
# 1. 立即回滚到上一个版本
[ ] vercel rollback

# 2. 检查错误日志
[ ] vercel logs --prod

# 3. 修复问题后重新部署
[ ] git commit -m "fix: deployment issue"
[ ] git push origin main
[ ] vercel --prod
```

### 紧急联系人

- **Vercel支持**: support@vercel.com
- **Supabase支持**: https://supabase.com/support
- **CRS管理员**: [联系方式]

---

## ✅ 签名确认

### 部署完成确认

```
部署人: _________________
日期: 2025-10-07
时间: _________________
Vercel URL: https://portal.just-play.fun
部署版本: _________________

确认签名: _________________
```

---

**文档版本**: v1.0
**最后更新**: 2025-10-07
**下次审查**: 部署后1周

---

_"细心的检查清单，是成功部署的保证！"_ ✅
