# CRS集成开发标准 - 混合测试方案

> **项目决策**: 所有涉及CRS系统的功能开发，必须采用混合测试方案
> **更新时间**: 2025-10-03
> **适用范围**: 所有Sprint开发流程

---

## 🎯 核心原则

**混合测试方案 = TDD单元测试（Mock）+ 功能完成后集成验证**

```
开发阶段 (80%时间)     验证阶段 (20%时间)
     ↓                      ↓
🔴 RED (Mock测试)    →  ✅ 集成验证
🟢 GREEN (实现)      →  🔧 修复问题
🔵 REFACTOR (重构)   →  ✅ 确认通过
```

---

## 📐 标准开发流程

### 阶段1: TDD开发（使用Mock）

#### 1.1 创建Feature分支
```bash
git checkout -b feature/xxx-with-crs
```

#### 1.2 编写单元测试（🔴 RED）
```typescript
// tests/unit/xxx.test.ts

// ✅ 必须Mock CRS Client
jest.mock('@/lib/crs-client', () => ({
  crsClient: {
    createKey: jest.fn(),
    updateKey: jest.fn(),
    deleteKey: jest.fn(),
  },
}))

describe('XXX功能', () => {
  beforeEach(() => {
    // Mock返回数据
    ;(crsClient.createKey as jest.Mock).mockResolvedValue({
      id: 'test_id',
      key: 'sk-ant-test',
      status: 'ACTIVE',
    })
  })

  test('应该能够XXX', async () => {
    // 测试业务逻辑
  })
})
```

**要求**:
- ✅ 覆盖所有业务逻辑
- ✅ 覆盖所有错误场景
- ✅ 覆盖边界条件
- ✅ 测试运行时间 < 5秒

**提交**:
```bash
git commit -m "test: add XXX tests with CRS mock (🔴 RED)"
```

#### 1.3 实现代码（🟢 GREEN）
```typescript
// app/api/xxx/route.ts

import { crsClient } from '@/lib/crs-client'
import { handleCrsError } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    // 调用CRS API
    const result = await crsClient.createKey(data)

    // 处理结果
    return NextResponse.json(result)
  } catch (error: any) {
    return handleCrsError(error)
  }
}
```

**要求**:
- ✅ 所有单元测试通过
- ✅ 使用统一的错误处理（handleCrsError）
- ✅ TypeScript类型完整

**提交**:
```bash
git commit -m "feat: implement XXX with CRS integration (🟢 GREEN)"
```

#### 1.4 代码重构（🔵 REFACTOR）
```typescript
// 提取公共逻辑
// 优化代码结构
```

**要求**:
- ✅ 所有测试仍然通过
- ✅ 代码更清晰易读

**提交**:
```bash
git commit -m "refactor: optimize XXX implementation (🔵 REFACTOR)"
```

---

### 阶段2: 集成验证（真实CRS）

#### 2.1 准备集成测试脚本

每个功能都需要对应的集成测试：

```typescript
// scripts/test-crs-xxx.ts

import { crsClient } from '@/lib/crs-client'

async function testXXXIntegration() {
  console.log('🔍 测试XXX与CRS集成...\n')

  try {
    // 1. 测试功能
    console.log('1️⃣ 测试XXX...')
    const result = await crsClient.xxx()
    console.log('✅ XXX成功!')
    console.log('   结果:', result, '\n')

    // 2. 验证数据格式
    console.log('2️⃣ 验证响应格式...')
    if (!result.id || !result.xxx) {
      throw new Error('响应格式不匹配')
    }
    console.log('✅ 格式验证通过!\n')

    console.log('🎉 XXX集成测试通过!')
  } catch (error: any) {
    console.error('❌ 集成测试失败:', error)
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
    })
    process.exit(1)
  }
}

testXXXIntegration()
```

#### 2.2 运行集成测试

**时机**: 功能开发完成后立即运行

```bash
# 运行集成测试
npx tsx scripts/test-crs-xxx.ts
```

#### 2.3 处理集成测试结果

**情况A: 测试通过 ✅**
```bash
# 记录测试结果
echo "✅ XXX集成测试通过 - $(date)" >> docs/INTEGRATION_TEST_LOG.md

# 继续下一步
```

