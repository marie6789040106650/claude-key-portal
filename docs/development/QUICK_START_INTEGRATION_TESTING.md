# CRS集成测试快速入门

> **目标**: 5分钟内完成Sprint 2的CRS集成验证
> **前提**: Sprint 2代码已完成，单元测试通过

---

## 🚀 快速执行（3步完成）

### Step 1: 检查环境变量（1分钟）

```bash
# 检查.env.local文件
cat .env.local | grep CRS
```

**必须包含**:
```bash
CRS_BASE_URL=https://claude.just-play.fun
CRS_ADMIN_USERNAME=cr_admin_4ce18cd2
CRS_ADMIN_PASSWORD=HCTBMoiK3PZD0eDC
```

**如果缺失**:
```bash
echo "CRS_BASE_URL=https://claude.just-play.fun" >> .env.local
echo "CRS_ADMIN_USERNAME=cr_admin_4ce18cd2" >> .env.local
echo "CRS_ADMIN_PASSWORD=HCTBMoiK3PZD0eDC" >> .env.local
```

---

### Step 2: 运行集成测试（2分钟）

```bash
npx tsx scripts/test-crs-connection.ts
```

**预期输出**:
```
🔍 开始测试CRS连接...

1️⃣ 测试CRS认证...
✅ 认证成功!
   Token: eyJhbGciOiJIUzI1NiI...

2️⃣ 测试获取仪表板数据...
✅ 仪表板数据获取成功!
   数据: {...}

3️⃣ 测试创建密钥...
✅ 密钥创建成功!
   密钥ID: key_abc123

4️⃣ 测试更新密钥...
✅ 密钥更新成功!

5️⃣ 测试获取密钥统计...
✅ 统计数据获取成功!
   统计: {...}

6️⃣ 测试删除密钥...
✅ 密钥删除成功!

🎉 所有CRS API测试通过!
```

---

### Step 3: 记录结果（2分钟）

#### 情况A: 测试通过 ✅

```bash
# 更新集成测试日志
cat >> docs/INTEGRATION_TEST_LOG.md <<EOF

## Sprint 2 - API密钥管理（更新）

**测试时间**: $(date '+%Y-%m-%d %H:%M')
**测试人员**: $(whoami)
**测试结果**: ✅ 通过
**CRS版本**: 获取自CRS响应
**发现问题**: 无
**修复情况**: N/A

### 测试覆盖
- ✅ CRS基础连接
- ✅ 密钥创建
- ✅ 密钥更新
- ✅ 密钥删除
- ✅ 密钥统计

### 执行命令
\`\`\`bash
npx tsx scripts/test-crs-connection.ts
\`\`\`

### 测试结果
所有API调用成功，响应格式与代码预期完全匹配。

EOF

# 提交记录
git add docs/INTEGRATION_TEST_LOG.md
git commit -m "test: Sprint 2 CRS integration verified ✅"

echo "✅ Sprint 2集成验证完成！可以开始Sprint 3了。"
```

#### 情况B: 测试失败 ❌

**常见错误和解决方案**:

##### 错误1: 认证失败
```
❌ CRS测试失败: CRS authentication failed
```

**解决**:
1. 检查CRS_ADMIN_USERNAME和CRS_ADMIN_PASSWORD是否正确
2. 检查CRS服务是否可访问: `curl https://claude.just-play.fun`
3. 检查网络连接

##### 错误2: 响应格式不匹配
```
❌ TypeError: Cannot read property 'xxx' of undefined
```

**解决**:
1. 查看错误详情中的实际响应
2. 对比代码中的期望格式
3. 修改代码以匹配真实响应

**修复流程**:
```bash
# 1. 修改代码
# 调整 lib/crs-client.ts 或 app/api/xxx/route.ts

# 2. 重新运行单元测试（确保仍然通过）
npm test

# 3. 再次运行集成测试
npx tsx scripts/test-crs-connection.ts

# 4. 提交修复
git add .
git commit -m "fix: adjust CRS API format to match real response"

# 5. 更新日志
# 记录发现的问题和修复方案到 INTEGRATION_TEST_LOG.md
```

##### 错误3: CRS服务不可用
```
❌ CRS服务暂时不可用，请稍后重试
```

**解决**:
1. 检查CRS服务状态
2. 等待服务恢复
3. 稍后重试

---

## 📊 验证清单

完成集成测试后，检查以下项目：

```markdown
Sprint 2集成验证清单:
- [ ] ✅ 环境变量配置正确
- [ ] ✅ 集成测试脚本运行通过
- [ ] ✅ 所有API调用成功
- [ ] ✅ 响应格式与代码匹配
- [ ] ✅ 测试结果已记录到INTEGRATION_TEST_LOG.md
- [ ] ✅ 相关提交已推送到Git

如果所有项目都勾选，Sprint 2集成验证完成！🎉
```

---

## 🔄 未来Sprint快速参考

### Sprint 3及以后的集成测试

每个Sprint完成TDD开发后：

```bash
# 1. 创建集成测试脚本
cp scripts/test-crs-connection.ts scripts/test-crs-xxx.ts
# 修改为测试新功能

# 2. 运行测试
npx tsx scripts/test-crs-xxx.ts

# 3. 记录结果
# 更新 docs/INTEGRATION_TEST_LOG.md

# 4. 合并代码
git checkout develop
git merge feature/xxx --no-ff
```

---

## 💡 常见问题

### Q1: 为什么要做集成测试？
**A**: 单元测试用Mock，可能与真实CRS响应格式不匹配。集成测试确保代码真的能用。

### Q2: 多久做一次集成测试？
**A**: 每个Sprint完成后立即做一次，不要等到最后。

### Q3: 集成测试失败怎么办？
**A**: 很正常！修复代码，重新测试，记录问题。这就是集成测试的价值。

### Q4: 能跳过集成测试吗？
**A**: 不能。这是项目强制要求。

---

## 📞 需要帮助？

**问题排查顺序**:
1. 检查错误消息
2. 查看 docs/CRS_INTEGRATION_STANDARD.md
3. 查看 docs/TESTING_STRATEGY.md
4. 联系团队成员

---

**下一步**: 运行 `npx tsx scripts/test-crs-connection.ts` 开始验证！
