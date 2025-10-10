# 可复用开发标准
## 提炼自 Claude Key Portal 项目

**创建日期**: 2025-10-10
**版本**: v1.0
**目的**: 为下一个项目提供标准化的开发规范和模板
**来源**: Claude Key Portal 项目实战总结

---

## 📋 目录

1. [核心原则](#核心原则)
2. [项目初始化](#项目初始化)
3. [架构标准](#架构标准)
4. [开发流程](#开发流程)
5. [代码质量](#代码质量)
6. [文档规范](#文档规范)
7. [标准模板](#标准模板)

---

## 🎯 核心原则

### 1. YAGNI原则 ⭐⭐⭐

**You Aren't Gonna Need It** - 你不会需要它

```
❌ 错误思维：
"可能未来需要..."
"提前设计好架构..."
"先把基础设施搭建好..."

✅ 正确思维：
"现在需要什么功能？"
"MVP需要哪些特性？"
"能否用最简单的方式实现？"
```

**实战教训**:
- Claude Key Portal删除了30%+的过度设计代码
- Cron Jobs、Monitoring、Notification等P2-P3功能应该在需要时才实现

### 2. 优先级驱动开发

```
P0 (MVP) → 必须有，不能发布没有的功能
P1 (V1.0) → 应该有，提升用户体验
P2 (V1.5) → 可以有，锦上添花
P3 (V2.0) → 未来有，长期规划

铁律：P0未完成100%，不考虑P1
```

### 3. 明确项目边界 ⭐⭐⭐

**开发前必须回答**:

1. **我们是什么？** - 项目定位
2. **我们做什么？** - 核心功能
3. **我们不做什么？** - 明确边界
4. **依赖什么？** - 外部服务

**示例（Claude Key Portal）**:
```
定位：CRS用户管理门户（不是密钥生成系统）

我们做：
✅ 用户管理（本地）
✅ 界面展示（本地）
✅ 本地扩展功能
✅ 调用CRS API（代理）

我们不做：
❌ 密钥生成（CRS负责）
❌ 密钥验证（CRS负责）
❌ API中转（CRS负责）

铁律：外部服务已实现的功能，直接调用，不要重新实现
```

---

## 🚀 项目初始化

### 1. 目录结构

```bash
# 创建标准目录
mkdir -p PROJECT_CORE_DOCS
mkdir -p docs/{core,development,deployment,reference}
mkdir -p prototypes
mkdir -p lib/{domain,application,infrastructure}
mkdir -p tests/{unit,integration,e2e}

# 创建核心文档
touch PROJECT_CORE_DOCS/01_项目背景.md
touch PROJECT_CORE_DOCS/02_功能需求和边界.md
touch PROJECT_CORE_DOCS/03_发展路线图.md
touch CLAUDE.md
touch README.md
```

### 2. Git初始化

```bash
# 初始化Git
git init
git branch -M main

# 配置Git Flow
git checkout -b develop

# 配置Husky
npx husky init
```

### 3. 依赖安装

```bash
# TypeScript + Next.js
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/node

# 测试工具
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @jest/globals

# 代码质量
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
npm install -D husky lint-staged

# Commit规范
npm install -D @commitlint/cli @commitlint/config-conventional
```

---

## 🏗️ 架构标准

### 1. DDD Lite分层架构 ⭐⭐⭐

```
lib/
├── domain/              # 📦 领域层（业务逻辑）
│   ├── user/
│   │   ├── user.entity.ts
│   │   ├── user.types.ts
│   │   └── user.validation.ts
│   ├── [domain]/
│   └── shared/
│       ├── result.ts
│       └── errors.ts
│
├── application/         # 🎯 应用层（流程编排）
│   ├── user/
│   │   ├── register.usecase.ts
│   │   ├── login.usecase.ts
│   │   └── update-profile.usecase.ts
│   └── [domain]/
│
└── infrastructure/      # 🔌 基础设施层（技术实现）
    ├── auth/
    ├── cache/
    ├── external/
    └── persistence/
        └── repositories/
```

**层次职责**:
- **表现层** (app/) - HTTP请求/响应处理
- **应用层** (lib/application/) - 业务流程编排
- **领域层** (lib/domain/) - 核心业务逻辑
- **基础设施层** (lib/infrastructure/) - 技术实现

### 2. Repository模式

```typescript
// 接口定义（domain层）
interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: CreateUserData): Promise<User>
  update(id: string, data: UpdateUserData): Promise<User>
  delete(id: string): Promise<void>
}

// 实现（infrastructure层）
class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } })
  }
}
```

### 3. Result模式（统一错误处理）

```typescript
// lib/domain/shared/result.ts
export class Result<T> {
  public readonly isSuccess: boolean
  public readonly value?: T
  public readonly error?: Error

  private constructor(isSuccess: boolean, value?: T, error?: Error) {
    this.isSuccess = isSuccess
    this.value = value
    this.error = error
  }

  static ok<U>(value: U): Result<U> {
    return new Result<U>(true, value)
  }

  static fail<U>(error: string | Error): Result<U> {
    const err = typeof error === 'string' ? new Error(error) : error
    return new Result<U>(false, undefined, err)
  }
}

// 使用示例
const result = await createUserUseCase.execute(input)
if (result.isSuccess) {
  return NextResponse.json(result.value, { status: 201 })
} else {
  return NextResponse.json({ error: result.error.message }, { status: 500 })
}
```

---

## 🔄 开发流程

### 1. TDD强制执行 ⭐⭐⭐

```bash
# 🔴 RED: 先写测试（必须失败）
# 1. 创建测试文件
touch lib/application/user/__tests__/register.usecase.test.ts

# 2. 写测试
# [测试代码]

# 3. 运行测试（必须失败）
npm test

# 4. 提交
git add .
git commit -m "test(user): add user registration validation test (🔴 RED)"

# 🟢 GREEN: 写实现（让测试通过）
# 1. 实现功能
touch lib/application/user/register.usecase.ts

# 2. 运行测试（必须通过）
npm test

# 3. 提交
git commit -am "feat(user): implement user registration (🟢 GREEN)"

# 🔵 REFACTOR: 重构优化（保持测试通过）
# 1. 优化代码
# [重构代码]

# 2. 运行测试（必须通过）
npm test

# 3. 提交
git commit -am "refactor(user): extract validation logic (🔵 REFACTOR)"
```

### 2. Git Commit规范

```bash
格式：<type>(<scope>): <subject> (<tdd-phase>)

type:
- test: 测试
- feat: 新功能
- fix: 修复
- refactor: 重构
- docs: 文档
- style: 格式
- perf: 性能
- chore: 杂项

scope: user, auth, key, stats, infra

tdd-phase（TDD相关commit必须）:
- 🔴 RED
- 🟢 GREEN
- 🔵 REFACTOR

示例：
test(user): add email validation test (🔴 RED)
feat(user): implement email validation (🟢 GREEN)
refactor(user): extract email regex constant (🔵 REFACTOR)
fix(auth): correct JWT expiration time
docs(api): update API endpoints documentation
```

### 3. Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh

# 运行测试
npm test || exit 1

# 类型检查
npm run type-check || exit 1

# 代码规范
npm run lint || exit 1

# 检查覆盖率
npm run test:coverage || exit 1

# 验证Commit Message
npx commitlint --edit $1 || exit 1
```

### 4. 混合测试方案

```
开发阶段（Day 1-4）:
├── TDD快速迭代（使用Mock）
│   ├── 🔴 RED: 写测试
│   ├── 🟢 GREEN: 写实现
│   └── 🔵 REFACTOR: 优化
│
集成验证阶段（Day 5）:
└── 真实环境测试
    ├── ✅ 运行集成测试脚本
    ├── 🔧 修复问题
    └── 📝 记录测试结果

铁律：集成测试通过才能合并到develop
```

---

## 💻 代码质量

### 1. TypeScript严格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2. ESLint配置

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 3. 测试覆盖率要求

```json
// jest.config.js
coverageThreshold: {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  },
  './lib/application/': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90
  },
  './lib/domain/': {
    statements: 95,
    branches: 90,
    functions: 95,
    lines: 95
  }
}
```

### 4. 命名规范

```typescript
// ✅ 好的命名
const userRepository = new UserRepository()  // 实例用camelCase
class UserRepository { }  // 类名用PascalCase
interface IUserRepository { }  // 接口用I前缀
type UserStatus = 'active' | 'inactive'  // 类型用PascalCase
const MAX_RETRY_COUNT = 3  // 常量用UPPER_CASE

// 文件命名
user.entity.ts        // 实体
user.repository.ts    // 仓储
user.usecase.ts       // 用例
user.types.ts         // 类型定义
user.test.ts          // 测试文件
```

---

## 📚 文档规范

### 1. 项目核心文档（必须）

```markdown
PROJECT_CORE_DOCS/
├── 01_项目背景.md
│   ├── 为什么做这个项目？
│   ├── 解决什么问题？
│   └── 核心价值是什么？
│
├── 02_功能需求和边界.md
│   ├── 做什么？（功能列表+优先级）
│   ├── 不做什么？（明确边界）
│   └── 依赖什么？（外部服务）
│
└── 03_发展路线图.md
    ├── MVP（P0）
    ├── V1.0（P1）
    ├── V1.5（P2）
    └── V2.0（P3）
```

### 2. CLAUDE.md配置

```markdown
# [项目名称] 项目配置

## 🎯 项目核心约束

### 铁律：项目定位和边界
[明确定义项目是什么，不是什么]

## 📚 开发上下文引用

### 核心文档必读
1. PROJECT_CORE_DOCS/01_项目背景.md
2. PROJECT_CORE_DOCS/02_功能需求和边界.md
...

## 🔧 开发规范约束

### ⚠️ 首要规范：DDD + TDD + Git标准

### TDD强制执行
[TDD工作流规范]

### Git Commit规范
[Commit message格式]

## 🎯 开发检查清单

### 开发前检查
- [ ] 已阅读核心文档
- [ ] 理解项目边界
- [ ] 创建feature分支

### 编码中检查
- [ ] 遵循TDD流程
- [ ] 代码符合规范
- [ ] 测试持续通过

### 功能完成前检查
- [ ] TDD流程完整
- [ ] 测试覆盖率达标
- [ ] 文档已更新
```

### 3. README.md

```markdown
# [项目名称]

简短描述（1-2句话）

## 快速开始

\`\`\`bash
npm install
npm run dev
\`\`\`

## 项目结构

\`\`\`
PROJECT_CORE_DOCS/  - 项目核心文档
lib/                - 源代码
tests/              - 测试代码
\`\`\`

## 开发规范

参见 [CLAUDE.md](./CLAUDE.md)

## 部署

参见 [部署指南](./docs/deployment/)
```

---

## 📦 标准模板

### 1. UseCase模板

```typescript
/**
 * [功能名称] Use Case
 * Phase X.X - TDD Phase
 */

import { Result } from '@/lib/domain/shared/result'
import { [Error] } from '@/lib/domain/shared/errors'

interface [Input] {
  // 输入参数
}

interface [Output] {
  // 输出结果
}

export class [UseCaseName] {
  constructor(
    private [repository]: [Repository],
    // 其他依赖
  ) {}

  async execute(input: [Input]): Promise<Result<[Output]>> {
    try {
      // 1. 验证输入
      const validation = this.validateInput(input)
      if (!validation.isValid) {
        return Result.fail(validation.error)
      }

      // 2. 执行业务逻辑
      const result = await this.[repository].[method](input)

      // 3. 返回结果
      return Result.ok(result)
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)))
    }
  }

  private validateInput(input: [Input]): { isValid: boolean; error?: string } {
    // 验证逻辑
    return { isValid: true }
  }
}
```

### 2. 测试模板

```typescript
/**
 * [功能名称] 测试
 * Phase X.X - 🔴 RED
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { [UseCaseName] } from './[usecase-name].usecase'

describe('[UseCaseName]', () => {
  let useCase: [UseCaseName]
  let mockRepository: jest.Mocked<[Repository]>

  beforeEach(() => {
    mockRepository = {
      [method]: jest.fn(),
    } as any

    useCase = new [UseCaseName](mockRepository)
  })

  describe('正常流程', () => {
    it('应该成功执行', async () => {
      // Arrange
      const input = { /* test data */ }
      const expected = { /* expected result */ }
      mockRepository.[method].mockResolvedValue(expected)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toEqual(expected)
    })
  })

  describe('异常处理', () => {
    it('应该处理验证错误', async () => {
      // 测试输入验证
    })

    it('应该处理业务错误', async () => {
      // 测试业务逻辑错误
    })
  })
})
```

### 3. Repository模板

```typescript
/**
 * [领域名称] Repository
 */

import { PrismaClient } from '@prisma/client'
import { [Entity] } from '@/lib/domain/[domain]/[entity].entity'

export interface I[Entity]Repository {
  findById(id: string): Promise<[Entity] | null>
  findByXxx(xxx: string): Promise<[Entity] | null>
  create(data: Create[Entity]Data): Promise<[Entity]>
  update(id: string, data: Update[Entity]Data): Promise<[Entity]>
  delete(id: string): Promise<void>
}

export class [Entity]Repository implements I[Entity]Repository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<[Entity] | null> {
    return await this.prisma.[entity].findUnique({ where: { id } })
  }

  async create(data: Create[Entity]Data): Promise<[Entity]> {
    return await this.prisma.[entity].create({ data })
  }

  // ... 其他方法
}
```

### 4. Entity模板

```typescript
/**
 * [领域名称] Entity
 */

export interface [Entity] {
  id: string
  // 其他字段
  createdAt: Date
  updatedAt: Date
}

export interface Create[Entity]Data {
  // 创建所需字段
}

export interface Update[Entity]Data {
  // 更新所需字段（可选）
}

// 业务规则（如果有）
export class [Entity]Rules {
  static validate[Rule](entity: [Entity]): boolean {
    // 验证逻辑
    return true
  }
}
```

---

## ⚠️ 避免的陷阱

### 1. 过度设计 ⭐⭐⭐

```
危险信号：
□ "可能未来需要..."
□ "提前设计好架构..."
□ 功能没有明确的用户需求
□ 实现复杂度 >> 实际价值

避免方法：
✅ 遵循YAGNI原则
✅ 优先级驱动开发
✅ MVP思维
✅ 需要时再加，而非提前设计
```

### 2. 边界不清

```
典型问题：
❌ 重复实现外部服务已有功能
❌ 不清楚哪些逻辑应该在本地
❌ 混淆代理和实现的界限

避免方法：
✅ 开发前明确功能归属
✅ 在CLAUDE.md中强化边界
✅ 定期审查是否违反边界
```

### 3. 测试覆盖率作弊

```
典型问题：
❌ 只测试简单的getter/setter
❌ Mock过多，测不了真实逻辑
❌ 为了覆盖率写无意义测试

正确做法：
✅ 测试核心业务逻辑
✅ 测试边界条件和异常
✅ 集成测试验证真实交互
```

### 4. 文档与代码不同步

```
典型问题：
❌ 文档写了但代码没实现
❌ 代码改了但文档没更新
❌ 功能删了但文档还在

避免方法：
✅ 文档和代码在同一PR
✅ 定期审查文档准确性
✅ 删除过时文档
```

---

## 🎯 核心经验总结

### 做得好的地方 ✅

1. **DDD Lite架构** - 分层清晰，易于维护
2. **TDD流程** - 测试驱动，质量保证
3. **Result模式** - 错误处理统一
4. **项目边界明确** - 避免功能蔓延
5. **文档体系完善** - 便于理解和维护
6. **Git规范严格** - 提交历史清晰

### 需要改进的地方 ⚠️

1. **严格执行YAGNI** - 只实现P0功能
2. **提前定义边界** - 在CLAUDE.md中强化
3. **测试质量优先** - 重质量轻覆盖率
4. **文档即代码** - 文档和代码同步更新
5. **定期审查** - 每周检查是否过度设计

---

## 📝 使用指南

### 新项目启动清单

```markdown
阶段1：项目初始化（Day 1）
- [ ] 创建目录结构
- [ ] 初始化Git
- [ ] 安装依赖
- [ ] 配置开发工具

阶段2：核心文档（Day 2）
- [ ] 创建PROJECT_CORE_DOCS文档
- [ ] 编写CLAUDE.md
- [ ] 编写README.md
- [ ] 明确项目边界

阶段3：架构搭建（Day 3-4）
- [ ] 搭建DDD Lite分层
- [ ] 实现Result模式
- [ ] 配置测试框架
- [ ] 设置Pre-commit Hook

阶段4：MVP开发（Day 5+）
- [ ] 严格遵循TDD流程
- [ ] 只实现P0功能
- [ ] 保持测试覆盖率
- [ ] 定期审查边界
```

---

**版本**: v1.0
**创建日期**: 2025-10-10
**维护者**: Claude Development Team
**下次更新**: 应用到下一个项目后

---

_"简单优于复杂，可工作优于完美，迭代优于一次性，专注核心优于功能丰富"_

---

## 📚 参考资源

### 来源项目
- **Claude Key Portal** - 本标准提炼自该项目的实战经验

### 外部资源
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [YAGNI原则](https://martinfowler.com/bliki/Yagni.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
