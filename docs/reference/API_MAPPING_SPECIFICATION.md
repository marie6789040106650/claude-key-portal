# Claude Key Portal - API 映射规范文档

## 一、接口映射总览

### 1.1 映射架构

```
用户请求 → Portal API → 处理层 → CRS Admin API → CRS核心服务
         ↓                ↓              ↓
    前端UI展示       本地数据处理      实际业务逻辑
```

### 1.2 接口分类

| 接口类型       | Portal处理方式 | CRS依赖   | 缓存策略        |
| -------------- | -------------- | --------- | --------------- |
| **认证类**     | 完全本地       | ❌ 无     | Redis (Session) |
| **用户类**     | 完全本地       | ❌ 无     | Redis (Profile) |
| **密钥管理类** | 代理+增强      | ✅ 强依赖 | Redis (5分钟)   |
| **统计数据类** | 代理           | ✅ 强依赖 | Redis (1分钟)   |
| **安装指导类** | 完全本地       | ❌ 无     | 无缓存          |

## 二、详细接口映射表

### 2.1 认证与授权接口（本地）

| Portal API                            | 处理方式 | CRS API | 数据源     | 缓存    |
| ------------------------------------- | -------- | ------- | ---------- | ------- |
| `POST /api/v1/auth/register`          | 本地     | -       | PostgreSQL | -       |
| `POST /api/v1/auth/login`             | 本地     | -       | PostgreSQL | Session |
| `POST /api/v1/auth/refresh`           | 本地     | -       | PostgreSQL | Session |
| `POST /api/v1/auth/logout`            | 本地     | -       | PostgreSQL | Session |
| `POST /api/v1/auth/verification-code` | 本地     | -       | Redis      | Code    |

**数据流程**：

```typescript
// 用户登录示例
async login(email: string, password: string) {
  // 1. 验证用户密码（本地）
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user.passwordHash);

  // 2. 生成JWT（本地）
  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET);

  // 3. 创建Session（本地）
  await prisma.session.create({
    data: { userId: user.id, token: refreshToken }
  });

  // ✅ 完全本地，无CRS调用
  return { accessToken, refreshToken };
}
```

### 2.2 用户管理接口（本地）

| Portal API                          | 处理方式 | CRS API | 数据源     | 缓存     |
| ----------------------------------- | -------- | ------- | ---------- | -------- |
| `GET /api/v1/user/profile`          | 本地     | -       | PostgreSQL | 10分钟   |
| `PATCH /api/v1/user/profile`        | 本地     | -       | PostgreSQL | 清除缓存 |
| `POST /api/v1/user/change-password` | 本地     | -       | PostgreSQL | -        |

**数据流程**：

```typescript
// 获取用户信息示例
async getProfile(userId: string) {
  // 1. 尝试从缓存获取
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  // 2. 从数据库查询
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nickname: true, avatar: true }
  });

  // 3. 写入缓存
  await redis.setex(`user:${userId}`, 600, JSON.stringify(user));

  // ✅ 完全本地，无CRS调用
  return user;
}
```

### 2.3 API密钥管理接口（代理+增强）

| Portal API                | 处理方式  | CRS API                            | 请求转换        | 响应增强         |
| ------------------------- | --------- | ---------------------------------- | --------------- | ---------------- |
| `GET /api/v1/keys`        | 代理+过滤 | `GET /admin/api-keys`              | ✅ 添加时间范围 | ✅ 合并本地notes |
| `GET /api/v1/keys/:id`    | 代理+合并 | `GET /admin/api-keys`              | ✅ 从列表中筛选 | ✅ 合并本地数据  |
| `POST /api/v1/keys`       | 代理+映射 | `POST /admin/api-keys`             | ✅ 转换字段格式 | ✅ 创建本地映射  |
| `PUT /api/v1/keys/:id`    | 代理+更新 | `PUT /admin/api-keys/:keyId`       | ✅ 映射ID       | ✅ 更新本地notes |
| `DELETE /api/v1/keys/:id` | 代理+清理 | `DELETE /admin/api-keys/:keyId`    | ✅ 映射ID       | ✅ 删除本地映射  |
| `POST /api/v1/keys/batch` | 代理      | `DELETE/PUT /admin/api-keys/batch` | ✅ 批量映射ID   | ✅ 批量更新本地  |
| `GET /api/v1/keys/tags`   | 代理      | `GET /admin/api-keys/tags`         | ❌ 直通         | ❌ 直通          |

