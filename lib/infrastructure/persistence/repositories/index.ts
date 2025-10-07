/**
 * Repository层导出索引
 * Phase 2.1 - 🔵 REFACTOR
 *
 * 统一导出所有Repository，方便其他层使用
 */

import { UserRepository } from './user.repository'
import { KeyRepository } from './key.repository'
import { SessionRepository } from './session.repository'
import { NotificationRepository } from './notification.repository'

// 导出类（用于测试）
export { UserRepository } from './user.repository'
export { KeyRepository } from './key.repository'
export { SessionRepository } from './session.repository'
export { NotificationRepository } from './notification.repository'

// 导出单例实例（用于生产）
export const userRepository = new UserRepository()
export const keyRepository = new KeyRepository()
export const sessionRepository = new SessionRepository()
export const notificationRepository = new NotificationRepository()

// 导出类型
export type { DomainUser } from './user.repository'
export type { DomainKey } from './key.repository'
export type { DomainSession, CreateSessionProps } from './session.repository'
