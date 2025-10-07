# 🔧 配置指南 / Configuration Guide

## 环境配置文件

### 开发环境

```bash
cp .env.local.template .env.local
```

### 生产环境

```bash
cp .env.production.template .env.production
```

---

## 必需配置项

### 1. 数据库 (PostgreSQL)

**开发环境** - 本地数据库：

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/claude_portal_dev"
```

**生产环境** - Supabase（新建独立项目）：

```bash
# 项目名称：Claude Key Portal
# 项目 ID：gvcfrzaxfehydtxiaxcw
# Region：us-west-1 (West US - North California)
# ✅ 已创建 (2025-10-03) - 完全隔离的独立项目
DATABASE_URL="postgresql://postgres.gvcfrzaxfehydtxiaxcw:DrvsiLusxqKXCwZrRYWILoM4JfbHl1VqBgFt94kXtuY=@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
```

**重要说明**：

- ✅ **数据隔离**：这是专为 Claude Key Portal 创建的独立 Supabase 项目
- 🔒 **安全性**：与其他项目（如 AI 图像视频生成）完全隔离，避免表冲突
- 🌍 **区域一致**：与 R2 和 Redis 都部署在 us-west-1，优化延迟

**配置步骤**：

1. ✅ 已在 Supabase 中创建新项目：`Claude Key Portal`
2. 运行 Prisma 迁移：`npx prisma migrate deploy`

### 2. Redis

**开发环境** - 本地 Redis：

```bash
REDIS_URL="redis://localhost:6379"
```

**生产环境** - Upstash Redis（免费计划）：

```bash
# Database: claude-portal-prod
# Region: N. California, USA (us-west-1)
# ✅ 已创建 (2025-10-03)
# Endpoint: next-woodcock-18201.upstash.io

# 标准 Redis 协议 (TLS)
REDIS_URL="rediss://default:[YOUR_PASSWORD]@next-woodcock-18201.upstash.io:6379"

# 或使用 REST API (推荐用于 Next.js Edge Functions)
UPSTASH_REDIS_REST_URL="https://next-woodcock-18201.upstash.io"
UPSTASH_REDIS_REST_TOKEN="[从控制台复制]"
```

**免费计划限制**：

- 最大数据大小：256 MB
- 最大请求数：10,000 次/秒
- 最大记录大小：100 MB
- 单请求大小：10 MB
- 并发连接：10,000
- 月度带宽：50 GB

**获取密码/Token**：

1. ✅ 数据库已创建
2. 访问控制台：https://console.upstash.com/redis/87712ca2-c4de-4462-ab2b-7a17acf94cd8/details?teamid=0
3. 复制 Redis 密码或 REST Token

### 3. CRS Admin 认证

```bash
CRS_BASE_URL="https://claude.just-play.fun"
CRS_ADMIN_USERNAME="cr_admin_4ce18cd2"
CRS_ADMIN_PASSWORD="HCTBMoiK3PZD0eDC"
```

**说明**：

1. CRS使用session token认证（24小时有效期）
2. Portal通过管理员凭据自动登录获取token
3. Token会自动缓存和刷新
4. 浏览器登录页面：https://claude.just-play.fun/admin-next/login

### 4. JWT 密钥

```bash
# 生成命令
openssl rand -base64 32
```

**配置**：

```bash
NEXTAUTH_SECRET="生成的随机字符串"
JWT_SECRET="生成的随机字符串"
JWT_EXPIRES_IN="24h"
```

**注意**：生产环境必须使用强密钥，不要使用示例值。

---

## 可选配置项

### Cloudflare R2 存储

用于存储用户头像、导出文件等。

```bash
# Bucket: claude-portal
# Location: North America West (WNAM)
# ✅ 已创建 (2025-10-03)
# Token: claude-portal (Object Read/Write, 仅限 claude-portal bucket)
R2_BUCKET_NAME="claude-portal"
R2_ACCESS_KEY_ID="c16e3c386460a2e0926b4de73d963205"
R2_SECRET_ACCESS_KEY="edce45a36e121d760d5c28496461224a69ffc0e4af3b0f695829f88b4caa17bd"
R2_ENDPOINT="https://5fe8e7d41200626ce0d3e24d15fbbfd2.r2.cloudflarestorage.com"
R2_ACCOUNT_ID="5fe8e7d41200626ce0d3e24d15fbbfd2"
```

**重要说明**：

- 🌍 **区域一致**：Bucket 位于 North America West (WNAM)，与 Supabase/Redis 一致
- 🔒 **最小权限**：API Token 仅允许 Object Read/Write，仅限 `claude-portal` bucket
- 📦 **S3 兼容**：可使用任何 S3 客户端库进行操作

**配置步骤**：

1. ✅ 已在 Cloudflare 中创建 R2 bucket：`claude-portal`
2. ✅ 已创建 API Token (最小权限原则)
3. 如需配置 CORS 策略，可在 Cloudflare Dashboard 中设置

---

## 配置验证

### 开发环境检查

```bash
# 1. 检查数据库连接
npx prisma db push

# 2. 检查 Redis 连接
redis-cli ping

# 3. 检查 CRS 连接（先登录获取token）
TOKEN=$(curl -s -X POST https://claude.just-play.fun/web/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cr_admin_4ce18cd2","password":"HCTBMoiK3PZD0eDC"}' | jq -r .token)

curl -H "Authorization: Bearer $TOKEN" https://claude.just-play.fun/admin/api-keys
```

### 配置清单

启动应用前，确认以下配置：

- [ ] `DATABASE_URL` 已配置且可连接
- [ ] `REDIS_URL` 已配置且可连接
- [ ] `CRS_BASE_URL` 已配置
- [ ] `CRS_ADMIN_USERNAME` 已配置
- [ ] `CRS_ADMIN_PASSWORD` 已配置
- [ ] `JWT_SECRET` 和 `NEXTAUTH_SECRET` 已生成
- [ ] 生产环境使用强密钥（不是示例值）

---

## 安全建议

### 密钥管理

- ✅ 使用 `.env` 文件存储敏感信息
- ✅ 将 `.env` 添加到 `.gitignore`
- ✅ 生产环境使用环境变量（不提交到代码库）
- ❌ 不要在代码中硬编码密钥

### 生产环境

- ✅ 使用强 JWT 密钥（32+ 字符）
- ✅ 启用 HTTPS
- ✅ 定期轮换密钥
- ✅ 限制 CRS Admin Token 权限

---

## 快速启动

### 首次配置

```bash
# 1. 复制配置模板
cp .env.local.template .env.local

# 2. 编辑配置文件
nano .env.local

# 3. 生成 JWT 密钥
openssl rand -base64 32

# 4. 初始化数据库
npx prisma migrate dev

# 5. 启动开发服务器
npm run dev
```

### 验证配置

访问 http://localhost:3000 应该看到登录页面。

---

**配置完成！** 🎉

如有问题，参考 [README.md](./README.md) 或提交 Issue。
