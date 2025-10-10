# Sprint 12: 测试修复和密钥管理页面 Todolist

**创建时间**: 2025-10-04
**预计完成**: 2025-10-08
**开发模式**: TDD + Bug修复 + 功能开发
**分支**: `feature/key-management-ui`

---

## 🎯 Sprint 目标

修复 Sprint 11 遗留的测试问题，清理历史技术债务，并实现完整的密钥管理用户界面：
- 修复 UserInfoCard 测试失败（121 个）
- 清理 TypeScript 历史错误
- 实现密钥管理页面 UI
- 集成 Sprint 4 密钥管理 API
- 提升整体代码质量

---

## 📋 任务列表

### Phase 1: 准备工作
- [ ] 创建 `feature/key-management-ui` 分支
- [ ] 更新 SPRINT_INDEX.md (标记 Sprint 12 开始)
- [ ] 分析测试失败原因

### Phase 2: 🔴 RED - 测试修复（高优先级）

#### UserInfoCard 测试修复
- [ ] 分析 React.memo 导致的查询问题
- [ ] 更新测试策略（优先使用 testid）
- [ ] 修复 121 个失败测试
- [ ] 验证所有组件测试通过
- [ ] 提交测试修复

**目标**: 所有组件测试通过，测试覆盖率恢复到 100%

### Phase 3: 🟢 GREEN - TypeScript 错误清理

#### 类型错误修复
- [ ] 修复 `app/api/dashboard/route.ts` 类型错误
- [ ] 修复 `app/api/keys/route.ts` 类型错误
- [ ] 修复 `app/api/keys/[id]/route.ts` 类型错误
- [ ] 修复 `app/api/stats/usage/route.ts` 类型错误
- [ ] 修复 `app/api/user/password/route.ts` 类型错误
- [ ] 更新 Prisma schema 字段（如需要）
- [ ] 运行 TypeScript 检查确认无错误
- [ ] 提交类型修复

**目标**: TypeScript 检查 0 错误

### Phase 4: 🔴 RED - 密钥管理页面测试编写

#### 密钥列表组件测试
- [ ] 编写 KeysTable 组件测试（20+ 个测试）
  - 表格渲染
  - 密钥数据显示
  - 排序和过滤
  - 分页功能
  - 操作按钮（编辑、删除）
  - 空状态和错误状态

#### 密钥表单组件测试
- [ ] 编写 KeyForm 组件测试（25+ 个测试）
  - 表单渲染
  - 字段验证
  - 提交成功/失败
  - 创建/编辑模式
  - CRS 集成调用

#### 密钥管理页面测试
- [ ] 编写 KeysPage 集成测试（15+ 个测试）
  - 页面渲染
  - 数据加载
  - CRUD 操作流程
  - 搜索和过滤

- [ ] 提交 RED Phase

**测试统计**: 60+ 个新增测试

### Phase 5: 🟢 GREEN - 密钥管理页面实现

#### 密钥列表组件
- [ ] 创建 KeysTable 组件
  - 表格布局（shadcn/ui Table）
  - 密钥信息展示（name, key, status, created）
  - 排序功能（按创建时间、名称）
  - 过滤功能（按状态）
  - 分页功能
  - 操作按钮（编辑、删除、复制）

#### 密钥表单组件
- [ ] 创建 KeyForm 组件
  - 表单字段（name, description, rate limit）
  - 字段验证（Zod schema）
  - 创建/编辑模式切换
  - CRS API 集成（调用 Sprint 4 API）
  - 加载和错误状态

#### 密钥详情组件
- [ ] 创建 KeyDetails 组件
  - 密钥信息展示
  - 使用统计图表
  - 操作历史记录

#### 密钥管理页面
- [ ] 创建 `/dashboard/keys` 页面
  - 页面布局（标题、搜索、创建按钮）
  - 集成 KeysTable 组件
  - 集成 KeyForm 对话框
  - React Query 数据管理
  - 搜索和过滤 UI

- [ ] 提交 GREEN Phase

**实现统计**: 4 个新组件, ~800 行代码

### Phase 6: 🔵 REFACTOR - 优化和重构

#### 性能优化
- [ ] KeysTable 虚拟滚动优化（大量密钥场景）
- [ ] React Query 缓存策略优化
- [ ] 组件性能优化（memo, useCallback）

#### 代码质量
- [ ] TypeScript 类型完整性检查
- [ ] ESLint 检查和修复
- [ ] 代码重复消除

#### UI/UX 优化
- [ ] 响应式设计优化
- [ ] 加载状态和错误提示优化
- [ ] 无障碍性优化

- [ ] 提交 REFACTOR Phase

### Phase 7: 📝 文档和部署

- [ ] 创建 Sprint 12 总结文档 (`SPRINT_12_SUMMARY.md`)
- [ ] 更新 Sprint 索引 (`SPRINT_INDEX.md`)
- [ ] 创建密钥管理使用文档
- [ ] 合并到 develop 分支
- [ ] 创建 Sprint 13 todolist

---

## 🎨 UI/UX 设计要求

### 密钥管理页面布局
```
+----------------------------------------------------------+
| 密钥管理                    [搜索框] [筛选] [+ 创建密钥]     |
+----------------------------------------------------------+
| 密钥列表表格                                               |
| +------+----------+---------+---------+---------+--------+|
| | 名称 | 密钥前缀  | 状态    | 创建时间 | 使用量  | 操作    ||
| +------+----------+---------+---------+---------+--------+|
| | Key1 | sk-xxx   | Active  | 2天前   | 1.2k    | [编辑]  ||
| | Key2 | sk-yyy   | Paused  | 1周前   | 523     | [删除]  ||
| +------+----------+---------+---------+---------+--------+|
|                                            [上一页] [下一页]|
+----------------------------------------------------------+
```

