# Claude Key Portal 项目配置

# Claude Key Portal Project Configuration

> **项目**: Claude Key Portal - CRS 用户管理门户
> **配置级别**: 项目级 (最高优先级)
> **更新时间**: 2025-10-03

---

## 🎯 项目核心约束 / Core Project Constraints

### 铁律：CRS 依赖原则

```
Claude Key Portal = CRS 的用户管理门户

✅ 我们是 CRS 的界面层
✅ 我们代理 CRS Admin API
✅ 我们依赖 CRS 提供核心功能

❌ 我们不是密钥生成系统
❌ 我们不实现密钥逻辑
❌ 我们不是独立的 API 服务
```

### 职责边界强制执行

**必须本地实现**:

- ✅ 用户注册、登录、认证
- ✅ 用户信息管理
- ✅ 用户-密钥映射关系
- ✅ 本地扩展功能（备注、标签、收藏）
- ✅ 数据可视化和图表
- ✅ 安装指导和配置生成

**必须代理 CRS**:

- ✅ 密钥创建（调用 CRS Admin API）
- ✅ 密钥更新（调用 CRS Admin API）
- ✅ 密钥删除（调用 CRS Admin API）
- ✅ 使用统计（从 CRS 获取数据）
- ✅ 密钥状态（从 CRS 获取状态）

**严禁实现**:

- ❌ 密钥生成算法
- ❌ 密钥验证逻辑
- ❌ API 请求中转
- ❌ 使用量计算
- ❌ 速率限制实施
- ❌ Claude API 直接调用

---

## 📚 开发上下文引用 / Development Context Reference

### 核心文档必读

开始任何开发工作前，必须参考以下文档：

1. **项目定位和背景**

   ```
   阅读: PROJECT_CORE_DOCS/01_项目背景.md
   目的: 理解项目是什么，为什么做这个项目
   关键: 我们是 CRS 的用户门户，不是独立服务
   ```

2. **功能需求和边界**

   ```
   阅读: PROJECT_CORE_DOCS/02_功能需求和边界.md
   目的: 明确做什么，不做什么
   关键: Portal vs CRS 的职责划分
   ```

3. **CRS 集成规范**

   ```
   阅读: API_MAPPING_SPECIFICATION.md
   目的: 了解如何与 CRS 交互
   关键:
   - Section 2.4: 统计数据接口（代理）
   - CRS Admin API 端点列表
   - 数据流动模式
   ```

4. **数据库设计**

   ```
   阅读: DATABASE_SCHEMA.md
   目的: 理解数据模型
   关键:
   - User 表（本地用户）
   - ApiKey 表（CRS 映射）
   - 本地扩展字段
   ```

5. **TDD 工作流**
   ```
   阅读: TDD_GIT_WORKFLOW.md
   目的: 遵循开发流程
   关键: 🔴 RED → 🟢 GREEN → 🔵 REFACTOR
   ```

6. **🆕 DDD + TDD + Git 综合开发标准** ⭐ 最重要！
   ```
   阅读: DDD_TDD_GIT_STANDARD.md
   目的: 理解项目的完整开发标准和架构设计
   关键:
   - DDD Lite 分层架构（domain/application/infrastructure）
   - TDD 强制执行流程（🔴 RED → 🟢 GREEN → 🔵 REFACTOR）
   - Git 提交规范（与TDD结合）
   - Result模式和错误处理
   - 完整工作流示例

   **必读原因**:
   - 定义了整个项目的架构分层
   - 规定了严格的TDD开发流程
   - 提供了Git提交和PR规范
   - 解决了当前84.3%测试失败的根本问题
   ```

### HTML 原型参考

所有页面开发参考 `prototypes/` 目录：

```
prototypes/
├── index.html          # 首页布局和导航
├── login.html          # 登录表单和验证
├── register.html       # 注册流程
├── dashboard.html      # 仪表板布局和图表
├── keys.html           # 密钥列表和操作
├── install.html        # 安装指导（多平台）
├── usage.html          # 使用统计（CRS 集成设计）⭐
└── settings.html       # 用户设置
```

