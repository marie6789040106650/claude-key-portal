# Sprint 14 - 用户设置和个人中心UI

**阶段**: 📋 PLANNED → 🚧 IN PROGRESS
**预计时间**: 12-16 小时
**开始时间**: 2025-10-05
**开发分支**: `feature/user-settings`

---

## 🎯 Sprint 目标

### 核心目标
- ✅ 实现完整的用户设置页面
- ✅ 个人资料管理（复用 Sprint 5 API）
- ✅ 安全设置（密码修改、会话管理）
- ✅ 通知设置（复用 Sprint 6 API）
- ✅ 密钥到期设置（复用 Sprint 7 API）
- ✅ 完整的测试覆盖

### 技术栈
- **前端**: React + TypeScript
- **数据获取**: React Query
- **表单**: React Hook Form + Zod
- **UI组件**: Shadcn/ui + Tailwind CSS
- **测试**: Jest + RTL

### 复用已有API
- `POST /api/user/profile` - 更新个人资料
- `POST /api/user/password` - 修改密码
- `GET/POST /api/user/notification-config` - 通知设置
- `GET/POST /api/user/expiration-settings` - 到期设置
- `GET/DELETE /api/user/sessions/[id]` - 会话管理

---

## 📋 Phase 1: 准备和API验证 (1.5小时)

**开始时间**: 2025-10-05
**状态**: 📋 待开始

### 任务清单

- [ ] 1.1 阅读现有API文档
  - [ ] 阅读 `docs/API_ENDPOINTS_SPRINT5.md`（账户设置API）
  - [ ] 阅读 `docs/API_ENDPOINTS_SPRINT6.md`（通知系统API）
  - [ ] 阅读 `docs/API_ENDPOINTS_SPRINT7.md`（到期提醒API）
  - [ ] 阅读 `app/api/user/*/route.ts` 文件确认接口

- [ ] 1.2 分析原型设计
  - [ ] 阅读 `prototypes/settings.html`
  - [ ] 确认页面布局和功能模块
  - [ ] 列出所需组件清单

- [ ] 1.3 创建类型定义
  - [ ] 创建 `types/user.ts`（用户相关类型）
  - [ ] 创建 `types/settings.ts`（设置相关类型）
  - [ ] 定义表单验证schema

- [ ] 1.4 验证API端点
  - [ ] 运行 `npx tsx scripts/test-user-profile.ts`（新建）
  - [ ] 验证所有设置API可用性
  - [ ] 确认响应数据格式

- [ ] 1.5 记录Phase 1总结
  - [ ] 创建 `docs/SPRINT_14_PHASE_1_SUMMARY.md`
  - [ ] 记录API验证结果

**产出**:
- `types/user.ts`
- `types/settings.ts`
- `scripts/test-user-profile.ts`
- `docs/SPRINT_14_PHASE_1_SUMMARY.md`

---

## 📋 Phase 2: 设置页面测试 (2小时) 🔴 RED

**状态**: 📋 待开始

### 2.1 主设置页面测试

- [ ] 创建 `tests/unit/pages/SettingsPage.test.tsx`
  - [ ] 页面导航测试 (3个)
    - [ ] 应该显示设置导航菜单
    - [ ] 应该高亮当前激活的标签
    - [ ] 点击标签应该切换页面
  - [ ] 布局渲染测试 (2个)
    - [ ] 应该渲染侧边栏导航
    - [ ] 应该渲染内容区域

### 2.2 个人资料页面测试

- [ ] 创建 `tests/unit/pages/ProfileSettingsPage.test.tsx`
  - [ ] 数据加载测试 (3个)
    - [ ] 加载时应该显示骨架屏
    - [ ] 加载成功应该显示用户信息
    - [ ] 加载失败应该显示错误提示
  - [ ] 表单编辑测试 (4个)
    - [ ] 应该允许编辑昵称
    - [ ] 应该允许编辑邮箱
    - [ ] 应该验证邮箱格式
    - [ ] 应该显示验证错误
  - [ ] 表单提交测试 (3个)
    - [ ] 提交成功应该显示成功提示
    - [ ] 提交失败应该显示错误
    - [ ] 提交时应该禁用表单

### 2.3 安全设置页面测试

- [ ] 创建 `tests/unit/pages/SecuritySettingsPage.test.tsx`
  - [ ] 密码修改测试 (6个)
    - [ ] 应该显示密码修改表单
    - [ ] 应该验证旧密码
    - [ ] 应该验证新密码强度
    - [ ] 应该确认新密码一致性
    - [ ] 修改成功应该清空表单
    - [ ] 修改失败应该显示错误
  - [ ] 会话管理测试 (4个)
    - [ ] 应该显示活跃会话列表
    - [ ] 应该显示当前会话标记
    - [ ] 点击删除应该确认
    - [ ] 删除成功应该刷新列表