#### 详细数据流程

##### 2.3.1 获取密钥列表

```typescript
// GET /api/v1/keys?page=1&pageSize=20&status=active
async getUserKeys(userId: string, query: GetKeysQuery) {
  // 1. 获取用户的密钥映射（本地）
  const mappings = await prisma.apiKeyMapping.findMany({
    where: { userId },
    select: { crsKeyId: true, localNotes: true, isFavorite: true }
  });

  if (mappings.length === 0) return { keys: [], pagination: {...} };

  // 2. 调用CRS获取所有密钥
  const crsKeys = await crsClient.getAllKeys({
    timeRange: query.timeRange || 'all'
  });

  // 3. 过滤出属于该用户的密钥
  const userCrsKeyIds = new Set(mappings.map(m => m.crsKeyId));
  let userKeys = crsKeys.filter(key => userCrsKeyIds.has(key.id));

  // 4. 合并本地数据
  userKeys = userKeys.map(crsKey => {
    const mapping = mappings.find(m => m.crsKeyId === crsKey.id);
    return {
      ...crsKey,                    // CRS的完整数据
      localNotes: mapping?.localNotes,
      isFavorite: mapping?.isFavorite,
      mappingId: mapping?.id
    };
  });

  // 5. 本地过滤（status, search, tags）
  if (query.status) {
    userKeys = userKeys.filter(k => k.isActive === (query.status === 'active'));
  }
  if (query.search) {
    userKeys = userKeys.filter(k =>
      k.name.includes(query.search) ||
      k.description?.includes(query.search)
    );
  }

  // 6. 分页
  const total = userKeys.length;
  const start = (query.page - 1) * query.pageSize;
  const paginatedKeys = userKeys.slice(start, start + query.pageSize);

  return {
    keys: paginatedKeys,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize)
    }
  };
}
```

**请求/响应示例**：

```http
# Portal请求
GET /api/v1/keys?page=1&pageSize=20&status=active
Authorization: Bearer <portal_jwt>

# CRS请求（内部）
GET /admin/api-keys?timeRange=all
Authorization: Bearer <crs_admin_token>

# CRS响应
{
  "success": true,
  "data": [
    {
      "id": "crs_key_001",
      "name": "Production Key",
      "apiKey": "cr_abc...xyz",
      "isActive": true,
      "tokenLimit": 1000000,
      "usage": {
        "total": { "requests": 1542, "tokens": 154200, "cost": 15.42 }
      },
      "createdAt": "2025-01-01T00:00:00Z",
      "lastUsedAt": "2025-01-01T12:00:00Z"
    }
  ]
}

# Portal响应（增强后）
{
  "success": true,
  "data": {
    "keys": [
      {
        "id": "crs_key_001",
        "name": "Production Key",
        "key": "cr_abc...xyz",
        "status": "active",
        "usage": {
          "total": 1542,
          "today": 234,
          "tokens": 154200
        },
        "localNotes": "用于生产环境的主密钥",  // ← 本地增强
        "isFavorite": true,                      // ← 本地增强
        "mappingId": "mapping_xyz",              // ← 本地增强
        "createdAt": "2025-01-01T00:00:00Z",
        "lastUsedAt": "2025-01-01T12:00:00Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

##### 2.3.2 创建密钥

```typescript
// POST /api/v1/keys
async createKey(userId: string, data: CreateKeyDto) {
  // 1. 验证用户密钥数量限制（本地）
  const count = await prisma.apiKeyMapping.count({ where: { userId } });
  if (count >= MAX_KEYS_PER_USER) {
    throw new BusinessError('KEY_LIMIT_EXCEEDED');
  }

  // 2. 调用CRS创建密钥
  const crsKey = await crsClient.createKey({
    name: data.name,
    description: data.description,
    tags: data.tags,
    tokenLimit: data.limits?.tokenLimit,
    concurrencyLimit: data.limits?.concurrencyLimit,
    rateLimitWindow: data.limits?.rateLimitWindow,
    rateLimitRequests: data.limits?.rateLimitRequests,
    enableModelRestriction: data.allowedModels?.length > 0,
    restrictedModels: data.allowedModels,
    dailyCostLimit: data.limits?.dailyQuota,
    expiresAt: data.expiresAt
  });

  // 3. 创建本地映射
  const mapping = await prisma.apiKeyMapping.create({
    data: {
      userId,
      crsKeyId: crsKey.id,
      keyName: crsKey.name,
      localNotes: data.localNotes,
      isFavorite: data.isFavorite || false
    }
  });

  // 4. 返回完整密钥（仅此一次）
  return {
    ...crsKey,
    mappingId: mapping.id,
    warning: '请立即保存此密钥，关闭后将无法再次查看完整内容'
  };
}
```

**请求/响应示例**：

```http
# Portal请求
POST /api/v1/keys
Authorization: Bearer <portal_jwt>
Content-Type: application/json

