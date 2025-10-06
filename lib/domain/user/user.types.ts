/**
 * 用户领域类型定义
 */

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * 创建用户属性
 */
export interface CreateUserProps {
  email?: string
  phone?: string
  passwordHash: string
  nickname?: string
}

/**
 * 用户属性接口
 */
export interface UserProps {
  id: string
  email: string | null
  phone: string | null
  passwordHash: string
  nickname: string | null
  avatarUrl: string | null
  status: UserStatus
  role: UserRole
  emailVerified: boolean
  phoneVerified: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 用户安全信息（用于返回给前端）
 */
export interface UserDto {
  id: string
  email: string | null
  phone: string | null
  nickname: string | null
  avatarUrl: string | null
  status: UserStatus
  role: UserRole
  emailVerified: boolean
  phoneVerified: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 更新用户属性
 */
export interface UpdateUserProps {
  nickname?: string
  avatarUrl?: string
  email?: string
  phone?: string
}
