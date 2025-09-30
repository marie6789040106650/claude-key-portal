# TDD（测试驱动开发）实践指南

## TDD核心理念

> "先写测试，再写代码，最后重构"

测试驱动开发不仅是一种开发方法，更是一种设计思想。通过先写测试，我们能够：
- 明确需求和预期行为
- 设计更好的API接口
- 确保代码可测试性
- 减少过度设计
- 提高代码质量和信心

## TDD三步循环

### 🔴 Red（红灯）
编写一个失败的测试
```javascript
// ❌ 测试失败 - 功能还未实现
describe('User Authentication', () => {
  it('should hash password before saving', async () => {
    const password = 'MySecurePass123';
    const hashedPassword = await hashPassword(password);

    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword).toMatch(/^\$2[ayb]\$.{56}$/);
  });
});
```

### 🟢 Green（绿灯）
编写最少代码使测试通过
```javascript
// ✅ 实现功能使测试通过
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}
```

### 🔄 Refactor（重构）
优化代码但保持测试通过
```javascript
// ♻️ 重构后的代码
import bcrypt from 'bcrypt';
import { AppConfig } from '@/config';

export class PasswordService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = AppConfig.security.bcryptRounds;
  }

  async hash(password: string): Promise<string> {
    this.validatePassword(password);
    return bcrypt.hash(password, this.saltRounds);
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  }
}
```

## 测试类型与策略

### 1. 单元测试 (Unit Tests)
**目标**: 测试独立的函数或类
**速度**: 快速 (<100ms)
**依赖**: 无外部依赖，使用mock

```javascript
// services/__tests__/auth.service.test.ts
describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepo = createMock<UserRepository>();
    authService = new AuthService(mockUserRepo);
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      mockUserRepo.create.mockResolvedValue({ id: '1', ...dto });

      const user = await authService.register(dto);

      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          password: expect.not.stringContaining('password123')
        })
      );
    });
  });
});
```

### 2. 集成测试 (Integration Tests)
**目标**: 测试组件间的交互
**速度**: 中等 (100ms-1s)
**依赖**: 真实数据库，模拟外部服务

```javascript
// api/__tests__/auth.integration.test.ts
describe('POST /api/auth/register', () => {
  let app: Application;
  let db: PrismaClient;

  beforeAll(async () => {
    app = await createTestApp();
    db = new PrismaClient();
  });

  afterEach(async () => {
    await db.user.deleteMany();
  });

  it('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!'
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      user: {
        email: 'newuser@example.com'
      },
      token: expect.any(String)
    });

    // Verify in database
    const user = await db.user.findUnique({
      where: { email: 'newuser@example.com' }
    });
    expect(user).toBeTruthy();
  });
});
```

### 3. E2E测试 (End-to-End Tests)
**目标**: 测试完整的用户场景
**速度**: 慢 (>1s)
**依赖**: 完整的应用环境

```javascript
// e2e/auth.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  test('complete registration and login flow', async ({ page }) => {
    // 1. Navigate to registration
    await page.goto('/register');

    // 2. Fill registration form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');

    // 3. Submit and verify redirect
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // 4. Verify welcome message
    await expect(page.locator('h1')).toContainText('Welcome');

    // 5. Logout
    await page.click('button:has-text("Logout")');

    // 6. Login with created account
    await page.goto('/login');
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // 7. Verify logged in
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## 测试组织结构

### 测试文件命名
```
src/
├── services/
│   ├── auth.service.ts
│   └── __tests__/
│       └── auth.service.test.ts    # 单元测试
├── controllers/
│   ├── auth.controller.ts
│   └── __tests__/
│       └── auth.controller.test.ts # 单元测试
└── api/
    └── __tests__/
        └── auth.integration.test.ts # 集成测试
```

### 测试套件结构
```javascript
describe('模块名称', () => {
  describe('功能/方法名称', () => {
    it('应该执行预期行为', () => {
      // Arrange (准备)
      const input = prepareTestData();

      // Act (执行)
      const result = functionUnderTest(input);

      // Assert (断言)
      expect(result).toBe(expectedValue);
    });

    it('应该处理错误情况', () => {
      // 测试错误处理
    });
  });
});
```

## 实用测试模式

### 1. AAA模式 (Arrange-Act-Assert)
```javascript
it('should calculate total with tax', () => {
  // Arrange
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  const taxRate = 0.1;

  // Act
  const total = calculateTotal(items, taxRate);

  // Assert
  expect(total).toBe(275); // (200 + 50) * 1.1
});
```

### 2. Given-When-Then (BDD风格)
```javascript
describe('Shopping Cart', () => {
  it('should apply discount for premium users', () => {
    // Given - 前置条件
    const user = createUser({ type: 'premium' });
    const cart = new ShoppingCart(user);
    cart.addItem({ price: 100, quantity: 1 });

    // When - 执行动作
    const total = cart.calculateTotal();

    // Then - 验证结果
    expect(total).toBe(90); // 10% discount applied
  });
});
```

### 3. 测试数据构建器 (Test Data Builder)
```javascript
class UserBuilder {
  private user: Partial<User> = {
    email: 'test@example.com',
    password: 'password123'
  };

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withRole(role: UserRole): this {
    this.user.role = role;
    return this;
  }

  build(): User {
    return this.user as User;
  }
}

// 使用
const adminUser = new UserBuilder()
  .withEmail('admin@example.com')
  .withRole('admin')
  .build();
```

## Mock策略

### 1. 依赖注入
```javascript
// 生产代码
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService
  ) {}

  async createUser(data: CreateUserDto) {
    const user = await this.userRepo.create(data);
    await this.emailService.sendWelcomeEmail(user.email);
    return user;
  }
}

