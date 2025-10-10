# 阶段3️⃣: 前后端匹配性验证

> **项目**: Claude Key Portal
> **路径**: `/Users/bypasser/claude-project/0930/claude-key-portal`
> **分支**: `verification/comprehensive-test`
> **当前阶段**: 3/4
> **预计时间**: 60分钟

---

## 🎯 本阶段目标

确保前后端数据模型完全一致，验证：
- ✅ 页面与API的正确对应
- ✅ API响应字段与UI显示字段匹配
- ✅ 实际页面与HTML原型一致
- ✅ 无未使用的API字段
- ✅ 无缺失的UI显示

---

## 📋 验证任务

### 3.1 页面与API对应关系验证

#### 认证页面
**页面**: `/auth/login` (`app/auth/login/page.tsx`)
**API**: `POST /api/auth/login`

- [ ] 表单字段与API请求体匹配
  - UI: `email`, `password`
  - API: `email`, `password`
- [ ] API响应字段完全使用
  - API返回: `{success, data: {token, user}}`
  - UI使用: `token` 存储到localStorage/cookie, `user` 显示在导航栏
- [ ] 错误处理一致
  - API: `{success: false, error: "Invalid credentials"}`
  - UI: 显示错误提示

**验证步骤**:
```bash
# 1. 读取前端代码
cat app/auth/login/page.tsx

# 2. 读取API代码
cat app/api/auth/login/route.ts

# 3. 对比字段
# - 请求字段是否一致？
# - 响应字段是否都被使用？
# - 错误处理是否完整？
```

---

**页面**: `/auth/register` (`app/auth/register/page.tsx`)
**API**: `POST /api/auth/register`

- [ ] 表单字段与API请求体匹配
  - UI: `email`, `password`, `nickname`
  - API: `email`, `password`, `nickname`
- [ ] 密码强度验证逻辑一致
- [ ] 注册成功后的跳转逻辑

---

#### 仪表板页面
**页面**: `/dashboard` (`app/dashboard/page.tsx`)
**API**: `GET /api/dashboard`

- [ ] API响应结构与UI组件props匹配
  - API: `{overview: {...}, realtimeMetrics: {...}}`
  - UI: `<OverviewCards data={overview} />`, `<RealtimeMetrics data={realtimeMetrics} />`
- [ ] 所有API字段都有UI显示
  - `totalKeys` → 总密钥卡片
  - `activeKeys` → 活跃密钥卡片
  - `totalCalls` → 总调用次数卡片
  - `totalTokens` → 总Token卡片
- [ ] 降级处理（CRS不可用时）
  - API: `{...data, warning: "CRS服务暂时不可用"}`
  - UI: 显示警告横幅

**验证步骤**:
```bash
# 1. 查看API响应结构
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

# 2. 读取前端组件
cat app/dashboard/page.tsx
cat components/dashboard/*.tsx

# 3. 对比
# - API返回的每个字段在UI中都有显示吗？
# - UI显示的数据都来自API吗？
```

---

#### 密钥列表页面
**页面**: `/dashboard/keys` (`app/dashboard/keys/page.tsx`)
**API**: `GET /api/keys`

- [ ] API响应与UI列表组件匹配
  - API: `{keys: [...], pagination: {...}}`
  - UI: `<KeysList keys={keys} />`, `<Pagination {...pagination} />`
- [ ] 密钥卡片显示的所有字段
  - `id` - 用于路由
  - `name` - 密钥名称
  - `crsKey` - 脱敏显示（sk-***-xxx）
  - `status` - 状态徽章
  - `isFavorite` - 星标图标
  - `tags` - 标签列表
  - `createdAt` - 创建时间
  - `lastUsedAt` - 最后使用
- [ ] 筛选和搜索功能
  - UI: `<SearchInput />`, `<StatusFilter />`
  - 本地筛选 vs API筛选？

**验证步骤**:
```bash
# 1. 获取密钥列表API响应
curl http://localhost:3000/api/keys \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.keys[0]'

# 2. 检查UI组件
cat app/dashboard/keys/page.tsx
cat components/keys/key-card.tsx

# 3. 逐字段对比
```

---

#### 密钥详情页面
**页面**: `/dashboard/keys/[id]/stats` (`app/dashboard/keys/[id]/stats/page.tsx`)
**API**: `GET /api/stats/usage?keyId=[id]`

- [ ] 统计数据与图表组件匹配
  - API: `{usage: {trend: [...], summary: {...}}}`
  - UI: `<UsageTrendChart data={trend} />`, `<UsageSummary {...summary} />`
