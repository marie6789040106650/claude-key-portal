# Vercel 生产部署指南

> **创建时间**: 2025-10-07
> **适用平台**: Vercel
> **目标环境**: Production

---

## 📋 前置条件

### 必需服务

1. **Vercel账号** (免费版即可)
   - 网址：https://vercel.com
   - 需要连接GitHub账号

2. **Supabase PostgreSQL数据库** (已配置)
   - 项目：Claude Key Portal (gvcfrzaxfehydtxiaxcw)
   - 区域：us-west-1
   - 连接字符串已在 `.env.production.template` 中

3. **Upstash Redis缓存** (已配置)
   - Database: claude-portal-prod
   - 区域：us-west-1
   - 需要从控制台获取密码和Token

4. **CRS服务** (已部署)
   - 地址：https://claude.just-play.fun
   - 管理员凭据已配置

---

## 🚀 部署步骤

### Step 1: 安装Vercel CLI

```bash
# 全局安装Vercel CLI
npm install -g vercel

# 验证安装
vercel --version

# 登录Vercel
vercel login
```

### Step 2: 配置生产环境变量

在Vercel项目设置中配置以下环境变量：

#### 2.1 域名配置

```bash
NEXT_PUBLIC_DOMAIN="https://portal.just-play.fun"
```

#### 2.2 数据库配置

```bash
DATABASE_URL="postgresql://postgres.gvcfrzaxfehydtxiaxcw:DrvsiLusxqKXCwZrRYWILoM4JfbHl1VqBgFt94kXtuY=@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
```

**注意**: 使用Supabase的Transaction pooler端口（6543）

#### 2.3 Redis配置

**方案A: 使用Redis URL** (传统方式)

```bash
REDIS_URL="rediss://default:[YOUR_PASSWORD]@next-woodcock-18201.upstash.io:6379"
```

**方案B: 使用REST API** (推荐，适合Vercel Edge)

```bash
UPSTASH_REDIS_REST_URL="https://next-woodcock-18201.upstash.io"
UPSTASH_REDIS_REST_TOKEN="[从控制台复制]"
```

获取方式：
1. 访问：https://console.upstash.com/redis/87712ca2-c4de-4462-ab2b-7a17acf94cd8
2. 点击"REST API"标签
3. 复制 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`

#### 2.4 CRS集成配置

```bash
CRS_BASE_URL="https://claude.just-play.fun"
CRS_ADMIN_USERNAME="cr_admin_4ce18cd2"
CRS_ADMIN_PASSWORD="HCTBMoiK3PZD0eDC"
```

#### 2.5 JWT认证配置

生成密钥：

```bash
# 生成NEXTAUTH_SECRET
openssl rand -base64 32

# 生成JWT_SECRET
openssl rand -base64 32
```

配置环境变量：

```bash
NEXTAUTH_SECRET="[生成的密钥]"
NEXTAUTH_URL="https://portal.just-play.fun"
JWT_SECRET="[生成的密钥]"
JWT_EXPIRES_IN="24h"
```

#### 2.6 Cloudflare R2存储（可选）

```bash
R2_BUCKET_NAME="claude-portal"
R2_ACCESS_KEY_ID="c16e3c386460a2e0926b4de73d963205"
R2_SECRET_ACCESS_KEY="edce45a36e121d760d5c28496461224a69ffc0e4af3b0f695829f88b4caa17bd"
R2_ENDPOINT="https://5fe8e7d41200626ce0d3e24d15fbbfd2.r2.cloudflarestorage.com"
R2_ACCOUNT_ID="5fe8e7d41200626ce0d3e24d15fbbfd2"
```

#### 2.7 应用环境

```bash
NODE_ENV="production"
```

### Step 3: 数据库迁移

在**本地**运行迁移脚本（连接到生产数据库）：

```bash
# 1. 创建临时生产环境文件
cp .env.production.template .env.production

# 2. 填写所有必需的环境变量（特别是密钥）
vi .env.production

# 3. 运行Prisma迁移
npx dotenv -e .env.production -- npx prisma migrate deploy

# 4. 生成Prisma Client
npx dotenv -e .env.production -- npx prisma generate

