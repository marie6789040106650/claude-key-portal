# 项目重组计划 - DDD Lite 迁移

> **状态**: 执行中
> **日期**: 2025-10-06
> **目标**: 按照 DDD_TDD_GIT_STANDARD.md 重组项目结构

## 📋 当前问题诊断

### 代码结构混乱

```
lib/
├── api/              # ❌ 客户端API调用混在服务端代码中
├── services/         # ❌ 业务逻辑+基础设施混合
├── crs-client.ts     # ❌ 外部服务未隔离
├── prisma.ts         # ❌ 数据库访问分散
└── utils/            # ✅ 工具函数还算合理
```

### 具体问题

1. **lib/services/auth.service.ts**
   - ❌ 直接访问 Prisma（应该通过Repository）
   - ❌ 包含业务逻辑（应该在Domain）
   - ❌ 包含JWT生成（应该在Infrastructure）

2. **lib/crs-client.ts**
   - ❌ 外部服务未隔离到infrastructure层

3. **lib/api/keys.ts**
   - ❌ 客户端API调用不应在lib目录

## 🎯 目标结构（DDD Lite）

```
lib/
├── domain/                   # 📦 领域层（业务逻辑）
│   ├── user/
│   │   ├── user.entity.ts        # 用户实体
│   │   ├── user.types.ts         # 用户类型
│   │   └── user.validation.ts    # 用户验证规则
│   ├── key/
│   │   ├── key.entity.ts
│   │   ├── key.types.ts
│   │   └── key.validation.ts
│   ├── stats/
│   │   ├── stats.entity.ts
│   │   └── stats.types.ts
│   └── shared/
│       ├── result.ts             # Result模式
│       └── errors.ts             # 领域错误
│
├── application/              # 🎯 应用层（用例编排）
│   ├── user/
│   │   ├── register.usecase.ts
│   │   ├── login.usecase.ts
│   │   ├── update-profile.usecase.ts
│   │   └── update-password.usecase.ts
│   ├── key/
│   │   ├── create-key.usecase.ts
│   │   ├── list-keys.usecase.ts
│   │   ├── update-key.usecase.ts
│   │   └── delete-key.usecase.ts
│   └── stats/
│       └── aggregate-stats.usecase.ts
│
├── infrastructure/           # 🔌 基础设施层（技术实现）
│   ├── persistence/
│   │   ├── prisma.ts             # Prisma客户端
│   │   └── repositories/
│   │       ├── user.repository.ts
│   │       ├── key.repository.ts
│   │       ├── session.repository.ts
│   │       └── stats.repository.ts
│   ├── external/
│   │   ├── crs-client.ts         # CRS集成
│   │   ├── email/
│   │   │   └── mailer.ts
│   │   └── webhook/
│   │       └── client.ts
│   ├── cache/
│   │   └── redis.ts
│   └── auth/
│       ├── jwt-service.ts        # JWT生成和验证
│       └── password-service.ts   # 密码加密和验证
│
└── utils/                    # 工具函数（保持现状）
    ├── date-utils.ts
    ├── avatar-utils.ts
    └── ui-utils.ts
```

## 🔄 迁移映射表

### 用户相关代码

| 当前位置 | 目标位置 | 职责 |
|---------|---------|------|
| `lib/services/auth.service.ts` → `checkUserExists` | `lib/infrastructure/persistence/repositories/user.repository.ts` | 数据访问 |
| `lib/services/auth.service.ts` → `createUser` | `lib/application/user/register.usecase.ts` | 业务编排 |
| `lib/services/auth.service.ts` → `verifyPassword` | `lib/infrastructure/auth/password-service.ts` | 技术实现 |
| `lib/services/auth.service.ts` → `generateTokens` | `lib/infrastructure/auth/jwt-service.ts` | 技术实现 |
| `lib/validation/auth.ts` | `lib/domain/user/user.validation.ts` | 业务规则 |

### 密钥相关代码

