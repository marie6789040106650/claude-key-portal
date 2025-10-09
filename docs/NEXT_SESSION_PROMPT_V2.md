# Claude Key Portal - 下一阶段工作提示词 (v2)

## 📍 项目信息

**项目路径**: `/Users/bypasser/claude-project/0930/claude-key-portal`

**当前分支**: `feature/p2-usage-analytics`

**项目定位**: Claude Key Portal = CRS的用户管理门户

---

## ✅ 最新完成（2025-10-10）

### P2.1 - CRS Dashboard API集成 ✅

**TDD流程完成**:
- 🔴 RED: 8个测试用例（全部失败）
- 🟢 GREEN: 实现功能（19/19测试通过）
- 🔵 REFACTOR: 提取工具函数，改进类型安全（19/19测试保持通过）

**交付物**:
- ✅ 测试: `tests/unit/stats/usage.test.ts` (+199行)
- ✅ 实现: `app/api/stats/usage/route.ts` (集成CRS Dashboard)
- ✅ 重构: 提取3个工具函数，添加TypeScript类型
- ✅ 文档: `docs/EXECUTION_PLAN.md` 更新

**Git提交**:
```
cdf8996 test(stats): add CRS Dashboard integration tests (🔴 RED)
29b3aa5 feat(stats): integrate CRS Dashboard API (🟢 GREEN)
69c5365 refactor(stats): extract utility functions (🔵 REFACTOR)
03afa4d docs(p2): document P2.1 completion (📝 DOCS)
```

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
- [ ] P2.2: 集成CRS API Keys列表 (/admin/api-keys) ← 下一任务
- [ ] P2.3: 实现时间序列趋势图 (/admin/api-keys-usage-trend)

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

## 📋 下一任务：P2.2 - 集成CRS API Keys列表

### 任务目标

在密钥管理页面集成CRS API Keys列表数据，替换当前的模拟数据。

### CRS API信息

**端点**: `GET /admin/api-keys`

**响应格式**:
```typescript
{
  data: Array<{
    id: string           // UUID
    apiKey: string       // cr_xxx格式
    name: string
    permissions: string[]
    monthlyLimit: number
    currentUsage: number
    status: 'active' | 'inactive'
    createdAt: string
    // ... 其他30+字段
  }>
}
```

**CRS Client方法**（已存在）:
```typescript
// lib/infrastructure/external/crs-client.ts
async getApiKeys(): Promise<ApiKey[]>
```

### TDD开发流程

#### 🔴 RED: 编写失败测试

**创建文件**: `tests/unit/app/api/keys/list.test.ts` （如果不存在）

**测试内容**:
1. 测试调用CRS getApiKeys API
2. 测试合并本地和CRS数据
3. 测试错误降级处理
4. 测试数据格式转换

#### 🟢 GREEN: 实现功能

**修改文件**: `app/api/keys/route.ts` 或相关API路由

**实现内容**:
1. 调用 `crsClient.getApiKeys()`
2. 合并Portal用户数据和CRS密钥数据
3. 实现错误降级（CRS不可用时显示本地数据）
4. 转换数据格式匹配前端需求

#### 🔵 REFACTOR: 优化代码

**优化内容**:
1. 提取CRS数据获取逻辑
2. 统一数据转换逻辑
3. 添加日志记录
4. 优化类型定义

### 实施步骤

```bash
# 1. 创建测试文件（如果不存在）
mkdir -p tests/unit/app/api/stats
touch tests/unit/app/api/stats/usage.test.ts

# 2. 🔴 RED: 编写测试
# 运行测试确保失败
npm test -- usage.test.ts

# 3. 🟢 GREEN: 实现功能
# 修改 app/api/stats/usage/route.ts
# 运行测试确保通过
npm test -- usage.test.ts

# 4. 🔵 REFACTOR: 重构优化
# 保持测试通过的前提下优化代码
npm test -- usage.test.ts

# 5. 提交代码
git add .
git commit -m "feat(stats): integrate CRS dashboard API (🟢 GREEN)"
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
