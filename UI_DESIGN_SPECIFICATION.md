# Claude Key Portal - UI/UX 设计规范

## 一、设计系统 (Design System)

### 1.1 设计原则

#### 核心价值观
1. **简洁高效** - 减少操作步骤，提高工作效率
2. **清晰直观** - 信息层级分明，操作路径明确
3. **专业可信** - 技术感与专业性并重
4. **友好包容** - 降低使用门槛，注重无障碍访问

#### 设计语言
- **现代极简** - 扁平化设计，去除不必要的装饰
- **数据驱动** - 数据可视化为核心，图表优先
- **响应灵敏** - 快速反馈，流畅交互
- **一致性强** - 统一的视觉语言和交互模式

---

## 二、视觉设计规范

### 2.1 色彩系统

#### 主色调 (Primary Colors)
```css
/* 品牌主色 - 蓝色系 */
--color-primary-50:  #eff6ff;   /* 极浅蓝 - 背景 */
--color-primary-100: #dbeafe;   /* 浅蓝 - hover背景 */
--color-primary-200: #bfdbfe;   /* 淡蓝 */
--color-primary-300: #93c5fd;   /* 中浅蓝 */
--color-primary-400: #60a5fa;   /* 中蓝 */
--color-primary-500: #3b82f6;   /* 主蓝 - 主要操作 */
--color-primary-600: #2563eb;   /* 深蓝 - hover状态 */
--color-primary-700: #1d4ed8;   /* 更深蓝 */
--color-primary-800: #1e40af;   /* 很深蓝 */
--color-primary-900: #1e3a8a;   /* 最深蓝 */
```

#### 语义色彩 (Semantic Colors)
```css
/* 成功 - 绿色 */
--color-success-50:  #f0fdf4;
--color-success-500: #22c55e;   /* 成功状态、密钥活跃 */
--color-success-600: #16a34a;
--color-success-700: #15803d;

/* 警告 - 黄色 */
--color-warning-50:  #fffbeb;
--color-warning-500: #f59e0b;   /* 警告状态、即将过期 */
--color-warning-600: #d97706;

/* 错误 - 红色 */
--color-error-50:  #fef2f2;
--color-error-500: #ef4444;     /* 错误状态、密钥禁用 */
--color-error-600: #dc2626;
--color-error-700: #b91c1c;

/* 信息 - 青色 */
--color-info-50:  #ecfeff;
--color-info-500: #06b6d4;      /* 提示信息 */
--color-info-600: #0891b2;
```

#### 中性色彩 (Neutral Colors)
```css
/* 灰度系统 */
--color-gray-50:  #f9fafb;      /* 背景色 */
--color-gray-100: #f3f4f6;      /* 卡片背景 */
--color-gray-200: #e5e7eb;      /* 边框、分割线 */
--color-gray-300: #d1d5db;      /* 禁用状态边框 */
--color-gray-400: #9ca3af;      /* 占位符文字 */
--color-gray-500: #6b7280;      /* 次要文字 */
--color-gray-600: #4b5563;      /* 次要标题 */
--color-gray-700: #374151;      /* 主要文字 */
--color-gray-800: #1f2937;      /* 标题 */
--color-gray-900: #111827;      /* 强调标题 */
```

#### 色彩使用规范

| 元素 | 浅色模式 | 深色模式 |
|-----|---------|---------|
| 页面背景 | gray-50 | gray-900 |
| 卡片背景 | white | gray-800 |
| 边框 | gray-200 | gray-700 |
| 主要文字 | gray-900 | gray-100 |
| 次要文字 | gray-600 | gray-400 |
| 主按钮 | primary-500 | primary-600 |
| 成功状态 | success-500 | success-400 |
| 错误状态 | error-500 | error-400 |

### 2.2 字体系统

#### 字体族 (Font Family)
```css
/* 系统字体栈 - 优化阅读体验 */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI",
             Roboto, "Helvetica Neue", Arial, "Noto Sans",
             sans-serif, "Apple Color Emoji", "Segoe UI Emoji";

/* 等宽字体 - 代码、密钥显示 */
--font-mono: ui-monospace, SFMono-Regular, "SF Mono",
             Menlo, Monaco, Consolas, "Liberation Mono",
             "Courier New", monospace;

/* 数字字体 - 数据统计 */
--font-numeric: "SF Pro Display", -apple-system, sans-serif;
```

