/**
 * 快速验证CRS统计API - 专注于P2最需要的端点
 *
 * 请求间隔: 2秒（避免影响CRS服务）
 */

const CRS_BASE_URL = 'https://claude.just-play.fun'
const ADMIN_USERNAME = 'cr_admin_4ce18cd2'
const ADMIN_PASSWORD = 'HCTBMoiK3PZD0eDC'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function authenticate(): Promise<string | null> {
  console.log('🔐 认证中...')
  try {
    const response = await fetch(`${CRS_BASE_URL}/web/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    })

    const data = await response.json()
    if (data.success && data.token) {
      console.log('✅ 认证成功\n')
      return data.token
    }
    return null
  } catch (error) {
    console.log('❌ 认证失败:', error)
    return null
  }
}

async function quickTest(token: string, path: string, desc: string) {
  console.log(`🔍 ${desc}`)
  console.log(`   GET ${path}`)

  try {
    const response = await fetch(`${CRS_BASE_URL}${path}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ 成功 (${response.status})`)

      // 显示数据结构
      if (data.data) {
        if (Array.isArray(data.data)) {
          console.log(`   📊 返回数组: ${data.data.length} 项`)
          if (data.data.length > 0) {
            const keys = Object.keys(data.data[0]).slice(0, 5)
            console.log(`   🔑 字段: ${keys.join(', ')}...`)
          }
        } else {
          const keys = Object.keys(data.data).slice(0, 5)
          console.log(`   🔑 字段: ${keys.join(', ')}...`)
        }
      } else {
        const keys = Object.keys(data).slice(0, 5)
        console.log(`   🔑 字段: ${keys.join(', ')}...`)
      }

      return { success: true, path, data }
    } else if (response.status === 404) {
      console.log(`   ⚠️  未找到 (404)`)
      return { success: false, path, status: 404 }
    } else {
      console.log(`   ❌ 失败 (${response.status})`)
      return { success: false, path, status: response.status }
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error}`)
    return { success: false, path, error: String(error) }
  }
}

async function main() {
  console.log('=' .repeat(70))
  console.log('🚀 CRS 核心统计API快速验证')
  console.log('   请求间隔: 2秒（避免影响CRS服务）')
  console.log('=' .repeat(70))
  console.log()

  const token = await authenticate()
  if (!token) {
    console.log('❌ 认证失败，退出\n')
    process.exit(1)
  }

  const results: any[] = []

  // 优先级最高的统计端点
  const endpoints = [
    { path: '/admin/dashboard', desc: '仪表板数据（已验证）' },
    { path: '/admin/usage-stats', desc: '使用统计⭐' },
    { path: '/admin/model-stats', desc: '模型统计⭐' },
    { path: '/admin/usage-costs', desc: '费用统计⭐' },
    { path: '/admin/usage-trend', desc: '使用趋势⭐' },
    { path: '/admin/account-usage-trend', desc: '账户趋势⭐' },
    { path: '/admin/api-keys', desc: '密钥列表（已验证）' },
    { path: '/admin/api-keys-usage-trend', desc: '密钥趋势（已验证）' },
  ]

  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i]
    const result = await quickTest(token, ep.path, ep.desc)
    results.push(result)
    console.log()

    // 请求间隔2秒
    if (i < endpoints.length - 1) {
      console.log('   ⏳ 等待2秒...\n')
      await sleep(2000)
    }
  }

  // 生成简报
  console.log('=' .repeat(70))
  console.log('📊 验证结果汇总')
  console.log('=' .repeat(70))

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success && r.status !== 404)
  const notFound = results.filter(r => r.status === 404)

  console.log(`\n✅ 成功: ${successful.length}/${results.length}`)
  successful.forEach(r => console.log(`   - ${r.path}`))

  if (notFound.length > 0) {
    console.log(`\n⚠️  未找到 (404): ${notFound.length}`)
    notFound.forEach(r => console.log(`   - ${r.path}`))
  }

  if (failed.length > 0) {
    console.log(`\n❌ 失败: ${failed.length}`)
    failed.forEach(r => console.log(`   - ${r.path} (${r.status || 'error'})`))
  }

  // 保存详细结果
  const fs = require('fs')
  const path = require('path')

  const summary = {
    timestamp: new Date().toISOString(),
    total: results.length,
    successful: successful.length,
    notFound: notFound.length,
    failed: failed.length,
    results: results.map(r => ({
      path: r.path,
      success: r.success,
      status: r.status,
      dataPreview: r.data ? {
        hasData: !!r.data.data,
        isArray: Array.isArray(r.data.data),
        count: Array.isArray(r.data.data) ? r.data.data.length : undefined,
        keys: r.data.data ? Object.keys(r.data.data).slice(0, 10) : Object.keys(r.data).slice(0, 10)
      } : null
    }))
  }

  const summaryPath = path.join(__dirname, '../docs/CRS_STATS_API_SUMMARY.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8')

  console.log(`\n✅ 详细结果已保存: ${summaryPath}`)
  console.log('=' .repeat(70))
}

main().catch(console.error)
