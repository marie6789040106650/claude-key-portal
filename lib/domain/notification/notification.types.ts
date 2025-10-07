/**
 * Notification Domain Types
 * 通知领域类型定义
 */

import { NotificationType } from '@prisma/client'

/**
 * 通知渠道类型
 */
export type NotificationChannel = 'email' | 'webhook' | 'system'

/**
 * 通知状态
 */
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED'

/**
 * 发送通知输入
 */
export interface SendNotificationInput {
  userId?: string // 可选，系统级通知不需要userId
  type: NotificationType
  title: string
  message: string
  data?: any
  channels?: NotificationChannel[] // 不指定则使用用户配置（系统通知必须指定）
}

/**
 * 通知记录
 */
export interface NotificationRecord {
  id: string
  userId: string | null
  type: NotificationType
  title: string
  message: string
  data?: any
  channel: string
  status: NotificationStatus
  sentAt?: Date
  error?: string
  createdAt: Date
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  userId: string
  rules: NotificationRule[]
  channels: {
    email?: EmailChannelConfig
    webhook?: WebhookChannelConfig
    system?: SystemChannelConfig
  }
}

/**
 * 通知规则
 */
export interface NotificationRule {
  type: NotificationType
  enabled: boolean
  channels: NotificationChannel[]
}

/**
 * 邮件渠道配置
 */
export interface EmailChannelConfig {
  enabled: boolean
  address?: string
}

/**
 * Webhook渠道配置
 */
export interface WebhookChannelConfig {
  enabled: boolean
  url?: string
  secret?: string
}

/**
 * 系统渠道配置
 */
export interface SystemChannelConfig {
  enabled: boolean
}

/**
 * Webhook发送选项
 */
export interface WebhookOptions {
  url: string
  secret: string
  payload: any
}

/**
 * 邮件发送选项
 */
export interface EmailOptions {
  to: string
  subject: string
  html: string
}
