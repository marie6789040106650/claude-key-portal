# Claude Key Portal - 下一阶段工作提示词

## 📍 项目背景

继续 Claude Key Portal 项目开发。

**项目路径**: `/Users/bypasser/claude-project/0930/claude-key-portal`

**当前分支**: `feature/p2-usage-analytics`

---

## 🎯 工作目标

基于CRS API对接验证的最新发现，**验证并修正已有代码**，然后继续P2功能开发。

### ⚠️ 关键发现（必须遵循）

**最新验证完成** (2025-10-09):
- ✅ 完整集成测试通过（6/6步骤）
- ✅ 所有API请求/响应格式已记录
- ✅ 发现多个与之前假设不符的问题

**重要修正**:

1. **API Key字段名**:
   ```typescript
   // ❌ 错误假设（可能在现有代码中使用）
   response.data.key

   // ✅ 实际字段名（必须使用）
   response.data.apiKey
   ```

2. **API路径**:
   ```typescript
   // ❌ 错误路径
   /apiStats/get-key-id
   /apiStats/user-stats

   // ✅ 正确路径
   /apiStats/api/get-key-id
   /apiStats/api/user-stats
   ```

3. **Stats API认证**:
   ```typescript
   // ❌ 错误假设：使用Bearer token
   headers: { Authorization: `Bearer ${token}` }

   // ✅ 实际方式：使用apiKey或apiId参数
   body: { apiKey: 'cr_...' }  // 或
   body: { apiId: 'uuid' }
   ```

4. **完整数据结构**:
   - 创建API Key返回30+字段（不只是id和key）
   - 用户统计包含usage/limits/accounts/restrictions
   - 模型统计支持daily/monthly周期
   - 所有金额字段有formattedCost版本

**参考文档** (必读):
- `docs/CRS_API_INTEGRATION_SPECIFICATION.md` - 完整API规范（32KB）
- `docs/CRS_INTEGRATION_TEST_REPORT.json` - 实际请求/响应示例
- `docs/EXECUTION_PLAN.md` - P2.1章节（第531-652行）
- `docs/KNOWN_ISSUES.md` - ISSUE-006更新（第501-548行）

---

## 📋 任务清单

### 阶段1: 验证和修正 (优先级P0)

**目标**: 确保现有代码符合最新的API验证结果

```bash
# 1. 检查当前Git状态
git status
git log --oneline -5

# 2. 搜索可能存在的问题
```

**需要检查的内容**:

1. **数据库Schema验证**:
   ```bash
   # 检查ApiKey模型字段
   grep -n "model ApiKey" prisma/schema.prisma -A 20

   # 确认字段：
   # - crsKeyId  String  // CRS的UUID
   # - crsKey    String  // 实际的API key (cr_...)
   # - 是否有错误的 "key" 字段？
   ```

2. **TypeScript类型定义检查**:
   ```bash
   # 搜索可能的错误字段名
   grep -rn "\.key" lib/ app/ --include="*.ts" --include="*.tsx"
   grep -rn "data\.key" lib/ app/ --include="*.ts" --include="*.tsx"

   # 应该使用 .apiKey
   grep -rn "\.apiKey" lib/ app/ --include="*.ts" --include="*.tsx"
   ```

3. **API路径检查**:
   ```bash
   # 检查是否使用了错误的路径
   grep -rn "/apiStats/" lib/ app/ --include="*.ts" --include="*.tsx"

   # 正确路径应该是 /apiStats/api/
   ```

4. **API Client实现检查**:
   ```bash
   # 查找CRS客户端实现
   find lib/ -name "*crs*" -o -name "*client*"

   # 检查认证方式是否正确
   ```

**如果发现问题**:
- 使用TDD流程修复（🔴 写失败测试 → 🟢 修复代码 → 🔵 重构）
- 立即提交修复：`fix: correct CRS API field names/paths based on integration test`

### 阶段2: 继续P2功能开发

读取 `docs/EXECUTION_PLAN.md` 查看P2任务清单（第497-515行），继续实现。

**参考实施计划**（第634-644行）:

