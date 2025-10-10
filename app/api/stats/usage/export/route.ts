/**
 * P2.7 - CSV/JSON 导出功能实现
 *
 * 功能：
 * 1. 支持CSV和JSON两种格式
 * 2. 支持所有现有的筛选参数
 * 3. 包含完整的元数据
 * 4. 自动生成时间戳文件名
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { buildAdvancedFilters, type FilterParams } from '../filters'
import { convertToCSV, convertToJSON, generateFilename } from './formatters'

/**
 * GET /api/stats/usage/export
 *
 * 导出统计数据（CSV或JSON格式）
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户认证（支持Cookie和Header双重认证）
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    const userId = user.userId

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    // 3. 验证格式参数
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: '无效的导出格式，仅支持 csv 或 json' },
        { status: 400 }
      )
    }

    // 4. 构建筛选条件（复用现有的筛选逻辑）
    const filterParams: FilterParams = {
      name: searchParams.get('nameContains'),
      status: searchParams.get('status'),
      minTokens: searchParams.get('minTokens'),
      maxTokens: searchParams.get('maxTokens'),
      minRequests: searchParams.get('minRequests'),
      maxRequests: searchParams.get('maxRequests'),
      lastUsedAfter: searchParams.get('startDate'),
      lastUsedBefore: searchParams.get('endDate'),
    }

    const filterConditions = buildAdvancedFilters(filterParams)

    // 5. 查询数据
    const data = await prisma.apiKey.findMany({
      where: {
        userId,
        ...filterConditions,
      },
      select: {
        id: true,
        name: true,
        crsKey: true,
        status: true,
        totalTokens: true,
        totalCalls: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 6. 根据格式生成响应
    if (format === 'csv') {
      const csv = convertToCSV(data)
      const filename = generateFilename('csv')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } else {
      // JSON格式
      const json = convertToJSON(data, userId, filterParams)
      const filename = generateFilename('json')

      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }
  } catch (error) {
    console.error('导出统计数据失败:', error)

    return NextResponse.json(
      { error: '导出统计数据失败，请稍后重试' },
      { status: 500 }
    )
  }
}
