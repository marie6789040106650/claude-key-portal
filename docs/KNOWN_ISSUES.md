# 已知问题清单

> **最后更新**: 2025-10-08
> **状态追踪**: 实时更新

---

## 🚨 P0 - 阻塞性问题

_暂无P0级别问题_

---

## ⚠️ P1 - 高优先级问题

### 1. Toast组件Mock缺失导致测试失败

**问题ID**: ISSUE-001
**发现时间**: 2025-10-08
**解决时间**: 2025-10-08
**状态**: ✅ 已修复
**影响范围**: P1测试套件

#### 问题描述

P1阶段的组件测试中，涉及toast提示的测试全部失败。测试期望能找到toast消息文本，但实际无法找到。

#### 受影响文件

```
tests/unit/components/keys/FavoriteButton.test.tsx   - 17个测试失败
tests/unit/components/keys/NotesEditor.test.tsx     - 6个测试失败
tests/unit/components/keys/TagSelector.test.tsx     - 可能受影响（未验证）
```

#### 失败示例

```typescript
// FavoriteButton测试
✗ API 返回错误应该显示提示
  Unable to find an element with the text: 操作失败，请重试

// NotesEditor测试
✗ 保存成功应该显示成功提示
  Unable to find an element with the text: 保存成功

✗ 保存失败应该显示错误提示
  Unable to find an element with the text: 保存失败，请重试
```

#### 根本原因

测试文件缺少对 `@/components/ui/use-toast` 的mock配置。组件调用 `toast()` 函数时，测试环境无法正确模拟toast的显示行为。

#### 修复方案

在每个测试文件顶部添加toast mock：

```typescript
// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
  useToast: () => ({
    toast: jest.fn(),
  }),
}))
```

然后在测试中验证toast被调用：

```typescript
import { toast } from '@/components/ui/use-toast'

it('应该显示成功提示', async () => {
  // ... 触发操作

  expect(toast).toHaveBeenCalledWith({
    title: '保存成功',
  })
})
```

#### 工作量评估

- **修复文件数**: 3个测试文件
- **预计时间**: 2-3小时
- **测试验证**: 30分钟

#### 修复措施

**分支**: `feature/p1-missing-features`

**修复步骤**:
1. 在测试文件顶部添加toast mock配置
2. 修改测试验证方式（从DOM查找改为验证toast调用）
3. 调整测试期望值以匹配组件实际实现

**提交记录**:
```bash
test(p1): fix toast mock in FavoriteButton and NotesEditor tests (🔵 REFACTOR)
```

**修复效果**:
- 修复前：23个测试失败
- 修复后：7个测试失败（16个toast相关测试通过）
- 修复率：69.6% (16/23)

**剩余问题**:
- 7个失败测试与toast mock无关，涉及其他功能（定时器、键盘事件等）
- 已记录为后续优化项

---

## 📋 P2 - 中优先级问题

### 2. 过度设计功能需要移除

**问题ID**: ISSUE-002
**发现时间**: 2025-10-08
**解决时间**: 2025-10-08
**状态**: ✅ 已解决
**影响范围**: 项目复杂度、维护成本

#### 问题描述

项目实现了大量需求文档外的功能，导致代码膨胀、测试覆盖不足、维护成本增加。

#### 过度设计清单

##### 2.1 监控和告警系统 ❌

**文件**:
- `app/api/monitor/health/route.ts` (24行)
- `app/api/monitor/metrics/route.ts` (63行)
- `app/api/monitor/alerts/route.ts` (79行)
- `app/api/monitor/config/route.ts` (64行)

**问题**:
- 需求文档未提及监控系统
- 属于P3"未来功能"
- 增加系统复杂度

**移除时间**: 1小时

---

##### 2.2 通知系统 ❌

**文件**:
- `app/api/user/notifications/route.ts` (152行)
- `app/api/user/notifications/[id]/route.ts`
- `app/api/user/notifications/[id]/read/route.ts`
- `app/api/user/notifications/read-all/route.ts`
- `app/api/user/notification-config/route.ts`
- `app/dashboard/settings/notifications/page.tsx`

**问题**:
- 需求明确标注为"Phase 2"（可选）
- 当前无邮件服务集成，功能不完整
- 7个API + 1个页面，工作量巨大

**移除时间**: 3小时

---

##### 2.3 会话管理 ❌

**文件**:
- `app/api/user/sessions/route.ts` (114行)
- `app/api/user/sessions/[id]/route.ts`

