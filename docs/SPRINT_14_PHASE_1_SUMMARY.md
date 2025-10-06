# Sprint 14 Phase 1 总结 - API准备和验证

> **Sprint**: 14 - 用户设置和个人中心UI
> **Phase**: 1 - API准备和验证
> **日期**: 2025-10-06
> **状态**: ✅ 完成

---

## 📋 阶段目标

Phase 1的目标是完成所有必要的API文档阅读、理解业务需求，并为后续的UI开发做好准备。

---

## ✅ 完成内容

### 1. API文档阅读

#### Sprint 5 - 账户设置API (docs/API_ENDPOINTS_SPRINT5.md)

**个人资料管理**:
- `GET /api/user/profile` - 获取用户资料
  - 返回：id, email, nickname, avatar, bio, createdAt, updatedAt
- `PUT /api/user/profile` - 更新用户资料
  - 可更新：nickname, avatar, bio
  - 验证：nickname 1-50字符，avatar URL格式，bio 最多500字符

**密码管理**:
- `PUT /api/user/password` - 修改密码
  - 字段：oldPassword, newPassword
  - 验证：
    - 长度 >= 8字符
    - 包含大写字母
    - 包含小写字母
    - 包含数字
    - 包含特殊字符 (!@#$%^&*()_+-=[]{}|;:,.<>?)

**会话管理**:
- `GET /api/user/sessions` - 获取活跃会话列表
  - 返回：id, device, browser, location, ip, lastActiveAt, isCurrent
- `DELETE /api/user/sessions/:id` - 注销指定会话
- `DELETE /api/user/sessions` - 注销所有其他会话（保留当前）

#### Sprint 6 - 通知系统API (docs/API_ENDPOINTS_SPRINT6.md)

**通知配置管理**:
- `GET /api/user/notification-config` - 获取通知配置（首次自动创建）
  - channels: { email, webhook, system }
  - types: { KEY_CREATED, KEY_DELETED, USAGE_WARNING, SECURITY_ALERT, SYSTEM_UPDATE }
- `PUT /api/user/notification-config` - 更新通知配置
  - 至少保留一个渠道或类型

**通知记录管理**:
- `GET /api/user/notifications` - 获取通知列表
  - 支持分页：page, pageSize（默认20）
  - 支持筛选：unread=true
- `PUT /api/user/notifications/:id/read` - 标记单个通知已读
- `PUT /api/user/notifications/read-all` - 标记所有通知已读
- `DELETE /api/user/notifications/:id` - 删除单个通知

**Webhook配置**:
- `PUT /api/user/notification-config/webhook` - 配置Webhook URL和密钥
  - webhookUrl: HTTPS URL
  - webhookSecret: 用于HMAC签名验证

#### Sprint 7 - 到期提醒API (docs/API_ENDPOINTS_SPRINT7.md)

**密钥到期时间管理**:
- `PATCH /api/keys/:id` - 更新密钥到期时间
  - 字段：expiresAt (ISO 8601格式或null)
  - 验证：不能设置为过去时间
  - null = 永不过期

**到期提醒配置**:
- `GET /api/user/expiration-settings` - 获取提醒配置（首次自动创建）
  - reminderDays: [7, 3, 1] (1-30天，默认值)
  - notifyChannels: ["email", "webhook", "system"]
  - enabled: boolean
- `PUT /api/user/expiration-settings` - 更新提醒配置
  - reminderDays: 自动去重和降序排序
  - 至少保留1个reminderDays和1个notifyChannels

**通知格式**:
- 类型：KEY_EXPIRATION_WARNING
- 数据：apiKeyId, apiKeyName, daysRemaining, expiresAt

**业务流程**:
- 定时任务每日09:00执行检查
- 根据用户配置发送多渠道通知
- 防止重复发送（ExpirationReminder表）

### 2. 原型设计分析 (prototypes/settings.html)

**页面结构 - 4个标签页**:

#### Tab 1: 个人信息 (Profile)
- **基本信息卡片**:
  - 头像上传（JPG/PNG, 最大2MB）
  - 用户名
  - 邮箱（禁用，不可修改）
  - 昵称（可选）
  - 保存按钮

- **账号信息卡片**:
  - 用户ID
  - 注册时间
  - 账号状态（Badge显示）

#### Tab 2: 安全设置 (Security)
- **修改密码卡片**:
  - 当前密码
  - 新密码（提示：8+ chars, 大小写+数字+特殊字符）
  - 确认新密码
  - 更新密码按钮

- **登录会话卡片**:
  - 当前设备（绿色高亮，显示设备类型/浏览器/位置/最后活动时间）
  - 其他设备列表（灰色，可单独注销）
  - 注销所有其他设备按钮

- **危险操作区域**:
  - 红色边框警告
  - 删除账号按钮（不可撤销）

#### Tab 3: 偏好设置 (Preferences)
- **界面偏好卡片**:
  - 主题（跟随系统/浅色模式/深色模式）
  - 语言（简体中文/English）
  - 时区（Asia/Shanghai等）

- **数据偏好卡片**:
  - 默认统计时间范围（最近7天/30天/本月）
  - 数据刷新频率（30秒/1分钟/5分钟/手动）

#### Tab 4: 通知设置 (Notifications)
- **邮件通知卡片**:
  - 密钥创建通知（Toggle Switch，默认开启）
  - 使用量告警（Toggle Switch，默认开启）
  - 安全告警（Toggle Switch，默认开启）
  - 产品更新通知（Toggle Switch，默认关闭）

### 3. 类型定义创建

#### types/user.ts
```typescript
export interface User {
  id: string
  email: string
  nickname: string
  avatar?: string
  bio?: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  email: string
  nickname: string
  avatar?: string
  bio?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileInput {
  nickname?: string
  avatar?: string
  bio?: string
}

export interface ChangePasswordInput {
  oldPassword: string
  newPassword: string
}

export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong'

export interface PasswordStrengthResult {
  strength: PasswordStrength
  score: number // 0-100
  feedback: string[]
  requirements: {
    length: boolean // >= 8字符
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

export interface UserSession {
  id: string
  userId: string
  device: string
  browser: string
  location: string
  ip: string
  lastActiveAt: string
  isCurrent: boolean
  createdAt: string
}
```

#### types/settings.ts
```typescript
export interface NotificationChannels {
  email: boolean
  webhook: boolean
  system: boolean
}

export interface NotificationTypes {
  KEY_CREATED: boolean
  KEY_DELETED: boolean
  USAGE_WARNING: boolean
  SECURITY_ALERT: boolean
  SYSTEM_UPDATE: boolean
}

export interface NotificationConfig {
  id: string
  userId: string
  channels: NotificationChannels
  types: NotificationTypes
  webhookUrl?: string | null
  webhookSecret?: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateNotificationConfigInput {
  channels?: Partial<NotificationChannels>
  types?: Partial<NotificationTypes>
}

export interface WebhookConfigInput {
  webhookUrl: string | null
  webhookSecret?: string | null
}

export interface Notification {
  id: string
  userId: string
  type: keyof NotificationTypes
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  createdAt: string
}

export interface ExpirationSettings {
  id: string
  userId: string
  reminderDays: number[] // 提前几天提醒（1-30天）
  notifyChannels: ('email' | 'webhook' | 'system')[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateExpirationSettingsInput {
  reminderDays?: number[]
  notifyChannels?: ('email' | 'webhook' | 'system')[]
  enabled?: boolean
}
```

### 4. API验证脚本 (scripts/test-user-profile.ts)

创建了完整的API验证脚本，包含：
- Sprint 5: 用户资料、密码、会话API测试
- Sprint 6: 通知配置、通知记录API测试
- Sprint 7: 到期提醒配置API测试

**注意**: 脚本需要运行开发服务器才能执行验证。

---

## 📊 API端点清单

### Sprint 5 (3个端点)
- [x] `GET /api/user/profile`
- [x] `PUT /api/user/profile`
- [x] `PUT /api/user/password`
- [x] `GET /api/user/sessions`
- [x] `DELETE /api/user/sessions/:id`
- [x] `DELETE /api/user/sessions`

### Sprint 6 (7个端点)
- [x] `GET /api/user/notification-config`
- [x] `PUT /api/user/notification-config`
- [x] `PUT /api/user/notification-config/webhook`
- [x] `GET /api/user/notifications`
- [x] `PUT /api/user/notifications/:id/read`
- [x] `PUT /api/user/notifications/read-all`
- [x] `DELETE /api/user/notifications/:id`

### Sprint 7 (3个端点)
- [x] `PATCH /api/keys/:id` (expiresAt字段)
- [x] `GET /api/user/expiration-settings`
- [x] `PUT /api/user/expiration-settings`

**总计**: 13个API端点

---

## 🎨 UI组件需求清单

### 页面级组件
- [ ] `app/dashboard/settings/page.tsx` - 设置主页面
- [ ] `app/dashboard/settings/layout.tsx` - 设置布局（可选）

### Tab组件
- [ ] `components/settings/ProfileTab.tsx` - 个人信息标签页
- [ ] `components/settings/SecurityTab.tsx` - 安全设置标签页
- [ ] `components/settings/PreferencesTab.tsx` - 偏好设置标签页
- [ ] `components/settings/NotificationsTab.tsx` - 通知设置标签页

### 卡片组件
- [ ] `components/settings/ProfileCard.tsx` - 基本信息卡片
- [ ] `components/settings/AccountInfoCard.tsx` - 账号信息卡片
- [ ] `components/settings/PasswordCard.tsx` - 修改密码卡片
- [ ] `components/settings/SessionsCard.tsx` - 登录会话卡片
- [ ] `components/settings/DangerZoneCard.tsx` - 危险操作卡片
- [ ] `components/settings/PreferencesCard.tsx` - 偏好设置卡片
- [ ] `components/settings/NotificationToggles.tsx` - 通知开关列表

### 通用组件（可能需要创建）
- [ ] `components/settings/AvatarUpload.tsx` - 头像上传组件
- [ ] `components/settings/PasswordStrengthIndicator.tsx` - 密码强度指示器
- [ ] `components/settings/SessionItem.tsx` - 会话列表项
- [ ] `components/ui/tabs.tsx` - 标签页组件（Shadcn/ui）

---

## 🧪 测试需求清单

### Phase 2 将创建的测试

#### 组件单元测试（35+个测试用例）

**ProfileTab.test.tsx** (8 tests):
- [ ] 渲染基本信息表单
- [ ] 显示当前用户信息
- [ ] 更新昵称
- [ ] 上传头像
- [ ] 验证昵称长度（1-50）
- [ ] 显示账号信息
- [ ] 保存按钮disabled状态
- [ ] 表单提交成功/失败

**SecurityTab.test.tsx** (10 tests):
- [ ] 渲染修改密码表单
- [ ] 密码验证规则提示
- [ ] 密码强度指示器
- [ ] 旧密码错误提示
- [ ] 新密码验证（8+ chars, 大小写+数字+特殊字符）
- [ ] 确认密码匹配验证
- [ ] 显示活跃会话列表
- [ ] 注销单个会话
- [ ] 注销所有其他会话
- [ ] 删除账号确认弹窗

**PreferencesTab.test.tsx** (7 tests):
- [ ] 渲染偏好设置表单
- [ ] 主题选择（跟随系统/浅色/深色）
- [ ] 语言切换（中文/英文）
- [ ] 时区选择
- [ ] 统计时间范围选择
- [ ] 数据刷新频率选择
- [ ] 保存偏好设置

**NotificationsTab.test.tsx** (10 tests):
- [ ] 渲染通知开关列表
- [ ] 默认状态（密钥创建、使用量、安全告警开启）
- [ ] 切换密钥创建通知
- [ ] 切换使用量告警
- [ ] 切换安全告警
- [ ] 切换产品更新通知
- [ ] 批量开启/关闭
- [ ] Webhook配置（URL和密钥）
- [ ] Webhook URL验证（HTTPS）
- [ ] 保存通知配置

#### 集成测试（可选，Phase 3）
- [ ] 用户修改资料端到端流程
- [ ] 密码修改流程
- [ ] 会话管理流程
- [ ] 通知配置流程

---

## 🚀 数据流设计

### 状态管理方案
使用 **React Query** 进行服务器状态管理：

```typescript
// hooks/use-user-profile.ts
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile')
      return res.json()
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
    },
  })
}

// hooks/use-sessions.ts
export function useSessions() {
  return useQuery({
    queryKey: ['user', 'sessions'],
    queryFn: async () => {
      const res = await fetch('/api/user/sessions')
      return res.json()
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'sessions'] })
    },
  })
}

// hooks/use-notifications.ts
export function useNotificationConfig() {
  return useQuery({
    queryKey: ['user', 'notification-config'],
    queryFn: async () => {
      const res = await fetch('/api/user/notification-config')
      return res.json()
    },
  })
}

export function useUpdateNotificationConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateNotificationConfigInput) => {
      const res = await fetch('/api/user/notification-config', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'notification-config'] })
    },
  })
}

// hooks/use-expiration-settings.ts
export function useExpirationSettings() {
  return useQuery({
    queryKey: ['user', 'expiration-settings'],
    queryFn: async () => {
      const res = await fetch('/api/user/expiration-settings')
      return res.json()
    },
  })
}
```

### 表单管理方案
使用 **React Hook Form + Zod** 进行表单验证：

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const profileSchema = z.object({
  nickname: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
})

export function ProfileForm() {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(profileSchema),
  })

  const updateProfile = useUpdateProfile()

  const onSubmit = handleSubmit((data) => {
    updateProfile.mutate(data)
  })

  return (
    <form onSubmit={onSubmit}>
      {/* ... */}
    </form>
  )
}
```

---

## 📝 关键技术决策

### 1. 标签页实现
**选择**: 使用 Shadcn/ui Tabs 组件
**原因**:
- 无障碍访问（Radix UI）
- URL状态同步（可选）
- 响应式设计

### 2. 头像上传
**选择**: 使用第三方服务（如Cloudinary）或本地存储
**考虑**:
- 图片压缩和优化
- 格式转换（JPEG/PNG → WebP）
- 大小限制（2MB）

### 3. 密码强度检测
**选择**: 使用 zxcvbn 库
**原因**:
- 准确的强度评估
- 友好的反馈信息
- 轻量级（已在项目中安装）

### 4. 会话管理
**选择**: 轮询或WebSocket
**考虑**:
- 轮询：简单，适合低频更新
- WebSocket：实时，适合高频更新

### 5. 通知开关
**选择**: 使用 Shadcn/ui Switch 组件
**原因**:
- 符合设计规范
- 无障碍访问
- 动画效果流畅

---

## ⚠️ 注意事项

### 1. API验证
- API验证脚本已创建 (`scripts/test-user-profile.ts`)
- **需要运行开发服务器** (`npm run dev`) 才能执行验证
- 建议在Phase 2开始前运行验证，确保API可用

### 2. 密码安全
- 新密码必须满足所有验证规则（8+ chars, 大小写+数字+特殊字符）
- 后端应使用bcrypt加密存储
- 前端应清除密码输入框历史记录（autocomplete="new-password"）

### 3. 会话安全
- 注销会话后应立即失效token
- 删除账号应同时删除所有会话
- 当前设备会话不能被注销

### 4. 通知配置
- 至少保留一个通知渠道
- 至少保留一个通知类型
- Webhook URL必须是HTTPS
- Webhook密钥用于HMAC签名验证

### 5. 到期提醒
- reminderDays自动去重和降序排序
- 同一密钥同一阶段只发送一次提醒
- 提醒配置修改后立即生效于下次检查

---

## 📈 下一步计划 (Phase 2)

### Phase 2: 🔴 RED - 编写测试

**目标**: 为所有设置页面组件编写单元测试

**任务清单**:
1. 创建测试文件结构
   - tests/unit/components/settings/ProfileTab.test.tsx
   - tests/unit/components/settings/SecurityTab.test.tsx
   - tests/unit/components/settings/PreferencesTab.test.tsx
   - tests/unit/components/settings/NotificationsTab.test.tsx

2. 编写35+个测试用例（详见上方测试需求清单）

3. 运行测试，确保全部失败（🔴 RED）

4. Git提交：`test: add settings page tests (🔴 RED)`

**预计时间**: 3-4小时

---

## 📊 Phase 1 统计

- **API端点**: 13个
- **类型定义**: 2个文件，15+个类型
- **UI组件需求**: 12+个组件
- **测试用例**: 35+个
- **文档阅读**: 3个API文档 + 1个原型HTML
- **耗时**: 约2小时

---

**Phase 1状态**: ✅ 完成
**准备就绪**: 可以开始Phase 2（编写测试）

---

_"理解需求是成功的一半！Phase 1为后续开发奠定了坚实基础。"_
