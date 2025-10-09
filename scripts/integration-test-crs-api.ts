/**
 * CRS API完整集成测试
 *
 * 测试流程：
 * 1. Admin认证 (POST /web/auth/login)
 * 2. 创建API Key (POST /admin/api-keys)
 * 3. 获取Key ID (POST /apiStats/api/get-key-id)
 * 4. 查询用户统计 (POST /apiStats/api/user-stats)
 * 5. 查询模型统计 (POST /apiStats/api/user-model-stats)
 * 6. 清理测试数据 (DELETE /admin/api-keys/:id)
 *
 * 目标：验证Portal与CRS的API对接，记录所有请求/响应格式
 */

const CRS_BASE_URL = 'https://claude.just-play.fun'
const ADMIN_USERNAME = 'cr_admin_4ce18cd2'
const ADMIN_PASSWORD = 'HCTBMoiK3PZD0eDC'

interface RequestLog {
  step: string
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  response?: {
    status: number
    headers: Record<string, string>
    body: any
  }
  responseTime: number
  success: boolean
  error?: string
}

const requestLogs: RequestLog[] = []

/**
 * 延迟函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 记录请求和响应
 */
function logRequest(
  step: string,
  method: string,
  url: string,
  headers: Record<string, string>,
  body: any,
  startTime: number,
  response?: Response,
  responseBody?: any,
  error?: string
): void {
  const log: RequestLog = {
    step,
    method,
    url,
    headers,
    body,
    responseTime: Date.now() - startTime,
    success: !!response?.ok,
    error,
  }

  if (response) {
    log.response = {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
    }
  }

  requestLogs.push(log)
}

/**
 * Step 1: Admin认证
 */
async function authenticate(): Promise<string | null> {
  console.log('\n📍 Step 1: Admin认证')
  console.log('=' + '='.repeat(69))

  const startTime = Date.now()
  const url = `${CRS_BASE_URL}/web/auth/login`
  const body = {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    const responseTime = Date.now() - startTime

    logRequest('1. Admin认证', 'POST', url, { 'Content-Type': 'application/json' }, body, startTime, response, data)

    if (data.success && data.token) {
      console.log(`✅ 认证成功 (${responseTime}ms)`)
      console.log(`   Token: ${data.token.substring(0, 30)}...`)
      console.log(`   过期时间: ${data.expiresIn}ms`)
      return data.token
    }

    console.log(`❌ 认证失败 (${responseTime}ms)`)
    console.log(`   错误: ${data.error || data.message}`)
    return null
  } catch (error) {
    logRequest('1. Admin认证', 'POST', url, { 'Content-Type': 'application/json' }, body, startTime, undefined, undefined, String(error))
    console.log(`❌ 请求异常: ${error}`)
    return null
  }
}

/**
 * Step 2: 创建测试API Key
 */
async function createApiKey(token: string): Promise<{ id: string; key: string } | null> {
  console.log('\n📍 Step 2: 创建测试API Key')
  console.log('=' + '='.repeat(69))

  const startTime = Date.now()
  const url = `${CRS_BASE_URL}/admin/api-keys`
  const body = {
    name: `Portal-Integration-Test-${Date.now()}`,
    description: 'Portal API集成测试用密钥（自动创建，测试完成后自动删除）',
    tokenLimit: null, // 无限制
    expiresAt: null, // 永不过期
    permissions: ['claude'], // 只需要Claude权限
    tags: ['portal-test', 'auto-cleanup'],
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()
    const responseTime = Date.now() - startTime

    logRequest('2. 创建API Key', 'POST', url, headers, body, startTime, response, data)

    if (data.success && data.data) {
      console.log(`✅ 创建成功 (${responseTime}ms)`)
      console.log(`   Key ID: ${data.data.id}`)
      console.log(`   Key: ${data.data.apiKey}`)
      console.log(`   Name: ${data.data.name}`)
      console.log(`   Created: ${data.data.createdAt}`)
      return {
        id: data.data.id,
        key: data.data.apiKey,
      }
    }

    console.log(`❌ 创建失败 (${responseTime}ms)`)
    console.log(`   错误: ${data.error || data.message}`)
    return null
  } catch (error) {
    logRequest('2. 创建API Key', 'POST', url, headers, body, startTime, undefined, undefined, String(error))
    console.log(`❌ 请求异常: ${error}`)
    return null
  }
}

/**
 * Step 3: 获取Key ID (使用API Key)
 */
