# Claude Key Portal - 下一阶段工作提示词 (v2)

## 📍 项目信息

**项目路径**: `/Users/bypasser/claude-project/0930/claude-key-portal`

**当前分支**: `feature/p2-usage-analytics`

**项目定位**: Claude Key Portal = CRS的用户管理门户

---

## ✅ 最新完成（2025-10-10）

### P2.8 - 性能优化（Redis缓存 + 数据库索引）✅

**TDD流程完成**:
- 🔴 RED: 24个缓存测试用例（RedisClient + CacheManager）
- 🟢 GREEN: Redis缓存系统（268行 + 187行）+ Stats API集成（3个API）
- 🔵 REFACTOR: 架构已优化（无需重构）
- 🔧 DB优化: 添加6个性能索引（单字段 + 组合索引）

**交付物**:
- ✅ 测试: `tests/unit/lib/infrastructure/cache/redis-cache.test.ts` (+418行, 24/24 passed)
- ✅ Redis客户端: `lib/infrastructure/cache/redis-client.ts` (+268行)
- ✅ 缓存管理器: `lib/infrastructure/cache/cache-manager.ts` (+187行)
- ✅ Stats API缓存集成: Usage/Compare/Leaderboard (+134行)
- ✅ Prisma索引: `prisma/schema.prisma` (+11行, 6个索引)
- ✅ Migration: `prisma/migrations/.../migration.sql` (+21行)
- ✅ 文档: `docs/P2.8_COMPLETION_SUMMARY.md` (+560行)

**功能特性**:
- ✅ Redis缓存系统（连接管理、TTL、模式删除、错误降级）
- ✅ 统一缓存键命名规范（namespace:entity:id:extra）
- ✅ 预定义TTL配置（60s/300s）
- ✅ CRS调用缓存（Dashboard/Trend/KeyStats）
- ✅ Leaderboard完整响应缓存
- ✅ 性能监控（缓存命中率统计）
- ✅ 数据库索引优化（totalTokens/totalCalls + 组合索引）
- ✅ ioredis-mock测试支持

**性能提升预期**:
- CRS调用减少80%+（60秒缓存窗口）
- Dashboard API: <500ms (提升75%+)
- Stats查询: <200ms (提升50-70%)
- 缓存命中率: >80%

**Git提交**:
```
6a50670 perf(db): add performance indexes for ApiKey table
340df16 feat(cache): integrate caching into stats APIs (🟢 GREEN)
17d7fd3 feat(cache): implement Redis client and cache manager (🟢 GREEN)
9ddc1bd test(cache): add Redis cache and manager tests (🔴 RED)
```

---

### P2.7 - CSV/JSON 导出功能 ✅

**TDD流程完成**:
- 🔴 RED: 17个测试用例（CSV导出、JSON导出、参数验证、筛选支持）
- 🟢 GREEN: 实现导出功能（17/17测试通过，60/60 stats测试全部通过）
- 🔵 REFACTOR: 提取格式化工具模块（131行）

**交付物**:
- ✅ 测试: `tests/unit/app/api/stats/usage/export.test.ts` (+461行)
- ✅ API实现: `app/api/stats/usage/export/route.ts` (+96行)
- ✅ 工具模块: `app/api/stats/usage/export/formatters.ts` (+131行)
- ✅ 文档: `docs/P2.7_COMPLETION_SUMMARY.md`

**功能特性**:
- ✅ 支持CSV和JSON两种格式
- ✅ 支持所有筛选参数（名称、状态、Token数、请求数、时间）
- ✅ CSV特殊字符转义（逗号、引号、换行符）
- ✅ JSON元数据完整（导出时间、用户ID、筛选条件）
- ✅ 自动时间戳文件名
- ✅ BigInt安全序列化
- ✅ 权限隔离

