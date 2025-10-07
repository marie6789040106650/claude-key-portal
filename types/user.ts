/**
 * 用户相关类型定义
 *
 * 定义用户、会话、个人资料等类型
 */

/**
 * 用户基础信息
 */
export interface User {
  id: string
  email: string
  nickname: string
  avatar?: string
  bio?: string
  createdAt: string
  updatedAt: string
}

/**
 * 用户完整资料（包含统计）
 */
export interface UserProfile extends User {
  stats: {
    apiKeyCount: number
  }
}

/**
 * 用户会话信息
 */
export interface UserSession {
  id: string
  userId: string
  token: string // 脱敏后的token（前后4位）
  deviceInfo: string // 设备信息（浏览器、操作系统）
  ipAddress: string
  lastActive: string
  createdAt: string
  isCurrent?: boolean // 是否为当前会话
}

/**
 * 个人资料更新请求
 */
export interface UpdateProfileInput {
  nickname?: string // 最多50字符
  avatar?: string
  bio?: string // 最多200字符
}

/**
 * 密码修改请求
 */
export interface ChangePasswordInput {
  oldPassword: string
  newPassword: string
}

/**
 * 密码强度级别
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong'

/**
 * 密码强度检查结果
 */
export interface PasswordStrengthResult {
  strength: PasswordStrength
  score: number // 0-100
  feedback: string[]
  requirements: {
    length: boolean // >= 8字符
    uppercase: boolean // 包含大写字母
    lowercase: boolean // 包含小写字母
    number: boolean // 包含数字
    special: boolean // 包含特殊字符
  }
}
