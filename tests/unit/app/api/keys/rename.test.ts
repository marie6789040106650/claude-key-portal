/**
 * 密钥重命名 API 测试
 * 路径: PUT /api/keys/[id]/rename
 *
 * 🔴 RED Phase: 测试先行
 */

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/keys/[id]/rename/route'
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

describe('PUT /api/keys/[id]/rename', () => {
  const userId = 'user-123'
  const keyId = 'key-456'

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock key ownership verification
    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: keyId,
      userId,
      crsKeyId: 'crs-key-789',
      name: 'Old Name',
    })
  })

  it('should rename key successfully via CRS', async () => {
    // Arrange
    const newName = 'Production API Key'

    ;(crsClient.updateKey as jest.Mock).mockResolvedValue({
      id: 'crs-key-789',
      name: newName,
      description: 'Existing description',
      status: 'active',
    })

    const request = new NextRequest(
      `http://localhost:3000/api/keys/${keyId}/rename`,
      {
        method: 'PUT',
        body: JSON.stringify({ name: newName }),
      }
    )

    // Act
    const response = await PUT(request, { params: { id: keyId } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toEqual({
      id: 'crs-key-789',
      name: newName,
      description: 'Existing description',
      status: 'active',
    })
    expect(crsClient.updateKey).toHaveBeenCalledWith('crs-key-789', {
      name: newName,
    })
  })

  it('should return 404 if key not found', async () => {
    // Arrange
    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest(
      'http://localhost:3000/api/keys/key-999/rename',
      {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      }
    )

    // Act
    const response = await PUT(request, { params: { id: 'key-999' } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'Key not found' })
    expect(crsClient.updateKey).not.toHaveBeenCalled()
  })

  it('should return 400 if name is missing', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/keys/key-456/rename',
      {
        method: 'PUT',
        body: JSON.stringify({}), // Missing name
      }
    )

    // Act
    const response = await PUT(request, { params: { id: 'key-456' } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Name is required' })
    expect(crsClient.updateKey).not.toHaveBeenCalled()
  })

  it('should return 400 if name is empty', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/keys/key-456/rename',
      {
        method: 'PUT',
        body: JSON.stringify({ name: '   ' }), // Empty/whitespace name
      }
    )

    // Act
    const response = await PUT(request, { params: { id: 'key-456' } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Name is required' })
    expect(crsClient.updateKey).not.toHaveBeenCalled()
  })

  it('should handle CRS errors gracefully', async () => {
    // Arrange
    ;(crsClient.updateKey as jest.Mock).mockRejectedValue(
      new Error('CRS service unavailable')
    )

    const request = new NextRequest(
      'http://localhost:3000/api/keys/key-456/rename',
      {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      }
    )

    // Act
    const response = await PUT(request, { params: { id: 'key-456' } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to rename key' })
  })
})