#### 字号系统 (Font Size)
```css
/* 移动优先的响应式字号 */
--text-xs:   0.75rem;   /* 12px - 辅助信息、标签 */
--text-sm:   0.875rem;  /* 14px - 次要内容、说明文字 */
--text-base: 1rem;      /* 16px - 正文、表格内容 */
--text-lg:   1.125rem;  /* 18px - 小标题 */
--text-xl:   1.25rem;   /* 20px - 卡片标题 */
--text-2xl:  1.5rem;    /* 24px - 页面标题 */
--text-3xl:  1.875rem;  /* 30px - 大标题 */
--text-4xl:  2.25rem;   /* 36px - 数据展示 */
--text-5xl:  3rem;      /* 48px - 特大数字 */
```

#### 字重系统 (Font Weight)
```css
--font-normal:    400;  /* 正文 */
--font-medium:    500;  /* 次要标题、强调 */
--font-semibold:  600;  /* 标题、按钮 */
--font-bold:      700;  /* 重要标题 */
```

#### 行高系统 (Line Height)
```css
--leading-none:    1;     /* 数字、标题 */
--leading-tight:   1.25;  /* 紧凑文本 */
--leading-snug:    1.375; /* 标题 */
--leading-normal:  1.5;   /* 正文 */
--leading-relaxed: 1.625; /* 宽松文本 */
--leading-loose:   2;     /* 特殊用途 */
```

#### 字体使用规范

| 元素 | 字号 | 字重 | 行高 | 颜色 |
|-----|------|------|------|------|
| 页面大标题 | 2xl | semibold | tight | gray-900 |
| 页面副标题 | lg | normal | normal | gray-600 |
| 卡片标题 | xl | semibold | tight | gray-900 |
| 正文 | base | normal | normal | gray-700 |
| 辅助说明 | sm | normal | relaxed | gray-500 |
| 标签 | xs | medium | none | gray-600 |
| 数据数字 | 4xl | bold | none | gray-900 |
| 按钮文字 | sm | medium | none | white |
| 代码/密钥 | sm | normal | normal | mono |

### 2.3 间距系统 (Spacing)

#### 基础间距单位
```css
/* 8px基础网格系统 */
--spacing-0:   0;
--spacing-1:   0.25rem;  /* 4px */
--spacing-2:   0.5rem;   /* 8px */
--spacing-3:   0.75rem;  /* 12px */
--spacing-4:   1rem;     /* 16px */
--spacing-5:   1.25rem;  /* 20px */
--spacing-6:   1.5rem;   /* 24px */
--spacing-8:   2rem;     /* 32px */
--spacing-10:  2.5rem;   /* 40px */
--spacing-12:  3rem;     /* 48px */
--spacing-16:  4rem;     /* 64px */
--spacing-20:  5rem;     /* 80px */
--spacing-24:  6rem;     /* 96px */
```

#### 间距使用规范

| 场景 | 间距值 | 说明 |
|-----|--------|------|
| 行内元素间距 | 2 (8px) | 图标与文字 |
| 小组件内边距 | 3 (12px) | 按钮、标签 |
| 卡片内边距 | 6 (24px) | 卡片内容区 |
| 组件间距 | 4 (16px) | 表单字段间 |
| 区块间距 | 8 (32px) | 功能区块间 |
| 页面边距 | 6-8 (24-32px) | 页面左右边距 |
| 栏间距 | 6 (24px) | 多栏布局 |

### 2.4 圆角系统 (Border Radius)

```css
--radius-none: 0;
--radius-sm:   0.25rem;  /* 4px - 小元素 */
--radius-md:   0.375rem; /* 6px - 按钮、输入框 */
--radius-lg:   0.5rem;   /* 8px - 卡片 */
--radius-xl:   0.75rem;  /* 12px - 模态框 */
--radius-2xl:  1rem;     /* 16px - 大容器 */
--radius-full: 9999px;   /* 圆形 - 头像、徽章 */
```

### 2.5 阴影系统 (Shadows)

```css
/* 层级阴影 - 创建深度感 */
--shadow-xs:  0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm:  0 1px 3px 0 rgba(0, 0, 0, 0.1),
              0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* 特殊阴影 */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
--shadow-focus: 0 0 0 3px rgba(59, 130, 246, 0.5);
```

#### 阴影使用规范