### 密钥创建/编辑对话框
```
+----------------------------------------------------------+
| 创建新密钥                                         [X]     |
+----------------------------------------------------------+
| 密钥名称: [_____________________]                         |
|                                                          |
| 描述: [________________________________]                 |
|       [________________________________]                 |
|                                                          |
| 速率限制: [100] 请求/分钟                                  |
|                                                          |
| 到期时间: [2024-12-31] (可选)                             |
|                                                          |
|                          [取消]  [创建密钥]               |
+----------------------------------------------------------+
```

---

## 🧪 测试要求

### 测试覆盖率目标
- **组件测试**: 100%
- **API 集成**: 100%
- **边界条件**: 100%
- **错误处理**: 100%

### 关键测试场景

#### KeysTable 组件
- 空密钥列表显示
- 密钥数据正确渲染
- 排序功能正常工作
- 过滤功能正常工作
- 分页功能正常工作
- 操作按钮点击事件
- 加载和错误状态

#### KeyForm 组件
- 表单渲染（创建模式）
- 表单渲染（编辑模式）
- 字段验证（必填、格式）
- 提交成功调用 API
- 提交失败显示错误
- CRS API 调用正确

#### KeysPage 页面
- 页面渲染
- 密钥列表加载
- 创建密钥流程
- 编辑密钥流程
- 删除密钥流程
- 搜索功能
- 过滤功能

---

## 📦 技术栈

### 前端组件
- **React 18**: 组件库
- **Next.js 14**: App Router
- **shadcn/ui**: UI 组件（Table, Dialog, Form）
- **React Hook Form**: 表单管理
- **Zod**: 表单验证
- **React Query**: 数据获取和缓存

### API 集成
- **Sprint 4 密钥管理 API**:
  - `GET /api/keys` - 获取密钥列表
  - `POST /api/keys` - 创建密钥（代理 CRS）
  - `GET /api/keys/[id]` - 获取密钥详情
  - `PUT /api/keys/[id]` - 更新密钥
  - `DELETE /api/keys/[id]` - 删除密钥

### 测试工具
- **Jest**: 测试框架
- **React Testing Library**: 组件测试
- **MSW**: API Mock

---

## 🔗 依赖关系

### 前置条件
- ✅ Sprint 11 完成（认证和仪表板）
- ✅ Sprint 4 密钥管理 API 已实现
- ✅ shadcn/ui 组件系统已建立

### 新增依赖
- [ ] react-hook-form（表单管理）
- [ ] @hookform/resolvers（Zod 集成）
- [ ] date-fns（日期格式化）
- [ ] copy-to-clipboard（复制密钥功能）

---

## 📊 API Schema

### 密钥对象
```typescript
interface ApiKey {
  id: string
  userId: string
  name: string
  keyPrefix: string // 仅显示前缀，如 sk-xxx...
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED'
  description: string | null
  rateLimit: number | null
  createdAt: string
  updatedAt: string
  expiresAt: string | null
  lastUsedAt: string | null
  totalRequests: number
  totalTokens: bigint
}
```

### 创建密钥请求
```typescript
interface CreateKeyRequest {
  name: string
  description?: string
  rateLimit?: number
  expiresAt?: string
}
```

---

## 🚀 验收标准

### 测试标准
- [ ] 所有组件测试通过（100%）
- [ ] TypeScript 无错误
- [ ] ESLint 无警告
- [ ] 测试覆盖率 > 90%

### 功能标准
- [ ] 密钥列表正常显示
- [ ] 创建密钥功能正常
- [ ] 编辑密钥功能正常
- [ ] 删除密钥功能正常
- [ ] 搜索和过滤功能正常
- [ ] 分页功能正常
- [ ] CRS API 集成正常

### UI/UX 标准
- [ ] 响应式设计（移动端 + 桌面端）
- [ ] 加载状态清晰
- [ ] 错误提示友好
- [ ] 无障碍性符合标准

### 文档标准
- [ ] Sprint 12 总结文档完整
- [ ] 密钥管理使用文档清晰
- [ ] API 集成文档更新

---

## 📝 备注

### Sprint 11 遗留问题

1. **UserInfoCard 测试失败** (121 个)
   - 原因: React.memo 优化后测试框架元素查询问题
   - 影响: 测试失败，功能正常
   - 优先级: 🔴 高

2. **TypeScript 错误** (历史遗留)
   - 范围: Sprint 4-7 的 API routes
   - 影响: 编译警告
   - 优先级: 🟡 中

3. **ESLint 警告** (3 个)
   - 内容: 建议使用 Next.js `<Image />`
   - 影响: 性能优化建议
   - 优先级: 🟢 低

### 开发重点

1. **测试修复优先** - 确保测试套件健康
2. **类型安全** - 清理所有 TypeScript 错误
3. **用户体验** - 密钥管理要简单直观
4. **CRS 集成** - 100% 复用 Sprint 4 API，无重复造轮

### 未来功能（Sprint 13+）

- [ ] 密钥使用详细统计和图表
- [ ] 密钥使用历史记录
- [ ] 批量操作（批量删除、批量暂停）
- [ ] 密钥导出功能
- [ ] 密钥模板功能

---

**创建者**: Sprint 11 Team
**开始日期**: 2025-10-05（计划）
**预计工时**: 20-24 小时
**优先级**: 高
