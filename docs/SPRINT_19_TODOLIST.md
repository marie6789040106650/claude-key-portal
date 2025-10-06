# Sprint 19 Todolist - API 测试修复 (方案 B)

**Sprint 目标**: 修复中优先级 API 测试套件，为生产部署做准备
**预计工时**: 8-10 小时
**目标通过率**: 92%+
**开始日期**: 2025-10-06

---

## 📋 背景

根据 `TEST_FAILURE_ANALYSIS.md` 和 `TEST_FIX_DECISION_GUIDE.md`：

- Sprint 18 完成了方案 A（高优先级测试修复）
- 当前测试通过率：81.3% (725/892)
- Sprint 19 执行方案 B：修复中优先级 API 测试
- 目标：提升通过率至 92%+，为正式发布 v1.0 做准备

### 需要修复的测试套件 (7个)

#### 密钥管理 API (4 个套件)
1. `tests/integration/api/keys/create.test.ts`
2. `tests/integration/api/keys/update.test.ts`
3. `tests/integration/api/keys/delete.test.ts`
4. `tests/integration/api/keys/list.test.ts`

#### 统计 API (2 个套件)
5. `tests/integration/api/stats/dashboard.test.ts`
6. `tests/integration/api/stats/usage.test.ts`

#### 认证逻辑 (1 个套件)
7. `tests/unit/lib/auth.test.ts`

---

## 🎯 Phase 1: CRS Client Mock 设置 (1-2h)

### Task 1.1: 创建统一的 CRS Mock

```typescript
// tests/mocks/crs-client.mock.ts
import { CrsClient } from '@/lib/crs-client'

export const mockCrsClient = {
  createKey: jest.fn(),
  updateKey: jest.fn(),
  deleteKey: jest.fn(),
  listKeys: jest.fn(),
  getKeyStats: jest.fn(),
  getUsageTrend: jest.fn(),
  getDashboard: jest.fn(),
  healthCheck: jest.fn(),
}

jest.mock('@/lib/crs-client', () => ({
  crsClient: mockCrsClient,
}))
```

**验收标准**:
- [ ] Mock 文件创建完成
- [ ] 导出所有需要的 Mock 函数
- [ ] Jest Mock 配置正确

### Task 1.2: 更新 Jest Setup

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
import './tests/mocks/crs-client.mock'

// 全局清理 Mock
beforeEach(() => {
  jest.clearAllMocks()
})
```

**验收标准**:
- [ ] Jest Setup 包含 CRS Mock
- [ ] 自动清理 Mock 状态

---

## 🎯 Phase 2: 密钥管理 API 测试修复 (4-5h)

### Task 2.1: 修复 create.test.ts (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)

**失败原因**: 测试没有 Mock CRS Client，导致 `crsClient.createKey` 调用失败

**修复步骤**:

1. **🔴 RED**: 运行测试确认失败
```bash
npm test -- tests/integration/api/keys/create.test.ts
```

2. **🟢 GREEN**: 添加 CRS Mock
```typescript
import { mockCrsClient } from '@/tests/mocks/crs-client.mock'

