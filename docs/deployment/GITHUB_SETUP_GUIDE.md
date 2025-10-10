# GitHub 仓库设置指南

## 如果你想上传到GitHub（可选）

### 步骤 1: 在GitHub创建仓库

1. 访问 https://github.com/new
2. 仓库名称：`claude-key-portal`
3. 描述：`CRS User Management Portal - Claude API Key Management`
4. **不要**勾选"Initialize with README"（我们已经有了）
5. 点击 "Create repository"

### 步骤 2: 配置远程仓库并上传

```bash
# 添加远程仓库（替换YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/claude-key-portal.git

# 查看远程仓库
git remote -v

# 推送所有分支
git push -u origin main
git push -u origin develop
git push -u origin feature/user-authentication

# 设置默认推送分支
git config push.default current
```

### 步骤 3: 保护主要分支（可选）

在GitHub仓库设置中：
1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. 勾选：
   - ✅ Require pull request before merging
   - ✅ Require approvals (1)
   - ❌ Require status checks (暂时不需要)

## 如果不想上传到GitHub

**完全可以！**只用本地Git即可：

```bash
# 查看提交历史
git log --oneline --graph --all

# 查看更改
git diff

# 切换分支
git checkout develop
git checkout feature/user-authentication

# 继续开发
# ... 正常使用Git命令即可
```

## 我的建议

**现阶段不必急着上传GitHub**，因为：

1. ✅ 本地Git已经足够用于版本控制
2. ✅ 不需要多人协作
3. ✅ 代码还在快速迭代中
4. ✅ 避免提前暴露未完成的代码

**何时上传？**
- 完成 Sprint 1（用户认证系统）后
- 准备部署到Vercel时（可选）
- 需要备份代码时
- 想分享项目时

---

**结论**：GitHub和CI/CD都是**锦上添花**，不是**必需品**。先把功能做出来更重要。
