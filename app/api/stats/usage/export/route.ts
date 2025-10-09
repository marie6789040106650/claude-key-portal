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
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { buildAdvancedFilters, type FilterParams } from '../filters'

/**
 * CSV格式化工具
 */
function escapeCSVField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) {
    return ''
  }

  const str = String(field)

  // 如果包含逗号、引号或换行符，需要用引号包裹并转义内部引号
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function formatDateForCSV(date: Date | null | undefined): string {
  if (!date) return ''
  return date.toISOString().split('T')[0] // 只保留日期部分
}

function convertToCSV(data: any[]): string {
  // CSV表头
  const headers = [
    '密钥名称',
    '状态',
    '总Token数',
    '总请求数',
    '创建时间',
    '最后使用时间',
  ]

  // 构建CSV内容
  const rows = data.map((item) =>
    [
      escapeCSVField(item.name),
      escapeCSVField(item.status),
      escapeCSVField(Number(item.totalTokens)),
      escapeCSVField(Number(item.totalCalls)),
      formatDateForCSV(item.createdAt),
      formatDateForCSV(item.lastUsedAt),
    ].join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

/**
 * JSON格式化工具
 */
function convertToJSON(
  data: any[],
  userId: string,
  filters: Record<string, any>
): string {
  // 只包含非null的筛选条件
  const activeFilters = Object.entries(filters).reduce(
    (acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, any>
  )

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId,
    filters: activeFilters,
    totalCount: data.length,
    data: data.map((item) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      totalTokens: Number(item.totalTokens),
      totalRequests: Number(item.totalCalls),
      createdAt: item.createdAt.toISOString(),
      lastUsedAt: item.lastUsedAt?.toISOString() || null,
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * 生成带时间戳的文件名
 */
function generateFilename(format: string): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  return `usage-stats-${timestamp}.${format}`
}

/**
 * GET /api/stats/usage/export
 *
 * 导出统计数据（CSV或JSON格式）
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证认证
    const { userId } = await verifyAuth()

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

    if (error instanceof Error && error.message === '未认证') {
      throw error
    }

    return NextResponse.json(
      { error: '导出统计数据失败，请稍后重试' },
      { status: 500 }
    )
  }
}
