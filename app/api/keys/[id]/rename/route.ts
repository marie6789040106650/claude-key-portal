/**
 * 密钥重命名 API
 * PUT /api/keys/[id]/rename
 *
 * 🟢 GREEN Phase: 实现功能
 * - 调用 CRS Admin API 更新密钥名称
 * - 验证权限和输入
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
    const { name } = body

    // 3. 验证输入
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // 4. 查找密钥（获取crsKeyId）
    const key = await prisma.apiKey.findUnique({
      where: { id: context.params.id },
      select: {
        id: true,
        userId: true,
        crsKeyId: true,
        name: true,
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

    // 6. 调用 CRS API 更新密钥名称
    await crsClient.updateKey(key.crsKeyId, {
      name: name.trim(),
    })

    // 7. 更新本地数据库
    const updatedKey = await prisma.apiKey.update({
      where: { id: context.params.id },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
      },
    })

    // 8. 返回更新后的密钥信息
    return NextResponse.json(updatedKey)
  } catch (error) {
    console.error('Failed to rename key:', error)
    return NextResponse.json(
      { error: 'Failed to rename key' },
      { status: 500 }
    )
  }
}
