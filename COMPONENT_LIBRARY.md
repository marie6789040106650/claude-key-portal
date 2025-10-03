# Claude Key Portal - 组件库实现指南

## 一、Shadcn/ui 组件安装清单

### 1.1 初始化配置

```bash
# 初始化 Shadcn/ui
npx shadcn-ui@latest init

# 选择配置
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Would you like to use CSS variables for colors? › yes
```

### 1.2 必需组件安装

```bash
# 基础表单组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch

# 反馈组件
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton

# 布局组件
npx shadcn-ui@latest add card
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add popover

# 数据展示
npx shadcn-ui@latest add table
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add accordion

# 导航组件
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add breadcrumb
npx shadcn-ui@latest add pagination
```

---

## 二、自定义组件实现

### 2.1 StatCard - 统计卡片

```tsx
// components/ui/stat-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  description?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  description,
  className
}: StatCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-gray-400" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">
          {value}
        </div>
        {change !== undefined && (
          <div className={cn('mt-1 flex items-center text-sm', getTrendColor())}>
            <span className="mr-1">{getTrendIcon()}</span>
            <span>{Math.abs(change)}%</span>
            <span className="ml-1 text-gray-500">vs 上周期</span>
          </div>
        )}
        {description && (
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

**使用示例**:
```tsx
import { KeyIcon } from 'lucide-react';

<StatCard
  title="总密钥数"
  value={8}
  change={25}
  trend="up"
  icon={KeyIcon}
  description="活跃密钥: 6"
/>
```

---

### 2.2 KeyStatusBadge - 密钥状态徽章

```tsx
// components/ui/key-status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type KeyStatus = 'active' | 'inactive' | 'expired' | 'expiring_soon';

interface KeyStatusBadgeProps {
  status: KeyStatus;
  className?: string;
}

