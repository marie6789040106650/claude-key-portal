/**
 * SessionRepository 测试
 * Phase 2.1 - 🔴 RED Phase
 * @jest-environment node
 */

import { SessionRepository } from '@/lib/infrastructure/persistence/repositories/session.repository'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import type { Session as PrismaSession } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    session: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

describe('SessionRepository', () => {
  let repository: SessionRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new SessionRepository()
  })

  describe('findById', () => {
    it('应该通过ID找到会话', async () => {
      // Arrange
      const mockSessionId = 'session_123'
      const mockPrismaSession: PrismaSession = {
        id: mockSessionId,
        userId: 'user_123',
        accessToken: 'access_token_xxx',
        refreshToken: 'refresh_token_xxx',
        deviceId: 'device_123',
        deviceName: 'Chrome on MacOS',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        location: { city: 'Beijing', country: 'CN' },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
      }

      ;(prisma.session.findUnique as jest.Mock).mockResolvedValue(
        mockPrismaSession
      )

      // Act
      const result = await repository.findById(mockSessionId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toBeDefined()
      expect(result.value?.id).toBe(mockSessionId)
      expect(result.value?.userId).toBe('user_123')
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: mockSessionId },
      })
    })

    it('当会话不存在时应该返回失败', async () => {
      // Arrange
      ;(prisma.session.findUnique as jest.Mock).mockResolvedValue(null)

      // Act
      const result = await repository.findById('non_existent_id')

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('Session not found')
    })
  })

  describe('findByAccessToken', () => {
    it('应该通过访问令牌找到会话', async () => {
      // Arrange
      const mockAccessToken = 'access_token_xxx'
      const mockPrismaSession: PrismaSession = {
        id: 'session_123',
        userId: 'user_123',
        accessToken: mockAccessToken,
        refreshToken: 'refresh_token_xxx',
        deviceId: null,
        deviceName: null,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        location: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
      }

      ;(prisma.session.findUnique as jest.Mock).mockResolvedValue(
        mockPrismaSession
      )

      // Act
      const result = await repository.findByAccessToken(mockAccessToken)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.accessToken).toBe(mockAccessToken)
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { accessToken: mockAccessToken },
      })
    })
  })

  describe('findByRefreshToken', () => {
    it('应该通过刷新令牌找到会话', async () => {
      // Arrange
      const mockRefreshToken = 'refresh_token_xxx'
      const mockPrismaSession: PrismaSession = {
        id: 'session_123',
        userId: 'user_123',
        accessToken: 'access_token_xxx',
        refreshToken: mockRefreshToken,
        deviceId: null,
        deviceName: null,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        location: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
      }

      ;(prisma.session.findUnique as jest.Mock).mockResolvedValue(
        mockPrismaSession
      )

      // Act
      const result = await repository.findByRefreshToken(mockRefreshToken)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.refreshToken).toBe(mockRefreshToken)
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { refreshToken: mockRefreshToken },
      })
    })
  })

  describe('findByUserId', () => {
    it('应该通过用户ID找到所有会话', async () => {
      // Arrange
      const mockUserId = 'user_123'
      const mockSessions: PrismaSession[] = [
        {
          id: 'session_1',
          userId: mockUserId,
          accessToken: 'access_token_1',
          refreshToken: 'refresh_token_1',
          deviceId: 'device_1',
          deviceName: 'Chrome',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          location: null,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastActivityAt: new Date(),
        },
        {
          id: 'session_2',
          userId: mockUserId,
          accessToken: 'access_token_2',
          refreshToken: 'refresh_token_2',
          deviceId: 'device_2',
          deviceName: 'Safari',
          ip: '192.168.1.2',
          userAgent: 'Safari/5.0...',
          location: null,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastActivityAt: new Date(),
        },
      ]

      ;(prisma.session.findMany as jest.Mock).mockResolvedValue(mockSessions)

      // Act
      const result = await repository.findByUserId(mockUserId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toHaveLength(2)
      expect(result.value?.[0].userId).toBe(mockUserId)
      expect(prisma.session.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { lastActivityAt: 'desc' },
      })
    })
  })

  describe('create', () => {
    it('应该创建新会话', async () => {
      // Arrange
      const createProps = {
        userId: 'user_123',
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }

      const mockPrismaSession: PrismaSession = {
        id: 'session_new',
        userId: createProps.userId,
        accessToken: createProps.accessToken,
        refreshToken: createProps.refreshToken,
        deviceId: null,
        deviceName: null,
        ip: createProps.ip,
        userAgent: createProps.userAgent,
        location: null,
        createdAt: new Date(),
        expiresAt: createProps.expiresAt,
        lastActivityAt: new Date(),
      }

      ;(prisma.session.create as jest.Mock).mockResolvedValue(mockPrismaSession)

      // Act
      const result = await repository.create(createProps)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.userId).toBe(createProps.userId)
      expect(result.value?.accessToken).toBe(createProps.accessToken)
      expect(prisma.session.create).toHaveBeenCalled()
    })
  })

  describe('updateLastActivity', () => {
    it('应该更新最后活动时间', async () => {
      // Arrange
      const sessionId = 'session_123'
      const now = new Date()

      const mockPrismaSession: PrismaSession = {
        id: sessionId,
        userId: 'user_123',
        accessToken: 'access_token_xxx',
        refreshToken: 'refresh_token_xxx',
        deviceId: null,
        deviceName: null,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        location: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivityAt: now,
      }

      ;(prisma.session.update as jest.Mock).mockResolvedValue(mockPrismaSession)

      // Act
      const result = await repository.updateLastActivity(sessionId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: expect.objectContaining({
          lastActivityAt: expect.any(Date),
        }),
      })
    })
  })

  describe('delete', () => {
    it('应该删除会话', async () => {
      // Arrange
      const sessionId = 'session_123'

      ;(prisma.session.delete as jest.Mock).mockResolvedValue({ id: sessionId })

      // Act
      const result = await repository.delete(sessionId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: sessionId },
      })
    })
  })

  describe('deleteByUserId', () => {
    it('应该删除用户的所有会话', async () => {
      // Arrange
      const userId = 'user_123'

      ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })

      // Act
      const result = await repository.deleteByUserId(userId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      })
    })
  })

  describe('deleteExpired', () => {
    it('应该删除所有过期会话', async () => {
      // Arrange
      ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 5 })

      // Act
      const result = await repository.deleteExpired()

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      })
    })
  })

  describe('数据映射', () => {
    it('应该正确映射 Prisma Session 到 Domain Session', async () => {
      // Arrange
      const mockPrismaSession: PrismaSession = {
        id: 'session_123',
        userId: 'user_123',
        accessToken: 'access_token_xxx',
        refreshToken: 'refresh_token_xxx',
        deviceId: 'device_123',
        deviceName: 'Chrome on MacOS',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        location: { city: 'Beijing', country: 'CN', timezone: 'Asia/Shanghai' },
        createdAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-01-02'),
        lastActivityAt: new Date('2024-01-01T12:00:00'),
      }

      ;(prisma.session.findUnique as jest.Mock).mockResolvedValue(
        mockPrismaSession
      )

      // Act
      const result = await repository.findById('session_123')

      // Assert
      expect(result.isSuccess).toBe(true)
      const session = result.value!
      expect(session.id).toBe(mockPrismaSession.id)
      expect(session.userId).toBe(mockPrismaSession.userId)
      expect(session.accessToken).toBe(mockPrismaSession.accessToken)
      expect(session.refreshToken).toBe(mockPrismaSession.refreshToken)
      expect(session.deviceId).toBe(mockPrismaSession.deviceId)
    })
  })
})