### 2.4 通知设置页面测试

- [ ] 创建 `tests/unit/pages/NotificationSettingsPage.test.tsx`
  - [ ] 设置加载测试 (2个)
    - [ ] 加载时应该显示骨架屏
    - [ ] 加载成功应该显示设置
  - [ ] 设置项测试 (5个)
    - [ ] 应该显示邮件通知开关
    - [ ] 应该显示通知类型选项
    - [ ] 切换开关应该立即保存
    - [ ] 保存成功应该显示提示
    - [ ] 保存失败应该恢复状态

### 2.5 到期设置页面测试

- [ ] 创建 `tests/unit/pages/ExpirationSettingsPage.test.tsx`
  - [ ] 设置加载测试 (2个)
    - [ ] 加载时应该显示骨架屏
    - [ ] 加载成功应该显示设置
  - [ ] 设置项测试 (4个)
    - [ ] 应该显示提前提醒天数
    - [ ] 应该验证输入范围（1-90天）
    - [ ] 应该显示提醒方式选择
    - [ ] 保存成功应该显示提示

**测试总计**: 35+ 个测试用例

**产出**:
- `tests/unit/pages/SettingsPage.test.tsx`
- `tests/unit/pages/ProfileSettingsPage.test.tsx`
- `tests/unit/pages/SecuritySettingsPage.test.tsx`
- `tests/unit/pages/NotificationSettingsPage.test.tsx`
- `tests/unit/pages/ExpirationSettingsPage.test.tsx`

**Git提交**:
```bash
git add tests/
git commit -m "test: add user settings pages tests (Sprint 14 Phase 2 🔴 RED)"
```

---

## 📋 Phase 3: 设置布局和导航实现 (2小时) 🟢 GREEN

**状态**: 📋 待开始

### 3.1 设置主布局

- [ ] 创建 `app/dashboard/settings/layout.tsx`
  - [ ] 左侧导航菜单
  - [ ] 响应式设计（移动端顶部导航）
  - [ ] 面包屑导航

- [ ] 创建 `components/settings/SettingsNav.tsx`
  - [ ] 导航菜单项组件
  - [ ] 激活状态高亮
  - [ ] 图标 + 文字

- [ ] 创建 `components/settings/SettingsBreadcrumb.tsx`
  - [ ] 面包屑导航组件
  - [ ] 动态路径显示

### 3.2 设置导航配置

- [ ] 创建 `constants/settings.ts`
  - [ ] 导航菜单配置
  - [ ] 页面路由映射
  - [ ] 权限配置

**产出**:
- `app/dashboard/settings/layout.tsx`
- `components/settings/SettingsNav.tsx`
- `components/settings/SettingsBreadcrumb.tsx`
- `constants/settings.ts`

**Git提交**:
```bash
git add app/dashboard/settings/layout.tsx components/settings/ constants/settings.ts
git commit -m "feat: implement settings layout and navigation (Phase 3 🟢 GREEN)"
```

---

## 📋 Phase 4: 个人资料页面实现 (2.5小时) 🟢 GREEN

**状态**: 📋 待开始

### 4.1 个人资料页面

- [ ] 创建 `app/dashboard/settings/profile/page.tsx`
  - [ ] 个人信息表单
  - [ ] 头像上传（Mock，实际不上传）
  - [ ] 数据加载状态
  - [ ] 错误处理

### 4.2 个人资料表单组件

- [ ] 创建 `components/settings/ProfileForm.tsx`
  - [ ] React Hook Form + Zod验证
  - [ ] 昵称、邮箱输入
  - [ ] 实时验证
  - [ ] 提交处理

### 4.3 头像组件

- [ ] 创建 `components/settings/AvatarUpload.tsx`
  - [ ] 头像预览
  - [ ] 上传按钮（Mock）
  - [ ] 默认头像生成（首字母）

**产出**:
- `app/dashboard/settings/profile/page.tsx`
- `components/settings/ProfileForm.tsx`
- `components/settings/AvatarUpload.tsx`

**Git提交**:
```bash
git add app/dashboard/settings/profile/ components/settings/ProfileForm.tsx components/settings/AvatarUpload.tsx
git commit -m "feat: implement profile settings page (Phase 4 🟢 GREEN)"
```

---

## 📋 Phase 5: 安全设置页面实现 (2.5小时) 🟢 GREEN

**状态**: 📋 待开始

### 5.1 安全设置页面

- [ ] 创建 `app/dashboard/settings/security/page.tsx`
  - [ ] 密码修改区域
  - [ ] 会话管理区域
  - [ ] 两步验证区域（Mock，后续实现）

### 5.2 密码修改组件

