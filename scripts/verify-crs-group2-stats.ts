/**
 * CRS API 验证脚本 - 第二批：核心统计
 *
 * 验证内容:
 * - /admin/usage-stats - 使用统计
 * - /admin/model-stats - 模型统计
 * - /admin/usage-costs - 费用统计
 * - /admin/usage-trend - 总体趋势
 */

const CRS_BASE_URL = 'https://claude.just-play.fun'
const ADMIN_USERNAME = 'cr_admin_4ce18cd2'
const ADMIN_PASSWORD = 'HCTBMoiK3PZD0eDC'

interface TestResult {
  endpoint: string
  method: string
  status: 'success' | 'error' | 'not_found'
  statusCode?: number
  data?: any
  error?: string
  timing?: number
}

const results: TestResult[] = []

async function authenticate(): Promise<string | null> {
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
      console.log('✅ 认证成功')
      return data.token
    }
    return null
  } catch (error) {
    console.log('❌ 认证失败:', error)
    return null
  }
}

async function testEndpoint(
  token: string,
  path: string,
  method: string,
  description: string
) {
  console.log(`\n🔍 ${description}`)
  console.log(`   ${method} ${path}`)
  const startTime = Date.now()

  try {
    const response = await fetch(`${CRS_BASE_URL}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const contentType = response.headers.get('content-type')
    let data: any

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    const timing = Date.now() - startTime

    const result: TestResult = {
      endpoint: path,
      method,
      statusCode: response.status,
      status: response.ok ? 'success' : (response.status === 404 ? 'not_found' : 'error'),
      timing,
    }

    if (response.ok) {
      console.log(`✅ 成功 (${response.status}) - ${timing}ms`)

      if (typeof data === 'object' && data !== null) {
        const topKeys = Object.keys(data).slice(0, 10)
        console.log(`   主要字段: ${topKeys.join(', ')}`)

        if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(`   data: Array[${data.data.length}]`)
            if (data.data.length > 0) {
              const sampleKeys = Object.keys(data.data[0] || {}).slice(0, 10)
              console.log(`   数组元素字段: ${sampleKeys.join(', ')}`)
            }
          } else if (typeof data.data === 'object') {
            const dataKeys = Object.keys(data.data).slice(0, 10)
            console.log(`   data字段: ${dataKeys.join(', ')}`)
          }
        }

        result.data = data
      } else {
        result.data = data
      }
    } else if (response.status === 404) {
      console.log(`⚠️  未找到 (${response.status})`)
    } else {
      console.log(`❌ 失败 (${response.status})`)
      result.error = typeof data === 'string' ? data : JSON.stringify(data)
    }

    results.push(result)
  } catch (error) {
    const timing = Date.now() - startTime
    console.log(`❌ 异常 (${timing}ms):`, error)
    results.push({
      endpoint: path,
      method,
      status: 'error',
      error: String(error),
      timing,
    })
  }
}

function generateReport(): string {
  const successful = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'error')
  const notFound = results.filter(r => r.status === 'not_found')

  let report = `# CRS API 验证报告 - 第二批（核心统计）

> **验证时间**: ${new Date().toISOString()}
> **验证端点数**: ${results.length}

---

## 📊 验证概览

- ✅ 成功: ${successful.length}
- ❌ 失败: ${failed.length}
- ⚠️  未找到: ${notFound.length}
- ⏱️ 平均响应时间: ${Math.round(results.filter(r => r.timing).reduce((sum, r) => sum + (r.timing || 0), 0) / results.filter(r => r.timing).length)}ms

---

## ✅ 成功的端点

`

  for (const r of successful) {
    report += `
### ${r.method} ${r.endpoint}

- **状态码**: ${r.statusCode}
- **响应时间**: ${r.timing}ms
- **数据预览**:
\`\`\`json
${JSON.stringify(r.data, null, 2).substring(0, 2000)}
\`\`\`
`
  }

  if (failed.length > 0) {
    report += `\n---\n\n## ❌ 失败的端点\n\n`
    for (const r of failed) {
      report += `
### ${r.method} ${r.endpoint}

- **状态码**: ${r.statusCode || '无响应'}
- **错误**: ${r.error}
`
    }
  }

  if (notFound.length > 0) {
    report += `\n---\n\n## ⚠️ 未找到的端点\n\n`
    for (const r of notFound) {
      report += `- ${r.method} ${r.endpoint}\n`
    }
  }

  report += `\n---\n\n**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`

  return report
}

async function main() {
  console.log('🚀 CRS API验证 - 第二批：核心统计')
  console.log('=' .repeat(60))

  const token = await authenticate()
  if (!token) {
    console.log('\n❌ 认证失败，无法继续')
    process.exit(1)
  }

  const endpoints = [
    { path: '/admin/usage-stats', method: 'GET', desc: '使用统计' },
    { path: '/admin/model-stats', method: 'GET', desc: '模型统计' },
    { path: '/admin/usage-costs', method: 'GET', desc: '费用统计' },
    { path: '/admin/usage-trend', method: 'GET', desc: '总体趋势' },
  ]

  for (const endpoint of endpoints) {
    await testEndpoint(token, endpoint.path, endpoint.method, endpoint.desc)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📝 生成验证报告...')

  const report = generateReport()

  const fs = require('fs')
  const path = require('path')
  const reportPath = path.join(__dirname, '../docs/CRS_VERIFY_GROUP2_REPORT.md')
  fs.writeFileSync(reportPath, report, 'utf-8')

  console.log(`✅ 报告已保存: ${reportPath}`)
  console.log('\n✨ 验证完成！')
  console.log('='.repeat(60))
}

main().catch(console.error)