describe('POST /api/keys', () => {
  beforeEach(() => {
    // Mock CRS 返回
    mockCrsClient.createKey.mockResolvedValue({
      id: 'crs-key-123',
      key: 'sk-test-xxx',
      name: 'Test Key',
      description: 'Test Description',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    })

    // Mock Prisma 创建本地映射
    ;(prisma.apiKey.create as jest.Mock).mockResolvedValue({
      id: 'local-key-123',
      userId: 'user-123',
      crsKeyId: 'crs-key-123',
      crsKey: 'sk-test-xxx',
      name: 'Test Key',
      createdAt: new Date(),
    })
  })

  it('应该成功创建密钥', async () => {
    const response = await POST(mockRequest)

    expect(response.status).toBe(200)
    expect(mockCrsClient.createKey).toHaveBeenCalledWith({
      name: 'Test Key',
      description: 'Test Description',
    })
    expect(prisma.apiKey.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        crsKeyId: 'crs-key-123',
        crsKey: 'sk-test-xxx',
        name: 'Test Key',
      },
    })
  })
})
```

3. **🔵 REFACTOR**: 提取通用 Mock Setup
```typescript
// tests/helpers/crs-mocks.ts
export function setupCrsCreateKeyMock(data: Partial<CrsKeyResponse>) {
  mockCrsClient.createKey.mockResolvedValue({
    id: 'crs-key-123',
    key: 'sk-test-xxx',
    name: 'Test Key',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    ...data,
  })
}
```

**验收标准**:
- [ ] 所有测试通过 (🟢 GREEN)
- [ ] CRS Mock 配置正确
- [ ] Prisma Mock 数据结构正确
- [ ] 错误处理测试覆盖（CRS 不可用、验证失败）

**Git Commit**:
```bash
git add tests/integration/api/keys/create.test.ts tests/helpers/crs-mocks.ts
git commit -m "test: fix keys create API tests with CRS mocks (🟢 GREEN)"
```

---

### Task 2.2: 修复 update.test.ts (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)

**失败原因**: 同样缺少 CRS Mock，且需要更新数据结构

**修复步骤**:

1. **🔴 RED**: 确认测试失败
```bash
npm test -- tests/integration/api/keys/update.test.ts
```

2. **🟢 GREEN**: 添加 Mock 和更新逻辑
```typescript
beforeEach(() => {
  mockCrsClient.updateKey.mockResolvedValue({
    id: 'crs-key-123',
    name: 'Updated Key',
    description: 'Updated Description',
    status: 'ACTIVE',
  })

  ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
    id: 'local-key-123',
    name: 'Updated Key',
    updatedAt: new Date(),
  })
})

it('应该成功更新密钥', async () => {
  const response = await PUT(mockRequest, { params: { id: 'local-key-123' } })

  expect(mockCrsClient.updateKey).toHaveBeenCalledWith('crs-key-123', {
    name: 'Updated Key',
    description: 'Updated Description',
  })
})
```

3. **🔵 REFACTOR**: 复用 Mock Helper

**验收标准**:
- [ ] 所有测试通过
- [ ] 验证 CRS 和 Prisma 同步更新
- [ ] 错误场景测试（密钥不存在、权限不足）

**Git Commit**:
```bash
git add tests/integration/api/keys/update.test.ts
git commit -m "test: fix keys update API tests (🟢 GREEN)"
```

---

### Task 2.3: 修复 delete.test.ts (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)

**修复步骤**:

1. **🔴 RED**: 运行测试
2. **🟢 GREEN**: Mock CRS 删除逻辑
```typescript
beforeEach(() => {
  mockCrsClient.deleteKey.mockResolvedValue({ success: true })

  ;(prisma.apiKey.delete as jest.Mock).mockResolvedValue({
    id: 'local-key-123',
  })
})

it('应该成功删除密钥', async () => {
  const response = await DELETE(mockRequest, { params: { id: 'local-key-123' } })

  expect(mockCrsClient.deleteKey).toHaveBeenCalledWith('crs-key-123')
  expect(prisma.apiKey.delete).toHaveBeenCalledWith({
    where: { id: 'local-key-123' },
  })
})
```

3. **🔵 REFACTOR**: 清理重复代码

**验收标准**:
- [ ] 删除测试通过
- [ ] 验证级联删除（本地 + CRS）
- [ ] 错误处理（密钥不存在、CRS 失败）

**Git Commit**:
```bash
git add tests/integration/api/keys/delete.test.ts
git commit -m "test: fix keys delete API tests (🟢 GREEN)"
```

---

### Task 2.4: 修复 list.test.ts (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)

**修复步骤**:

1. **🔴 RED**: 运行测试
2. **🟢 GREEN**: Mock 列表查询
```typescript
beforeEach(() => {
  ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
    {
      id: 'key-1',
      userId: 'user-123',
      crsKeyId: 'crs-1',
      crsKey: 'sk-xxx',
      name: 'Key 1',
      createdAt: new Date(),
    },
  ])
})

