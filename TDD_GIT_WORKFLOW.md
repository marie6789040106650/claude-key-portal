# Claude Key Portal - TDD + Git 工作流开发计划

## 一、开发原则 / Development Principles

### 1.1 核心理念

```
✅ TDD 优先 - 测试驱动开发，先写测试后写实现
✅ 小步提交 - 每个功能点独立 Git commit
✅ 持续集成 - 每次 push 自动运行测试和构建
✅ ALL GREEN - 所有测试通过才能合并
✅ Code Review - 所有代码必须经过审查
```

### 1.2 TDD 循环

```
Red → Green → Refactor

1. 🔴 Red: 编写失败的测试
2. 🟢 Green: 编写最小实现让测试通过
3. 🔵 Refactor: 重构代码保持测试通过
```

---

## 二、Git 分支策略 / Git Branch Strategy

### 2.1 分支模型

```
main (主分支 - 生产环境)
  ├── develop (开发分支 - 集成环境)
  │   ├── feature/auth-system (功能分支)
  │   ├── feature/key-management (功能分支)
  │   ├── feature/dashboard (功能分支)
  │   └── feature/installation-guide (功能分支)
  ├── hotfix/critical-bug (热修复分支)
  └── release/v1.0.0 (发布分支)
```

### 2.2 分支命名规范

```bash
# 功能分支
feature/短描述              # feature/user-login
feature/模块-功能          # feature/keys-create

# 修复分支
fix/短描述                 # fix/validation-error
fix/模块-问题             # fix/auth-token-expire

# 热修复分支
hotfix/严重问题            # hotfix/security-vulnerability

# 发布分支
release/版本号             # release/v1.0.0

# 测试分支
test/测试内容              # test/integration-keys-api
```

### 2.3 分支生命周期

```bash
# 1. 创建功能分支（从 develop）
git checkout develop
git pull origin develop
git checkout -b feature/user-auth

# 2. TDD 开发（多次小提交）
git add .
git commit -m "test: add user login validation test"
git commit -m "feat: implement user login validation"
git commit -m "refactor: extract validation logic"

# 3. 推送到远程
git push origin feature/user-auth

# 4. 创建 Pull Request
# - 标题: feat: user authentication system
# - 描述: 实现用户认证系统，包括登录、注册、密码重置
# - 关联 Issue: #1

# 5. Code Review 通过后合并到 develop
git checkout develop
git merge --no-ff feature/user-auth
git push origin develop

# 6. 删除功能分支
git branch -d feature/user-auth
git push origin --delete feature/user-auth
```

---

## 三、Commit 消息规范 / Commit Message Convention

### 3.1 Commit 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 3.2 Type 类型

```
test:     添加或修改测试（TDD 第一步）
feat:     新功能（TDD 第二步）
fix:      修复 bug
refactor: 重构代码（TDD 第三步）
docs:     文档更新
style:    代码格式（不影响代码运行）
perf:     性能优化
chore:    构建过程或辅助工具变动
ci:       CI/CD 配置修改
```

### 3.3 Commit 示例

```bash
# TDD 循环示例
git commit -m "test: add user registration validation test"
git commit -m "feat: implement user registration validation"
git commit -m "refactor: extract email validation logic"

# 功能开发示例
git commit -m "test: add API key creation test cases"
git commit -m "feat: implement API key creation endpoint"
git commit -m "test: add rate limiting test"
git commit -m "feat: add rate limiting middleware"
git commit -m "refactor: optimize key generation algorithm"

# Bug 修复示例
git commit -m "test: add test for token expiration bug"
git commit -m "fix: correct token expiration check logic"

# 文档示例
git commit -m "docs: update API documentation for key creation"
```

---

## 四、TDD 开发流程 / TDD Development Workflow

### 4.1 Sprint 0: 项目初始化（2天）

