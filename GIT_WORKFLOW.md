# Git工作流规范

## 分支管理策略 (Git Flow)

### 分支结构
```
main
 │
 ├─ develop
 │   │
 │   ├─ feature/user-authentication
 │   ├─ feature/key-management
 │   └─ feature/installation-guide
 │
 ├─ release/v1.0.0
 │
 └─ hotfix/critical-security-fix
```

### 分支说明

#### 🌟 main (主分支)
- **用途**: 生产环境代码
- **权限**: 保护分支，需要PR和审核
- **合并**: 只能从release或hotfix分支合并
- **标签**: 每次发布打tag (v1.0.0)

#### 🔧 develop (开发分支)
- **用途**: 开发环境最新代码
- **权限**: 保护分支，需要PR
- **合并**: feature分支完成后合并到此
- **部署**: 自动部署到开发环境

#### ✨ feature/* (功能分支)
- **命名**: `feature/功能描述` (如 feature/user-auth)
- **来源**: 从develop分支创建
- **目标**: 合并回develop分支
- **生命周期**: 功能完成后删除

#### 📦 release/* (发布分支)
- **命名**: `release/版本号` (如 release/v1.0.0)
- **来源**: 从develop分支创建
- **目标**: 合并到main和develop
- **用途**: 发布前的最终测试和bug修复

#### 🚨 hotfix/* (热修复分支)
- **命名**: `hotfix/问题描述` (如 hotfix/security-patch)
- **来源**: 从main分支创建
- **目标**: 合并到main和develop
- **用途**: 紧急修复生产环境问题

## Commit规范 (Conventional Commits)

### 提交格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型说明
| Type | 描述 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(auth): 添加JWT认证` |
| fix | 修复bug | `fix(api): 修复密钥生成错误` |
| docs | 文档更新 | `docs(readme): 更新安装说明` |
| style | 代码格式 | `style(components): 格式化代码` |
| refactor | 重构 | `refactor(service): 优化查询逻辑` |
| perf | 性能优化 | `perf(db): 添加索引提升查询速度` |
| test | 测试相关 | `test(user): 添加注册测试用例` |
| build | 构建相关 | `build(deps): 升级依赖包` |
| ci | CI配置 | `ci(github): 添加自动化测试` |
| chore | 其他修改 | `chore(config): 更新配置文件` |
| revert | 回滚代码 | `revert: 回滚feat(auth)提交` |

### Scope范围说明
- **auth**: 认证相关
- **api**: API接口
- **ui**: 用户界面
- **db**: 数据库
- **deps**: 依赖包
- **config**: 配置文件
- **test**: 测试相关

### 提交示例
```bash
# 简单提交
git commit -m "feat(auth): 实现用户注册功能"

# 详细提交
git commit -m "fix(api): 修复密钥重复生成问题

问题描述：
- 并发请求时可能生成相同的密钥
- 缺少唯一性约束

解决方案：
- 添加数据库唯一索引
- 实现重试机制

Closes #123"

# Breaking Change
git commit -m "feat(api)!: 重构认证接口

BREAKING CHANGE: 认证接口返回格式变更
- 之前: { token: string }
- 现在: { accessToken: string, refreshToken: string }

迁移指南：
1. 更新客户端代码使用新的字段名
2. 添加refresh token处理逻辑"
```

## Git操作流程

### 1. 创建功能分支
```bash
# 确保develop分支是最新的
git checkout develop
git pull origin develop

# 创建并切换到功能分支
git checkout -b feature/user-authentication

# 或者一步完成
git switch -c feature/user-authentication
```

### 2. 开发过程中的提交
```bash
# 查看状态
git status

# 添加文件到暂存区
git add src/services/auth.service.ts
# 或添加所有改动
git add .

# 提交代码
git commit -m "feat(auth): 实现用户登录逻辑"

# 推送到远程仓库
git push -u origin feature/user-authentication
```

### 3. 保持分支更新
```bash
# 定期同步develop分支的更新
git checkout develop
git pull origin develop
git checkout feature/user-authentication
git merge develop

# 或使用rebase（保持提交历史线性）
git rebase develop
```

### 4. 提交Pull Request
```bash
# 确保所有测试通过
npm test

# 推送最新代码
git push origin feature/user-authentication

# 在GitHub/GitLab上创建Pull Request
# - 选择base: develop
# - 选择compare: feature/user-authentication
# - 填写PR描述
```

### 5. Code Review流程
```markdown
## PR描述模板

### 📝 变更说明
简要说明本次PR的改动内容

### 🎯 关联Issue
Closes #issue_number

### ✅ 检查清单
- [ ] 代码符合编码规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 更新了相关文档
- [ ] 无console.log等调试代码
- [ ] 考虑了向后兼容性

### 📸 截图（如适用）
添加UI变更的截图

### 🧪 测试步骤
1. 步骤一
2. 步骤二
3. 预期结果
```

### 6. 合并分支
```bash
# PR批准后，合并到develop
git checkout develop
git merge --no-ff feature/user-authentication

# 删除本地功能分支
git branch -d feature/user-authentication

# 删除远程功能分支
git push origin --delete feature/user-authentication
```

### 7. 创建发布
```bash
# 从develop创建release分支
git checkout -b release/v1.0.0 develop

# 进行最后的测试和bug修复
git commit -m "fix(release): 修复发布前的问题"

# 合并到main
git checkout main
git merge --no-ff release/v1.0.0

# 打标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 合并回develop
git checkout develop
git merge --no-ff release/v1.0.0