it('应该返回用户的所有密钥', async () => {
  const response = await GET(mockRequest)
  const data = await response.json()

  expect(data).toHaveLength(1)
  expect(data[0].name).toBe('Key 1')
})
```

3. **🔵 REFACTOR**: 优化查询逻辑

**验收标准**:
- [ ] 列表查询测试通过
- [ ] 分页测试覆盖
- [ ] 过滤和排序测试

**Git Commit**:
```bash
git add tests/integration/api/keys/list.test.ts
git commit -m "test: fix keys list API tests (🟢 GREEN)"
```

---

## 🎯 Phase 3: 统计 API 测试修复 (2-3h)

### Task 3.1: 修复 dashboard.test.ts

**失败原因**: React Query Mock 不完整，Chart 组件渲染失败

**修复步骤**:

1. **🔴 RED**: 运行测试
```bash
npm test -- tests/integration/api/stats/dashboard.test.ts
```

2. **🟢 GREEN**: Mock CRS Dashboard API
```typescript
beforeEach(() => {
  mockCrsClient.getDashboard.mockResolvedValue({
    totalKeys: 10,
    activeKeys: 8,
    totalRequests: 1000,
    totalTokens: 50000,
    successRate: 98.5,
    avgResponseTime: 250,
  })
})

it('应该返回仪表板统计', async () => {
  const response = await GET(mockRequest)
  const data = await response.json()

  expect(data.totalKeys).toBe(10)
  expect(mockCrsClient.getDashboard).toHaveBeenCalled()
})
```

3. **🔵 REFACTOR**: 提取 Dashboard Mock Helper

**验收标准**:
- [ ] Dashboard API 测试通过
- [ ] 数据聚合逻辑正确
- [ ] 缓存测试覆盖

**Git Commit**:
```bash
git add tests/integration/api/stats/dashboard.test.ts
git commit -m "test: fix dashboard API tests (🟢 GREEN)"
```

---

### Task 3.2: 修复 usage.test.ts

**失败原因**: CRS 统计接口 Mock 缺失

**修复步骤**:

1. **🔴 RED**: 运行测试
2. **🟢 GREEN**: Mock Usage Trend API
```typescript
beforeEach(() => {
  mockCrsClient.getUsageTrend.mockResolvedValue({
    trend: [
      { date: '2025-10-01', requests: 100, tokens: 5000 },
      { date: '2025-10-02', requests: 120, tokens: 6000 },
    ],
  })
})

it('应该返回使用趋势', async () => {
  const response = await GET(mockRequest, {
    params: { range: '7d' },
  })
  const data = await response.json()

  expect(data.trend).toHaveLength(2)
  expect(mockCrsClient.getUsageTrend).toHaveBeenCalledWith({
    range: '7d',
  })
})
```

3. **🔵 REFACTOR**: 统一趋势数据格式

**验收标准**:
- [ ] Usage API 测试通过
- [ ] 时间范围过滤测试
- [ ] 数据聚合测试

**Git Commit**:
```bash
git add tests/integration/api/stats/usage.test.ts
git commit -m "test: fix usage stats API tests (🟢 GREEN)"
```

---

## 🎯 Phase 4: 认证逻辑测试修复 (0.5-1h)

### Task 4.1: 修复 auth.test.ts

**失败原因**: JWT Mock 配置问题

**修复步骤**:

1. **🔴 RED**: 运行测试
```bash
npm test -- tests/unit/lib/auth.test.ts
```

2. **🟢 GREEN**: 修复 JWT Mock
```typescript
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken')

