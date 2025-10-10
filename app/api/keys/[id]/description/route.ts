/**
 * 密钥描述更新 API
 * PUT /api/keys/[id]/description
 *
 * 🟢 GREEN Phase: 实现功能
 * - 调用 CRS Admin API 更新密钥描述
 * - 允许空描述（清除描述）
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // 1. 解析请求体
    const body = await request.json()

    // 2. 验证输入
    if (!('description' in body)) {
      return NextResponse.json(
        { error: 'Description field is required' },
        { status: 400 }
      )
    }

    const { description } = body

    if (typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      )
    }

    // 3. 查找密钥（获取crsKeyId）
    const key = await prisma.apiKey.findUnique({
      where: { id: context.params.id },
      select: {
        id: true,
        userId: true,
        crsKeyId: true,
      },
    })

    if (!key) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    // 4. 调用 CRS API 更新密钥描述
    const updatedKey = await crsClient.updateKey(key.crsKeyId, {
      description: description,
    })

    // 5. 返回更新后的密钥信息
    return NextResponse.json(updatedKey)
  } catch (error) {
    console.error('Failed to update description:', error)
    return NextResponse.json(
      { error: 'Failed to update description' },
      { status: 500 }
    )
  }
}