**情况B: 测试失败 ❌**
```bash
# 1. 分析错误
# - API路径错误？
# - 响应字段名不匹配？
# - 认证失败？
# - 超时设置不够？

# 2. 修复代码
# 调整实现以匹配真实CRS响应

# 3. 重新运行单元测试（确保仍然通过）
npm test

# 4. 再次运行集成测试
npx tsx scripts/test-crs-xxx.ts

# 5. 提交修复
git commit -m "fix: adjust XXX to match CRS API response"
```

#### 2.4 更新集成测试文档

```bash
# 记录CRS API实际响应格式
echo "## XXX API实际响应" >> docs/CRS_API_ACTUAL_RESPONSES.md
echo '```json' >> docs/CRS_API_ACTUAL_RESPONSES.md
echo '{实际响应JSON}' >> docs/CRS_API_ACTUAL_RESPONSES.md
echo '```' >> docs/CRS_API_ACTUAL_RESPONSES.md
```

---

### 阶段3: 完成和合并

#### 3.1 确认检查清单

```markdown
Sprint X - XXX功能完成检查清单

开发阶段:
- [ ] ✅ 单元测试编写完成（🔴 RED）
- [ ] ✅ 代码实现完成（🟢 GREEN）
- [ ] ✅ 代码重构完成（🔵 REFACTOR）
- [ ] ✅ 所有单元测试通过（100%）

集成验证:
- [ ] ✅ 集成测试脚本编写完成
- [ ] ✅ 集成测试通过
- [ ] ✅ CRS响应格式记录
- [ ] ✅ 问题修复（如果有）
- [ ] ✅ 集成测试结果记录

文档:
- [ ] ✅ API文档更新
- [ ] ✅ 集成测试日志更新
- [ ] ✅ Sprint总结文档
```

#### 3.2 合并到develop

```bash
# 确保所有检查通过
git checkout develop
git merge feature/xxx-with-crs --no-ff -m "Merge: XXX功能（已验证CRS集成）"
```

---

## 📊 每个Sprint的标准流程

### Sprint N 开发流程图

```
Day 1-2: 🔴 RED Phase
├─ 编写Mock单元测试
├─ 测试所有业务逻辑
└─ 提交测试代码

Day 3-4: 🟢 GREEN Phase
├─ 实现功能代码
├─ 单元测试通过
└─ 提交实现代码

Day 5: 🔵 REFACTOR Phase
├─ 代码重构
├─ 单元测试仍通过
└─ 提交重构代码

Day 5下午: ✅ 集成验证 ← 关键步骤！
├─ 编写集成测试脚本
├─ 运行真实CRS测试
├─ 修复发现的问题
├─ 记录测试结果
└─ 合并到develop

Day 6: 📝 Sprint总结
└─ 创建Sprint总结文档
```

---

## 🛠️ 工具和脚本标准

### 集成测试脚本模板

每个Sprint创建对应的集成测试：

```bash
scripts/
├── test-crs-connection.ts       # 基础连接测试
├── test-crs-keys.ts             # Sprint 2 - 密钥管理
├── test-crs-stats.ts            # Sprint 3 - 统计数据
├── test-crs-dashboard.ts        # Sprint 3 - 仪表板
└── test-crs-all.ts              # 运行所有集成测试
```

### 统一运行脚本

```typescript
// scripts/test-crs-all.ts

import { execSync } from 'child_process'

const tests = [
  'test-crs-connection.ts',
  'test-crs-keys.ts',
  'test-crs-stats.ts',
  'test-crs-dashboard.ts',
]

console.log('🚀 运行所有CRS集成测试...\n')

for (const test of tests) {
  console.log(`\n📋 运行: ${test}`)
  console.log('='.repeat(50))

  try {
    execSync(`npx tsx scripts/${test}`, { stdio: 'inherit' })
    console.log(`✅ ${test} 通过\n`)
  } catch (error) {
    console.error(`❌ ${test} 失败\n`)
    process.exit(1)
  }
}

console.log('\n🎉 所有CRS集成测试通过!')
```

---

## 📝 文档记录标准

### 集成测试日志

```markdown
# CRS集成测试日志

