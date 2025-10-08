/**
 * CRS公开统计API验证脚本
 *
 * 验证范围：
 * - POST /api/get-key-id
 * - POST /api/user-stats
 * - POST /api/user-model-stats
 *
 * 注意：这些API需要有效的API Key进行测试
 */

const CRS_BASE_URL = 'https://claude.just-play.fun'

// 请求速率限制
const RATE_LIMIT_DELAY = 500

interface TestResult {
  endpoint: string
  method: string
  status: 'success' | 'failed' | 'error' | 'skipped'
  statusCode?: number
  responseTime?: number
  dataSum mary?: any
  error?: string
  note?: string
}

const results: TestResult[] = []

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testGetKeyId(): Promise<void> {
  const startTime = Date.now()
  const endpoint = '/api/get-key-id'

  // 由于没有真实的API Key，这个测试会失败（预期行为）
  results.push({
    endpoint,
    method: 'POST',
    status: 'skipped',
    note: '需要真实API Key，跳过测试',
  })

  console.log(`⏭️ POST ${endpoint} - 跳过（需要真实API Key）`)
}

async function testUserStats(): Promise<void> {
  const startTime = Date.now()
  const endpoint = '/api/user-stats'

  results.push({
    endpoint,
    method: 'POST',
    status: 'skipped',
    note: '需要真实API Key或API ID，跳过测试',
  })

  console.log(`⏭️ POST ${endpoint} - 跳过（需要真实API Key）`)
}

async function testUserModelStats(): Promise<void> {
  const startTime = Date.now()
  const endpoint = '/api/user-model-stats'

  results.push({
    endpoint,
    method: 'POST',
    status: 'skipped',
    note: '需要真实API Key或API ID，跳过测试',
  })

  console.log(`⏭️ POST ${endpoint} - 跳过（需要真实API Key）`)
}

// 测试端点是否存在（使用无效数据）
async function testEndpointExists(endpoint: string, method: string = 'POST'): Promise<void> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify({ test: 'invalid' }) : undefined,
    })

    const responseTime = Date.now() - startTime
    let data

    try {
      data = await response.json()
    } catch (e) {
      data = null
    }

    // 400/401/403 表示端点存在但请求无效
    // 404 表示端点不存在
    const exists = response.status !== 404

    results.push({
      endpoint,
      method,
      status: exists ? 'success' : 'failed',
      statusCode: response.status,
      responseTime,
      dataSummary: {
        endpointExists: exists,
        requiresAuth: response.status === 401,
        requiresValidData: response.status === 400,
        error: data?.error || data?.message,
      },
    })

    const icon = exists ? '✅' : '❌'
    const statusMsg = exists ? '端点存在' : '端点不存在'
    console.log(`${icon} ${method} ${endpoint} - ${response.status} (${statusMsg}, ${responseTime}ms)`)
    if (data?.error) {
      console.log(`   错误信息: ${data.error}`)
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
  console.log('🚀 开始验证CRS公开统计API...\n')
  console.log(`📍 CRS地址: ${CRS_BASE_URL}`)
  console.log(`⏱️  请求速率限制: ${RATE_LIMIT_DELAY}ms/请求`)
  console.log(`ℹ️  注意: 由于没有真实API Key，将测试端点是否存在\n`)
  console.log('=' .repeat(60))

  // 测试端点存在性
  // 注意：这些端点在 app.js 中被挂载到 /apiStats，而不是 /api
  const endpoints = [
    '/apiStats/get-key-id',
    '/apiStats/user-stats',
    '/apiStats/user-model-stats',
    '/apiStats/batch-stats',
    '/apiStats/batch-model-stats',
  ]

  console.log('\n📊 测试端点存在性...\n')
  for (const endpoint of endpoints) {
    await testEndpointExists(endpoint, 'POST')
    await delay(RATE_LIMIT_DELAY)
  }

  // 打印总结
  printSummary()
}

function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 验证结果总结\n')

  const existCount = results.filter(r => r.status === 'success').length
  const notFoundCount = results.filter(r => r.status === 'failed').length
  const errorCount = results.filter(r => r.status === 'error').length
  const skippedCount = results.filter(r => r.status === 'skipped').length

  console.log(`✅ 端点存在: ${existCount}`)
  console.log(`❌ 端点不存在: ${notFoundCount}`)
  console.log(`⚠️  错误: ${errorCount}`)
  console.log(`⏭️  跳过: ${skippedCount}`)
  console.log(`📈 总计: ${results.length}\n`)

  // 打印详细结果
  console.log('详细结果:')
  console.log('─'.repeat(60))
  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' :
                 result.status === 'failed' ? '❌' :
                 result.status === 'skipped' ? '⏭️' : '⚠️'
    console.log(`${index + 1}. ${icon} ${result.method} ${result.endpoint}`)
    console.log(`   状态: ${result.status}`)
    if (result.statusCode) {
      console.log(`   状态码: ${result.statusCode}`)
    }
    if (result.responseTime) {
      console.log(`   响应时间: ${result.responseTime}ms`)
    }
    if (result.dataSummary) {
      console.log(`   摘要: ${JSON.stringify(result.dataSummary)}`)
    }
    if (result.note) {
      console.log(`   备注: ${result.note}`)
    }
    if (result.error) {
      console.log(`   错误: ${result.error}`)
    }
    console.log('')
  })

  // 保存结果到JSON
  const fs = require('fs')
  const path = require('path')
  const outputPath = path.join(process.cwd(), 'docs', 'CRS_PUBLIC_STATS_VERIFICATION.json')
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: CRS_BASE_URL,
    note: '由于没有真实API Key，只测试端点存在性',
    summary: {
      endpointExists: existCount,
      endpointNotFound: notFoundCount,
      error: errorCount,
      skipped: skippedCount,
      total: results.length,
    },
    results,
  }, null, 2))

  console.log(`📄 详细结果已保存到: ${outputPath}`)
}

main().catch(error => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})
