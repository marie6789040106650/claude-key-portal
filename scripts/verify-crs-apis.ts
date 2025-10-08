/**
 * CRS API 验证脚本
 *
 * 目的：
 * 1. 验证CRS已部署服务的可用接口
 * 2. 获取真实的数据格式
 * 3. 为P2功能开发提供依据
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
}

const results: TestResult[] = []

/**
 * 1. 认证获取token
 */
async function authenticate(): Promise<string | null> {
  console.log('\n🔐 Step 1: 认证获取token...')

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

    results.push({
      endpoint: '/web/auth/login',
      method: 'POST',
      status: response.ok ? 'success' : 'error',
      statusCode: response.status,
      data: {
        success: data.success,
        hasToken: !!data.token,
        expiresIn: data.expiresIn,
      },
    })

    if (data.success && data.token) {
      console.log('✅ 认证成功')
      console.log(`   Token: ${data.token.substring(0, 20)}...`)
      console.log(`   过期时间: ${data.expiresIn}ms`)
      return data.token
    } else {
      console.log('❌ 认证失败:', data)
      return null
    }
  } catch (error) {
    console.log('❌ 认证异常:', error)
    results.push({
      endpoint: '/web/auth/login',
      method: 'POST',
      status: 'error',
      error: String(error),
    })
    return null
  }
}

/**
 * 2. 测试Admin接口
 */
