# Sprint 4: 安装指导 - 任务清单

> **目标**: 实现多平台安装配置生成和指导
> **周期**: 2-3天
> **分支**: `feature/installation-guide`

---

## 📋 任务列表

### 准备阶段
- [ ] 创建 `feature/installation-guide` 分支
- [ ] 阅读 HTML 原型：`prototypes/install.html`
- [ ] 理解平台检测逻辑和配置生成需求

### Day 1: 脚本生成 API（TDD）

#### 🔴 RED - 测试先行
- [ ] `tests/unit/install/generate.test.ts` - 脚本生成测试
  - [ ] 测试 macOS/Linux 脚本生成
  - [ ] 测试 Windows 脚本生成
  - [ ] 测试 Docker 配置生成
  - [ ] 测试 Python 配置生成
  - [ ] 测试 Node.js 配置生成
  - [ ] 测试错误处理（密钥不存在、未认证等）

#### 🟢 GREEN - 实现功能
- [ ] `app/api/install/generate/route.ts` - 脚本生成 API
  - [ ] POST `/api/install/generate` 接口实现
  - [ ] 接收：keyId, platform, language
  - [ ] 返回：安装脚本/配置文件内容
  - [ ] 集成密钥验证和权限检查

#### 🔵 REFACTOR - 代码优化
- [ ] 提取脚本模板为独立文件
- [ ] 优化代码结构
- [ ] 添加类型定义

### Day 2: 平台检测和模板

#### 🔴 RED - 测试先行
- [ ] `tests/unit/lib/platform-detector.test.ts` - 平台检测测试
  - [ ] 测试 User-Agent 解析
  - [ ] 测试默认平台检测
  - [ ] 测试平台特性标识

- [ ] `tests/unit/lib/script-templates.test.ts` - 模板测试
  - [ ] 测试各平台模板变量替换
  - [ ] 测试模板验证
  - [ ] 测试特殊字符转义

#### 🟢 GREEN - 实现功能
- [ ] `lib/platform-detector.ts` - 平台检测工具
  - [ ] detectPlatform(userAgent) 函数
  - [ ] getPlatformFeatures(platform) 函数
  - [ ] 支持平台：macOS, Windows, Linux, Docker

- [ ] `lib/script-templates.ts` - 脚本模板库
  - [ ] macOS/Linux bash 脚本模板
  - [ ] Windows PowerShell 脚本模板
  - [ ] Docker Compose 配置模板
  - [ ] Python .env 配置模板
  - [ ] Node.js .env 配置模板
  - [ ] 模板变量替换函数

#### 🔵 REFACTOR - 代码优化
- [ ] 统一模板格式
- [ ] 提取公共工具函数
- [ ] 添加完整的 TypeScript 类型

### Day 3: 集成测试和文档

#### 验证测试
- [ ] 运行所有单元测试确保通过
- [ ] 手动测试各平台脚本生成
- [ ] 验证生成的脚本可执行性

#### CRS 集成验证（可选）
- [ ] 创建 `scripts/test-crs-install.ts` 集成测试
- [ ] 验证生成的脚本包含正确的密钥
- [ ] 测试多种平台组合
- [ ] 记录测试结果到 `INTEGRATION_TEST_LOG.md`

#### 文档更新
- [ ] 更新 API 文档（`API_MAPPING_SPECIFICATION.md`）
- [ ] 更新项目结构文档（`PROJECT_STRUCTURE.md`）
- [ ] 添加安装指导 API 使用示例

### 提交和合并

#### Git 提交
- [ ] `git commit -m "test: add installation script tests (🔴 RED)"`
- [ ] `git commit -m "feat: implement script generation API (🟢 GREEN)"`
- [ ] `git commit -m "feat: add platform detection (🟢 GREEN)"`
- [ ] `git commit -m "feat: add script templates (🟢 GREEN)"`
- [ ] `git commit -m "refactor: optimize template structure (🔵 REFACTOR)"`
- [ ] `git commit -m "docs: update installation API documentation"`

#### 合并到 develop
- [ ] 确保所有测试通过（单元 + 集成）
- [ ] 代码审查（可选：与 Gemini 协作审核）
- [ ] 合并到 develop 分支
- [ ] 标记 Sprint 4 完成

---

## 📊 验收标准

### 功能完整性
- ✅ 支持至少 5 种平台/语言组合
- ✅ 生成的脚本/配置可直接使用
- ✅ 包含完整的环境变量和配置项
- ✅ 提供清晰的使用说明

### 代码质量
- ✅ 测试覆盖率 > 80%
- ✅ 所有单元测试通过
- ✅ TypeScript 类型完整
- ✅ ESLint 无错误

### 文档完整性
- ✅ API 文档更新
- ✅ 代码注释充分
- ✅ 使用示例清晰

---

## 🎯 技术要点

### 平台检测
```typescript
interface PlatformInfo {
  os: 'macos' | 'windows' | 'linux' | 'docker'
  arch: 'x64' | 'arm64'
  shell: 'bash' | 'powershell' | 'sh'
}
```

### 脚本模板
```typescript
interface ScriptTemplate {
  platform: string
  language?: string
  template: string
  variables: string[]
  fileExtension: string
}
```

### API 接口
```typescript
POST /api/install/generate
Request: {
  keyId: string
  platform: 'macos' | 'windows' | 'linux' | 'docker'
  language?: 'python' | 'nodejs' | 'curl'
}
Response: {
  script: string
  filename: string
  instructions: string
}
```

---

## 🔗 参考资源

- HTML 原型：`prototypes/install.html`
- 项目规划：`PROJECT_CORE_DOCS/03_发展路线图.md`
- TDD 工作流：`TDD_GIT_WORKFLOW.md`
- CRS 集成规范：`docs/CRS_INTEGRATION_STANDARD.md`

---

**创建时间**: 2025-10-03
**负责人**: Claude AI Agent
**预计完成**: 2025-10-06
