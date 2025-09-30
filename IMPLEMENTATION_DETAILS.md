# Claude Key Portal 实现细节方案

基于对已部署的CRS系统和参考产品AICodeMirror的分析，制定以下实现方案。

## 一、产品分析总结

### CRS系统特点
- **URL**: https://claude.just-play.fun
- **核心功能**: API中继服务，提供管理后台
- **特色**: 使用统计查询、使用教程、管理后台
- **技术栈**: Vue3 + Node.js后端

### AICodeMirror产品特点
- **商业模式**: 订阅制 (FREE/PLUS/PRO/MAX/ULTRA)
- **核心功能**:
  - API密钥管理
  - 积分系统（消耗和恢复机制）
  - 多平台安装指导
  - 邀请码系统
  - 动态定价（闲时/标准时段）
- **用户体验亮点**:
  - 一站式安装脚本
  - 详细的分平台教程
  - 实时积分显示
  - 公告系统

## 二、核心功能实现细节

### 1. 用户系统

#### 注册流程
```typescript
interface RegisterFlow {
  steps: [
    "手机号/邮箱验证",
    "设置密码",
    "邀请码绑定(可选)",
    "自动登录",
    "引导至仪表盘"
  ];
  features: {
    phoneVerification: boolean; // 短信验证
    emailVerification: boolean; // 邮件验证
    inviteCode: boolean; // 邀请码系统
    autoLogin: boolean; // 注册后自动登录
  };
}
```

#### 用户数据模型
```prisma
model User {
  id            String    @id @default(uuid())
  email         String?   @unique
  phone         String?   @unique
  password      String
  inviteCode    String    @unique @default(cuid())
  invitedBy     String?
  subscription  SubscriptionType @default(FREE)
  credits       Int       @default(2000)
  maxCredits    Int       @default(2000)
  creditRate    Int       @default(0) // 每小时恢复速率
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  apiKeys       ApiKey[]
  usageLogs     UsageLog[]
  invitedUsers  User[]    @relation("InviteRelation")
  inviter       User?     @relation("InviteRelation", fields: [invitedBy], references: [inviteCode])
}

enum SubscriptionType {
  FREE
  PLUS
  PRO
  MAX
  ULTRA
}
```

### 2. API密钥管理

#### 密钥生成策略
```typescript
class ApiKeyService {
  // 密钥格式: cr_<随机字符串>
  generateKey(): string {
    const prefix = 'cr_';
    const randomString = crypto.randomBytes(24).toString('base64url');
    return `${prefix}${randomString}`;
  }

  // 密钥加密存储
  async storeKey(userId: string, keyName: string): Promise<ApiKey> {
    const rawKey = this.generateKey();
    const hashedKey = await this.hashKey(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: keyName,
        key: hashedKey,
        lastCharacters: rawKey.slice(-4), // 保存后4位用于识别
        status: 'active'
      }
    });

    // 只在创建时返回完整密钥
    return { ...apiKey, fullKey: rawKey };
  }
}
```

#### API密钥界面设计
```typescript
interface ApiKeyUI {
  features: [
    "创建新密钥",
    "密钥列表展示",
    "一键复制",
    "显示/隐藏密钥",
    "删除密钥",
    "密钥使用统计",
    "密钥重命名"
  ];

  display: {
    format: "cr_**********************abcd", // 部分隐藏显示
    actions: ["复制", "删除", "查看统计"],
    metadata: ["创建时间", "最后使用", "请求次数"]
  };
}
```

### 3. 积分系统

#### 积分机制
```typescript
interface CreditSystem {
  // 订阅等级配置
  subscriptions: {
    FREE: { max: 2000, rate: 0, daily: 3000 },
    PLUS: { max: 4000, rate: 80, daily: null },
    PRO: { max: 8000, rate: 200, daily: null },
    MAX: { max: 20000, rate: 500, daily: null },
    ULTRA: { max: 50000, rate: 1200, daily: null }
  };

  // 时段倍率
  timeMultipliers: {
    idle: 0.95,    // 0:00-8:00
    standard: 1.0, // 8:00-24:00
    peak: 1.2      // 预留高峰时段
  };

  // 积分恢复
  recovery: {
    method: "hourly", // 每小时恢复
    resetTime: "daily_at_midnight", // 每日重置上限
  };
}
```

#### 积分消耗追踪
```typescript
class CreditTracker {
  async consumeCredits(userId: string, amount: number): Promise<boolean> {
    const user = await this.getUser(userId);
    const multiplier = this.getCurrentMultiplier();
    const actualCost = Math.floor(amount * multiplier);

    if (user.credits < actualCost) {
      return false; // 积分不足
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: actualCost }
      }
    });

    await this.logUsage(userId, actualCost);
    return true;
  }

  getCurrentMultiplier(): number {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 8) return 0.95; // 闲时
    return 1.0; // 标准时段
  }
}
```

### 4. 安装指导系统

#### 动态脚本生成
```typescript
class InstallScriptGenerator {
  generateScript(platform: 'windows' | 'macos' | 'linux', apiKey: string): string {
    const baseUrl = 'https://claude.just-play.fun/api';

    const scripts = {
      windows: `
