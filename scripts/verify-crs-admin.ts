/**
 * CRS Admin API验证脚本
 *
 * 验证范围：
 * - GET /admin/dashboard
 * - GET /admin/api-keys
 * - GET /admin/api-keys-usage-trend
 * - GET /admin/usage-stats
 * - GET /admin/model-stats
 * - GET /admin/claude-accounts
 * - GET /admin/users
 */

const CRS_BASE_URL = 'https://claude.just-play.fun'
const ADMIN_USERNAME = 'cr_admin_4ce18cd2'
const ADMIN_PASSWORD = 'HCTBMoiK3PZD0eDC'

// 请求速率限制：每个请求之间等待800ms（Admin API更谨慎）
const RATE_LIMIT_DELAY = 800

interface TestResult {
  endpoint: string
  method: string
  status: 'success' | 'failed' | 'error'
  statusCode?: number
  responseTime?: number
  dataSize?: number
  dataSummary?: any
  error?: string
}

const results: TestResult[] = []

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function login(): Promise<string | null> {
  try {
    const response = await fetch(`${CRS_BASE_URL}/web/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    })

    const data = await response.json()

    if (response.ok && data.token) {
      console.log('✅ 登录成功\n')
      return data.token
    } else {
      console.error('❌ 登录失败')
      return null
    }
  } catch (error) {
    console.error('❌ 登录错误:', error)
    return null
  }
}

async function testEndpoint(
  token: string,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<void> {
  const startTime = Date.now()

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, options)
    const responseTime = Date.now() - startTime

    let data
    let dataSize = 0
    let dataSummary: any = null

    try {
      const text = await response.text()
      dataSize = text.length
      data = JSON.parse(text)

      // 根据端点生成数据摘要
      if (endpoint === '/admin/dashboard' && data.success) {
        dataSummary = {
          hasOverview: !!data.overview,
          hasRecentActivity: !!data.recentActivity,
          hasSystemAverages: !!data.systemAverages,
          hasRealtimeMetrics: !!data.realtimeMetrics,
          hasSystemHealth: !!data.systemHealth,
          totalApiKeys: data.overview?.totalApiKeys,
          activeApiKeys: data.overview?.activeApiKeys,
        }
      } else if (endpoint === '/admin/api-keys' && data.success) {
        dataSummary = {
          totalKeys: Array.isArray(data.data) ? data.data.length : 0,
          sampleKey: data.data?.[0] ? {
            id: data.data[0].id,
            name: data.data[0].name,
            hasUsage: !!data.data[0].usage,
            hasLimits: !!data.data[0].tokenLimit,
          } : null,
        }
      } else if (endpoint === '/admin/api-keys-usage-trend' && data.success) {
        dataSummary = {
          granularity: data.granularity,
          totalApiKeys: data.totalApiKeys,
          topKeysCount: Array.isArray(data.topApiKeys) ? data.topApiKeys.length : 0,
          dataPointsCount: Array.isArray(data.data) ? data.data.length : 0,
        }
      } else if (data.success) {
        dataSummary = {
          hasData: !!data.data,
          dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
          dataLength: Array.isArray(data.data) ? data.data.length : undefined,
        }
      }
    } catch (e) {
      // 无法解析JSON
      dataSummary = { error: 'Failed to parse JSON' }
    }

    results.push({
      endpoint,
      method,
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      responseTime,
      dataSize,
      dataSummary,
    })

    const icon = response.ok ? '✅' : '❌'
    console.log(`${icon} ${method} ${endpoint} - ${response.status} (${responseTime}ms, ${dataSize} bytes)`)
    if (dataSummary && Object.keys(dataSummary).length > 0) {
      console.log(`   摘要: ${JSON.stringify(dataSummary)}`)
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.log(`❌ ${method} ${endpoint} - Error (${responseTime}ms)`)
    results.push({
      endpoint,
      method,
      status: 'error',
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function main() {
  console.log('🚀 开始验证CRS Admin API...\n')
  console.log(`📍 CRS地址: ${CRS_BASE_URL}`)
  console.log(`⏱️  请求速率限制: ${RATE_LIMIT_DELAY}ms/请求\n`)
  console.log('=' .repeat(60))

  // 登录
  console.log('🔐 登录中...')
  const token = await login()

  if (!token) {
    console.error('\n❌ 登录失败，无法继续测试')
    process.exit(1)
  }

  await delay(RATE_LIMIT_DELAY)

  // 核心统计端点
  const coreEndpoints = [
    { endpoint: '/admin/dashboard', name: '仪表板数据' },
    { endpoint: '/admin/api-keys', name: 'API Keys列表' },
    { endpoint: '/admin/api-keys-usage-trend', name: 'API Keys使用趋势' },
  ]

  console.log('\n📊 测试核心统计端点...\n')
  for (const { endpoint, name } of coreEndpoints) {
    console.log(`测试: ${name}`)
    await testEndpoint(token, endpoint)
    await delay(RATE_LIMIT_DELAY)
  }

  // 其他统计端点
  const statsEndpoints = [
    { endpoint: '/admin/usage-stats', name: '使用统计' },
    { endpoint: '/admin/model-stats', name: '模型统计' },
    { endpoint: '/admin/usage-trend', name: '使用趋势' },
  ]

  console.log('\n📈 测试其他统计端点...\n')
  for (const { endpoint, name } of statsEndpoints) {
    console.log(`测试: ${name}`)
    await testEndpoint(token, endpoint)
    await delay(RATE_LIMIT_DELAY)
  }

  // 账户管理端点
  const accountEndpoints = [
    { endpoint: '/admin/claude-accounts', name: 'Claude账户列表' },
    { endpoint: '/admin/gemini-accounts', name: 'Gemini账户列表' },
    { endpoint: '/admin/users', name: '用户列表' },
  ]

  console.log('\n👥 测试账户管理端点...\n')
  for (const { endpoint, name } of accountEndpoints) {
    console.log(`测试: ${name}`)
    await testEndpoint(token, endpoint)
    await delay(RATE_LIMIT_DELAY)
  }

  // 打印总结
  printSummary()
}

function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 验证结果总结\n')

  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length
  const errorCount = results.filter(r => r.status === 'error').length

  console.log(`✅ 成功: ${successCount}`)
  console.log(`❌ 失败: ${failedCount}`)
  console.log(`⚠️  错误: ${errorCount}`)
  console.log(`📈 总计: ${results.length}\n`)

  // 统计平均响应时间
  const avgResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length
  console.log(`⏱️  平均响应时间: ${avgResponseTime.toFixed(2)}ms\n`)

  // 打印失败和错误的端点
  const failed = results.filter(r => r.status !== 'success')
  if (failed.length > 0) {
    console.log('⚠️  失败/错误端点:')
    console.log('─'.repeat(60))
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.method} ${result.endpoint}`)
      console.log(`   状态: ${result.status}`)
      console.log(`   状态码: ${result.statusCode || 'N/A'}`)
      if (result.error) {
        console.log(`   错误: ${result.error}`)
      }
      console.log('')
    })
  }

  // 保存结果到JSON
  const fs = require('fs')
  const path = require('path')
  const outputPath = path.join(process.cwd(), 'docs', 'CRS_ADMIN_VERIFICATION.json')
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: CRS_BASE_URL,
    summary: {
      success: successCount,
      failed: failedCount,
      error: errorCount,
      total: results.length,
      avgResponseTime: Math.round(avgResponseTime),
    },
    results,
  }, null, 2))

  console.log(`📄 详细结果已保存到: ${outputPath}`)
}

main().catch(error => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})
