# 项目快速修复计划

**基于**: PROJECT_AUDIT_REPORT.md
**执行时机**: Phase 5 开始前（立即）
**预计时间**: 30 分钟

---

## 🎯 修复目标

修复 3 个高优先级结构性问题，确保 Phase 5 顺利开始。

---

## ✅ 修复清单

### 1. 创建密钥管理组件目录

**问题**: tests 期待 `components/keys/` 但该目录不存在

**修复**:
```bash
mkdir -p components/keys
touch components/keys/.gitkeep
```

**验证**:
```bash
ls components/keys/
# 应该看到 .gitkeep
```

---

### 2. 创建密钥管理页面目录

**问题**: tests 期待 `app/(dashboard)/keys/page.tsx` 但目录不存在

**修复**:
```bash
mkdir -p app/\(dashboard\)/keys
touch app/\(dashboard\)/keys/.gitkeep
```

**验证**:
```bash
find app -name "keys" -type d
# 应该看到 app/(dashboard)/keys
```

---

### 3. 更新 DATABASE_SCHEMA.md

**问题**: 文档声称有 `monthlyLimit` 和 `monthlyUsage` 字段，但实际 schema 没有

**修复方案 A: 删除文档（推荐）**
```bash
# DATABASE_SCHEMA.md 内容已过时，开发者应直接查看 prisma/schema.prisma
mv DATABASE_SCHEMA.md archives/old-docs/DATABASE_SCHEMA_OUTDATED.md
```

**修复方案 B: 更新文档（备选）**
手动编辑 `DATABASE_SCHEMA.md`，删除以下字段：
- `monthlyLimit`
- `monthlyUsage`
- `deletedAt`
- `keyPrefix`
- `keyMasked`

并添加说明：
```markdown
> **注意**: 本文档为参考，实际字段以 `prisma/schema.prisma` 为准
```

**建议**: 使用方案 A，让开发者直接查看 schema.prisma

---

### 4. 补齐缺失的 API 文档

**问题**: Sprint 4 和 9 缺少 API 端点文档

**修复**:
```bash
# 创建 Sprint 4 API 文档
cat > docs/API_ENDPOINTS_SPRINT4.md << 'EOF'
# Sprint 4 API 端点文档

## 密钥管理 API

### 1. 获取密钥列表
- **端点**: `GET /api/keys`
- **功能**: 获取当前用户的所有 API 密钥
- **参数**: 无
- **返回**: 密钥数组

### 2. 创建密钥
- **端点**: `POST /api/keys`
- **功能**: 创建新的 API 密钥（代理 CRS）
- **参数**: `{ name: string, description?: string }`
- **返回**: 创建的密钥信息（包含完整 key）

### 3. 获取密钥详情
- **端点**: `GET /api/keys/[id]`
- **功能**: 获取指定密钥的详细信息
- **参数**: URL 参数 `id`
- **返回**: 密钥详细信息

### 4. 更新密钥
- **端点**: `PUT /api/keys/[id]`
- **功能**: 更新密钥信息（代理 CRS）
- **参数**: `{ name?: string, description?: string, status?: string }`
- **返回**: 更新后的密钥信息

### 5. 删除密钥
- **端点**: `DELETE /api/keys/[id]`
- **功能**: 删除密钥（代理 CRS）
- **参数**: URL 参数 `id`
- **返回**: `{ success: true }`

## 统计数据 API

### 6. 仪表板数据
- **端点**: `GET /api/dashboard`
- **功能**: 获取仪表板概览数据
- **参数**: 无
- **返回**: 密钥统计、使用量等

### 7. 使用统计
- **端点**: `GET /api/stats/usage`
- **功能**: 获取详细使用统计
- **参数**: 查询参数 `period`, `keyId` 等
- **返回**: 使用量详细数据

**参考**: SPRINT_4_SUMMARY.md, API_MAPPING_SPECIFICATION.md
EOF

# 创建 Sprint 9 API 文档
cat > docs/API_ENDPOINTS_SPRINT9.md << 'EOF'
# Sprint 9 API 端点文档

## 监控告警 API

### 1. 系统健康检查
- **端点**: `GET /api/monitor/health`
- **功能**: 获取系统健康状态
- **参数**: 无
- **返回**: 数据库、CRS、Redis 连接状态

### 2. 性能指标
- **端点**: `GET /api/monitor/metrics`
- **功能**: 获取系统性能指标
- **参数**: 查询参数 `period` (5m, 1h, 24h)
- **返回**: CPU、内存、响应时间等指标

### 3. 告警规则配置
- **端点**: `GET /api/monitor/config`
- **功能**: 获取告警规则配置
- **参数**: 无
- **返回**: 告警规则列表

- **端点**: `PUT /api/monitor/config`
- **功能**: 更新告警规则
- **参数**: `{ rules: AlertRule[] }`
- **返回**: 更新后的配置

### 4. 告警列表
- **端点**: `GET /api/monitor/alerts`
- **功能**: 获取系统告警历史
- **参数**: 查询参数 `severity`, `status`, `limit`
- **返回**: 告警记录数组

**参考**: SPRINT_9_SUMMARY.md
EOF
```

