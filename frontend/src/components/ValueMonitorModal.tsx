import { useState, useEffect } from 'react'
import { X, TrendingDown, TrendingUp, Calendar, Globe } from 'lucide-react'
import { valueMonitorAPI } from '../api'
import { ValueMonitor } from '../types'

interface ValueMonitorModalProps {
  bagId: number
  bag?: any
  existingMonitor?: ValueMonitor | null
  onClose: () => void
  onSuccess: (monitor: ValueMonitor) => void
}

const PLATFORM_OPTIONS = ['闲鱼', '红布林', '胖虎', '寺库', '只二', '妃鱼']

export default function ValueMonitorModal({
  bagId,
  bag,
  existingMonitor,
  onClose,
  onSuccess,
}: ValueMonitorModalProps) {
  const [formData, setFormData] = useState({
    stop_loss_price: '',
    target_sell_price: '',
    planned_hold_months: '',
    follow_platforms: [] as string[],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (existingMonitor) {
      setFormData({
        stop_loss_price: existingMonitor.stop_loss_price?.toString() || '',
        target_sell_price: existingMonitor.target_sell_price?.toString() || '',
        planned_hold_months: existingMonitor.planned_hold_months?.toString() || '',
        follow_platforms: existingMonitor.follow_platforms
          ? existingMonitor.follow_platforms.split(',').map(p => p.trim())
          : [],
      })
    } else if (bag && bag.purchase_price) {
      const price = bag.purchase_price
      setFormData(prev => ({
        ...prev,
        stop_loss_price: Math.round(price * 0.8).toString(),
        target_sell_price: Math.round(price * 1.1).toString(),
      }))
    }
  }, [existingMonitor, bag])

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      follow_platforms: prev.follow_platforms.includes(platform)
        ? prev.follow_platforms.filter(p => p !== platform)
        : [...prev.follow_platforms, platform],
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const data = {
        bag_id: bagId,
        stop_loss_price: formData.stop_loss_price ? Number(formData.stop_loss_price) : undefined,
        target_sell_price: formData.target_sell_price ? Number(formData.target_sell_price) : undefined,
        planned_hold_months: formData.planned_hold_months ? Number(formData.planned_hold_months) : undefined,
        follow_platforms: formData.follow_platforms.join(', ') || undefined,
      }

      let res
      if (existingMonitor) {
        res = await valueMonitorAPI.updateMonitor(existingMonitor.id, data)
      } else {
        res = await valueMonitorAPI.createMonitor(data)
      }
      onSuccess(res.data)
    } catch (error: any) {
      alert(error.response?.data?.detail || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            {existingMonitor ? '编辑保值监控' : '开启保值监控'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              心理止损价（元）
            </label>
            <input
              type="number"
              value={formData.stop_loss_price}
              onChange={e => setFormData(prev => ({ ...prev, stop_loss_price: e.target.value }))}
              placeholder="低于此价格将触发止损预警"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-luxury-gold"
            />
            <p className="text-xs text-gray-400 mt-1">
              建议设置为购入价的 70%-85%，低于此价格建议及时出手
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              目标换手价（元）
            </label>
            <input
              type="number"
              value={formData.target_sell_price}
              onChange={e => setFormData(prev => ({ ...prev, target_sell_price: e.target.value }))}
              placeholder="达到此价格可考虑获利了结"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-luxury-gold"
            />
            <p className="text-xs text-gray-400 mt-1">
              建议设置为购入价的 105%-130%，达到目标价可考虑出手
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              计划持有周期（月）
            </label>
            <input
              type="number"
              value={formData.planned_hold_months}
              onChange={e => setFormData(prev => ({ ...prev, planned_hold_months: e.target.value }))}
              placeholder="预计持有多长时间"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-luxury-gold"
            />
            <p className="text-xs text-gray-400 mt-1">
              系统将在持有周期接近结束时提醒您规划出手时机
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Globe className="w-4 h-4 text-purple-500" />
              关注平台
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORM_OPTIONS.map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handlePlatformToggle(platform)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    formData.follow_platforms.includes(platform)
                      ? 'border-luxury-gold bg-luxury-cream text-luxury-gold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 luxury-gradient text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? '保存中...' : existingMonitor ? '保存修改' : '开启监控'}
          </button>
        </div>
      </div>
    </div>
  )
}