{
  "name": "Development Key",
  "description": "用于开发环境",
  "tags": ["dev", "test"],
  "limits": {
    "rateLimit": 30,
    "dailyQuota": 5000
  },
  "allowedModels": ["claude-3-sonnet", "claude-3-haiku"],
  "localNotes": "开发团队使用"
}

# CRS请求（内部）
POST /admin/api-keys
Authorization: Bearer <crs_admin_token>
Content-Type: application/json

{
  "name": "Development Key",
  "description": "用于开发环境",
  "tags": ["dev", "test"],
  "rateLimitWindow": 1,
  "rateLimitRequests": 30,
  "dailyCostLimit": 50,  // 假设$0.01/token
  "enableModelRestriction": true,
  "restrictedModels": ["claude-3-sonnet", "claude-3-haiku"]
}

# CRS响应
{
  "success": true,
  "data": {
    "id": "crs_key_new_001",
    "apiKey": "cr_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
    "name": "Development Key",
    "description": "用于开发环境",
    "isActive": true,
    "createdAt": "2025-01-01T12:00:00Z"
  }
}

# Portal响应（增强后）
{
  "success": true,
  "data": {
    "id": "crs_key_new_001",
    "name": "Development Key",
    "key": "cr_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
    "mappingId": "mapping_abc123",  // ← 本地映射ID
    "warning": "请立即保存此密钥，关闭后将无法再次查看完整内容",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

##### 2.3.3 更新密钥

```typescript
// PUT /api/v1/keys/:id
async updateKey(userId: string, mappingId: string, data: UpdateKeyDto) {
  // 1. 验证映射归属（本地）
  const mapping = await prisma.apiKeyMapping.findFirst({
    where: { id: mappingId, userId }
  });
  if (!mapping) throw new ResourceError('NOT_FOUND');

  // 2. 更新CRS密钥（如果有CRS相关字段）
  if (data.name || data.description || data.tags || data.limits || data.allowedModels) {
    await crsClient.updateKey(mapping.crsKeyId, {
      name: data.name,
      description: data.description,
      tags: data.tags,
      tokenLimit: data.limits?.tokenLimit,
      rateLimitRequests: data.limits?.rateLimit,
      restrictedModels: data.allowedModels,
      isActive: data.status === 'active'
    });
  }

  // 3. 更新本地数据
  if (data.localNotes !== undefined || data.isFavorite !== undefined) {
    await prisma.apiKeyMapping.update({
      where: { id: mappingId },
      data: {
        localNotes: data.localNotes,
        isFavorite: data.isFavorite
      }
    });
  }

  // 4. 清除缓存
  await redis.del(`keys:list:${userId}`);
  await redis.del(`keys:detail:${mappingId}`);

  return { success: true };
}
```

##### 2.3.4 删除密钥

```typescript
// DELETE /api/v1/keys/:id
async deleteKey(userId: string, mappingId: string) {
  // 1. 验证映射归属（本地）
  const mapping = await prisma.apiKeyMapping.findFirst({
    where: { id: mappingId, userId }
  });
  if (!mapping) throw new ResourceError('NOT_FOUND');

  // 2. 从CRS删除密钥
  try {
    await crsClient.deleteKey(mapping.crsKeyId);
  } catch (error) {
    logger.error('CRS删除密钥失败', { crsKeyId: mapping.crsKeyId, error });
    // 继续删除本地映射（即使CRS删除失败）
  }

  // 3. 删除本地映射
  await prisma.apiKeyMapping.delete({
    where: { id: mappingId }
  });

  // 4. 清除缓存
  await redis.del(`keys:list:${userId}`);

  return { success: true, message: '密钥已删除' };
}
```

### 2.4 本地扩展功能接口（完全本地）

> **P1 阶段新增** - 收藏、备注、标签功能，完全本地实现，不依赖 CRS

| Portal API                    | 处理方式 | CRS API | 数据源     | 缓存 |
| ----------------------------- | -------- | ------- | ---------- | ---- |
| `PATCH /api/keys/:id/favorite` | 本地     | -       | PostgreSQL | -    |
| `PATCH /api/keys/:id/notes`    | 本地     | -       | PostgreSQL | -    |
| `POST /api/keys/:id/tags`      | 本地     | -       | PostgreSQL | -    |
| `DELETE /api/keys/:id/tags`    | 本地     | -       | PostgreSQL | -    |
| `GET /api/tags`                | 本地     | -       | PostgreSQL | -    |

#### 详细数据流程

##### 2.4.1 收藏功能

```typescript
// PATCH /api/keys/:id/favorite
async toggleFavorite(keyId: string, userId: string, isFavorite: boolean) {
  // 1. 验证权限
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId }
  });

  if (key.userId !== userId) {
    throw new ForbiddenError('无权操作此密钥');
  }

  // 2. 更新收藏状态
  const updatedKey = await prisma.apiKey.update({
    where: { id: keyId },
    data: { isFavorite },
    select: {
      id: true,
      isFavorite: true,
      name: true
    }
  });

  return updatedKey;
}
```

##### 2.4.2 备注功能

```typescript
// PATCH /api/keys/:id/notes
async updateNotes(keyId: string, userId: string, description: string) {
  // 1. 验证权限
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId }
  });

  if (key.userId !== userId) {
    throw new ForbiddenError('无权操作此密钥');
  }

  // 2. 验证长度
  const trimmedDescription = description?.trim() || null;
  if (trimmedDescription && trimmedDescription.length > 1000) {
    throw new ValidationError('备注最多 1000 个字符');
  }

  // 3. 更新备注
  const updatedKey = await prisma.apiKey.update({
    where: { id: keyId },
    data: { description: trimmedDescription },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true
    }
  });

  return updatedKey;
}
```

##### 2.4.3 标签功能

```typescript
// POST /api/keys/:id/tags - 添加标签
async addTags(keyId: string, userId: string, tags: string[]) {
  // 1. 验证权限
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId }
  });

  if (key.userId !== userId) {
    throw new ForbiddenError('无权操作此密钥');
  }

  // 2. 验证标签
  const trimmedTags = tags.map(t => t?.trim()).filter(Boolean);

  for (const tag of trimmedTags) {
    if (typeof tag !== 'string') {
      throw new ValidationError('标签必须是字符串');
    }
    if (tag.length > 50) {
      throw new ValidationError('标签最多 50 个字符');
    }
  }

  // 3. 检查重复和数量限制
  const existingTags = key.tags as string[];
  const newTags = trimmedTags.filter(t => !existingTags.includes(t));

  if (newTags.length === 0) {
    return { success: true, message: '标签已存在', tags: existingTags };
  }

  const updatedTags = [...existingTags, ...newTags];
  if (updatedTags.length > 10) {
    throw new ValidationError('最多只能添加 10 个标签');
  }

  // 4. 更新标签
  const updatedKey = await prisma.apiKey.update({
    where: { id: keyId },
    data: { tags: updatedTags },
    select: {
      id: true,
      tags: true
    }
  });

  return updatedKey;
}

// DELETE /api/keys/:id/tags - 删除标签
async removeTag(keyId: string, userId: string, tag: string) {
  // 1. 验证权限
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId }
  });

  if (key.userId !== userId) {
    throw new ForbiddenError('无权操作此密钥');
  }

  // 2. 删除标签
  const existingTags = key.tags as string[];
  const updatedTags = existingTags.filter(t => t !== tag);

  if (updatedTags.length === existingTags.length) {
    return { success: true, message: '标签不存在', tags: updatedTags };
  }

  const updatedKey = await prisma.apiKey.update({
    where: { id: keyId },
    data: { tags: updatedTags },
    select: {
      id: true,
      tags: true
    }
  });

  return updatedKey;
}
```

##### 2.4.4 标签列表

```typescript
// GET /api/tags?search=xxx&limit=10&sort=alphabetical
async getUserTags(userId: string, query: GetTagsQuery) {
  // 1. 查询用户所有密钥的标签
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: { tags: true }
  });

  // 2. 收集所有标签并统计
  const tagCounts: Record<string, number> = {};

  keys.forEach(key => {
    const tags = key.tags as string[];
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // 3. 转换为数组
  let tags = Object.keys(tagCounts);

  // 4. 应用搜索过滤
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    tags = tags.filter(tag => tag.toLowerCase().includes(searchLower));
  }

  // 5. 排序
  if (query.sort === 'alphabetical') {
    tags.sort((a, b) => a.localeCompare(b));
  } else {
    // 默认按使用频率排序
    tags.sort((a, b) => tagCounts[b] - tagCounts[a]);
  }

  // 6. 应用 limit
  if (query.limit) {
    tags = tags.slice(0, query.limit);
  }

  // 7. 构建统计信息
  const stats = {
    total: tags.length,
    ...Object.fromEntries(
      tags.map(tag => [tag, tagCounts[tag]])
    )
  };

  return { tags, stats };
}
```

**数据模型**：

```typescript
// Prisma Schema
model ApiKey {
  id          String    @id @default(cuid())
  userId      String
  name        String
  description String?   // 备注（最多1000字符）
  tags        Json      @default("[]")  // 标签数组（最多10个，每个最多50字符）
  isFavorite  Boolean   @default(false) // 收藏状态

  user        User      @relation(fields: [userId], references: [id])
}
```

### 2.5 统计数据接口（代理）

| Portal API                   | 处理方式  | CRS API                                  | 请求转换         | 响应转换        |
| ---------------------------- | --------- | ---------------------------------------- | ---------------- | --------------- |
| `GET /api/v1/dashboard`      | 代理+过滤 | `GET /admin/dashboard`                   | ❌ 直通          | ✅ 过滤用户数据 |
| `GET /api/v1/usage/stats`    | 代理+过滤 | `GET /admin/usage-stats`                 | ✅ 添加keyId过滤 | ✅ 过滤用户数据 |
| `GET /api/v1/usage/trend`    | 代理+过滤 | `GET /admin/usage-trend`                 | ✅ 添加keyId过滤 | ✅ 过滤用户数据 |
| `GET /api/v1/usage/costs`    | 代理+过滤 | `GET /admin/usage-costs`                 | ✅ 添加日期范围  | ✅ 过滤用户数据 |
| `GET /api/v1/keys/:id/stats` | 代理      | `GET /admin/api-keys/:keyId/model-stats` | ✅ 映射ID        | ❌ 直通         |

#### 详细数据流程

##### 2.5.1 获取仪表板数据

```typescript
// GET /api/v1/dashboard
async getDashboard(userId: string) {
  // 1. 获取用户的所有密钥ID（本地）
  const mappings = await prisma.apiKeyMapping.findMany({
    where: { userId },
    select: { crsKeyId: true }
  });
  const userKeyIds = new Set(mappings.map(m => m.crsKeyId));

  // 2. 调用CRS获取仪表板数据
  const crsDashboard = await crsClient.getDashboard();

  // 3. 过滤出属于该用户的数据
  const userDashboard = {
    overview: {
      totalKeys: mappings.length,
      activeKeys: crsDashboard.data.keys.filter(k =>
        userKeyIds.has(k.id) && k.isActive
      ).length,
      totalCalls: {
        today: 0,
        yesterday: 0,
        change: 0
      },
      totalTokens: {
        today: 0,
        month: 0,
        change: 0
      }
    },
    realtimeMetrics: {
      rpm: 0,
      tpm: 0,
      errorRate: 0,
      avgLatency: 0
    }
  };

  // 4. 汇总用户密钥的统计数据
  for (const key of crsDashboard.data.keys) {
    if (userKeyIds.has(key.id)) {
      userDashboard.overview.totalCalls.today += key.usage?.today?.requests || 0;
      userDashboard.overview.totalTokens.today += key.usage?.today?.tokens || 0;
      // ... 其他汇总
    }
  }

  return userDashboard;
}
```

**请求/响应示例**：

```http
# Portal请求
GET /api/v1/dashboard
Authorization: Bearer <portal_jwt>

# CRS请求（内部）
GET /admin/dashboard
Authorization: Bearer <crs_admin_token>

# CRS响应（包含所有用户）
{
  "success": true,
  "data": {
    "summary": {
      "totalKeys": 50,
      "activeKeys": 42,
      "totalRequests": 150000,
      "totalTokens": 15000000,
      "totalCost": 1500.00
    },
    "keys": [
      {
        "id": "crs_key_001",
        "name": "User A Key",
        "usage": {
          "today": { "requests": 1542, "tokens": 154200 }
        }
      },
      {
        "id": "crs_key_002",
        "name": "User B Key",
        "usage": {
          "today": { "requests": 892, "tokens": 89200 }
        }
      }
      // ... 其他用户的密钥
    ]
  }
}

# Portal响应（仅该用户）
{
  "success": true,
  "data": {
    "overview": {
      "totalKeys": 3,
      "activeKeys": 2,
      "totalCalls": {
        "today": 1542,
        "yesterday": 1320,
        "change": 16.8
      },
      "totalTokens": {
        "today": 154200,
        "month": 4500000,
        "change": 12.3
      }
    },
    "realtimeMetrics": {
      "rpm": 45,
      "tpm": 4500,
      "errorRate": 0.5,
      "avgLatency": 234
    }
  }
}
```

##### 2.5.2 获取使用趋势

```typescript
// GET /api/v1/usage/trend?days=7
async getUsageTrend(userId: string, days: number) {
  // 1. 获取用户的所有密钥ID
  const mappings = await prisma.apiKeyMapping.findMany({
    where: { userId },
    select: { crsKeyId: true }
  });

  // 2. 调用CRS获取每个密钥的使用趋势
  const trends = await Promise.all(
    mappings.map(m =>
      crsClient.getKeyUsageTrend({
        keyId: m.crsKeyId,
        days
      })
    )
  );

  // 3. 合并所有密钥的趋势数据
  const merged = mergeTrends(trends);

  return merged;
}

function mergeTrends(trends: any[]) {
  const merged = new Map<string, any>();

  for (const trend of trends) {
    for (const point of trend.data) {
      const existing = merged.get(point.date);
      if (existing) {
        existing.calls += point.calls;
        existing.tokens += point.tokens;
        existing.errors += point.errors;
      } else {
        merged.set(point.date, { ...point });
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
```

### 2.6 安装指导接口（本地）

| Portal API                    | 处理方式 | CRS API | 数据源   | 缓存 |
| ----------------------------- | -------- | ------- | -------- | ---- |
| `POST /api/v1/install/script` | 本地生成 | -       | 模板引擎 | 无   |
| `POST /api/v1/install/check`  | 本地     | -       | 无       | 无   |

**数据流程**：

```typescript
// POST /api/v1/install/script
async generateInstallScript(userId: string, data: GenerateScriptDto) {
  // 1. 验证用户是否拥有该密钥（本地）
  const mapping = await prisma.apiKeyMapping.findFirst({
    where: { id: data.keyId, userId }
  });
  if (!mapping) throw new ResourceError('NOT_FOUND');

  // 2. 获取密钥详情（从CRS）
  const keys = await crsClient.getAllKeys();
  const key = keys.find(k => k.id === mapping.crsKeyId);
  if (!key) throw new ResourceError('NOT_FOUND');

  // 3. 根据平台生成脚本（本地模板）
  const template = getTemplate(data.platform, data.environment);
  const script = template.render({
    apiKey: key.apiKey,  // 使用CRS返回的哈希密钥
    baseUrl: CRS_API_URL,
    platform: data.platform,
    ...data.options
  });

  // 4. 生成校验和
  const checksum = crypto
    .createHash('sha256')
    .update(script)
    .digest('hex');

  // ✅ 密钥从CRS获取，脚本本地生成
  return {
    script,
    language: getScriptLanguage(data.platform),
    instructions: getInstructions(data.platform),
    checksum: `sha256:${checksum}`
  };
}
```

## 三、错误处理与降级策略

### 3.1 CRS不可用时的降级方案

```typescript
class CRSCircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // 熔断开启，检查是否可以尝试恢复
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = 'HALF_OPEN'
      } else {
        throw new CRSUnavailableError('CRS服务暂时不可用')
      }
    }

    try {
      const result = await fn()
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
        this.failures = 0
      }
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      if (this.failures >= 3) {
        this.state = 'OPEN'
      }

      throw error
    }
  }
}

// 降级响应
async function getDashboardWithFallback(userId: string) {
  try {
    return await circuitBreaker.execute(() => getDashboard(userId))
  } catch (error) {
    // 返回本地缓存的数据
    const cached = await redis.get(`dashboard:${userId}:fallback`)
    if (cached) {
      return {
        ...JSON.parse(cached),
        warning: 'CRS服务暂时不可用，显示的是缓存数据',
      }
    }

    // 返回基本信息
    const mappings = await prisma.apiKeyMapping.count({
      where: { userId },
    })
    return {
      overview: {
        totalKeys: mappings,
        activeKeys: 0,
        totalCalls: { today: 0, yesterday: 0, change: 0 },
        totalTokens: { today: 0, month: 0, change: 0 },
      },
      warning: 'CRS服务暂时不可用',
    }
  }
}
```

### 3.2 接口错误映射

| CRS错误                 | Portal错误 | HTTP状态 | 用户提示                  |
| ----------------------- | ---------- | -------- | ------------------------- |
| `401 Unauthorized`      | `CRS_5001` | 502      | CRS认证失败，请联系管理员 |
| `404 Not Found`         | `RES_3001` | 404      | 密钥不存在                |
| `429 Too Many Requests` | `CRS_5002` | 429      | CRS服务繁忙，请稍后重试   |
| `500 Internal Error`    | `CRS_5001` | 502      | CRS服务异常               |
| `Timeout`               | `CRS_5002` | 504      | CRS请求超时               |

```typescript
// 错误转换中间件
function transformCRSError(error: CRSApiError): AppError {
  switch (error.statusCode) {
    case 401:
      return new AppError('CRS_5001', 'CRS认证失败', ErrorLevel.CRITICAL, 502)
    case 404:
      return new AppError('RES_3001', '密钥不存在', ErrorLevel.WARNING, 404)
    case 429:
      return new AppError(
        'CRS_5002',
        'CRS服务繁忙，请稍后重试',
        ErrorLevel.WARNING,
        429
      )
    case 500:
    case 502:
    case 503:
      return new AppError('CRS_5001', 'CRS服务异常', ErrorLevel.ERROR, 502)
    default:
      return new AppError('CRS_5001', 'CRS API调用失败', ErrorLevel.ERROR, 502)
  }
}
```

## 四、缓存策略详解

### 4.1 缓存键命名规范

```typescript
const CACHE_KEYS = {
  // 用户相关
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_SESSION: (sessionId: string) => `session:${sessionId}`,

  // 密钥相关
  KEYS_LIST: (userId: string) => `keys:list:${userId}`,
  KEY_DETAIL: (mappingId: string) => `keys:detail:${mappingId}`,

  // 统计相关
  DASHBOARD: (userId: string) => `dashboard:${userId}`,
  USAGE_STATS: (userId: string, period: string) =>
    `usage:stats:${userId}:${period}`,
  USAGE_TREND: (userId: string, days: number) =>
    `usage:trend:${userId}:${days}`,

  // 降级缓存
  DASHBOARD_FALLBACK: (userId: string) => `dashboard:${userId}:fallback`,
}
```

### 4.2 缓存TTL配置

```typescript
const CACHE_TTL = {
  // 用户相关（长期）
  USER_PROFILE: 600, // 10分钟
  USER_SESSION: 900, // 15分钟

  // 密钥相关（中期）
  KEYS_LIST: 300, // 5分钟
  KEY_DETAIL: 600, // 10分钟

  // 统计相关（短期）
  DASHBOARD: 30, // 30秒
  USAGE_STATS: 60, // 1分钟
  USAGE_TREND: 180, // 3分钟

  // 降级缓存（长期）
  DASHBOARD_FALLBACK: 3600, // 1小时
}
```

### 4.3 缓存失效策略

```typescript
// 写操作后清除相关缓存
async function invalidateCache(userId: string, operation: string) {
  const keysToDelete: string[] = []

  switch (operation) {
    case 'create_key':
    case 'delete_key':
      keysToDelete.push(
        CACHE_KEYS.KEYS_LIST(userId),
        CACHE_KEYS.DASHBOARD(userId)
      )
      break

    case 'update_key':
      keysToDelete.push(CACHE_KEYS.KEYS_LIST(userId))
      break

    case 'update_profile':
      keysToDelete.push(CACHE_KEYS.USER_PROFILE(userId))
      break
  }

  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete)
  }
}
```

## 五、性能优化

### 5.1 批量操作优化

```typescript
// 批量获取密钥详情
async function batchGetKeyDetails(
  userId: string,
  mappingIds: string[]
): Promise<KeyDetail[]> {
  // 1. 并行查询缓存
  const cacheKeys = mappingIds.map((id) => CACHE_KEYS.KEY_DETAIL(id))
  const cached = await redis.mget(...cacheKeys)

  // 2. 找出缓存未命中的
  const missedIds = mappingIds.filter((id, i) => !cached[i])

  if (missedIds.length > 0) {
    // 3. 批量获取映射
    const mappings = await prisma.apiKeyMapping.findMany({
      where: { id: { in: missedIds }, userId },
    })

    // 4. 一次性从CRS获取所有密钥
    const crsKeys = await crsClient.getAllKeys()
    const crsKeyMap = new Map(crsKeys.map((k) => [k.id, k]))

    // 5. 合并数据并写入缓存
    for (const mapping of mappings) {
      const crsKey = crsKeyMap.get(mapping.crsKeyId)
      if (crsKey) {
        const detail = { ...crsKey, ...mapping }
        await redis.setex(
          CACHE_KEYS.KEY_DETAIL(mapping.id),
          CACHE_TTL.KEY_DETAIL,
          JSON.stringify(detail)
        )
      }
    }
  }

  // 6. 再次获取缓存（此时应全部命中）
  const allCached = await redis.mget(...cacheKeys)
  return allCached.map((c) => JSON.parse(c!))
}
```

### 5.2 并发请求控制

```typescript
// 限制并发CRS请求数
class CRSRequestQueue {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent = 5

  async add<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve as any))
    }

    this.running++
    try {
      return await fn()
    } finally {
      this.running--
      const next = this.queue.shift()
      if (next) next()
    }
  }
}

const crsQueue = new CRSRequestQueue()

// 使用队列
async function getUserKeys(userId: string) {
  return crsQueue.add(() => keysService.getUserKeys(userId))
}
```

## 六、测试检查清单

### 6.1 接口映射测试

- [ ] **认证流程**
  - [ ] 注册 → 本地创建用户
  - [ ] 登录 → 本地验证 + 生成JWT
  - [ ] Token刷新 → 本地验证
  - [ ] 退出 → 本地删除Session

- [ ] **密钥管理**
  - [ ] 创建密钥 → CRS创建 + 本地映射
  - [ ] 查询列表 → CRS获取 + 本地过滤
  - [ ] 查询详情 → CRS获取 + 本地合并
  - [ ] 更新密钥 → CRS更新 + 本地更新
  - [ ] 删除密钥 → CRS删除 + 本地删除

- [ ] **统计数据**
  - [ ] 仪表板 → CRS获取 + 本地汇总
  - [ ] 使用统计 → CRS获取 + 本地过滤
  - [ ] 使用趋势 → CRS获取 + 本地合并

### 6.2 错误处理测试

- [ ] CRS返回401 → Portal返回502
- [ ] CRS返回429 → Portal返回429 + 重试
- [ ] CRS超时 → Portal返回504 + 降级
- [ ] CRS不可用 → Portal返回降级数据

### 6.3 性能测试

- [ ] 缓存命中率 > 80%
- [ ] API响应时间 < 500ms
- [ ] CRS请求并发控制生效
- [ ] 批量操作优化生效

---

更新时间: 2025-01-01
版本: v1.0.0
