# Sprint 9 API 端点文档

## 监控告警 API

详见 SPRINT_9_SUMMARY.md

### 主要端点

#### 1. 系统健康检查
- **端点**: `GET /api/monitor/health`
- **功能**: 获取系统健康状态
- **参数**: 无
- **返回**:
  ```typescript
  {
    database: { status: 'healthy' | 'unhealthy', latency: number },
    crs: { status: 'healthy' | 'unhealthy', latency: number },
    redis: { status: 'healthy' | 'unhealthy', latency: number }
  }
  ```

#### 2. 性能指标
- **端点**: `GET /api/monitor/metrics`
- **功能**: 获取系统性能指标
- **参数**:
  - `period`: 时间范围（5m, 1h, 24h）
- **返回**:
  ```typescript
  {
    cpu: { usage: number, trend: number[] },
    memory: { usage: number, trend: number[] },
    responseTime: { avg: number, p95: number, p99: number },
    requestRate: { current: number, trend: number[] }
  }
  ```

#### 3. 告警规则配置
- **端点**: `GET /api/monitor/config`
- **功能**: 获取告警规则配置
- **参数**: 无
- **返回**: 告警规则列表

- **端点**: `PUT /api/monitor/config`
- **功能**: 更新告警规则
- **参数**:
  ```typescript
  {
    rules: Array<{
      name: string,
      metric: string,
      threshold: number,
      severity: 'low' | 'medium' | 'high' | 'critical',
      enabled: boolean
    }>
  }
  ```
- **返回**: 更新后的配置

#### 4. 告警列表
- **端点**: `GET /api/monitor/alerts`
- **功能**: 获取系统告警历史
- **参数**:
  - `severity`: 告警级别过滤（可选）
  - `status`: 状态过滤（active, resolved, acknowledged）
  - `limit`: 返回数量限制
- **返回**: 告警记录数组
  ```typescript
  Array<{
    id: string,
    metric: string,
    severity: string,
    status: string,
    message: string,
    triggeredAt: string,
    resolvedAt?: string
  }>
  ```

## 监控数据收集

系统自动收集以下监控指标：
- 数据库连接池状态
- CRS API 响应时间
- Redis 缓存命中率
- API 端点响应时间
- 错误率统计

## 告警通知

支持的通知渠道：
- 邮件通知（配置 SMTP）
- Webhook 通知（支持 Slack、Discord）
- 系统内通知（Dashboard 显示）

**参考文档**:
- SPRINT_9_SUMMARY.md - Sprint 9 实现总结
- 监控告警设计规范（待补充）
