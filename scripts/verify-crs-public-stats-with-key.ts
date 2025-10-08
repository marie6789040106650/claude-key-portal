/**
 * CRS公开统计API验证脚本（使用真实API Key）
 *
 * 验证范围：
 * - POST /apiStats/api/get-key-id
 * - POST /apiStats/api/user-stats
 * - POST /apiStats/api/user-model-stats
 * - POST /apiStats/api/batch-stats
 * - POST /apiStats/api/batch-model-stats
 */

const CRS_BASE_URL = 'https://claude.just-play.fun'
const TEST_API_KEY = 'cr_6a0956348e1890144656b50b9284671517040ff89f7e240819ed1c85abdae943'

// 请求速率限制
const RATE_LIMIT_DELAY = 800

interface TestResult {
  endpoint: string
  method: string
  status: 'success' | 'failed' | 'error'
  statusCode?: number
  responseTime?: number
  dataSummary?: any
  error?: string
}

const results: TestResult[] = []

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testGetKeyId(): Promise<string | null> {
  const startTime = Date.now()
  const endpoint = '/apiStats/api/get-key-id'

  try {
    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: TEST_API_KEY,
      }),
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    results.push({
      endpoint,
      method: 'POST',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      responseTime,
      dataSummary: response.ok ? {
        success: data.success,
        hasId: !!data.data?.id,
        id: data.data?.id,
      } : { error: data.error, message: data.message },
    })

    const icon = response.ok ? '✅' : '❌'
    console.log(`${icon} POST ${endpoint} - ${response.status} (${responseTime}ms)`)
    if (data.data?.id) {
      console.log(`   API Key ID: ${data.data.id}`)
    }
    if (data.error) {
      console.log(`   错误: ${data.error} - ${data.message}`)
    }

    return response.ok && data.data?.id ? data.data.id : null
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.log(`❌ POST ${endpoint} - Error (${responseTime}ms)`)
    results.push({
      endpoint,
      method: 'POST',
      status: 'error',
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

async function testUserStats(useApiKey: boolean, apiId?: string): Promise<void> {
  const startTime = Date.now()
  const endpoint = '/apiStats/api/user-stats'

  try {
    const body: any = useApiKey ? { apiKey: TEST_API_KEY } : { apiId }

    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    let dataSummary: any = null
    if (response.ok && data.success) {
      dataSummary = {
        hasData: !!data.data,
        keyId: data.data?.id,
        keyName: data.data?.name,
        hasUsage: !!data.data?.usage,
        hasLimits: !!data.data?.limits,
        totalRequests: data.data?.usage?.total?.requests,
        totalTokens: data.data?.usage?.total?.tokens || data.data?.usage?.total?.allTokens,
        totalCost: data.data?.usage?.total?.formattedCost,
      }
    } else {
      dataSummary = { error: data.error, message: data.message }
    }

    results.push({
      endpoint,
      method: 'POST',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      responseTime,
      dataSummary,
    })

    const icon = response.ok ? '✅' : '❌'
    const paramType = useApiKey ? 'apiKey' : 'apiId'
    console.log(`${icon} POST ${endpoint} (${paramType}) - ${response.status} (${responseTime}ms)`)
    if (dataSummary.keyName) {
      console.log(`   密钥名称: ${dataSummary.keyName}`)
      console.log(`   总请求数: ${dataSummary.totalRequests || 0}`)
      console.log(`   总Token数: ${dataSummary.totalTokens || 0}`)
      console.log(`   总费用: ${dataSummary.totalCost || '$0.000000'}`)
    }
    if (data.error) {
      console.log(`   错误: ${data.error} - ${data.message}`)
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.log(`❌ POST ${endpoint} - Error (${responseTime}ms)`)
    results.push({
      endpoint,
      method: 'POST',
      status: 'error',
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function testUserModelStats(apiId: string, period: 'daily' | 'monthly'): Promise<void> {
  const startTime = Date.now()
  const endpoint = '/apiStats/api/user-model-stats'

  try {
    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiId,
        period,
      }),
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    let dataSummary: any = null
    if (response.ok && data.success) {
      dataSummary = {
        period: data.period,
        modelCount: Array.isArray(data.data) ? data.data.length : 0,
        models: Array.isArray(data.data) ? data.data.map((m: any) => ({
          model: m.model,
          requests: m.requests,
          allTokens: m.allTokens,
          cost: m.formatted?.total,
        })) : [],
      }
    } else {
      dataSummary = { error: data.error, message: data.message }
    }

    results.push({
      endpoint,
      method: 'POST',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      responseTime,
      dataSummary,
    })

    const icon = response.ok ? '✅' : '❌'
    console.log(`${icon} POST ${endpoint} (period=${period}) - ${response.status} (${responseTime}ms)`)
    if (dataSummary.models && dataSummary.models.length > 0) {
      console.log(`   模型数量: ${dataSummary.modelCount}`)
      dataSummary.models.forEach((m: any) => {
        console.log(`     - ${m.model}: ${m.requests} 请求, ${m.allTokens} tokens, ${m.cost}`)
      })
    }
    if (data.error) {
      console.log(`   错误: ${data.error} - ${data.message}`)
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.log(`❌ POST ${endpoint} - Error (${responseTime}ms)`)
    results.push({
      endpoint,
      method: 'POST',
      status: 'error',
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function testBatchStats(apiIds: string[]): Promise<void> {
  const startTime = Date.now()
  const endpoint = '/apiStats/api/batch-stats'

  try {
    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiIds,
      }),
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    let dataSummary: any = null
    if (response.ok && data.success) {
      dataSummary = {
        totalKeys: data.data?.aggregated?.totalKeys,
        activeKeys: data.data?.aggregated?.activeKeys,
        totalRequests: data.data?.aggregated?.usage?.requests,
        totalTokens: data.data?.aggregated?.usage?.allTokens,
        totalCost: data.data?.aggregated?.usage?.formattedCost,
        individualCount: Array.isArray(data.data?.individual) ? data.data.individual.length : 0,
      }
    } else {
      dataSummary = { error: data.error, message: data.message }
    }

    results.push({
      endpoint,
      method: 'POST',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      responseTime,
      dataSummary,
    })

    const icon = response.ok ? '✅' : '❌'
    console.log(`${icon} POST ${endpoint} - ${response.status} (${responseTime}ms)`)
    if (dataSummary.totalKeys) {
      console.log(`   总密钥数: ${dataSummary.totalKeys}`)
      console.log(`   活跃密钥数: ${dataSummary.activeKeys}`)
      console.log(`   总请求数: ${dataSummary.totalRequests}`)
      console.log(`   总Token数: ${dataSummary.totalTokens}`)
      console.log(`   总费用: ${dataSummary.totalCost}`)
    }
    if (data.error) {
      console.log(`   错误: ${data.error} - ${data.message}`)
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.log(`❌ POST ${endpoint} - Error (${responseTime}ms)`)
    results.push({
      endpoint,
      method: 'POST',
      status: 'error',
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function main() {
  console.log('🚀 开始验证CRS公开统计API（使用真实API Key）...\n')
  console.log(`📍 CRS地址: ${CRS_BASE_URL}`)
  console.log(`🔑 测试密钥: ${TEST_API_KEY.substring(0, 20)}...`)
  console.log(`⏱️  请求速率限制: ${RATE_LIMIT_DELAY}ms/请求\n`)
  console.log('=' .repeat(60))

  // 1. 获取Key ID
  console.log('\n1️⃣ 测试获取Key ID...')
  const keyId = await testGetKeyId()

  if (!keyId) {
    console.error('\n❌ 无法获取Key ID，可能密钥无效或已禁用')
    printSummary()
    process.exit(1)
  }

  await delay(RATE_LIMIT_DELAY)

  // 2. 测试用户统计（使用apiKey）
  console.log('\n2️⃣ 测试用户统计（使用apiKey参数）...')
  await testUserStats(true)
  await delay(RATE_LIMIT_DELAY)

  // 3. 测试用户统计（使用apiId）
  console.log('\n3️⃣ 测试用户统计（使用apiId参数）...')
  await testUserStats(false, keyId)
  await delay(RATE_LIMIT_DELAY)

  // 4. 测试用户模型统计（每日）
  console.log('\n4️⃣ 测试用户模型统计（每日）...')
  await testUserModelStats(keyId, 'daily')
  await delay(RATE_LIMIT_DELAY)

  // 5. 测试用户模型统计（每月）
  console.log('\n5️⃣ 测试用户模型统计（每月）...')
  await testUserModelStats(keyId, 'monthly')
  await delay(RATE_LIMIT_DELAY)

  // 6. 测试批量统计
  console.log('\n6️⃣ 测试批量统计...')
  await testBatchStats([keyId])

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
      if (result.dataSummary?.error) {
        console.log(`   错误: ${result.dataSummary.error}`)
        console.log(`   消息: ${result.dataSummary.message}`)
      }
      if (result.error) {
        console.log(`   异常: ${result.error}`)
      }
      console.log('')
    })
  }

  // 保存结果到JSON
  const fs = require('fs')
  const path = require('path')
  const outputPath = path.join(process.cwd(), 'docs', 'CRS_PUBLIC_STATS_WITH_KEY_VERIFICATION.json')
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: CRS_BASE_URL,
    testApiKey: TEST_API_KEY.substring(0, 20) + '...',
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
