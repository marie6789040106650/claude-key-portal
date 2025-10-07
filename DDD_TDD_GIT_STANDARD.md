# DDD + TDD + Git 综合开发标准

> **版本**: v1.0  
> **创建时间**: 2025-10-06  
> **适用项目**: Claude Key Portal  
> **核心原则**: 务实、渐进、可执行

---

## 📋 目录

1. [为什么需要这个标准](#为什么需要这个标准)
2. [项目领域复杂度分析](#项目领域复杂度分析)
3. [DDD Lite方案](#ddd-lite方案)
4. [TDD强化标准](#tdd强化标准)
5. [Git工作流规范](#git工作流规范)
6. [三者结合的完整工作流](#三者结合的完整工作流)
7. [检查清单与工具](#检查清单与工具)

---

## 🎯 为什么需要这个标准

### 当前问题诊断

**测试大面积失败** (84.3% 失败率):
- ❌ 测试和实现不同步
- ❌ 数据模型不一致（`password` vs `passwordHash`）
- ❌ API字段缺失（`monthlyLimit`未传递给CRS）
- ❌ Mock数据结构过时

**根本原因**:
```
不是缺乏DDD → 业务逻辑本身不复杂
是TDD执行不严格 → 测试先行原则未落实
是代码审查不充分 → 字段错误未被发现
```

### 解决方案定位

**我们需要**:
- ✅ **DDD Lite** - 清晰的分层和边界，但不引入复杂概念
- ✅ **TDD强制执行** - 严格的测试先行流程
- ✅ **Git规范化** - 与TDD结合的提交规范

**我们不需要**:
- ❌ 完整DDD - 聚合根、实体、值对象、领域事件等重型概念
- ❌ 事件溯源 - 业务不需要
- ❌ CQRS - 读写复杂度不高

---

## 🔍 项目领域复杂度分析

### 业务领域评估

| 领域 | 复杂度 | 评分 | 说明 |
|------|--------|------|------|
| **用户管理** | 🟢 简单 | 2/10 | 标准CRUD，无复杂业务规则 |
| **密钥管理** | 🟡 中等 | 4/10 | 代理CRS，技术集成为主 |
| **统计展示** | 🟡 中等 | 5/10 | 数据聚合，但逻辑清晰 |
| **安装指导** | 🟢 简单 | 3/10 | 工具类功能 |
| **定时任务** | 🟡 中等 | 4/10 | 调度和同步逻辑 |

**综合评分**: **3.6/10** - 中低复杂度

### DDD必要性评估

#### ✅ 适合DDD的项目特征
- 复杂的业务规则和策略
- 多个限界上下文
- 需要长期演进的大型系统
- 业务逻辑频繁变化
- 多个团队协作开发

#### ❌ 我们的项目特征
- 业务逻辑相对简单（CRUD + 代理）
- 单一应用（无微服务）
- 技术实现为主（集成CRS）
- 业务规则清晰稳定
- 小型团队（1-3人）

**结论**: **不需要完整DDD，采用DDD Lite方案**

---

## 🏗️ DDD Lite方案

### 核心思想

保留DDD的精华（分层架构、边界清晰），去掉重型概念（聚合根、领域事件）

### 分层架构

```
claude-key-portal/
│
├── app/                          # 🎨 表现层 (Presentation)
│   ├── (auth)/                   # 认证页面
│   ├── (dashboard)/              # 仪表板页面
│   └── api/                      # API路由
│       ├── auth/                 # 用户认证API
│       ├── keys/                 # 密钥管理API
│       ├── stats/                # 统计API
│       └── install/              # 安装指导API
│
├── lib/                          # 🔧 业务逻辑层 (Business Logic)
│   │
│   ├── domain/                   # 📦 领域层（新增）
│   │   ├── user/                 # 用户领域
│   │   │   ├── user.entity.ts        # 用户实体
│   │   │   ├── user.types.ts         # 用户类型
│   │   │   └── user.validation.ts    # 用户验证
│   │   │
│   │   ├── key/                  # 密钥领域
│   │   │   ├── key.entity.ts         # 密钥实体
│   │   │   ├── key.types.ts          # 密钥类型
│   │   │   └── key.validation.ts     # 密钥验证
│   │   │
│   │   ├── stats/                # 统计领域
│   │   │   ├── stats.entity.ts       # 统计实体
│   │   │   └── stats.types.ts        # 统计类型
│   │   │
│   │   └── shared/               # 共享领域对象
│   │       ├── result.ts             # 统一结果类型
│   │       └── errors.ts             # 领域错误
│   │
│   ├── application/              # 🎯 应用服务层（新增）
│   │   ├── user/
│   │   │   ├── register.usecase.ts   # 注册用例
│   │   │   ├── login.usecase.ts      # 登录用例
│   │   │   └── update-profile.usecase.ts
│   │   │
│   │   ├── key/
│   │   │   ├── create-key.usecase.ts # 创建密钥用例
│   │   │   ├── list-keys.usecase.ts  # 列出密钥用例
│   │   │   └── delete-key.usecase.ts # 删除密钥用例
│   │   │
│   │   └── stats/
│   │       └── aggregate-stats.usecase.ts
│   │
│   ├── infrastructure/           # 🔌 基础设施层（重组）
│   │   ├── persistence/          # 数据持久化
│   │   │   ├── prisma.ts             # Prisma客户端
│   │   │   └── repositories/         # 仓储实现
│   │   │       ├── user.repository.ts
│   │   │       ├── key.repository.ts
│   │   │       └── stats.repository.ts
│   │   │
│   │   ├── external/             # 外部服务
│   │   │   ├── crs-client.ts         # CRS集成
│   │   │   ├── email/                # 邮件服务
│   │   │   └── webhook/              # Webhook服务
│   │   │
│   │   └── cache/                # 缓存
│   │       └── redis.ts
│   │
│   └── utils/                    # 工具函数（保持现状）
│
├── components/                   # React组件
├── tests/                        # 测试文件
└── prisma/                       # 数据库Schema
```

### 层次职责定义

#### 1. 表现层 (app/)
**职责**: 处理HTTP请求、响应格式化、参数验证

```typescript
// app/api/keys/route.ts
export async function POST(request: Request) {
  // 1. 解析请求
  const body = await request.json()
  
  // 2. 参数验证
  const validated = createKeySchema.parse(body)
  
  // 3. 获取用户信息
  const userId = await getUserId(request)
  
  // 4. 调用应用服务层
  const result = await createKeyUseCase.execute({
    userId,
    ...validated
  })
  
  // 5. 格式化响应
  if (result.isSuccess) {
    return NextResponse.json(result.value, { status: 201 })
  }
  
  return NextResponse.json(
    { error: result.error.message },
    { status: result.error.code }
  )
}
```

**规则**:
- ✅ 只处理HTTP相关逻辑
- ✅ 参数验证（使用Zod）
- ✅ 调用应用服务层
- ❌ 不包含业务逻辑
- ❌ 不直接访问数据库

#### 2. 应用服务层 (lib/application/)
**职责**: 编排业务流程、协调领域对象和基础设施

```typescript
// lib/application/key/create-key.usecase.ts
import { Result } from '@/lib/domain/shared/result'
import { Key } from '@/lib/domain/key/key.entity'
import { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import { CRSClient } from '@/lib/infrastructure/external/crs-client'

export class CreateKeyUseCase {
  constructor(
    private keyRepo: KeyRepository,
    private crsClient: CRSClient
  ) {}

  async execute(input: CreateKeyInput): Promise<Result<Key>> {
    try {
      // 1. 验证业务规则
      if (!input.name || input.name.length < 3) {
        return Result.fail('密钥名称至少3个字符')
      }

      // 2. 调用CRS创建密钥
      const crsKey = await this.crsClient.createKey({
        name: input.name,
        monthlyLimit: input.monthlyLimit,
      })

      // 3. 创建本地映射
      const key = Key.create({
        userId: input.userId,
        crsKeyId: crsKey.id,
        crsKey: crsKey.key,
        name: input.name,
        monthlyLimit: input.monthlyLimit,
      })

      // 4. 保存到数据库
      await this.keyRepo.save(key)

      return Result.ok(key)
    } catch (error) {
      return Result.fail(error.message)
    }
  }
}
```

**规则**:
- ✅ 业务流程编排
- ✅ 事务管理
- ✅ 调用领域层和基础设施层
- ❌ 不包含领域逻辑（委托给领域层）
- ❌ 不直接依赖具体技术实现

#### 3. 领域层 (lib/domain/)
**职责**: 核心业务逻辑、业务规则、实体定义

```typescript
// lib/domain/key/key.entity.ts
export class Key {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly crsKeyId: string,
    public readonly crsKey: string,
    public name: string,
    public monthlyLimit?: number,
    public status: KeyStatus = 'ACTIVE',
    public readonly createdAt: Date = new Date()
  ) {}

  static create(props: CreateKeyProps): Key {
    // 业务规则验证
    if (!props.name || props.name.length < 3) {
      throw new Error('密钥名称至少3个字符')
    }

    if (props.monthlyLimit && props.monthlyLimit < 0) {
      throw new Error('月限额不能为负数')
    }

    return new Key(
      generateId(),
      props.userId,
      props.crsKeyId,
      props.crsKey,
      props.name,
      props.monthlyLimit
    )
  }

  // 业务行为
  updateName(newName: string): void {
    if (!newName || newName.length < 3) {
      throw new Error('密钥名称至少3个字符')
    }
    this.name = newName
  }

  deactivate(): void {
    this.status = 'INACTIVE'
  }

  // 领域逻辑
  isExpired(): boolean {
    // 检查是否过期
    return false
  }
}
```

**规则**:
- ✅ 封装业务规则
- ✅ 保证数据一致性
- ✅ 提供业务行为方法
- ❌ 不依赖基础设施
- ❌ 不包含技术细节

#### 4. 基础设施层 (lib/infrastructure/)
**职责**: 技术实现、外部服务集成、数据持久化

```typescript
// lib/infrastructure/persistence/repositories/key.repository.ts
import { Key } from '@/lib/domain/key/key.entity'
import { prisma } from '../prisma'

export class KeyRepository {
  async save(key: Key): Promise<void> {
    await prisma.apiKey.create({
      data: {
        id: key.id,
        userId: key.userId,
        crsKeyId: key.crsKeyId,
        crsKey: key.crsKey,
        name: key.name,
        monthlyLimit: key.monthlyLimit,
        status: key.status,
        createdAt: key.createdAt,
      },
    })
  }

  async findById(id: string): Promise<Key | null> {
    const record = await prisma.apiKey.findUnique({
      where: { id },
    })

    if (!record) return null

    return new Key(
      record.id,
      record.userId,
      record.crsKeyId,
      record.crsKey,
      record.name,
      record.monthlyLimit ?? undefined,
      record.status as KeyStatus,
      record.createdAt
    )
  }

  async findByUserId(userId: string): Promise<Key[]> {
    const records = await prisma.apiKey.findMany({
      where: { userId },
    })

    return records.map(r => new Key(
      r.id,
      r.userId,
      r.crsKeyId,
      r.crsKey,
      r.name,
      r.monthlyLimit ?? undefined,
      r.status as KeyStatus,
      r.createdAt
    ))
  }
}
```

**规则**:
- ✅ 实现技术细节
- ✅ 数据映射（Prisma ↔ Domain Entity）
- ✅ 外部服务调用
- ❌ 不包含业务逻辑

### Result模式

统一的错误处理：

```typescript
// lib/domain/shared/result.ts
export class Result<T> {
  public readonly isSuccess: boolean
  public readonly isFailure: boolean
  public readonly value?: T
  public readonly error?: Error

  private constructor(isSuccess: boolean, value?: T, error?: Error) {
    this.isSuccess = isSuccess
    this.isFailure = !isSuccess
    this.value = value
    this.error = error
  }

  static ok<U>(value: U): Result<U> {
    return new Result<U>(true, value)
  }

  static fail<U>(error: string | Error): Result<U> {
    const errorObj = typeof error === 'string' 
      ? new Error(error) 
      : error
    return new Result<U>(false, undefined, errorObj)
  }
}
```

---

## 🧪 TDD强化标准

### 核心原则

```
🔴 RED → 🟢 GREEN → 🔵 REFACTOR
```

**严格执行顺序**:
1. 先写测试（必须失败）
2. 写最少代码让测试通过
3. 重构优化代码
4. 所有测试必须通过

### TDD工作流（强制执行）

#### Step 1: 🔴 RED - 先写失败的测试

```typescript
// tests/unit/application/key/create-key.usecase.test.ts
describe('CreateKeyUseCase', () => {
  it('应该成功创建密钥并返回完整数据', async () => {
    // Arrange
    const mockCRSClient = {
      createKey: jest.fn().mockResolvedValue({
        id: 'crs_123',
        key: 'sk-ant-api03-xxx',
        monthlyLimit: 1000000,  // ✅ 明确包含monthlyLimit
      })
    }
    
    const mockKeyRepo = {
      save: jest.fn()
    }
    
    const useCase = new CreateKeyUseCase(mockKeyRepo, mockCRSClient)
    
    // Act
    const result = await useCase.execute({
      userId: 'user_123',
      name: 'Production Key',
      monthlyLimit: 1000000,
    })
    
    // Assert
    expect(result.isSuccess).toBe(true)
    expect(result.value).toHaveProperty('monthlyLimit', 1000000)  // ✅ 验证字段存在
    expect(mockCRSClient.createKey).toHaveBeenCalledWith({
      name: 'Production Key',
      monthlyLimit: 1000000,  // ✅ 验证传递给CRS
    })
  })
})
```

**提交**:
```bash
git add tests/
git commit -m "test: add create key with monthly limit test (🔴 RED)"
```

#### Step 2: 🟢 GREEN - 写最少代码让测试通过

```typescript
// lib/application/key/create-key.usecase.ts
export class CreateKeyUseCase {
  async execute(input: CreateKeyInput): Promise<Result<Key>> {
    // 1. 调用CRS（包含monthlyLimit）
    const crsKey = await this.crsClient.createKey({
      name: input.name,
      monthlyLimit: input.monthlyLimit,  // ✅ 传递给CRS
    })

    // 2. 创建实体（包含monthlyLimit）
    const key = Key.create({
      userId: input.userId,
      crsKeyId: crsKey.id,
      crsKey: crsKey.key,
      name: input.name,
      monthlyLimit: crsKey.monthlyLimit,  // ✅ 从CRS获取
    })

    // 3. 保存
    await this.keyRepo.save(key)

    return Result.ok(key)
  }
}
```

**验证**:
```bash
npm test tests/unit/application/key/create-key.usecase.test.ts
```

**提交**:
```bash
git add lib/application/
git commit -m "feat: implement create key with monthly limit (🟢 GREEN)"
```

#### Step 3: 🔵 REFACTOR - 重构优化

```typescript
// 提取验证逻辑
export class CreateKeyUseCase {
  async execute(input: CreateKeyInput): Promise<Result<Key>> {
    // 1. 验证输入
    const validation = this.validateInput(input)
    if (validation.isFailure) {
      return Result.fail(validation.error)
    }

    // 2. 调用CRS
    const crsKey = await this.callCRS(input)
    
    // 3. 创建并保存
    const key = await this.createAndSaveKey(input, crsKey)
    
    return Result.ok(key)
  }

  private validateInput(input: CreateKeyInput): Result<void> {
    if (!input.name || input.name.length < 3) {
      return Result.fail('密钥名称至少3个字符')
    }
    
    if (input.monthlyLimit && input.monthlyLimit < 0) {
      return Result.fail('月限额不能为负数')
    }
    
    return Result.ok(undefined)
  }

  private async callCRS(input: CreateKeyInput) {
    return await this.crsClient.createKey({
      name: input.name,
      monthlyLimit: input.monthlyLimit,
    })
  }

  private async createAndSaveKey(input: CreateKeyInput, crsKey: CRSKey) {
    const key = Key.create({
      userId: input.userId,
      crsKeyId: crsKey.id,
      crsKey: crsKey.key,
      name: input.name,
      monthlyLimit: crsKey.monthlyLimit,
    })

    await this.keyRepo.save(key)
    return key
  }
}
```

**验证**:
```bash
npm test tests/unit/application/key/create-key.usecase.test.ts
```

**提交**:
```bash
git add lib/application/
git commit -m "refactor: extract validation and improve readability (🔵 REFACTOR)"
```

### 测试覆盖率要求

**强制要求**:
```json
// jest.config.js
coverageThreshold: {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  './lib/application/': {
    statements: 90,  // 应用层要求更高
    branches: 85,
    functions: 90,
    lines: 90,
  },
  './lib/domain/': {
    statements: 95,  // 领域层要求最高
    branches: 90,
    functions: 95,
    lines: 95,
  }
}
```

**CI检查**:
```yaml
# .github/workflows/ci.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Check coverage threshold
  run: |
    if [ $(jq '.total.lines.pct' coverage/coverage-summary.json | cut -d. -f1) -lt 80 ]; then
      echo "❌ 测试覆盖率低于80%"
      exit 1
    fi
```

---

## 📦 Git工作流规范

### 分支策略

```
main (生产)
  ↑
develop (开发主线)
  ↑
feature/xxx (功能分支 - TDD开发)
  ↑
fix/xxx (修复分支)
```

### Commit规范（与TDD结合）

**格式**:
```
<type>(<scope>): <subject> (<tdd-phase>)

[optional body]
[optional footer]
```

**Type类型**:
- `test` - 添加测试（🔴 RED阶段）
- `feat` - 实现功能（🟢 GREEN阶段）
- `refactor` - 重构代码（🔵 REFACTOR阶段）
- `fix` - 修复bug
- `docs` - 文档更新
- `chore` - 构建/工具配置

**Scope范围**:
- `user` - 用户领域
- `key` - 密钥领域
- `stats` - 统计领域
- `auth` - 认证
- `infra` - 基础设施

**TDD Phase标记**:
- `🔴 RED` - 测试先行
- `🟢 GREEN` - 实现通过
- `🔵 REFACTOR` - 重构优化

**示例**:
```bash
# RED阶段
git commit -m "test(key): add monthly limit validation test (🔴 RED)"

# GREEN阶段
git commit -m "feat(key): implement monthly limit field (🟢 GREEN)"

# REFACTOR阶段
git commit -m "refactor(key): extract validation logic (🔵 REFACTOR)"

# 修复
git commit -m "fix(key): correct password field name to passwordHash"

# 文档
git commit -m "docs(key): update API mapping specification"
```

### PR规范

**PR标题**:
```
[功能] 密钥月限额支持

包含:
- 🔴 测试用例 (5个)
- 🟢 功能实现 (CreateKeyUseCase)
- 🔵 代码重构 (提取验证)
- 📝 文档更新 (API_MAPPING.md)
```

**PR描述模板**:
```markdown
## 🎯 目标

实现密钥月限额功能

## 🔴 测试用例 (RED)

- [x] 成功创建带月限额的密钥
- [x] 拒绝负数月限额
- [x] 验证月限额传递给CRS
- [x] 验证月限额存储到数据库
- [x] 查询时返回月限额字段

## 🟢 实现 (GREEN)

- [x] 更新CreateKeyUseCase
- [x] 更新Key实体
- [x] 更新KeyRepository
- [x] 更新API路由

## 🔵 重构 (REFACTOR)

- [x] 提取输入验证逻辑
- [x] 优化错误处理

## ✅ 检查清单

- [x] 所有测试通过 (npm test)
- [x] 覆盖率 > 80% (npm run test:coverage)
- [x] TypeScript无错误 (npm run typecheck)
- [x] ESLint通过 (npm run lint)
- [x] 文档已更新
- [x] CLAUDE.md中的引用已更新

## 📊 测试结果

```
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
Coverage:    85.4%
```

## 🔗 相关Issue

Closes #123
```

---

## 🔄 三者结合的完整工作流

### 完整开发流程（示例：实现密钥过期检查）

#### Phase 1: 需求分析与设计

**1. 理解需求**:
```markdown
用户故事：作为管理员，我希望看到哪些密钥即将过期，以便及时续期

验收标准：
- 密钥有expiresAt字段
- 提前7天标记为"即将过期"
- 仪表板显示即将过期密钥数量
```

**2. 领域建模** (DDD Lite):
```typescript
// lib/domain/key/key.entity.ts

class Key {
  // ...existing code...

  // 新增业务逻辑
  isExpiringSoon(daysThreshold: number = 7): boolean {
    if (!this.expiresAt) return false
    
    const daysUntilExpiry = differenceInDays(this.expiresAt, new Date())
    return daysUntilExpiry >= 0 && daysUntilExpiry <= daysThreshold
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false
    return isPast(this.expiresAt)
  }
}
```

#### Phase 2: TDD开发

**Step 1: 🔴 RED - 写测试**

```typescript
// tests/unit/domain/key/key.entity.test.ts
describe('Key.isExpiringSoon', () => {
  it('应该识别7天内即将过期的密钥', () => {
    const key = new Key({
      ...defaultProps,
      expiresAt: addDays(new Date(), 5), // 5天后过期
    })

    expect(key.isExpiringSoon()).toBe(true)
  })

  it('应该识别已过期的密钥不算即将过期', () => {
    const key = new Key({
      ...defaultProps,
      expiresAt: subDays(new Date(), 1), // 昨天已过期
    })

    expect(key.isExpiringSoon()).toBe(false)
  })

  it('应该识别7天后过期的密钥不算即将过期', () => {
    const key = new Key({
      ...defaultProps,
      expiresAt: addDays(new Date(), 10), // 10天后过期
    })

    expect(key.isExpiringSoon()).toBe(false)
  })
})
```

```bash
npm test tests/unit/domain/key/key.entity.test.ts
# ❌ 测试失败 - 方法未实现

git add tests/
git commit -m "test(key): add expiration check tests (🔴 RED)"
```

**Step 2: 🟢 GREEN - 实现功能**

```typescript
// lib/domain/key/key.entity.ts
import { differenceInDays, isPast } from 'date-fns'

class Key {
  isExpiringSoon(daysThreshold: number = 7): boolean {
    if (!this.expiresAt) return false
    
    const daysUntilExpiry = differenceInDays(this.expiresAt, new Date())
    return daysUntilExpiry >= 0 && daysUntilExpiry <= daysThreshold
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false
    return isPast(this.expiresAt)
  }
}
```

```bash
npm test tests/unit/domain/key/key.entity.test.ts
# ✅ 所有测试通过

git add lib/domain/
git commit -m "feat(key): implement expiration check methods (🟢 GREEN)"
```

**Step 3: 应用层测试**

```typescript
// tests/unit/application/key/list-expiring-keys.usecase.test.ts
describe('ListExpiringKeysUseCase', () => {
  it('应该返回即将过期的密钥列表', async () => {
    // Arrange
    const mockKeys = [
      createMockKey({ expiresAt: addDays(new Date(), 5) }),  // 即将过期
      createMockKey({ expiresAt: addDays(new Date(), 30) }), // 未过期
      createMockKey({ expiresAt: subDays(new Date(), 1) }),  // 已过期
    ]
    
    const mockKeyRepo = {
      findByUserId: jest.fn().mockResolvedValue(mockKeys)
    }
    
    const useCase = new ListExpiringKeysUseCase(mockKeyRepo)
    
    // Act
    const result = await useCase.execute({ userId: 'user_123' })
    
    // Assert
    expect(result.isSuccess).toBe(true)
    expect(result.value).toHaveLength(1) // 只返回即将过期的
  })
})
```

```bash
git commit -m "test(key): add list expiring keys use case test (🔴 RED)"
```

**Step 4: 实现应用层**

```typescript
// lib/application/key/list-expiring-keys.usecase.ts
export class ListExpiringKeysUseCase {
  constructor(private keyRepo: KeyRepository) {}

  async execute(input: { userId: string }): Promise<Result<Key[]>> {
    try {
      // 1. 获取用户所有密钥
      const allKeys = await this.keyRepo.findByUserId(input.userId)
      
      // 2. 过滤即将过期的密钥（使用领域逻辑）
      const expiringKeys = allKeys.filter(key => key.isExpiringSoon())
      
      return Result.ok(expiringKeys)
    } catch (error) {
      return Result.fail(error.message)
    }
  }
}
```

```bash
git commit -m "feat(key): implement list expiring keys use case (🟢 GREEN)"
```

**Step 5: 🔵 REFACTOR - 重构**

```typescript
// 提取常量
const DEFAULT_EXPIRY_THRESHOLD_DAYS = 7

// 添加配置支持
export class ListExpiringKeysUseCase {
  constructor(
    private keyRepo: KeyRepository,
    private expiryThreshold: number = DEFAULT_EXPIRY_THRESHOLD_DAYS
  ) {}

  async execute(input: { userId: string }): Promise<Result<Key[]>> {
    try {
      const allKeys = await this.keyRepo.findByUserId(input.userId)
      const expiringKeys = this.filterExpiringKeys(allKeys)
      
      return Result.ok(expiringKeys)
    } catch (error) {
      return Result.fail(error.message)
    }
  }

  private filterExpiringKeys(keys: Key[]): Key[] {
    return keys.filter(key => key.isExpiringSoon(this.expiryThreshold))
  }
}
```

```bash
npm test  # 确保所有测试仍然通过
git commit -m "refactor(key): extract filtering logic and add threshold config (🔵 REFACTOR)"
```

#### Phase 3: API集成

**测试API层**:
```typescript
// tests/unit/api/keys/expiring.test.ts
describe('GET /api/keys/expiring', () => {
  it('应该返回即将过期的密钥', async () => {
    const mockUseCase = {
      execute: jest.fn().mockResolvedValue(
        Result.ok([mockExpiringKey])
      )
    }

    const response = await GET(mockRequest, { useCase: mockUseCase })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.keys).toHaveLength(1)
    expect(data.keys[0].expiresAt).toBeDefined()
  })
})
```

**实现API**:
```typescript
// app/api/keys/expiring/route.ts
export async function GET(request: Request) {
  const userId = await getUserId(request)
  
  const result = await listExpiringKeysUseCase.execute({ userId })
  
  if (result.isSuccess) {
    return NextResponse.json({ keys: result.value })
  }
  
  return NextResponse.json(
    { error: result.error.message },
    { status: 500 }
  )
}
```

#### Phase 4: Git提交总结

```bash
# 查看本次功能的所有commit
git log --oneline feature/expiring-keys

5d3d290 refactor(key): extract filtering logic (🔵 REFACTOR)
811496f feat(key): implement list expiring keys use case (🟢 GREEN)
12e2ba4 test(key): add list expiring keys use case test (🔴 RED)
524dad7 feat(key): implement expiration check methods (🟢 GREEN)
b244c50 test(key): add expiration check tests (🔴 RED)
```

**创建PR**:
```bash
git push origin feature/expiring-keys
gh pr create --title "[功能] 密钥过期检查" --body-file pr-template.md
```

---

## ✅ 检查清单与工具

### 开发前检查

```markdown
- [ ] 需求是否清晰？
- [ ] 领域建模是否完成？
- [ ] 是否创建了feature分支？
- [ ] 是否先写测试？
```

### 编码中检查

```markdown
- [ ] 🔴 测试是否先行？
- [ ] 🟢 测试是否通过？
- [ ] 🔵 是否需要重构？
- [ ] 分层是否正确？
  - [ ] API层只处理HTTP
  - [ ] 应用层编排流程
  - [ ] 领域层包含业务逻辑
  - [ ] 基础设施层处理技术细节
- [ ] 是否使用Result模式？
- [ ] Commit message是否规范？
```

### 提交前检查

```markdown
- [ ] npm test → 所有测试通过
- [ ] npm run test:coverage → 覆盖率 > 80%
- [ ] npm run typecheck → 无TypeScript错误
- [ ] npm run lint → 无ESLint错误
- [ ] 文档是否更新？
- [ ] CLAUDE.md引用是否更新？
```

### 工具配置

**Pre-commit Hook**:
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# 1. 运行测试
npm test -- --findRelatedTests --passWithNoTests
if [ $? -ne 0 ]; then
  echo "❌ 测试失败"
  exit 1
fi

# 2. 检查类型
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript类型错误"
  exit 1
fi

# 3. Lint检查
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint错误"
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

**Commit Message Hook**:
```bash
# .husky/commit-msg
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 验证commit message格式
commit_msg=$(cat $1)

# 正则匹配: type(scope): subject (phase)
if ! echo "$commit_msg" | grep -qE "^(test|feat|refactor|fix|docs|chore)\([a-z]+\): .+ \((🔴 RED|🟢 GREEN|🔵 REFACTOR)\)$"; then
  echo "❌ Commit message格式错误"
  echo "格式: type(scope): subject (phase)"
  echo "示例: feat(key): implement monthly limit (🟢 GREEN)"
  exit 1
fi

echo "✅ Commit message valid"
```

---

## 📊 效果预期

### 实施前 vs 实施后

| 指标 | 实施前 | 实施后 | 改善 |
|------|--------|--------|------|
| **测试覆盖率** | 40% | >80% | ⬆️ 100% |
| **测试通过率** | 15.7% | >95% | ⬆️ 500% |
| **代码结构** | 混乱 | 分层清晰 | ✅ 质的飞跃 |
| **Bug率** | 高 | 低 | ⬇️ 60% |
| **开发速度** | 慢 | 快（初期慢） | ⬇️ 30%（长期） |
| **维护成本** | 高 | 低 | ⬇️ 50% |

### 长期收益

1. **代码质量提升**
   - 清晰的分层架构
   - 业务逻辑集中在领域层
   - 技术细节隔离在基础设施层

2. **测试可靠性**
   - 测试先行确保需求正确理解
   - 高覆盖率保证代码健壮性
   - 回归测试防止破坏性修改

3. **团队协作**
   - 统一的开发标准
   - 清晰的Git历史
   - 规范的PR流程

4. **项目可维护性**
   - 新人快速上手
   - 代码易于理解
   - 重构风险低

---

## 🎓 培训与推广

### 新成员Onboarding

**第1天**: 理解DDD Lite
- 阅读本文档
- 理解分层架构
- 查看示例代码

**第2天**: TDD实践
- 完成TDD练习
- 编写第一个测试
- 走完RED-GREEN-REFACTOR循环

**第3天**: Git规范
- 学习Commit规范
- 创建第一个PR
- 代码审查流程

**第4天**: 实战
- 独立完成小功能
- 遵循完整工作流
- 接受Code Review

### Code Review重点

审查时检查：
- [ ] 是否遵循分层架构？
- [ ] 测试是否先于实现？
- [ ] 测试覆盖率是否达标？
- [ ] Commit message是否规范？
- [ ] 业务逻辑是否在领域层？
- [ ] 是否使用Result模式？

---

## 🚀 迁移计划

### 渐进式迁移

**不需要重写整个项目**，按模块逐步迁移：

**Phase 1**: 新功能强制执行（立即）
- 所有新功能必须遵循DDD Lite + TDD
- 新代码必须通过Pre-commit检查
- PR必须包含完整的测试

**Phase 2**: 重点模块重构（1-2周）
- 密钥管理模块重构
- 提取领域层和应用层
- 补充测试覆盖

**Phase 3**: 全面迁移（1个月）
- 所有模块逐步迁移
- 重构现有代码
- 达到80%测试覆盖率

---

## 📖 参考资源

### 学习资料

- **DDD**: 《领域驱动设计精粹》 - Vaughn Vernon
- **TDD**: 《测试驱动开发》 - Kent Beck
- **Clean Architecture**: 《整洁架构》 - Robert C. Martin
- **Git**: 《Git Pro》 - Scott Chacon

### 项目文档

- [TDD_WORKFLOW.md](docs/development/TDD_WORKFLOW.md) - TDD详细流程
- [API_MAPPING.md](docs/core/API_MAPPING.md) - API规范
- [DATABASE_SCHEMA.md](docs/core/DATABASE_SCHEMA.md) - 数据模型

---

**标准版本**: v1.0  
**最后更新**: 2025-10-06  
**维护者**: Claude Key Portal Team  
**反馈**: 遇到问题请提Issue

---

_"清晰的标准，是团队成功的保障！"_