**重要**: `usage.html` 标注了所有 CRS 集成点，开发时必须参考！

---

## 🔧 开发规范约束 / Development Standards

### ⚠️ 首要规范：必须遵循 DDD_TDD_GIT_STANDARD.md

**铁律**: 开始任何开发工作前，必须完整阅读并遵循 `DDD_TDD_GIT_STANDARD.md`

**核心要求**:
```
1. 架构分层 (DDD Lite):
   - 表现层 (app/) - HTTP处理
   - 应用层 (lib/application/) - 流程编排  ⭐ 新增
   - 领域层 (lib/domain/) - 业务逻辑      ⭐ 新增
   - 基础设施层 (lib/infrastructure/) - 技术实现

2. TDD强制执行:
   🔴 RED: 先写测试（必须失败）
   🟢 GREEN: 实现功能（让测试通过）
   🔵 REFACTOR: 重构优化（保持测试通过）

3. Git提交规范:
   type(scope): subject (🔴 RED|🟢 GREEN|🔵 REFACTOR)
   示例: feat(key): implement monthly limit (🟢 GREEN)

4. 质量标准:
   - 测试覆盖率 > 80% (应用层>90%, 领域层>95%)
   - 所有测试必须通过
   - TypeScript无错误
   - ESLint通过
```

**违反后果**:
- ❌ PR不允许合并
- ❌ Pre-commit Hook阻止提交
- ❌ CI构建失败

详见: `DDD_TDD_GIT_STANDARD.md` (1,246行完整标准)

---

### TDD + 集成验证 强制执行（混合方案）

**项目决策**: 所有涉及CRS的功能，必须采用混合测试方案

```bash
开发阶段 (Day 1-4):
# 1. 🔴 RED: 先写测试（Mock CRS）
git commit -m "test: add key management tests (🔴 RED)"

# 2. 🟢 GREEN: 再写实现
git commit -m "feat: implement key management (🟢 GREEN)"

# 3. 🔵 REFACTOR: 重构优化
git commit -m "refactor: extract utilities (🔵 REFACTOR)"

集成验证阶段 (Day 5): ← 强制执行！
# 4. ✅ 运行CRS集成测试
npx tsx scripts/test-crs-xxx.ts

# 5. 🔧 修复问题（如果有）
git commit -m "fix: adjust API format to match CRS"

# 6. 📝 记录测试结果
更新 docs/INTEGRATION_TEST_LOG.md
```

**铁律**:
- ✅ TDD开发使用Mock保持快速迭代
- ✅ 功能完成后必须进行CRS集成验证
- ✅ 集成测试通过才能合并到develop
- ❌ 不允许跳过集成验证环节

详见: `docs/CRS_INTEGRATION_STANDARD.md`

### CRS 集成规范

所有与 CRS 交互的代码必须：

1. **使用 Circuit Breaker 模式**

   ```typescript
   import { crsClient } from '@/lib/crs-client'

   try {
     const result = await crsClient.createKey(data)
   } catch (error) {
     // 降级处理
     if (error.code === 'CRS_UNAVAILABLE') {
       // 返回缓存数据或友好提示
     }
   }
   ```

2. **实现超时和重试**

   ```typescript
   const result = await crsClient.createKey(data, {
     timeout: 5000, // 5秒超时
     retries: 2, // 重试2次
     fallback: 'cached', // 失败时使用缓存
   })
   ```

3. **缓存 CRS 响应**
   ```typescript
   // 缓存统计数据 1 分钟
   const stats = await getCachedCrsStats(userId, {
     ttl: 60,
     key: `crs:stats:${userId}`,
   })
   ```

### 测试覆盖率要求

```typescript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  './lib/services/': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },
}
```

**覆盖率不达标的 PR 不允许合并！**

### Git Commit 规范（与TDD结合）

**格式**: `<type>(<scope>): <subject> (<tdd-phase>)`