| 当前位置 | 目标位置 | 职责 |
|---------|---------|------|
| `lib/crs-client.ts` | `lib/infrastructure/external/crs-client.ts` | 外部服务 |
| `lib/api/keys.ts` | ❌ 删除（客户端代码） | 前端使用 |

### 基础设施代码

| 当前位置 | 目标位置 | 职责 |
|---------|---------|------|
| `lib/prisma.ts` | `lib/infrastructure/persistence/prisma.ts` | 数据库客户端 |
| `lib/redis.ts` | `lib/infrastructure/cache/redis.ts` | 缓存 |
| `lib/email/mailer.ts` | `lib/infrastructure/external/email/mailer.ts` | 外部服务 |
| `lib/webhook/client.ts` | `lib/infrastructure/external/webhook/client.ts` | 外部服务 |

## 📝 执行步骤

### Phase 1: 创建目录结构 ✅

```bash
mkdir -p lib/domain/{user,key,stats,shared}
mkdir -p lib/application/{user,key,stats}
mkdir -p lib/infrastructure/{persistence/repositories,external/{email,webhook},cache,auth}
```

### Phase 2: 创建领域层核心文件

**优先级高**（核心业务逻辑）:

1. `lib/domain/shared/result.ts` - Result模式
2. `lib/domain/shared/errors.ts` - 领域错误
3. `lib/domain/user/user.entity.ts` - 用户实体
4. `lib/domain/user/user.types.ts` - 用户类型
5. `lib/domain/key/key.entity.ts` - 密钥实体
6. `lib/domain/key/key.types.ts` - 密钥类型

### Phase 3: 创建基础设施层

**优先级高**（支撑业务）:

1. `lib/infrastructure/persistence/prisma.ts` - 移动现有代码
2. `lib/infrastructure/persistence/repositories/user.repository.ts`
3. `lib/infrastructure/persistence/repositories/key.repository.ts`
4. `lib/infrastructure/auth/password-service.ts`
5. `lib/infrastructure/auth/jwt-service.ts`
6. `lib/infrastructure/external/crs-client.ts` - 移动现有代码
7. `lib/infrastructure/cache/redis.ts` - 移动现有代码

### Phase 4: 创建应用层

**优先级中**（业务编排）:

1. `lib/application/user/register.usecase.ts`
2. `lib/application/user/login.usecase.ts`
3. `lib/application/key/create-key.usecase.ts`
4. `lib/application/key/list-keys.usecase.ts`

### Phase 5: 更新API路由

更新所有 `app/api/` 下的路由文件，调用应用层UseCase。

### Phase 6: 清理旧代码

删除或归档旧的文件：
- `lib/services/` - 删除
- `lib/api/keys.ts` - 删除（客户端代码）
- 移动后的文件 - 删除

### Phase 7: 更新导入路径

使用TypeScript编译器检查并修复所有导入路径。

## ✅ 验证清单

- [ ] TypeScript编译通过（`npm run typecheck`）
- [ ] 所有测试通过（`npm test`）
- [ ] 应用可以正常启动（`npm run dev`）
- [ ] 关键功能验证：
  - [ ] 用户注册
  - [ ] 用户登录
  - [ ] 创建密钥
  - [ ] 列出密钥
  - [ ] 删除密钥
  - [ ] 查看统计

## 📊 预期效果

### 改善点

| 指标 | 当前 | 目标 |
|-----|------|-----|
| **代码分层** | 混乱 | 清晰（4层） |
| **职责划分** | 不明确 | 明确 |
| **测试性** | 困难 | 容易（分层Mock） |
| **维护性** | 低 | 高 |

### 长期收益

1. **新功能开发更快** - 知道代码应该放在哪里
2. **测试更容易** - 每层可以独立测试
3. **重构风险低** - 边界清晰，影响范围小
4. **新人上手快** - 结构标准化

## 🚀 开始执行

```bash
git checkout -b feature/ddd-lite-refactoring
```

**下一步**: 创建目录结构并开始迁移代码