| 任务 | 预计时间 | 状态 |
|------|---------|------|
| CRS Client封装（认证、token缓存） | 1天 | 待开始 |
| API Key管理功能（创建/删除） | 1.5天 | 待开始 |
| 统计查询功能（用户/模型统计） | 1.5天 | 待开始 |
| 数据可视化（图表展示） | 1天 | 待开始 |
| 错误处理和降级策略 | 0.5天 | 待开始 |

---

## 🔧 开发规范

### 必须遵循

1. **TDD流程** (强制):
   ```
   🔴 RED: 先写测试（必须失败）
   🟢 GREEN: 实现功能（让测试通过）
   🔵 REFACTOR: 重构优化（保持测试通过）
   ```

2. **Git提交规范**:
   ```bash
   # 格式
   <type>(<scope>): <subject> (<tdd-phase>)

   # 示例
   test(crs): add API key creation test (🔴 RED)
   feat(crs): implement CRS client with auth (🟢 GREEN)
   refactor(crs): extract token cache logic (🔵 REFACTOR)
   fix(crs): correct apiKey field name (🔧 FIX)
   ```

3. **使用实际的API数据结构**:
   ```typescript
   // 参考 docs/CRS_INTEGRATION_TEST_REPORT.json
   // 所有类型定义必须与实际响应匹配

   interface CrsCreateKeyResponse {
     success: boolean
     data: {
       id: string                    // ← CRS的UUID
       apiKey: string                // ← 实际密钥（不是key！）
       name: string
       // ... 还有27个字段，见报告第115-156行
     }
   }
   ```

4. **并行执行原则**:
   - 如果多个任务相互独立，同时开始它们的测试和实现
   - 例如：可以并行创建CRS Client的多个方法测试

---

## 📝 执行步骤

1. **检查当前状态**:
   ```bash
   git branch
   git status
   git log --oneline -5
   ```

2. **读取核心文档**:
   - `docs/EXECUTION_PLAN.md` - 第531-652行（P2.1章节）
   - `docs/KNOWN_ISSUES.md` - 第501-548行（集成测试验证）
   - `docs/CRS_API_INTEGRATION_SPECIFICATION.md` - 完整API规范

3. **验证现有代码**:
   - 检查数据库Schema
   - 检查TypeScript类型定义
   - 检查API路径
   - 修复发现的问题（TDD流程）

4. **继续P2开发**:
   - 按照 EXECUTION_PLAN.md 中的任务清单
   - 严格遵循TDD流程
   - 参考API规范文档

5. **更新文档**:
   - 每完成一个任务更新EXECUTION_PLAN.md
   - 发现新问题时更新KNOWN_ISSUES.md

---

## ⚠️ 重要提醒

1. **不要信任旧假设**:
   - 之前的理解可能是错误的
   - 以集成测试报告为准
   - 有疑问时参考 `CRS_API_INTEGRATION_SPECIFICATION.md`

2. **数据结构必须准确**:
   - 参考 `CRS_INTEGRATION_TEST_REPORT.json` 中的实际响应
   - 所有TypeScript类型必须与实际匹配

3. **测试必须通过**:
   - 集成测试已经验证了API可用
   - 单元测试和集成测试都必须通过
   - 测试覆盖率 > 80%

4. **错误处理**:
   - 参考规范文档中的错误处理策略（第5章）
   - 实现降级策略（第6.5节）

---

## 🚀 开始命令

```bash
# 确认当前位置
pwd
# 应输出: /Users/bypasser/claude-project/0930/claude-key-portal

# 检查分支
git branch
# 应在: feature/p2-usage-analytics

# 开始工作
echo "开始验证和开发工作..."
```

---

## 📚 快速参考

**CRS服务地址**: `https://claude.just-play.fun`

**核心API端点**:
- 认证: `POST /web/auth/login`
- 创建Key: `POST /admin/api-keys`
- 查询统计: `POST /apiStats/api/user-stats`
- 删除Key: `DELETE /admin/api-keys/:id`

**性能数据**:
- 认证: ~2000ms（首次）
- 创建/删除: ~500ms
- 查询统计: ~450ms
- 建议缓存: 60秒

**测试脚本**:
```bash
# 运行完整集成测试
npx tsx scripts/integration-test-crs-api.ts

# 查看测试报告
cat docs/CRS_INTEGRATION_TEST_REPORT.json | jq
```

---

**准备好了吗？开始吧！** 🚀
