/**
 * 设置相关类型定义
 *
 * 定义通知配置、到期设置等类型
 */

/**
 * 通知渠道配置
 */
export interface NotificationChannels {
  email: {
    enabled: boolean
    address: string
  }
  webhook: {
    enabled: boolean
    url: string
    secret: string
  }
  system: {
    enabled: boolean
  }
}

/**
 * 通知类型配置
 */
export interface NotificationTypes {
  keyCreated: boolean // 密钥创建
  keyExpiringSoon: boolean // 密钥即将过期
  keyExpired: boolean // 密钥已过期
  quotaWarning: boolean // 配额警告
  quotaExceeded: boolean // 配额超限
  securityAlert: boolean // 安全警报
  systemMaintenance: boolean // 系统维护
  productUpdates: boolean // 产品更新
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  id: string
  userId: string
  channels: NotificationChannels
  types: NotificationTypes
  createdAt: string
  updatedAt: string
}

/**
 * 通知配置更新请求
 */
export interface UpdateNotificationConfigInput {
  channels?: Partial<NotificationChannels>
  types?: Partial<NotificationTypes>
}

/**
 * 密钥到期提醒设置
 */
export interface ExpirationSettings {
  id: string
  userId: string
  reminderDays: number[] // 提前几天提醒（支持多个提醒时间，如[7, 14, 30]）
  notifyChannels: ('email' | 'webhook' | 'system')[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 到期设置更新请求
 */
export interface UpdateExpirationSettingsInput {
  reminderDays?: number[] // 1-30天，支持多个
  notifyChannels?: ('email' | 'webhook' | 'system')[]
  enabled?: boolean
}

/**
 * 设置导航项
 */
export interface SettingsNavItem {
  id: string
  label: string
  icon: string
  path: string
  description?: string
}

/**
 * 设置表单状态
 */
export type SettingsFormStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * 设置表单错误
 */
export interface SettingsFormError {
  field?: string
  message: string
}
