/**
 * 密钥领域类型定义
 */

/**
 * 密钥状态枚举
 */
export enum KeyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED',
  RATE_LIMITED = 'RATE_LIMITED',
}

/**
 * 创建密钥属性
 */
export interface CreateKeyProps {
  userId: string
  crsKeyId: string
  crsKey: string
  name: string
  description?: string
  monthlyLimit?: number
  expiresAt?: Date
}

/**
 * 密钥属性接口
 */
export interface KeyProps {
  id: string
  userId: string
  crsKeyId: string
  crsKey: string
  name: string
  description: string | null
  status: KeyStatus
  monthlyLimit: number | null
  expiresAt: Date | null
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 密钥DTO（返回给前端）
 */
export interface KeyDto {
  id: string
  userId: string
  crsKeyId: string
  crsKey: string
  name: string
  description: string | null
  status: KeyStatus
  monthlyLimit: number | null
  expiresAt: Date | null
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 更新密钥属性
 */
export interface UpdateKeyProps {
  name?: string
  description?: string
  monthlyLimit?: number
  expiresAt?: Date
  status?: KeyStatus
}

/**
 * CRS密钥创建响应
 */
export interface CrsKeyResponse {
  id: string
  key: string
  name: string
  description?: string
  status: string
  createdAt: Date
}
