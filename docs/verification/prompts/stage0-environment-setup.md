# 阶段0️⃣: 环境准备与检查

> **项目**: Claude Key Portal
> **路径**: `/Users/bypasser/claude-project/0930/claude-key-portal`
> **分支**: `verification/comprehensive-test`
> **当前阶段**: 0/4
> **预计时间**: 10-15分钟

---

## 🎯 本阶段目标

确保验证环境完全就绪，所有依赖服务正常运行，为后续验证阶段做好准备。

---

## 📋 任务清单

### 任务1: 检查项目状态
- [ ] 确认当前在验证分支 `verification/comprehensive-test`
- [ ] 检查工作区状态（无未提交的更改）
- [ ] 查看最近的Git提交记录

```bash
git branch --show-current
git status
git log --oneline -5
```

### 任务2: 启动开发服务器
- [ ] 启动Next.js开发服务器
- [ ] 验证服务器正常监听 http://localhost:3000
- [ ] 检查控制台无严重错误

```bash
# 在项目根目录执行
npm run dev
```

**预期结果**:
```
✓ Ready in Xs
○ Compiling / ...
✓ Compiled / in XXXms
```

### 任务3: 检查数据库连接
- [ ] 验证PostgreSQL数据库运行正常
- [ ] 测试Prisma连接
- [ ] 可选：打开Prisma Studio查看数据

```bash
# 测试数据库连接
npx prisma db pull

# 打开Prisma Studio（可选）
npm run db:studio
```

**预期结果**: 无连接错误，能正常查询数据库

### 任务4: 验证环境变量
- [ ] 检查 `.env.local` 文件存在
- [ ] 验证必需的环境变量已配置
- [ ] 确认CRS服务URL正确

```bash
# 检查环境变量
cat .env.local

# 必需的环境变量
DATABASE_URL=postgresql://...
CRS_BASE_URL=https://claude.just-play.fun
CRS_ADMIN_USERNAME=cr_admin_4ce18cd2
CRS_ADMIN_PASSWORD=HCTBMoiK3PZD0eDC
JWT_SECRET=...
```

### 任务5: 测试CRS服务连通性
- [ ] 测试CRS服务可访问
- [ ] 验证管理员凭据有效
- [ ] 获取CRS Admin Token（用于后续API测试）

```bash
# 测试CRS服务健康检查
curl https://claude.just-play.fun/health

# 测试管理员登录
curl -X POST https://claude.just-play.fun/web/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cr_admin_4ce18cd2","password":"HCTBMoiK3PZD0eDC"}'
```

**预期结果**: 返回 `{"success": true, "token": "...", ...}`

### 任务6: 准备测试数据
- [ ] 创建测试用户账户（如果不存在）
- [ ] 记录测试账户信息
- [ ] 可选：创建1-2个测试密钥

**测试账户信息**:
```
邮箱: test@example.com
密码: Test1234!@#$
昵称: Test User
```

**注册命令**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!@#$",
    "nickname": "Test User"
  }'
```

### 任务7: 验证必要工具
- [ ] 检查curl已安装 (`curl --version`)
- [ ] 检查Node.js版本 (`node --version`, 需要 >= 18)
- [ ] 确认Playwright可用（用于阶段2）

```bash
curl --version
node --version
npm --version

# 检查Playwright
npx playwright --version
```

---

## ✅ 通过标准

- [x] 开发服务器在 http://localhost:3000 正常运行
- [x] 数据库连接正常，Prisma可以查询数据
- [x] `.env.local` 包含所有必需的环境变量
- [x] CRS服务可访问，管理员登录成功
- [x] 测试用户账户已创建并可登录
- [x] 所有验证工具已安装

---

## 📝 输出要求

创建环境检查报告: `docs/verification/reports/00-environment-check.md`

**报告模板**:
```markdown
# 阶段0: 环境准备与检查 - 报告

## 执行摘要
- **执行时间**: 2025-10-10 HH:mm
- **总体结果**: ✅ 通过 / ⚠️ 部分通过 / ❌ 失败

## 检查结果

### 1. 项目状态
- [x] 分支: verification/comprehensive-test
- [x] 工作区: 干净

### 2. 开发服务器
- [x] 状态: 运行中
- [x] 地址: http://localhost:3000
- [x] 启动时间: Xs

### 3. 数据库连接
- [x] PostgreSQL: 正常
- [x] Prisma: 连接成功

### 4. 环境变量
- [x] DATABASE_URL: ✅
- [x] CRS_BASE_URL: ✅
- [x] CRS凭据: ✅
- [x] JWT_SECRET: ✅

### 5. CRS服务
- [x] 健康检查: ✅
- [x] 管理员登录: ✅
- [x] Token获取: ✅

### 6. 测试数据
- [x] 测试用户: test@example.com
- [x] 密码设置: ✅
- [x] 登录测试: ✅

### 7. 验证工具
- [x] curl: vX.X.X
- [x] Node.js: vX.X.X
- [x] Playwright: vX.X.X

## 发现的问题
[如果有，列出问题]

## 结论
环境准备完成，可以进入阶段1: API接口验证
```

---

## 🔄 下一步

完成本阶段后，执行：

```bash
# 保存报告
git add docs/verification/reports/00-environment-check.md
git commit -m "docs: add environment check report for verification"

# 标记完成，自动进入阶段1
claude-monitor done
```

10秒后将自动打开新终端，加载阶段1提示词：
`docs/verification/prompts/stage1-api-validation.md`

---

## 🆘 故障排查

### 开发服务器启动失败
```bash
# 清理端口
lsof -ti:3000 | xargs kill -9

# 重新安装依赖
rm -rf node_modules .next
npm install

# 重启
npm run dev
```

### 数据库连接失败
```bash
# 检查PostgreSQL运行状态
# 或重启Docker容器（如使用Docker）

# 重新同步schema
npx prisma generate
npx prisma db push
```

### CRS服务不可用
```bash
# 检查网络连接
ping claude.just-play.fun

# 检查凭据是否过期
# 联系CRS管理员确认
```

---

**参考文档**:
- 主计划: `docs/verification/VERIFICATION_MASTER_PLAN.md`
- 项目配置: `CLAUDE.md`
- API规范: `docs/reference/API_MAPPING_SPECIFICATION.md`