```
type: test, feat, fix, refactor, docs, style, perf, chore
scope: user, key, stats, auth, infra (对应领域层)
tdd-phase: 🔴 RED | 🟢 GREEN | 🔵 REFACTOR (必须标记！)

TDD示例:
test(key): add monthly limit validation test (🔴 RED)
feat(key): implement monthly limit field (🟢 GREEN)
refactor(key): extract validation logic (🔵 REFACTOR)

非TDD示例:
fix(key): correct password field name to passwordHash
docs(core): update API mapping specification
chore(infra): configure pre-commit hooks
```

**Pre-commit Hook验证**:
- ✅ TDD相关commit必须包含phase标记
- ✅ 所有测试必须通过
- ✅ 测试覆盖率 > 80%
- ✅ TypeScript类型检查通过
- ✅ ESLint检查通过

详见: `DDD_TDD_GIT_STANDARD.md` Section "Git工作流规范"

---

## 🚨 错误处理规范 / Error Handling Standards

### CRS 错误处理

```typescript
// lib/crs-client.ts
class CrsClient {
  private token: string | null = null
  private tokenExpiry: number = 0

  async ensureAuthenticated(): Promise<string> {
    // 检查token是否有效
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    // 自动登录获取新token
    const response = await fetch(`${process.env.CRS_BASE_URL}/web/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.CRS_ADMIN_USERNAME,
        password: process.env.CRS_ADMIN_PASSWORD,
      }),
    })

    const { success, token, expiresIn } = await response.json()
    if (!success) {
      throw new Error('CRS authentication failed')
    }

    this.token = token
    // 提前1分钟刷新token，避免在请求时过期
    this.tokenExpiry = Date.now() + (expiresIn - 60000)
    return token
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const token = await this.ensureAuthenticated()

      const response = await fetch(
        `${process.env.CRS_BASE_URL}/admin${endpoint}`,
        {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          signal: AbortSignal.timeout(5000), // 5秒超时
        }
      )

      if (!response.ok) {
        // 401说明token失效，清除缓存并递归重试
        if (response.status === 401) {
          this.token = null
          return this.request(endpoint, options)
        }
        throw new CrsApiError(response.status, await response.text())
      }

      const data = await response.json()
      return data.data // CRS响应格式: { success: true, data: {...} }
    } catch (error) {
      if (error instanceof CrsApiError) {
        throw error
      }

      // 超时或网络错误
      throw new CrsUnavailableError('CRS service is temporarily unavailable')
    }
  }
}

export const crsClient = new CrsClient()

