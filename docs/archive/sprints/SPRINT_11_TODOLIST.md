# Sprint 11: 用户认证和仪表板基础 Todolist

**创建时间**: 2025-10-04
**预计完成**: 2025-10-06
**开发模式**: TDD + 功能开发
**分支**: `feature/user-dashboard`

---

## 🎯 Sprint 目标

基于 Sprint 10 的监控仪表板，构建用户认证系统和基础仪表板功能，为后续的 CRS 集成做准备：
- 用户注册和登录功能
- JWT Token 认证机制
- 基础仪表板页面
- 用户信息管理
- 导航和布局系统

---

## 📋 任务列表

### Phase 1: 准备工作 ✅
- [x] 创建 `feature/user-dashboard` 分支
- [x] 更新 SPRINT_INDEX.md (标记 Sprint 11 开始)
- [x] 安装认证相关依赖 (bcrypt, jsonwebtoken 已安装)

**说明**: 发现早期 Sprint (1-5) 已完成大部分认证测试，只需补充 JWT Token 验证测试

### Phase 2: 🔴 RED - 认证测试编写 ✅
- [x] 编写用户注册 API 测试 (22个测试，Sprint 1 已完成)
- [x] 编写用户登录 API 测试 (23个测试，Sprint 1 已完成)
- [x] 编写 JWT Token 验证测试 (31个测试，新增)
- [x] 编写用户信息获取测试 (15个测试，Sprint 5 已完成)
- [x] 提交 RED Phase

**测试统计**:
- 新增测试文件: `tests/unit/lib/auth.test.ts` (31个测试)
- 已有测试文件: `tests/unit/auth/register.test.ts` (22个测试)
- 已有测试文件: `tests/unit/auth/login.test.ts` (23个测试)
- 已有测试文件: `tests/unit/user/profile.test.ts` (15个测试)
- **Phase 2 总计**: 91 个认证相关测试

### Phase 3: 🟢 GREEN - 认证功能实现 ⚠️ 部分跳过
- [x] ~~实现用户注册 API (`/api/auth/register`)~~ **已完成于 Sprint 1**
- [x] ~~实现用户登录 API (`/api/auth/login`)~~ **已完成于 Sprint 1**
- [x] ~~实现 JWT Token 中间件~~ **已完成**
- [x] ~~实现用户信息 API (`/api/user/me`)~~ **已完成于 Sprint 5**
- [ ] 创建登录页面 (`app/(auth)/login/page.tsx`)
- [ ] 创建注册页面 (`app/(auth)/register/page.tsx`)
- [ ] 创建路由保护中间件 (`middleware.ts`)
- [ ] 提交 GREEN Phase

**说明**: 后端 API 已在早期 Sprint 完成，本阶段聚焦前端页面开发

### Phase 4: 🔴 RED - 仪表板测试编写 ✅
- [x] 编写仪表板布局组件测试 (17个测试)
- [x] 编写顶部导航栏组件测试 (26个测试)
- [x] 编写侧边栏组件测试 (33个测试)
- [x] 编写用户信息卡片组件测试 (36个测试)
- [x] 提交 RED Phase (commit: d918de4)

**测试统计**:
- 新增测试文件: 4 个
- **Phase 4 总计**: 112 个仪表板组件测试
- 测试特性: 完整交互、响应式、可访问性、边界条件、性能优化

### Phase 5: 🟢 GREEN - 仪表板实现 ✅
**认证页面** (Phase 3 延续):
- [x] 创建登录页面 (`app/(auth)/login/page.tsx`)
- [x] 创建注册页面 (`app/(auth)/register/page.tsx`)
- [x] 创建路由保护 (`middleware.ts`)

**仪表板组件**:
- [x] 创建组件目录 (`components/dashboard/`)
- [x] 实现顶部导航栏 (`TopNav.tsx`)
- [x] 实现侧边栏 (`Sidebar.tsx`)
- [x] 实现用户信息卡片 (`UserInfoCard.tsx`)
- [x] 实现仪表板布局 (`DashboardLayout.tsx`)

**仪表板页面**:
- [x] 创建仪表板布局 (`app/(dashboard)/layout.tsx`)
- [x] 创建仪表板首页 (`app/(dashboard)/page.tsx`)
- [x] 集成用户信息展示

- [x] 提交 GREEN Phase (commit: c9c5396)

**路由组织** (按审计报告建议):
```
app/(dashboard)/
├── layout.tsx       # 使用 DashboardLayout 组件
├── page.tsx         # 仪表板首页
└── monitoring/      # 监控页面（已存在）
```

### Phase 6: 🔵 REFACTOR - 优化和重构 ✅
- [x] 认证流程优化（自动跳转、Token 刷新）
- [x] 组件性能优化（memo, useCallback）
- [x] TypeScript 类型检查
- [x] ESLint 检查
- [x] 提交 REFACTOR Phase (commit: aa5a395)

### Phase 7: 📝 文档和部署
- [x] 创建项目结构审计报告 (`SPRINT_11_STRUCTURE_AUDIT.md`)
- [ ] 创建 Sprint 11 总结文档 (`SPRINT_11_SUMMARY.md`)
- [ ] 更新 Sprint 索引 (`SPRINT_INDEX.md`)
- [ ] 合并到 develop 分支
- [ ] 创建 Sprint 12 todolist