#### 任务 0.1: Git 仓库初始化
```bash
# 1. 创建仓库
git init
git checkout -b main

# 2. 创建 .gitignore
cat > .gitignore <<EOF
node_modules/
.next/
.env
.env.local
dist/
coverage/
*.log
.DS_Store
EOF

git add .gitignore
git commit -m "chore: initialize project with .gitignore"

# 3. 创建 README
git add README.md
git commit -m "docs: add project README"

# 4. 推送到远程
git remote add origin <repository-url>
git push -u origin main

# 5. 创建 develop 分支
git checkout -b develop
git push -u origin develop
```

#### 任务 0.2: 测试环境配置
```bash
# 1. 创建分支
git checkout -b feature/setup-testing

# 2. 安装测试依赖
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
npm install -D ts-jest @types/jest

# 3. 配置 Jest
cat > jest.config.js <<EOF
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
}
EOF

git add package.json jest.config.js
git commit -m "chore: setup jest testing environment"

# 4. 创建测试脚本
# package.json 添加:
# "test": "jest",
# "test:watch": "jest --watch",
# "test:coverage": "jest --coverage"

git add package.json
git commit -m "chore: add test scripts to package.json"

# 5. 推送并创建 PR
git push origin feature/setup-testing
# 创建 PR: "chore: setup testing environment"
```

#### 任务 0.3: CI/CD 配置
```bash
# 1. 创建分支
git checkout develop
git pull origin develop
git checkout -b feature/setup-cicd

# 2. 创建 GitHub Actions 配置
mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<EOF
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - name: Upload coverage
        uses: codecov/codecov-action@v3
EOF

git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow"

# 3. 推送并创建 PR
git push origin feature/setup-cicd
```

---

### 4.2 Sprint 1: 用户认证（3-4天）

#### Feature 1.1: 用户注册

**分支**: `feature/user-registration`

**TDD 步骤**:

```bash
# 1. 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/user-registration

# 2. 🔴 RED: 编写测试
# tests/api/auth/register.test.ts
```

```typescript
// tests/api/auth/register.test.ts
import { POST } from '@/app/api/auth/register/route';

describe('POST /api/auth/register', () => {
  it('should register a new user with valid data', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('token');
  });

  it('should reject registration with invalid email', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'Test User'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email format');
  });

  it('should reject registration with weak password', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Password must be');
  });

  it('should reject duplicate email registration', async () => {
    // 第一次注册
    await POST(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'User 1'
      }),
    }));

    // 第二次注册相同邮箱
    const response = await POST(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'AnotherPass456!',
        name: 'User 2'
      }),
    }));

    const data = await response.json();
    expect(response.status).toBe(409);
    expect(data.error).toBe('Email already exists');
  });
});
```

```bash
# 提交测试
git add tests/api/auth/register.test.ts
git commit -m "test: add user registration test cases"

# 运行测试（此时应该失败 - RED）
npm test
```

```bash
# 3. 🟢 GREEN: 实现功能
# app/api/auth/register/route.ts
```

```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  name: z.string().min(1, 'Name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证输入
    const validatedData = registerSchema.parse(body);

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
      },
    });

    // 生成 JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json(
      {
        userId: user.id,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

```bash
# 提交实现
git add app/api/auth/register/route.ts
git commit -m "feat: implement user registration endpoint"

# 运行测试（此时应该通过 - GREEN）
npm test
```

```bash
# 4. 🔵 REFACTOR: 重构代码
# lib/validation/auth.ts
```

```typescript
// lib/validation/auth.ts
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

export const emailSchema = z.string().email('Invalid email format');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
```

```bash
# 重构代码使用提取的验证逻辑
git add lib/validation/auth.ts app/api/auth/register/route.ts
git commit -m "refactor: extract auth validation schemas"

# 再次运行测试确保重构没有破坏功能
npm test
```

```bash
# 5. 推送功能分支
git push origin feature/user-registration

# 6. 创建 Pull Request
# 标题: feat: user registration system
# 描述:
# - ✅ 用户注册 API endpoint
# - ✅ 邮箱格式验证
# - ✅ 密码强度验证
# - ✅ 重复邮箱检查
# - ✅ 密码加密存储
# - ✅ JWT token 生成
# - ✅ 100% 测试覆盖率
#
# Tests: 4 passed
# Coverage: 100%
```

---

#### Feature 1.2: 用户登录

**分支**: `feature/user-login`

```bash
# 1. 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/user-login

