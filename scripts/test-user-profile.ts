/**
 * 用户设置API验证脚本
 *
 * 验证Sprint 5, 6, 7的所有用户设置相关API
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// 模拟用户token（需要先登录获取）
let authToken = ''

async function testAPI(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  requireAuth: boolean = true
) {
  const url = `${BASE_URL}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (requireAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (response.ok) {
      log('green', `✓ ${method} ${endpoint} - ${response.status}`)
      return { success: true, data }
    } else {
      log('red', `✗ ${method} ${endpoint} - ${response.status}`)
      log('yellow', `  Error: ${data.error || JSON.stringify(data)}`)
      return { success: false, error: data }
    }
  } catch (error) {
    log('red', `✗ ${method} ${endpoint} - Network Error`)
    log('yellow', `  ${error}`)
    return { success: false, error }
  }
}

async function main() {
  console.log('\n' + '='.repeat(60))
  log('blue', '用户设置API验证测试')
  console.log('='.repeat(60) + '\n')

  // 注意：需要先手动登录获取token，或者在环境变量中设置
  if (process.env.TEST_AUTH_TOKEN) {
    authToken = process.env.TEST_AUTH_TOKEN
    log('green', '✓ 使用环境变量中的认证token')
  } else {
    log('yellow', '⚠ 未提供认证token，部分测试将失败')
    log('yellow', '  提示：设置 TEST_AUTH_TOKEN 环境变量')
  }

  // 1. 测试用户资料API (Sprint 5)
  console.log('\n' + '-'.repeat(60))
  log('blue', '1. 用户资料API (Sprint 5)')
  console.log('-'.repeat(60))

  log('yellow', '\n测试 GET /api/user/profile')
  const profile = await testAPI('/api/user/profile')

  log('yellow', '\n测试 PUT /api/user/profile (更新昵称)')
  await testAPI('/api/user/profile', 'PUT', {
    nickname: 'Test User Updated',
  })

  // 2. 测试密码管理API (Sprint 5)
  console.log('\n' + '-'.repeat(60))
  log('blue', '2. 密码管理API (Sprint 5)')
  console.log('-'.repeat(60))

  log('yellow', '\n测试 PUT /api/user/password (会失败，因为密码不正确)')
  await testAPI('/api/user/password', 'PUT', {
    oldPassword: 'wrong-password',
    newPassword: 'NewPassword123!',
  })

  // 3. 测试会话管理API (Sprint 5)
  console.log('\n' + '-'.repeat(60))
  log('blue', '3. 会话管理API (Sprint 5)')
  console.log('-'.repeat(60))

  log('yellow', '\n测试 GET /api/user/sessions')
  const sessions = await testAPI('/api/user/sessions')

  if (sessions.success && sessions.data.sessions?.length > 1) {
    const sessionId = sessions.data.sessions[1].id
    log('yellow', `\n测试 DELETE /api/user/sessions/${sessionId}`)
    await testAPI(`/api/user/sessions/${sessionId}`, 'DELETE')
  }

  // 4. 测试通知配置API (Sprint 6)
  console.log('\n' + '-'.repeat(60))
  log('blue', '4. 通知配置API (Sprint 6)')
  console.log('-'.repeat(60))

  log('yellow', '\n测试 GET /api/user/notification-config')
  const notifConfig = await testAPI('/api/user/notification-config')

  log('yellow', '\n测试 PUT /api/user/notification-config (更新通知设置)')
  await testAPI('/api/user/notification-config', 'PUT', {
    types: {
      keyCreated: true,
      keyExpiringSoon: true,
    },
  })

  // 5. 测试通知记录API (Sprint 6)
  console.log('\n' + '-'.repeat(60))
  log('blue', '5. 通知记录API (Sprint 6)')
  console.log('-'.repeat(60))

  log('yellow', '\n测试 GET /api/user/notifications')
  const notifications = await testAPI('/api/user/notifications?limit=5')

  // 6. 测试到期设置API (Sprint 7)
  console.log('\n' + '-'.repeat(60))
  log('blue', '6. 到期设置API (Sprint 7)')
  console.log('-'.repeat(60))

  log('yellow', '\n测试 GET /api/user/expiration-settings')
  const expSettings = await testAPI('/api/user/expiration-settings')

  log('yellow', '\n测试 PUT /api/user/expiration-settings (更新到期设置)')
  await testAPI('/api/user/expiration-settings', 'PUT', {
    daysBeforeExpiration: 7,
    enabled: true,
  })

  // 总结
  console.log('\n' + '='.repeat(60))
  log('blue', 'API验证完成')
  console.log('='.repeat(60) + '\n')

  log('yellow', '提示：')
  log('yellow', '1. 部分API需要有效的认证token才能测试')
  log('yellow', '2. 某些API（如密码修改）需要正确的旧密码')
  log('yellow', '3. 建议在开发环境中运行此测试')
}

main().catch(console.error)
