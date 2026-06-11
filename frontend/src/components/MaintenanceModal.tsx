import { useState } from 'react'
import { X } from 'lucide-react'
import { maintenanceAPI } from '../api'

const serviceTypes = [
  '清洁护理',
  '补色修复',
  '五金修复',
  '边油修复',
  '内衬更换',
  '手柄修复',
  '整体翻新',
  '其他',
]

interface MaintenanceModalProps {
  bagId: number
  onClose: () => void
  onSuccess: () => void
  initialData?: any
}

export default function MaintenanceModal({ bagId, onClose, onSuccess, initialData }: MaintenanceModalProps) {
  const [formData, setFormData] = useState({
    service_date: initialData?.service_date || new Date().toISOString().split('T')[0],
    service_type: initialData?.service_type || '',
    service_items: initialData?.service_items || '',
    cost: initialData?.cost || '',
    service_provider: initialData?.service_provider || '',
    notes: initialData?.notes || '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = {
        ...formData,
        cost: formData.cost ? Number(formData.cost) : 0,
      }
      if (initialData) {
        await maintenanceAPI.updateRecord(initialData.id, data)
      } else {
        await maintenanceAPI.createRecord(bagId, data)
      }
      onSuccess()
    } catch (error) {
      console.error('提交失败', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {initialData ? '编辑保养记录' : '添加保养记录'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务日期 *</label>
                <input
                  type="date"
                  value={formData.service_date}
                  onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">费用 (元)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务类型 *</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                required
              >
                <option value="">请选择</option>
                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务项目</label>
              <textarea
                value={formData.service_items}
                onChange={(e) => setFormData({ ...formData, service_items: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="详细描述服务内容..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务商</label>
              <input
                type="text"
                value={formData.service_provider}
                onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="如：XX奢侈品护理中心"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="其他需要记录的信息..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