| 元素 | 阴影 | 说明 |
|-----|------|------|
| 卡片 | sm | 轻微浮起 |
| 悬停卡片 | md | 中度浮起 |
| 下拉菜单 | lg | 明显浮起 |
| 模态框 | xl | 强调层级 |
| 按钮悬停 | md | 交互反馈 |
| 输入框聚焦 | focus | 焦点提示 |

---

## 三、组件设计规范

### 3.1 按钮 (Button)

#### 按钮变体

```tsx
// 主按钮 - 主要操作
<Button variant="primary">创建密钥</Button>
样式: bg-primary-500 hover:bg-primary-600 text-white shadow-sm

// 次按钮 - 次要操作
<Button variant="secondary">取消</Button>
样式: bg-white hover:bg-gray-50 text-gray-700 border border-gray-300

// 幽灵按钮 - 弱化操作
<Button variant="ghost">查看详情</Button>
样式: bg-transparent hover:bg-gray-100 text-gray-700

// 危险按钮 - 危险操作
<Button variant="danger">删除</Button>
样式: bg-error-500 hover:bg-error-600 text-white

// 文字按钮 - 最弱操作
<Button variant="text">了解更多</Button>
样式: bg-transparent hover:underline text-primary-500
```

#### 按钮尺寸

```tsx
// 小按钮
<Button size="sm">小按钮</Button>
样式: px-3 py-1.5 text-sm

// 中按钮（默认）
<Button size="md">中按钮</Button>
样式: px-4 py-2 text-base

// 大按钮
<Button size="lg">大按钮</Button>
样式: px-6 py-3 text-lg
```

#### 按钮状态

```tsx
// 加载状态
<Button loading={true}>
  <Spinner className="mr-2" />
  创建中...
</Button>

// 禁用状态
<Button disabled={true}>已禁用</Button>
样式: opacity-50 cursor-not-allowed

// 图标按钮
<Button>
  <PlusIcon className="mr-2 h-4 w-4" />
  创建密钥
</Button>
```

#### 按钮组

```tsx
<ButtonGroup>
  <Button>今天</Button>
  <Button>7天</Button>
  <Button>30天</Button>
</ButtonGroup>
样式: 相邻按钮共享边框，首尾圆角
```

### 3.2 输入框 (Input)

#### 基础输入框

```tsx
<Input
  type="text"
  placeholder="请输入密钥名称"
  value={value}
  onChange={setValue}
/>

样式:
- 边框: border border-gray-300
- 圆角: rounded-md
- 内边距: px-3 py-2
- 聚焦: ring-2 ring-primary-500 border-primary-500
- 错误: border-error-500 ring-error-500
```

#### 输入框变体

```tsx
// 带标签
<FormField>
  <Label>密钥名称</Label>
  <Input placeholder="输入名称" />
</FormField>

// 带图标
<Input
  icon={<SearchIcon />}
  placeholder="搜索..."
/>

// 带清除按钮
<Input
  clearable={true}
  onClear={() => setValue('')}
/>

// 密码输入
<Input
  type="password"
  showPasswordToggle={true}
/>

// 带验证
<Input
  value={value}
  error={error}
  helperText="密钥名称必须唯一"
/>
```

#### 输入框尺寸

```tsx
<Input size="sm" />   // 小 py-1.5
<Input size="md" />   // 中 py-2 (默认)
<Input size="lg" />   // 大 py-3
```

### 3.3 下拉选择 (Select)

```tsx
<Select
  value={selected}
  onChange={setSelected}
  placeholder="选择平台"
>
  <SelectOption value="macos">macOS</SelectOption>
  <SelectOption value="linux">Linux</SelectOption>
  <SelectOption value="windows">Windows</SelectOption>
</Select>

样式:
- 触发器: 与Input相同
- 下拉框: bg-white shadow-lg rounded-md border
- 选项: px-3 py-2 hover:bg-gray-100
- 选中: bg-primary-50 text-primary-700
```

#### 多选下拉

```tsx
<Select multiple={true}>
  <SelectOption value="sonnet">Claude 3.5 Sonnet</SelectOption>
  <SelectOption value="haiku">Claude 3 Haiku</SelectOption>
  <SelectOption value="opus">Claude 3 Opus</SelectOption>
</Select>

// 显示已选标签
<div className="flex gap-2">
  {selected.map(item => (
    <Badge key={item} onRemove={() => remove(item)}>
      {item}
    </Badge>
  ))}
</div>
```