- [ ] 创建 `components/settings/PasswordChangeForm.tsx`
  - [ ] 旧密码输入
  - [ ] 新密码输入
  - [ ] 确认密码输入
  - [ ] 密码强度指示器
  - [ ] 表单验证

### 5.3 会话管理组件

- [ ] 创建 `components/settings/SessionsList.tsx`
  - [ ] 活跃会话列表
  - [ ] 当前会话标记
  - [ ] 删除会话按钮
  - [ ] 确认对话框

**产出**:
- `app/dashboard/settings/security/page.tsx`
- `components/settings/PasswordChangeForm.tsx`
- `components/settings/SessionsList.tsx`

**Git提交**:
```bash
git add app/dashboard/settings/security/ components/settings/PasswordChangeForm.tsx components/settings/SessionsList.tsx
git commit -m "feat: implement security settings page (Phase 5 🟢 GREEN)"
```

---

## 📋 Phase 6: 通知和到期设置页面实现 (2小时) 🟢 GREEN

**状态**: 📋 待开始

### 6.1 通知设置页面

- [ ] 创建 `app/dashboard/settings/notifications/page.tsx`
  - [ ] 通知开关
  - [ ] 通知类型配置
  - [ ] 实时保存

### 6.2 通知设置组件

- [ ] 创建 `components/settings/NotificationConfig.tsx`
  - [ ] 邮件通知开关
  - [ ] 通知类型复选框
  - [ ] 自动保存逻辑

### 6.3 到期设置页面

- [ ] 创建 `app/dashboard/settings/expiration/page.tsx`
  - [ ] 提前提醒天数
  - [ ] 提醒方式选择
  - [ ] 设置预览

### 6.4 到期设置组件

- [ ] 创建 `components/settings/ExpirationConfig.tsx`
  - [ ] 天数输入（1-90）
  - [ ] 提醒方式选择
  - [ ] 设置保存

**产出**:
- `app/dashboard/settings/notifications/page.tsx`
- `app/dashboard/settings/expiration/page.tsx`
- `components/settings/NotificationConfig.tsx`
- `components/settings/ExpirationConfig.tsx`

**Git提交**:
```bash
git add app/dashboard/settings/notifications/ app/dashboard/settings/expiration/ components/settings/NotificationConfig.tsx components/settings/ExpirationConfig.tsx
git commit -m "feat: implement notification and expiration settings pages (Phase 6 🟢 GREEN)"
```

---

## 📋 Phase 7: 工具函数和Hooks (1.5小时) 🔵 REFACTOR

**状态**: 📋 待开始

### 7.1 自定义Hooks

- [ ] 创建 `hooks/use-user-profile.ts`
  - [ ] 获取用户资料
  - [ ] 更新用户资料
  - [ ] 乐观更新

- [ ] 创建 `hooks/use-user-sessions.ts`
  - [ ] 获取会话列表
  - [ ] 删除会话

- [ ] 创建 `hooks/use-settings.ts`
  - [ ] 通用设置获取
  - [ ] 通用设置更新
  - [ ] 自动保存

### 7.2 工具函数

- [ ] 创建 `lib/password-strength.ts`
  - [ ] 密码强度计算
  - [ ] 密码验证规则

- [ ] 创建 `lib/avatar-utils.ts`
  - [ ] 生成默认头像
  - [ ] 头像URL处理

**产出**:
- `hooks/use-user-profile.ts`
- `hooks/use-user-sessions.ts`
- `hooks/use-settings.ts`
- `lib/password-strength.ts`
- `lib/avatar-utils.ts`

**Git提交**:
```bash
git add hooks/use-user-*.ts hooks/use-settings.ts lib/password-strength.ts lib/avatar-utils.ts
git commit -m "refactor: extract user settings hooks and utilities (Phase 7 🔵 REFACTOR)"
```

---

## 📋 Phase 8: 设置页面集成测试 (1小时)

**状态**: 📋 待开始

### 8.1 运行单元测试

- [ ] 运行所有设置页面测试
  ```bash
  npm test -- --testPathPattern="settings"
  ```

- [ ] 确保测试覆盖率 > 80%
  ```bash
  npm test -- --coverage --testPathPattern="settings"
  ```

### 8.2 集成测试

- [ ] 创建 `tests/integration/user-settings.test.ts`
  - [ ] 完整的设置更新流程
  - [ ] 跨页面导航测试
  - [ ] 数据持久化验证

### 8.3 修复测试失败

- [ ] 分析失败原因
- [ ] 修复代码或测试
- [ ] 重新运行验证

**产出**:
- `tests/integration/user-settings.test.ts`
- 测试覆盖率报告

**Git提交**:
```bash
git add tests/integration/user-settings.test.ts
git commit -m "test: add user settings integration tests (Phase 8 ✅)"
```

