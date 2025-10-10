# 阶段1️⃣: API接口全面验证

> **项目**: Claude Key Portal
> **路径**: `/Users/bypasser/claude-project/0930/claude-key-portal`
> **分支**: `verification/comprehensive-test`
> **当前阶段**: 1/4
> **预计时间**: 60-90分钟

---

## 🎯 本阶段目标

全面测试所有20个已实现的API端点，验证：
- ✅ 正确的HTTP状态码
- ✅ 符合规范的响应数据格式
- ✅ CRS集成API正常工作
- ✅ 错误处理友好
- ✅ 响应时间 < 500ms

---

## 📋 API验证清单

### 1.1 认证接口 (3个)

#### `POST /api/auth/register` - 用户注册
- [ ] 成功注册新用户
- [ ] 邮箱重复返回错误
- [ ] 密码强度验证
- [ ] 返回用户信息（不含密码）

**测试命令**:
```bash
# 成功案例
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!@#",
    "nickname": "New User"
  }'

# 预期: 201 Created
# {"success":true,"data":{"id":"...","email":"newuser@example.com","nickname":"New User"}}
```

#### `POST /api/auth/login` - 用户登录
- [ ] 正确凭据登录成功
- [ ] 错误凭据返回401
- [ ] 返回access_token和user信息

**测试命令**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!@#$"
  }'

# 预期: 200 OK
# {"success":true,"data":{"token":"...","user":{...}}}
```

#### `GET /api/health` - 健康检查
- [ ] 返回服务状态
- [ ] 包含数据库连接状态

**测试命令**:
```bash
curl http://localhost:3000/api/health

# 预期: 200 OK
# {"status":"ok","database":"connected","timestamp":"..."}
```

---

### 1.2 用户管理接口 (3个)

**⚠️ 先获取认证Token**:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!@#$"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"
```

#### `GET /api/user/profile` - 获取用户信息
- [ ] 返回当前用户信息
- [ ] 未登录返回401
- [ ] 不包含敏感信息（密码）

**测试命令**:
```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
# {"success":true,"data":{"id":"...","email":"...","nickname":"..."}}
```

#### `PATCH /api/user/profile` - 更新用户信息
- [ ] 成功更新昵称
- [ ] 验证必填字段
- [ ] 返回更新后的信息

**测试命令**:
```bash
curl -X PATCH http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"Updated Name"}'

# 预期: 200 OK
```

#### `POST /api/user/password` - 修改密码
- [ ] 验证旧密码正确
- [ ] 新密码符合强度要求
- [ ] 密码修改成功

**测试命令**:
```bash
curl -X POST http://localhost:3000/api/user/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword":"Test1234!@#$",
    "newPassword":"NewPass123!@#"
  }'

# 预期: 200 OK
```

---

### 1.3 密钥管理接口 (8个)

#### `POST /api/keys` - 创建新密钥
- [ ] 成功创建密钥（调用CRS）
- [ ] 返回完整密钥（仅此一次）
- [ ] 创建本地映射关系
- [ ] 返回警告提示

**测试命令**:
```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test API Key",
    "description":"测试用密钥"
  }'

# 预期: 201 Created
# 记录返回的keyId用于后续测试
KEY_ID=$(上述命令 | jq -r '.data.id')
```

#### `GET /api/keys` - 获取密钥列表
- [ ] 返回当前用户的所有密钥
- [ ] 合并CRS数据和本地数据
- [ ] 支持分页（如实现）
- [ ] 响应时间 < 500ms

**测试命令**:
```bash
curl http://localhost:3000/api/keys \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
# {"success":true,"data":{"keys":[...],"pagination":{...}}}
```

#### `GET /api/keys/[id]` - 获取密钥详情
- [ ] 返回指定密钥的详细信息
- [ ] 不返回完整密钥值（脱敏）
- [ ] 不存在返回404

**测试命令**:
```bash
curl http://localhost:3000/api/keys/$KEY_ID \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
```

