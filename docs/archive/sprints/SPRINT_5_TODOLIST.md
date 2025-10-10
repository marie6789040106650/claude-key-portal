# Sprint 5 开发计划 - 账户设置与用户管理

**Sprint**: Sprint 5 - Account Settings（账户设置与用户管理）
**分支**: `feature/account-settings`
**预计工期**: 2-3 天
**前置 Sprint**: Sprint 4 ✅
**开发方法**: TDD + Git 工作流

---

## 🎯 Sprint 目标

实现完整的用户账户管理功能，包括用户信息管理、密码修改、头像上传等。

---

## 📋 功能需求

### 1. 用户信息查看和编辑 ⭐⭐⭐

**页面**: `/settings/profile`

**功能点**:
- [x] 查看当前用户信息（昵称、邮箱、注册时间、头像）
- [ ] 编辑用户昵称
- [ ] 上传/更换头像（支持图片裁剪）
- [ ] 显示账户统计（API密钥数量、总使用量）

**API 端点**:
```
GET  /api/user/profile       - 获取用户信息
PUT  /api/user/profile       - 更新用户信息
POST /api/user/avatar        - 上传头像
```

**数据库变更**:
```sql
ALTER TABLE User ADD COLUMN avatar TEXT;
ALTER TABLE User ADD COLUMN bio TEXT;
ALTER TABLE User ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

---

### 2. 密码管理 ⭐⭐⭐

**页面**: `/settings/security`

**功能点**:
- [ ] 修改密码（验证旧密码 → 输入新密码 → 确认）
- [ ] 密码强度检测（弱/中/强）
- [ ] 修改成功后强制重新登录
- [ ] 密码修改历史记录（最近 5 次）

**API 端点**:
```
PUT /api/user/password       - 修改密码
GET /api/user/password/history - 获取密码修改历史
```

**安全要求**:
- ✅ 旧密码验证
- ✅ 新密码强度检查（至少8位，包含大小写、数字、特殊字符）
- ✅ 防止短时间内频繁修改（24小时内最多3次）
- ✅ 修改后使所有已登录 session 失效（除当前）

---

### 3. 账户安全设置 ⭐⭐

**页面**: `/settings/security`

**功能点**:
- [ ] 登录设备管理（查看当前登录的设备）
- [ ] 强制登出所有其他设备
- [ ] 账户活动日志（最近 30 天的登录记录）
- [ ] 可疑活动告警

**API 端点**:
```
GET    /api/user/sessions         - 获取活跃 Session
DELETE /api/user/sessions/:id     - 删除指定 Session
DELETE /api/user/sessions/all     - 登出所有其他设备
GET    /api/user/activity-log     - 获取账户活动日志
```

**数据库变更**:
```sql
CREATE TABLE UserSession (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  token TEXT NOT NULL,
  deviceInfo TEXT,
  ipAddress TEXT,
  lastActive TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE ActivityLog (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

---

### 4. 账户偏好设置 ⭐

**页面**: `/settings/preferences`

**功能点**:
- [ ] 语言设置（中文/英文）
- [ ] 时区设置
- [ ] 邮件通知偏好（配额告警、密钥过期提醒）
- [ ] 界面主题（亮色/暗色）

**API 端点**:
```
GET /api/user/preferences        - 获取偏好设置
PUT /api/user/preferences        - 更新偏好设置
```

**数据库变更**:
```sql
CREATE TABLE UserPreferences (
  userId TEXT PRIMARY KEY,
  language TEXT DEFAULT 'zh-CN',
  timezone TEXT DEFAULT 'Asia/Shanghai',
  theme TEXT DEFAULT 'light',
  emailNotifications JSON,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

---

## 🔬 TDD 开发计划

### 阶段 1: 🔴 RED - 编写测试

**Day 1 上午** (2h):
- [ ] 创建 `feature/account-settings` 分支
- [ ] 编写用户信息 API 测试 (`tests/unit/user/profile.test.ts`)
  - [ ] GET /api/user/profile - 获取用户信息
  - [ ] PUT /api/user/profile - 更新昵称
  - [ ] POST /api/user/avatar - 上传头像
  - [ ] 权限验证（只能访问自己的信息）

**Day 1 下午** (2h):
- [ ] 编写密码管理 API 测试 (`tests/unit/user/password.test.ts`)
  - [ ] PUT /api/user/password - 修改密码
  - [ ] 旧密码验证
  - [ ] 新密码强度检查
  - [ ] Session 失效测试
  - [ ] 频率限制测试

**Day 1 晚上** (2h):
- [ ] 编写 Session 管理测试 (`tests/unit/user/sessions.test.ts`)
  - [ ] GET /api/user/sessions - 获取活跃 Session
  - [ ] DELETE /api/user/sessions/:id - 删除 Session
  - [ ] DELETE /api/user/sessions/all - 登出所有设备

**提交**: `git commit -m "test: add account settings tests (🔴 RED)"`

---

### 阶段 2: 🟢 GREEN - 实现功能

**Day 2 上午** (3h):
- [ ] 实现用户信息 API (`app/api/user/profile/route.ts`)
  - [ ] GET handler - 查询用户信息
  - [ ] PUT handler - 更新用户信息
- [ ] 实现头像上传 API (`app/api/user/avatar/route.ts`)
  - [ ] 使用 `sharp` 处理图片
  - [ ] 限制文件大小（2MB）
  - [ ] 支持 JPG、PNG、WebP

**Day 2 下午** (3h):
- [ ] 实现密码管理 API (`app/api/user/password/route.ts`)
  - [ ] 密码修改逻辑
  - [ ] 密码强度验证工具 (`lib/password-validator.ts`)
  - [ ] Session 失效机制
- [ ] 实现密码修改历史记录

**Day 2 晚上** (2h):
- [ ] 实现 Session 管理 API
  - [ ] `app/api/user/sessions/route.ts` - 列出和删除全部
  - [ ] `app/api/user/sessions/[id]/route.ts` - 删除单个
- [ ] 更新 Auth Service 支持 Session 管理

**提交**:
```bash
git commit -m "feat: implement user profile API (🟢 GREEN)"
git commit -m "feat: implement password management API (🟢 GREEN)"
git commit -m "feat: implement session management API (🟢 GREEN)"
```

---

### 阶段 3: 🔵 REFACTOR - 重构优化

**Day 3 上午** (2h):
- [ ] 提取通用的用户验证中间件
- [ ] 优化头像存储（考虑使用对象存储或 Base64）
- [ ] 提取密码验证逻辑为可复用工具
- [ ] 代码审查和优化

**Day 3 下午** (2h):
- [ ] 运行完整测试套件
- [ ] 修复测试失败（如有）
- [ ] 检查测试覆盖率（目标 >80%）
- [ ] 更新 Prisma schema 和迁移文件

**提交**: `git commit -m "refactor: optimize user management code (🔵 REFACTOR)"`

---

### 阶段 4: 📝 文档和合并

**Day 3 晚上** (2h):
- [ ] 更新 API 文档
- [ ] 编写 Sprint 5 总结文档
- [ ] 创建 Sprint 6 todolist
- [ ] 合并到 develop 分支

**提交**:
```bash
git commit -m "docs: add Sprint 5 summary"
git checkout develop
git merge feature/account-settings
```

---

## 🧪 测试计划

### 单元测试

| 测试文件 | 测试数量（预估） | 覆盖功能 |
|---------|----------------|---------|
| `tests/unit/user/profile.test.ts` | 12 | 用户信息 CRUD、权限验证 |
| `tests/unit/user/password.test.ts` | 15 | 密码修改、强度检查、频率限制 |
| `tests/unit/user/sessions.test.ts` | 10 | Session 管理、设备登出 |
| `tests/unit/user/preferences.test.ts` | 8 | 偏好设置 CRUD |
| `tests/unit/lib/password-validator.test.ts` | 10 | 密码强度检测工具 |
| **合计** | **55** | - |

### 集成测试（可选）

- [ ] 端到端密码修改流程
- [ ] 多设备登录和登出
- [ ] 头像上传和显示

---

## 📦 依赖库

### 新增依赖

```json
{
  "dependencies": {
    "sharp": "^0.33.0",              // 图片处理
    "zxcvbn": "^4.4.2",              // 密码强度检测
    "ua-parser-js": "^1.0.37"        // User-Agent 解析
  },
  "devDependencies": {
    "@types/sharp": "^0.32.0",
    "@types/ua-parser-js": "^0.7.39"
  }
}
```

安装命令:
```bash
npm install sharp zxcvbn ua-parser-js
npm install -D @types/sharp @types/ua-parser-js
```

---

## 🗂️ 数据库 Schema 更新

### Prisma Schema 变更

```prisma
model User {
  id                String          @id @default(cuid())
  email             String          @unique
  password          String
  nickname          String?
  avatar            String?         // 新增
  bio               String?         // 新增
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt  // 新增

  // Relations
  apiKeys           ApiKey[]
  sessions          UserSession[]   // 新增
  activityLogs      ActivityLog[]   // 新增
  preferences       UserPreferences? // 新增
  passwordHistory   PasswordHistory[] // 新增
}

model UserSession {
  id          String   @id @default(cuid())
  userId      String
  token       String   @unique
  deviceInfo  String?
  ipAddress   String?
  lastActive  DateTime @default(now())
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ActivityLog {
  id          String   @id @default(cuid())
  userId      String
  action      String   // 'login', 'logout', 'password_change', 'profile_update'
  ipAddress   String?
  userAgent   String?
  metadata    Json?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserPreferences {
  userId              String   @id
  language            String   @default("zh-CN")
  timezone            String   @default("Asia/Shanghai")
  theme               String   @default("light")
  emailNotifications  Json?

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PasswordHistory {
  id         String   @id @default(cuid())
  userId     String
  hashedPassword String
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 迁移命令

```bash
npx prisma migrate dev --name add_user_management_tables
npx prisma generate
```

---

## 🎨 UI/UX 设计参考

### 页面结构

```
/settings
├── /profile       - 用户信息管理
│   ├── 头像上传区域
│   ├── 昵称编辑
│   ├── 邮箱显示（不可编辑）
│   └── 账户统计卡片
├── /security      - 安全设置
│   ├── 密码修改表单
│   ├── 活跃 Session 列表
│   └── 账户活动日志
└── /preferences   - 偏好设置
    ├── 语言选择
    ├── 时区选择
    ├── 主题切换
    └── 通知偏好
```

### 参考原型

参考 `prototypes/settings.html`（如果存在）

---

## ✅ 验收标准

### 功能完整性

- [ ] 用户可以查看和编辑个人信息
- [ ] 用户可以上传和更换头像
- [ ] 用户可以修改密码并验证旧密码
- [ ] 用户可以查看和管理登录设备
- [ ] 用户可以登出所有其他设备
- [ ] 用户可以设置偏好（语言、时区、主题）

### 测试覆盖

- [ ] 所有新增 API 有完整的单元测试
- [ ] 测试覆盖率 > 80%
- [ ] 所有测试通过（200+ tests passing）

### 安全性

- [ ] 密码修改需要验证旧密码
- [ ] 密码强度符合要求
- [ ] Session 管理正确实现
- [ ] 防止 CSRF 攻击
- [ ] 敏感操作有审计日志

### 代码质量

- [ ] 遵循 TDD 流程（RED → GREEN → REFACTOR）
- [ ] 代码通过 ESLint 检查
- [ ] TypeScript 无类型错误
- [ ] 有完整的注释和文档

---

## 🚀 可选增强功能

### 如果时间允许

1. **双因素认证（2FA）**
   - [ ] TOTP 实现（使用 `speakeasy`）
   - [ ] 备用码生成和验证

2. **邮箱验证**
   - [ ] 发送验证邮件
   - [ ] 邮箱验证状态管理

3. **社交登录**
   - [ ] OAuth 集成（GitHub、Google）

---

## 📊 预期成果

### 交付物

- ✅ 完整的账户设置功能
- ✅ 55+ 个新增测试用例
- ✅ 数据库 Schema 扩展
- ✅ API 文档更新
- ✅ Sprint 5 总结文档

### 技术指标

- **新增代码**: ~1200 行
- **测试覆盖**: 55 个测试用例
- **API 端点**: 8-10 个
- **数据库表**: 4 个新表

---

## 📅 时间规划

| 阶段 | 时间 | 工作内容 |
|------|------|---------|
| 🔴 RED | Day 1 (6h) | 编写所有测试 |
| 🟢 GREEN | Day 2 (8h) | 实现所有功能 |
| 🔵 REFACTOR | Day 3 上午 (4h) | 重构和优化 |
| 📝 文档 | Day 3 下午 (4h) | 文档和合并 |
| **总计** | **22h** | **2-3天** |

---

## 📝 注意事项

### 开发规范

1. **严格遵循 TDD 流程** - 先写测试，再写实现
2. **每个提交都有明确的 emoji 前缀** - 🔴/🟢/🔵
3. **测试必须通过才能进入下一阶段**
4. **代码审查后才能合并**

### 安全考虑

1. **密码处理** - 使用 bcrypt，永不明文存储
2. **Session 管理** - 使用安全的 Token 生成
3. **文件上传** - 严格验证文件类型和大小
4. **输入验证** - 所有用户输入必须验证

### 性能优化

1. **头像存储** - 考虑使用 CDN 或对象存储
2. **查询优化** - 适当添加数据库索引
3. **缓存策略** - 用户信息可以缓存 5 分钟

---

**准备开始 Sprint 5？运行以下命令：**

```bash
git checkout -b feature/account-settings
npm install sharp zxcvbn ua-parser-js
npm install -D @types/sharp @types/ua-parser-js
```

---

_文档创建时间: 2025-10-03_
_前置 Sprint: Sprint 4 (Installation Guide) ✅_
_预计完成时间: 2025-10-06_