**审计发现的重构建议** (可选，Sprint 12):
- [ ] 统一路由组织 (marketing/auth/dashboard 路由组)
- [ ] 创建共享类型文件 (`types/`)
- [ ] 创建统一 API Client (`lib/api-client.ts`)
- [ ] 优化组件结构 (`features/layout/shared`)

---

## 🎨 UI/UX 设计要求

### 登录页面
```
+----------------------------------------------------------+
| Claude Key Portal Logo                                    |
+----------------------------------------------------------+
|                  欢迎回来                                   |
|                                                          |
| [邮箱输入框]                                               |
| [密码输入框]                                               |
|                                                          |
| [登录按钮]                                                |
|                                                          |
| 还没有账号？[注册]                                          |
+----------------------------------------------------------+
```

### 注册页面
```
+----------------------------------------------------------+
| Claude Key Portal Logo                                    |
+----------------------------------------------------------+
|                  创建账号                                   |
|                                                          |
| [昵称输入框]                                               |
| [邮箱输入框]                                               |
| [密码输入框]                                               |
| [确认密码输入框]                                            |
|                                                          |
| [注册按钮]                                                |
|                                                          |
| 已有账号？[登录]                                            |
+----------------------------------------------------------+
```

### 仪表板布局
```
+----------------------------------------------------------+
| Header: Logo | 导航 | 用户信息                             |
+----------------------------------------------------------+
| Sidebar   |  Main Content Area                          |
| - 首页     |                                              |
| - 密钥管理  |  Dashboard Home Page                        |
| - 监控     |  - 欢迎信息                                  |
| - 统计     |  - 快速操作                                  |
| - 安装指导  |  - 密钥总览卡片                              |
| - 设置     |  - 最近活动                                  |
+----------------------------------------------------------+
```

---

## 🧪 测试要求

### 认证 API 测试
- **注册 API** (`POST /api/auth/register`):
  - 成功注册新用户
  - 邮箱已存在
  - 邮箱格式验证
  - 密码强度验证
  - 必填字段验证

- **登录 API** (`POST /api/auth/login`):
  - 成功登录并返回 Token
  - 邮箱或密码错误
  - 账号不存在
  - 账号已禁用

- **Token 验证**:
  - 有效 Token 验证通过
  - 过期 Token 验证失败
  - 无效 Token 验证失败
  - Token 缺失验证失败

### 组件测试
- **登录表单**:
  - 表单渲染
  - 表单验证
  - 提交成功
  - 提交失败

- **注册表单**:
  - 表单渲染
  - 表单验证
  - 密码确认一致性
  - 提交成功/失败

- **仪表板布局**:
  - 布局渲染
  - 导航功能
  - 响应式设计
  - 用户信息展示

---

## 📦 技术栈

### 认证
- **bcrypt**: 密码加密（已安装）
- **jsonwebtoken**: JWT Token 生成和验证（已安装）
- **next-auth**: 可选（暂不使用，保持简单）

### 数据库
- **Prisma**: ORM（已安装）
- **PostgreSQL**: 数据库
- **User 表**: 已定义

### 前端
- **React 18**: 组件库
- **Next.js 14**: App Router
- **shadcn/ui**: UI 组件（已安装）
- **React Hook Form**: 表单管理（可选）
- **Zod**: 表单验证

---

## 🔗 依赖关系

### 前置条件
- ✅ Sprint 10 完成（监控仪表板）
- ✅ Prisma schema 已定义 User 表
- ✅ shadcn/ui 组件系统已建立

### 新增依赖（可选）
- [ ] react-hook-form（表单管理）
- [ ] zod（数据验证）
- [ ] @hookform/resolvers（Zod 集成）

---

## 📊 数据库 Schema

### User 表（已定义）
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  nickname  String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关系
  apiKeys   ApiKey[]
}
```

---

## 🚀 验收标准

- [ ] 用户可以成功注册账号
- [ ] 用户可以成功登录并获得 Token
- [ ] Token 验证正常工作
- [ ] 受保护的路由正确重定向
- [ ] 仪表板布局正常显示
- [ ] 导航功能正常工作
- [ ] 用户信息正确展示
- [ ] 所有测试通过
- [ ] TypeScript 无错误
- [ ] ESLint 无警告
- [ ] 文档完整

---

## 📝 备注

### 核心原则
- **安全第一**: 密码加密存储，Token 安全传输
- **用户体验**: 友好的错误提示，流畅的交互
- **代码质量**: TDD 流程，类型安全，测试覆盖

### 未来功能（Sprint 12+）
- [ ] 忘记密码功能
- [ ] 邮箱验证
- [ ] 第三方登录（GitHub, Google）
- [ ] 双因素认证（2FA）
- [ ] 用户头像上传
- [ ] 账号设置页面

---

**创建者**: Sprint 10 Team
**开始日期**: 2025-10-04（计划）
**预计工时**: 12-16 小时
**优先级**: 高