# 2. 🔴 RED: 编写测试
git add tests/api/auth/login.test.ts
git commit -m "test: add user login test cases"

# 3. 🟢 GREEN: 实现功能
git add app/api/auth/login/route.ts
git commit -m "feat: implement user login endpoint"

# 4. 🔵 REFACTOR: 重构代码
git add lib/auth/password.ts
git commit -m "refactor: extract password comparison logic"

# 5. 推送并创建 PR
git push origin feature/user-login
```

---

### 4.3 Sprint 2: 密钥管理（4-5天）

#### Feature 2.1: 创建密钥

**分支**: `feature/keys-create`

**完整的 TDD Git 流程**:

```bash
# ==================== 步骤 1: 准备分支 ====================
git checkout develop
git pull origin develop
git checkout -b feature/keys-create

# ==================== 步骤 2: 🔴 RED - 编写测试 ====================

# 2.1 编写单元测试
cat > tests/unit/services/key-service.test.ts <<EOF
import { KeyService } from '@/services/key-service';

describe('KeyService', () => {
  describe('createKey', () => {
    it('should create key with valid data', async () => {
      const keyData = {
        userId: 'user-123',
        name: 'Development Key',
        rateLimit: 100,
      };

      const result = await KeyService.createKey(keyData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Development Key');
    });
  });
});
EOF

git add tests/unit/services/key-service.test.ts
git commit -m "test: add key creation unit test"

# 2.2 编写集成测试
cat > tests/integration/api/keys.test.ts <<EOF
import { POST } from '@/app/api/keys/route';

describe('POST /api/keys', () => {
  it('should create key in CRS and local mapping', async () => {
    // Test implementation
  });
});
EOF

git add tests/integration/api/keys.test.ts
git commit -m "test: add key creation integration test"

# 2.3 运行测试（应该失败）
npm test
# ❌ FAIL: KeyService is not defined

# ==================== 步骤 3: 🟢 GREEN - 最小实现 ====================

# 3.1 创建 Service 层
cat > src/services/key-service.ts <<EOF
export class KeyService {
  static async createKey(data: any) {
    // Minimal implementation to pass test
    return {
      id: 'key-123',
      name: data.name,
    };
  }
}
EOF

git add src/services/key-service.ts
git commit -m "feat: add KeyService with createKey method"

# 3.2 运行测试
npm test
# ✅ PASS: 1 test passed

# 3.3 实现完整功能
# 编辑 src/services/key-service.ts 添加完整实现

git add src/services/key-service.ts
git commit -m "feat: implement full key creation logic with CRS integration"

# 3.4 创建 API route
cat > app/api/keys/route.ts <<EOF
import { KeyService } from '@/services/key-service';

export async function POST(request: Request) {
  // Implementation
}
EOF

git add app/api/keys/route.ts
git commit -m "feat: add POST /api/keys endpoint"

# 3.5 运行所有测试
npm test
# ✅ PASS: All tests passed

# ==================== 步骤 4: 🔵 REFACTOR - 重构优化 ====================

# 4.1 提取验证逻辑
cat > lib/validation/key.ts <<EOF
import { z } from 'zod';

export const keyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  rateLimit: z.number().min(1).max(10000),
  // ...
});
EOF

git add lib/validation/key.ts
git commit -m "refactor: extract key validation schemas"

# 4.2 优化错误处理
git add src/services/key-service.ts
git commit -m "refactor: improve error handling in KeyService"

# 4.3 运行测试确保重构正确
npm test
# ✅ PASS: All tests still passing

# 4.4 运行覆盖率测试
npm run test:coverage
# Coverage: 95% statements, 90% branches

# ==================== 步骤 5: 推送并创建 PR ====================
git push origin feature/keys-create

