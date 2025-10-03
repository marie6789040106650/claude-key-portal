// Claude Key Portal - 原型交互脚本

// 复制到剪贴板
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast('已复制到剪贴板', 'success')
    })
    .catch((err) => {
      console.error('复制失败:', err)
      showToast('复制失败', 'error')
    })
}

// 显示提示消息
function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
    type === 'success'
      ? 'bg-green-500'
      : type === 'error'
        ? 'bg-red-500'
        : type === 'warning'
          ? 'bg-amber-500'
          : 'bg-blue-500'
  }`
  toast.textContent = message

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transition = 'opacity 0.3s'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// 模态框控制
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add('active')
    document.body.style.overflow = 'hidden'
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove('active')
    document.body.style.overflow = 'auto'
  }
}

// 点击模态框背景关闭
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active')
    document.body.style.overflow = 'auto'
  }
})

// 侧边栏切换（移动端）
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  if (sidebar) {
    sidebar.classList.toggle('active')
  }
}

// 标签页切换
function switchTab(tabId) {
  // 隐藏所有标签内容
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.add('hidden')
  })

  // 移除所有标签按钮的激活状态
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.classList.remove('border-blue-500', 'text-blue-600')
    button.classList.add('border-transparent', 'text-gray-500')
  })

  // 显示选中的标签内容
  const targetContent = document.getElementById(tabId)
  if (targetContent) {
    targetContent.classList.remove('hidden')
  }

  // 激活选中的标签按钮
  const targetButton = document.querySelector(
    `[onclick="switchTab('${tabId}')"]`
  )
  if (targetButton) {
    targetButton.classList.remove('border-transparent', 'text-gray-500')
    targetButton.classList.add('border-blue-500', 'text-blue-600')
  }
}

// 表单验证
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePassword(password) {
  // 至少8个字符，包含大小写字母、数字和特殊字符
  const re =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return re.test(password)
}

// 登录表单验证
function validateLoginForm(event) {
  event.preventDefault()

  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  if (!validateEmail(email)) {
    showToast('请输入有效的邮箱地址', 'error')
    return false
  }

  if (!password) {
    showToast('请输入密码', 'error')
    return false
  }

  // 模拟登录成功
  showToast('登录成功！', 'success')
  setTimeout(() => {
    window.location.href = 'dashboard.html'
  }, 1000)

  return false
}

// 注册表单验证
function validateRegisterForm(event) {
  event.preventDefault()

  const name = document.getElementById('name').value
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const confirmPassword = document.getElementById('confirm-password').value

  if (!name || name.length < 2) {
    showToast('用户名至少需要2个字符', 'error')
    return false
  }

  if (!validateEmail(email)) {
    showToast('请输入有效的邮箱地址', 'error')
    return false
  }

  if (!validatePassword(password)) {
    showToast('密码必须至少8个字符，包含大小写字母、数字和特殊字符', 'error')
    return false
  }

  if (password !== confirmPassword) {
    showToast('两次输入的密码不一致', 'error')
    return false
  }

  // 模拟注册成功
  showToast('注册成功！正在跳转...', 'success')
  setTimeout(() => {
    window.location.href = 'login.html'
  }, 1000)

  return false
}

// 格式化数字
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化日期
function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 高亮当前导航
function highlightCurrentNav() {
  const currentPath = window.location.pathname
  const navLinks = document.querySelectorAll('.nav-link')

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute('href')
    if (currentPath.includes(linkPath)) {
      link.classList.add('active')
    } else {
      link.classList.remove('active')
    }
  })
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  highlightCurrentNav()

  // 为所有复制按钮添加事件监听
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const code = e.target
        .closest('.code-block')
        .querySelector('code').textContent
      copyToClipboard(code)
    })
  })
})

// ESC键关闭模态框
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach((modal) => {
      modal.classList.remove('active')
      document.body.style.overflow = 'auto'
    })
  }
})
