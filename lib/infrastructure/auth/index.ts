/**
 * 认证服务层导出索引
 * Phase 2.2 - 🔵 REFACTOR
 *
 * 统一导出认证相关服务，方便其他层使用
 */

import { PasswordService } from './password-service'
import { JwtService } from './jwt-service'

// 导出类（用于测试）
export { PasswordService } from './password-service'
export { JwtService } from './jwt-service'

// 导出单例实例（用于生产）
export const passwordService = new PasswordService()
export const jwtService = new JwtService()

// 导出类型
export type { JwtPayload, TokenPair } from './jwt-service'
