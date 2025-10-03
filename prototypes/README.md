# 🎨 Claude Key Portal - HTML 原型

> **状态**: ✅ 已完成
> **创建时间**: 2025-10-02
> **页面数量**: 6 个核心页面

---

## 📁 原型文件结构

```
prototypes/
├── index.html              # 首页/欢迎页
├── login.html             # 登录页面
├── register.html          # 注册页面
├── dashboard.html         # 仪表板（带图表）
├── keys.html              # 密钥管理列表
├── install.html           # 安装指导
├── assets/
│   ├── css/
│   │   └── custom.css     # 自定义样式
│   └── js/
│       └── app.js         # 交互脚本
└── README.md              # 本文档
```

---

## 🚀 快速开始

### 本地查看

直接在浏览器中打开任意 HTML 文件即可查看：

```bash
# macOS
open prototypes/index.html

# Windows
start prototypes/index.html

# Linux
xdg-open prototypes/index.html
```

### 或使用本地服务器

```bash
cd prototypes
python3 -m http.server 8000
# 访问 http://localhost:8000
```

---

## 📄 页面列表

### 1. 首页 (index.html)
- **功能**: 产品介绍、功能展示、CTA
- **状态**: ✅ 完成
- **特点**:
  - Hero Section
  - 功能卡片展示
  - 使用步骤说明
  - 原型导航（开发用）

### 2. 登录页面 (login.html)
- **功能**: 用户登录
- **状态**: ✅ 完成
- **特点**:
  - 邮箱密码登录
  - 记住我选项
  - 表单验证
  - 渐变背景

### 3. 注册页面 (register.html)
- **功能**: 用户注册
- **状态**: ✅ 完成
- **特点**:
  - 用户名、邮箱、密码
  - 密码确认
  - 服务条款同意
  - 密码强度提示

### 4. 仪表板 (dashboard.html)
- **功能**: 数据概览
- **状态**: ✅ 完成
- **特点**:
  - 4个统计卡片
  - Chart.js 图表（趋势图、饼图）
  - 最近活动列表
  - 响应式侧边栏

### 5. 密钥管理 (keys.html)
- **功能**: 密钥 CRUD
- **状态**: ✅ 完成
- **特点**:
  - 密钥列表卡片
  - 搜索和筛选
  - 创建密钥模态框
  - 密钥复制功能
  - 状态标签

### 6. 安装指导 (install.html)
- **功能**: 配置步骤
- **状态**: ✅ 完成
- **特点**:
  - 平台选择（macOS/Windows/Linux）
  - Shell 选择（Bash/Zsh/Fish/PowerShell）
  - 代码块复制
  - 常见问题 FAQ

---

## 🎨 设计规范

### 颜色系统
```css
Primary Blue:    #3B82F6 (Blue-500)
Success Green:   #10B981 (Green-500)
Warning Amber:   #F59E0B (Amber-500)
Error Red:       #EF4444 (Red-500)
Gray Scale:      #F9FAFB - #111827
```

### 字体
- **字体族**: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- **基础大小**: 16px (1rem)
- **标题**: 2xl - 5xl

### 间距
- 使用 Tailwind spacing scale (4px 基数)
- 常用: p-4, p-6, gap-4, gap-6

### 组件
- **按钮**: 圆角 8px, 过渡效果
- **卡片**: 白色背景, 阴影, hover 效果
- **表单**: 边框高亮, focus ring

---

## 🔧 技术栈

- **HTML5** - 语义化标签
- **Tailwind CSS** - CDN 方式引入
- **Chart.js** - 图表库 (仅 dashboard.html)
- **Vanilla JavaScript** - 交互逻辑

### CDN 资源
```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Chart.js (可选) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

---

## ✨ 交互功能

### 已实现
- ✅ 表单验证（登录、注册）
- ✅ 密钥复制到剪贴板
- ✅ 模态框显示/隐藏
- ✅ 标签页切换
- ✅ 导航高亮
- ✅ Toast 提示消息
- ✅ 响应式侧边栏

### 模拟数据
- 登录/注册表单验证通过后跳转
- 密钥列表使用静态数据
- 图表数据为示例数据
- 所有后端交互为模拟

---

## 📱 响应式设计

### 断点
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 适配
- ✅ 移动端侧边栏可折叠
- ✅ 卡片网格自适应
- ✅ 表格/列表响应式
- ✅ 导航栏适配

---

## 🎯 原型用途

### ✅ 适合用于
- UI/UX 设计验证
- 用户流程演示
- 团队讨论和评审
- 客户展示

### ❌ 不包含
- 真实的后端 API
- 数据库连接
- 用户认证逻辑
- 生产级别的安全性

---

## 🔄 后续开发

### 从原型到实际开发

1. **提取组件**
   - 将 HTML 转换为 React/Vue 组件
   - 使用 Shadcn/ui 替代手写 HTML

2. **集成 API**
   - 替换模拟数据为真实 API 调用
   - 使用 React Query 管理数据

3. **添加状态管理**
   - 使用 Zustand 管理全局状态
   - 实现真实的用户认证

4. **优化和测试**
   - 添加单元测试和 E2E 测试
   - 性能优化
   - 无障碍支持

---

## 📝 已知限制

1. **数据持久化**: 刷新页面数据会丢失
2. **表单验证**: 仅前端验证，无后端验证
3. **密钥安全**: 明文显示，非生产环境
4. **图表**: 静态数据，无实时更新
5. **搜索筛选**: 纯前端实现，无后端支持

---

## 🎉 完成情况

### Phase 1: 核心页面 ✅
- [x] 登录页面
- [x] 注册页面
- [x] 仪表板
- [x] 密钥列表
- [x] 安装指导
- [x] 首页

### Phase 2: 交互功能 ✅
- [x] 表单验证
- [x] 模态框
- [x] 复制功能
- [x] 标签页切换
- [x] 图表展示

---

## 🚀 下一步

1. **审查原型** - 团队评审 UI/UX
2. **收集反馈** - 用户测试和建议
3. **开始开发** - 基于原型进行实际开发
4. **参考文档**: [DEVELOPMENT_READINESS_REPORT.md](../DEVELOPMENT_READINESS_REPORT.md)

---

**原型版本**: v1.0
**创建者**: Claude
**联系方式**: 项目 GitHub Issues

**Made with ❤️ for Claude Key Portal**
