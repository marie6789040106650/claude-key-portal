/**
 * Webhook 客户端
 * 使用 HMAC SHA256 签名验证
 */

import crypto from 'crypto'

/**
 * 发送 Webhook
 */
export async function sendWebhook(options: {
  url: string
  secret: string
  payload: any
}): Promise<void> {
  const { url, secret, payload } = options

  // 生成签名
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')

  // 发送请求
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'User-Agent': 'Claude-Key-Portal-Webhook/1.0',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000), // 10秒超时
  })

  if (!response.ok) {
    throw new Error(`Webhook 请求失败: ${response.status} ${response.statusText}`)
  }
}

/**
 * 验证 Webhook 签名
 * 用于接收 Webhook 的一方验证请求来源
 */
export function verifyWebhookSignature(params: {
  payload: string
  signature: string
  secret: string
}): boolean {
  const { payload, signature, secret } = params

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
