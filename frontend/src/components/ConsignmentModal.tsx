import { useState } from 'react'
import { X, Check, AlertTriangle, Clock, FileBadge } from 'lucide-react'
import { consignmentAPI } from '../api'
import { BagDetail as BagDetailType, AppraisalOrderDetail } from '../types'

const PLATFORMS = [
  '闲鱼',
  '红布林',
  '只二',
  '心上',
  '妃鱼',
  '寺库',
  '得物',
  '其他平台',
]

const ACCESSORY_OPTIONS = [
  '防尘袋',
  '说明书',
  '身份卡',
  '吊牌',
  '购物小票',
  '包装盒',
  '肩带',
  '锁扣钥匙',
  '其他配件',
]

interface ConsignmentModalProps {
  bag: BagDetailType
  appraisalOrders: AppraisalOrderDetail[]
  onClose: () => void
  onSuccess: (orderId: number) => void
}

export default function ConsignmentModal({ bag, appraisalOrders, onClose, onSuccess }: ConsignmentModalProps) {
  const [formData, setFormData] = useState({
    platform: '',
    expected_price: '',
    min_price: '',
    commission_rate: '',
    listing_copy: '',
    accessory_completeness: '',
    defect_description: '',
  })
  const [accessories, setAccessories] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const hasPurchaseProof = bag.purchase_proof_images.length > 0
  const hasAuthImages = bag.authentication_images.length > 0
  const hasAppraisalReport = appraisalOrders.some(o => o.status === 'reported' && o.report_pdf_path)

  const toggleAccessory = (item: string) => {
    setAccessories(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    )
  }

  const purchaseRefs = bag.purchase_proof_images.map(img => img.id).join(',')
  const authRefs = bag.authentication_images.map(img => img.id).join(',')
  const reportRefs = appraisalOrders
    .filter(o => o.status === 'reported' && o.report_pdf_path)
    .map(o => o.id)
    .join(',')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await consignmentAPI.createOrder({
        bag_id: bag.id,
        platform: formData.platform || undefined,
        expected_price: formData.expected_price ? Number(formData.expected_price) : undefined,
        min_price: formData.min_price ? Number(formData.min_price) : undefined,
        commission_rate: formData.commission_rate ? Number(formData.commission_rate) : undefined,
        listing_copy: formData.listing_copy || undefined,
        accessory_completeness: accessories.join(','),
        defect_description: formData.defect_description || undefined,
        purchase_proof_refs: purchaseRefs || undefined,
        auth_image_refs: authRefs || undefined,
        report_refs: reportRefs || undefined,
      })
      onSuccess(res.data.id)
    } catch (error: any) {
      console.error('提交失败', error)
      alert(error?.response?.data?.detail || '提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold">创建寄售单</h3>
            <p className="text-sm text-gray-500 mt-1">{bag.brand} {bag.model}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6 p-4 bg-luxury-cream rounded-xl">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-luxury-gold" />
              资料复用检查
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {hasPurchaseProof ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span className={hasPurchaseProof ? 'text-gray-700' : 'text-yellow-600'}>
                  购买凭证 ({bag.purchase_proof_images.length}张) - 将自动关联
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasAuthImages ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span className={hasAuthImages ? 'text-gray-700' : 'text-yellow-600'}>
                  鉴定点照片 ({bag.authentication_images.length}张) - 将自动关联
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasAppraisalReport ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span className={hasAppraisalReport ? 'text-gray-700' : 'text-yellow-600'}>
                  专业鉴定报告 ({appraisalOrders.filter(o => o.status === 'reported').length}份) - 将自动关联
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">包包基础信息 - 将自动复用</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">寄售平台 *</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                required
              >
                <option value="">请选择寄售平台</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期望售价</label>
                <input
                  type="number"
                  value={formData.expected_price}
                  onChange={(e) => setFormData({ ...formData, expected_price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="¥"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最低接受价</label>
                <input
                  type="number"
                  value={formData.min_price}
                  onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="¥"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">佣金比例 (%)</label>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="如 8"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">配件完整度</label>
              <div className="flex flex-wrap gap-2">
                {ACCESSORY_OPTIONS.map(item => (
                  <label
                    key={item}
                    className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition-colors ${
                      accessories.includes(item)
                        ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={accessories.includes(item)}
                      onChange={() => toggleAccessory(item)}
                      className="sr-only"
                    />
                    {accessories.includes(item) ? '✓ ' : ''}{item}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上架文案</label>
              <textarea
                value={formData.listing_copy}
                onChange={(e) => setFormData({ ...formData, listing_copy: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="描述商品亮点、使用状况、转让原因等，将用于寄售平台展示..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">瑕疵说明</label>
              <textarea
                value={formData.defect_description}
                onChange={(e) => setFormData({ ...formData, defect_description: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="如实描述商品存在的瑕疵，如磨损、划痕、变色等..."
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 space-y-1">
              <p>📋 本次将自动关联以下资料：</p>
              <p className="ml-4">• 购买凭证：{bag.purchase_proof_images.length} 张</p>
              <p className="ml-4">• 鉴定照片：{bag.authentication_images.length} 张</p>
              <p className="ml-4">• 专业鉴定报告：{appraisalOrders.filter(o => o.status === 'reported').length} 份</p>
              <p className="ml-4">• 包包基础信息：{bag.brand} {bag.model} ({bag.color || '颜色未记录'} / {bag.condition || '成色未记录'})</p>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !formData.platform}
            className="px-6 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '创建中...' : '创建寄售单'}
          </button>
        </div>
      </div>
    </div>
  )
}
