/**
 * 监控服务索引文件
 *
 * 导出所有监控相关的服务和类型
 */

// 导出健康检查服务
export { HealthCheckService } from './health-check-service'
export type {
  ServiceHealth,
  SystemHealthCheck,
} from './health-check-service'

// 导出指标收集服务
export { MetricsCollectorService } from './metrics-collector-service'
export type {
  RecordOptions,
  AggregationOptions,
  MemoryTrend,
} from './metrics-collector-service'

// 导出单例实例（用于生产）
export const healthCheckService = new HealthCheckService()
export const metricsCollectorService = new MetricsCollectorService()
