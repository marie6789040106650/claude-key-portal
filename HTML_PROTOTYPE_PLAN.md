# 🎨 HTML 原型开发计划 / HTML Prototype Development Plan

> **目标**: 快速创建静态 HTML 原型，验证 UI 设计和用户流程
> **工具**: HTML + Tailwind CSS CDN
> **时间**: 1-2 天

---

## 📋 原型页面清单

### Phase 1: 核心页面 (优先级 P0)
1. ✅ **登录页面** (`login.html`)
2. ✅ **注册页面** (`register.html`)
3. ✅ **仪表板** (`dashboard.html`)
4. ✅ **密钥列表** (`keys.html`)
5. ✅ **密钥详情** (`key-detail.html`)
6. ✅ **安装指导** (`install.html`)

### Phase 2: 辅助页面 (优先级 P1)
7. ⏳ **使用统计** (`usage.html`)
8. ⏳ **用户设置** (`settings.html`)
9. ⏳ **密钥创建** (`key-create.html`)

---

## 🏗️ 原型结构

```
prototypes/
├── index.html              # 入口页面（跳转到登录）
├── login.html             # 登录页面
├── register.html          # 注册页面
├── dashboard.html         # 仪表板
├── keys.html              # 密钥列表
├── key-detail.html        # 密钥详情
├── key-create.html        # 创建密钥
├── install.html           # 安装指导
├── usage.html             # 使用统计
├── settings.html          # 用户设置
├── assets/
│   ├── css/
│   │   └── custom.css     # 自定义样式
│   └── js/
│       └── app.js         # 交互脚本
└── components/
    ├── navbar.html        # 导航栏组件
    ├── sidebar.html       # 侧边栏组件
    └── footer.html        # 页脚组件
```

---

## 🎨 设计规范

### 颜色系统
```css
/* Primary Colors */
--primary: #3B82F6;        /* Blue-500 */
--primary-dark: #2563EB;   /* Blue-600 */
--primary-light: #60A5FA;  /* Blue-400 */

/* Neutral Colors */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-800: #1F2937;
--gray-900: #111827;

/* Status Colors */
--success: #10B981;        /* Green-500 */
--warning: #F59E0B;        /* Amber-500 */
--error: #EF4444;          /* Red-500 */
--info: #3B82F6;           /* Blue-500 */
```

### 字体系统
```css
/* Font Families */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### 间距系统
- 使用 Tailwind 的 spacing scale (4px 基数)
- 常用间距: p-4, p-6, p-8, gap-4, gap-6

---

## 📐 布局规范

### 公共布局结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Key Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="assets/css/custom.css">
</head>
<body class="bg-gray-50">
    <!-- Navbar (登录后) -->
    <nav class="bg-white border-b">...</nav>

    <div class="flex">
        <!-- Sidebar (登录后) -->
        <aside class="w-64 bg-white border-r min-h-screen">...</aside>

        <!-- Main Content -->
        <main class="flex-1 p-6">
            <!-- Page Content -->
        </main>
    </div>
</body>
</html>
```

### 响应式断点
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 🎯 页面设计要点

### 1. 登录页面 (login.html)
**布局**: 居中卡片
**元素**:
- Logo + 标题
- 邮箱输入框
- 密码输入框
- "记住我" 复选框
- 登录按钮
- "没有账号？注册" 链接

### 2. 注册页面 (register.html)
**布局**: 居中卡片
**元素**:
- Logo + 标题
- 用户名输入框
- 邮箱输入框
- 密码输入框
- 确认密码输入框
- 注册按钮
- "已有账号？登录" 链接

### 3. 仪表板 (dashboard.html)
**布局**: Navbar + Sidebar + Content
**元素**:
- 统计卡片 x4 (总密钥数、活跃密钥、今日调用、今日Token)
- 使用趋势图表
- 最近活动列表
- 快速操作按钮

### 4. 密钥列表 (keys.html)
**布局**: Navbar + Sidebar + Content
**元素**:
- 页面标题 + "创建密钥" 按钮
- 搜索框 + 筛选器
- 密钥表格/卡片列表
- 分页控件

### 5. 密钥详情 (key-detail.html)
**布局**: Navbar + Sidebar + Content
**元素**:
- 返回按钮 + 密钥名称
- 基础信息卡片
- 使用统计卡片
- 调用日志表格
- 操作按钮（编辑、删除）

### 6. 安装指导 (install.html)
**布局**: Navbar + Sidebar + Content
**元素**:
- 步骤导航（Step 1/2/3）
- 平台选择（Windows/macOS/Linux）
- 配置代码块（可复制）
- 验证步骤
- 常见问题

---

## 🔧 技术实现

### Tailwind CSS CDN
```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#3B82F6',
            dark: '#2563EB',
            light: '#60A5FA',
          }
        }
      }
    }
  }
</script>
```

### 交互功能 (JavaScript)
```javascript
// 简单的交互功能
- 导航高亮
- 模态框显示/隐藏
- 标签页切换
- 复制到剪贴板
- 表单验证（前端）
```

### 图表库 (可选)
```html
<!-- 使用 Chart.js 创建简单图表 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

---

## 📅 开发时间线

### Day 1: 基础页面
- ✅ **上午** (2h): 设置项目结构 + 登录/注册页面
- ✅ **下午** (3h): 仪表板 + 密钥列表页面

### Day 2: 详情和辅助页面
- ✅ **上午** (2h): 密钥详情 + 创建密钥页面
- ✅ **下午** (2h): 安装指导 + 用户设置页面
- ✅ **晚上** (1h): 优化和细节调整

---

## ✅ 验收标准

### 视觉要求
- [ ] 颜色系统符合设计规范
- [ ] 字体大小和间距统一
- [ ] 所有页面响应式适配
- [ ] 交互元素有 hover 状态

### 功能要求
- [ ] 所有页面可以正常访问
- [ ] 导航链接正确跳转
- [ ] 表单有基本验证提示
- [ ] 关键交互功能可用

### 代码质量
- [ ] HTML 语义化
- [ ] 使用 Tailwind 工具类
- [ ] 注释清晰
- [ ] 代码格式统一

---

## 🚀 快速开始

### 1. 创建原型目录
```bash
mkdir -p prototypes/{assets/{css,js},components}
cd prototypes
```

### 2. 创建第一个页面
从登录页面开始，验证设计和技术方案。

### 3. 迭代开发
按照优先级逐个完成页面，快速迭代。

---

## 📝 原型说明

### 原型的目的
- ✅ 验证 UI 设计和布局
- ✅ 确认用户流程和交互
- ✅ 为开发团队提供视觉参考
- ❌ 不包含真实的后端逻辑
- ❌ 不需要完美的代码质量

### 原型的局限
- 数据是静态/模拟的
- 没有真实的认证
- 没有后端 API 调用
- 适合用于演示和讨论

---

**准备开始创建原型！** 🎨

---

**计划版本**: v1.0
**创建时间**: 2025-10-02
