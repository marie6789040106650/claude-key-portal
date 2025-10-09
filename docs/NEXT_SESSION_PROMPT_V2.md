# Claude Key Portal - 下一阶段工作提示词 (v2)

## 📍 项目信息

**项目路径**: `/Users/bypasser/claude-project/0930/claude-key-portal`

**当前分支**: `feature/p2-usage-analytics`

**项目定位**: Claude Key Portal = CRS的用户管理门户

---

## ✅ 最新完成（2025-10-10）

### P2.6 - 高级搜索筛选功能 ✅

**TDD流程完成**:
- 🔴 RED: 18个测试用例（名称、状态、使用量、时间、组合筛选）
- 🟢 GREEN: 实现高级搜索筛选API（18/18测试通过）
- 🔵 REFACTOR: 提取筛选工具模块（201行）

**交付物**:
- ✅ Bug修复: `app/api/stats/usage/route.ts` (BigInt序列化)
- ✅ 测试: `tests/unit/app/api/stats/usage.test.ts` (+653行)
- ✅ API实现: `app/api/stats/usage/route.ts` (+50行, -197行)
- ✅ 工具模块: `app/api/stats/usage/filters.ts` (+201行)
- ✅ 文档: `docs/P2.6_COMPLETION_SUMMARY.md`

**功能特性**:
- ✅ 支持6种筛选维度（名称、状态、Token数、请求数、时间）
- ✅ 多条件组合（AND逻辑）
- ✅ 完善的参数验证
- ✅ 模块化设计（独立工具文件）
- ✅ 类型安全（FilterParams类型）

**Git提交**:
```
8f2cce2 fix(stats): fix BigInt serialization in usage API (🔧 FIX)
e8705bd test(stats): add advanced search filter tests (🔴 RED)
d034f9e feat(stats): implement advanced search filters (🟢 GREEN)
7abb1d5 refactor(stats): extract filter utilities and improve code structure (🔵 REFACTOR)
```

### P2.5 - Top 10排行榜功能 ✅

**已完成** - 详见 `docs/P2.5_COMPLETION_SUMMARY.md`

### P2.4 - 多密钥对比功能 ✅

**TDD流程完成**:
- 🔴 RED: 10个测试用例（参数验证、权限控制、错误处理、并行优化）
- 🟢 GREEN: 实现多密钥对比API（10/10测试通过，47/47 stats测试全部通过）
- 🔵 REFACTOR: 提取工具函数和类型定义（10/10测试保持通过）

