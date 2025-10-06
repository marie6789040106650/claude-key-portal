/**
 * 领域错误类型
 *
 * 定义所有业务领域的错误类型
 * 遵循Error继承链，便于错误处理和日志记录
 */

/**
 * 基础领域错误
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 用户领域错误
 */
export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`用户不存在: ${identifier}`)
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`用户已存在: ${email}`)
  }
}

export class InvalidPasswordError extends DomainError {
  constructor() {
    super('密码错误')
  }
}

export class AccountSuspendedError extends DomainError {
  constructor() {
    super('账户已被停用，请联系管理员')
  }
}

export class AccountDeletedError extends DomainError {
  constructor() {
    super('账户不存在')
  }
}

export class WeakPasswordError extends DomainError {
  constructor(message?: string) {
    super(message || '密码强度不够，请使用至少8位字符，包含大小写字母、数字和特殊符号')
  }
}

/**
 * 密钥领域错误
 */
export class KeyNotFoundError extends DomainError {
  constructor(keyId: string) {
    super(`密钥不存在: ${keyId}`)
  }
}

export class KeyAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`密钥名称已存在: ${name}`)
  }
}

export class KeyExpiredError extends DomainError {
  constructor(keyId: string) {
    super(`密钥已过期: ${keyId}`)
  }
}

export class KeyInactiveError extends DomainError {
  constructor(keyId: string) {
    super(`密钥已停用: ${keyId}`)
  }
}

export class InvalidKeyNameError extends DomainError {
  constructor(message?: string) {
    super(message || '密钥名称无效，至少需要3个字符')
  }
}

export class MonthlyLimitExceededError extends DomainError {
  constructor(keyId: string) {
    super(`密钥月限额已超: ${keyId}`)
  }
}

/**
 * 认证授权错误
 */
export class UnauthorizedError extends DomainError {
  constructor(message?: string) {
    super(message || '未授权，请先登录')
  }
}

export class ForbiddenError extends DomainError {
  constructor(message?: string) {
    super(message || '无权访问此资源')
  }
}

export class InvalidTokenError extends DomainError {
  constructor() {
    super('Token无效或已过期')
  }
}

/**
 * 数据验证错误
 */
export class ValidationError extends DomainError {
  public readonly fields?: Record<string, string>

  constructor(message: string, fields?: Record<string, string>) {
    super(message)
    this.fields = fields
  }
}

/**
 * 外部服务错误
 */
export class ExternalServiceError extends DomainError {
  constructor(service: string, message: string) {
    super(`${service} 服务错误: ${message}`)
  }
}

export class CrsServiceError extends ExternalServiceError {
  constructor(message: string) {
    super('CRS', message)
  }
}

export class CrsUnavailableError extends ExternalServiceError {
  constructor() {
    super('CRS', 'CRS服务暂时不可用，请稍后重试')
  }
}

/**
 * 业务规则错误
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(rule: string, message: string) {
    super(`业务规则违反 [${rule}]: ${message}`)
  }
}

/**
 * 错误工厂函数
 */
export class ErrorFactory {
  /**
   * 从HTTP状态码创建错误
   */
  static fromHttpStatus(status: number, message?: string): DomainError {
    switch (status) {
      case 401:
        return new UnauthorizedError(message)
      case 403:
        return new ForbiddenError(message)
      case 404:
        return new UserNotFoundError(message || 'Resource not found')
      default:
        return new DomainError(message || `HTTP错误: ${status}`)
    }
  }

  /**
   * 从Prisma错误创建领域错误
   */
  static fromPrismaError(error: any): DomainError {
    if (error.code === 'P2002') {
      // Unique constraint violation
      const target = error.meta?.target?.[0] || 'field'
      return new ValidationError(`${target} 已存在`)
    }

    if (error.code === 'P2025') {
      // Record not found
      return new UserNotFoundError('Record not found')
    }

    return new DomainError(error.message || '数据库错误')
  }
}
