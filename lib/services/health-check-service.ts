/**
 * HealthCheckService - 健康检查服务
 *
 * 负责检查系统各组件的健康状态:
 * - 数据库连接检查
 * - Redis连接检查
 * - CRS服务检查
 * - 整体健康状态聚合
 */

import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { crsClient } from '@/lib/crs-client'

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy'
  responseTime: number
  error?: string
  metadata?: Record<string, any>
}

export interface SystemHealthCheck {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    crs: ServiceHealth
  }
  timestamp: string
}

export class HealthCheckService {
  /**
   * 检查数据库连接
   */
  async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now()

    try {
      // 执行简单查询测试连接
      await prisma.$queryRaw`SELECT 1 as result`

      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        responseTime,
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      return {
        status: 'unhealthy',
        responseTime,
        error: error.message,
      }
    }
  }

  /**
   * 检查Redis连接
   */
  async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now()

    try {
      // 执行PING测试连接
      const response = await redis.ping()

      const responseTime = Date.now() - startTime

      if (response === 'PONG') {
        return {
          status: 'healthy',
          responseTime,
        }
      }

      return {
        status: 'unhealthy',
        responseTime,
        error: 'Unexpected response from Redis',
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      return {
        status: 'unhealthy',
        responseTime,
        error: error.message,
      }
    }
  }

  /**
   * 检查CRS服务
   */
  async checkCRS(): Promise<ServiceHealth> {
    const startTime = Date.now()

    try {
      // 调用CRS健康检查接口
      await crsClient.healthCheck()

      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        responseTime,
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      return {
        status: 'unhealthy',
        responseTime,
        error: error.message,
      }
    }
  }

  /**
   * 检查所有服务健康状态
   */
  async checkAll(): Promise<SystemHealthCheck> {
    const [database, redis, crs] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkCRS(),
    ])

    // 计算整体健康状态
    const services = { database, redis, crs }
    const healthyCount = Object.values(services).filter(
      (s) => s.status === 'healthy'
    ).length

    let overall: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyCount === 3) {
      overall = 'healthy'
    } else if (healthyCount >= 1) {
      overall = 'degraded'
    } else {
      overall = 'unhealthy'
    }

    // 记录健康状态到数据库
    await this.saveHealthCheck({
      overall,
      services,
      timestamp: new Date().toISOString(),
    })

    return {
      overall,
      services,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 保存健康检查结果到数据库
   */
  private async saveHealthCheck(check: SystemHealthCheck): Promise<void> {
    try {
      await prisma.systemHealth.create({
        data: {
          status: check.overall,
          services: check.services as any,
          timestamp: new Date(check.timestamp),
        },
      })
    } catch (error) {
      // 健康检查记录失败不应该影响主流程
      console.error('Failed to save health check:', error)
    }
  }
}
