# 快速测试：实时统计和趋势图表

## 启动开发服务器

```bash
npm run dev
```

## 测试步骤

### 1. 访问密钥详情页

```
URL: http://localhost:3000/dashboard/keys/[密钥ID]
```

### 2. 观察实时统计

**预期效果**：
- ✅ 统计卡片显示"实时"Badge（绿色）
- ✅ 每10秒自动刷新数据
- ✅ 数据变化平滑无闪烁
- ✅ 显示以下指标：
  - 总请求数（带实时标识）
  - 总Token数（带实时标识）
  - 平均Token/请求

### 3. 观察趋势图表

**预期效果**：
- ✅ 显示"使用趋势（最近7天）"卡片
- ✅ 双Y轴折线图：
  - 左轴（蓝色）：请求数
  - 右轴（绿色）：Token数
- ✅ X轴显示日期（月/日）
- ✅ Hover显示详细数据
- ✅ 响应式布局

### 4. 测试降级场景

**模拟CRS不可用**：
```bash
# 在另一个终端暂停CRS服务
# 然后刷新页面
```

**预期效果**：
- ✅ 显示黄色警告："实时统计暂时不可用，显示缓存数据"
- ✅ 仍然显示数据库中的数据
- ✅ 不会报错或白屏

### 5. 测试空数据场景

访问新创建的密钥（无使用记录）

**预期效果**：
- ✅ 统计显示0
- ✅ 趋势图显示"暂无趋势数据"

## 性能检查

### Chrome DevTools

1. 打开 Network 面板
2. 观察请求：
   - `/api/stats/usage?keyId=xxx&realtime=true` - 每10秒一次
   - `/api/stats/usage?keyId=xxx&startDate=...&endDate=...` - 首次加载
3. 检查缓存：
   - Console中查看 `[Cache]` 日志
   - 缓存命中率应 > 80%

### React Query DevTools

如果已安装DevTools：
```bash
npm install @tanstack/react-query-devtools
```

观察查询状态：
- `key-stats-realtime` - 10秒 staleTime
- `key-trend` - 5分钟 staleTime

## 截图检查清单

- [ ] 实时统计卡片（带Badge）
- [ ] 趋势图表（完整图表）
- [ ] 警告提示（CRS不可用时）
- [ ] 空数据提示
- [ ] 移动端响应式

## 已知问题

⚠️ **构建警告**（不影响功能）：
- `archives/` 目录下的旧代码有类型错误
- 主应用构建成功，可以正常运行

## 快速验证命令

```bash
# 检查文件是否正确修改
grep -n "LineChart" /Users/bypasser/claude-project/0930/claude-key-portal/app/dashboard/keys/[id]/page.tsx

# 检查API是否正常
curl http://localhost:3000/api/stats/usage?keyId=xxx&realtime=true \
  -H "Authorization: Bearer YOUR_TOKEN"

# 检查趋势数据
curl "http://localhost:3000/api/stats/usage?keyId=xxx&startDate=2024-10-04&endDate=2024-10-11" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 成功标准

✅ 所有统计卡片正常显示  
✅ 趋势图表渲染正确  
✅ 实时刷新工作正常  
✅ 降级处理生效  
✅ 无控制台错误  
✅ 响应式布局正常  

---

**测试完成后，请更新**: `docs/REALTIME_STATS_IMPLEMENTATION.md`
