/**
 * 密码强度计算工具
 * Sprint 14 - Phase 7 🔵 REFACTOR
 *
 * 提供密码强度评估和验证功能
 */

export type PasswordStrength = '弱' | '中' | '强'

/**
 * 计算密码强度
 *
 * @param {string} password - 待评估的密码
 * @returns {PasswordStrength} 密码强度等级（弱、中、强）
 *
 * @example
 * calculatePasswordStrength('abc123') // => '弱'
 * calculatePasswordStrength('Abc123!@#') // => '强'
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) return '弱'

  let strength = 0

  // 长度评分
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++

  // 包含小写字母
  if (/[a-z]/.test(password)) strength++

  // 包含大写字母
  if (/[A-Z]/.test(password)) strength++

  // 包含数字
  if (/\d/.test(password)) strength++

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

  // 根据评分返回强度等级
  if (strength <= 2) return '弱'
  if (strength <= 4) return '中'
  return '强'
}

/**
 * 密码强度配置
 */
export const PASSWORD_STRENGTH_CONFIG = {
  弱: {
    label: '弱',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: '密码强度较弱，建议使用更复杂的密码',
  },
  中: {
    label: '中',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: '密码强度一般，建议增加特殊字符或长度',
  },
  强: {
    label: '强',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: '密码强度良好',
  },
} as const

/**
 * 获取密码强度配置
 *
 * @param {PasswordStrength} strength - 密码强度等级
 * @returns {object} 强度配置（颜色、描述等）
 *
 * @example
 * const config = getPasswordStrengthConfig('强')
 * console.log(config.color) // => 'text-green-600'
 */
export function getPasswordStrengthConfig(strength: PasswordStrength) {
  return PASSWORD_STRENGTH_CONFIG[strength]
}

/**
 * 验证密码是否满足最低要求
 *
 * @param {string} password - 待验证的密码
 * @returns {boolean} 是否满足最低要求
 *
 * @example
 * validatePasswordRequirements('abc123') // => false
 * validatePasswordRequirements('Abc123!@#') // => true
 */
export function validatePasswordRequirements(password: string): boolean {
  // 至少8个字符
  if (password.length < 8) return false

  // 必须包含大写字母
  if (!/[A-Z]/.test(password)) return false

  // 必须包含小写字母
  if (!/[a-z]/.test(password)) return false

  // 必须包含数字
  if (!/\d/.test(password)) return false

  // 必须包含特殊字符
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false

  return true
}

/**
 * 生成密码强度反馈建议
 *
 * @param {string} password - 待评估的密码
 * @returns {string[]} 改进建议列表
 *
 * @example
 * getPasswordFeedback('abc123')
 * // => ['密码长度至少需要8个字符', '需要包含大写字母', ...]
 */
export function getPasswordFeedback(password: string): string[] {
  const feedback: string[] = []

  if (password.length < 8) {
    feedback.push('密码长度至少需要8个字符')
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('需要包含大写字母')
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('需要包含小写字母')
  }

  if (!/\d/.test(password)) {
    feedback.push('需要包含数字')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('需要包含特殊字符')
  }

  if (password.length < 12 && feedback.length === 0) {
    feedback.push('建议使用12个或更多字符以提高安全性')
  }

  return feedback
}
