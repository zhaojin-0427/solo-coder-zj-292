import { useState } from 'react'
import { X } from 'lucide-react'
import { bagAPI } from '../api'

const brands = ['Louis Vuitton', 'Chanel', 'Hermes', 'Gucci', 'Dior', 'Prada', 'Bottega Veneta', '其他']
const conditions = ['全新', '99新', '95新', '9成新', '8成新', '使用痕迹明显']

interface BagModalProps {
  onClose: () => void
  onSuccess: () => void
  initialData?: any
}

export default function BagModal({ onClose, onSuccess, initialData }: BagModalProps) {
  const [formData, setFormData] = useState({
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    style: initialData?.style || '',
    color: initialData?.color || '',
    material: initialData?.material || '',
    size: initialData?.size || '',
    purchase_date: initialData?.purchase_date || '',
    purchase_price: initialData?.purchase_price || '',
    purchase_channel: initialData?.purchase_channel || '',
    serial_number: initialData?.serial_number || '',
    condition: initialData?.condition || '',
    current_value: initialData?.current_value || '',
    notes: initialData?.notes || '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = {
        ...formData,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
        current_value: formData.current_value ? Number(formData.current_value) : null,
        purchase_date: formData.purchase_date || null,
      }
      if (initialData) {
        await bagAPI.updateBag(initialData.id, data)
      } else {
        await bagAPI.createBag(data)
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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {initialData ? '编辑包包信息' : '录入新包'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品牌 *</label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                required
              >
                <option value="">请选择品牌</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">型号 *</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="如：Neverfull MM"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">款式</label>
              <input
                type="text"
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="如：托特包"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">材质</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="如：老花帆布"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">尺寸</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="如：中号 / 32x28x15cm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">购买日期</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">购入价格 (元)</label>
              <input
                type="number"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">购买渠道</label>
              <input
                type="text"
                value={formData.purchase_channel}
                onChange={(e) => setFormData({ ...formData, purchase_channel: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="如：专柜、代购、二手平台"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">序列号</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成色</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              >
                <option value="">请选择</option>
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前估值 (元)</label>
              <input
                type="number"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              placeholder="其他需要记录的信息..."
            />
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
