#!/usr/bin/env tsx

const BASE_URL = 'http://localhost:3000'

async function test() {
  console.log('1. 测试健康检查...')
  const health = await fetch(`${BASE_URL}/api/health`)
  console.log('健康检查:', await health.json())

  console.log('\n2. 注册新用户...')
  const timestamp = Date.now()
  const email = `test${timestamp}@example.com`
  const password = 'Test1234!@#$'

  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      nickname: 'Test User',
    }),
  })
  const registerData = await registerRes.json()
  console.log('注册结果:', registerData)

  console.log('\n3. 用户登录...')
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginData = await loginRes.json()
  console.log('登录结果:', loginData)
  console.log('状态码:', loginRes.status)

  if (loginData.accessToken) {
    console.log('\n4. 测试获取用户信息...')
    const profileRes = await fetch(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${loginData.accessToken}` },
    })
    const profileData = await profileRes.json()
    console.log('用户信息:', profileData)
    console.log('状态码:', profileRes.status)
  }
}

test().catch(console.error)
