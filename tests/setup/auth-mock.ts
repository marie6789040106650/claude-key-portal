/**
 * Auth Mock - 全局认证函数Mock
 *
 * 为所有测试提供统一的认证Mock，避免在每个测试中重复设置
 */

// Mock lib/auth.ts
jest.mock('@/lib/auth', () => ({
  getAuthenticatedUser: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
  }),
  getCurrentUser: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
  }),
  verifyToken: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    email: 'test@example.com',
  }),
}))
