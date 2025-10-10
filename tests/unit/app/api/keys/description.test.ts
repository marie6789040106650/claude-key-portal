/**
 * 密钥描述更新 API 测试
 * 路径: PUT /api/keys/[id]/description
 *
 * 🔴 RED Phase: 测试先行
 */

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/keys/[id]/description/route'
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

describe('PUT /api/keys/[id]/description', () => {
  const userId = 'user-123'
  const keyId = 'key-456'

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock key ownership verification
    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: keyId,
      userId,
      crsKeyId: 'crs-key-789',
      name: 'Test Key',
    })
  })

  it('should update key description successfully via CRS', async () => {
    // Arrange
    const newDescription = 'Updated description for production use'

    ;(crsClient.updateKey as jest.Mock).mockResolvedValue({
      id: 'crs-key-789',
      name: 'Test Key',
      description: newDescription,
      status: 'active',
    })

    const request = new NextRequest(
      `http://localhost:3000/api/keys/${keyId}/description`,
      {
        method: 'PUT',
        body: JSON.stringify({ description: newDescription }),
      }
    )

    // Act
    const response = await PUT(request, { params: { id: keyId } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toEqual({
      id: 'crs-key-789',
      name: 'Test Key',
      description: newDescription,
      status: 'active',
    })
    expect(crsClient.updateKey).toHaveBeenCalledWith('crs-key-789', {
      description: newDescription,
    })
  })

  it('should allow empty description', async () => {
    // Arrange
    const emptyDescription = ''

    ;(crsClient.updateKey as jest.Mock).mockResolvedValue({
      id: 'crs-key-789',
      name: 'Test Key',
      description: '',
      status: 'active',
    })

    const request = new NextRequest(
      `http://localhost:3000/api/keys/${keyId}/description`,
      {
        method: 'PUT',
        body: JSON.stringify({ description: emptyDescription }),
      }
    )

    // Act
    const response = await PUT(request, { params: { id: keyId } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.description).toBe('')
    expect(crsClient.updateKey).toHaveBeenCalledWith('crs-key-789', {
      description: '',
    })
  })

  it('should return 404 if key not found', async () => {
    // Arrange
    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest(
      'http://localhost:3000/api/keys/key-999/description',
      {
        method: 'PUT',
        body: JSON.stringify({ description: 'New Description' }),
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

  it('should return 400 if description field is missing', async () => {
    // Arrange
    const request = new NextRequest(
      `http://localhost:3000/api/keys/${keyId}/description`,
      {
        method: 'PUT',
        body: JSON.stringify({}), // Missing description
      }
    )

    // Act
    const response = await PUT(request, { params: { id: keyId } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Description field is required' })
    expect(crsClient.updateKey).not.toHaveBeenCalled()
  })

  it('should return 400 if description is not a string', async () => {
    // Arrange
    const request = new NextRequest(
      `http://localhost:3000/api/keys/${keyId}/description`,
      {
        method: 'PUT',
        body: JSON.stringify({ description: 123 }), // Invalid type
      }
    )

    // Act
    const response = await PUT(request, { params: { id: keyId } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Description must be a string' })
    expect(crsClient.updateKey).not.toHaveBeenCalled()
  })

  it('should handle CRS errors gracefully', async () => {
    // Arrange
    ;(crsClient.updateKey as jest.Mock).mockRejectedValue(
      new Error('CRS service unavailable')
    )

    const request = new NextRequest(
      `http://localhost:3000/api/keys/${keyId}/description`,
      {
        method: 'PUT',
        body: JSON.stringify({ description: 'New Description' }),
      }
    )

    // Act
    const response = await PUT(request, { params: { id: keyId } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to update description' })
  })
})