async function testAdminEndpoints(token: string) {
  console.log('\n📊 Step 2: 测试Admin接口...')

  const endpoints = [
    // 已知接口
    { path: '/admin/dashboard', method: 'GET', desc: '仪表板数据' },
    { path: '/admin/api-keys', method: 'GET', desc: '密钥列表' },
    { path: '/admin/api-keys-usage-trend', method: 'GET', desc: '使用趋势' },

    // 可能的日志接口
    { path: '/admin/logs', method: 'GET', desc: '日志列表（推测）' },
    { path: '/admin/api-logs', method: 'GET', desc: 'API日志（推测）' },
    { path: '/admin/usage-logs', method: 'GET', desc: '使用日志（推测）' },
    { path: '/admin/request-logs', method: 'GET', desc: '请求日志（推测）' },
    { path: '/admin/audit-logs', method: 'GET', desc: '审计日志（推测）' },
  ]

  for (const endpoint of endpoints) {
    await testEndpoint(token, endpoint.path, endpoint.method, endpoint.desc)
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

/**
 * 测试单个接口
 */
async function testEndpoint(
  token: string,
  path: string,
  method: string,
  description: string
) {
  try {
    console.log(`\n🔍 测试: ${method} ${path}`)
    console.log(`   说明: ${description}`)

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

    const result: TestResult = {
      endpoint: path,
      method,
      statusCode: response.status,
      status: response.ok ? 'success' : (response.status === 404 ? 'not_found' : 'error'),
    }

    if (response.ok) {
      console.log(`✅ 成功 (${response.status})`)

      // 分析数据结构
      if (typeof data === 'object' && data !== null) {
        console.log('   数据结构:')

        // 顶层字段
        const topLevelKeys = Object.keys(data).slice(0, 10)
        console.log(`   - 顶层字段: ${topLevelKeys.join(', ')}`)

        // 如果有data字段，查看data的结构
        if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(`   - data: Array[${data.data.length}]`)
            if (data.data.length > 0) {
              const sampleKeys = Object.keys(data.data[0] || {})
              console.log(`   - 数组元素字段: ${sampleKeys.join(', ')}`)
            }
          } else if (typeof data.data === 'object') {
            const dataKeys = Object.keys(data.data).slice(0, 10)
            console.log(`   - data字段: ${dataKeys.join(', ')}`)
          }
        }

        // 保存完整数据（限制大小）
        result.data = JSON.parse(JSON.stringify(data, null, 2).substring(0, 5000))
      } else {
        console.log(`   响应: ${String(data).substring(0, 200)}`)
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
    console.log(`❌ 异常:`, error)
    results.push({
      endpoint: path,
      method,
      status: 'error',
      error: String(error),
    })
  }
}

/**
 * 3. 生成验证报告
 */
function generateReport(): string {
  console.log('\n📝 生成验证报告...')

  const report = `# CRS API 验证报告

> **验证时间**: ${new Date().toISOString()}
> **CRS地址**: ${CRS_BASE_URL}
> **验证目的**: 为P2功能开发提供真实数据依据

---

## 📊 验证概览

- **总测试接口**: ${results.length}
- **成功**: ${results.filter(r => r.status === 'success').length}
- **失败**: ${results.filter(r => r.status === 'error').length}
- **未找到**: ${results.filter(r => r.status === 'not_found').length}

---

## ✅ 可用接口

${results.filter(r => r.status === 'success').map(r => `
### ${r.method} ${r.endpoint}

**状态**: ✅ 可用 (${r.statusCode})

**返回数据结构**:
\`\`\`json
${JSON.stringify(r.data, null, 2)}
\`\`\`
`).join('\n---\n')}

---

## ❌ 不可用接口

${results.filter(r => r.status === 'error').map(r => `
### ${r.method} ${r.endpoint}

**状态**: ❌ 失败 (${r.statusCode || '无响应'})

**错误信息**:
\`\`\`
${r.error || '未知错误'}
\`\`\`
`).join('\n---\n')}

---

## ⚠️ 未找到接口

${results.filter(r => r.status === 'not_found').map(r => `
- ${r.method} ${r.endpoint}
`).join('\n')}

---

## 🎯 P2功能建议

### 基于验证结果的建议

${generateRecommendations()}

---

**报告生成时间**: ${new Date().toLocaleString('zh-CN')}
`

  return report
}

/**
 * 生成功能建议
 */
function generateRecommendations(): string {
  const successfulEndpoints = results.filter(r => r.status === 'success')
  const hasLogs = successfulEndpoints.some(r =>
    r.endpoint.includes('log') || r.endpoint.includes('usage')
  )

  let recommendations = ''

  if (hasLogs) {
    recommendations += `
**✅ 可以实现完整的日志查询功能**

基于以下可用接口：
${successfulEndpoints
  .filter(r => r.endpoint.includes('log') || r.endpoint.includes('usage'))
  .map(r => `- ${r.endpoint}`)
  .join('\n')}

建议功能范围：
- 日志列表展示
- 时间范围筛选
- 密钥筛选
- 分页加载
- 统计概览
`
  } else {
    recommendations += `
**⚠️ 未发现专用日志接口**

可用替代方案：
1. 使用 /admin/dashboard 的统计数据
2. 使用 /admin/api-keys-usage-trend 的趋势数据
3. 降级为统计数据展示（不包含详细日志）

建议功能范围：
- 使用统计图表
- 趋势分析
- 密钥使用概览
`
  }

  return recommendations
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始CRS API验证...')
  console.log(`📍 目标地址: ${CRS_BASE_URL}`)

  // 1. 认证
  const token = await authenticate()
  if (!token) {
    console.log('\n❌ 认证失败，无法继续验证')
    process.exit(1)
  }

  // 2. 测试接口
  await testAdminEndpoints(token)

  // 3. 生成报告
  const report = generateReport()

  console.log('\n' + '='.repeat(80))
  console.log(report)
  console.log('='.repeat(80))

  // 4. 保存报告到文件
  const fs = require('fs')
  const path = require('path')
  const reportPath = path.join(__dirname, '../docs/CRS_API_VERIFICATION.md')
  fs.writeFileSync(reportPath, report, 'utf-8')
  console.log(`\n✅ 报告已保存到: ${reportPath}`)

  console.log('\n🎉 验证完成！')
}

// 执行
main().catch(console.error)
