/**
 * 自动化部署测试脚本
 * 使用Playwright测试部署后的网站
 */

const { chromium } = require('playwright');

async function testDeployment() {
  console.log('🚀 开始部署测试...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    // ==================== 测试1: 首页完整性 ====================
    console.log('📄 测试1: 首页完整性');
    await page.goto('https://portal.just-play.fun/', { waitUntil: 'networkidle' });

    // 检查所有Section是否存在
    const sections = [
      { name: 'Navbar', selector: 'nav' },
      { name: 'Hero Section', selector: 'h1:has-text("Claude Key Portal")' },
      { name: 'Features Section', selector: 'h2:has-text("核心功能")' },
      { name: 'How it works Section', selector: 'h2:has-text("如何使用")' },
      { name: 'CTA Section', selector: 'h2:has-text("准备好开始了吗")' },
      { name: 'Footer', selector: 'footer' }
    ];

    for (const section of sections) {
      const exists = await page.locator(section.selector).count() > 0;
      if (exists) {
        results.passed.push(`✅ ${section.name} 存在`);
        console.log(`  ✅ ${section.name}`);
      } else {
        results.failed.push(`❌ ${section.name} 缺失`);
        console.log(`  ❌ ${section.name} 缺失！`);
      }
    }

    // 检查"如何使用"的3个步骤
    const steps = await page.locator('text=注册账号').count();
    if (steps > 0) {
      results.passed.push('✅ "如何使用"3个步骤完整');
      console.log('  ✅ "如何使用"3个步骤完整');
    } else {
      results.failed.push('❌ "如何使用"步骤缺失');
      console.log('  ❌ "如何使用"步骤缺失');
    }

    console.log('');

    // ==================== 测试2: 登录页功能 ====================
    console.log('🔐 测试2: 登录页功能');
    await page.goto('https://portal.just-play.fun/auth/login', { waitUntil: 'networkidle' });

    // 检查"记住我"复选框
    const rememberMe = await page.locator('text=记住我').count() > 0;
    if (rememberMe) {
      results.passed.push('✅ "记住我"复选框存在');
      console.log('  ✅ "记住我"复选框');
    } else {
      results.failed.push('❌ "记住我"复选框缺失');
      console.log('  ❌ "记住我"复选框缺失');
    }

    // 检查"忘记密码"链接
    const forgotPassword = await page.locator('text=忘记密码').count() > 0;
    if (forgotPassword) {
      results.passed.push('✅ "忘记密码"链接存在');
      console.log('  ✅ "忘记密码"链接');
    } else {
      results.failed.push('❌ "忘记密码"链接缺失');
      console.log('  ❌ "忘记密码"链接缺失');
    }

    console.log('');

    // ==================== 测试3: 导航功能 ====================
    console.log('🧭 测试3: 导航功能');

    // 测试注册链接
    await page.goto('https://portal.just-play.fun/');
    await page.click('text=注册');
    await page.waitForURL('**/auth/register');
    const registerUrl = page.url();
    if (registerUrl.includes('/auth/register')) {
      results.passed.push('✅ 注册页面导航正常');
      console.log('  ✅ 注册页面导航');
    } else {
      results.failed.push('❌ 注册页面导航失败');
      console.log('  ❌ 注册页面导航失败');
    }

    // 测试登录链接
    await page.goto('https://portal.just-play.fun/');
    await page.click('text=登录');
    await page.waitForURL('**/auth/login');
    const loginUrl = page.url();
    if (loginUrl.includes('/auth/login')) {
      results.passed.push('✅ 登录页面导航正常');
      console.log('  ✅ 登录页面导航');
    } else {
      results.failed.push('❌ 登录页面导航失败');
      console.log('  ❌ 登录页面导航失败');
    }

    console.log('');

    // ==================== 测试4: 响应式设计 ====================
    console.log('📱 测试4: 响应式设计');

    // 测试移动端视图
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://portal.just-play.fun/');
    await page.waitForLoadState('networkidle');

    const mobileNav = await page.locator('nav').isVisible();
    if (mobileNav) {
      results.passed.push('✅ 移动端导航栏可见');
      console.log('  ✅ 移动端导航栏');
    } else {
      results.failed.push('❌ 移动端导航栏不可见');
      console.log('  ❌ 移动端导航栏不可见');
    }

    // 恢复桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('');

  } catch (error) {
    results.failed.push(`❌ 测试过程出错: ${error.message}`);
    console.error('❌ 测试过程出错:', error.message);
  }

  // ==================== 生成测试报告 ====================
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试报告');
  console.log('='.repeat(60));
  console.log(`\n✅ 通过: ${results.passed.length} 项`);
  console.log(`❌ 失败: ${results.failed.length} 项`);
  console.log(`⚠️  警告: ${results.warnings.length} 项\n`);

  if (results.failed.length > 0) {
    console.log('失败项目:');
    results.failed.forEach(item => console.log(`  ${item}`));
    console.log('');
  }

  const totalTests = results.passed.length + results.failed.length;
  const successRate = ((results.passed.length / totalTests) * 100).toFixed(1);
  console.log(`成功率: ${successRate}%\n`);

  if (results.failed.length === 0) {
    console.log('🎉 所有测试通过！部署成功！');
  } else {
    console.log('⚠️  部分测试失败，需要检查问题。');
  }

  await browser.close();

  // 返回结果用于CI/CD
  process.exit(results.failed.length === 0 ? 0 : 1);
}

// 运行测试
testDeployment().catch(console.error);
