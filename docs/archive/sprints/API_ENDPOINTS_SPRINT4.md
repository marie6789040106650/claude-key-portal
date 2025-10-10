# Sprint 4 API 端点文档

## 密钥管理 API

详见 SPRINT_4_SUMMARY.md 和 API_MAPPING_SPECIFICATION.md

### 主要端点

#### 1. 获取密钥列表
- **端点**: `GET /api/keys`
- **功能**: 获取当前用户的所有 API 密钥
- **参数**: 无（从 session 获取 userId）
- **返回**: 密钥数组（包含 CRS 映射关系）

#### 2. 创建密钥
- **端点**: `POST /api/keys`
- **功能**: 创建新的 API 密钥（代理 CRS Admin API）
- **参数**: `{ name: string, description?: string, rateLimit?: number }`
- **返回**: 创建的密钥信息（包含完整 key，仅在创建时返回）

#### 3. 获取密钥详情
- **端点**: `GET /api/keys/[id]`
- **功能**: 获取指定密钥的详细信息
- **参数**: URL 参数 `id`（本地 ApiKey ID）
- **返回**: 密钥详细信息（从 CRS 同步最新状态）

#### 4. 更新密钥
- **端点**: `PUT /api/keys/[id]`
- **功能**: 更新密钥信息（代理 CRS Admin API）
- **参数**: `{ name?: string, description?: string, status?: string }`
- **返回**: 更新后的密钥信息

#### 5. 删除密钥
- **端点**: `DELETE /api/keys/[id]`
- **功能**: 删除密钥（代理 CRS Admin API）
- **参数**: URL 参数 `id`
- **返回**: `{ success: true }`

## 统计数据 API

#### 6. 仪表板数据
- **端点**: `GET /api/dashboard`
- **功能**: 获取仪表板概览数据
- **参数**: 无
- **返回**:
  - 密钥总数
  - 今日使用量
  - 本月使用量
  - 活跃密钥数

#### 7. 使用统计
- **端点**: `GET /api/stats/usage`
- **功能**: 获取详细使用统计（从 CRS 获取）
- **参数**:
  - `period`: 时间范围（today, week, month）
  - `keyId`: 可选，特定密钥统计
- **返回**: 使用量详细数据（调用次数、Token 消耗、成功率等）

## CRS 集成说明

所有密钥操作都通过 CRS Admin API 实现：
1. 本地 Portal 创建用户-密钥映射关系
2. 实际密钥管理由 CRS 处理
3. 使用统计从 CRS 同步获取

**参考文档**:
- SPRINT_4_SUMMARY.md - Sprint 4 实现总结
- API_MAPPING_SPECIFICATION.md - 完整 API 规范
- CRS_INTEGRATION_STANDARD.md - CRS 集成标准