- [ ] 时间范围选择器
  - UI选择 → API查询参数 `?timeRange=7d`

---

#### 安装指导页面
**页面**: `/dashboard/install` (`app/dashboard/install/page.tsx`)
**API**: `POST /api/install/generate`

- [ ] 请求参数与表单选项匹配
  - UI选择: `keyId`, `platform`, `environment`
  - API请求: `{keyId, platform, environment}`
- [ ] 生成的配置显示
  - API: `{script: "...", instructions: "...", language: "..."}`
  - UI: `<CodeBlock language={language}>{script}</CodeBlock>`, `<InstructionsList items={instructions} />`

---

#### 用户设置页面
**页面**: `/dashboard/settings/profile` (`app/dashboard/settings/profile/page.tsx`)
**API**: `GET /api/user/profile`, `PATCH /api/user/profile`

- [ ] GET响应与表单初始值匹配
  - API: `{id, email, nickname, avatar}`
  - UI: `<Input defaultValue={nickname} />`
- [ ] PATCH请求与表单提交匹配
  - UI提交: `{nickname: "New Name"}`
  - API更新: 只更新提供的字段

---

### 3.2 数据模型一致性验证

#### 密钥对象（ApiKey）
**API响应结构**:
```typescript
{
  id: string              // Portal密钥ID
  userId: string          // 所属用户
  crsKeyId: string        // CRS密钥ID
  crsKey: string          // 脱敏的密钥值
  name: string            // 密钥名称
  description: string     // 描述/备注
  tags: string[]          // 标签数组
  isFavorite: boolean     // 收藏状态
  status: 'active' | 'inactive'  // 状态
  createdAt: string       // ISO时间
  updatedAt: string       // ISO时间
  lastUsedAt: string      // ISO时间
}
```

**UI组件Props**:
- [ ] `KeyCard` 组件接收的props与API响应一致
- [ ] `KeyDetail` 组件接收的props与API响应一致
- [ ] 所有字段都有类型定义（TypeScript）

**验证步骤**:
```bash
# 1. 读取API响应类型定义
cat lib/types/api.ts | grep -A 20 "ApiKey"

# 2. 读取UI组件Props类型
cat components/keys/key-card.tsx | grep -B 5 "interface.*Props"

# 3. 对比两者
```

---

#### 统计数据对象
**API响应结构**:
```typescript
{
  overview: {
    totalKeys: number
    activeKeys: number
    totalCalls: {today: number, yesterday: number, change: number}
    totalTokens: {today: number, month: number, change: number}
  },
  realtimeMetrics: {
    rpm: number         // 每分钟请求数
    tpm: number         // 每分钟Token数
    errorRate: number   // 错误率 (%)
    avgLatency: number  // 平均延迟 (ms)
  }
}
```

**UI组件**:
- [ ] `OverviewCards` 正确使用 `overview` 数据
- [ ] `RealtimeMetrics` 正确使用 `realtimeMetrics` 数据
- [ ] 数字格式化一致（千分位、百分比）

---

### 3.3 HTML原型对比

#### 仪表板原型对比
**原型**: `prototypes/dashboard.html`
**实际页面**: `/dashboard`

**检查项**:
- [ ] 布局结构一致（Grid/Flex布局）
- [ ] 卡片组件数量和位置
- [ ] 配色方案一致（Tailwind classes）
- [ ] 响应式设计一致
- [ ] 图标使用一致

**对比方法**:
```bash
# 1. 在浏览器打开原型
open prototypes/dashboard.html

# 2. 在浏览器打开实际页面
open http://localhost:3000/dashboard

# 3. 并排对比
# - 截图对比
# - 元素检查器对比
```

---

#### 密钥管理原型对比
**原型**: `prototypes/keys.html`
**实际页面**: `/dashboard/keys`

**检查项**:
- [ ] 密钥卡片布局一致
- [ ] 操作按钮位置和样式
- [ ] 筛选器和搜索框位置
- [ ] 空状态提示一致

---

#### 统计页面原型对比
**原型**: `prototypes/usage.html`
**实际页面**: `/dashboard/stats`

**检查项**:
- [ ] 图表类型一致（折线图/柱状图）
- [ ] 图表配色一致
- [ ] 时间选择器位置和样式
- [ ] 图例位置

**⚠️ 特别关注**: `usage.html` 标注了所有CRS集成点

---

#### 安装指导原型对比
**原型**: `prototypes/install.html`
**实际页面**: `/dashboard/install`

**检查项**:
- [ ] 平台选择器样式
- [ ] 代码块样式和高亮
- [ ] 复制按钮位置和交互
- [ ] 步骤说明格式

