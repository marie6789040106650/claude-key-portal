# Sprint 5 API 端点文档

## 用户账户设置 API

### 1. 用户信息管理

#### GET /api/user/profile
获取当前用户的完整信息和统计数据

**请求头**：
```
Authorization: Bearer <token>
```

**响应** (200):
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "nickname": "User Name",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "User bio",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-10-03T00:00:00.000Z",
  "stats": {
    "apiKeyCount": 5
  }
}
```

**错误响应**：
- 401: Token无效或已过期
- 404: 用户不存在
- 500: 系统错误

---

#### PUT /api/user/profile
更新用户信息（昵称、头像、简介）

**请求头**：
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "nickname": "New Nickname",  // 可选，最多50字符
  "avatar": "https://...",      // 可选
  "bio": "New bio"             // 可选，最多200字符
}
```

**响应** (200):
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "nickname": "New Nickname",
  "avatar": "https://...",
  "bio": "New bio",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-10-03T10:00:00.000Z"
}
```

**错误响应**：
- 400: 验证失败（昵称超过50字符、简介超过200字符、没有更新内容）
- 401: Token无效或已过期
- 500: 系统错误

---

### 2. 密码管理

#### PUT /api/user/password
修改用户密码

**请求头**：
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "oldPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**密码强度要求**：
- 至少8位字符
- 包含大写字母
- 包含小写字母
- 包含数字
- 包含特殊字符 (!@#$%^&*(),.?":{}|<>)

**响应** (200):
```json
{
  "message": "密码修改成功"
}
```

**错误响应**：
- 400: 缺少必需参数、旧密码不正确、新密码强度不足、新密码与旧密码相同
- 401: Token无效或已过期
- 404: 用户不存在
- 500: 系统错误

**特性**：
- 自动记录密码修改历史
- 验证新密码不能与旧密码相同
- bcrypt 加密存储

---

### 3. Session 管理

#### GET /api/user/sessions
获取用户所有活跃 Session

**请求头**：
```
Authorization: Bearer <token>
```

**响应** (200):
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "userId": "user-uuid",
      "token": "eyJh...VCJ9",  // 隐藏中间部分，只显示前后4位
      "deviceInfo": "Chrome on macOS",
      "ipAddress": "192.168.1.1",
      "lastActive": "2025-10-03T10:00:00.000Z",
      "createdAt": "2025-10-01T10:00:00.000Z"
    }
  ]
}
```

**特性**：
- Session 按最后活跃时间降序排列
- Token 隐藏保护（只显示前后4位）

**错误响应**：
- 401: Token无效或已过期
- 500: 系统错误

---

#### DELETE /api/user/sessions/[id]
删除指定 Session

**请求头**：
```
Authorization: Bearer <token>
```

**路径参数**：
- `id`: Session ID

**响应** (200):
```json
{
  "message": "Session 已删除"
}
```

**错误响应**：
- 401: Token无效或已过期
- 403: 无权删除此 Session（不属于当前用户）
- 404: Session 不存在
- 500: 系统错误

---

#### DELETE /api/user/sessions
删除所有其他 Session（保留当前）

**请求头**：
```
Authorization: Bearer <token>
```

**响应** (200):
```json
{
  "message": "已登出所有其他设备",
  "count": 3  // 删除的 Session 数量
}
```

**特性**：
- 自动保留当前 Session（从 token 中获取 sessionId）
- 返回删除数量

**错误响应**：
- 401: Token无效或已过期
- 500: 系统错误

---

## 数据模型更新

### PasswordHistory 模型（新增）
```prisma
model PasswordHistory {
  id                String    @id @default(uuid())
  userId            String
  hashedPassword    String
  createdAt         DateTime  @default(now())
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
  @@map("password_history")
}
```

### User 模型更新
添加了 `passwordHistory` 关系：
```prisma
model User {
  // ... 其他字段
  passwordHistory   PasswordHistory[]
}
```

---

## 安全特性

1. **密码安全**：
   - bcrypt 哈希加密（cost factor: 10）
   - 密码修改历史记录
   - 强密码策略强制执行

2. **Session 保护**：
   - Token 隐藏显示
   - 权限验证（只能管理自己的 Session）
   - 批量登出功能

3. **数据验证**：
   - 输入长度限制
   - 字段类型检查
   - 更新内容验证

---

## 测试覆盖

- **用户信息 API**: 15 个测试
- **密码管理 API**: 14 个测试
- **Session 管理 API**: 13 个测试
- **总计**: 42 个测试，100% 通过率
