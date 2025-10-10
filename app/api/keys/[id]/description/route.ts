/**
 * 密钥描述更新 API
 * PUT /api/keys/[id]/description
 *
 * 🟢 GREEN Phase: 实现功能
 * - 调用 CRS Admin API 更新密钥描述
 * - 允许空描述（清除描述）
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // 1. 验证认证
    const authHeader = request.headers.get('Authorization')
    let userId: string

    try {
      const tokenData = verifyToken(authHeader)
      userId = tokenData.userId
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 2. 解析请求体
    const body = await request.json()

    // 3. 验证输入
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

    // 4. 查找密钥（获取crsKeyId）
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

    // 5. 验证权限
    if (key.userId !== userId) {
      return NextResponse.json(
        { error: '无权操作此密钥' },
        { status: 403 }
      )
    }

    // 6. 调用 CRS API 更新密钥描述
    await crsClient.updateKey(key.crsKeyId, {
      description: description,
    })

    // 7. 返回成功响应
    return NextResponse.json({
      success: true,
      description: description,
    })
  } catch (error) {
    console.error('Failed to update description:', error)
    return NextResponse.json(
      { error: 'Failed to update description' },
      { status: 500 }
    )
  }
}
