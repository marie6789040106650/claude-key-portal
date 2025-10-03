/**
 * 用户注册功能测试
 * Sprint 1 - 🔴 RED Phase
 */

import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('✅ 成功场景', () => {
    it('应该成功注册使用邮箱的新用户', async () => {
      // Arrange
      const mockEmail = 'test@example.com'
      const mockPassword = 'Test@123456'
      const mockHashedPassword = 'hashed_password'
      const mockUserId = 'user_123'

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword)
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: mockEmail,
        nickname: null,
        createdAt: new Date(),
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: mockEmail,
          password: mockPassword,
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data).toHaveProperty('user')
      expect(data.user).toHaveProperty('id', mockUserId)
      expect(data.user).toHaveProperty('email', mockEmail)
      expect(data.user).not.toHaveProperty('passwordHash')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      })
      expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, 10)
      expect(prisma.user.create).toHaveBeenCalled()
    })

    it('应该成功注册使用手机号的新用户', async () => {
      // Arrange
      const mockPhone = '13800138000'
      const mockPassword = 'Test@123456'

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user_456',
        phone: mockPhone,
        email: null,
        nickname: null,
        createdAt: new Date(),
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          phone: mockPhone,
          password: mockPassword,
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.user).toHaveProperty('phone', mockPhone)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { phone: mockPhone },
      })
    })

    it('应该成功注册带昵称的用户', async () => {
      // Arrange
      const mockNickname = 'TestUser'

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user_789',
        email: 'test@example.com',
        nickname: mockNickname,
        createdAt: new Date(),
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
          nickname: mockNickname,
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.user).toHaveProperty('nickname', mockNickname)
    })
  })

  describe('❌ 失败场景 - 输入验证', () => {
    it('应该拒绝缺少邮箱和手机号的请求', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('邮箱或手机号')
    })

    it('应该拒绝无效的邮箱格式', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('邮箱格式')
    })

    it('应该拒绝无效的手机号格式', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          phone: '123', // 太短
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('手机号')
    })

    it('应该拒绝弱密码 - 长度不足', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'weak', // 太短
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('密码')
      expect(data.error).toContain('8')
    })

    it('应该拒绝弱密码 - 缺少大写字母', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'test@123456', // 缺少大写
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('大写')
    })

    it('应该拒绝弱密码 - 缺少小写字母', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TEST@123456', // 缺少小写
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('小写')
    })

    it('应该拒绝弱密码 - 缺少数字', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@Password', // 缺少数字
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('数字')
    })

    it('应该拒绝弱密码 - 缺少特殊字符', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test12345678', // 缺少特殊字符
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('特殊字符')
    })
  })

  describe('❌ 失败场景 - 业务逻辑', () => {
    it('应该拒绝已存在的邮箱', async () => {
      // Arrange
      const existingEmail = 'existing@example.com'

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing_user',
        email: existingEmail,
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: existingEmail,
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(409)
      expect(data.error).toContain('已被注册')
      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('应该拒绝已存在的手机号', async () => {
      // Arrange
      const existingPhone = '13800138000'

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing_user',
        phone: existingPhone,
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          phone: existingPhone,
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(409)
      expect(data.error).toContain('已被注册')
    })
  })

  describe('❌ 失败场景 - 系统错误', () => {
    it('应该处理数据库错误', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('系统错误')
    })

    it('应该处理密码加密错误', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockRejectedValue(
        new Error('Encryption failed')
      )

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('系统错误')
    })
  })

  describe('🔒 安全性检查', () => {
    it('响应中不应该包含密码哈希', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(data.user).not.toHaveProperty('passwordHash')
      expect(data.user).not.toHaveProperty('password')
    })

    it('应该使用 bcrypt 加密密码', async () => {
      // Arrange
      const mockPassword = 'Test@123456'

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: mockPassword,
        }),
      })

      // Act
      await POST(request)

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, 10)
    })
  })
})