#### `PUT /api/keys/[id]` - 更新密钥
- [ ] 更新CRS字段（如name）
- [ ] 更新本地字段（如notes）
- [ ] 同时更新两边数据

**测试命令**:
```bash
curl -X PUT http://localhost:3000/api/keys/$KEY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Updated Key Name",
    "description":"更新后的描述"
  }'

# 预期: 200 OK
```

#### `PATCH /api/keys/[id]/status` - 切换密钥状态
- [ ] 调用CRS更新状态（active/inactive）
- [ ] 返回更新后的状态

**测试命令**:
```bash
curl -X PATCH http://localhost:3000/api/keys/$KEY_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"inactive"}'

# 预期: 200 OK
```

#### `PUT /api/keys/[id]/rename` - 重命名密钥
- [ ] 调用CRS更新name
- [ ] 验证name非空
- [ ] 返回新名称

**测试命令**:
```bash
curl -X PUT http://localhost:3000/api/keys/$KEY_ID/rename \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Key Name"}'

# 预期: 200 OK
```

#### `PUT /api/keys/[id]/description` - 更新描述
- [ ] 调用CRS更新description
- [ ] 允许空描述
- [ ] 返回新描述

**测试命令**:
```bash
curl -X PUT http://localhost:3000/api/keys/$KEY_ID/description \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"新的密钥描述"}'

# 预期: 200 OK
```

#### `DELETE /api/keys/[id]` - 删除密钥
- [ ] 调用CRS删除密钥
- [ ] 删除本地映射
- [ ] 不存在返回404

**测试命令**:
```bash
curl -X DELETE http://localhost:3000/api/keys/$KEY_ID \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
# ⚠️ 此操作不可逆，测试时注意
```

---

### 1.4 本地扩展功能接口 (5个)

#### `PATCH /api/keys/[id]/favorite` - 收藏/取消收藏
- [ ] 切换收藏状态
- [ ] 返回新状态
- [ ] 完全本地操作（不调用CRS）

**测试命令**:
```bash
curl -X PATCH http://localhost:3000/api/keys/$KEY_ID/favorite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isFavorite":true}'

# 预期: 200 OK
```

#### `PATCH /api/keys/[id]/notes` - 更新备注
- [ ] 更新本地备注字段
- [ ] 验证长度限制（1000字符）
- [ ] 允许空备注

**测试命令**:
```bash
curl -X PATCH http://localhost:3000/api/keys/$KEY_ID/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"这是一个本地备注"}'

# 预期: 200 OK
```

#### `POST /api/keys/[id]/tags` - 添加标签
- [ ] 添加新标签到密钥
- [ ] 验证标签数量限制（10个）
- [ ] 验证标签长度（50字符）
- [ ] 去重处理

**测试命令**:
```bash
curl -X POST http://localhost:3000/api/keys/$KEY_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags":["production","v1.0"]}'

# 预期: 200 OK
```

#### `DELETE /api/keys/[id]/tags` - 删除标签
- [ ] 从密钥删除指定标签
- [ ] 标签不存在时友好处理

**测试命令**:
```bash
curl -X DELETE "http://localhost:3000/api/keys/$KEY_ID/tags?tag=v1.0" \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
```

#### `GET /api/tags` - 获取标签列表
- [ ] 返回用户所有标签
- [ ] 包含使用计数
- [ ] 支持搜索（如实现）
- [ ] 支持排序

**测试命令**:
```bash
curl "http://localhost:3000/api/tags?sort=usage" \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
# {"success":true,"data":{"tags":["tag1","tag2"],"stats":{...}}}
```

---

### 1.5 统计数据接口 (5个)

#### `GET /api/dashboard` - 仪表板数据
- [ ] 返回用户的概览统计
- [ ] 包含密钥数量、使用情况
- [ ] 过滤只属于当前用户的数据
- [ ] CRS不可用时有降级处理

**测试命令**:
```bash
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
# {"success":true,"data":{"overview":{...},"realtimeMetrics":{...}}}
```

