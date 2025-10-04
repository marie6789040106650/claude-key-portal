/**
 * API密钥管理API
 * GET /api/keys - 列出密钥
 * POST /api/keys - 创建密钥
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { crsClient } from '@/lib/crs-client'
import { verifyToken } from '@/lib/auth'
import { handleCrsError } from '@/lib/errors'
import { z } from 'zod'

/**
 * GET /api/keys - 列出API密钥
 */
export async function GET(request: Request) {
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const tag = searchParams.get('tag')
    const sync = searchParams.get('sync') === 'true'

    // 3. 验证分页参数
    if (page < 1) {
      return NextResponse.json(
        { error: '分页参数不正确：page必须大于0' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: '分页参数不正确：limit必须在1-100之间' },
        { status: 400 }
      )
    }

    // 4. 验证状态参数
    const validStatuses = ['ACTIVE', 'INACTIVE', 'DELETED', 'EXPIRED', 'RATE_LIMITED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '状态参数不正确' },
        { status: 400 }
      )
    }

    // 5. 构建查询条件
    const where: any = {
      userId,
    }

    if (status) {
      where.status = status
    }

    if (tag) {
      where.tags = { has: tag }
    }

    // 6. 查询数据库
    const [keys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where,
        select: {
          id: true,
          userId: true,
          crsKeyId: true,
          crsKey: true, // 完整密钥值
          name: true,
          description: true,
          status: true,
          tags: true,
          totalTokens: true,
          totalCalls: true, // 替代 totalRequests
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.apiKey.count({ where }),
    ])

    // 7. 转换数据并计算掩码
    const keysWithMask = keys.map(key => {
      const keyMasked = generateKeyMask(key.crsKey)
      const keyPrefix = key.crsKey.match(/^(sk-[a-z]+-)/i)?.[1] || 'sk-'

      return {
        id: key.id,
        userId: key.userId,
        crsKeyId: key.crsKeyId,
        name: key.name,
        keyPrefix,
        keyMasked,
        description: key.description,
        status: key.status,
        tags: key.tags,
        totalTokens: Number(key.totalTokens), // BigInt -> Number
        totalRequests: Number(key.totalCalls), // 映射字段名
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
      }
    })

    // 8. 构建响应
    const response: any = {
      keys: keysWithMask,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }

    // 9. CRS同步（可选）
    if (sync) {
      try {
        const crsKeys = await crsClient.listKeys(userId)
        response.syncedAt = new Date().toISOString()

        // 检查数据一致性
        const syncIssues: any[] = []
        for (const localKey of keysWithMask) {
          const crsKey = crsKeys.find(
            (k: any) => k.id === localKey.crsKeyId
          )
          if (crsKey && crsKey.status !== localKey.status) {
            syncIssues.push({
              keyId: localKey.id,
              issue: 'status_mismatch',
              local: localKey.status,
              crs: crsKey.status,
            })
          }
        }

        if (syncIssues.length > 0) {
          response.syncIssues = syncIssues
        }
      } catch (error) {
        // CRS同步失败不影响返回本地数据
        response.syncWarning = 'CRS同步失败，显示本地数据'
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('List keys error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * 密钥创建验证Schema
 */
const createKeySchema = z.object({
  name: z
    .string({ required_error: '密钥名称不能为空' })
    .min(1, '密钥名称不能为空')
    .max(100, '密钥名称不能超过100个字符'),
  description: z.string().optional(),
  tags: z.array(z.string(), { invalid_type_error: '标签必须是数组' }).optional(),
})

/**
 * 生成密钥掩码
 */
function generateKeyMask(keyValue: string): string {
  if (keyValue.length < 8) {
    return keyValue
  }

  // 提取前缀（如 sk-ant-）
  const prefixMatch = keyValue.match(/^(sk-[a-z]+-)/i)
  const prefix = prefixMatch ? prefixMatch[1] : ''

  // 显示后4位
  const suffix = keyValue.slice(-4)

  return `${prefix}***${suffix}`
}

/**
 * POST /api/keys - 创建API密钥
 */
export async function POST(request: Request) {
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
    let validatedData: z.infer<typeof createKeySchema>
    try {
      validatedData = createKeySchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    // 4. 检查名称是否重复
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        userId,
        name: validatedData.name,
      },
    })

    if (existingKey) {
      return NextResponse.json(
        { error: '该密钥名称已存在' },
        { status: 409 }
      )
    }

    // 5. 调用CRS创建密钥
    let crsKey: any
    try {
      crsKey = await crsClient.createKey({
        name: validatedData.name,
        description: validatedData.description,
      })
    } catch (error: any) {
      return handleCrsError(error)
    }

    // 6. 创建本地映射
    try {
      const localKey = await prisma.apiKey.create({
        data: {
          userId,
          crsKeyId: crsKey.id,
          crsKey: crsKey.key, // 存储完整密钥
          name: validatedData.name,
          description: validatedData.description,
          status: crsKey.status || 'ACTIVE',
          tags: validatedData.tags || [],
          totalTokens: 0,
          totalCalls: 0,
        },
        select: {
          id: true,
          userId: true,
          crsKeyId: true,
          crsKey: true, // 创建时返回完整密钥
          name: true,
          description: true,
          status: true,
          tags: true,
          totalTokens: true,
          totalCalls: true,
          createdAt: true,
        },
      })

      // 计算掩码用于响应
      const keyMasked = generateKeyMask(localKey.crsKey)
      const keyPrefix = localKey.crsKey.match(/^(sk-[a-z]+-)/i)?.[1] || 'sk-'

      return NextResponse.json(
        {
          key: {
            ...localKey,
            keyPrefix,
            keyMasked,
            keyValue: localKey.crsKey, // 创建时返回完整密钥
            totalTokens: Number(localKey.totalTokens),
            totalRequests: Number(localKey.totalCalls),
          },
          warning:
            '请妥善保管密钥，此密钥只会显示一次！',
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Local key creation failed:', error)
      return NextResponse.json(
        {
          error: '本地保存失败，但CRS密钥已创建',
          crsKeyId: crsKey.id,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Create key error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