## Sprint 2 - API密钥管理
- **测试时间**: 2025-10-03 14:30
- **测试人员**: Claude
- **测试结果**: ✅ 通过
- **CRS版本**: v1.2.0
- **发现问题**: 无
- **修复情况**: N/A

## Sprint 3 - 使用统计
- **测试时间**: 2025-10-04 10:00
- **测试人员**: Claude
- **测试结果**: ❌ 失败
- **发现问题**: 响应字段名不匹配（totalToken vs totalTokens）
- **修复情况**: ✅ 已修复并重新测试通过
```

### CRS API实际响应记录

```markdown
# CRS API实际响应格式

## POST /admin/api-keys (创建密钥)

**实际响应**:
\`\`\`json
{
  "success": true,
  "data": {
    "id": "key_abc123",
    "key": "sk-ant-api03-xxx",
    "name": "test_key",
    "status": "ACTIVE",
    "createdAt": "2025-10-03T10:00:00.000Z"
  }
}
\`\`\`

**代码中的期望**:
\`\`\`typescript
interface CrsKeyResponse {
  id: string
  key: string
  name: string
  status: string
  createdAt: Date
}
\`\`\`

**匹配状态**: ✅ 完全匹配
```

---

## ⚠️ 常见问题和解决方案

### Q1: 集成测试失败，但单元测试通过？

**原因**: Mock数据和真实CRS响应格式不匹配

**解决**:
1. 查看CRS实际响应
2. 调整代码以匹配真实格式
3. 更新Mock数据以反映真实格式
4. 重新运行所有测试

### Q2: CRS服务不可用怎么办？

**处理**:
1. 检查网络连接
2. 检查CRS服务状态
3. 如果是临时故障，稍后重试
4. 如果长期不可用，联系CRS维护团队

### Q3: 集成测试很慢影响开发？

**优化**:
1. 不要在每次提交时运行集成测试
2. 只在功能完成后运行一次
3. 使用缓存减少重复调用
4. 考虑在CI/CD中异步运行

### Q4: 如何测试CRS错误场景？

**方法**:
1. 单元测试：Mock各种错误响应
2. 集成测试：只测试正常流程
3. 手动测试：必要时手动触发错误场景

---

## 🎯 成功标准

每个Sprint结束时，必须满足：

### 单元测试标准
- ✅ 测试覆盖率 > 80%
- ✅ 所有测试通过（100%）
- ✅ 测试运行时间 < 5秒

### 集成测试标准
- ✅ 所有CRS API调用已验证
- ✅ 响应格式已记录
- ✅ 无未解决的格式问题
- ✅ 集成测试日志已更新

### 文档标准
- ✅ API文档完整
- ✅ 集成测试脚本存在
- ✅ Sprint总结包含集成验证结果

---

## 📋 Sprint 2回顾（示例）

### 当前状态
- ✅ 单元测试：93个测试，100%通过
- ❌ 集成测试：**待运行**
- ❌ CRS验证：**待完成**

### 下一步行动
```bash
# 1. 运行集成测试
npx tsx scripts/test-crs-connection.ts

# 2. 处理结果
# - 成功：更新文档，继续Sprint 3
# - 失败：修复问题，重新测试

# 3. 记录结果
echo "Sprint 2集成测试结果" >> docs/INTEGRATION_TEST_LOG.md
```

---

## 🚀 Sprint 3及后续Sprint标准

**从Sprint 3开始，严格执行混合方案**:

### 每个Sprint必须包含

1. **TDD阶段**（Day 1-4）
   - Mock单元测试
   - 代码实现
   - 重构

2. **集成验证**（Day 5）← 强制执行
   - 编写集成测试脚本
   - 运行真实CRS测试
   - 修复问题
   - 记录结果

3. **Sprint总结**（Day 6）
   - 包含集成测试结果
   - 记录发现的问题
   - 更新API文档

---

**标准执行**: 所有涉及CRS的功能，必须完成集成验证才能合并到develop分支！

**责任人**: 每个Sprint的开发者
**检查人**: Code Review时验证集成测试是否运行
**记录**: 所有集成测试结果必须记录到文档

---

**本文档状态**: ✅ 生效
**适用范围**: Sprint 2回顾 + Sprint 3及以后所有Sprint
**更新记录**: 2025-10-03 - 初始版本