# PR 描述模板:
# Title: feat: API key creation with CRS integration
#
# ## Changes
# - ✅ KeyService for key management logic
# - ✅ POST /api/keys endpoint
# - ✅ CRS integration for key storage
# - ✅ Local mapping table for user-key relationship
# - ✅ Comprehensive test coverage
#
# ## Tests
# - Unit tests: 5 passed
# - Integration tests: 3 passed
# - Coverage: 95%
#
# ## Checklist
# - [x] Tests pass locally
# - [x] Code follows style guide
# - [x] Documentation updated
# - [x] No console errors
```

---

### 4.4 Sprint 3: 统计功能（3-4天）

#### Feature 3.1: Dashboard 统计

**分支**: `feature/dashboard-stats`

**快速 TDD 模式**:

```bash
# 单个 commit 包含 Red-Green-Refactor 循环
git checkout -b feature/dashboard-stats

# 🔴🟢🔵 完整的 TDD 循环
git commit -m "test: add dashboard stats test" \
           -m "feat: implement stats calculation" \
           -m "refactor: optimize query performance"

# 或者分开提交
git commit -m "test: add dashboard stats aggregation test"
git commit -m "feat: implement dashboard stats service"
git commit -m "test: add real-time metrics test"
git commit -m "feat: add real-time metrics endpoint"
git commit -m "refactor: extract stats calculation logic"

git push origin feature/dashboard-stats
```

---

## 五、完整的 Sprint 开发示例

### Sprint 2 完整流程（密钥管理）

```bash
# ========================================
# Week 1: 密钥 CRUD 功能
# ========================================

# Day 1: 创建密钥
git checkout -b feature/keys-create
# ... TDD 开发 ...
git push origin feature/keys-create
# 创建 PR → Code Review → 合并到 develop

# Day 2: 列表查询
git checkout develop
git pull origin develop
git checkout -b feature/keys-list
# ... TDD 开发 ...
git push origin feature/keys-list
# 创建 PR → Code Review → 合并到 develop

# Day 3: 密钥详情
git checkout develop
git pull origin develop
git checkout -b feature/keys-detail
# ... TDD 开发 ...
git push origin feature/keys-detail

# Day 4: 更新密钥
git checkout develop
git pull origin develop
git checkout -b feature/keys-update
# ... TDD 开发 ...
git push origin feature/keys-update

# Day 5: 删除密钥
git checkout develop
git pull origin develop
git checkout -b feature/keys-delete
# ... TDD 开发 ...
git push origin feature/keys-delete

# ========================================
# Week 1 结束时的状态检查
# ========================================

git checkout develop
git pull origin develop

# 运行所有测试
npm test
# ✅ 50 tests passed

# 检查覆盖率
npm run test:coverage
# ✅ Coverage: 92% statements

# 构建检查
npm run build
# ✅ Build successful
```

---

## 六、测试策略 / Testing Strategy

### 6.1 测试金字塔

```
                  /\
                 /  \
                / E2E \ ←── 10% (关键用户流程)
               /------\
              /        \
             / Integr.  \ ←── 20% (API + 数据库)
            /------------\
           /              \
          /      Unit       \ ←── 70% (业务逻辑)
         /------------------\
```

### 6.2 测试目录结构

```
tests/
├── unit/                      # 单元测试
│   ├── services/
│   │   ├── key-service.test.ts
│   │   ├── auth-service.test.ts
│   │   └── stats-service.test.ts
│   ├── lib/
│   │   ├── validation.test.ts
│   │   ├── jwt.test.ts
│   │   └── encryption.test.ts
│   └── utils/
│       └── helpers.test.ts
├── integration/               # 集成测试
│   ├── api/
│   │   ├── auth.test.ts
│   │   ├── keys.test.ts
│   │   └── stats.test.ts
│   └── database/
│       └── prisma.test.ts
├── e2e/                       # 端到端测试
│   ├── user-journey.test.ts
│   ├── key-lifecycle.test.ts
│   └── dashboard.test.ts
└── fixtures/                  # 测试数据
    ├── users.ts
    └── keys.ts