**验证**:
```bash
ls docs/API_ENDPOINTS_SPRINT*.md
# 应该看到 Sprint 3, 4, 5, 6, 7, 9 的 API 文档
```

---

### 5. 移动过时文档到归档目录

**问题**: 根目录有多个已过时的审计和修复文档

**修复**:
```bash
# 创建归档目录
mkdir -p archives/old-docs

# 移动过时文档
mv DOCS_AUDIT_AND_DEV_PLAN.md archives/old-docs/ 2>/dev/null || true
mv DOCUMENTATION_CONTRADICTIONS_REPORT.md archives/old-docs/ 2>/dev/null || true
mv DOCUMENTATION_FIX_SUMMARY.md archives/old-docs/ 2>/dev/null || true
mv CLEANUP_SUMMARY.md archives/old-docs/ 2>/dev/null || true
mv DATABASE_SCHEMA.md archives/old-docs/DATABASE_SCHEMA_OUTDATED.md 2>/dev/null || true

# 创建归档说明
cat > archives/old-docs/README.md << 'EOF'
# 归档文档

本目录包含项目开发过程中产生的历史文档，这些文档已过时或被更新的文档替代。

## 文档列表

- `DOCS_AUDIT_AND_DEV_PLAN.md` - 早期文档审计（已被新审计报告替代）
- `DOCUMENTATION_CONTRADICTIONS_REPORT.md` - 历史矛盾报告（问题已解决）
- `DOCUMENTATION_FIX_SUMMARY.md` - 文档修复总结（已完成）
- `CLEANUP_SUMMARY.md` - 清理总结（已完成）
- `DATABASE_SCHEMA_OUTDATED.md` - 过时的数据库设计文档（请查看 prisma/schema.prisma）

**注意**: 这些文档仅供历史参考，不应用于当前开发。
EOF
```

---

## 🚀 一键执行脚本

将上述所有修复合并到一个脚本：