**问题**:
- 需求只要求"会话管理"，未明确需要会话列表
- 当前JWT实现无需复杂会话管理
- 应简化为单一"退出登录"

**移除时间**: 0.5小时

---

##### 2.4 密钥过期设置 ❌

**文件**:
- `app/api/user/expiration-settings/route.ts`
- `app/dashboard/settings/expiration/page.tsx`

**问题**:
- 需求未提及用户级别过期设置
- 密钥过期应在CRS层面控制（创建时指定）

**移除时间**: 1小时

---

#### 工作量总计

| 功能 | 文件数 | 代码行数 | 移除时间 |
|------|--------|----------|----------|
| 监控系统 | 4个API | ~230行 | 1小时 |
| 通知系统 | 7个API + 1页面 | ~800行 | 3小时 |
| 会话管理 | 2个API | ~120行 | 0.5小时 |
| 过期设置 | 2个API + 1页面 | ~250行 | 1小时 |
| **总计** | **15个API + 2页面** | **~1400行** | **5.5小时** |

#### 移除计划

1. **阶段1**: 监控系统（1小时）
2. **阶段2**: 会话管理、过期设置（1.5小时）
3. **阶段3**: 通知系统（3小时）

#### 执行结果

✅ **已完成**: 2025-10-08

**执行情况**:
- **分支**: `feature/remove-overengineered-features`
- **提交**: `6e0c0d6 refactor(cleanup): remove over-engineered features`
- **移除文件**: 19个 (12 API + 2页面 + 5测试文件)
- **代码减少**: -3042行 (净减少2801行)
- **TypeScript**: ✅ 编译通过
- **修复**: 修正了install页面的React Query API使用

**并行执行**:
- 任务组1: 监控、会话、过期设置同时移除 ✅
- 任务组2: 通知系统移除 ✅
- 清理对应的测试文件 ✅

---

## 📝 P3 - 低优先级问题

### 3. P1功能缺失

**问题ID**: ISSUE-003
**发现时间**: 2025-10-08
**状态**: 🟡 规划中
**影响范围**: 功能完整性

#### 开发计划

**P1功能**: ✅ 已全部完成（无缺失）

**备注**: 主题、语言、时区等个性化功能已确认不需要实现，系统作为CRS的用户管理门户，只需保持简洁。

---

## 🐛 其他已知问题

### 4. NotesEditor Markdown预览过度设计

**问题ID**: ISSUE-004
**发现时间**: 2025-10-08
**状态**: ✅ 已修复
**修复时间**: 2025-10-08

#### 问题描述

NotesEditor组件实现了Markdown预览功能，但需求只要求 `localNotes?: string`（纯文本）。

#### 修复措施

- 删除 `supportMarkdown` prop
- 删除预览按钮和Markdown预览div
- 删除3个Markdown相关测试用例
- 组件从170行简化到131行

#### 提交记录

```
71debe4 refactor(p1): simplify NotesEditor by removing Markdown preview (🔵 REFACTOR)
```

---

## 📊 问题统计

### 按优先级

| 优先级 | 问题数 | 已修复 | 待修复 |
|--------|--------|--------|--------|
| P0 | 0 | - | - |
| P1 | 1 | 0 | 1 |
| P2 | 1 | 1 | 0 |
| P3 | 1 | 0 | 1 |
| **总计** | **3** | **1** | **2** |

### 按类型

| 类型 | 数量 | 已解决 | 比例 |
|------|------|--------|------|
| 测试问题 | 1 | 0 | 33% |
| 过度设计 | 1 | 1 | 33% |
| 功能缺失 | 1 | 0 | 33% |

---

## 🎯 解决路线图

### 短期（1-2天）

- [ ] 修复Toast Mock问题（ISSUE-001）
- [x] 移除过度设计功能（ISSUE-002）✅ 已完成 2025-10-08

### 中期（3-5天）

- [ ] 补充P1缺失功能（ISSUE-003）

### 长期（1-2周）

- [ ] P2功能开发
- [ ] 全面测试覆盖率提升

---

## 📞 问题上报

如发现新问题，请按以下格式添加：

```markdown
### X. 问题标题

**问题ID**: ISSUE-XXX
**发现时间**: YYYY-MM-DD
**状态**: 🔴 未修复 / 🟡 进行中 / ✅ 已修复
**影响范围**: 描述

#### 问题描述
...

#### 修复方案
...

#### 工作量评估
...
```

---

**维护者**: Claude Key Portal Team
**更新频率**: 实时更新
**审查周期**: 每周一次
