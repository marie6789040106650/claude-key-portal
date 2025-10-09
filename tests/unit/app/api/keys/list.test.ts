/**
 * GET /api/keys API Tests - CRS Integration
 * 测试密钥列表API集成CRS getApiKeys功能
 *
 * TDD Phase: 🔴 RED
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/keys/route'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

jest.mock('@/lib/infrastructure/persistence/repositories', () => ({
  keyRepository: {
    findByUserId: jest.fn(),
    countByUserId: jest.fn(),
  },
}))

jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: {
    getApiKeys: jest.fn(),
  },
}))

import { verifyToken } from '@/lib/auth'
import { keyRepository } from '@/lib/infrastructure/persistence/repositories'
import { crsClient } from '@/lib/infrastructure/external/crs-client'

describe('GET /api/keys - CRS Integration', () => {
  const mockUserId = 'user-123'
  const mockToken = 'Bearer valid-token'

  // Mock本地密钥数据
  const mockLocalKeys = [
    {
      id: 'key-1',
      crsKeyId: 'crs-key-1',
      userId: mockUserId,
      name: 'Test Key 1',
      status: 'active',
      isFavorite: true,
      notes: 'Local note',
      tags: ['tag1'],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    {
      id: 'key-2',
      crsKeyId: 'crs-key-2',
      userId: mockUserId,
      name: 'Test Key 2',
      status: 'active',
      isFavorite: false,
      notes: null,
      tags: [],
      createdAt: new Date('2025-01-02'),
      updatedAt: new Date('2025-01-02'),
    },
  ]

  // Mock CRS API Keys数据
  const mockCrsKeys = [
    {
      id: 'crs-key-1',
      apiKey: 'cr_xxx_1',
      name: 'Test Key 1',
      permissions: ['chat', 'search'],
      monthlyLimit: 1000000,
      currentUsage: 50000,
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'crs-key-2',
      apiKey: 'cr_xxx_2',
      name: 'Test Key 2',
      permissions: ['chat'],
      monthlyLimit: 500000,
      currentUsage: 100000,
      status: 'inactive',
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 'crs-key-3',
      apiKey: 'cr_xxx_3',
      name: 'Test Key 3',
      permissions: ['chat'],
      monthlyLimit: 200000,
      currentUsage: 0,
      status: 'active',
      createdAt: '2025-01-03T00:00:00Z',
      updatedAt: '2025-01-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock auth
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: mockUserId })

    // Mock repository
    ;(keyRepository.findByUserId as jest.Mock).mockResolvedValue({
      isSuccess: true,
      value: mockLocalKeys,
    })
    ;(keyRepository.countByUserId as jest.Mock).mockResolvedValue({
      isSuccess: true,
      value: mockLocalKeys.length,
    })

    // Mock CRS client
    ;(crsClient.getApiKeys as jest.Mock).mockResolvedValue(mockCrsKeys)
  })

  describe('CRS集成测试', () => {
    it('应该调用crsClient.getApiKeys()获取CRS密钥数据', async () => {
      const request = new Request('http://localhost:3000/api/keys?sync=true', {
        method: 'GET',
        headers: { Authorization: mockToken },
      })

      await GET(request)

      expect(crsClient.getApiKeys).toHaveBeenCalledTimes(1)
    })

    it('应该合并本地Portal数据和CRS密钥数据', async () => {
      const request = new Request('http://localhost:3000/api/keys?sync=true', {
        method: 'GET',
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.keys).toBeDefined()
      expect(data.keys.length).toBeGreaterThan(0)

      // 验证第一个密钥包含Portal和CRS数据
      const firstKey = data.keys[0]
      expect(firstKey.id).toBe('key-1') // Portal ID
      expect(firstKey.crsKeyId).toBe('crs-key-1') // CRS ID
      expect(firstKey.isFavorite).toBe(true) // Portal数据
      expect(firstKey.monthlyLimit).toBe(1000000) // CRS数据
      expect(firstKey.currentUsage).toBe(50000) // CRS数据
    })

    it('应该检测并报告本地和CRS的状态不一致', async () => {
      const request = new Request('http://localhost:3000/api/keys?sync=true', {
        method: 'GET',
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.syncIssues).toBeDefined()
      expect(data.syncIssues.length).toBeGreaterThan(0)

      // 验证检测到key-2的状态不一致
      const issue = data.syncIssues.find((i: any) => i.keyId === 'key-2')
      expect(issue).toBeDefined()
      expect(issue.issue).toBe('status_mismatch')
      expect(issue.local).toBe('active')
      expect(issue.crs).toBe('inactive')
    })

    it('应该在CRS有新密钥时添加到返回列表', async () => {
      const request = new Request('http://localhost:3000/api/keys?sync=true', {
        method: 'GET',
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // CRS有3个密钥，本地只有2个
      // 合并后应该有3个密钥（CRS的key-3也应该出现）
      expect(data.keys.length).toBe(3)

      const crsOnlyKey = data.keys.find((k: any) => k.crsKeyId === 'crs-key-3')
      expect(crsOnlyKey).toBeDefined()
      expect(crsOnlyKey.name).toBe('Test Key 3')
    })
  })

  describe('错误降级处理', () => {
    it('当CRS不可用时应该返回本地数据并显示警告', async () => {
      // Mock CRS错误
      ;(crsClient.getApiKeys as jest.Mock).mockRejectedValue(
        new Error('CRS service unavailable')
      )

      const request = new Request('http://localhost:3000/api/keys?sync=true', {
        method: 'GET',
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.keys).toEqual(mockLocalKeys)
      expect(data.syncWarning).toBe('CRS同步失败，显示本地数据')
    })

    it('当sync=false时不应该调用CRS API', async () => {
      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(crsClient.getApiKeys).not.toHaveBeenCalled()
      expect(data.keys).toEqual(mockLocalKeys)
    })
  })

  describe('数据格式转换', () => {
    it('应该正确转换CRS密钥字段到Portal格式', async () => {
      const request = new Request('http://localhost:3000/api/keys?sync=true', {
        method: 'GET',
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      const key = data.keys[0]

      // 验证字段映射正确
      expect(key.crsKeyId).toBe('crs-key-1')
      expect(key.apiKey).toBe('cr_xxx_1')
      expect(key.monthlyLimit).toBe(1000000)
      expect(key.currentUsage).toBe(50000)
      expect(key.permissions).toEqual(['chat', 'search'])
    })

    it('应该保留Portal本地扩展字段', async () => {
      const request = new Request('http://localhost:3000/api/keys?sync=true', {
        method: 'GET',
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      const key = data.keys[0]

      // Portal扩展字段
      expect(key.isFavorite).toBe(true)
      expect(key.notes).toBe('Local note')
      expect(key.tags).toEqual(['tag1'])
    })
  })

  describe('分页和查询参数', () => {
    it('应该正确处理分页参数', async () => {
      const request = new Request('http://localhost:3000/api/keys?page=1&limit=10&sync=true', {
        method: 'GET',
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
      expect(data.totalPages).toBeDefined()
    })
  })
})