**交付物**:
- ✅ 测试: `tests/unit/app/api/stats/compare.test.ts` (+481行)
- ✅ API实现: `app/api/stats/compare/route.ts` (+137行，重构后）
- ✅ 工具函数: `app/api/stats/compare/utils.ts` (+149行)
- ✅ 文档: `docs/P2.4_COMPLETION_SUMMARY.md`

**功能特性**:
- ✅ 支持2-5个密钥对比
- ✅ 并行CRS API调用（性能提升67%-80%）
- ✅ 优雅错误降级（部分失败不影响整体）
- ✅ 权限隔离（仅查询用户自己的密钥）
- ✅ 对比数据计算（最大值、总计、排名）

**Git提交**:
```
07c6636 refactor(stats): extract compare utils and improve code structure (🔵 REFACTOR)
82bf7d9 feat(stats): implement multi-key comparison API (🟢 GREEN)
f31dd22 test(stats): add multi-key comparison API tests (🔴 RED)
```

### P2.3 - CRS 时间序列趋势图集成 ✅

**已完成** - 详见 `docs/P2.3_COMPLETION_SUMMARY.md`

### P2.2 - CRS API Keys列表集成 ✅

**已完成** - 详见 `docs/P2.2_COMPLETION_SUMMARY.md`

### P2.1 - CRS Dashboard API集成 ✅

**已完成** - 详见之前提交记录

---

## 🎯 当前进度状态

### P1阶段 - 已完成 ✅

- ✅ MVP (P0): 100% 完成
- ✅ 本地扩展 (P1): 100% 完成
  - 收藏功能 ✅
  - 备注功能 ✅
  - 标签功能 ✅
  - Toast Mock修复 ✅

### P2阶段 - 进行中 🚀

**目标**: 使用统计分析和数据可视化

**当前UI状态**:
- ✅ `app/dashboard/stats/page.tsx` - UI已完成
- ✅ `app/api/stats/usage/route.ts` - 基础API已实现
- ⚠️ 图表使用模拟数据 (generateMockTimeSeriesData)
- ⚠️ 缺少CRS API集成

**待完成任务**:

```markdown
第1天 - CRS集成和Dashboard增强:
- [x] P2.1: 集成CRS Dashboard API (/admin/dashboard) ✅ 已完成
- [x] P2.2: 集成CRS API Keys列表 (/admin/api-keys) ✅ 已完成
- [x] P2.3: 实现时间序列趋势图 (/admin/api-keys-usage-trend) ✅ 已完成

第2天 - 高级功能:
- [x] P2.4: 多密钥对比功能 ✅ 已完成
- [x] P2.5: Top 10排行榜 ✅ 已完成
- [x] P2.6: 高级搜索筛选 ✅ 已完成

第3天 - 导出和优化:
- [ ] P2.7: CSV/JSON导出 ← 下一任务
- [ ] P2.8: 性能优化
- [ ] P2.9: UI/UX完善
```

---

## 📋 下一任务：P2.7 - CSV/JSON 导出功能

### 任务目标

实现统计数据的导出功能，支持 CSV 和 JSON 两种格式。

### 功能需求

1. **导出格式**
   - CSV 格式 - 适合 Excel 和数据分析工具
   - JSON 格式 - 适合程序化处理和 API 集成

2. **导出内容**
   - 单个密钥统计数据
   - 多个密钥列表数据
   - 支持当前筛选条件的导出
   - 包含完整的元数据（导出时间、用户、筛选条件）

3. **API 设计**
   - 新增 `/api/stats/usage/export` 端点
   - 支持 `format` 参数（csv/json）
   - 支持所有现有的筛选参数
   - 返回下载文件或 JSON 数据

### TDD 开发流程

#### 🔴 RED: 编写失败测试

**创建文件**: `tests/unit/app/api/stats/usage/export.test.ts`

**测试内容**:
1. 测试 CSV 格式导出
2. 测试 JSON 格式导出
3. 测试无效格式参数
4. 测试空数据导出
5. 测试带筛选条件的导出
6. 测试元数据包含

#### 🟢 GREEN: 实现功能

**创建文件**: `app/api/stats/usage/export/route.ts`

**实现内容**:
1. 解析格式和筛选参数
2. 查询符合条件的数据
3. 格式化为 CSV 或 JSON
4. 设置正确的响应头
5. 返回文件下载响应

#### 🔵 REFACTOR: 优化代码

**优化内容**:
1. 提取 CSV 格式化逻辑到工具函数
2. 提取 JSON 格式化逻辑到工具函数
3. 复用现有的筛选逻辑
4. 优化大数据量的导出性能

### 实施步骤

```bash
# 1. 确认位置和分支
cd /Users/bypasser/claude-project/0930/claude-key-portal
git branch  # 应在 feature/p2-usage-analytics

# 2. 🔴 RED: 创建测试
# 创建 tests/unit/app/api/stats/usage/export.test.ts
npm test -- tests/unit/app/api/stats/usage/export.test.ts

# 3. 🟢 GREEN: 实现功能
# 创建 app/api/stats/usage/export/route.ts
npm test -- tests/unit/app/api/stats/usage/export.test.ts

# 4. 🔵 REFACTOR: 重构优化
# 提取格式化工具函数
npm test -- tests/unit/app/api/stats/usage/export.test.ts

# 5. 提交代码（遵循TDD提交规范）
git add .
git commit -m "feat(stats): implement CSV/JSON export (🟢 GREEN)"
```

### 实现参考

**CSV 格式示例**:
```csv
密钥名称,状态,总Token数,总请求数,创建时间,最后使用时间
Production Key,active,10000,100,2024-01-01,2024-10-10
Test Key,inactive,500,5,2024-01-01,2024-01-02
```

**JSON 格式示例**:
```json
{
  "exportedAt": "2024-10-10T10:00:00Z",
  "userId": "user-123",
  "filters": {
    "status": "active",
    "minTokens": "1000"
  },
  "totalCount": 10,
  "data": [
    {
      "id": "key-1",
      "name": "Production Key",
      "status": "active",
      "totalTokens": 10000,
      "totalRequests": 100,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastUsedAt": "2024-10-10T00:00:00Z"
    }
  ]
}
```

---

## 🔧 开发规范（必须遵循）

### 1. TDD流程（强制）

```
🔴 RED: 先写测试（必须失败）
🟢 GREEN: 实现功能（让测试通过）
🔵 REFACTOR: 重构优化（保持测试通过）
```

### 2. Git提交规范

```bash
# 格式
<type>(<scope>): <subject> (<tdd-phase>)

# 示例
test(stats): add CRS dashboard integration test (🔴 RED)
feat(stats): integrate CRS dashboard API (🟢 GREEN)
refactor(stats): extract CRS data fetching logic (🔵 REFACTOR)
fix(stats): handle CRS unavailable error (🔧 FIX)
```

### 3. 错误处理标准

```typescript
// 必须实现CRS错误降级
try {
  const crsDashboard = await crsClient.getDashboard()
  // 使用CRS数据
} catch (error) {
  if (error instanceof CrsUnavailableError) {
    // 降级：使用本地数据
    console.warn('CRS不可用，使用本地统计数据')
    // 继续执行，不抛出错误
  } else {
    throw error
  }
}
```

### 4. 缓存策略

```typescript
// 建议使用Redis缓存（如果可用），否则使用内存缓存
const cacheKey = `dashboard:${userId}`
const cacheTTL = 60 // 1分钟

// 1. 尝试从缓存获取
const cached = await getCached(cacheKey)
if (cached) return cached

// 2. 从CRS获取
const data = await crsClient.getDashboard()

// 3. 缓存结果
await setCache(cacheKey, data, cacheTTL)

return data
```

### 5. 并行执行原则

如果多个任务相互独立，同时开始它们的测试和实现：

```bash
# 例如：可以并行创建多个独立API端点的测试
# 在单个终端中运行多个测试监听
npm test -- usage.test.ts --watch &
npm test -- keys.test.ts --watch &
```

---

## 📚 核心文档参考

### 必读文档

1. **项目配置**:
   - `CLAUDE.md` - 项目开发规范（最重要！）
   - `DDD_TDD_GIT_STANDARD.md` - DDD+TDD综合标准（1,246行）

2. **项目背景**:
   - `PROJECT_CORE_DOCS/01_项目背景.md` - 项目定位
   - `PROJECT_CORE_DOCS/02_功能需求和边界.md` - 需求边界

3. **API规范**:
   - `docs/CRS_API_INTEGRATION_SPECIFICATION.md` - 完整API规范（32KB）
   - `docs/CRS_INTEGRATION_TEST_REPORT.json` - 实际请求/响应示例
   - `API_MAPPING_SPECIFICATION.md` - API端点映射

4. **执行计划**:
   - `docs/EXECUTION_PLAN.md` - 主执行计划（P2.1章节: 第531-652行）
   - `docs/P2_EXECUTION_PLAN.md` - P2详细计划
   - `docs/KNOWN_ISSUES.md` - 已知问题（第501-548行）

### CRS服务信息

- **地址**: `https://claude.just-play.fun`
- **认证**: `POST /web/auth/login`
- **Admin API**: `/admin/*`
- **Stats API**: `/apiStats/api/*`

**管理员凭据**:
- 用户名: `cr_admin_4ce18cd2`
- 密码: `HCTBMoiK3PZD0eDC`

**性能数据**:
- 认证: ~2000ms (首次)
- Dashboard: ~770ms
- API Keys: ~960ms
- 统计查询: ~450ms
- 建议缓存: 60秒

---

## 🚨 重要提醒

1. **不要修改已验证的代码**:
   - CRS Client的字段映射是正确的
   - 数据库Schema是正确的
   - UseCase的字段使用是正确的

2. **必须实现错误降级**:
   - CRS可能不可用
   - 必须有降级策略（显示本地数据或友好提示）
   - 不能因为CRS错误而导致整个页面崩溃

3. **测试覆盖率要求**:
   - 新增代码 > 90%
   - 整体覆盖率 > 80%
   - 所有测试必须通过

4. **性能要求**:
   - API响应时间 < 2秒
   - 使用缓存减少CRS调用
   - 避免N+1查询

5. **Git工作流**:
   - 每个TDD阶段立即提交
   - 提交信息包含TDD phase标记
   - 不要批量提交多个任务

---

## 🎯 开始命令

```bash
# 1. 确认位置和分支
cd /Users/bypasser/claude-project/0930/claude-key-portal
git branch  # 应在 feature/p2-usage-analytics

# 2. 检查状态
git status
git log --oneline -5

# 3. 开始P2.1任务
# 创建测试文件（如果不存在）
mkdir -p tests/unit/app/api/stats
touch tests/unit/app/api/stats/usage.test.ts

# 4. 开始TDD流程
# 🔴 RED: 编写测试...
```

---

## 💡 快速参考

### 项目目录结构

```
claude-key-portal/
├── app/                          # Next.js App Router
│   ├── api/                      # API路由
│   │   └── stats/usage/route.ts  # 统计API ← 当前修改
│   └── dashboard/stats/page.tsx  # 统计UI（已完成）
├── lib/
│   ├── domain/                   # 领域层（业务逻辑）
│   ├── application/              # 应用层（用例编排）
│   └── infrastructure/           # 基础设施层
│       └── external/crs-client.ts # CRS Client（已实现）
├── tests/
│   └── unit/app/api/stats/       # API测试 ← 当前创建
└── docs/                         # 文档
    ├── EXECUTION_PLAN.md         # 执行计划
    ├── KNOWN_ISSUES.md           # 已知问题
    └── CRS_*.md                  # CRS API文档
```

### 常用命令

```bash
# 运行测试
npm test                          # 所有测试
npm test -- usage.test.ts         # 特定测试
npm test -- --watch              # 监听模式
npm test -- --coverage           # 覆盖率报告

# 运行集成测试
npx tsx scripts/integration-test-crs-api.ts

# 开发服务器
npm run dev                       # 启动开发服务器
npm run build                     # 构建项目
npm run lint                      # 代码检查

# Git操作
git status                        # 查看状态
git add .                         # 添加所有更改
git commit -m "..."              # 提交
git push origin feature/p2-usage-analytics  # 推送
```

---

## 📝 任务完成后

1. **更新文档**:
   - 更新 `docs/EXECUTION_PLAN.md` 标记任务完成
   - 记录遇到的问题到 `docs/KNOWN_ISSUES.md`

2. **提交代码**:
   - 确保所有测试通过
   - 确保Git提交规范正确
   - 推送到远程分支

3. **准备下一任务**:
   - 更新 `docs/NEXT_SESSION_PROMPT_V2.md`
   - 标记"当前任务"为下一个任务

---

**准备好了吗？开始P2.1任务吧！** 🚀

---

_"验证代码 → TDD开发 → 更新文档 → 持续迭代"_

**版本**: v2.0
**创建时间**: 2025-10-09
**最后更新**: 2025-10-09
