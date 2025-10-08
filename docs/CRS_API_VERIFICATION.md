# CRS API 验证报告

> **验证时间**: 2025-10-08T10:31:48.586Z
> **CRS地址**: https://claude.just-play.fun
> **验证目的**: 为P2功能开发提供真实数据依据

---

## 📊 验证概览

- **总测试接口**: 9
- **成功**: 2
- **失败**: 2
- **未找到**: 5

---

## ✅ 可用接口


### POST /web/auth/login

**状态**: ✅ 可用 (200)

**返回数据结构**:
```json
{
  "success": true,
  "hasToken": true,
  "expiresIn": 86400000
}
```

---

### GET /admin/dashboard

**状态**: ✅ 可用 (200)

**返回数据结构**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalApiKeys": 51,
      "activeApiKeys": 51,
      "totalAccounts": 13,
      "normalAccounts": 10,
      "abnormalAccounts": 1,
      "pausedAccounts": 1,
      "rateLimitedAccounts": 2,
      "accountsByPlatform": {
        "claude": {
          "total": 2,
          "normal": 0,
          "abnormal": 0,
          "paused": 1,
          "rateLimited": 2
        },
        "claude-console": {
          "total": 7,
          "normal": 6,
          "abnormal": 1,
          "paused": 0,
          "rateLimited": 0
        },
        "gemini": {
          "total": 3,
          "normal": 3,
          "abnormal": 0,
          "paused": 0,
          "rateLimited": 0
        },
        "bedrock": {
          "total": 0,
          "normal": 0,
          "abnormal": 0,
          "paused": 0,
          "rateLimited": 0
        },
        "openai": {
          "total": 1,
          "normal": 1,
          "abnormal": 0,
          "paused": 0,
          "rateLimited": 0
        },
        "ccr": {
          "total": 0,
          "normal": 0,
          "abnormal": 0,
          "paused": 0,
          "rateLimited": 0
        },
        "openai-responses": {
          "total": 0,
          "normal": 0,
          "abnormal": 0,
          "paused": 0,
          "rateLimited": 0
        }
      },
      "activeAccounts": 10,
      "totalClaudeAccounts": 9,
      "activeClaudeAccounts": 6,
      "rateLimitedClaudeAccounts": 2,
      "totalGeminiAccounts": 3,
      "activeGeminiAccounts": 3,
      "rateLimitedGeminiAccounts": 0,
      "totalTokensUsed": 3176078375,
      "totalRequestsUsed": 75687,
      "totalInputTokensUsed": 37197903,
      "totalOutputTokensUsed": 24989875,
      "totalCacheCreateTokensUsed": 263045889,
      "totalCacheReadTokensUsed": 2850844708,
      "totalAllTokensUsed": 3176078375
    },
    "recentActivity": {
      "apiKeysCreatedToday": 0,
      "requestsToday": 3574,
      "tokensToday": 4526960,
      "inputTokensToday": 3782487,
      "outputTokensToday": 744473,
      "cacheCreateTokensToday": 8979388,
      "cacheReadTokensToday": 101973091
    },
    "systemAverages": {
      "rpm": 1.7,
      "tpm": 1427.16
    },
    "realtimeMetrics": {
      "rpm": 2,
      "tpm": 108079.4,
      "windowMinutes": 5,
      "isHistorical": false
    },
    "systemHealth": {
      "redisConnected": true,
      "claudeAccountsHealthy": true,
      "geminiAccountsHealthy": true,
      "uptime": 19961.84148291
    },
    "systemTimezone": 8
  }
}
```


---

## ❌ 不可用接口


### GET /admin/api-keys

**状态**: ❌ 失败 (无响应)

**错误信息**:
```
SyntaxError: Unterminated string in JSON at position 5000 (line 190 column 10)
```

---

### GET /admin/api-keys-usage-trend

**状态**: ❌ 失败 (无响应)

**错误信息**:
```
SyntaxError: Expected ',' or '}' after property value in JSON at position 5000 (line 183 column 9)
```


---

## ⚠️ 未找到接口


- GET /admin/logs


- GET /admin/api-logs


- GET /admin/usage-logs


- GET /admin/request-logs


- GET /admin/audit-logs


---

## 🎯 P2功能建议

### 基于验证结果的建议


**✅ 可以实现完整的日志查询功能**

基于以下可用接口：
- /web/auth/login

建议功能范围：
- 日志列表展示
- 时间范围筛选
- 密钥筛选
- 分页加载
- 统计概览


---

**报告生成时间**: 2025/10/8 18:31:48