async function getKeyId(apiKey: string): Promise<string | null> {
  console.log('\n📍 Step 3: 获取Key ID')
  console.log('=' + '='.repeat(69))

  const startTime = Date.now()
  const url = `${CRS_BASE_URL}/apiStats/api/get-key-id`
  const body = { apiKey }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    const responseTime = Date.now() - startTime

    logRequest('3. 获取Key ID', 'POST', url, { 'Content-Type': 'application/json' }, { apiKey: apiKey.substring(0, 20) + '...' }, startTime, response, data)

    if (data.success && data.data?.id) {
      console.log(`✅ 获取成功 (${responseTime}ms)`)
      console.log(`   Key ID: ${data.data.id}`)
      return data.data.id
    }

    console.log(`❌ 获取失败 (${responseTime}ms)`)
    console.log(`   错误: ${data.error || data.message}`)
    return null
  } catch (error) {
    logRequest('3. 获取Key ID', 'POST', url, { 'Content-Type': 'application/json' }, { apiKey: apiKey.substring(0, 20) + '...' }, startTime, undefined, undefined, String(error))
    console.log(`❌ 请求异常: ${error}`)
    return null
  }
}

/**
 * Step 4: 查询用户统计
 */
async function getUserStats(apiId: string): Promise<boolean> {
  console.log('\n📍 Step 4: 查询用户统计')
  console.log('=' + '='.repeat(69))

  const startTime = Date.now()
  const url = `${CRS_BASE_URL}/apiStats/api/user-stats`
  const body = { apiId }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    const responseTime = Date.now() - startTime

    logRequest('4. 查询用户统计', 'POST', url, { 'Content-Type': 'application/json' }, body, startTime, response, data)

    if (data.success && data.data) {
      console.log(`✅ 查询成功 (${responseTime}ms)`)
      console.log(`   Key Name: ${data.data.name}`)
      console.log(`   Total Requests: ${data.data.usage?.total?.requests || 0}`)
      console.log(`   Total Tokens: ${data.data.usage?.total?.tokens || data.data.usage?.total?.allTokens || 0}`)
      console.log(`   Total Cost: ${data.data.usage?.total?.formattedCost || '$0.000000'}`)
      console.log(`   Has Usage Data: ${!!data.data.usage}`)
      console.log(`   Has Limits: ${!!data.data.limits}`)
      return true
    }

    console.log(`❌ 查询失败 (${responseTime}ms)`)
    console.log(`   错误: ${data.error || data.message}`)
    return false
  } catch (error) {
    logRequest('4. 查询用户统计', 'POST', url, { 'Content-Type': 'application/json' }, body, startTime, undefined, undefined, String(error))
    console.log(`❌ 请求异常: ${error}`)
    return false
  }
}

/**
 * Step 5: 查询模型统计（每日）
 */
async function getModelStats(apiId: string): Promise<boolean> {
  console.log('\n📍 Step 5: 查询模型统计（每日）')
  console.log('=' + '='.repeat(69))

  const startTime = Date.now()
  const url = `${CRS_BASE_URL}/apiStats/api/user-model-stats`
  const body = { apiId, period: 'daily' }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    const responseTime = Date.now() - startTime

    logRequest('5. 查询模型统计', 'POST', url, { 'Content-Type': 'application/json' }, body, startTime, response, data)

    if (data.success && data.data) {
      console.log(`✅ 查询成功 (${responseTime}ms)`)
      console.log(`   Period: ${data.period}`)
      console.log(`   Model Count: ${Array.isArray(data.data) ? data.data.length : 0}`)

      if (Array.isArray(data.data) && data.data.length > 0) {
        console.log(`   Models:`)
        data.data.forEach((m: any) => {
          console.log(`     - ${m.model}: ${m.requests} requests, ${m.allTokens} tokens`)
        })
      } else {
        console.log(`   ℹ️  暂无模型使用数据（新创建的key）`)
      }
      return true
    }

    console.log(`❌ 查询失败 (${responseTime}ms)`)
    console.log(`   错误: ${data.error || data.message}`)
    return false
  } catch (error) {
    logRequest('5. 查询模型统计', 'POST', url, { 'Content-Type': 'application/json' }, body, startTime, undefined, undefined, String(error))
    console.log(`❌ 请求异常: ${error}`)
    return false
  }
}

/**
 * Step 6: 删除测试API Key (清理)
 */