```

### 6.3 测试覆盖率要求

```bash
# 设置覆盖率阈值
# jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    './src/services/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
};
```

---

## 七、PR 模板 / Pull Request Template

### 7.1 PR 描述模板

创建 `.github/pull_request_template.md`:

```markdown
## 描述 / Description

简要描述此 PR 的目的和改动内容。

## 类型 / Type

- [ ] ✨ 新功能 (feat)
- [ ] 🐛 Bug 修复 (fix)
- [ ] 📝 文档更新 (docs)
- [ ] ♻️ 代码重构 (refactor)
- [ ] ⚡ 性能优化 (perf)
- [ ] ✅ 测试相关 (test)
- [ ] 🔧 构建/工具 (chore)

## 改动内容 / Changes

- 改动点 1
- 改动点 2
- 改动点 3

## 测试 / Testing

### 新增测试
- [ ] 单元测试: `tests/unit/xxx.test.ts`
- [ ] 集成测试: `tests/integration/xxx.test.ts`
- [ ] E2E 测试: `tests/e2e/xxx.test.ts`

### 测试结果
```
Tests: X passed, X total
Coverage: XX% statements
```

## TDD 流程 / TDD Process

- [ ] 🔴 RED: 编写失败的测试
- [ ] 🟢 GREEN: 实现功能让测试通过
- [ ] 🔵 REFACTOR: 重构代码优化

## Checklist

- [ ] 代码遵循项目规范
- [ ] 所有测试通过
- [ ] 测试覆盖率达标 (>80%)
- [ ] 无 console.log/error
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] CI 检查通过

## 关联 Issue / Related Issues

Closes #XX
```

---

## 八、Code Review 规范

### 8.1 Review Checklist

```markdown
## 代码质量
- [ ] 代码可读性良好
- [ ] 命名清晰有意义
- [ ] 函数职责单一
- [ ] 没有重复代码

## 测试
- [ ] 测试覆盖率达标
- [ ] 测试用例完整
- [ ] 测试描述清晰
- [ ] 边界情况已测试

## 安全性
- [ ] 无 SQL 注入风险
- [ ] 无 XSS 风险
- [ ] 敏感数据已加密
- [ ] 权限校验完整

## 性能
- [ ] 无 N+1 查询
- [ ] 适当的缓存策略
- [ ] 数据库索引合理
- [ ] 无内存泄漏

## 文档
- [ ] API 文档更新
- [ ] 复杂逻辑有注释
- [ ] README 已更新
```

### 8.2 Review 流程

```bash
# 1. Reviewer 拉取分支
git fetch origin
git checkout feature/keys-create
git pull origin feature/keys-create

# 2. 本地运行测试
npm test
npm run test:coverage

# 3. 检查代码
# - 使用 IDE 逐行审查
# - 关注关键路径和边界情况

# 4. 运行应用本地测试
npm run dev
# 手动测试关键功能

# 5. 提供反馈
# - 在 GitHub PR 页面添加评论
# - 使用 Request Changes / Approve

# 6. 作者修改后重新 Review
git pull origin feature/keys-create
npm test
# 确认修改后 Approve
```

---

## 九、持续集成配置 / CI Configuration

### 9.1 完整的 CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ========== Job 1: 代码检查 ==========
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier
        run: npm run format:check

  # ========== Job 2: 类型检查 ==========
  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

  # ========== Job 3: 单元测试 ==========
  unit-test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unit

  # ========== Job 4: 集成测试 ==========
  integration-test:
    name: Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: integration

  # ========== Job 5: E2E 测试 ==========
  e2e-test:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # ========== Job 6: 构建检查 ==========
  build:
    name: Build Check
    runs-on: ubuntu-latest
    needs: [lint, typecheck, unit-test]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Check build size
        run: |
          if [ $(du -sk .next | cut -f1) -gt 50000 ]; then
            echo "Build size exceeds 50MB"
            exit 1
          fi

  # ========== Job 7: 安全检查 ==========
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # ========== Job 8: 覆盖率检查 ==========
  coverage-check:
    name: Coverage Check
    runs-on: ubuntu-latest
    needs: [unit-test, integration-test]
    steps:
      - uses: actions/checkout@v3

      - name: Download coverage reports
        uses: actions/download-artifact@v3

      - name: Check coverage threshold
        run: |
          # 检查覆盖率是否达到 80%
          npm run test:coverage:check
```

