/**
 * 生产环境配置验证脚本
 *
 * 用途：验证所有生产环境配置是否正确
 * 使用：npx tsx scripts/verify-production-config.ts
 */

import { PrismaClient } from '@prisma/client'

interface ConfigCheck {
  name: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
}

const results: ConfigCheck[] = []

async function checkEnvironmentVariables() {
  console.log('🔍 检查环境变量...\n')

  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_DOMAIN',
    'CRS_BASE_URL',
    'CRS_ADMIN_USERNAME',
    'CRS_ADMIN_PASSWORD',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ]

  const optionalVars = [
    'REDIS_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'R2_BUCKET_NAME',
    'R2_ACCESS_KEY_ID',
  ]

  // 检查必需变量
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value) {
      results.push({
        name: `env:${varName}`,
        status: 'FAIL',
        message: `Missing required environment variable: ${varName}`,
      })
    } else {
      results.push({
        name: `env:${varName}`,
        status: 'PASS',
        message: `✓ ${varName} is set (${value.substring(0, 20)}...)`,
      })
    }
  }

  // 检查可选变量
  for (const varName of optionalVars) {
    const value = process.env[varName]
    if (!value) {
      results.push({
        name: `env:${varName}`,
        status: 'WARN',
        message: `Optional variable not set: ${varName}`,
      })
    } else {
      results.push({
        name: `env:${varName}`,
        status: 'PASS',
        message: `✓ ${varName} is set`,
      })
    }
  }
}

async function checkDatabaseConnection() {
  console.log('🔍 检查数据库连接...\n')

  try {
    const prisma = new PrismaClient()

    // 测试连接
    await prisma.$queryRaw`SELECT 1`

    // 检查表是否存在
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `

    if (tables.length === 0) {
      results.push({
        name: 'database:tables',
        status: 'FAIL',
        message: 'No tables found. Run database migrations first.',
      })
    } else {
      results.push({
        name: 'database:connection',
        status: 'PASS',
        message: `✓ Database connected. Found ${tables.length} tables.`,
      })
    }

    await prisma.$disconnect()
  } catch (error) {
    results.push({
      name: 'database:connection',
      status: 'FAIL',
      message: `Database connection failed: ${(error as Error).message}`,
    })
  }
}

async function checkRedisConnection() {
  console.log('🔍 检查Redis连接...\n')

  const redisUrl = process.env.REDIS_URL
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl && !restUrl) {
    results.push({
      name: 'redis:connection',
      status: 'WARN',
      message: 'Redis not configured (optional for basic functionality)',
    })
    return
  }

  // 如果使用REST API
  if (restUrl && restToken) {
    try {
      const response = await fetch(`${restUrl}/ping`, {
        headers: {
          Authorization: `Bearer ${restToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        results.push({
          name: 'redis:rest-api',
          status: 'PASS',
          message: `✓ Redis REST API connected: ${data.result}`,
        })
      } else {
        results.push({
          name: 'redis:rest-api',
          status: 'FAIL',
          message: `Redis REST API connection failed: ${response.statusText}`,
        })
      }
    } catch (error) {
      results.push({
        name: 'redis:rest-api',
        status: 'FAIL',
        message: `Redis REST API error: ${(error as Error).message}`,
      })
    }
  } else {
    results.push({
      name: 'redis:config',
      status: 'WARN',
      message: 'Redis URL configured but REST API credentials missing',
    })
  }
}

async function checkCRSConnection() {
  console.log('🔍 检查CRS服务连接...\n')

  const baseUrl = process.env.CRS_BASE_URL
  const username = process.env.CRS_ADMIN_USERNAME
  const password = process.env.CRS_ADMIN_PASSWORD

  if (!baseUrl || !username || !password) {
    results.push({
      name: 'crs:config',
      status: 'FAIL',
      message: 'CRS configuration incomplete',
    })
    return
  }

  try {
    // 测试CRS登录
    const loginResponse = await fetch(`${baseUrl}/web/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (loginResponse.ok) {
      const data = await loginResponse.json()
      if (data.success && data.token) {
        results.push({
          name: 'crs:authentication',
          status: 'PASS',
          message: '✓ CRS authentication successful',
        })

        // 测试Admin API
        const adminResponse = await fetch(`${baseUrl}/admin/api-keys`, {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        })

        if (adminResponse.ok) {
          results.push({
            name: 'crs:admin-api',
            status: 'PASS',
            message: '✓ CRS Admin API accessible',
          })
        } else {
          results.push({
            name: 'crs:admin-api',
            status: 'FAIL',
            message: `CRS Admin API failed: ${adminResponse.statusText}`,
          })
        }
      } else {
        results.push({
          name: 'crs:authentication',
          status: 'FAIL',
          message: 'CRS login failed: Invalid credentials',
        })
      }
    } else {
      results.push({
        name: 'crs:authentication',
        status: 'FAIL',
        message: `CRS connection failed: ${loginResponse.statusText}`,
      })
    }
  } catch (error) {
    results.push({
      name: 'crs:connection',
      status: 'FAIL',
      message: `CRS connection error: ${(error as Error).message}`,
    })
  }
}

function printResults() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 验证结果汇总')
  console.log('='.repeat(80) + '\n')

  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  const warnings = results.filter((r) => r.status === 'WARN').length

  for (const result of results) {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${icon} [${result.status}] ${result.name}`)
    console.log(`   ${result.message}\n`)
  }

  console.log('='.repeat(80))
  console.log(`总计: ${results.length} 项检查`)
  console.log(`✅ 通过: ${passed}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`⚠️  警告: ${warnings}`)
  console.log('='.repeat(80) + '\n')

  if (failed > 0) {
    console.log('❌ 配置验证失败！请修复上述问题后再部署。\n')
    process.exit(1)
  } else if (warnings > 0) {
    console.log('⚠️  配置验证通过，但有一些警告。可以继续部署。\n')
    process.exit(0)
  } else {
    console.log('✅ 所有配置验证通过！可以安全部署。\n')
    process.exit(0)
  }
}

async function main() {
  console.log('🚀 开始验证生产环境配置...\n')
  console.log('='.repeat(80) + '\n')

  await checkEnvironmentVariables()
  await checkDatabaseConnection()
  await checkRedisConnection()
  await checkCRSConnection()

  printResults()
}

main().catch((error) => {
  console.error('验证脚本执行失败:', error)
  process.exit(1)
})
