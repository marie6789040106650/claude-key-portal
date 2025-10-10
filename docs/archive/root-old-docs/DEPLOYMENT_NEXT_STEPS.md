# 🚀 部署后续步骤

## 📍 当前状态

✅ 已完成：
- Vercel配置文件创建
- 数据库连接配置
- JWT密钥生成
- 部署脚本准备

⏳ **待完成：获取Upstash Redis Token**

---

## 🔑 Step 1: 获取 Redis Token（2分钟）

### 方法1：通过浏览器（推荐）

1. **打开Upstash控制台**
   ```
   https://console.upstash.com/redis/87712ca2-c4de-4462-ab2b-7a17acf94cd8
   ```

2. **找到Token区域**
   - 页面向下滚动到 "Connect" 部分
   - 点击 "REST" 标签（而不是TCP）

3. **显示并复制Token**
   - 点击 "Read-Only Token" 右侧的 **眼睛图标** 👁️
   - 点击 **复制按钮** 📋 复制Token
   - Token格式类似: `AaXXAAIncDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **填入配置脚本**
   - 编辑文件: `vercel-env-setup.sh`
   - 找到这一行:
     ```bash
     UPSTASH_REDIS_REST_TOKEN="[请填入你的Token]"
     ```
   - 替换为:
     ```bash
     UPSTASH_REDIS_REST_TOKEN="你复制的Token"
     ```

### 方法2：通过终端（备选）

```bash
# 使用浏览器打开URL并手动复制
open "https://console.upstash.com/redis/87712ca2-c4de-4462-ab2b-7a17acf94cd8"
```

---

## 🛠️ Step 2: 配置Vercel环境变量（3分钟）

```bash
# 1. 确保已填写Token
cat vercel-env-setup.sh | grep UPSTASH_REDIS_REST_TOKEN

# 2. 添加执行权限
chmod +x vercel-env-setup.sh

# 3. 运行配置脚本
./vercel-env-setup.sh
```

**预期输出**:
```
🚀 开始配置Vercel环境变量...
📝 添加环境变量到 Vercel Production...
→ 添加: NEXT_PUBLIC_DOMAIN
→ 添加: DATABASE_URL
→ 添加: UPSTASH_REDIS_REST_URL
→ 添加: UPSTASH_REDIS_REST_TOKEN
...
✅ 环境变量配置完成！
```

---

## 🗄️ Step 3: 数据库迁移（2分钟）

```bash
# 1. 创建临时环境文件（用于本地迁移）
cat > .env.production << 'EOF'
DATABASE_URL="postgresql://postgres.gvcfrzaxfehydtxiaxcw:DrvsiLusxqKXCwZrRYWILoM4JfbHl1VqBgFt94kXtuY=@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
EOF

# 2. 运行数据库迁移
npx dotenv -e .env.production -- npx prisma migrate deploy

# 3. 生成Prisma Client
npx dotenv -e .env.production -- npx prisma generate

# 4. 删除临时文件
rm .env.production
```

**预期输出**:
```
✔ Applying migrations...
✔ The following migrations have been applied:
  migrations/
    └─ 20250101000000_init/
```

---

## 🚀 Step 4: 部署到Vercel（5分钟）

```bash
# 确认当前项目配置
vercel link

# 部署到生产环境
vercel --prod
```

**预期输出**:
```
🔍  Inspect: https://vercel.com/.../deployments/...
✅  Production: https://claude-key-portal.vercel.app [2m]
```

---

## ✅ Step 5: 验证部署（5分钟）

### 1. 健康检查

```bash
# 获取部署URL（从上一步输出）
DEPLOY_URL="https://claude-key-portal.vercel.app"

# 测试健康检查端点
curl ${DEPLOY_URL}/api/monitor/health
```

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

1. 访问: `https://claude-key-portal.vercel.app/register`
2. 创建测试账号
3. 登录验证
4. 访问Dashboard

### 3. 测试密钥创建

1. 登录后访问: `/keys`
2. 点击"创建密钥"
3. 验证CRS同步
4. 删除测试密钥

---

## 🌐 Step 6: 配置自定义域名（可选）

1. 访问Vercel Dashboard
2. 进入项目 → Settings → Domains
3. 添加域名: `portal.just-play.fun`
4. 配置DNS（CNAME → vercel-dns.com）
5. 等待SSL证书生成（约5-10分钟）

---

## 🔧 故障排查

### Token获取失败？

```bash
# 检查是否登录Upstash
# 访问: https://console.upstash.com/login
# 使用GitHub或Google登录
```

### 环境变量未生效？

```bash
# 查看当前环境变量
vercel env ls production

# 删除并重新添加
vercel env rm UPSTASH_REDIS_REST_TOKEN production
./vercel-env-setup.sh
```

### 数据库迁移失败？

```bash
# 检查数据库连接
npx dotenv -e .env.production -- npx prisma db pull

# 重置并重新迁移
npx dotenv -e .env.production -- npx prisma migrate reset
npx dotenv -e .env.production -- npx prisma migrate deploy
```

### 部署后健康检查失败？

```bash
# 查看实时日志
vercel logs --follow

# 检查环境变量（在Vercel Dashboard）
# 确认所有变量都已正确设置
```

---

## 📞 获取帮助

**详细文档**:
- 完整部署指南: `docs/VERCEL_DEPLOYMENT_GUIDE.md`
- 部署检查清单: `docs/DEPLOYMENT_CHECKLIST.md`
- API规范: `API_MAPPING_SPECIFICATION.md`

**快速参考**:
- Upstash控制台: https://console.upstash.com
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard

---

## ⏱️ 预计总时间

- Step 1: 获取Token → **2分钟**
- Step 2: 配置环境变量 → **3分钟**
- Step 3: 数据库迁移 → **2分钟**
- Step 4: 部署 → **5分钟**
- Step 5: 验证 → **5分钟**

**总计**: 约 **17分钟**

---

_"只差最后一步，马上就能完成部署了！"_ 🎉
