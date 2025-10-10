# Sprint 3 API 端点文档 - 安装指导

## 安装配置脚本生成 API

### POST /api/install/generate
生成多平台 Claude SDK 安装配置脚本

**请求头**：
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "keyId": "key-uuid",          // 必需：API Key ID
  "platform": "macos",          // 必需：目标平台
  "environment": "bash"         // 必需：Shell 环境
}
```

**支持的平台和环境组合**：

| Platform | Environment | 输出文件 | 说明 |
|----------|------------|---------|------|
| `macos` | `bash` | `setup_claude.sh` | macOS Bash 环境 |
| `macos` | `zsh` | `setup_claude.sh` | macOS Zsh 环境 |
| `linux` | `bash` | `setup_claude.sh` | Linux Bash 环境 |
| `windows` | `powershell` | `setup_claude.ps1` | Windows PowerShell |

**响应** (200)：
```json
{
  "script": "#!/bin/bash\n# Claude API 配置脚本\n...",
  "filename": "setup_claude.sh",
  "instructions": [
    "1. 保存此脚本为 setup_claude.sh",
    "2. 运行命令：chmod +x setup_claude.sh",
    "3. 执行脚本：./setup_claude.sh",
    "4. 重启终端或运行：source ~/.bashrc"
  ],
  "platform": "macos",
  "environment": "bash"
}
```

**脚本内容示例（macOS Bash）**：
```bash
#!/bin/bash
# Claude API 配置脚本 - macOS (bash)
# 生成时间: 2025-10-03

# 添加到 ~/.bashrc
cat >> ~/.bashrc << 'EOF'

# Claude API 配置
export ANTHROPIC_BASE_URL="https://claude.just-play.fun/api"
export ANTHROPIC_AUTH_TOKEN="cr_test_key_value_123"

EOF

echo "✅ 配置已添加到 ~/.bashrc"
echo "请运行: source ~/.bashrc 使配置生效"
```

**脚本内容示例（Windows PowerShell）**：
```powershell
# Claude API 配置脚本 - Windows (PowerShell)
# 生成时间: 2025-10-03

# 设置系统环境变量（永久）
[System.Environment]::SetEnvironmentVariable(
    "ANTHROPIC_BASE_URL",
    "https://claude.just-play.fun/api",
    "User"
)

[System.Environment]::SetEnvironmentVariable(
    "ANTHROPIC_AUTH_TOKEN",
    "cr_test_key_value_123",
    "User"
)

Write-Host "✅ 环境变量已设置" -ForegroundColor Green
Write-Host "请重启 PowerShell 使配置生效" -ForegroundColor Yellow
```

---

## 错误响应

### 400 - 参数验证失败
```json
{
  "error": "缺少必需参数: keyId"
}
```

```json
{
  "error": "不支持的平台: invalid-platform。支持的平台: macos, linux, windows"
}
```

```json
{
  "error": "不支持的环境: invalid-env。支持的环境: bash, zsh, powershell"
}
```

### 401 - 未认证
```json
{
  "error": "Token无效或已过期"
}
```

### 403 - 权限不足
```json
{
  "error": "无权访问此密钥"
}
```

### 404 - 密钥不存在
```json
{
  "error": "密钥不存在"
}
```

### 500 - 系统错误
```json
{
  "error": "系统错误，请稍后重试"
}
```

---

## 功能特性

### 1. 多平台支持
- ✅ **macOS**: Bash 和 Zsh 环境
- ✅ **Linux**: Bash 环境
- ✅ **Windows**: PowerShell 环境

### 2. 自动化配置
- 自动生成环境变量配置脚本
- 包含详细的安装说明
- 支持一键执行配置

### 3. 安全性
- ✅ JWT 令牌验证
- ✅ 用户权限检查（只能访问自己的密钥）
- ✅ 密钥存在性验证
- ✅ 不泄露用户 ID 和 Token

### 4. 用户友好
- 清晰的步骤说明
- 平台特定的安装指导
- 包含配置生效方法

---

## 使用流程

### 客户端集成示例

```typescript
// 前端调用示例
async function generateInstallScript(keyId: string, platform: string, environment: string) {
  const response = await fetch('/api/install/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keyId,
      platform,
      environment,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }

  const { script, filename, instructions } = await response.json()

  // 下载脚本文件
  const blob = new Blob([script], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  // 显示安装说明
  console.log('安装说明:', instructions)
}
```

---

## 技术实现

### 平台检测
使用 `lib/platform-detector.ts` 模块自动检测用户平台：
```typescript
export function detectPlatform(): Platform {
  if (navigator.platform.includes('Mac')) return 'macos'
  if (navigator.platform.includes('Win')) return 'windows'
  return 'linux'
}
```

### 脚本模板
使用 `lib/script-templates.ts` 生成特定平台脚本：
```typescript
export function generateScript(params: {
  platform: Platform
  environment: Environment
  baseUrl: string
  authToken: string
}): string {
  // 根据平台和环境返回相应模板
}
```

---

## 测试覆盖

### 成功场景测试（6 tests）
- ✅ macOS Bash 脚本生成
- ✅ macOS Zsh 脚本生成
- ✅ Windows PowerShell 脚本生成
- ✅ Linux Bash 脚本生成
- ✅ CRS 基础 URL 包含
- ✅ 安装说明包含

### 错误场景测试（7 tests）
- ✅ 拒绝未认证请求
- ✅ 验证必需参数（keyId）
- ✅ 验证平台参数
- ✅ 验证环境参数
- ✅ 处理密钥不存在
- ✅ 拒绝访问其他用户密钥
- ✅ 处理数据库错误

### 安全性测试（2 tests）
- ✅ 验证 JWT 令牌
- ✅ 不泄露敏感信息（用户 ID、Token）

**总计**: 15 个测试，100% 通过

---

## CRS 集成

### 环境变量配置

生成的脚本配置以下环境变量连接到 CRS：

```bash
# CRS API 基础 URL
ANTHROPIC_BASE_URL="https://claude.just-play.fun/api"

# CRS 分配的 API Key
ANTHROPIC_AUTH_TOKEN="cr_xxxxx"
```

### SDK 兼容性

生成的配置与官方 Anthropic SDK 完全兼容：

```python
# Python SDK
from anthropic import Anthropic

client = Anthropic()
# 自动读取环境变量 ANTHROPIC_BASE_URL 和 ANTHROPIC_AUTH_TOKEN
```

```javascript
// JavaScript SDK
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()
// 自动读取环境变量
```

---

## 已知限制

1. **仅支持环境变量方式**
   - 暂不支持配置文件方式
   - 暂不支持系统级配置

2. **需要手动执行脚本**
   - 无法远程自动执行
   - 需要用户手动下载和运行

3. **Shell 环境检测**
   - 前端需要提供环境选择
   - 无法自动检测用户默认 Shell

---

## 未来改进

### 计划功能
- [ ] 支持配置文件方式（`.env` 文件）
- [ ] 自动检测默认 Shell 环境
- [ ] 支持 Docker 配置生成
- [ ] 支持配置验证（测试连接）
- [ ] 支持配置更新（重新生成）

---

**文档版本**: v1.0
**最后更新**: 2025-10-04
**Sprint**: Sprint 3
**相关测试**: `tests/unit/install/generate.test.ts`

---

_"一键配置，轻松开始！"_