describe('Auth Library', () => {
  beforeEach(() => {
    ;(jwt.sign as jest.Mock).mockReturnValue('mock-token')
    ;(jwt.verify as jest.Mock).mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
    })
  })

  it('应该生成有效的 Token', () => {
    const token = generateToken({ userId: 'user-123', email: 'test@example.com' })

    expect(token).toBe('mock-token')
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: 'user-123', email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
  })

  it('应该验证 Token', () => {
    const decoded = verifyToken('mock-token')

    expect(decoded.userId).toBe('user-123')
    expect(jwt.verify).toHaveBeenCalledWith('mock-token', process.env.JWT_SECRET)
  })
})
```

3. **🔵 REFACTOR**: 提取 Auth Test Helpers

**验收标准**:
- [ ] Token 生成测试通过
- [ ] Token 验证测试通过
- [ ] 过期 Token 测试
- [ ] 无效 Token 测试

**Git Commit**:
```bash
git add tests/unit/lib/auth.test.ts
git commit -m "test: fix auth library tests with JWT mocks (🟢 GREEN)"
```

---

## 🎯 Phase 5: 完整验证 (1h)

### Task 5.1: 运行完整测试套件

```bash
npm test -- --coverage
```

**验收标准**:
- [ ] 测试通过率 ≥ 92%
- [ ] 覆盖率保持 ≥ 80%
- [ ] 无失败测试（除已标记为 skip 的）
- [ ] 构建成功

### Task 5.2: 检查测试稳定性

```bash
# 运行 3 次确保测试稳定
npm test
npm test
npm test
```

**验收标准**:
- [ ] 测试结果一致
- [ ] 无随机失败
- [ ] Mock 清理正确

---

## 🎯 Phase 6: 文档和总结 (0.5h)

### Task 6.1: 更新 SPRINT_INDEX.md

```markdown
### Sprint 19: API 测试修复 (方案 B) ✅

**时间**: 2025-10-06
**目标**: 修复中优先级 API 测试，提升测试覆盖率
**结果**:
- 修复 7 个测试套件
- 测试通过率: 81.3% → 92%+
- 覆盖率: 保持 80%+
```

### Task 6.2: 创建 Sprint 19 总结文档

```bash
# 创建文档
touch docs/SPRINT_19_SUMMARY.md

# 内容包括:
- 修复的测试列表
- 测试通过率变化
- 遇到的技术问题和解决方案
- 下一步建议
```

### Task 6.3: 合并到 develop 并创建下一阶段 Todolist

```bash
# 1. 切换到 develop
git checkout develop

# 2. 合并 Sprint 19
git merge feature/sprint-19-api-tests

# 3. 推送
git push origin develop

# 4. 创建 Sprint 20 Todolist (如果需要)
# 或者标记项目进入部署准备阶段
```

**验收标准**:
- [ ] SPRINT_INDEX.md 更新
- [ ] SPRINT_19_SUMMARY.md 创建
- [ ] Git 合并完成
- [ ] 分支清理完成

---

## 📊 预期成果

### 测试统计改善
- **修复前**: 725 passed, 153 failed (81.3%)
- **修复后**: ~820 passed, ~58 failed (92%+)
- **覆盖率**: 保持 80%+

### 修复的测试套件
- ✅ keys/create.test.ts
- ✅ keys/update.test.ts
- ✅ keys/delete.test.ts
- ✅ keys/list.test.ts
- ✅ stats/dashboard.test.ts
- ✅ stats/usage.test.ts
- ✅ lib/auth.test.ts

### 技术改进
- ✅ 统一的 CRS Mock 策略
- ✅ Jest Setup 优化
- ✅ 测试稳定性提升
- ✅ 为生产部署做好准备

---

## 🚀 后续建议

**如果选择方案 C（完全修复）**:
- Sprint 20: 修复低优先级测试（组件测试、页面测试）
- 预计工时: 8-10 小时
- 目标通过率: 98%+

**如果进入部署准备**:
- Sprint 20: 部署前优化
  - 性能优化（`<img>` → `next/image`）
  - SEO 优化
  - 错误监控集成（Sentry）
  - 生产环境配置

---

**创建时间**: 2025-10-06
**Sprint 负责人**: Claude
**估计完成时间**: 8-10 小时

---

_"方案 B 是部署前的最佳准备，确保 API 功能完整验证！"_