### 3.4 卡片 (Card)

```tsx
<Card>
  <CardHeader>
    <CardTitle>API密钥统计</CardTitle>
    <CardDescription>查看密钥使用情况</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 内容 */}
  </CardContent>
  <CardFooter>
    <Button>查看详情</Button>
  </CardFooter>
</Card>

样式:
- 背景: bg-white (dark: bg-gray-800)
- 边框: border border-gray-200
- 圆角: rounded-lg
- 阴影: shadow-sm hover:shadow-md
- 内边距: p-6
```

#### 卡片变体

```tsx
// 统计卡片
<StatCard
  title="总密钥数"
  value={8}
  change={+2}
  trend="up"
  icon={<KeyIcon />}
/>

// 可点击卡片
<Card clickable={true} onClick={handleClick}>
  样式: cursor-pointer hover:shadow-md
</Card>

// 高亮卡片
<Card highlighted={true}>
  样式: border-primary-500 bg-primary-50
</Card>
```

### 3.5 表格 (Table)

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead sortable={true} onSort={handleSort}>
        名称
      </TableHead>
      <TableHead>状态</TableHead>
      <TableHead align="right">操作</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Production Key</TableCell>
      <TableCell>
        <Badge variant="success">活跃</Badge>
      </TableCell>
      <TableCell align="right">
        <DropdownMenu />
      </TableCell>
    </TableRow>
  </TableBody>
</Table>

样式:
- 表头: bg-gray-50 font-semibold text-gray-700
- 行: border-b hover:bg-gray-50
- 单元格: px-6 py-4
- 斑马纹: even:bg-gray-50 (可选)
```

#### 表格特性

```tsx
// 可选择行
<TableRow selectable={true}>
  <TableCell>
    <Checkbox checked={selected} onChange={toggle} />
  </TableCell>
</TableRow>

// 可展开行
<TableRow expandable={true}>
  <TableCell colSpan={5}>
    {/* 展开内容 */}
  </TableCell>
</TableRow>

// 固定列
<TableHead sticky={true}>操作</TableHead>
样式: sticky right-0 bg-white shadow-sm
```

### 3.6 模态框 (Modal)

```tsx
<Modal
  open={isOpen}
  onClose={handleClose}
  size="md"  // sm, md, lg, xl, full
>
  <ModalHeader>
    <ModalTitle>创建API密钥</ModalTitle>
    <ModalClose />
  </ModalHeader>
  <ModalContent>
    {/* 表单内容 */}
  </ModalContent>
  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>
      取消
    </Button>
    <Button variant="primary" onClick={onCreate}>
      创建
    </Button>
  </ModalFooter>
</Modal>

样式:
- 遮罩: bg-black/50 backdrop-blur-sm
- 容器: bg-white rounded-xl shadow-2xl
- 动画: fade + scale-up
- 关闭: ESC键或点击遮罩
```

### 3.7 提示框 (Toast)

```tsx
// 成功提示
toast.success('密钥创建成功', {
  duration: 3000,
  position: 'top-right'
});

// 错误提示
toast.error('创建失败，请重试', {
  duration: 5000,
  action: {
    label: '重试',
    onClick: handleRetry
  }
});

// 加载提示
const toastId = toast.loading('创建中...');
// 完成后更新
toast.success('创建成功', { id: toastId });

样式:
- 容器: bg-white shadow-lg rounded-md border-l-4
- 成功: border-success-500
- 错误: border-error-500
- 警告: border-warning-500
- 动画: slide-in from right
```

### 3.8 徽章 (Badge)

```tsx
// 状态徽章
<Badge variant="success">活跃</Badge>
<Badge variant="warning">即将过期</Badge>
<Badge variant="error">已禁用</Badge>
<Badge variant="info">测试</Badge>

// 数字徽章
<Badge count={5} max={99}>
  <BellIcon />
</Badge>

// 标签徽章
<Badge removable={true} onRemove={handleRemove}>
  production
</Badge>