**Git提交**:
```
d0b43cb refactor(stats): extract export formatters to separate module (🔵 REFACTOR)
c5ea1d1 feat(stats): implement CSV/JSON export functionality (🟢 GREEN)
f7023bc test(stats): add CSV/JSON export tests (🔴 RED)
```

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
- [x] P2.7: CSV/JSON导出 ✅ 已完成
- [x] P2.8: 性能优化 ✅ 已完成
- [ ] P2.9: UI/UX完善 ← 下一任务
```

---

## 📋 下一任务：P2.9 - UI/UX完善 ⭐ 当前任务

### 任务目标

完善Stats页面用户体验，**移除所有模拟数据**，集成真实CRS趋势API，添加CRS降级提示和手动刷新功能。

### 核心问题

**🔴 严重问题（P0 - 必须修复）**:

1. **使用模拟数据** (`app/dashboard/stats/page.tsx:79-81`)
   ```typescript
   // TODO: 从后端获取已聚合的时间序列数据
   // 当前使用模拟数据 ← ❌ 必须移除
   return generateMockTimeSeriesData(7)
   ```
   - ❌ 趋势图显示虚假数据，与实际API使用情况无关
   - ❌ 违反项目核心原则（数据必须来自CRS）

2. **CRS降级状态无UI提示**
   - API返回`crsWarning`字段，但UI完全不显示
   - 用户不知道CRS是否可用

**🟡 中等问题（P1 - 应该修复）**:
3. 缺少手动刷新功能
4. 错误提示使用alert（应该用Toast）
5. 缺少加载进度指示器

### 5个核心任务

| 任务 | 优先级 | 工作量 | TDD阶段 |
|------|--------|--------|---------|
| Task 1: 集成CRS趋势API | 🔴 P0 | 4-6h | 🔴 🟢 🔵 |
| Task 2: CRS降级状态提示 | 🔴 P0 | 1-2h | 🔴 🟢 |
| Task 3: 手动刷新功能 | 🟡 P1 | 1h | 🟢 |
| Task 4: 错误提示优化 | 🟡 P1 | 1-2h | 🟢 |
| Task 5: 加载进度指示器 | 🟡 P1 | 1h | 🟢 |

**预计总工作量**: 8-11小时 (1.5-2天)

---

### Task 1: 集成CRS趋势API（核心任务）

#### 目标
移除`generateMockTimeSeriesData`，集成真实的CRS Usage Trend API。

#### 🔴 RED: 编写测试

**创建文件**: `tests/unit/app/api/stats/usage-trend.test.ts`

**测试用例** (12个):
```typescript
describe('Usage API - Trend Data Integration', () => {
  it('应该返回时间序列趋势数据', async () => {
    const mockTrend = [
      { date: '2024-01-01', tokens: 1000, calls: 10 },
      { date: '2024-01-02', tokens: 1500, calls: 15 },
    ]
    mockCrsClient.getUsageTrend.mockResolvedValue(mockTrend)

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(data.trend).toEqual([
      { timestamp: '2024-01-01T00:00:00.000Z', tokens: 1000, requests: 10 },
      { timestamp: '2024-01-02T00:00:00.000Z', tokens: 1500, requests: 15 },
    ])
  })

  it('应该支持自定义日期范围', ...)
  it('应该支持按密钥筛选趋势', ...)
  it('应该缓存趋势数据5分钟', ...)
  it('缓存命中时不应调用CRS API', ...)
  it('CRS不可用时应返回空数组', ...)
  // ... 更多测试
})
```

#### 🟢 GREEN: 实现功能

**文件1**: `app/api/stats/usage/route.ts` - 扩展API返回趋势数据

```typescript
interface UsageResponse {
  summary: { ... }
  keys: KeyStats[]
  trend?: TrendDataPoint[]  // ← 新增
  crsDashboard?: { ... }
  crsWarning?: string
}

export async function GET(request: NextRequest) {
  // ... 现有代码 ...

  // 3. 获取趋势数据（新增）
  let trendData: TrendDataPoint[] = []
  try {
    const trendCacheKey = cacheManager.generateKey('crs', 'trend', `${startDate}-${endDate}`)
    const cached = await cacheManager.get<any[]>(trendCacheKey)

    if (cached) {
      trendData = cached.map(transformTrendData)
    } else {
      const crsTrend = await crsClient.getUsageTrend({ startDate, endDate, keyIds })
      trendData = crsTrend.map(transformTrendData)
      await cacheManager.set(trendCacheKey, crsTrend, cacheManager.getTTL('trend'))
    }
  } catch (error) {
    console.warn('[Usage API] Failed to fetch trend data:', error)
    warnings.push('趋势数据暂时不可用，请稍后刷新')
  }

  return NextResponse.json({
    summary,
    keys,
    trend: trendData,  // ← 新增
    crsDashboard,
    crsWarning: warnings.length > 0 ? warnings.join('; ') : undefined,
  })
}
```

**文件2**: `app/dashboard/stats/page.tsx` - 使用真实数据

```typescript
// 删除
- import { generateMockTimeSeriesData } from '@/lib/date-utils'

