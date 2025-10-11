# 数据库连接问题修复指南

## 问题描述

```
Authentication failed against database server at `aws-1-us-west-1.pooler.supabase.com`
```

## 快速修复步骤

### 1. 获取正确的 Supabase 连接字符串

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. **Settings** → **Database** → **Connection string**
4. 选择 **Transaction** 模式（不是 Session！）
5. 复制连接字符串

### 2. 更新本地环境变量

编辑 `.env.local`：

```bash
# Transaction Pooler (端口 6543)
DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct Connection (端口 5432) - 用于迁移
DIRECT_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
```

**重要**：
- 替换 `[PROJECT-ID]` 和 `[PASSWORD]` 为实际值
- 保留 `?pgbouncer=true&connection_limit=1` 参数
- Transaction 端口是 `6543`，Direct 端口是 `5432`

### 3. 处理密码中的特殊字符

如果密码包含 `@`, `#`, `!`, `%`, `/` 等特殊字符，需要 URL 编码：

```bash
# 使用 Node.js 编码密码
node -e "console.log(encodeURIComponent('your-password-here'))"
```

例如：
- 原密码：`Pass@123!`
- 编码后：`Pass%40123%21`

### 4. 运行诊断工具

```bash
# 检查配置和连接
npx tsx scripts/diagnose-database.ts
```

诊断工具会检查：
- ✅ 环境变量配置
- ✅ 数据库连接
- ✅ 查询功能
- ✅ 表结构

### 5. 重新生成 Prisma Client

```bash
# 清理并重新生成
rm -rf node_modules/.prisma
npx prisma generate
```

### 6. 测试应用

```bash
# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 测试注册/登录功能。

## Vercel 部署配置

如果是 Vercel 部署错误，需要配置环境变量：

### 步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 → **Settings** → **Environment Variables**
3. 添加以下变量（**所有环境**）：

#### 必需变量

```env
DATABASE_URL
postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL
postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:5432/postgres

CRS_BASE_URL
https://claude.just-play.fun

CRS_ADMIN_USERNAME
cr_admin_4ce18cd2

CRS_ADMIN_PASSWORD
HCTBMoiK3PZD0eDC

JWT_SECRET
[使用 openssl rand -base64 32 生成]

NEXTAUTH_SECRET
[使用 openssl rand -base64 32 生成]

NEXTAUTH_URL
https://your-domain.vercel.app
```

### 生成随机密钥

```bash
# JWT_SECRET
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 重新部署

配置完环境变量后：
1. **Settings** → **Deployments**
2. 找到最新部署 → 点击 **...** → **Redeploy**
3. 勾选 **Use existing build cache**（可选）
4. 点击 **Redeploy**

## 常见问题

### Q1: 项目显示 "Paused"

**原因**: Supabase 免费计划 7 天未活动会自动暂停

**解决**:
1. Supabase Dashboard → 选择项目
2. 点击 **Resume Project** 按钮
3. 等待 1-2 分钟项目完全启动
4. 重新测试连接

### Q2: 连接超时

**可能原因**:
- 网络问题
- Supabase 服务器维护
- 防火墙阻止

**解决**:
1. 检查网络连接
2. 访问 [Supabase Status](https://status.supabase.com/)
3. 尝试使用 VPN
4. 等待几分钟后重试

### Q3: "Too many connections"

**原因**: Supabase 免费计划连接数限制

**解决**:
1. 确保使用 Transaction Pooler（端口 6543）
2. 连接字符串包含 `?pgbouncer=true`
3. 添加 `connection_limit=1` 参数（Serverless 环境）
4. 检查是否有未关闭的连接

### Q4: Prisma 迁移失败

**原因**: 使用 Transaction Pooler 无法执行迁移

**解决**:
1. 确保配置了 `DIRECT_URL`（端口 5432）
2. 使用 Direct Connection 进行迁移：
   ```bash
   # 使用 DIRECT_URL 运行迁移
   npx prisma migrate deploy

   # 或使用 db push
   DATABASE_URL=$DIRECT_URL npx prisma db push
   ```

### Q5: 本地可以，Vercel 失败

**原因**: Vercel 环境变量未配置或配置错误

**检查清单**:
- [ ] 环境变量名拼写正确
- [ ] 所有环境（Production, Preview, Development）都配置
- [ ] 密码特殊字符已 URL 编码
- [ ] 使用 Transaction Pooler (端口 6543)
- [ ] 包含 `pgbouncer=true` 参数
- [ ] JWT_SECRET 和 NEXTAUTH_SECRET 已设置

## 参考资源

- [Supabase Database Settings](https://supabase.com/dashboard/project/_/settings/database)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## 需要帮助？

如果以上步骤都无法解决问题：

1. 运行诊断工具并保存输出：
   ```bash
   npx tsx scripts/diagnose-database.ts > diagnosis.log 2>&1
   ```

2. 检查 Supabase 项目日志：
   - Dashboard → Logs → Database Logs

3. 检查 Vercel 部署日志：
   - Vercel Dashboard → Deployments → 点击失败的部署

4. 联系支持：
   - Supabase: https://supabase.com/support
   - Vercel: https://vercel.com/support