// 测试代码
const mockRepo = { create: jest.fn() };
const mockEmail = { sendWelcomeEmail: jest.fn() };
const service = new UserService(mockRepo, mockEmail);
```

### 2. Mock外部服务
```javascript
// __mocks__/axios.ts
export default {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
};

// 测试中使用
import axios from 'axios';
jest.mock('axios');

it('should fetch user data', async () => {
  const mockData = { id: 1, name: 'John' };
  (axios.get as jest.Mock).mockResolvedValue({ data: mockData });

  const result = await fetchUser(1);

  expect(result).toEqual(mockData);
  expect(axios.get).toHaveBeenCalledWith('/api/users/1');
});
```

## 测试覆盖率

### 配置覆盖率目标
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

### 覆盖率报告
```bash
# 生成覆盖率报告
npm test -- --coverage

# 生成HTML报告
npm test -- --coverage --coverageReporters=html

# 查看未覆盖的代码
npm test -- --coverage --collectCoverageFrom="src/**/*.ts"
```

## 测试最佳实践

### ✅ DO (应该做的)
1. **保持测试独立** - 每个测试应该可以单独运行
2. **测试行为而非实现** - 关注输入输出，而非内部细节
3. **使用描述性的测试名称** - 清晰表达测试意图
4. **保持测试简单** - 一个测试只验证一个行为
5. **及时修复失败的测试** - 不要注释或跳过失败的测试

### ❌ DON'T (不应该做的)
1. **不要测试框架** - 只测试自己的代码
2. **避免过度mock** - 过多的mock可能隐藏问题
3. **不要测试私有方法** - 通过公共接口测试
4. **避免脆弱的测试** - 不要依赖执行顺序或时间
5. **不要忽略测试维护** - 测试代码也需要重构

## 持续集成中的测试

### GitHub Actions配置
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          file: ./coverage/coverage-final.json
```

## 测试命令脚本

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testMatch='**/*.test.ts'",
    "test:integration": "jest --testMatch='**/*.integration.test.ts'",
    "test:e2e": "playwright test",
    "test:debug": "node --inspect-brk ./node_modules/.bin/jest --runInBand"
  }
}
```

## TDD工作流程示例

### 示例：实现用户注册功能

#### Step 1: 编写失败的测试
```javascript
// user.service.test.ts
describe('UserService.register', () => {
  it('should create a new user with hashed password', async () => {
    const userService = new UserService();
    const userData = {
      email: 'test@example.com',
      password: 'SecurePass123'
    };

    const user = await userService.register(userData);

    expect(user.email).toBe(userData.email);
    expect(user.password).not.toBe(userData.password);
    expect(user.id).toBeDefined();
  });
});
// 🔴 Test fails - UserService doesn't exist
```

#### Step 2: 实现最小代码
```javascript
// user.service.ts
export class UserService {
  async register(userData: RegisterDto) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return {
      id: generateId(),
      email: userData.email,
      password: hashedPassword
    };
  }
}
// 🟢 Test passes
```

#### Step 3: 添加更多测试
```javascript
it('should throw error for duplicate email', async () => {
  const userService = new UserService();
  const userData = { email: 'existing@example.com', password: 'pass' };

  await userService.register(userData);

  await expect(userService.register(userData))
    .rejects.toThrow('Email already exists');
});
// 🔴 Test fails - no duplicate check
```

#### Step 4: 实现功能
```javascript
export class UserService {
  private users = new Map();

  async register(userData: RegisterDto) {
    if (this.users.has(userData.email)) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      id: generateId(),
      email: userData.email,
      password: hashedPassword
    };

    this.users.set(userData.email, user);
    return user;
  }
}
// 🟢 All tests pass
```

#### Step 5: 重构
```javascript
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService
  ) {}

  async register(userData: RegisterDto): Promise<User> {
    await this.validateUniqueEmail(userData.email);

    const hashedPassword = await this.passwordService.hash(userData.password);

    return this.userRepository.create({
      ...userData,
      password: hashedPassword
    });
  }

  private async validateUniqueEmail(email: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
  }
}
// 🟢 All tests still pass after refactoring
```

## 调试测试

### 使用VS Code调试
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "--watchAll=false"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 调试特定测试
```bash
# 只运行包含特定名称的测试
npm test -- --testNamePattern="should create user"

# 只运行特定文件的测试
npm test -- user.service.test.ts

# 使用 .only 临时只运行某个测试
it.only('should be debugged', () => {
  // This test will run exclusively
});
```

## 测试性能优化

### 1. 并行运行测试
```javascript
// jest.config.js
module.exports = {
  maxWorkers: '50%', // 使用50%的CPU核心
};
```

### 2. 使用测试数据库事务
```javascript
beforeEach(async () => {
  await prisma.$transaction(async (tx) => {
    // 在事务中运行测试
  });
});
```

### 3. 共享昂贵的设置
```javascript
// globalSetup.js
module.exports = async () => {
  global.testServer = await startTestServer();
};

// globalTeardown.js
module.exports = async () => {
  await global.testServer.close();
};
```

## 总结

TDD不仅是一种测试方法，更是一种思维方式。通过TDD，我们可以：
- 📝 更好地理解需求
- 🎯 设计更好的API
- 🛡️ 提高代码质量
- 🚀 加快开发速度
- 💪 增强重构信心

记住：**测试不是为了找bug，而是为了防止bug**。

---

更新时间: 2025-01-01
版本: v1.0.0