# PowerShell 安装脚本
# 1. 安装 Node.js (如未安装)
winget install OpenJS.NodeJS.LTS

# 2. 安装 Claude Code
npm install -g @anthropic-ai/claude-code

# 3. 配置环境变量
$env:ANTHROPIC_BASE_URL = "${baseUrl}"
$env:ANTHROPIC_AUTH_TOKEN = "${apiKey}"

# 4. 永久保存环境变量
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "${baseUrl}", [System.EnvironmentVariableTarget]::User)
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "${apiKey}", [System.EnvironmentVariableTarget]::User)

Write-Host "安装完成！请运行 'claude' 开始使用" -ForegroundColor Green
`,
      macos: `
#!/bin/bash
# macOS/Linux 安装脚本

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "正在安装 Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.bashrc
    nvm install --lts
fi

# 2. 安装 Claude Code
npm install -g @anthropic-ai/claude-code

# 3. 配置环境变量
echo "export ANTHROPIC_BASE_URL='${baseUrl}'" >> ~/.bashrc
echo "export ANTHROPIC_AUTH_TOKEN='${apiKey}'" >> ~/.bashrc
source ~/.bashrc

echo "✅ 安装完成！请运行 'claude' 开始使用"
`,
      linux: `
#!/bin/bash
# Linux 安装脚本

# 1. 更新包管理器
sudo apt-get update

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装 Claude Code
sudo npm install -g @anthropic-ai/claude-code

# 4. 配置环境变量
echo "export ANTHROPIC_BASE_URL='${baseUrl}'" >> ~/.bashrc
echo "export ANTHROPIC_AUTH_TOKEN='${apiKey}'" >> ~/.bashrc
source ~/.bashrc

echo "✅ 安装完成！请运行 'claude' 开始使用"
`
    };

    return scripts[platform];
  }
}
```

#### 安装教程页面结构
```typescript
interface InstallationGuide {
  platforms: {
    windows: {
      prerequisites: ["Windows 10+", "PowerShell 5.1+"],
      methods: ["官方安装器", "命令行安装", "WSL安装"],
      troubleshooting: ["权限问题", "环境变量", "防火墙"]
    },
    macos: {
      prerequisites: ["macOS 10.15+", "Terminal"],
      methods: ["Homebrew安装", "官方脚本", "手动安装"],
      troubleshooting: ["权限问题", "PATH配置", "Xcode工具"]
    },
    linux: {
      prerequisites: ["Ubuntu 20.04+/Debian 10+", "sudo权限"],
      methods: ["包管理器", "官方脚本", "Docker"],
      troubleshooting: ["依赖问题", "权限配置", "网络问题"]
    }
  };

  features: [
    "一键复制命令",
    "环境检测脚本",
    "视频教程嵌入",
    "常见问题FAQ",
    "在线诊断工具"
  ];
}
```

### 5. 仪表盘设计

#### 仪表盘布局
```typescript
interface DashboardLayout {
  sections: {
    header: {
      userInfo: ["用户名", "订阅等级", "邀请码"],
      quickActions: ["升级订阅", "充值积分", "邀请好友"]
    },

    stats: {
      credits: {
        current: number,
        max: number,
        rate: number,
        nextRefresh: Date
      },
      usage: {
        today: number,
        week: number,
        month: number
      },
      performance: {
        requestCount: number,
        averageLatency: number,
        successRate: number
      }
    },

    apiKeys: {
      list: ApiKey[],
      actions: ["创建", "管理", "查看文档"]
    },

    quickStart: {
      platforms: ["Windows", "macOS", "Linux"],
      actions: ["获取安装脚本", "查看教程", "下载客户端"]
    }
  };
}
```

#### 实时数据更新
```typescript
class DashboardService {
  // WebSocket连接实时更新
  setupRealtimeUpdates(userId: string) {
    const ws = new WebSocket('/ws/dashboard');

    ws.on('credits-update', (data) => {
      this.updateCreditsDisplay(data);
    });

    ws.on('usage-update', (data) => {
      this.updateUsageChart(data);
    });
  }

  // 轮询更新（降级方案）
  async pollUpdates(userId: string) {
    setInterval(async () => {
      const data = await this.fetchDashboardData(userId);
      this.updateUI(data);
    }, 5000); // 5秒更新一次
  }
}
```

## 三、UI/UX设计方案

### 设计原则
1. **简洁直观** - 降低学习成本
2. **响应式** - 适配多端设备
3. **暗色模式** - 保护眼睛
4. **中文优先** - 本地化体验
5. **一键操作** - 减少步骤

### 颜色方案
```scss
// 主题色
$primary: #6366f1;    // 主色调（紫蓝色）
$secondary: #8b5cf6;  // 辅助色（紫色）
$success: #10b981;    // 成功（绿色）
$warning: #f59e0b;    // 警告（橙色）
$error: #ef4444;      // 错误（红色）

// 深色模式
$dark-bg: #0f172a;
$dark-surface: #1e293b;
$dark-border: #334155;
$dark-text: #f1f5f9;
```