async function deleteApiKey(token: string, keyId: string): Promise<boolean> {
  console.log('\n📍 Step 6: 删除测试API Key（清理）')
  console.log('=' + '='.repeat(69))

  const startTime = Date.now()
  const url = `${CRS_BASE_URL}/admin/api-keys/${keyId}`
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    })

    const data = await response.json()
    const responseTime = Date.now() - startTime

    logRequest('6. 删除API Key', 'DELETE', url, headers, undefined, startTime, response, data)

    if (data.success) {
      console.log(`✅ 删除成功 (${responseTime}ms)`)
      console.log(`   测试数据已清理`)
      return true
    }

    console.log(`⚠️  删除失败 (${responseTime}ms)`)
    console.log(`   错误: ${data.error || data.message}`)
    console.log(`   请手动删除: Key ID = ${keyId}`)
    return false
  } catch (error) {
    logRequest('6. 删除API Key', 'DELETE', url, headers, undefined, startTime, undefined, undefined, String(error))
    console.log(`❌ 请求异常: ${error}`)
    console.log(`   请手动删除: Key ID = ${keyId}`)
    return false
  }
}

/**
 * 生成测试报告
 */
function generateReport() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 集成测试报告')
  console.log('='.repeat(70))

  const successCount = requestLogs.filter((log) => log.success).length
  const failCount = requestLogs.filter((log) => !log.success).length
  const avgResponseTime = requestLogs.reduce((sum, log) => sum + log.responseTime, 0) / requestLogs.length

  console.log(`\n✅ 成功: ${successCount}/${requestLogs.length}`)
  console.log(`❌ 失败: ${failCount}/${requestLogs.length}`)
  console.log(`⏱️  平均响应时间: ${avgResponseTime.toFixed(0)}ms\n`)

  // 显示每个步骤的结果
  requestLogs.forEach((log, index) => {
    const icon = log.success ? '✅' : '❌'
    console.log(`${icon} ${log.step} - ${log.responseTime}ms`)
  })

  // 保存详细日志
  const fs = require('fs')
  const path = require('path')

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: CRS_BASE_URL,
    summary: {
      total: requestLogs.length,
      success: successCount,
      failed: failCount,
      avgResponseTime: Math.round(avgResponseTime),
    },
    steps: requestLogs.map((log) => ({
      step: log.step,
      method: log.method,
      url: log.url,
      requestHeaders: log.headers,
      requestBody: log.body,
      responseStatus: log.response?.status,
      responseHeaders: log.response?.headers,
      responseBody: log.response?.body,
      responseTime: log.responseTime,
      success: log.success,
      error: log.error,
    })),
  }

  const reportPath = path.join(process.cwd(), 'docs', 'CRS_INTEGRATION_TEST_REPORT.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log(`\n📄 详细报告已保存: ${reportPath}`)
}

/**
 * 主函数
 */
async function main() {
  console.log('=' + '='.repeat(69))
  console.log('🚀 CRS API 完整集成测试')
  console.log('=' + '='.repeat(69))
  console.log(`\n📍 CRS地址: ${CRS_BASE_URL}`)
  console.log(`👤 管理员: ${ADMIN_USERNAME}`)
  console.log(`\n测试流程: 认证 → 创建Key → 获取ID → 查询统计 → 清理数据\n`)

  let token: string | null = null
  let keyData: { id: string; key: string } | null = null
  let keyId: string | null = null

  try {
    // Step 1: 认证
    token = await authenticate()
    if (!token) {
      console.log('\n❌ 认证失败，测试终止')
      return
    }

    await sleep(1000)

    // Step 2: 创建API Key
    keyData = await createApiKey(token)
    if (!keyData) {
      console.log('\n❌ 创建API Key失败，测试终止')
      return
    }

    await sleep(1000)

    // Step 3: 获取Key ID
    keyId = await getKeyId(keyData.key)
    if (!keyId) {
      console.log('\n⚠️  获取Key ID失败，但继续测试（使用原始ID）')
      keyId = keyData.id
    }

    await sleep(1000)

    // Step 4: 查询用户统计
    await getUserStats(keyId)

    await sleep(1000)

    // Step 5: 查询模型统计
    await getModelStats(keyId)

    await sleep(1000)

    // Step 6: 清理测试数据
    if (token && keyData) {
      await deleteApiKey(token, keyData.id)
    }
  } catch (error) {
    console.error('\n❌ 测试过程中发生异常:', error)
  } finally {
    // 确保清理测试数据
    if (token && keyData && !requestLogs.find((log) => log.step === '6. 删除API Key' && log.success)) {
      console.log('\n⚠️  尝试清理测试数据...')
      await deleteApiKey(token, keyData.id)
    }

    // 生成测试报告
    generateReport()
  }
}

main().catch(console.error)
