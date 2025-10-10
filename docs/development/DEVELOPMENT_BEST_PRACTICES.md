# 开发最佳实践总结
## Claude Key Portal 项目经验提炼

**创建日期**: 2025-10-10
**版本**: v1.0
**目的**: 总结项目开发过程中的成功经验和教训，用于未来项目参考

---

## 📋 目录

1. [架构设计最佳实践](#架构设计最佳实践)
2. [开发流程最佳实践](#开发流程最佳实践)
3. [代码质量最佳实践](#代码质量最佳实践)
4. [项目管理最佳实践](#项目管理最佳实践)
5. [避免的陷阱](#避免的陷阱)
6. [标准化模板](#标准化模板)

---

## 🏗️ 架构设计最佳实践

### 1. DDD Lite 分层架构 ⭐⭐⭐

**成功经验**:

```
清晰的分层结构：
lib/
├── domain/              # 领域层 - 业务逻辑和规则
│   ├── user/           # 用户领域
│   ├── key/            # 密钥领域
│   └── shared/         # 共享对象（Result, Errors）
│
├── application/         # 应用层 - 用例编排
│   ├── user/           # 用户用例
│   └── key/            # 密钥用例
│
└── infrastructure/      # 基础设施层 - 技术实现
    ├── auth/           # 认证服务
    ├── cache/          # 缓存
    ├── external/       # 外部服务
    └── persistence/    # 数据持久化
```

**优点**:
- ✅ 职责清晰，每层有明确的边界
- ✅ 易于测试，业务逻辑独立于技术细节
- ✅ 便于维护，修改技术栈不影响业务逻辑
- ✅ 新人易上手，结构直观

**关键原则**:
```typescript
// ✅ 好的分层
domain/user/user.entity.ts       // 业务逻辑
application/user/register.usecase.ts  // 流程编排
infrastructure/persistence/user.repository.ts  // 数据访问

// ❌ 避免的反模式
lib/user-service.ts  // 混在一起，职责不清
```

### 2. Repository 模式

**成功经验**:

```typescript
// 统一的Repository接口
interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: CreateUserData): Promise<User>
  update(id: string, data: UpdateUserData): Promise<User>
  delete(id: string): Promise<void>
}

// 实现类
class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } })
  }
  // ...
}
```

**优点**:
- ✅ 数据访问逻辑集中管理
- ✅ 易于Mock，方便单元测试
- ✅ 切换ORM无需修改业务代码
- ✅ 统一的错误处理

### 3. Result 模式（统一错误处理）

**成功经验**:

```typescript
// Result类型定义
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
async function createKey(data: CreateKeyInput): Promise<Result<ApiKey>> {
  try {
    const key = await crsClient.createKey(data)
    return Result.ok(key)
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error(String(error)))
  }
}

// 调用方
const result = await createKey(data)
if (result.isSuccess) {
  return NextResponse.json(result.value, { status: 201 })
} else {
  return NextResponse.json(
    { error: result.error.message },
    { status: 500 }
  )
}
```

**优点**:
- ✅ 强制错误处理，不会遗漏
- ✅ 类型安全，编译期检查
- ✅ 错误信息统一格式
- ✅ 避免try-catch嵌套

### 4. 明确项目边界 ⭐⭐⭐

**成功经验**:

```
Claude Key Portal的边界定义：

✅ 我们做什么：
- 用户管理（本地）
- 界面展示（本地）
- 本地扩展功能
- 调用CRS API（代理）

❌ 我们不做什么：
- 密钥生成（CRS负责）
- 密钥验证（CRS负责）
- API中转（CRS负责）
- 使用量统计（CRS负责）
```

**关键教训**:
```
铁律：CRS已实现的功能，Portal直接调用，不要重新实现

✅ 正确：调用 crsClient.updateKey({ status: 'active' })
❌ 错误：在Portal实现密钥状态管理逻辑
```

**如何定义边界**:
1. 创建 `PROJECT_CORE_DOCS/02_功能需求和边界.md`
2. 明确列出"做什么"和"不做什么"
3. 在 `CLAUDE.md` 中强化边界约束
4. 定期审查是否违反边界

---

## 🔄 开发流程最佳实践

### 1. TDD (测试驱动开发) ⭐⭐⭐

**成功的TDD工作流**:

```bash
# 🔴 RED: 先写测试（必须失败）
git commit -m "test(key): add monthly limit validation test (🔴 RED)"

# 🟢 GREEN: 写实现（让测试通过）
git commit -m "feat(key): implement monthly limit field (🟢 GREEN)"

# 🔵 REFACTOR: 重构优化（保持测试通过）
git commit -m "refactor(key): extract validation logic (🔵 REFACTOR)"
```

**关键原则**:
- ✅ **测试先行** - 不写测试不写代码
- ✅ **小步迭代** - 每次只关注一个测试
- ✅ **快速反馈** - 测试运行时间 < 5秒
- ✅ **持续重构** - 绿灯后立即优化

**测试层次**:
```
单元测试（lib/**/*.test.ts）        - 80%+ 覆盖率
集成测试（tests/integration/）      - 关键流程
E2E测试（tests/e2e/）              - 核心用户路径
```

**避免的陷阱**:
```
❌ 先写代码再补测试（测试质量差）
❌ 测试覆盖率作弊（只测简单逻辑）
❌ 测试依赖过多Mock（脆弱）
❌ 测试运行太慢（失去迭代速度）
```

### 2. Git Commit 规范（与TDD结合）

**成功的提交格式**:

```bash
<type>(<scope>): <subject> (<tdd-phase>)

type: test, feat, fix, refactor, docs, style, perf, chore
scope: user, key, stats, auth, infra
tdd-phase: 🔴 RED | 🟢 GREEN | 🔵 REFACTOR

示例：
test(key): add monthly limit validation test (🔴 RED)
feat(key): implement monthly limit field (🟢 GREEN)
refactor(key): extract validation logic (🔵 REFACTOR)

非TDD示例：
fix(key): correct password field name to passwordHash
docs(core): update API mapping specification
chore(infra): configure pre-commit hooks
```

**优点**:
- ✅ 提交历史清晰，一眼看出TDD流程
- ✅ 强制执行TDD，不允许跳过
- ✅ 便于Code Review
- ✅ 自动化检查（Pre-commit Hook）

### 3. Pre-commit Hook 强制执行质量标准

**成功的Hook配置**:

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

# 验证Commit Message格式
npx commitlint --edit $1 || exit 1
```

**关键检查**:
- ✅ 所有测试通过
- ✅ 测试覆盖率 > 80%
- ✅ TypeScript无错误
- ✅ ESLint通过
- ✅ Commit message符合规范

### 4. 混合测试方案（TDD + 集成验证）

**成功的混合方案**:

```bash
开发阶段 (Day 1-4):
# TDD快速迭代（使用Mock）
1. 🔴 RED: 写测试
2. 🟢 GREEN: 写实现
3. 🔵 REFACTOR: 优化

集成验证阶段 (Day 5):
# 真实环境测试（连接CRS）
4. ✅ 运行集成测试脚本
5. 🔧 修复问题
6. 📝 记录测试结果
```

**关键原则**:
- ✅ TDD阶段使用Mock，保持快速
- ✅ 功能完成后必须集成验证
- ✅ 集成测试通过才能合并
- ❌ 不允许跳过集成验证

---

## 💻 代码质量最佳实践

### 1. TypeScript 严格模式

**成功的配置**:

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

**优点**:
- ✅ 编译期发现错误
- ✅ 代码提示更准确
- ✅ 重构更安全
- ✅ 减少运行时错误

### 2. ESLint + Prettier 统一代码风格

**成功的配置**:

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

### 3. 命名规范

**成功的命名约定**:

```typescript
// ✅ 好的命名
const userRepository = new UserRepository()  // 实例用camelCase
class UserRepository { }  // 类名用PascalCase
interface IUserRepository { }  // 接口用 I 前缀
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

## 📊 项目管理最佳实践

### 1. 优先级驱动开发（P0 → P1 → P2 → P3）

**成功的优先级定义**:

```
P0 - 必须有（MVP）:
- 用户注册登录
- 密钥CRUD（代理CRS）
- 基础统计
- 安装指导

P1 - 应该有（V1.0）:
- 密钥本地扩展
- 详细统计图表
- 个人设置

P2 - 可以有（V1.5）:
- 数据导出
- 高级搜索
- 调用日志

P3 - 未来有（V2.0）:
- 团队协作
- 通知系统
- Webhook集成
```

**关键原则**:
- ✅ P0必须100%完成才能发布
- ✅ P1-P3可以后续迭代
- ❌ 不要为P2-P3功能提前设计
- ❌ 不要"可能未来需要"而现在实现

### 2. 项目文档结构化

**成功的文档组织**:

```
PROJECT_CORE_DOCS/
├── 01_项目背景.md          # 为什么做这个项目
├── 02_功能需求和边界.md     # 做什么，不做什么
└── 03_发展路线图.md        # 未来怎么发展

技术文档/
├── API_MAPPING_SPECIFICATION.md   # API规范
├── DATABASE_SCHEMA.md            # 数据库设计
├── DDD_TDD_GIT_STANDARD.md       # 开发标准
└── TDD_GIT_WORKFLOW.md           # TDD工作流

原型参考/
└── prototypes/
    ├── index.html           # HTML原型
    └── ...
```

**优点**:
- ✅ 新人快速理解项目
- ✅ 开发有章可循
- ✅ 减少重复沟通
- ✅ 便于后期维护

### 3. CLAUDE.md 项目配置

**成功的配置模板**:

```markdown
# 项目核心约束（放在最前面）
铁律：明确项目定位和边界

# 开发上下文引用
核心文档必读列表

# 开发规范约束
TDD强制执行
Git Commit规范
测试覆盖率要求

# 错误处理规范
Result模式
错误提示映射

# 性能优化规范
缓存策略
数据库查询优化

# 安全规范
密码处理
JWT令牌
输入验证

# 开发检查清单
开发前检查
编码中检查
功能完成前检查
```

---

## ⚠️ 避免的陷阱

### 1. 过度设计（最大教训） ⭐⭐⭐

**典型案例**:

```
❌ 过度设计的特征：
1. Cron Jobs系统 - MVP不需要定时任务
2. Monitoring监控 - 平台已提供基础监控
3. Notification通知 - 当前没有使用场景
4. Email/Webhook - 没有实际需求

结果：
- 增加30%+ 代码量
- 测试维护成本高
- 分散开发精力
- 违背MVP原则
```

**如何识别过度设计**:

```
⚠️ 危险信号：
□ "可能未来需要"
□ "提前设计好架构"
□ 功能没有明确的用户需求
□ 实现复杂度 >> 实际价值
□ 增加维护成本 > 增加业务价值
```

**避免方法**:

```
✅ 遵循YAGNI原则 (You Aren't Gonna Need It)
✅ 优先级驱动开发 (P0 → P1 → P2 → P3)
✅ MVP思维（最小可行产品）
✅ 迭代式开发（需要时再加，而非提前设计）
```

### 2. 边界不清导致功能重复

**典型案例**:

```
❌ 错误做法：
在Portal实现密钥状态管理逻辑
在本地数据库添加isActive字段
创建复杂的状态同步机制

✅ 正确做法：
直接调用 crsClient.updateKey({ status: 'active' })
只存储CRS返回的状态
不重复实现CRS已有逻辑
```

**教训**:
- ⚠️ 开发前必须明确功能归属
- ⚠️ 定期审查是否违反边界
- ⚠️ 在CLAUDE.md中强化边界约束

### 3. 测试覆盖率作弊

**典型问题**:

```
❌ 只测试简单的getter/setter
❌ Mock过多，测试不了真实逻辑
❌ 测试写了但从不运行
❌ 为了覆盖率而写无意义的测试
```

**正确做法**:

```
✅ 测试核心业务逻辑
✅ 测试边界条件和异常
✅ 集成测试验证真实交互
✅ Pre-commit强制运行测试
```

### 4. 文档与代码不同步

**典型问题**:

```
❌ 文档写了但代码没实现
❌ 代码改了但文档没更新
❌ 功能删了但文档还在
```

**避免方法**:

```
✅ 文档和代码在同一PR
✅ Pre-commit检查文档完整性
✅ 定期审查文档准确性
✅ 删除过时文档
```

---

## 📦 标准化模板

### 1. 新项目初始化模板

```bash
# 创建标准目录结构
mkdir -p {lib/{domain,application,infrastructure},tests/{unit,integration,e2e}}
mkdir -p {PROJECT_CORE_DOCS,docs,prototypes}

# 创建核心文档
touch PROJECT_CORE_DOCS/01_项目背景.md
touch PROJECT_CORE_DOCS/02_功能需求和边界.md
touch PROJECT_CORE_DOCS/03_发展路线图.md
touch CLAUDE.md
touch README.md

# 配置开发工具
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
npm install -D husky lint-staged commitlint
npm install -D jest @testing-library/react @testing-library/jest-dom
```

### 2. CLAUDE.md 模板

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

### TDD强制执行
[TDD工作流规范]

### Git Commit规范
[Commit message格式]

### 测试覆盖率要求
[覆盖率标准]

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

### 3. UseCase 模板

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

### 4. 测试模板

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
    // 设置Mock
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

1. **过度设计** - 删除了30%+无用代码
2. **边界执行** - 部分功能重复实现CRS逻辑
3. **测试质量** - 部分测试覆盖率作弊
4. **文档同步** - 文档和代码不完全一致

### 下次项目改进建议 📝

1. **严格执行YAGNI** - 只实现P0功能
2. **提前定义边界** - 在CLAUDE.md中强化
3. **测试质量优先** - 重质量轻覆盖率
4. **文档即代码** - 文档和代码同步更新
5. **定期审查** - 每周检查是否过度设计
6. **原型先行** - 复杂功能先做HTML原型

---

## 📚 参考资源

### 项目内文档

- `PROJECT_CORE_DOCS/` - 项目核心文档
- `DDD_TDD_GIT_STANDARD.md` - 开发标准
- `PROJECT_CLEANUP_REPORT.md` - 清理报告

### 外部资源

- DDD: [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- TDD: [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- YAGNI: [You Aren't Gonna Need It](https://martinfowler.com/bliki/Yagni.html)
- Clean Architecture: [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**版本**: v1.0
**创建日期**: 2025-10-10
**维护者**: Claude Key Portal Team
**下次更新**: 应用到下一个项目后

---

_"简单优于复杂，可工作优于完美，迭代优于一次性，专注核心优于功能丰富"_