样式:
- 小徽章: px-2 py-0.5 text-xs rounded-full
- 点徽章: w-2 h-2 rounded-full (无文字)
- 数字徽章: absolute -top-1 -right-1
```

### 3.9 标签页 (Tabs)

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">概览</TabsTrigger>
    <TabsTrigger value="usage">使用统计</TabsTrigger>
    <TabsTrigger value="logs">调用日志</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    {/* 概览内容 */}
  </TabsContent>
  <TabsContent value="usage">
    {/* 统计内容 */}
  </TabsContent>
</Tabs>

样式:
- 触发器: px-4 py-2 hover:bg-gray-100
- 选中: border-b-2 border-primary-500 text-primary-700
- 内容: pt-4
```

### 3.10 骨架屏 (Skeleton)

```tsx
// 文本骨架
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />

// 卡片骨架
<Card>
  <Skeleton className="h-6 w-1/3 mb-4" />
  <Skeleton className="h-4 w-full mb-2" />
  <Skeleton className="h-4 w-2/3" />
</Card>

// 表格骨架
<Table>
  {[...Array(5)].map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4" /></TableCell>
      <TableCell><Skeleton className="h-4" /></TableCell>
    </TableRow>
  ))}
</Table>

样式:
- 背景: bg-gray-200 (dark: bg-gray-700)
- 动画: animate-pulse
```

---

## 四、布局设计规范

### 4.1 整体布局

```
┌────────────────────────────────────────────────────┐
│                    Header (64px)                    │
│  Logo + Navigation + Search + User                 │
├──────────┬─────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │           Main Content                  │
│ (240px)  │                                          │
│          │  ┌────────────────────────────────┐    │
│  Nav     │  │        Page Content            │    │
│  Items   │  │                                │    │
│          │  │  ┌──────────┐  ┌──────────┐  │    │
│          │  │  │  Card    │  │  Card    │  │    │
│          │  │  └──────────┘  └──────────┘  │    │
│          │  │                                │    │
│          │  └────────────────────────────────┘    │
│          │                                          │
└──────────┴─────────────────────────────────────────┘
```

#### 响应式断点布局

```tsx
// 桌面 (≥1024px)
- Header: 固定顶部
- Sidebar: 固定左侧，240px宽
- Content: flex-1，最大1280px居中

// 平板 (768px - 1023px)
- Header: 固定顶部
- Sidebar: 可折叠，默认显示
- Content: 自适应宽度

// 移动 (< 768px)
- Header: 固定顶部，简化版
- Sidebar: 抽屉式，默认隐藏
- Content: 全宽，取消左右边距
```

### 4.2 网格系统

```css
/* 12列网格系统 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}

/* 常用布局 */
.col-span-3  { grid-column: span 3; }  /* 1/4 */
.col-span-4  { grid-column: span 4; }  /* 1/3 */
.col-span-6  { grid-column: span 6; }  /* 1/2 */
.col-span-8  { grid-column: span 8; }  /* 2/3 */
.col-span-12 { grid-column: span 12; } /* 全宽 */

/* 响应式网格 */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}
```

### 4.3 容器宽度

```css
/* 最大宽度限制 */
.container-sm  { max-width: 640px; }   /* 小容器 */
.container-md  { max-width: 768px; }   /* 中容器 */
.container-lg  { max-width: 1024px; }  /* 大容器 */
.container-xl  { max-width: 1280px; }  /* 超大容器 */
.container-2xl { max-width: 1536px; }  /* 最大容器 */

/* 内容区默认 */
.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}
```

---

## 五、交互设计规范

### 5.1 动画时长

```css
/* 标准时长 */
--duration-fast:   150ms;  /* 快速 - hover, focus */
--duration-normal: 300ms;  /* 标准 - modal, drawer */
--duration-slow:   500ms;  /* 慢速 - page transition */

/* 缓动函数 */
--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 5.2 悬停效果

```css
/* 按钮悬停 */
.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-fast) var(--ease-out);
}

/* 卡片悬停 */
.card:hover {
  box-shadow: var(--shadow-lg);
  transform: scale(1.02);
  transition: all var(--duration-normal) var(--ease-out);
}

/* 链接悬停 */
.link:hover {
  color: var(--color-primary-600);
  text-decoration: underline;
}
```

### 5.3 点击反馈

```css
/* 按钮点击 */
.button:active {
  transform: scale(0.98);
  transition: transform var(--duration-fast);
}

/* 涟漪效果 */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: ripple 600ms ease-out;
}
```

### 5.4 加载状态

```tsx
// Spinner
<Spinner size="sm" />  // 16px
<Spinner size="md" />  // 24px
<Spinner size="lg" />  // 32px

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Progress Bar
<ProgressBar value={60} max={100} />
样式: h-2 bg-gray-200 rounded-full
     inner: bg-primary-500 transition-all