---

## 📋 Phase 9: 文档和合并 (1小时) 📝

**状态**: 📋 待开始

### 9.1 创建Sprint总结

- [ ] 创建 `docs/SPRINT_14_SUMMARY.md`
  - [ ] Sprint概述
  - [ ] 主要成果
  - [ ] 技术亮点
  - [ ] 测试覆盖
  - [ ] 遇到的挑战
  - [ ] 后续优化建议

### 9.2 更新项目文档

- [ ] 更新 `docs/SPRINT_INDEX.md`
  - [ ] 添加Sprint 14条目
  - [ ] 更新总体进度

- [ ] 更新 `README.md`
  - [ ] 添加设置页面说明
  - [ ] 更新功能清单

### 9.3 代码审查和清理

- [ ] 检查代码规范
- [ ] 清理console.log
- [ ] 优化import语句
- [ ] 检查TypeScript类型

### 9.4 准备合并

- [ ] 切换到develop分支
  ```bash
  git checkout develop
  git pull origin develop
  ```

- [ ] 合并feature分支
  ```bash
  git merge feature/user-settings --no-ff -m "merge: Sprint 14 - 用户设置和个人中心UI (✅ COMPLETE)"
  ```

- [ ] 验证合并结果
  ```bash
  npm run build
  npm test
  ```

### 9.5 Git提交和更新

- [ ] 提交Sprint 14总结
  ```bash
  git add docs/
  git commit -m "docs: add Sprint 14 summary and update index (📝 DOCS)"
  ```

- [ ] 创建Sprint 15 todolist（如需要）
  - [ ] 分析下一步优先级
  - [ ] 创建 `docs/SPRINT_15_TODOLIST.md`
  - [ ] 提交并推送

**产出**:
- `docs/SPRINT_14_SUMMARY.md`
- 更新的 `docs/SPRINT_INDEX.md`
- 更新的 `README.md`
- 合并完成的develop分支

**Git提交**:
```bash
git add docs/ README.md
git commit -m "docs: Sprint 14 complete and prepare Sprint 15 (📝 DOCS)"
```

---

## 📊 Sprint 14 检查清单

### 功能完整性
- [ ] 5个设置页面全部实现
- [ ] 所有API集成完成
- [ ] 响应式设计适配
- [ ] 表单验证完整

### 测试覆盖
- [ ] 单元测试 > 35个
- [ ] 集成测试完成
- [ ] 测试覆盖率 > 80%
- [ ] 所有测试通过

### 代码质量
- [ ] TypeScript类型完整
- [ ] ESLint无错误
- [ ] Prettier格式化
- [ ] 代码注释充分

### TDD流程
- [ ] 🔴 RED: 先写测试
- [ ] 🟢 GREEN: 实现功能
- [ ] 🔵 REFACTOR: 代码优化

### 文档完整性
- [ ] Phase 1总结
- [ ] Sprint总结
- [ ] API文档更新
- [ ] README更新

---

## 📈 预期成果

### 新增页面 (5个)
1. `/dashboard/settings` - 设置主页
2. `/dashboard/settings/profile` - 个人资料
3. `/dashboard/settings/security` - 安全设置
4. `/dashboard/settings/notifications` - 通知设置
5. `/dashboard/settings/expiration` - 到期设置

### 新增组件 (8个)
1. `SettingsNav` - 设置导航
2. `SettingsBreadcrumb` - 面包屑
3. `ProfileForm` - 资料表单
4. `AvatarUpload` - 头像上传
5. `PasswordChangeForm` - 密码修改
6. `SessionsList` - 会话列表
7. `NotificationConfig` - 通知配置
8. `ExpirationConfig` - 到期配置

### 工具函数和Hooks (5个)
1. `use-user-profile` - 用户资料Hook
2. `use-user-sessions` - 会话管理Hook
3. `use-settings` - 通用设置Hook
4. `password-strength` - 密码强度
5. `avatar-utils` - 头像工具

### 测试文件 (6个)
- 5个页面测试
- 1个集成测试
- 35+ 测试用例

---

## 🎯 下一步计划

**Sprint 14完成后**:
1. 合并到develop分支
2. 运行完整测试套件
3. 部署到测试环境
4. 用户验收测试

**Sprint 15候选主题**:
1. 安装指导页面UI（复用Sprint 3 API）
2. 通知中心页面UI（复用Sprint 6 API）
3. 首页和引导页面
4. E2E测试和生产准备

---

**创建时间**: 2025-10-05
**维护者**: Claude Key Portal Team
**Sprint状态**: 📋 待开始 → 🚧 进行中

---

_"Sprint 14：完善用户体验，打造完整的个人中心！"_
