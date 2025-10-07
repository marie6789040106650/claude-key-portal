/**
 * 首页 - 如何使用 Section
 */

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: '注册账号',
      description: '使用邮箱快速注册，无需验证',
    },
    {
      number: 2,
      title: '创建密钥',
      description: '在密钥管理页面创建 API 密钥',
    },
    {
      number: 3,
      title: '配置使用',
      description: '按照安装指导配置 Claude Code',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        如何使用
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
              {step.number}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
