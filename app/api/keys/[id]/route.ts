/**
 * API密钥单个操作API
 * PATCH /api/keys/[id] - 更新密钥
 * DELETE /api/keys/[id] - 删除密钥
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { crsClient } from '@/lib/crs-client'
import { verifyToken } from '@/lib/auth'
import { handleCrsError } from '@/lib/errors'
import { z } from 'zod'

/**
 * 密钥更新验证Schema
 */
const updateKeySchema = z.object({
  name: z.string().max(100, '密钥名称不能超过100个字符').optional(),
  description: z.string().optional(),
  monthlyLimit: z.number().int().positive('月限额必须为正数').optional(),
  status: z.enum(['ACTIVE', 'PAUSED'], {
    errorMap: () => ({ message: '状态值必须是ACTIVE或PAUSED' }),
  }).optional(),
  tags: z.array(z.string(), { invalid_type_error: '标签必须是数组' }).optional(),
  expiresAt: z
    .string()
    .datetime({ message: '无效的日期格式' })
    .nullable()
    .optional()
    .refine(
      (value) => {
        if (!value) return true // null 或 undefined 允许
        const date = new Date(value)
        return !isNaN(date.getTime()) // 验证日期有效性
      },
      { message: '无效的日期格式' }
    )
    .refine(
      (value) => {
        if (!value) return true // null 或 undefined 允许
        const date = new Date(value)
        return date > new Date() // 不能是过去的日期
      },
      { message: '到期时间不能设置为过去' }
    ),
})

/**
 * PATCH /api/keys/[id] - 更新API密钥
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证JWT Token
    const authHeader = request.headers.get('Authorization')
    let userId: string

    try {
      const tokenData = verifyToken(authHeader)
      userId = tokenData.userId
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 2. 解析请求体
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'JSON格式不正确' },
        { status: 400 }
      )
    }

    // 3. 验证输入
    let validatedData: z.infer<typeof updateKeySchema>
    try {
      validatedData = updateKeySchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    // 4. 检查是否有更新内容
    if (Object.keys(validatedData).length === 0) {
      // 空更新，返回原密钥
      const existingKey = await prisma.apiKey.findUnique({
        where: { id: params.id },
      })

      if (!existingKey) {
        return NextResponse.json(
          { error: '密钥不存在' },
          { status: 404 }
        )
      }

      if (existingKey.userId !== userId) {
        return NextResponse.json(
          { error: '无权限操作此密钥' },
          { status: 403 }
        )
      }

      return NextResponse.json({ key: existingKey })
    }

    // 5. 查找密钥并验证权限
    const existingKey = await prisma.apiKey.findUnique({
      where: { id: params.id },
    })

    if (!existingKey) {
      return NextResponse.json({ error: '密钥不存在' }, { status: 404 })
    }

    if (existingKey.userId !== userId) {
      return NextResponse.json(
        { error: '无权限操作此密钥' },
        { status: 403 }
      )
    }

    if (existingKey.status === 'DELETED') {
      return NextResponse.json(
        { error: '密钥已删除，无法更新' },
        { status: 400 }
      )
    }

    // 6. 检查名称是否重复
    if (validatedData.name && validatedData.name !== existingKey.name) {
      const duplicateKey = await prisma.apiKey.findFirst({
        where: {
          userId,
          name: validatedData.name,
          id: { not: params.id },
        },
      })

      if (duplicateKey) {
        return NextResponse.json(
          { error: '该密钥名称已存在' },
          { status: 409 }
        )
      }
    }

    // 7. 分离CRS字段和本地字段
    const { tags, expiresAt, ...crsFields } = validatedData
    const hasCrsUpdate = Object.keys(crsFields).length > 0
    const hasLocalUpdate = tags !== undefined || expiresAt !== undefined

    // 8. 更新CRS（如果有CRS字段更新）
    if (hasCrsUpdate) {
      try {
        await crsClient.updateKey(existingKey.crsKeyId, crsFields)
      } catch (error: any) {
        return handleCrsError(error)
      }
    }

    // 9. 更新本地数据
    const updateData: any = {}

    if (hasCrsUpdate) {
      Object.assign(updateData, crsFields)
    }

    if (hasLocalUpdate) {
      if (tags !== undefined) {
        updateData.tags = tags
      }
      if (expiresAt !== undefined) {
        updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
      }
    }

    try {
      const updatedKey = await prisma.apiKey.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          userId: true,
          crsKeyId: true,
          name: true,
          keyPrefix: true,
          keyMasked: true,
          keyValue: false, // 不返回完整密钥
          description: true,
          status: true,
          tags: true,
          monthlyLimit: true,
          monthlyUsage: true,
          totalTokens: true,
          totalRequests: true,
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true,
        },
      })

      return NextResponse.json({ key: updatedKey })
    } catch (error) {
      console.error('Local key update failed:', error)
      return NextResponse.json(
        {
          error: '本地更新失败',
          crsUpdated: hasCrsUpdate,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Update key error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/keys/[id] - 删除API密钥
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证JWT Token
    const authHeader = request.headers.get('Authorization')
    let userId: string

    try {
      const tokenData = verifyToken(authHeader)
      userId = tokenData.userId
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'
    const force = searchParams.get('force') === 'true'

    // 3. 查找密钥并验证权限
    const existingKey = await prisma.apiKey.findUnique({
      where: { id: params.id },
    })

    if (!existingKey) {
      return NextResponse.json({ error: '密钥不存在' }, { status: 404 })
    }

    if (existingKey.userId !== userId) {
      return NextResponse.json(
        { error: '无权限操作此密钥' },
        { status: 403 }
      )
    }

    // 4. 如果已删除，直接返回成功（幂等性）
    if (existingKey.status === 'DELETED') {
      return NextResponse.json({
        success: true,
        message: '密钥已删除',
        alreadyDeleted: true,
      })
    }

    // 5. 删除CRS密钥
    let crsDeleteSuccess = false
    try {
      await crsClient.deleteKey(existingKey.crsKeyId)
      crsDeleteSuccess = true
    } catch (error: any) {
      // CRS密钥不存在（404），可以继续删除本地
      if (error.statusCode === 404 && force) {
        crsDeleteSuccess = true
      } else if (error.name === 'CrsUnavailableError' || error.message?.includes('CRS service')) {
        return NextResponse.json(
          { error: 'CRS服务暂时不可用，请稍后重试' },
          { status: 503 }
        )
      } else if (error.statusCode) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        )
      } else {
        throw error
      }
    }

    // 6. 删除本地记录
    try {
      let deletedKey: any

      if (permanent) {
        // 永久删除
        deletedKey = await prisma.apiKey.delete({
          where: { id: params.id },
        })
      } else {
        // 软删除
        deletedKey = await prisma.apiKey.update({
          where: { id: params.id },
          data: {
            status: 'DELETED',
            deletedAt: new Date(),
          },
        })
      }

      const response: any = {
        success: true,
        message: permanent ? '密钥已永久删除' : '密钥已删除',
        deletedKey: {
          id: deletedKey.id,
          name: deletedKey.name,
        },
      }

      // 如果是force模式且CRS密钥不存在，添加警告
      if (force && crsDeleteSuccess) {
        response.warning = 'CRS密钥不存在，已删除本地记录'
      }

      return NextResponse.json(response)
    } catch (error) {
      console.error('Local key deletion failed:', error)
      return NextResponse.json(
        {
          error: '本地删除失败',
          crsDeleted: crsDeleteSuccess,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Delete key error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
