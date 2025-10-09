# Claude Key Portal - 下一阶段工作提示词 (v2)

## 📍 项目信息

**项目路径**: `/Users/bypasser/claude-project/0930/claude-key-portal`

**当前分支**: `feature/p2-usage-analytics`

**项目定位**: Claude Key Portal = CRS的用户管理门户

---

## ✅ 最新完成（2025-10-10）

### P2.2 - CRS API Keys列表集成 ✅

**TDD流程完成**:
- 🔴 RED: 9个测试用例（全部失败）
- 🟢 GREEN: 实现CRS getApiKeys集成和数据合并（9/9测试通过）
- 🔵 REFACTOR: 提取密钥合并工具函数（9/9测试保持通过）

**交付物**:
- ✅ 测试: `tests/unit/app/api/keys/list.test.ts` (+288行)
- ✅ CRS Client: `lib/infrastructure/external/crs-client.ts` (新增getApiKeys方法)
- ✅ UseCase增强: `lib/application/key/list-keys.usecase.ts` (集成CRS数据合并)
- ✅ 工具函数: `lib/application/key/key-merge.utils.ts` (+151行)
- ✅ 文档: `docs/P2.2_COMPLETION_SUMMARY.md`

**功能特性**:
- ✅ 合并Portal本地数据和CRS实时数据
- ✅ 检测并报告状态不一致
- ✅ 自动发现CRS新密钥
- ✅ CRS错误时降级到本地数据

**Git提交**:
```
d527888 docs(p2): document P2.2 completion (📝 DOCS)
86a071d refactor(keys): extract key merging utilities (🔵 REFACTOR)
fd93d9f feat(keys): integrate CRS API Keys list (🟢 GREEN)
6ab732f test(keys): add CRS API Keys integration tests (🔴 RED)
```

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
- [ ] P2.3: 实现时间序列趋势图 (/admin/api-keys-usage-trend) ← 下一任务

第2天 - 高级功能:
- [ ] P2.4: 多密钥对比功能
- [ ] P2.5: Top 10排行榜
- [ ] P2.6: 高级搜索筛选

第3天 - 导出和优化:
- [ ] P2.7: CSV/JSON导出
- [ ] P2.8: 性能优化
- [ ] P2.9: UI/UX完善
```

---

## 📋 下一任务：P2.3 - 实现时间序列趋势图

### 任务目标

集成CRS时间序列趋势API，为统计页面提供使用量趋势数据，替换当前的模拟数据。

### CRS API信息

**端点**: `GET /admin/api-keys-usage-trend`

**查询参数**:
```typescript
{
  startDate?: string  // ISO 8601格式 (可选)
  endDate?: string    // ISO 8601格式 (可选)
}
```

**响应格式**:
```typescript
{
  data: Array<{
    date: string           // YYYY-MM-DD
    totalRequests: number
    totalTokens: number
    cost: number
  }>
}
```

**CRS Client方法**（已存在）:
```typescript
// lib/infrastructure/external/crs-client.ts
async getUsageTrend(params?: {
  startDate?: string
  endDate?: string
}): Promise<any[]>
```

### TDD开发流程

#### 🔴 RED: 编写失败测试

**修改文件**: `tests/unit/stats/usage.test.ts` （扩展P2.1测试）

**新增测试内容**:
1. 测试调用CRS getUsageTrend API
2. 测试时间范围参数传递
3. 测试趋势数据格式转换
4. 测试错误降级处理
5. 测试缓存策略

#### 🟢 GREEN: 实现功能

**修改文件**: `app/api/stats/usage/route.ts`

**实现内容**:
1. 添加时间范围参数解析（startDate, endDate）
2. 调用 `crsClient.getUsageTrend(params)`
3. 转换CRS趋势数据格式
4. 实现错误降级（返回空数组或缓存数据）
5. 添加数据缓存（Redis或内存）

#### 🔵 REFACTOR: 优化代码

**优化内容**:
1. 提取趋势数据获取和转换逻辑
2. 统一时间范围验证
3. 优化缓存策略
4. 改进类型定义

### 实施步骤

```bash
# 1. 确认位置和分支
cd /Users/bypasser/claude-project/0930/claude-key-portal
git branch  # 应在 feature/p2-usage-analytics

# 2. 🔴 RED: 扩展测试
# 在 tests/unit/stats/usage.test.ts 中添加趋势API测试
npm test -- tests/unit/stats/usage.test.ts

# 3. 🟢 GREEN: 实现功能
# 修改 app/api/stats/usage/route.ts 添加趋势支持
npm test -- tests/unit/stats/usage.test.ts

# 4. 🔵 REFACTOR: 重构优化
# 提取工具函数，优化代码结构
npm test -- tests/unit/stats/usage.test.ts

# 5. 提交代码（遵循TDD提交规范）
git add .
git commit -m "feat(stats): integrate CRS usage trend API (🟢 GREEN)"
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