// 修改
const timeSeriesData = useMemo<TimeSeriesDataPoint[]>(() => {
-  // TODO: 从后端获取已聚合的时间序列数据
-  // 当前使用模拟数据
-  return generateMockTimeSeriesData(7)
+  // 使用API返回的真实趋势数据
+  return data?.trend || []
}, [data?.trend])
```

#### 🔵 REFACTOR: 优化架构

**创建文件**: `app/api/stats/usage/trend-utils.ts` - 提取趋势数据处理逻辑

```typescript
export async function fetchTrendData(options: FetchTrendOptions): Promise<TrendDataPoint[]> {
  const cacheKey = cacheManager.generateKey('crs', 'trend', ...)

  try {
    const cached = await cacheManager.get<any[]>(cacheKey)
    if (cached) return cached.map(transformTrendData)

    const crsTrend = await crsClient.getUsageTrend(options)
    const transformed = crsTrend.map(transformTrendData)
    await cacheManager.set(cacheKey, crsTrend, cacheManager.getTTL('trend'))

    return transformed
  } catch (error) {
    console.warn('[Trend Utils] Failed to fetch trend data:', error)
    return []
  }
}
```

---

### Task 2: CRS降级状态UI提示

#### 🔴 RED: 编写测试

**创建文件**: `tests/unit/components/stats/CrsStatusAlert.test.tsx`

```typescript
describe('CrsStatusAlert', () => {
  it('无警告时不显示', ...)
  it('有警告时显示Alert', ...)
  it('显示重试按钮', ...)
  it('点击重试按钮触发回调', ...)
  it('使用warning样式', ...)
})
```

#### 🟢 GREEN: 实现功能

**创建文件**: `components/stats/CrsStatusAlert.tsx`

```typescript
export function CrsStatusAlert({ warning, onRetry, retrying }: CrsStatusAlertProps) {
  if (!warning) return null

  return (
    <Alert variant="warning" className="mb-6 border-warning bg-warning/10">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>CRS服务暂时不可用</AlertTitle>
      <AlertDescription>
        <p>{warning}</p>
        <p className="text-sm text-muted-foreground mb-3">
          当前显示的是本地统计数据，部分功能暂时受限。
        </p>
        <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
          <RefreshCw className={retrying ? 'animate-spin' : ''} />
          {retrying ? '连接中...' : '重试连接'}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

**集成到**: `app/dashboard/stats/page.tsx`

```typescript
<CrsStatusAlert
  warning={data?.crsWarning}
  onRetry={handleRetryCrs}
  retrying={isLoading}
/>
```

---

### Task 3-5: 快速优化

**Task 3**: 手动刷新按钮（1h）
**Task 4**: Toast替换alert（1-2h）
**Task 5**: 加载进度指示器（1h）

---

### 实施步骤

```bash
# 1. 确认环境
cd /Users/bypasser/claude-project/0930/claude-key-portal
git status

# 2. Task 1.1 - 🔴 RED: 创建趋势测试
mkdir -p tests/unit/app/api/stats
touch tests/unit/app/api/stats/usage-trend.test.ts
# 编写12个测试用例
npm test -- usage-trend.test.ts
# 预期: 全部失败（RED状态）

# 3. Task 1.2-1.4 - 🟢 GREEN: 实现趋势功能
# 修改 app/api/stats/usage/route.ts
# 修改 hooks/use-stats.ts
# 修改 app/dashboard/stats/page.tsx
npm test -- usage-trend.test.ts
# 预期: 全部通过（GREEN状态）
git commit -m "feat(stats): integrate CRS trend data and remove mock data (🟢 GREEN)"

# 4. Task 1.5-1.6 - 🔵 REFACTOR: 重构工具
# 创建 app/api/stats/usage/trend-utils.ts
npm test
git commit -m "refactor(stats): extract trend data utilities (🔵 REFACTOR)"

# 5. Task 2 - CRS降级提示
# ... 继续后续任务
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
