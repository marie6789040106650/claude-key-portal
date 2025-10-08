/**
 * 安装步骤组件
 * Sprint MVP - Phase 2 🟢 GREEN
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

interface InstallStepsProps {
  instructions: string[]
  platform: string
}

export function InstallSteps({ instructions, platform }: InstallStepsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>安装步骤</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {instructions.map((instruction, index) => (
            <li key={index} className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold text-blue-600">{index + 1}.</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-gray-700">{instruction}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* 完成提示 */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-green-900">配置完成！</h4>
              <p className="mt-1 text-sm text-green-700">
                完成以上步骤后，您就可以在终端中使用 Claude API 了。
                如有问题，请参考<a href="#" className="underline">文档</a>或联系支持团队。
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
