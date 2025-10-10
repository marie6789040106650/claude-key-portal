/**
 * Key Status API 路由测试
 * P3.2 阶段 - 密钥启用/禁用功能 🔴 RED
 *
 * 测试密钥状态切换 API:
 * - PATCH /api/keys/[id]/status
 * - 调用 CRS Admin API 更新状态
 * - 权限验证
 * - 错误处理
 * - CRS集成测试
 */

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/keys/[id]/status/route'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

// Mock CrsClient
jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: {
    updateKey: jest.fn(),
  },
}))

// Mock Prisma (for ownership verification)
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth'

describe('PATCH /api/keys/[id]/status', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  }

  const mockKey = {
    id: 'key-1',
    userId: 'user-1',
    crsKeyId: 'crs-key-123',
    name: 'Test Key',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
  })

  describe('成功场景', () => {
    it('应该能够启用密钥', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('密钥已启用')
    })

    it('应该能够禁用密钥', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('密钥已禁用')
    })

    it('应该调用 CrsClient.updateKey 并传递正确的参数', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      expect(crsClient.updateKey).toHaveBeenCalledWith('crs-key-123', {
        status: 'inactive',
      })
    })

    it('启用密钥时应该传递 status: "active"', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      expect(crsClient.updateKey).toHaveBeenCalledWith('crs-key-123', {
        status: 'active',
      })
    })
  })

  describe('权限验证', () => {
    it('未登录应该返回 401', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({
        error: '请先登录',
      })
    })

    it('访问他人密钥应该返回 403', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        ...mockKey,
        userId: 'other-user',
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        error: '无权操作此密钥',
      })
    })

    it('密钥不存在应该返回 404', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({
        error: '密钥不存在',
      })
    })
  })

  describe('输入验证', () => {
    it('缺少 isActive 字段应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: '缺少必填字段: isActive',
      })
    })

    it('isActive 不是布尔值应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: 'true' }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: 'isActive 必须是布尔值',
      })
    })

    it('无效的 JSON 应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: 'invalid json',
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: '无效的请求数据',
      })
    })
  })

  describe('CRS错误处理', () => {
    it('CRS不可用应该返回 503', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.updateKey as jest.Mock).mockRejectedValue(
        new Error('CRS服务暂时不可用')
      )

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.error).toContain('CRS服务')
    })

    it('CRS返回错误应该返回 502', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.updateKey as jest.Mock).mockRejectedValue({
        statusCode: 500,
        message: 'Internal server error',
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(502)
      expect(await response.json()).toEqual({
        error: 'CRS服务异常，请稍后重试',
      })
    })

    it('应该记录CRS错误日志', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.updateKey as jest.Mock).mockRejectedValue(
        new Error('CRS error')
      )

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update key status:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('边界条件', () => {
    it('重复设置相同状态应该成功', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(200)
      expect(crsClient.updateKey).toHaveBeenCalled()
    })

    it('应该正确处理并发状态切换请求', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      const requests = [
        new NextRequest('http://localhost/api/keys/key-1/status', {
          method: 'PATCH',
          body: JSON.stringify({ isActive: true }),
        }),
        new NextRequest('http://localhost/api/keys/key-1/status', {
          method: 'PATCH',
          body: JSON.stringify({ isActive: false }),
        }),
      ]

      const responses = await Promise.all(
        requests.map((req) => PATCH(req, { params: { id: 'key-1' } }))
      )

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })

      expect(crsClient.updateKey).toHaveBeenCalledTimes(2)
    })
  })
})
