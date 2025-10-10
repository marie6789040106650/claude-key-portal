# Claude Key Portal - 全面功能验证主计划

> **分支**: `verification/comprehensive-test`
> **创建时间**: 2025-10-10
> **验证范围**: 所有已实现功能
> **预计时间**: 4-5小时（可分多次完成）

---

## 📍 项目上下文

### 基本信息
- **项目名称**: Claude Key Portal
- **项目定位**: CRS 用户管理门户
- **项目路径**: `/Users/bypasser/claude-project/0930/claude-key-portal`
- **当前分支**: `verification/comprehensive-test`
- **主分支**: `main`
- **核心依赖**: CRS (https://claude.just-play.fun)

### 技术栈
- **前端**: Next.js 14 + React + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + bcrypt
- **测试**: Jest + Playwright

### 关键约束
```
✅ 我们是 CRS 的用户管理门户
✅ 我们代理 CRS Admin API
✅ 我们依赖 CRS 提供核心功能

❌ 我们不是密钥生成系统
❌ 我们不实现密钥逻辑
❌ 我们不是独立的 API 服务
```

---

## 🎯 验证目标

### 主要目标
1. **功能完整性验证**: 确保所有已实现的功能正常工作
2. **数据一致性验证**: 确保前后端数据模型匹配
3. **用户体验验证**: 确保操作流畅，错误提示友好
4. **CRS集成验证**: 确保与CRS的交互正常

### 质量标准
- ✅ 所有API返回正确的状态码和数据格式
- ✅ 所有页面功能正常，无JavaScript错误
- ✅ 数据在前后端保持一致
- ✅ 错误情况有友好的提示信息
- ✅ 操作流畅，无明显性能问题（页面加载<2s，API响应<500ms）

---

## 📋 验证阶段

### 阶段0️⃣: 环境准备与检查 (10-15分钟)

**目标**: 确保验证环境就绪

**任务清单**:
- [ ] 检查开发服务器启动 (`npm run dev`)
- [ ] 检查数据库连接正常
- [ ] 验证环境变量配置 (`.env.local`)
- [ ] 准备测试数据（创建1-2个测试用户）
- [ ] 验证CRS服务可访问
- [ ] 检查必要工具安装 (curl, Playwright等)

**输出**: `docs/verification/reports/00-environment-check.md`

**提示词文件**: `docs/verification/prompts/stage0-environment-setup.md`

---

### 阶段1️⃣: API接口全面验证 (60-90分钟)

**目标**: 验证所有20个API端点的功能正确性

**验证范围**:

#### 1.1 认证接口 (3个)
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/health` - 健康检查

#### 1.2 用户管理 (3个)
- `GET /api/user/profile` - 获取用户信息
- `PATCH /api/user/profile` - 更新用户信息
- `POST /api/user/password` - 修改密码

#### 1.3 密钥管理 (8个)
- `GET /api/keys` - 获取密钥列表
- `POST /api/keys` - 创建新密钥
- `GET /api/keys/[id]` - 获取密钥详情
- `PUT /api/keys/[id]` - 更新密钥
- `DELETE /api/keys/[id]` - 删除密钥
- `PATCH /api/keys/[id]/status` - 切换密钥状态
- `PUT /api/keys/[id]/rename` - 重命名密钥
- `PUT /api/keys/[id]/description` - 更新描述

#### 1.4 本地扩展功能 (5个)
- `PATCH /api/keys/[id]/favorite` - 收藏/取消收藏
- `PATCH /api/keys/[id]/notes` - 更新备注
- `POST /api/keys/[id]/tags` - 添加标签
- `DELETE /api/keys/[id]/tags` - 删除标签
- `GET /api/tags` - 获取标签列表

#### 1.5 统计接口 (5个)
- `GET /api/dashboard` - 仪表板数据
- `GET /api/stats/usage` - 使用统计
- `GET /api/stats/compare` - 使用对比
- `GET /api/stats/leaderboard` - 排行榜
- `GET /api/stats/usage/export` - 导出数据

#### 1.6 安装指导 (1个)
- `POST /api/install/generate` - 生成安装脚本

**验证方法**:
- 使用 curl 或编写测试脚本
- 记录每个API的请求/响应示例
- 特别关注CRS集成的API（密钥管理、统计）

**输出**: `docs/verification/reports/01-api-test-report.md`

**提示词文件**: `docs/verification/prompts/stage1-api-validation.md`

---

### 阶段2️⃣: 浏览器用户旅程验证 (90-120分钟)

**目标**: 使用Playwright模拟真实用户操作流程

**核心旅程**:

#### 旅程1: 新用户注册到创建密钥 (20分钟)
**步骤**:
1. 访问首页 → 点击"开始使用"
2. 注册页面 → 填写信息 → 提交注册
3. 自动跳转登录 → 输入凭据 → 登录成功
4. 进入仪表板 → 查看欢迎提示
5. 点击"创建密钥" → 填写表单 → 创建成功
6. 查看密钥列表 → 确认新密钥显示

#### 旅程2: 密钥管理完整流程 (30分钟)
**步骤**:
1. 查看密钥列表 → 筛选/搜索功能
2. 点击密钥 → 查看详情页面
3. 重命名密钥 → 保存成功
4. 添加备注 → 保存成功
5. 添加标签 → 显示标签
6. 收藏密钥 → 星标显示
7. 切换密钥状态 (启用/禁用)
8. 查看使用统计 → 图表显示

#### 旅程3: 统计数据查看 (20分钟)
**步骤**:
1. 进入仪表板 → 查看概览数据
2. 点击统计页面 → 查看详细图表
3. 切换时间范围 → 数据更新
4. 查看密钥对比 → 图表渲染
5. 查看排行榜 → 列表显示

#### 旅程4: 安装指导流程 (15分钟)
**步骤**:
1. 进入安装页面 → 选择密钥
2. 选择平台 (Cursor/Continue)
3. 生成配置 → 显示安装步骤
4. 复制配置 → 测试复制功能
5. 查看不同环境配置

#### 旅程5: 用户设置管理 (15分钟)
**步骤**:
1. 进入设置页面 → 查看个人信息
2. 更新昵称 → 保存成功
3. 修改密码 → 验证旧密码
4. 查看安全设置 → 会话管理

**边界情况测试**:
- 未登录访问保护页面 → 重定向登录
- 创建密钥超过限制 → 显示错误
- 网络错误处理 → 友好提示
- 表单验证 → 实时错误提示

**验证工具**: Playwright MCP

**输出**: `docs/verification/reports/02-user-journey-report.md`

**提示词文件**: `docs/verification/prompts/stage2-user-journey.md`

---

### 阶段3️⃣: 前后端匹配性验证 (60分钟)

**目标**: 确保API和UI数据模型一致

**验证内容**:

#### 3.1 页面与API对应关系
- [ ] `/auth/login` ↔ `POST /api/auth/login`
- [ ] `/auth/register` ↔ `POST /api/auth/register`
- [ ] `/dashboard` ↔ `GET /api/dashboard`
- [ ] `/dashboard/keys` ↔ `GET /api/keys`
- [ ] `/dashboard/keys/[id]/stats` ↔ `GET /api/stats/usage`
- [ ] `/dashboard/install` ↔ `POST /api/install/generate`
- [ ] `/dashboard/settings/profile` ↔ `GET/PATCH /api/user/profile`

#### 3.2 数据模型一致性
- [ ] 密钥列表: API响应字段 vs UI显示字段
- [ ] 统计数据: API数据结构 vs 图表数据格式
- [ ] 用户信息: API字段 vs 表单字段
- [ ] 错误响应: API错误码 vs UI错误提示

#### 3.3 UI原型对比
- [ ] `prototypes/dashboard.html` vs 实际Dashboard页面
- [ ] `prototypes/keys.html` vs 实际Keys页面
- [ ] `prototypes/usage.html` vs 实际Stats页面
- [ ] `prototypes/install.html` vs 实际Install页面

**验证方法**:
- 对比prototypes/*.html和实际页面
- 检查API响应和UI组件的数据绑定
- 查找未使用的API字段或缺失的UI显示

**输出**: `docs/verification/reports/03-frontend-backend-mapping.md`

**提示词文件**: `docs/verification/prompts/stage3-frontend-backend-match.md`

---

### 阶段4️⃣: 问题汇总和修复计划 (30分钟)

**目标**: 整理所有发现的问题并制定修复计划

**任务**:
1. 汇总阶段0-3的所有问题
2. 按优先级分类（🔴严重/🟡中等/🟢轻微）
3. 按影响范围分类（前端/后端/CRS集成/数据库）
4. 估算修复时间
5. 制定修复顺序

**问题分类标准**:
- 🔴 **P0-严重**: 阻塞核心功能，必须立即修复
- 🟡 **P1-中等**: 影响用户体验，需要优先修复
- 🟢 **P2-轻微**: 优化项，可以排期处理

**输出**: `docs/verification/reports/04-issues-and-fix-plan.md`

**提示词文件**: `docs/verification/prompts/stage4-issues-summary.md`

---

## 🔄 与监控脚本集成

### 工作流程

```bash
# 1️⃣ 确保在验证分支
git checkout verification/comprehensive-test

# 2️⃣ 启动阶段0（环境准备）
cd /Users/bypasser/claude-project/0930/claude-key-portal
claude-monitor start "$(cat docs/verification/prompts/stage0-environment-setup.md)"

# 3️⃣ 完成阶段0后
claude-monitor done

# ⏰ 10秒后自动打开新终端，加载阶段1提示词

# 4️⃣ 依次完成阶段1-4
# 每完成一个阶段执行：
claude-monitor done

# 5️⃣ 所有阶段完成后，合并到main
git checkout main
git merge verification/comprehensive-test
```

### 提示词自动更新机制

监控脚本会在每个阶段完成后自动更新 `.automation/current_prompt.txt`:

```
阶段0完成 → 自动加载 stage1-api-validation.md
阶段1完成 → 自动加载 stage2-user-journey.md
阶段2完成 → 自动加载 stage3-frontend-backend-match.md
阶段3完成 → 自动加载 stage4-issues-summary.md
阶段4完成 → 验证流程结束
```

### 手动切换阶段

如果需要手动切换到特定阶段：

```bash
# 跳到阶段2
claude-monitor start "$(cat docs/verification/prompts/stage2-user-journey.md)"

# 或者直接编辑提示词
cat docs/verification/prompts/stage2-user-journey.md > .automation/current_prompt.txt
```

---

## 📊 验证工具和命令

### 开发服务器
```bash
npm run dev                    # 启动开发服务器 (http://localhost:3000)
npm run db:studio              # 打开Prisma Studio查看数据库
```

### API测试
```bash
# 使用curl测试API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!@#$"}'

# 或创建自动化测试脚本
npx tsx scripts/verify-apis.ts
```

### 浏览器测试
```bash
# 使用Playwright
npx playwright test

# 或使用MCP工具
# 在Claude对话中使用 mcp__playwright__ 工具
```

### 数据库操作
```bash
npx prisma studio              # 可视化查看数据
npx prisma db push             # 同步schema（如需要）
```

### CRS连接测试
```bash
# 测试CRS API连接
curl https://claude.just-play.fun/admin/dashboard \
  -H "Authorization: Bearer <admin_token>"
```

---

## 📝 报告模板

### 每个阶段的报告结构

```markdown
# [阶段名称] - 验证报告

## 执行摘要
- **执行时间**: YYYY-MM-DD HH:mm
- **执行人**: Claude / 人工
- **总体结果**: ✅ 通过 / ⚠️ 部分通过 / ❌ 失败
- **通过率**: X/Y (XX%)

## 详细测试结果

### [测试组1]
- [ ] ✅ 测试项1: 通过
  - 测试步骤: ...
  - 预期结果: ...
  - 实际结果: ...

- [ ] ❌ 测试项2: 失败
  - 测试步骤: ...
  - 预期结果: ...
  - 实际结果: ...
  - 问题描述: ...

## 发现的问题

### 🔴 严重问题 (P0)
#### 问题 #1: [标题]
- **影响范围**: 前端/后端/CRS集成
- **复现步骤**: ...
- **错误信息**: ...
- **修复建议**: ...

### 🟡 中等问题 (P1)
...

### 🟢 轻微问题 (P2)
...

## 截图和日志
[附加相关截图和日志]

## 建议和改进
1. ...
2. ...

## 下一步
- [ ] 修复P0问题
- [ ] 进入下一阶段验证
```

---

## ✅ 验证通过标准

### 整体通过标准
- ✅ **API验证通过率 ≥ 90%**
- ✅ **用户旅程完成率 = 100%**
- ✅ **前后端数据一致性 = 100%**
- ✅ **无P0级别严重问题**
- ✅ **P1问题有明确修复计划**

### 各阶段通过标准

#### 阶段0: 环境准备
- [x] 开发服务器正常启动
- [x] 数据库连接正常
- [x] 环境变量配置正确
- [x] CRS服务可访问
- [x] 测试数据准备完成

#### 阶段1: API验证
- [x] 所有API返回正确状态码
- [x] 响应数据格式符合规范
- [x] CRS集成API正常工作
- [x] 错误处理返回友好提示
- [x] API响应时间 < 500ms

#### 阶段2: 用户旅程
- [x] 所有核心旅程无阻塞
- [x] UI交互流畅自然
- [x] 错误提示清晰友好
- [x] 边界情况处理正确
- [x] 页面加载时间 < 2s

#### 阶段3: 前后端匹配
- [x] 页面与API正确对应
- [x] 数据模型完全一致
- [x] 无未使用的API字段
- [x] 无缺失的UI显示
- [x] 与原型设计基本一致

---

## 📅 时间安排

### 一次性完成（推荐2-3天）
- **Day 1**: 阶段0 + 阶段1 (约2小时)
- **Day 2**: 阶段2 (约2小时)
- **Day 3**: 阶段3 + 阶段4 (约1.5小时)

### 分散完成（灵活安排）
每个阶段独立，可根据时间安排任意拆分

---

## 🎯 交付物

### 文档
- [x] `VERIFICATION_MASTER_PLAN.md` - 本文档
- [x] `prompts/stage0-environment-setup.md`
- [x] `prompts/stage1-api-validation.md`
- [x] `prompts/stage2-user-journey.md`
- [x] `prompts/stage3-frontend-backend-match.md`
- [x] `prompts/stage4-issues-summary.md`
- [ ] `reports/00-environment-check.md`
- [ ] `reports/01-api-test-report.md`
- [ ] `reports/02-user-journey-report.md`
- [ ] `reports/03-frontend-backend-mapping.md`
- [ ] `reports/04-issues-and-fix-plan.md`

### Git提交
```
verification/comprehensive-test
├── 初始提交: 验证计划和提示词
├── 阶段0提交: 环境检查报告
├── 阶段1提交: API验证报告
├── 阶段2提交: 用户旅程报告
├── 阶段3提交: 前后端匹配报告
└── 阶段4提交: 问题汇总和修复计划
```

---

## 📚 参考文档

### 项目文档
- `CLAUDE.md` - 项目配置和开发规范
- `docs/reference/API_MAPPING_SPECIFICATION.md` - API规范
- `docs/reference/DATABASE_SCHEMA.md` - 数据库设计
- `docs/development/DDD_TDD_GIT_STANDARD.md` - 开发标准

### 原型参考
- `prototypes/dashboard.html` - 仪表板原型
- `prototypes/keys.html` - 密钥管理原型
- `prototypes/usage.html` - 统计页面原型
- `prototypes/install.html` - 安装指导原型

---

## 🆘 故障排查

### 开发服务器启动失败
```bash
# 检查端口占用
lsof -ti:3000 | xargs kill -9

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重启
npm run dev
```

### 数据库连接失败
```bash
# 检查环境变量
cat .env.local | grep DATABASE_URL

# 测试连接
npx prisma db pull

# 重置数据库（开发环境）
npx prisma migrate reset
```

### CRS服务不可用
```bash
# 检查CRS服务状态
curl https://claude.just-play.fun/health

# 检查管理员凭据
cat .env.local | grep CRS_ADMIN

# 手动测试登录
curl -X POST https://claude.just-play.fun/web/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cr_admin_4ce18cd2","password":"HCTBMoiK3PZD0eDC"}'
```

---

**最后更新**: 2025-10-10
**维护者**: Claude Key Portal Team
**版本**: v1.0.0