// Skeleton
<Skeleton />
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 5.5 页面过渡

```tsx
// 路由切换动画
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### 5.6 微交互

```css
/* 复选框选中动画 */
@keyframes checkmark {
  0% {
    stroke-dashoffset: 16;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

/* 数字滚动动画 */
@keyframes countUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* 消息淡入淡出 */
@keyframes toast-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## 六、图标系统

### 6.1 图标库选择

使用 **Heroicons v2** - 由Tailwind CSS团队设计

```bash
npm install @heroicons/react
```

```tsx
import {
  HomeIcon,
  KeyIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

// 实心图标
import { KeyIcon as KeyIconSolid } from '@heroicons/react/24/solid';
```

### 6.2 图标尺寸

```tsx
<Icon className="h-4 w-4" />   // 16px - 小图标，按钮内
<Icon className="h-5 w-5" />   // 20px - 标准，导航栏
<Icon className="h-6 w-6" />   // 24px - 大图标，页面标题
<Icon className="h-8 w-8" />   // 32px - 特大，空状态
```

### 6.3 常用图标映射

| 功能 | 图标 | 使用场景 |
|-----|------|---------|
| 首页 | HomeIcon | 导航 - 仪表板 |
| 密钥 | KeyIcon | 导航 - 密钥管理 |
| 统计 | ChartBarIcon | 导航 - 使用统计 |
| 下载 | ArrowDownTrayIcon | 按钮 - 下载脚本 |
| 设置 | Cog6ToothIcon | 导航 - 设置 |
| 搜索 | MagnifyingGlassIcon | 搜索框 |
| 通知 | BellIcon | 顶栏 - 通知中心 |
| 用户 | UserIcon | 顶栏 - 用户菜单 |
| 添加 | PlusIcon | 按钮 - 创建 |
| 编辑 | PencilIcon | 操作 - 编辑 |
| 删除 | TrashIcon | 操作 - 删除 |
| 更多 | EllipsisHorizontalIcon | 操作菜单 |
| 关闭 | XMarkIcon | 关闭按钮 |
| 成功 | CheckCircleIcon | 状态 - 成功 |
| 错误 | XCircleIcon | 状态 - 错误 |
| 警告 | ExclamationTriangleIcon | 状态 - 警告 |
| 信息 | InformationCircleIcon | 状态 - 信息 |

---

## 七、数据可视化规范

### 7.1 图表色彩

```css
/* 主题色板 - 用于多系列数据 */
--chart-1: #3b82f6;  /* 蓝色 */
--chart-2: #10b981;  /* 绿色 */
--chart-3: #f59e0b;  /* 橙色 */
--chart-4: #ef4444;  /* 红色 */
--chart-5: #8b5cf6;  /* 紫色 */
--chart-6: #ec4899;  /* 粉色 */
--chart-7: #06b6d4;  /* 青色 */

/* 渐变色 - 用于热力图、区域图 */
--gradient-blue: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
--gradient-green: linear-gradient(180deg, #10b981 0%, #059669 100%);
```

### 7.2 图表样式

```tsx
// Recharts配置
const chartConfig = {
  // 坐标轴
  axisLine: { stroke: '#e5e7eb' },
  axisLabel: {
    fill: '#6b7280',
    fontSize: 12
  },

  // 网格线
  grid: {
    stroke: '#f3f4f6',
    strokeDasharray: '3 3'
  },

  // 工具提示
  tooltip: {
    contentStyle: {
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  },

  // 图例
  legend: {
    iconType: 'circle',
    wrapperStyle: {
      paddingTop: '1rem'
    }
  }
};
```

### 7.3 空状态设计

```tsx
<EmptyState
  icon={<ChartBarIcon className="h-12 w-12 text-gray-400" />}
  title="暂无数据"
  description="开始使用API密钥后，这里将显示统计数据"
  action={
    <Button onClick={createKey}>
      <PlusIcon className="mr-2 h-4 w-4" />
      创建第一个密钥
    </Button>
  }
/>

样式:
- 容器: text-center py-12
- 图标: text-gray-400 mb-4
- 标题: text-lg font-semibold text-gray-900
- 描述: text-sm text-gray-500 mt-2
```

---

## 八、无障碍访问 (Accessibility)

### 8.1 ARIA标签

```tsx
// 按钮
<button
  aria-label="创建新密钥"
  aria-describedby="create-key-desc"
>
  <PlusIcon />
</button>

// 输入框
<input
  aria-label="搜索密钥"
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-msg" : "helper-text"}
/>

// 模态框
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">创建密钥</h2>
</div>
```

### 8.2 键盘导航

```tsx
// Tab顺序
tabIndex={0}  // 可聚焦
tabIndex={-1} // 跳过

// 键盘事件
onKeyDown={(e) => {
  if (e.key === 'Enter') handleSubmit();
  if (e.key === 'Escape') handleClose();
  if (e.key === 'ArrowDown') moveNext();
  if (e.key === 'ArrowUp') movePrev();
}}

// 焦点管理
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

### 8.3 屏幕阅读器

```tsx
// 隐藏装饰性内容
<div aria-hidden="true">
  <DecorativeIcon />
</div>

// 实时更新通知
<div role="status" aria-live="polite">
  密钥已创建
</div>

// 忙碌状态
<button aria-busy="true">
  <Spinner /> 加载中...
</button>
```

---

## 九、深色模式 (Dark Mode)

### 9.1 深色模式色彩

```css
/* 深色模式色彩系统 */
:root[data-theme="dark"] {
  /* 背景色 */
  --color-bg-primary: #111827;   /* 主背景 */
  --color-bg-secondary: #1f2937; /* 卡片背景 */
  --color-bg-tertiary: #374151;  /* 悬停背景 */

  /* 文字色 */
  --color-text-primary: #f9fafb;   /* 主文字 */
  --color-text-secondary: #e5e7eb; /* 次要文字 */
  --color-text-tertiary: #9ca3af;  /* 辅助文字 */

  /* 边框色 */
  --color-border: #374151;

  /* 阴影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
}
```

### 9.2 组件适配

```tsx
// 卡片
<Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">

// 文字
<p className="text-gray-900 dark:text-gray-100">

// 按钮
<Button className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700">

// 输入框
<Input className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
```

### 9.3 切换开关

```tsx
<ThemeToggle>
  {theme === 'light' ? (
    <MoonIcon className="h-5 w-5" />
  ) : (
    <SunIcon className="h-5 w-5" />
  )}
</ThemeToggle>

位置: Header右侧，用户菜单旁
```

---

## 十、响应式设计

### 10.1 移动端优化

```tsx
// 隐藏桌面内容
<div className="hidden md:block">
  {/* 桌面版 */}
</div>

// 显示移动内容
<div className="block md:hidden">
  {/* 移动版 */}
</div>

// 响应式网格
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 卡片 */}
</div>

// 响应式字号
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  标题
</h1>
```

### 10.2 触摸优化

```css
/* 增大触摸目标 */
.touch-target {
  min-height: 44px;  /* iOS推荐 */
  min-width: 44px;
}

/* 移除点击高亮 */
button {
  -webkit-tap-highlight-color: transparent;
}

/* 滚动优化 */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

---

## 十一、设计交付物

### 11.1 组件库文档

创建 Storybook 展示所有组件：

```bash
npm install --save-dev @storybook/react @storybook/addon-essentials
npx storybook@latest init
```

### 11.2 设计 Token 导出

```typescript
// design-tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      // ...
    },
    // ...
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    // ...
  },
  // ...
};
```

### 11.3 Figma 设计文件

包含：
- 完整色彩系统
- 字体样式库
- 组件库（所有状态）
- 页面模板
- 图标库
- 响应式布局示例

---

## 十二、开发指南

### 12.1 Tailwind CSS 配置

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          // ... 完整色阶
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        'focus': '0 0 0 3px rgba(59, 130, 246, 0.5)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### 12.2 CSS 变量使用

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 59 130 246;  /* RGB值 */
    --radius: 0.5rem;
  }

  :root[data-theme="dark"] {
    --color-bg-primary: 17 24 39;
  }
}

/* 使用 */
.custom-class {
  background-color: rgb(var(--color-primary) / 0.1);
  border-radius: var(--radius);
}
```

---

**版本**: v1.0.0
**更新时间**: 2025-01-01
**设计工具**: Figma, Tailwind CSS, Shadcn/ui
**适用平台**: Web (Desktop + Mobile)