#### `GET /api/stats/usage` - 使用统计
- [ ] 返回详细使用数据
- [ ] 支持时间范围筛选
- [ ] 合并多个密钥的数据

**测试命令**:
```bash
curl "http://localhost:3000/api/stats/usage?timeRange=7d" \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
```

#### `GET /api/stats/compare` - 使用对比
- [ ] 对比多个密钥的使用情况
- [ ] 支持自定义对比项

**测试命令**:
```bash
curl "http://localhost:3000/api/stats/compare?keyIds=$KEY_ID" \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
```

#### `GET /api/stats/leaderboard` - 排行榜
- [ ] 返回用户密钥的排名
- [ ] 按使用量排序

**测试命令**:
```bash
curl http://localhost:3000/api/stats/leaderboard \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
```

#### `GET /api/stats/usage/export` - 导出数据
- [ ] 返回可导出的数据格式（CSV/JSON）
- [ ] 包含完整历史记录

**测试命令**:
```bash
curl "http://localhost:3000/api/stats/usage/export?format=json" \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK
```

---

### 1.6 安装指导接口 (1个)

#### `POST /api/install/generate` - 生成安装脚本
- [ ] 根据平台生成配置
- [ ] 包含完整的密钥信息
- [ ] 返回安装说明

**测试命令**:
```bash
curl -X POST http://localhost:3000/api/install/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyId":"'"$KEY_ID"'",
    "platform":"cursor",
    "environment":"development"
  }'

# 预期: 200 OK
# {"success":true,"data":{"script":"...","instructions":"..."}}
```

---

## ✅ 通过标准

- [x] **API通过率 ≥ 90%** (至少18/20个API正常)
- [x] 所有API返回正确的HTTP状态码
- [x] 响应数据格式符合API规范
- [x] CRS集成API能正常调用CRS服务
- [x] 错误处理返回友好的错误信息
- [x] API响应时间 < 500ms（统计API可放宽至1s）
- [x] 无未捕获的异常或500错误

---

## 📝 输出要求

创建API测试报告: `docs/verification/reports/01-api-test-report.md`

**报告模板**:
```markdown
# 阶段1: API接口验证 - 报告

## 执行摘要
- **执行时间**: 2025-10-10 HH:mm
- **总体结果**: ✅ 通过 / ⚠️ 部分通过 / ❌ 失败
- **通过率**: X/20 (XX%)

## 详细测试结果

### 1.1 认证接口 (3/3)
- [x] ✅ POST /api/auth/register: 通过
  - 响应时间: XXXms
  - 状态码: 201

- [x] ✅ POST /api/auth/login: 通过
  - 响应时间: XXXms
  - 状态码: 200

...

### 发现的问题

#### 🔴 严重问题
[列出所有P0问题]

#### 🟡 中等问题
[列出所有P1问题]

#### 🟢 轻微问题
[列出所有P2问题]

## 性能数据
- 平均响应时间: XXXms
- 最慢API: [API名称] (XXXms)
- 最快API: [API名称] (XXXms)

## 建议和改进
1. ...
2. ...
```

---

## 🔄 下一步

完成本阶段后，执行：

```bash
# 保存报告
git add docs/verification/reports/01-api-test-report.md
git commit -m "docs: add API validation report for verification"

# 标记完成，自动进入阶段2
claude-monitor done
```

10秒后将自动打开新终端，加载阶段2提示词：
`docs/verification/prompts/stage2-user-journey.md`

---

## 💡 提示

### 批量测试脚本
可以创建自动化脚本 `scripts/test-all-apis.sh`:
```bash
#!/bin/bash
# 批量测试所有API

# ... 编写测试逻辑
```

### 使用Postman
也可以导入API到Postman进行可视化测试

---

**参考文档**:
- API规范: `docs/reference/API_MAPPING_SPECIFICATION.md`
- 主计划: `docs/verification/VERIFICATION_MASTER_PLAN.md`