# 5. （可选）运行数据库seed
npx dotenv -e .env.production -- npx prisma db seed

# 6. 删除临时文件（包含敏感信息）
rm .env.production
```

**重要提醒**:
- ⚠️ `.env.production` 包含敏感信息，**切勿提交到Git**
- ✅ 迁移成功后立即删除该文件
- ✅ 数据库迁移只需运行一次

### Step 4: 创建Vercel项目

#### 方案A: 通过Vercel CLI（推荐）

```bash
# 1. 在项目根目录运行
cd /Users/bypasser/claude-project/0930/claude-key-portal

# 2. 连接到Vercel
vercel link

# 3. 选择配置
# - Set up and deploy? Y
# - Which scope? [选择你的账号]
# - Link to existing project? N
# - What's your project's name? claude-key-portal
# - In which directory is your code located? ./
# - Override settings? N

# 4. 部署到生产环境
vercel --prod
```

#### 方案B: 通过Vercel Dashboard

1. 访问：https://vercel.com/new
2. 导入Git仓库：选择 `claude-key-portal` 仓库
3. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. 添加环境变量（参考 Step 2）
5. 点击"Deploy"

### Step 5: 配置自定义域名

1. 访问Vercel项目设置：`Settings` → `Domains`
2. 添加域名：`portal.just-play.fun`
3. 配置DNS记录（在域名服务商处）：

```
类型: CNAME
名称: portal
值: cname.vercel-dns.com
TTL: 3600
```

4. 等待DNS传播（通常5-10分钟）
5. Vercel自动配置SSL证书

### Step 6: 配置Cron Jobs

Vercel会自动识别 `vercel.json` 中的cron配置：

- **监控任务**: 每5分钟运行一次 (`/api/cron/monitor-job`)
- **到期检查**: 每天上午9点运行 (`/api/cron/expiration-check-job`)
- **告警检查**: 每15分钟运行一次 (`/api/cron/alert-check-job`)

**验证Cron配置**:
1. 访问Vercel Dashboard → 项目 → Settings → Cron Jobs
2. 确认3个任务已注册
3. 查看执行日志

---

## ✅ 部署验证清单

### 1. 构建验证

```bash
# 本地验证构建
npm run build

# 检查输出
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages
```

### 2. 数据库连接验证

访问：`https://portal.just-play.fun/api/monitor/health`

期望响应：

```json
{
  "success": true,
  "data": {
    "database": "HEALTHY",
    "redis": "HEALTHY",
    "crs": "HEALTHY"
  }
}
```

### 3. 认证功能验证

1. 访问：`https://portal.just-play.fun/register`
2. 注册测试账号
3. 登录验证
4. 检查JWT Token

### 4. CRS集成验证

1. 登录后访问：`https://portal.just-play.fun/keys`
2. 创建测试密钥
3. 检查CRS Admin后台是否同步
4. 删除测试密钥

### 5. Cron任务验证

1. 访问Vercel Dashboard → Logs
2. 筛选 `/api/cron/*` 路径
3. 确认任务正常执行

---

## 🔧 常见问题

### Q1: 数据库连接失败

**症状**: `Error: Can't reach database server`

**解决方案**:
1. 检查 `DATABASE_URL` 是否正确
2. 确认使用 `6543` 端口（Transaction pooler）
3. 验证Supabase项目状态
4. 检查Vercel IP是否被防火墙阻止

### Q2: Redis连接超时

**症状**: `Error: connect ETIMEDOUT`

**解决方案**:
1. 优先使用REST API方式（方案B）
2. 检查Upstash Redis状态
3. 验证Token是否正确

### Q3: Prisma Client未生成

**症状**: `Cannot find module '@prisma/client'`

**解决方案**:

```bash
# 在Vercel构建设置中添加postinstall脚本
# package.json:
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Q3.5: Prisma连接池错误（Serverless环境）⭐ 重要

**症状**: `prepared statement "s0" already exists` (错误代码: 42P05)

**根本原因**:
Vercel serverless函数可能复用Node.js进程，但Prisma连接池管理不当导致prepared statement冲突。

**解决方案（已在项目中实施）**:

#### 1. DATABASE_URL必须包含连接池参数

```bash
# ❌ 错误配置（会导致连接池问题）
DATABASE_URL="postgresql://user:pass@host:5432/db"

