# 测试策略 - Claude Key Portal

## 🎯 测试金字塔

```
        /\
       /  \     E2E测试 (5%)
      /    \    - Playwright测试完整用户流程
     /------\   - 每个Sprint结束运行
    /        \
   /   集成   \  集成测试 (15%)
  /   测试    \ - 验证CRS真实对接
 /  15%      \  - 每天运行一次（CI/CD）
/------------\
/            \ 单元测试 (80%)
/   单元测试   \ - Mock所有外部依赖
/     80%     \ - 每次提交都运行
```

---

## 📋 分层测试策略

### 第1层: 单元测试（Unit Tests）- 80%

**目的**: 验证业务逻辑、边界条件、错误处理

**特点**:
- ✅ Mock所有外部依赖（Prisma、CRS、JWT）
- ✅ 运行快速（< 5秒）
- ✅ 稳定可靠（不依赖网络）
- ✅ 覆盖各种边界情况

**示例**:
```typescript
// tests/unit/keys/create.test.ts
jest.mock('@/lib/crs-client', () => ({
  crsClient: {
    createKey: jest.fn(),  // Mock CRS
  },
}))

test('应该拒绝重复的密钥名称', async () => {
  // 测试业务逻辑，不依赖真实CRS
})
```

**何时运行**:
- ✅ 每次提交前
- ✅ Pre-commit hook
- ✅ CI/CD每次push

---

### 第2层: 集成测试（Integration Tests）- 15%

**目的**: 验证与真实外部系统的对接

**特点**:
- ✅ 使用真实CRS系统
- ✅ 验证API格式匹配
- ⚠️ 运行较慢（网络延迟）
- ⚠️ 可能不稳定（网络问题）

**示例**:
```typescript
// tests/integration/crs-integration.test.ts
// 不使用Mock，直接调用真实CRS

test('应该能够在CRS创建密钥', async () => {
  const result = await crsClient.createKey({...})
  expect(result.key).toMatch(/^sk-ant-/)
})
```

**何时运行**:
- ✅ 功能开发完成后立即验证
- ✅ 每天定时运行（CI/CD nightly build）
- ✅ 部署到staging前
- ❌ 不在每次提交时运行

---

### 第3层: E2E测试（End-to-End Tests）- 5%

**目的**: 验证完整用户流程

**特点**:
- ✅ 模拟真实用户操作
- ✅ 浏览器自动化测试
- ⚠️ 运行最慢
- ⚠️ 最容易出问题

**示例**:
```typescript
// tests/e2e/key-management.spec.ts
test('用户可以创建和删除密钥', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'test@example.com')
  // ... 完整流程
})
```

**何时运行**:
- ✅ Sprint结束前
- ✅ 部署到production前
- ❌ 不在开发过程中频繁运行

---

## 🔄 开发流程中的测试时机

### 阶段1: TDD开发 - 单元测试（当前）

```bash
# 1. 🔴 RED: 写单元测试（Mock）
git commit -m "test: add key creation tests"

# 2. 🟢 GREEN: 实现代码
git commit -m "feat: implement key creation"

# 3. 🔵 REFACTOR: 重构
git commit -m "refactor: extract utilities"

# 运行测试: < 2秒
npm test
```

**特点**: 快速迭代，聚焦业务逻辑

---

### 阶段2: 集成验证 - 手动测试（功能完成后立即）

```bash
# 功能开发完成后，立即运行集成测试
npx tsx scripts/test-crs-connection.ts

# 或运行集成测试套件
RUN_INTEGRATION_TESTS=true npm test -- tests/integration
```

**时机**:
- ✅ **Sprint 2完成后 → 现在应该做！**
- ✅ 每个大功能完成后
- ✅ API调用逻辑修改后

**目的**: 早期发现问题，避免积累

---

### 阶段3: 持续集成 - 自动化测试（CI/CD）

```yaml
# .github/workflows/test.yml
name: Test

on: [push]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm test  # 每次提交运行

  integration-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'  # 只在develop分支
    steps:
      - run: RUN_INTEGRATION_TESTS=true npm test

  nightly-integration:
    runs-on: ubuntu-latest
    schedule:
      - cron: '0 2 * * *'  # 每天凌晨2点
    steps:
      - run: RUN_INTEGRATION_TESTS=true npm test
```

---

## 💡 当前项目建议

### Sprint 2（已完成）
- ✅ 单元测试：93个测试用Mock
- ❌ 集成测试：**现在应该立即做**

### 立即执行的步骤

#### Step 1: 快速集成验证（5分钟）
```bash
npx tsx scripts/test-crs-connection.ts
```

**预期**:
- ✅ 成功 → CRS对接正常，继续开发
- ❌ 失败 → 修复API格式，调整代码

#### Step 2: 修复发现的问题（如果有）
```bash
# 根据错误调整代码
# 例如：CRS响应字段名不匹配
```

#### Step 3: 添加关键集成测试（10分钟）
```bash
# 只测试关键路径，不是全覆盖
RUN_INTEGRATION_TESTS=true npm test -- tests/integration
```

#### Step 4: 记录集成测试结果
```bash
# 创建集成测试报告
# 记录CRS API实际响应格式
```

---

## 📊 测试覆盖率要求

| 测试类型 | 目标覆盖 | 运行频率 |
|---------|---------|---------|
| 单元测试 | 80%+ | 每次提交 |
| 集成测试 | 关键路径100% | 每天/每次功能完成 |
| E2E测试 | 核心流程覆盖 | Sprint结束 |

---

## 🎯 总结：混合方案

```
开发时 → 单元测试（Mock，快速迭代）
  ↓
功能完成 → 集成测试（真实CRS，验证对接）← 现在应该做！
  ↓
Sprint结束 → E2E测试（完整流程）
  ↓
部署前 → 全量测试（所有层级）
```

---

## ⚠️ 常见误区

❌ **误区1**: "TDD就是要测试真实系统"
✅ **正确**: TDD的单元测试应该隔离外部依赖

❌ **误区2**: "集成测试可以完全替代单元测试"
✅ **正确**: 需要测试金字塔，大量单元测试 + 少量集成测试

❌ **误区3**: "集成测试应该每次提交都运行"
✅ **正确**: 集成测试应该定期运行，不是每次提交

❌ **误区4**: "发现集成问题说明TDD失败了"
✅ **正确**: 这很正常，集成测试就是为了发现这些问题

---

**下一步行动**: 立即运行 `npx tsx scripts/test-crs-connection.ts` 验证CRS对接！