// 使用示例
try {
  const key = await crsClient.createKey(data)
} catch (error) {
  if (error instanceof CrsUnavailableError) {
    // 返回友好提示
    return NextResponse.json(
      {
        error: 'CRS服务暂时不可用，请稍后重试',
        fallback: true,
      },
      { status: 503 }
    )
  }

  if (error instanceof CrsApiError) {
    // CRS 返回的业务错误
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  throw error
}
```

### 用户友好的错误提示

```typescript
// 错误提示映射
const ERROR_MESSAGES = {
  // CRS 错误
  CRS_UNAVAILABLE: 'CRS服务暂时不可用，请稍后重试',
  CRS_TIMEOUT: 'CRS服务响应超时，请稍后重试',
  CRS_KEY_EXISTS: '密钥名称已存在，请使用其他名称',
  CRS_RATE_LIMITED: '操作过于频繁，请稍后再试',

  // 认证错误
  INVALID_CREDENTIALS: '邮箱或密码错误',
  EMAIL_EXISTS: '该邮箱已被注册',
  WEAK_PASSWORD:
    '密码强度不够，请使用至少8位字符，包含大小写字母、数字和特殊符号',

  // 权限错误
  UNAUTHORIZED: '请先登录',
  FORBIDDEN: '无权访问此资源',

  // 数据错误
  NOT_FOUND: '资源不存在',
  VALIDATION_ERROR: '输入数据不合法',

  // 系统错误
  INTERNAL_ERROR: '系统错误，请稍后重试',
  DATABASE_ERROR: '数据库错误，请联系管理员',
}
```

---

## 🎨 UI/UX 规范 / UI/UX Standards

### 设计系统参考

```
参考文档: UI_DESIGN_SPECIFICATION.md

颜色规范:
- Primary: Blue 600 (#2563EB)
- Success: Green 600 (#16A34A)
- Warning: Amber 600 (#D97706)
- Error: Red 600 (#DC2626)

组件库: Shadcn/ui
- 使用已安装的组件
- 保持设计一致性
- 遵循 Tailwind CSS 类名规范
```

### 加载状态

所有 CRS API 调用必须显示加载状态：

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CreateKeyButton() {
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      await createKey(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleCreate} disabled={loading}>
      {loading ? '创建中...' : '创建密钥'}
    </Button>
  )
}
```

### 错误提示

使用 Toast 组件显示操作结果：

```typescript
import { toast } from '@/components/ui/use-toast'

// 成功
toast({
  title: '密钥创建成功',
  description: '密钥已添加到列表',
})

// 错误
toast({
  title: '创建失败',
  description: ERROR_MESSAGES.CRS_UNAVAILABLE,
  variant: 'destructive',
})
```

---

## 📊 性能优化规范 / Performance Standards

### 数据库查询优化

```typescript
// ✅ 好的实践 - 使用索引和 select
const user = await prisma.user.findUnique({
  where: { email },
  select: { id: true, email: true, nickname: true },
})

// ✅ 批量查询
const keys = await prisma.apiKey.findMany({
  where: { userId },
  include: { user: { select: { nickname: true } } },
})

// ❌ 避免 N+1 查询
// 不要在循环中查询数据库
```

### CRS 响应缓存

```typescript
import { redis } from '@/lib/redis'

async function getCrsStats(userId: string) {
  // 1. 尝试从缓存获取
  const cached = await redis.get(`stats:${userId}`)
  if (cached) {
    return JSON.parse(cached)
  }

  // 2. 从 CRS 获取
  const stats = await crsClient.getStats(userId)

  // 3. 缓存 1 分钟
  await redis.setex(`stats:${userId}`, 60, JSON.stringify(stats))

  return stats
}
```

### React Query 使用

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'

export function useKeys() {
  return useQuery({
    queryKey: ['keys'],
    queryFn: async () => {
      const response = await fetch('/api/keys')
      return response.json()
    },
    staleTime: 60 * 1000, // 1分钟内数据视为新鲜
    cacheTime: 5 * 60 * 1000, // 缓存5分钟
    refetchOnWindowFocus: true,
  })
}
```

---

## 🔒 安全规范 / Security Standards

### 密码处理

```typescript
import bcrypt from 'bcrypt'

// ✅ 加密密码
const hashedPassword = await bcrypt.hash(password, 10)

// ✅ 验证密码
const isValid = await bcrypt.compare(password, hashedPassword)

// ❌ 不要明文存储密码
// ❌ 不要在日志中输出密码
```

### JWT 令牌

```typescript
import jwt from 'jsonwebtoken'

// ✅ 生成 Token
const token = jwt.sign({ userId, email }, process.env.JWT_SECRET!, {
  expiresIn: '24h',
})

// ✅ 验证 Token
const decoded = jwt.verify(token, process.env.JWT_SECRET!)

// ⚠️ 不要在 Token 中存储敏感信息
// ⚠️ 不要使用弱密钥
```

### 输入验证

```typescript
import { z } from 'zod'

// ✅ 使用 Zod 验证所有输入
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const validatedData = schema.parse(body)

// ❌ 不要信任用户输入
// ❌ 不要跳过验证
```

---

## 🏗️ 项目架构规范 / Architecture Standards

### DDD Lite 分层架构（强制执行）

**新的目录结构**:
```
lib/
├── domain/                   # 📦 领域层（业务逻辑）
│   ├── user/                 # 用户领域
│   │   ├── user.entity.ts        # 用户实体
│   │   ├── user.types.ts         # 用户类型
│   │   └── user.validation.ts    # 用户验证
│   ├── key/                  # 密钥领域
│   │   ├── key.entity.ts
│   │   ├── key.types.ts
│   │   └── key.validation.ts
│   └── shared/               # 共享领域对象
│       ├── result.ts             # Result模式（统一错误处理）
│       └── errors.ts
│
├── application/              # 🎯 应用层（流程编排）
│   ├── user/
│   │   ├── register.usecase.ts
│   │   ├── login.usecase.ts
│   │   └── update-profile.usecase.ts
│   └── key/
│       ├── create-key.usecase.ts
│       ├── list-keys.usecase.ts
│       └── delete-key.usecase.ts
│
├── infrastructure/           # 🔌 基础设施层（技术实现）
│   ├── persistence/
│   │   ├── prisma.ts
│   │   └── repositories/
│   │       ├── user.repository.ts
│   │       ├── key.repository.ts
│   │       └── stats.repository.ts
│   ├── external/
│   │   ├── crs-client.ts
│   │   ├── email/
│   │   └── webhook/
│   └── cache/
│       └── redis.ts
│
└── utils/                    # 工具函数（保持现状）
```

**层次职责**:
- **表现层** (app/) - 只处理HTTP请求/响应
- **应用层** (lib/application/) - 编排业务流程，协调领域和基础设施
- **领域层** (lib/domain/) - 核心业务逻辑和规则
- **基础设施层** (lib/infrastructure/) - 技术实现和外部服务

**Result模式（必须使用）**:
```typescript
// lib/domain/shared/result.ts
export class Result<T> {
  public readonly isSuccess: boolean
  public readonly value?: T
  public readonly error?: Error

  static ok<U>(value: U): Result<U>
  static fail<U>(error: string | Error): Result<U>
}

// 使用示例
const result = await createKeyUseCase.execute(input)
if (result.isSuccess) {
  return NextResponse.json(result.value, { status: 201 })
} else {
  return NextResponse.json(
    { error: result.error.message },
    { status: 500 }
  )
}
```

详见: `DDD_TDD_GIT_STANDARD.md` Section "DDD Lite方案"

---

## 📝 文档维护规范 / Documentation Standards

### 代码注释

```typescript
/**
 * 创建新的 API 密钥
 *
 * 此函数调用 CRS Admin API 创建密钥，然后在本地创建映射关系
 *
 * @param userId - 用户 ID
 * @param data - 密钥创建数据
 * @returns 创建的密钥信息
 * @throws {CrsUnavailableError} CRS 服务不可用
 * @throws {CrsApiError} CRS 返回错误
 */
export async function createKey(userId: string, data: CreateKeyInput) {
  // 1. 调用 CRS API 创建密钥
  const crsKey = await crsClient.createKey(data)

  // 2. 创建本地映射关系
  const localKey = await prisma.apiKey.create({
    data: {
      userId,
      crsKeyId: crsKey.id,
      crsKey: crsKey.key,
      name: data.name,
    },
  })

  return localKey
}
```

### API 文档

所有 API 端点必须在 `API_MAPPING_SPECIFICATION.md` 中记录：

```markdown
### POST /api/keys

创建新的 API 密钥（代理 CRS）

**请求**:
\`\`\`typescript
{
name: string;
description?: string;
rateLimit?: number;
}
\`\`\`

**响应**:
\`\`\`typescript
{
id: string;
key: string;
name: string;
createdAt: string;
}
\`\`\`

**错误**:

- 400: 输入验证失败
- 503: CRS 服务不可用
```

---

## 🚀 部署规范 / Deployment Standards

### 环境变量

```bash
# 开发环境 (.env.local)
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
CRS_BASE_URL=https://claude.just-play.fun
CRS_ADMIN_USERNAME=cr_admin_4ce18cd2
CRS_ADMIN_PASSWORD=HCTBMoiK3PZD0eDC
JWT_SECRET=dev_secret_xxx
NODE_ENV=development

# 生产环境 (.env.production)
DATABASE_URL=postgresql://prod...
REDIS_URL=redis://prod...
CRS_BASE_URL=https://claude.just-play.fun
CRS_ADMIN_USERNAME=cr_admin_4ce18cd2
CRS_ADMIN_PASSWORD=HCTBMoiK3PZD0eDC
JWT_SECRET=prod_secret_xxx
NODE_ENV=production
```

**⚠️ 不要提交 .env 文件到 Git！**

### 部署平台策略

**主要方案**: **Vercel** (生产环境)

- ✅ Next.js 官方平台，零配置部署
- ✅ 原生支持 Prisma ORM（直连 PostgreSQL）
- ✅ 免费额度充足（100 GB 带宽/月，足够1000+用户使用）
- ✅ 自动 HTTPS、CDN、Preview 部署
- ✅ 最佳开发体验（Git 集成、实时日志）

**备选方案**: **Docker 自托管** (可选)

- 仅在 Vercel 免费额度不足时考虑
- 项目已配置 Docker 支持（`Dockerfile`、`docker-compose.yml`）
- 适合企业内网部署或需要完全控制的场景

**不推荐**: **Cloudflare Pages**

- ❌ Workers 不支持 TCP 连接，Prisma 需要 Data Proxy（$25/月额外成本）
- ❌ 需要重写大量代码（340+ 小时工作量）
- 详见: [部署平台分析](./DEPLOYMENT_PLATFORM_ANALYSIS.md)

---

## 🎯 开发检查清单 / Development Checklist

### 开发前检查（强制）

```markdown
- [ ] ✅ 已阅读 DDD_TDD_GIT_STANDARD.md
- [ ] ✅ 理解分层架构（domain/application/infrastructure）
- [ ] ✅ 理解TDD流程（🔴 RED → 🟢 GREEN → 🔵 REFACTOR）
- [ ] ✅ 理解Git提交规范（必须包含TDD phase标记）
- [ ] ✅ 创建了feature分支
- [ ] ✅ 准备先写测试（RED阶段）
```

### 编码中检查

```markdown
- [ ] ✅ 代码放在正确的分层
  - [ ] 业务逻辑在领域层 (lib/domain/)
  - [ ] 流程编排在应用层 (lib/application/)
  - [ ] HTTP处理在表现层 (app/)
  - [ ] 技术细节在基础设施层 (lib/infrastructure/)
- [ ] ✅ 使用Result模式处理错误
- [ ] ✅ TDD流程正确执行
  - [ ] 🔴 测试先行（测试必须先失败）
  - [ ] 🟢 实现通过（写最少代码让测试通过）
  - [ ] 🔵 重构优化（保持测试通过）
- [ ] ✅ Commit message包含TDD phase标记
```

### 每个功能完成前

```markdown
- [ ] ✅ TDD 流程完整 (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)
- [ ] ✅ 测试覆盖率 > 80% (应用层>90%, 领域层>95%)
- [ ] ✅ 所有测试通过
- [ ] ✅ TypeScript 类型完整
- [ ] ✅ ESLint 无错误
- [ ] ✅ Prettier 格式化
- [ ] ✅ 错误处理使用Result模式
- [ ] ✅ 加载状态显示
- [ ] ✅ 用户提示友好
- [ ] ✅ 代码注释充分
- [ ] ✅ Git commit 规范（包含TDD phase）
- [ ] ✅ PR 描述完整
```

### CRS 集成功能额外检查

```markdown
- [ ] ✅ Circuit Breaker 实现
- [ ] ✅ 超时处理
- [ ] ✅ 重试机制
- [ ] ✅ 降级策略
- [ ] ✅ 错误提示友好
- [ ] ✅ 响应缓存
- [ ] ✅ 数据同步逻辑正确
```

---

## 🤝 AI 协作指令 / AI Collaboration Rules

### Claude (主控) 的职责

1. **项目架构和规划**
   - 设计系统架构
   - 制定开发计划
   - 质量把控

2. **核心功能开发**
   - 用户认证系统
   - CRS 集成逻辑
   - 数据库设计

3. **代码审查**
   - 检查 TDD 流程
   - 审查 CRS 集成
   - 验证测试覆盖率

### 触发 GPT-5 修复的场景

```
触发词: "修复", "debug", "错误", "语法", "类型", "测试失败", "构建失败"

示例:
- "测试失败，帮我修复"
- "CRS 集成有 bug"
- "TypeScript 类型错误"

行为: 自动调用 general-purpose 子代理进行修复
```

### 触发 Gemini 协作的场景

```
触发词: "协作", "讨论", "审核", "前端", "UI", "用户体验"

示例:
- "与 Gemini 讨论 UI 设计"
- "需要前端架构审核"

行为: 启动 AI 多轮协作流程
```

---

## 📋 重要提醒 / Important Reminders

### 永远记住

1. **我们是 CRS 的用户门户** - 不是独立服务
2. **密钥管理代理 CRS** - 不要实现密钥逻辑
3. **TDD 是强制性的** - 不允许跳过测试
4. **CRS 可能故障** - 必须实现容错机制
5. **用户体验优先** - 错误提示要友好
6. **安全第一** - 验证所有输入

### 禁止事项

```
❌ 不要实现密钥生成算法
❌ 不要跳过 TDD 流程
❌ 不要直接调用 Claude API
❌ 不要明文存储密码
❌ 不要忽略 CRS 错误处理
❌ 不要合并未审查的代码
❌ 不要提交 .env 文件
❌ 不要删除测试
```

---

## 📞 参考资源 / Reference Resources

### 核心文档

- `PROJECT_CORE_DOCS/` - 项目核心文档
- `API_MAPPING_SPECIFICATION.md` - API 规范
- `DATABASE_SCHEMA.md` - 数据库设计
- `TDD_GIT_WORKFLOW.md` - 开发工作流
- `prototypes/` - HTML 原型参考

### 外部资源

- **CRS 部署地址**: https://claude.just-play.fun
- **CRS Admin 后台**: https://claude.just-play.fun/admin-next (Web UI)
- **CRS Admin 登录页**: https://claude.just-play.fun/admin-next/login
- **CRS 管理员凭据**:
  - 用户名: `cr_admin_4ce18cd2`
  - 密码: `HCTBMoiK3PZD0eDC`
- **CRS 源码**: https://github.com/Wei-Shaw/claude-relay-service

**API 架构** (已验证):

- 认证API: `POST /web/auth/login` - 管理员登录获取token
- Admin API基础路径: `/admin` (不是 `/admin-next`)

**主要 API 端点**:

- `POST /web/auth/login` - 管理员登录
- `GET /admin/api-keys` - 获取密钥列表
- `POST /admin/api-keys` - 创建密钥
- `PUT /admin/api-keys/:id` - 更新密钥
- `DELETE /admin/api-keys/:id` - 删除密钥
- `GET /admin/dashboard` - 获取仪表板数据
- `GET /admin/api-keys-usage-trend` - 获取使用趋势
- `GET /admin/api-keys/:id/stats` - 获取密钥统计

详见: `CRS_API_VERIFICATION.md`

---

---

## 📖 核心文档索引 / Core Documentation Index

**必读文档（优先级从高到低）**:

1. **DDD_TDD_GIT_STANDARD.md** ⭐⭐⭐ - 综合开发标准（最重要！）
2. **PROJECT_CORE_DOCS/01_项目背景.md** - 项目定位
3. **PROJECT_CORE_DOCS/02_功能需求和边界.md** - 需求边界
4. **API_MAPPING_SPECIFICATION.md** - API规范
5. **DATABASE_SCHEMA.md** - 数据模型
6. **TDD_GIT_WORKFLOW.md** - TDD详细流程
7. **CRS_INTEGRATION_STANDARD.md** - CRS集成标准

**架构文档**:
- **DDD_TDD_GIT_STANDARD.md** - 完整分层架构设计
- **UI_DESIGN_SPECIFICATION.md** - UI/UX设计系统
- **COMPONENT_LIBRARY.md** - 组件库文档

**部署文档**:
- **DEPLOYMENT_PLATFORM_ANALYSIS.md** - 平台选型分析
- **PRODUCTION_ENVIRONMENT_SETUP.md** - 生产环境配置

**开发工具**:
- **PROJECT_STRUCTURE_ANALYSIS.md** - 目录结构分析
- **prototypes/** - HTML原型参考

---

**配置版本**: v2.0
**创建时间**: 2025-10-03
**最后更新**: 2025-10-06 (添加DDD+TDD+Git标准)
**维护者**: Claude Key Portal Team
**下次更新**: 标准执行1个月后评估

---

_"清晰的标准 + 严格的执行 = 项目成功的保障！"_
