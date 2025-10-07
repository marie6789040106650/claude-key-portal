/**
 * 密钥实体
 *
 * 封装密钥业务逻辑和规则
 */

import {
  KeyStatus,
  type CreateKeyProps,
  type KeyProps,
  type KeyDto,
  type UpdateKeyProps,
} from './key.types'
import {
  InvalidKeyNameError,
  KeyExpiredError,
  KeyInactiveError,
  ValidationError,
} from '../shared/errors'
import { differenceInDays, isPast } from 'date-fns'

export class Key {
  private constructor(private props: KeyProps) {}

  /**
   * 创建新密钥
   */
  static create(data: CreateKeyProps): Key {
    // 验证名称
    if (!data.name || data.name.length < 3) {
      throw new InvalidKeyNameError('密钥名称至少需要3个字符')
    }

    // 验证月限额
    if (data.monthlyLimit !== undefined && data.monthlyLimit < 0) {
      throw new ValidationError('月限额不能为负数')
    }

    // 验证过期时间
    if (data.expiresAt && isPast(data.expiresAt)) {
      throw new ValidationError('过期时间不能是过去的时间')
    }

    const now = new Date()

    return new Key({
      id: '', // 由数据库生成
      userId: data.userId,
      crsKeyId: data.crsKeyId,
      crsKey: data.crsKey,
      name: data.name,
      description: data.description || null,
      status: KeyStatus.ACTIVE,
      monthlyLimit: data.monthlyLimit || null,
      expiresAt: data.expiresAt || null,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  /**
   * 从数据库记录重建实体
   */
  static fromPersistence(data: KeyProps): Key {
    return new Key(data)
  }

  // ========== Getters ==========

  get id(): string {
    return this.props.id
  }

  get userId(): string {
    return this.props.userId
  }

  get crsKeyId(): string {
    return this.props.crsKeyId
  }

  get crsKey(): string {
    return this.props.crsKey
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | null {
    return this.props.description
  }

  get status(): KeyStatus {
    return this.props.status
  }

  get monthlyLimit(): number | null {
    return this.props.monthlyLimit
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt
  }

  get lastUsedAt(): Date | null {
    return this.props.lastUsedAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // ========== 业务行为 ==========

  /**
   * 更新密钥信息
   */
  update(data: UpdateKeyProps): void {
    if (data.name !== undefined) {
      if (data.name.length < 3) {
        throw new InvalidKeyNameError()
      }
      this.props.name = data.name
    }

    if (data.description !== undefined) {
      this.props.description = data.description
    }

    if (data.monthlyLimit !== undefined) {
      if (data.monthlyLimit < 0) {
        throw new ValidationError('月限额不能为负数')
      }
      this.props.monthlyLimit = data.monthlyLimit
    }

    if (data.expiresAt !== undefined) {
      if (isPast(data.expiresAt)) {
        throw new ValidationError('过期时间不能是过去的时间')
      }
      this.props.expiresAt = data.expiresAt
    }

    if (data.status !== undefined) {
      this.props.status = data.status
    }

    this.props.updatedAt = new Date()
  }

  /**
   * 停用密钥
   */
  deactivate(): void {
    this.props.status = KeyStatus.INACTIVE
    this.props.updatedAt = new Date()
  }

  /**
   * 激活密钥
   */
  activate(): void {
    this.props.status = KeyStatus.ACTIVE
    this.props.updatedAt = new Date()
  }

  /**
   * 标记为已过期
   */
  markAsExpired(): void {
    this.props.status = KeyStatus.EXPIRED
    this.props.updatedAt = new Date()
  }

  /**
   * 记录使用
   */
  recordUsage(): void {
    this.props.lastUsedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * 检查密钥是否可用
   * @throws {KeyExpiredError} 密钥已过期
   * @throws {KeyInactiveError} 密钥已停用
   */
  checkAvailability(): void {
    if (this.isExpired()) {
      throw new KeyExpiredError(this.props.id)
    }

    if (this.props.status === KeyStatus.INACTIVE) {
      throw new KeyInactiveError(this.props.id)
    }
  }

  // ========== 业务查询 ==========

  /**
   * 密钥是否已过期
   */
  isExpired(): boolean {
    if (!this.props.expiresAt) {
      return false
    }
    return isPast(this.props.expiresAt)
  }

  /**
   * 密钥是否即将过期（默认7天）
   */
  isExpiringSoon(daysThreshold: number = 7): boolean {
    if (!this.props.expiresAt) {
      return false
    }

    const daysUntilExpiry = differenceInDays(this.props.expiresAt, new Date())
    return daysUntilExpiry >= 0 && daysUntilExpiry <= daysThreshold
  }

  /**
   * 密钥是否激活
   */
  isActive(): boolean {
    return this.props.status === KeyStatus.ACTIVE && !this.isExpired()
  }

  /**
   * 密钥是否停用
   */
  isInactive(): boolean {
    return this.props.status === KeyStatus.INACTIVE
  }

  /**
   * 是否有月限额
   */
  hasMonthlyLimit(): boolean {
    return this.props.monthlyLimit !== null && this.props.monthlyLimit > 0
  }

  /**
   * 是否从未使用过
   */
  isNeverUsed(): boolean {
    return this.props.lastUsedAt === null
  }

  // ========== 数据转换 ==========

  /**
   * 转换为DTO
   */
  toDto(): KeyDto {
    return {
      id: this.props.id,
      userId: this.props.userId,
      crsKeyId: this.props.crsKeyId,
      crsKey: this.props.crsKey,
      name: this.props.name,
      description: this.props.description,
      status: this.props.status,
      monthlyLimit: this.props.monthlyLimit,
      expiresAt: this.props.expiresAt,
      lastUsedAt: this.props.lastUsedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    }
  }

  /**
   * 转换为持久化数据
   */
  toPersistence(): KeyProps {
    return { ...this.props }
  }
}