### 9.2 Pre-commit Hooks

```bash
# 安装 husky
npm install -D husky lint-staged

# 初始化 husky
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

## 十、开发日常流程 / Daily Development Flow

### 10.1 开发者日常工作流

```bash
# ========== 早上开始工作 ==========

# 1. 更新 develop 分支
git checkout develop
git pull origin develop

# 2. 查看今日任务（从 GitHub Issues）
# Issue #42: 实现密钥过期提醒功能

# 3. 创建功能分支
git checkout -b feature/key-expiry-notification

# 4. 开始 TDD 开发
# 🔴 RED: 写测试
vim tests/unit/services/notification-service.test.ts
git add tests/
git commit -m "test: add key expiry notification test"

npm test
# ❌ 1 test failed

# 🟢 GREEN: 写实现
vim src/services/notification-service.ts
git add src/services/
git commit -m "feat: implement key expiry notification"

npm test
# ✅ 1 test passed

# 🔵 REFACTOR: 重构
vim src/services/notification-service.ts
git add src/services/
git commit -m "refactor: extract notification template logic"

npm test
# ✅ 1 test passed

# ========== 中午提交第一个 PR ==========

# 5. 推送分支
git push origin feature/key-expiry-notification

# 6. 创建 PR
# Title: feat: key expiry notification system
# Reviewers: @teammate1, @teammate2

# ========== 下午继续开发 ==========

# 7. 根据 Code Review 反馈修改
git add .
git commit -m "fix: address code review comments"
git push origin feature/key-expiry-notification

# 8. PR 被批准并合并
# GitHub 自动合并到 develop

# 9. 清理本地分支
git checkout develop
git pull origin develop
git branch -d feature/key-expiry-notification

# 10. 开始下一个任务
git checkout -b feature/next-task

# ========== 下班前 ==========

# 11. 提交未完成的工作（WIP）
git add .
git commit -m "wip: notification email template (in progress)"
git push origin feature/next-task

# 12. 更新任务状态
# GitHub Issues: 标记今日任务为 Done
```

### 10.2 团队协作最佳实践

```bash
# ========== 每日站会后 ==========

# 同步团队最新代码
git checkout develop
git pull origin develop

# 如果有冲突的功能分支，及时 rebase
git checkout feature/my-feature
git rebase develop

# ========== Code Review 时 ==========

# Review 同事的 PR
gh pr checkout 123
npm test
npm run dev
# 测试功能，提供反馈

# ========== 发现 Bug 时 ==========

# 紧急 Bug 修复流程
git checkout develop
git pull origin develop
git checkout -b fix/critical-auth-bug

# 🔴 写复现测试
git commit -m "test: add test to reproduce auth bug"

# 🟢 修复
git commit -m "fix: correct token validation logic"

# 快速 PR 和合并
git push origin fix/critical-auth-bug
# 创建 PR 标记为 "urgent"

# ========== 发布前 ==========

# 创建 release 分支
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 运行完整测试套件
npm run test:all
npm run build
npm run test:e2e

# 更新版本号
npm version minor
git push origin release/v1.0.0

# 合并到 main
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

---

## 十一、项目里程碑 / Project Milestones

### Milestone 1: MVP (最小可行产品) - Week 3

```bash
# Sprint 0-2 完成后的检查点

git checkout develop

# 1. 测试检查
npm run test:all
# ✅ 150 tests passed

# 2. 覆盖率检查
npm run test:coverage
# ✅ Coverage: 85%

# 3. 功能检查
# ✅ 用户注册/登录
# ✅ 密钥 CRUD
# ✅ CRS 集成
# ✅ 基础统计

# 4. 创建 release 分支
git checkout -b release/v0.1.0-mvp
npm version 0.1.0
git push origin release/v0.1.0-mvp

# 5. 部署到 staging 环境
# 手动测试所有功能

# 6. 合并到 main
git checkout main
git merge --no-ff release/v0.1.0-mvp
git tag -a v0.1.0-mvp -m "MVP Release"
git push origin main --tags
```