### 组件设计
```typescript
// 使用 Shadcn/ui 组件库
const components = {
  Card: "带阴影的卡片容器",
  Button: "主要/次要/幽灵按钮",
  Input: "带图标和验证的输入框",
  Dialog: "模态对话框",
  Toast: "通知提示",
  Tabs: "标签页切换",
  Chart: "数据可视化图表",
  Skeleton: "加载骨架屏"
};
```

## 四、CRS API对接方案

### API代理层设计
```typescript
class CRSProxy {
  private baseUrl = 'https://claude.just-play.fun/api';

  // 代理请求到CRS
  async proxyRequest(apiKey: string, endpoint: string, data: any) {
    const response = await axios.post(`${this.baseUrl}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Forwarded-For': this.getUserIP()
      }
    });

    // 记录使用量
    await this.logUsage(apiKey, endpoint, response.data);

    return response.data;
  }

  // 验证API密钥
  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/validate`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
```

### 数据同步机制
```typescript
class DataSync {
  // 同步使用统计
  async syncUsageStats() {
    const keys = await prisma.apiKey.findMany({
      where: { status: 'active' }
    });

    for (const key of keys) {
      const stats = await this.fetchCRSStats(key.id);
      await this.updateLocalStats(key.id, stats);
    }
  }

  // 定时任务
  setupCronJobs() {
    // 每小时同步一次
    cron.schedule('0 * * * *', () => {
      this.syncUsageStats();
    });

    // 每小时恢复积分
    cron.schedule('0 * * * *', () => {
      this.recoverCredits();
    });

    // 每天0点重置
    cron.schedule('0 0 * * *', () => {
      this.dailyReset();
    });
  }
}
```

## 五、安全考虑

### API密钥安全
1. **加密存储** - 使用bcrypt哈希
2. **部分显示** - 只显示最后4位
3. **一次性显示** - 创建时完整显示一次
4. **定期轮换** - 提醒用户定期更换

### 请求限流
```typescript
const rateLimiter = {
  register: "5次/小时/IP",
  login: "10次/小时/IP",
  apiKeyCreate: "10次/天/用户",
  apiRequest: "1000次/分钟/密钥"
};
```

### 数据验证
```typescript
// 使用Zod进行运行时验证
const RegisterSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  password: z.string().min(8).max(50),
  inviteCode: z.string().optional()
}).refine(data => data.email || data.phone, {
  message: "邮箱或手机号至少填写一个"
});
```

## 六、性能优化

### 前端优化
1. **代码分割** - 路由级别懒加载
2. **缓存策略** - SWR数据缓存
3. **图片优化** - WebP格式，懒加载
4. **打包优化** - Tree-shaking，压缩

### 后端优化
1. **数据库索引** - 关键字段索引
2. **Redis缓存** - 热点数据缓存
3. **连接池** - 数据库连接池
4. **异步处理** - 消息队列

## 七、部署架构

### 生产环境配置
```nginx
# Caddy配置
claude-portal.com {
  # Gzip压缩
  encode gzip

  # API反向代理
  handle /api/* {
    reverse_proxy localhost:4000
  }

  # WebSocket
  @websockets {
    header Connection *Upgrade*
    header Upgrade websocket
  }
  handle @websockets {
    reverse_proxy localhost:4000
  }

  # 静态文件
  handle {
    root * /var/www/claude-portal/out
    try_files {path} /index.html
    file_server
  }
}
```

### 监控告警
```typescript
const monitoring = {
  metrics: [
    "API响应时间",
    "错误率",
    "并发用户数",
    "积分消耗速率",
    "数据库查询时间"
  ],
  alerts: [
    { metric: "错误率", threshold: "5%", action: "邮件通知" },
    { metric: "响应时间", threshold: "2s", action: "Slack通知" },
    { metric: "积分异常", threshold: "异常消耗", action: "立即告警" }
  ]
};
```

## 八、开发优先级

### Phase 1 - MVP (第1周)
- [x] 用户注册/登录
- [x] API密钥生成和管理
- [x] 基础积分系统
- [x] Windows/macOS/Linux安装教程
- [x] 简单的仪表盘

### Phase 2 - 增强 (第2周)
- [ ] 邀请码系统
- [ ] 积分恢复机制
- [ ] 使用统计图表
- [ ] 动态定价时段
- [ ] 公告系统

### Phase 3 - 商业化 (第3-4周)
- [ ] 支付集成（支付宝/微信）
- [ ] 订阅管理
- [ ] 发票系统
- [ ] 推广联盟
- [ ] 客服系统

## 总结

通过分析CRS和AICodeMirror，我们的Claude Key Portal将融合两者优点：

1. **CRS的技术基础** - 利用已有的API中继服务
2. **AICodeMirror的商业模式** - 积分系统和订阅制
3. **更好的用户体验** - 简化安装流程，提供一键脚本
4. **本地化优化** - 中文界面，国内支付
5. **独特创新** - 自动化配置，智能诊断

---

更新时间: 2025-01-01
版本: v1.0.0