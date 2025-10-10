/**
 * CRS认证API验证脚本
 *
 * 验证范围：
 * - POST /web/auth/login
 * - GET /web/auth/user
 * - POST /web/auth/refresh
 * - POST /web/auth/logout
 */

const CRS_BASE_URL = 'https://claude.just-play.fun'
const ADMIN_USERNAME = 'cr_admin_4ce18cd2'
const ADMIN_PASSWORD = 'HCTBMoiK3PZD0eDC'

// 请求速率限制：每个请求之间等待500ms
const RATE_LIMIT_DELAY = 500

interface TestResult {
  endpoint: string
  method: string
  status: 'success' | 'failed' | 'error'
  statusCode?: number
  responseTime?: number
  data?: any
  error?: string
}

const results: TestResult[] = []

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testLogin(): Promise<string | null> {
  const startTime = Date.now()
  const endpoint = '/web/auth/login'

  try {
    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
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
      data: response.ok ? {
        success: data.success,
        hasToken: !!data.token,
        expiresIn: data.expiresIn,
        username: data.username,
      } : data,
    })

    if (response.ok && data.token) {
      console.log(`✅ POST ${endpoint} - ${response.status} (${responseTime}ms)`)
      return data.token
    } else {
      console.log(`❌ POST ${endpoint} - ${response.status} (${responseTime}ms)`)
      return null
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
    return null
  }
}

async function testGetUser(token: string): Promise<void> {
  const startTime = Date.now()
  const endpoint = '/web/auth/user'

  try {
    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    results.push({
      endpoint,
      method: 'GET',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      responseTime,
      data: response.ok ? {
        success: data.success,
        username: data.user?.username,
        loginTime: data.user?.loginTime,
        lastActivity: data.user?.lastActivity,
      } : data,
    })

    if (response.ok) {
      console.log(`✅ GET ${endpoint} - ${response.status} (${responseTime}ms)`)
    } else {
      console.log(`❌ GET ${endpoint} - ${response.status} (${responseTime}ms)`)
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.log(`❌ GET ${endpoint} - Error (${responseTime}ms)`)
    results.push({
      endpoint,
      method: 'GET',
      status: 'error',
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function testRefreshToken(token: string): Promise<void> {
  const startTime = Date.now()
  const endpoint = '/web/auth/refresh'

  try {
    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    results.push({
      endpoint,
      method: 'POST',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      responseTime,
      data: response.ok ? {
        success: data.success,
        hasToken: !!data.token,
        expiresIn: data.expiresIn,
      } : data,
    })

    if (response.ok) {
      console.log(`✅ POST ${endpoint} - ${response.status} (${responseTime}ms)`)
    } else {
      console.log(`❌ POST ${endpoint} - ${response.status} (${responseTime}ms)`)
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

async function testLogout(token: string): Promise<void> {
  const startTime = Date.now()
  const endpoint = '/web/auth/logout'

  try {
    const response = await fetch(`${CRS_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    results.push({
      endpoint,
      method: 'POST',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      responseTime,
      data: response.ok ? {
        success: data.success,
        message: data.message,
      } : data,
    })

    if (response.ok) {
      console.log(`✅ POST ${endpoint} - ${response.status} (${responseTime}ms)`)
    } else {
      console.log(`❌ POST ${endpoint} - ${response.status} (${responseTime}ms)`)
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
  console.log('🚀 开始验证CRS认证API...\n')
  console.log(`📍 CRS地址: ${CRS_BASE_URL}`)
  console.log(`⏱️  请求速率限制: ${RATE_LIMIT_DELAY}ms/请求\n`)
  console.log('=' .repeat(60))

  // 1. 登录
  console.log('\n1️⃣ 测试登录...')
  const token = await testLogin()

  if (!token) {
    console.error('\n❌ 登录失败，无法继续测试')
    printSummary()
    process.exit(1)
  }

  await delay(RATE_LIMIT_DELAY)

  // 2. 获取用户信息
  console.log('\n2️⃣ 测试获取用户信息...')
  await testGetUser(token)
  await delay(RATE_LIMIT_DELAY)

  // 3. 刷新Token
  console.log('\n3️⃣ 测试刷新Token...')
  await testRefreshToken(token)
  await delay(RATE_LIMIT_DELAY)

  // 4. 登出
  console.log('\n4️⃣ 测试登出...')
  await testLogout(token)

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

  // 打印详细结果
  console.log('详细结果:')
  console.log('─'.repeat(60))
  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⚠️'
    console.log(`${index + 1}. ${icon} ${result.method} ${result.endpoint}`)
    console.log(`   状态码: ${result.statusCode || 'N/A'}`)
    console.log(`   响应时间: ${result.responseTime}ms`)
    if (result.error) {
      console.log(`   错误: ${result.error}`)
    }
    console.log('')
  })

  // 保存结果到JSON
  const fs = require('fs')
  const path = require('path')
  const outputPath = path.join(process.cwd(), 'docs', 'CRS_AUTH_VERIFICATION.json')
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: CRS_BASE_URL,
    summary: {
      success: successCount,
      failed: failedCount,
      error: errorCount,
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