### Milestone 2: Feature Complete - Week 5

```bash
# Sprint 3-4 完成后

# ✅ 完整统计功能
# ✅ 安装指导页面
# ✅ 用户设置
# ✅ 暗色模式
# ✅ 响应式设计

git checkout -b release/v1.0.0
npm version 1.0.0
git push origin release/v1.0.0
```

---

## 十二、常见问题处理 / Troubleshooting

### 12.1 测试失败处理

```bash
# 测试失败时的调试流程

# 1. 查看失败的测试
npm test -- --verbose

# 2. 只运行失败的测试
npm test -- --testNamePattern="should create key"

# 3. 使用调试模式
node --inspect-brk node_modules/.bin/jest --runInBand

# 4. 查看覆盖率报告
npm run test:coverage
open coverage/lcov-report/index.html

# 5. 清理缓存后重试
npm run test:clear-cache
npm test
```

### 12.2 Git 冲突解决

```bash
# 功能分支与 develop 冲突

# 1. 更新 develop
git checkout develop
git pull origin develop

# 2. Rebase 功能分支
git checkout feature/my-feature
git rebase develop

# 3. 解决冲突
# 编辑冲突文件
git add .
git rebase --continue

# 4. 运行测试确保没有破坏
npm test

# 5. 强制推送（已经推送过的分支）
git push origin feature/my-feature --force-with-lease
```

### 12.3 回滚错误提交

```bash
# 回滚最后一次提交（未推送）
git reset HEAD~1

# 回滚最后一次提交（已推送）
git revert HEAD
git push origin feature/my-feature

# 回滚多个提交
git revert HEAD~3..HEAD
```

---

## 十三、总结与检查清单

### 13.1 每个功能完成检查清单

```markdown
## 功能开发完成检查清单

### 代码质量
- [ ] 所有文件遵循命名规范
- [ ] 代码格式化 (prettier)
- [ ] 无 ESLint 错误
- [ ] TypeScript 类型完整
- [ ] 无 console.log

### TDD 流程
- [ ] 🔴 测试先行 (test-first)
- [ ] 🟢 测试全部通过
- [ ] 🔵 代码已重构
- [ ] 覆盖率 > 80%

### Git 规范
- [ ] Commit 消息符合规范
- [ ] 每个 commit 功能独立
- [ ] 分支命名正确
- [ ] 无多余文件提交

### 文档
- [ ] API 文档更新
- [ ] README 更新（如需要）
- [ ] 代码注释充分
- [ ] PR 描述完整

### 测试
- [ ] 单元测试完整
- [ ] 集成测试覆盖
- [ ] 边界情况测试
- [ ] 错误情况测试

### 安全
- [ ] 输入验证完整
- [ ] 无安全漏洞
- [ ] 敏感数据加密
- [ ] 权限检查到位

### 性能
- [ ] 无 N+1 查询
- [ ] 合理使用缓存
- [ ] 数据库查询优化
- [ ] 无内存泄漏
```

### 13.2 Sprint 结束检查清单

```markdown
## Sprint 完成检查清单

### 开发完成
- [ ] 所有 Issue 已关闭
- [ ] 所有 PR 已合并
- [ ] develop 分支构建成功
- [ ] 无待修复的 critical bugs

### 测试完成
- [ ] 所有测试通过 (unit + integration + e2e)
- [ ] 覆盖率达标 (>80%)
- [ ] 性能测试通过
- [ ] 安全扫描通过

### 文档完成
- [ ] API 文档更新
- [ ] 用户文档更新
- [ ] CHANGELOG 更新
- [ ] 部署文档更新

### 部署准备
- [ ] Staging 环境部署成功
- [ ] 手动测试通过
- [ ] 性能监控配置
- [ ] 回滚方案准备
```

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-01
**维护者**: Claude Key Portal Team