```bash
#!/bin/bash
# quick-fix.sh - 项目快速修复脚本

echo "🔧 开始执行项目快速修复..."

# 1. 创建密钥管理目录
echo "📁 创建 components/keys/ 目录..."
mkdir -p components/keys
touch components/keys/.gitkeep

echo "📁 创建 app/(dashboard)/keys/ 目录..."
mkdir -p "app/(dashboard)/keys"
touch "app/(dashboard)/keys/.gitkeep"

# 2. 创建归档目录
echo "📦 创建归档目录..."
mkdir -p archives/old-docs

# 3. 移动过时文档
echo "🗂️  归档过时文档..."
[ -f "DOCS_AUDIT_AND_DEV_PLAN.md" ] && mv "DOCS_AUDIT_AND_DEV_PLAN.md" archives/old-docs/
[ -f "DOCUMENTATION_CONTRADICTIONS_REPORT.md" ] && mv "DOCUMENTATION_CONTRADICTIONS_REPORT.md" archives/old-docs/
[ -f "DOCUMENTATION_FIX_SUMMARY.md" ] && mv "DOCUMENTATION_FIX_SUMMARY.md" archives/old-docs/
[ -f "CLEANUP_SUMMARY.md" ] && mv "CLEANUP_SUMMARY.md" archives/old-docs/
[ -f "DATABASE_SCHEMA.md" ] && mv "DATABASE_SCHEMA.md" archives/old-docs/DATABASE_SCHEMA_OUTDATED.md

# 4. 创建归档说明
cat > archives/old-docs/README.md << 'EOF'
# 归档文档

本目录包含项目开发过程中产生的历史文档，这些文档已过时或被更新的文档替代。

**注意**: 这些文档仅供历史参考，不应用于当前开发。
EOF

# 5. 补齐 API 文档
echo "📝 创建缺失的 API 文档..."

cat > docs/API_ENDPOINTS_SPRINT4.md << 'EOF'
# Sprint 4 API 端点文档

## 密钥管理 API

详见 SPRINT_4_SUMMARY.md 和 API_MAPPING_SPECIFICATION.md

### 主要端点
- GET /api/keys - 获取密钥列表
- POST /api/keys - 创建密钥
- GET /api/keys/[id] - 获取详情
- PUT /api/keys/[id] - 更新密钥
- DELETE /api/keys/[id] - 删除密钥
- GET /api/dashboard - 仪表板数据
- GET /api/stats/usage - 使用统计
EOF

cat > docs/API_ENDPOINTS_SPRINT9.md << 'EOF'
# Sprint 9 API 端点文档

## 监控告警 API

详见 SPRINT_9_SUMMARY.md

### 主要端点
- GET /api/monitor/health - 系统健康
- GET /api/monitor/metrics - 性能指标
- GET /api/monitor/config - 告警配置
- PUT /api/monitor/config - 更新配置
- GET /api/monitor/alerts - 告警列表
EOF

echo "✅ 快速修复完成！"
echo ""
echo "📋 已完成的修复："
echo "  ✅ 创建 components/keys/ 目录"
echo "  ✅ 创建 app/(dashboard)/keys/ 目录"
echo "  ✅ 归档过时文档到 archives/old-docs/"
echo "  ✅ 创建 docs/API_ENDPOINTS_SPRINT4.md"
echo "  ✅ 创建 docs/API_ENDPOINTS_SPRINT9.md"
echo ""
echo "🔜 下一步: 开始 Phase 5 - 实现密钥管理组件"
```

---

## 📋 验证清单

修复完成后，执行以下验证：

```bash
# 验证目录已创建
[ -d "components/keys" ] && echo "✅ components/keys 存在" || echo "❌ components/keys 缺失"
[ -d "app/(dashboard)/keys" ] && echo "✅ app/(dashboard)/keys 存在" || echo "❌ app/(dashboard)/keys 缺失"

# 验证文档已归档
[ -d "archives/old-docs" ] && echo "✅ 归档目录已创建" || echo "❌ 归档目录缺失"
[ ! -f "DATABASE_SCHEMA.md" ] && echo "✅ DATABASE_SCHEMA.md 已归档" || echo "⚠️  DATABASE_SCHEMA.md 仍在根目录"

# 验证 API 文档已创建
[ -f "docs/API_ENDPOINTS_SPRINT4.md" ] && echo "✅ Sprint 4 API 文档存在" || echo "❌ Sprint 4 API 文档缺失"
[ -f "docs/API_ENDPOINTS_SPRINT9.md" ] && echo "✅ Sprint 9 API 文档存在" || echo "❌ Sprint 9 API 文档缺失"
```

---

## 🎯 执行建议

**推荐方式**: 使用提供的脚本
```bash
# 1. 保存脚本
cat > quick-fix.sh << 'EOF'
[脚本内容见上方]
EOF

# 2. 赋予执行权限
chmod +x quick-fix.sh

# 3. 执行
./quick-fix.sh
```

**手动方式**: 按顺序执行上述 5 个修复步骤

---

## ⏱️ 预计时间

- 创建目录: 2 分钟
- 归档文档: 5 分钟
- 创建 API 文档: 10 分钟
- 验证: 3 分钟
- **总计**: ~20 分钟

---

**创建时间**: 2025-10-04
**适用于**: Sprint 12 Phase 5 启动前
**优先级**: 🔴 高（立即执行）