# 推送所有内容
git push origin main develop --tags

# 删除release分支
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

### 8. 紧急修复
```bash
# 从main创建hotfix分支
git checkout -b hotfix/critical-bug main

# 修复问题
git commit -m "fix(security): 修复SQL注入漏洞"

# 合并到main
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix version 1.0.1"

# 合并到develop
git checkout develop
git merge --no-ff hotfix/critical-bug

# 推送并删除hotfix分支
git push origin main develop --tags
git branch -d hotfix/critical-bug
```

## Git配置

### 基础配置
```bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置默认编辑器
git config --global core.editor "code --wait"

# 设置默认分支名
git config --global init.defaultBranch main

# 启用颜色输出
git config --global color.ui auto
```

### 别名配置
```bash
# 常用命令别名
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'

# 查看美化的日志
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
```

### .gitignore配置
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov
.nyc_output

# Production
build/
dist/
out/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Database
*.sqlite
*.sqlite3

# Temporary files
tmp/
temp/
*.tmp

# Next.js
.next/
out/
.vercel

# TypeScript
*.tsbuildinfo
```

## Git Hooks

### 使用Husky配置Git Hooks
```bash
# 安装husky
npm install -D husky
npx husky install

# 添加pre-commit hook
npx husky add .husky/pre-commit "npm run lint-staged"

# 添加commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

### Pre-commit检查
```json
// package.json
{
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}
```

### Commit消息验证
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', 'fix', 'docs', 'style', 'refactor',
        'perf', 'test', 'build', 'ci', 'chore', 'revert'
      ]
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-min-length': [2, 'always', 10],
    'subject-max-length': [2, 'always', 72]
  }
};
```

## 团队协作规范

### Pull Request规则
1. **每个PR应该只做一件事**
2. **PR应该尽可能小** (建议不超过400行)
3. **必须通过所有CI检查**
4. **至少需要1个审核批准**
5. **解决所有评论后才能合并**

### Code Review指南
#### 审查重点
- [ ] 代码逻辑是否正确
- [ ] 是否有潜在的bug
- [ ] 性能是否有问题
- [ ] 安全性考虑
- [ ] 代码是否易于理解
- [ ] 是否遵循项目规范
- [ ] 测试是否充分

#### Review评论规范
```markdown
# 建议性评论
suggestion: 可以考虑使用Map代替Object来提升性能

# 必须修改
must: 这里存在SQL注入风险，需要使用参数化查询

# 提问
question: 为什么这里需要递归调用？

# 赞赏
praise: 这个算法实现很优雅！

# 次要问题
nitpick: 这里的变量名可以更语义化
```

## 版本管理

### 语义化版本 (Semantic Versioning)
格式：`MAJOR.MINOR.PATCH`

- **MAJOR**: 不兼容的API变更
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的bug修复

示例：
- `1.0.0` - 首个稳定版本
- `1.1.0` - 添加新功能
- `1.1.1` - 修复bug
- `2.0.0` - 重大更新，不兼容旧版

### 版本标签
```bash
# 创建标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0

# 推送所有标签
git push origin --tags

# 查看所有标签
git tag -l

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0
```

## 常见问题处理

### 撤销操作
```bash
# 撤销工作区的修改
git checkout -- file.txt

# 撤销暂存区的文件
git reset HEAD file.txt

# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃修改）
git reset --hard HEAD~1

# 修改最后一次提交信息
git commit --amend -m "新的提交信息"
```

### 冲突解决
```bash
# 合并时遇到冲突
git merge feature-branch
# Auto-merging file.txt
# CONFLICT (content): Merge conflict in file.txt

# 查看冲突文件
git status

# 手动编辑解决冲突
# 查找 <<<<<<< HEAD 标记

# 标记冲突已解决
git add file.txt

# 完成合并
git commit -m "merge: 解决合并冲突"
```

### Stash暂存
```bash
# 暂存当前修改
git stash

# 查看暂存列表
git stash list

# 应用最近的暂存
git stash apply

# 应用并删除暂存
git stash pop

# 删除暂存
git stash drop stash@{0}

# 清空所有暂存
git stash clear
```

## CI/CD集成

### GitHub Actions示例
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm test -- --coverage

    - name: Build
      run: npm run build

    - name: Upload coverage
      if: github.ref == 'refs/heads/develop'
      uses: codecov/codecov-action@v2
```

## Git性能优化

### 大文件处理 (Git LFS)
```bash
# 安装Git LFS
git lfs install

# 跟踪大文件类型
git lfs track "*.psd"
git lfs track "*.zip"

# 添加.gitattributes
git add .gitattributes

# 正常提交
git add large-file.psd
git commit -m "Add large file"
```

### 仓库清理
```bash
# 清理无用的对象
git gc --prune=now

# 压缩仓库
git repack -a -d --depth=250 --window=250

# 查看仓库大小
git count-objects -vH
```

## 安全最佳实践

1. **永远不要提交敏感信息**
   - 密码、API密钥、私钥等
   - 使用环境变量或密钥管理服务

2. **使用签名提交**
```bash
# 配置GPG签名
git config --global user.signingkey YOUR_GPG_KEY
git config --global commit.gpgsign true
```

3. **定期更新依赖**
```bash
# 检查安全漏洞
npm audit

# 自动修复
npm audit fix
```

4. **保护重要分支**
   - 设置分支保护规则
   - 要求PR审查
   - 启用状态检查

---

更新时间: 2025-01-01
版本: v1.0.0