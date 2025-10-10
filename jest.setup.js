// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Import CRS Client Mock (必须在所有测试前导入)
import './tests/mocks/crs-client.mock'

// Import统一的Mock配置
import './tests/setup/auth-mock'
import './tests/setup/fetch-mock'
import './tests/setup/clipboard-mock'
import './tests/setup/redis-mock'

// Polyfill for Next.js Server APIs (only TextEncoder/TextDecoder needed)
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Node 18+ has built-in fetch/Request/Response, no need for polyfill

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.CRS_BASE_URL = 'https://claude.just-play.fun'
process.env.CRS_ADMIN_USERNAME = 'test_admin'
process.env.CRS_ADMIN_PASSWORD = 'test_password'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// 全局清理 Mock 状态
beforeEach(() => {
  jest.clearAllMocks()
})