---

### 3.4 未使用字段检查

#### API返回但UI未使用的字段
- [ ] 检查所有API响应
- [ ] 列出未在UI中显示的字段
- [ ] 判断是否应该显示
- [ ] 记录为待改进项

**检查方法**:
```bash
# 1. 获取API完整响应
curl http://localhost:3000/api/keys/$KEY_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.' > api-response.json

# 2. 搜索UI代码中是否使用了所有字段
grep -r "fieldName" app/dashboard/keys/
grep -r "fieldName" components/keys/

# 3. 列出未使用的字段
```

#### UI显示但API未返回的字段
- [ ] 检查所有UI组件
- [ ] 列出在UI中显示但API未提供的数据
- [ ] 判断数据来源（硬编码？计算得出？）
- [ ] 记录为数据不一致问题

---

## ✅ 通过标准

- [x] **页面与API完全对应，无遗漏**
- [x] 数据模型100%一致
- [x] 所有API字段都有UI显示（或有合理说明）
- [x] 所有UI显示都有数据来源
- [x] 实际页面与HTML原型基本一致（允许合理优化）
- [x] TypeScript类型定义完整

---

## 📝 输出要求

创建前后端匹配性报告: `docs/verification/reports/03-frontend-backend-mapping.md`

**报告模板**:
```markdown
# 阶段3: 前后端匹配性验证 - 报告

## 执行摘要
- **执行时间**: 2025-10-10 HH:mm
- **总体结果**: ✅ 通过 / ⚠️ 部分通过 / ❌ 失败
- **匹配度**: XX%

## 3.1 页面与API对应关系

### 认证页面
- [x] ✅ /auth/login ↔ POST /api/auth/login
  - 请求字段: 完全匹配
  - 响应字段: 完全使用
  - 错误处理: 一致

...

## 3.2 数据模型一致性

### ApiKey对象
- API定义: [链接到类型文件]
- UI Props: [链接到组件文件]
- **一致性**: ✅ 完全一致 / ⚠️ 部分不一致

**不一致的字段**:
- `fieldName`: API返回但UI未使用 → 建议显示/移除API字段

...

## 3.3 HTML原型对比

### 仪表板页面
- **布局**: ✅ 一致
- **组件**: ✅ 一致
- **样式**: ⚠️ 有少量差异
  - 原型: 使用蓝色主题
  - 实际: 使用灰色主题
  - **建议**: 统一为蓝色主题

...

## 3.4 未使用字段

### API返回但UI未使用
1. `ApiKey.internalId` - CRS内部ID
   - **建议**: 不需要显示给用户，可以保留

2. `UsageStats.rawData` - 原始统计数据
   - **建议**: 添加"查看原始数据"功能

### UI显示但API未返回
1. 密钥详情页的"推荐使用场景"
   - **来源**: 硬编码在前端
   - **建议**: 移到数据库或移除

...

## 发现的问题

### 🔴 严重问题
[数据不一致导致的显示错误]

### 🟡 中等问题
[字段未使用但应该显示]

### 🟢 轻微问题
[原型与实际的样式差异]

## 建议和改进
1. 统一数据模型，移除未使用字段
2. 补充缺失的UI显示
3. 更新HTML原型以匹配实际实现
```

---

## 🔄 下一步

完成本阶段后，执行：

```bash
# 保存报告
git add docs/verification/reports/03-frontend-backend-mapping.md
git commit -m "docs: add frontend-backend mapping validation report"

# 标记完成，自动进入阶段4
claude-monitor done
```

10秒后将自动打开新终端，加载阶段4提示词：
`docs/verification/prompts/stage4-issues-summary.md`

---

## 💡 工具和技巧

### 快速字段对比脚本
```bash
#!/bin/bash
# compare-fields.sh

API_FIELDS=$(curl -s http://localhost:3000/api/keys \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data.keys[0] | keys[]')

echo "API Fields:"
echo "$API_FIELDS"

echo "\nSearching in UI components..."
for field in $API_FIELDS; do
  if grep -rq "$field" components/keys/; then
    echo "✅ $field - Used in UI"
  else
    echo "❌ $field - NOT used in UI"
  fi
done
```

### TypeScript类型检查
```bash
# 确保类型定义完整
npx tsc --noEmit
```

---

**参考文档**:
- API规范: `docs/reference/API_MAPPING_SPECIFICATION.md`
- 数据库Schema: `docs/reference/DATABASE_SCHEMA.md`
- HTML原型: `prototypes/*.html`
- 主计划: `docs/verification/VERIFICATION_MASTER_PLAN.md`