# ✅ 正确配置（包含连接池优化参数）
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=1&pool_timeout=0&connect_timeout=10"
```

**参数说明**:
- `connection_limit=1`: 限制每个serverless实例的最大连接数
- `pool_timeout=0`: 禁用连接池超时（立即获取连接或失败）
- `connect_timeout=10`: 连接超时时间10秒

#### 2. Prisma客户端单例配置（已修复）

文件：`lib/infrastructure/persistence/prisma.ts`

```typescript
// ✅ 所有环境都缓存实例
globalForPrisma.prisma = prisma

// ❌ 旧代码（仅开发环境缓存，导致生产环境问题）
// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### 3. 验证修复

```bash
# 1. 检查环境变量
echo $DATABASE_URL  # 确保包含连接池参数

# 2. 重新部署
vercel --prod

# 3. 测试数据库操作
# 访问: https://your-app.vercel.app/auth/register
# 注册新用户，如果成功说明问题已解决
```

### Q4: Cron任务不执行

**症状**: Cron日志为空

**解决方案**:
1. 确认 `vercel.json` 配置正确
2. 检查API路由是否存在
3. 验证Cron任务是否在Vercel Hobby计划中支持
4. Hobby计划限制：最多2个Cron任务

### Q5: 环境变量未生效

**症状**: `process.env.XXX` 为 `undefined`

**解决方案**:
1. 在Vercel Dashboard重新部署
2. 确认环境变量在正确的环境（Production）
3. 检查变量名是否正确（区分大小写）

---

## 📊 性能优化建议

### 1. 启用Edge Caching

在API路由中添加缓存头：

```typescript
export const revalidate = 60 // 缓存60秒

export async function GET(request: NextRequest) {
  // ...
}
```

### 2. 使用Edge Runtime

对于无状态API，启用Edge Runtime：

```typescript
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // ...
}
```

### 3. 图片优化

使用Next.js Image组件：

```tsx
import Image from 'next/image'

<Image
  src="/avatar.png"
  width={40}
  height={40}
  alt="Avatar"
/>
```

### 4. 数据库连接池

Prisma自动使用连接池，但可以优化：

```typescript
// lib/infrastructure/persistence/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

---

## 🔒 安全最佳实践

### 1. 环境变量保护

- ✅ 所有敏感信息都存储在Vercel环境变量中
- ❌ 不要将 `.env.production` 提交到Git
- ✅ 使用 `.env.local` 进行本地开发

### 2. API速率限制

考虑添加Vercel Edge Config进行速率限制：

```typescript
import { kv } from '@vercel/kv'

export async function rateLimit(ip: string) {
  const requests = await kv.incr(`ratelimit:${ip}`)
  if (requests > 100) {
    throw new Error('Rate limit exceeded')
  }
}
```

### 3. CORS配置

在 `next.config.js` 中配置CORS：

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://portal.just-play.fun' },
      ],
    },
  ]
}
```

---

## 📈 监控和日志

### Vercel自带监控

访问：Dashboard → Analytics

监控指标：
- 请求数量
- 响应时间
- 错误率
- 地理分布

### 自定义日志

使用Vercel日志流：

```bash
# 实时查看日志
vercel logs --follow

# 查看生产环境日志
vercel logs --prod
```

---

## 🔄 CI/CD流程

### 自动部署

Vercel会自动部署：
- **main分支** → 生产环境（portal.just-play.fun）
- **其他分支** → Preview环境（自动生成URL）

### 手动部署

```bash
# 部署到生产环境
vercel --prod

# 部署到Preview环境
vercel

# 回滚到上一个版本
vercel rollback
```

---

## 📞 支持资源

- **Vercel文档**: https://vercel.com/docs
- **Next.js文档**: https://nextjs.org/docs
- **Prisma文档**: https://www.prisma.io/docs
- **Supabase文档**: https://supabase.com/docs

---

**最后更新**: 2025-10-07
**维护者**: Claude Key Portal Team
**下次审查**: 部署完成后1周

---

_"清晰的部署流程，是生产环境稳定的保障！"_ 🚀
