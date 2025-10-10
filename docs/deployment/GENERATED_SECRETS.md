# 🔐 生成的生产密钥

> **生成日期**: 2025-10-07
> **重要**: 此文件包含敏感信息，请妥善保管！

---

## 🔑 JWT密钥

### NEXTAUTH_SECRET

```
WtgIGc3Gb9ZZlRXKfrJlNsXQnL2KZIC+/ewg0zle1Rk=
```

### JWT_SECRET

```
x7rj2zVduSBOcO2UkQrbxfGSjlgylBuKXsTcRgZoQXA=
```

---

## 📋 Vercel环境变量配置

### 复制以下内容到Vercel Dashboard

```bash
# JWT认证
NEXTAUTH_SECRET="WtgIGc3Gb9ZZlRXKfrJlNsXQnL2KZIC+/ewg0zle1Rk="
NEXTAUTH_URL="https://portal.just-play.fun"
JWT_SECRET="x7rj2zVduSBOcO2UkQrbxfGSjlgylBuKXsTcRgZoQXA="
JWT_EXPIRES_IN="24h"
```

---

## 🔒 安全提醒

1. ⚠️ **不要提交此文件到Git**
2. ⚠️ **不要分享密钥给未授权人员**
3. ⚠️ **定期轮换密钥（建议3个月）**
4. ⚠️ **如果密钥泄露，立即重新生成**

---

## 🔄 密钥轮换流程

### 如需重新生成密钥

```bash
# 生成新的NEXTAUTH_SECRET
openssl rand -base64 32

# 生成新的JWT_SECRET
openssl rand -base64 32

# 更新Vercel环境变量
vercel env rm NEXTAUTH_SECRET production
vercel env add NEXTAUTH_SECRET production

vercel env rm JWT_SECRET production
vercel env add JWT_SECRET production

# 重新部署
vercel --prod
```

---

**生成者**: Claude AI Assistant
**审核者**: _________________
**批准日期**: _________________