const statusConfig = {
  active: {
    label: '活跃',
    variant: 'success' as const,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  inactive: {
    label: '禁用',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  expired: {
    label: '已过期',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  expiring_soon: {
    label: '即将过期',
    variant: 'warning' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
};

export function KeyStatusBadge({ status, className }: KeyStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'border font-medium',
        config.className,
        className
      )}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
}
```

**使用示例**:
```tsx
<KeyStatusBadge status="active" />
<KeyStatusBadge status="expired" />
```

---

### 2.3 EmptyState - 空状态

```tsx
// components/ui/empty-state.tsx
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

**使用示例**:
```tsx
import { KeyIcon } from 'lucide-react';

<EmptyState
  icon={KeyIcon}
  title="暂无API密钥"
  description="创建您的第一个API密钥以开始使用服务"
  action={{
    label: '创建密钥',
    onClick: () => router.push('/keys/new')
  }}
/>
```

---

### 2.4 CopyButton - 复制按钮

```tsx
// components/ui/copy-button.tsx
'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = '复制' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        title: '已复制',
        description: '内容已复制到剪贴板'
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: '复制失败',
        description: '请手动复制内容',
        variant: 'destructive'
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          已复制
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
```

**使用示例**:
```tsx
<div className="flex items-center gap-2">
  <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
    cr_abc123def456xyz
  </code>
  <CopyButton value="cr_abc123def456xyz" />
</div>
```

---

### 2.5 CodeBlock - 代码块

```tsx
// components/ui/code-block.tsx
'use client';

import { CopyButton } from '@/components/ui/copy-button';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  filename?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'bash',
  showLineNumbers = false,
  filename,
  className
}: CodeBlockProps) {
  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      {filename && (
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
          <span className="text-sm font-medium text-gray-700">
            {filename}
          </span>
          <CopyButton value={code} label="复制代码" />
        </div>
      )}
      <div className="relative">
        {!filename && (
          <div className="absolute right-2 top-2 z-10">
            <CopyButton value={code} />
          </div>
        )}
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            padding: '1rem'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
```

**使用示例**:
```tsx
const installScript = `#!/bin/bash
API_KEY="cr_abc123..."
BASE_URL="https://claude.just-play.fun"

mkdir -p ~/.config/claude-code
cat > ~/.config/claude-code/config.json <<EOF
{
  "apiKey": "$API_KEY",
  "baseURL": "$BASE_URL"
}
EOF`;

<CodeBlock
  code={installScript}
  language="bash"
  filename="install.sh"
  showLineNumbers={true}
/>
```

---

### 2.6 DataTable - 数据表格

```tsx
// components/ui/data-table.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    }
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      className={cn(
                        header.column.getCanSort() &&
                        'flex cursor-pointer select-none items-center gap-2 hover:text-gray-900'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <div className="flex flex-col">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

**使用示例**:
```tsx
const columns: ColumnDef<Key>[] = [
  {
    accessorKey: 'name',
    header: '名称',
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => <KeyStatusBadge status={row.getValue('status')} />
  },
  {
    accessorKey: 'usage',
    header: '今日调用',
    cell: ({ row }) => <div>{row.getValue('usage')}</div>
  }
];

<DataTable columns={columns} data={keys} />
```

---

### 2.7 SearchInput - 搜索输入框

```tsx
// components/ui/search-input.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = '搜索...',
  onSearch,
  debounceMs = 500,
  className
}: SearchInputProps) {
  const [value, setValue] = useState('');

  const debouncedSearch = useDebouncedCallback((searchValue: string) => {
    onSearch(searchValue);
  }, debounceMs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn('pl-9 pr-9', className)}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

---

### 2.8 LoadingButton - 加载按钮

```tsx
// components/ui/loading-button.tsx
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export function LoadingButton({
  loading = false,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
```

---

## 三、图表组件封装

### 3.1 安装 Recharts

```bash
npm install recharts
```

### 3.2 LineChart - 折线图

```tsx
// components/charts/line-chart.tsx
'use client';

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface LineChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  lines: Array<{
    key: string;
    color: string;
    name: string;
  }>;
  height?: number;
}

export function LineChart({ data, xKey, lines, height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey={xKey}
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            name={line.name}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
```

**使用示例**:
```tsx
const chartData = [
  { date: '01-01', calls: 1200, errors: 20 },
  { date: '01-02', calls: 1400, errors: 15 },
  { date: '01-03', calls: 1600, errors: 10 }
];

<LineChart
  data={chartData}
  xKey="date"
  lines={[
    { key: 'calls', color: '#3b82f6', name: '调用数' },
    { key: 'errors', color: '#ef4444', name: '错误数' }
  ]}
  height={350}
/>
```

---

### 3.3 PieChart - 饼图

```tsx
// components/charts/pie-chart.tsx
'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899'
];

export function PieChart({
  data,
  colors = DEFAULT_COLORS,
  height = 300
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
```

---

## 四、布局组件

### 4.1 DashboardLayout - 仪表板布局

```tsx
// components/layout/dashboard-layout.tsx
'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-6 lg:ml-64">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

---

### 4.2 Sidebar - 侧边栏

```tsx
// components/layout/sidebar.tsx
'use client';

import { cn } from '@/lib/utils';
import {
  Home,
  Key,
  BarChart3,
  Download,
  Settings,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: '仪表板', href: '/', icon: Home },
  { name: '密钥管理', href: '/keys', icon: Key },
  { name: '使用统计', href: '/usage', icon: BarChart3 },
  { name: '安装指导', href: '/install', icon: Download },
  { name: '设置', href: '/settings', icon: Settings }
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* 移动端遮罩 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <span className="text-xl font-bold text-gray-900">
            Claude Portal
          </span>
          <button
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 导航 */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
```

---

### 4.3 Header - 顶部栏

```tsx
// components/layout/header.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  LogOut
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* 左侧 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* 搜索框（桌面端） */}
          <div className="hidden md:block">
            <SearchInput
              placeholder="搜索密钥..."
              onSearch={(value) => console.log(value)}
            />
          </div>
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-2">
          {/* 主题切换 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* 通知 */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar.jpg" />
                  <AvatarFallback>张三</AvatarFallback>
                </Avatar>
                <span className="hidden md:block">张三</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                个人信息
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
```

---

## 五、Hooks 工具库

### 5.1 useDebounce

```tsx
// hooks/use-debounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

### 5.2 useMediaQuery

```tsx
// hooks/use-media-query.ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// 使用
const isMobile = useMediaQuery('(max-width: 768px)');
```

---

### 5.3 useLocalStorage

```tsx
// hooks/use-local-storage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
```

---

## 六、组件使用示例

### 6.1 完整的密钥列表页面

```tsx
// app/(dashboard)/keys/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { KeyStatusBadge } from '@/components/ui/key-status-badge';
import { SearchInput } from '@/components/ui/search-input';
import { Plus, Key } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KeysPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const columns = [
    {
      accessorKey: 'name',
      header: '名称'
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => (
        <KeyStatusBadge status={row.getValue('status')} />
      )
    },
    {
      accessorKey: 'todayCalls',
      header: '今日调用'
    }
  ];

  const keys = []; // 从API获取

  if (keys.length === 0) {
    return (
      <EmptyState
        icon={Key}
        title="暂无API密钥"
        description="创建您的第一个API密钥以开始使用服务"
        action={{
          label: '创建密钥',
          onClick: () => router.push('/keys/new')
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">密钥管理</h1>
        <Button onClick={() => router.push('/keys/new')}>
          <Plus className="mr-2 h-4 w-4" />
          创建密钥
        </Button>
      </div>

      <div className="flex gap-4">
        <SearchInput
          placeholder="搜索密钥..."
          onSearch={setSearchQuery}
        />
      </div>

      <DataTable columns={columns} data={keys} />
    </div>
  );
}
```

---

### 6.2 完整的仪表板页面

```tsx
// app/(dashboard)/page.tsx
'use client';

import { StatCard } from '@/components/ui/stat-card';
import { LineChart } from '@/components/charts/line-chart';
import { PieChart } from '@/components/charts/pie-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  KeyIcon,
  ActivityIcon,
  CoinsIcon,
  AlertCircleIcon,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  // 模拟数据
  const stats = {
    totalKeys: 8,
    todayCalls: 1542,
    todayTokens: 154200,
    errorRate: 0.5
  };

  const trendData = [
    { date: '12-25', calls: 1200, tokens: 120000 },
    { date: '12-26', calls: 1350, tokens: 135000 },
    { date: '12-27', calls: 1400, tokens: 140000 },
    { date: '12-28', calls: 1300, tokens: 130000 },
    { date: '12-29', calls: 1500, tokens: 150000 },
    { date: '12-30', calls: 1600, tokens: 160000 },
    { date: '12-31', calls: 1542, tokens: 154200 }
  ];

  const modelDistribution = [
    { name: 'Claude 3.5 Sonnet', value: 65 },
    { name: 'Claude 3 Opus', value: 25 },
    { name: 'Claude 3 Haiku', value: 10 }
  ];

  const topKeys = [
    { id: '1', name: '开发环境', calls: 542, status: 'active' },
    { id: '2', name: '测试环境', calls: 387, status: 'active' },
    { id: '3', name: '生产环境', calls: 613, status: 'active' }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">仪表板</h1>
          <p className="mt-1 text-sm text-gray-500">
            实时监控您的API密钥使用情况
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => router.push('/keys/new')}>
            <Plus className="mr-2 h-4 w-4" />
            创建密钥
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总密钥数"
          value={stats.totalKeys}
          change={25}
          trend="up"
          icon={KeyIcon}
          description="活跃密钥: 6"
        />
        <StatCard
          title="今日调用"
          value={stats.todayCalls.toLocaleString()}
          change={12.5}
          trend="up"
          icon={ActivityIcon}
        />
        <StatCard
          title="今日Token"
          value={`${(stats.todayTokens / 1000).toFixed(1)}K`}
          change={8.3}
          trend="up"
          icon={CoinsIcon}
        />
        <StatCard
          title="错误率"
          value={`${stats.errorRate}%`}
          change={-15}
          trend="down"
          icon={AlertCircleIcon}
        />
      </div>

      {/* 图表 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 调用趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>调用趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={trendData}
              xKey="date"
              lines={[
                { key: 'calls', color: '#3b82f6', name: '调用数' },
                { key: 'tokens', color: '#10b981', name: 'Token数' }
              ]}
              height={300}
            />
          </CardContent>
        </Card>

        {/* 模型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>模型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={modelDistribution}
              colors={['#3b82f6', '#10b981', '#f59e0b']}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top密钥排行 */}
      <Card>
        <CardHeader>
          <CardTitle>Top 密钥排行</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topKeys.map((key, index) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-gray-500">
                      {key.calls} 次调用
                    </div>
                  </div>
                </div>
                <Badge variant="success">活跃</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 6.3 完整的密钥详情页面

```tsx
// app/(dashboard)/keys/[id]/page.tsx
'use client';

import { KeyStatusBadge } from '@/components/ui/key-status-badge';
import { CopyButton } from '@/components/ui/copy-button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/charts/line-chart';
import { PieChart } from '@/components/charts/pie-chart';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Trash2, Edit, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function KeyDetailPage({ params }: { params: { id: string } }) {
  const [isDeleting, setIsDeleting] = useState(false);

  // 模拟数据
  const keyData = {
    id: params.id,
    name: '开发环境',
    key: 'cr_abc123def456xyz',
    status: 'active',
    createdAt: '2024-01-01',
    expiresAt: '2024-12-31',
    todayCalls: 542,
    todayTokens: 54200,
    errorRate: 0.3,
    modelRestrictions: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    rateLimit: 100,
    usageTrend: [
      { date: '12-25', calls: 400, errors: 2 },
      { date: '12-26', calls: 450, errors: 1 },
      { date: '12-27', calls: 500, errors: 3 },
      { date: '12-28', calls: 480, errors: 2 },
      { date: '12-29', calls: 520, errors: 1 },
      { date: '12-30', calls: 550, errors: 2 },
      { date: '12-31', calls: 542, errors: 1 }
    ],
    modelUsage: [
      { name: 'claude-3-5-sonnet', value: 70 },
      { name: 'claude-3-opus', value: 30 }
    ]
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    // 调用删除API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsDeleting(false);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{keyData.name}</h1>
            <KeyStatusBadge status={keyData.status as any} />
          </div>
          <p className="text-sm text-gray-500">
            创建于 {keyData.createdAt}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Edit className="mr-2 h-4 w-4" />
            编辑
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除密钥？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作无法撤销。删除后，使用此密钥的所有应用将无法访问API。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? '删除中...' : '确认删除'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* 密钥信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>密钥信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">API密钥</div>
              <code className="mt-1 font-mono text-sm">{keyData.key}</code>
            </div>
            <CopyButton value={keyData.key} />
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-gray-500">过期时间</div>
              <div className="mt-1">{keyData.expiresAt}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">速率限制</div>
              <div className="mt-1">{keyData.rateLimit} 次/分钟</div>
            </div>
          </div>
          <Separator />
          <div>
            <div className="text-sm font-medium text-gray-500">模型限制</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {keyData.modelRestrictions.map((model) => (
                <Badge key={model} variant="secondary">
                  {model}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用统计 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              今日调用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{keyData.todayCalls}</div>
            <div className="mt-1 text-sm text-green-600">↑ 8.5% vs 昨天</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              今日Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(keyData.todayTokens / 1000).toFixed(1)}K
            </div>
            <div className="mt-1 text-sm text-green-600">↑ 12.3% vs 昨天</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              错误率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{keyData.errorRate}%</div>
            <div className="mt-1 text-sm text-green-600">↓ 0.2% vs 昨天</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>使用趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={keyData.usageTrend}
              xKey="date"
              lines={[
                { key: 'calls', color: '#3b82f6', name: '调用数' },
                { key: 'errors', color: '#ef4444', name: '错误数' }
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>模型使用分布</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={keyData.modelUsage}
              colors={['#3b82f6', '#10b981']}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 七、样式配置

### 7.1 Tailwind CSS 配置

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        success: {
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d'
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309'
        },
        error: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c'
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

### 7.2 全局样式

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}
```

---

## 八、依赖安装清单

### 8.1 核心依赖

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@tanstack/react-table": "^8.10.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.292.0",
    "next-themes": "^0.2.1",
    "recharts": "^2.10.3",
    "react-syntax-highlighter": "^15.5.0",
    "tailwind-merge": "^2.1.0",
    "tailwindcss-animate": "^1.0.7",
    "use-debounce": "^10.0.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/react-syntax-highlighter": "^15.5.10",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5"
  }
}
```

---

### 8.2 安装命令

```bash
# 安装所有依赖
npm install

# 或者使用 pnpm
pnpm install

# 或者使用 yarn
yarn install
```

---

## 九、总结

### 9.1 组件库特点

✅ **完整性** - 覆盖所有页面需求的组件实现
✅ **可复用** - 所有组件都是高度可配置和可复用的
✅ **类型安全** - 完整的 TypeScript 类型定义
✅ **响应式** - 所有组件都支持移动端适配
✅ **主题支持** - 内置深色模式支持
✅ **无障碍** - 遵循 ARIA 标准
✅ **性能优化** - 使用 React 最佳实践和优化技巧

### 9.2 开发建议

1. **先安装 Shadcn/ui 基础组件** - 按照第一节的清单完整安装
2. **复制自定义组件代码** - 按需复制第二节的自定义组件
3. **配置样式系统** - 使用第七节的 Tailwind 配置
4. **参考完整示例** - 第六节提供了完整的页面实现示例
5. **渐进式开发** - 从简单组件开始，逐步构建复杂页面

### 9.3 下一步行动

✅ 组件设计已完成
⏭️ **接下来可以开始实际开发**:
1. 初始化 Next.js 项目
2. 安装所有依赖和 Shadcn/ui 组件
3. 配置 Tailwind CSS 和全局样式
4. 按 Sprint 计划开始实现功能

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-01
**维护者**: Claude Key Portal Team
