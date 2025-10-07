/**
 * 用户实体
 *
 * 封装用户业务逻辑和规则
 */

import {
  UserStatus,
  UserRole,
  type CreateUserProps,
  type UserProps,
  type UserDto,
  type UpdateUserProps,
} from './user.types'
import {
  AccountSuspendedError,
  AccountDeletedError,
  InvalidPasswordError,
  ValidationError,
} from '../shared/errors'

export class User {
  private constructor(private props: UserProps) {}

  /**
   * 创建新用户
   */
  static create(data: CreateUserProps): User {
    // 验证邮箱或手机号必须有一个
    if (!data.email && !data.phone) {
      throw new ValidationError('邮箱或手机号至少提供一个')
    }

    // 验证密码哈希
    if (!data.passwordHash || data.passwordHash.length < 20) {
      throw new ValidationError('密码哈希无效')
    }

    const now = new Date()

    return new User({
      id: '', // 由数据库生成
      email: data.email || null,
      phone: data.phone || null,
      passwordHash: data.passwordHash,
      nickname: data.nickname || null,
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      role: UserRole.USER,
      emailVerified: false,
      phoneVerified: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  /**
   * 从数据库记录重建实体
   */
  static fromPersistence(data: UserProps): User {
    return new User(data)
  }

  // ========== Getters ==========

  get id(): string {
    return this.props.id
  }

  get email(): string | null {
    return this.props.email
  }

  get phone(): string | null {
    return this.props.phone
  }

  get passwordHash(): string {
    return this.props.passwordHash
  }

  get nickname(): string | null {
    return this.props.nickname
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl
  }

  get status(): UserStatus {
    return this.props.status
  }

  get role(): UserRole {
    return this.props.role
  }

  get emailVerified(): boolean {
    return this.props.emailVerified
  }

  get phoneVerified(): boolean {
    return this.props.phoneVerified
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // ========== 业务行为 ==========

  /**
   * 检查账户状态是否有效
   */
  checkAccountStatus(): void {
    if (this.props.status === UserStatus.SUSPENDED) {
      throw new AccountSuspendedError()
    }

    if (this.props.status === UserStatus.DELETED) {
      throw new AccountDeletedError()
    }
  }

  /**
   * 验证密码（需要配合PasswordService）
   */
  async verifyPassword(
    plainPassword: string,
    passwordService: { compare: (plain: string, hash: string) => Promise<boolean> }
  ): Promise<boolean> {
    return await passwordService.compare(plainPassword, this.props.passwordHash)
  }

  /**
   * 更新用户信息
   */
  update(data: UpdateUserProps): void {
    if (data.nickname !== undefined) {
      this.props.nickname = data.nickname
    }

    if (data.avatarUrl !== undefined) {
      this.props.avatarUrl = data.avatarUrl
    }

    if (data.email !== undefined) {
      this.props.email = data.email
      this.props.emailVerified = false // 邮箱变更需重新验证
    }

    if (data.phone !== undefined) {
      this.props.phone = data.phone
      this.props.phoneVerified = false // 手机号变更需重新验证
    }

    this.props.updatedAt = new Date()
  }

  /**
   * 更新密码
   */
  updatePassword(newPasswordHash: string): void {
    if (!newPasswordHash || newPasswordHash.length < 20) {
      throw new ValidationError('新密码哈希无效')
    }

    this.props.passwordHash = newPasswordHash
    this.props.updatedAt = new Date()
  }

  /**
   * 记录登录
   */
  recordLogin(): void {
    this.props.lastLoginAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * 验证邮箱
   */
  verifyEmail(): void {
    if (!this.props.email) {
      throw new ValidationError('用户没有邮箱')
    }
    this.props.emailVerified = true
    this.props.updatedAt = new Date()
  }

  /**
   * 验证手机号
   */
  verifyPhone(): void {
    if (!this.props.phone) {
      throw new ValidationError('用户没有手机号')
    }
    this.props.phoneVerified = true
    this.props.updatedAt = new Date()
  }

  /**
   * 停用账户
   */
  suspend(): void {
    this.props.status = UserStatus.SUSPENDED
    this.props.updatedAt = new Date()
  }

  /**
   * 激活账户
   */
  activate(): void {
    this.props.status = UserStatus.ACTIVE
    this.props.updatedAt = new Date()
  }

  /**
   * 删除账户（软删除）
   */
  delete(): void {
    this.props.status = UserStatus.DELETED
    this.props.updatedAt = new Date()
  }

  /**
   * 设置为管理员
   */
  makeAdmin(): void {
    this.props.role = UserRole.ADMIN
    this.props.updatedAt = new Date()
  }

  // ========== 业务查询 ==========

  /**
   * 是否是管理员
   */
  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN
  }

  /**
   * 账户是否激活
   */
  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE
  }

  /**
   * 邮箱是否已验证
   */
  isEmailVerified(): boolean {
    return this.props.emailVerified
  }

  /**
   * 手机号是否已验证
   */
  isPhoneVerified(): boolean {
    return this.props.phoneVerified
  }

  // ========== 数据转换 ==========

  /**
   * 转换为安全DTO（移除敏感信息）
   */
  toDto(): UserDto {
    return {
      id: this.props.id,
      email: this.props.email,
      phone: this.props.phone,
      nickname: this.props.nickname,
      avatarUrl: this.props.avatarUrl,
      status: this.props.status,
      role: this.props.role,
      emailVerified: this.props.emailVerified,
      phoneVerified: this.props.phoneVerified,
      lastLoginAt: this.props.lastLoginAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    }
  }

  /**
   * 转换为持久化数据
   */
  toPersistence(): UserProps {
    return { ...this.props }
  }
}
