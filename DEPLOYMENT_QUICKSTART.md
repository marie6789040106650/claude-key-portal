# 🚀 快速部署指南

> **适用平台**: Vercel
> **预计时间**: 15-20分钟
> **前置条件**: Vercel账号、Supabase PostgreSQL、Upstash Redis

---

## ⚡ 5步快速部署

### Step 1: 获取Upstash Redis凭据 (2分钟)

```bash
# 1. 访问Upstash控制台
https://console.upstash.com/redis/87712ca2-c4de-4462-ab2b-7a17acf94cd8

# 2. 点击 "REST API" 标签

# 3. 复制以下两个值：
UPSTASH_REDIS_REST_URL="https://next-woodcock-18201.upstash.io"
UPSTASH_REDIS_REST_TOKEN="[复制你的token]"
```

### Step 2: 安装并登录Vercel CLI (2分钟)

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录Vercel
vercel login
```

### Step 3: 配置环境变量 (5分钟)

创建一个临时文件 `vercel-env.txt`，填入以下内容：

```bash
# 域名
NEXT_PUBLIC_DOMAIN="https://portal.just-play.fun"

# 数据库（已配置好）
DATABASE_URL="postgresql://postgres.gvcfrzaxfehydtxiaxcw:DrvsiLusxqKXCwZrRYWILoM4JfbHl1VqBgFt94kXtuY=@aws-1-us-west-1.pooler.supabase.com:6543/postgres"

# Redis（步骤1中获取）
UPSTASH_REDIS_REST_URL="[你的Upstash URL]"
UPSTASH_REDIS_REST_TOKEN="[你的Upstash Token]"

# CRS集成（已配置好）
CRS_BASE_URL="https://claude.just-play.fun"
CRS_ADMIN_USERNAME="cr_admin_4ce18cd2"
CRS_ADMIN_PASSWORD="HCTBMoiK3PZD0eDC"

# JWT密钥（已生成）
NEXTAUTH_SECRET="WtgIGc3Gb9ZZlRXKfrJlNsXQnL2KZIC+/ewg0zle1Rk="
NEXTAUTH_URL="https://portal.just-play.fun"
JWT_SECRET="x7rj2zVduSBOcO2UkQrbxfGSjlgylBuKXsTcRgZoQXA="
JWT_EXPIRES_IN="24h"

# 应用环境
NODE_ENV="production"
```

### Step 4: 数据库迁移 (5分钟)

```bash
# 1. 创建临时环境文件
cp .env.production.template .env.production

# 2. 编辑文件，填入所有环境变量（参考vercel-env.txt）
vi .env.production

# 3. 运行数据库迁移
npx dotenv -e .env.production -- npx prisma migrate deploy

# 4. 生成Prisma Client
npx dotenv -e .env.production -- npx prisma generate

# 5. 删除临时文件
rm .env.production
```

### Step 5: 部署到Vercel (5分钟)

```bash
# 1. 链接Vercel项目
vercel link

# 选择:
# - Set up and deploy? Y
# - Link to existing project? N (创建新项目)
# - Project name? claude-key-portal

# 2. 添加环境变量（从vercel-env.txt复制）
vercel env add NEXT_PUBLIC_DOMAIN production
vercel env add DATABASE_URL production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add CRS_BASE_URL production
vercel env add CRS_ADMIN_USERNAME production
vercel env add CRS_ADMIN_PASSWORD production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add JWT_SECRET production
vercel env add JWT_EXPIRES_IN production
vercel env add NODE_ENV production

# 3. 部署到生产环境
vercel --prod

# 4. 等待部署完成（约2-3分钟）
# 部署成功后会显示URL: https://claude-key-portal.vercel.app
```

---

## ✅ 验证部署

### 1. 健康检查

访问: `https://[你的Vercel域名]/api/monitor/health`

**期望响应**:
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

### 2. 注册测试账号

1. 访问: `https://[你的Vercel域名]/register`
2. 创建测试账号
3. 登录验证
4. 访问Dashboard

### 3. 测试密钥创建

1. 登录后访问: `/keys`
2. 创建测试密钥
3. 验证CRS同步
4. 删除测试密钥

---

## 🌐 配置自定义域名（可选）

### 在Vercel Dashboard配置

1. 访问: Dashboard → Settings → Domains
2. 添加域名: `portal.just-play.fun`
3. 按照提示配置DNS（CNAME记录）
4. 等待SSL证书自动配置（约5-10分钟）

---

## 🔧 故障排查

### 问题1: 数据库连接失败

```bash
# 检查DATABASE_URL是否正确
# 确认使用端口6543（Transaction pooler）
```

### 问题2: Redis连接超时

```bash
# 确认使用REST API方式
# 检查Token是否正确复制（无空格）
```

### 问题3: CRS集成失败

```bash
# 测试CRS服务是否正常
curl https://claude.just-play.fun/web/auth/login

# 验证管理员凭据
```

### 问题4: 构建失败

```bash
# 检查本地构建
npm run build

# 查看Vercel构建日志
vercel logs --prod
```

---

## 📞 获取帮助

### 详细文档

- **完整部署指南**: `docs/VERCEL_DEPLOYMENT_GUIDE.md`
- **部署检查清单**: `docs/DEPLOYMENT_CHECKLIST.md`
- **配置验证脚本**: `scripts/verify-production-config.ts`

### 运行验证脚本

```bash
# 在本地运行（连接生产环境）
npx dotenv -e .env.production -- npx tsx scripts/verify-production-config.ts
```

---

## 🎉 部署完成后

### 清理

```bash
# 删除临时文件
rm vercel-env.txt
rm .env.production

# 确认敏感文件未提交
git status
```

### 监控

- **Vercel Dashboard**: https://vercel.com/dashboard
- **查看日志**: `vercel logs --follow`
- **查看Analytics**: Dashboard → Analytics

---

**预计总时间**: 15-20分钟
**最后更新**: 2025-10-07

---

_"简单的步骤，快速的部署！"_ 🚀
