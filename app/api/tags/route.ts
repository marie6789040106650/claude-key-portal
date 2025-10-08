/**
 * Tags List API 路由
 * P1 阶段 - 标签功能 🟢 GREEN
 *
 * GET /api/tags - 获取用户所有标签
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户登录
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 2. 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limitParam = searchParams.get('limit')
    const sortParam = searchParams.get('sort')

    // 验证 limit 参数
    let limit: number | undefined
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      if (isNaN(parsedLimit)) {
        return NextResponse.json(
          { error: 'limit 必须是数字' },
          { status: 400 }
        )
      }
      limit = parsedLimit
    }

    // 3. 查询用户所有密钥的标签
    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: { tags: true },
    })

    // 4. 收集所有标签并统计
    const tagCounts: Record<string, number> = {}

    keys.forEach((key) => {
      const tags = key.tags as string[]
      tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    // 5. 转换为数组
    let tags = Object.keys(tagCounts)

    // 6. 应用搜索过滤
    if (search) {
      const searchLower = search.toLowerCase()
      tags = tags.filter((tag) => tag.toLowerCase().includes(searchLower))
    }

    // 7. 排序
    if (sortParam === 'alphabetical') {
      tags.sort((a, b) => a.localeCompare(b))
    } else {
      // 默认按使用频率排序
      tags.sort((a, b) => tagCounts[b] - tagCounts[a])
    }

    // 8. 应用 limit
    if (limit) {
      tags = tags.slice(0, limit)
    }

    // 9. 构建统计信息
    const stats = {
      total: tags.length,
      ...Object.fromEntries(
        tags.map((tag) => [tag, tagCounts[tag]])
      ),
    }

    return NextResponse.json({
      tags,
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
