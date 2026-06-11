import { useState } from 'react'
import { X, Check, AlertTriangle, Clock } from 'lucide-react'
import { appraisalAPI } from '../api'
import { BagDetail as BagDetailType } from '../types'

const AGENCIES = [
  '中检集团奢侈品鉴定中心',
  '国检中心奢侈品鉴定',
  '优奢易拍鉴定中心',
  '胖虎奢侈品鉴定',
  '寺库鉴定中心',
  '其他机构',
]

interface AppraisalModalProps {
  bag: BagDetailType
  onClose: () => void
  onSuccess: (orderId: number) => void
}

export default function AppraisalModal({ bag, onClose, onSuccess }: AppraisalModalProps) {
  const [formData, setFormData] = useState({
    expected_agency: '',
    is_urgent: 0,
    contact_name: '',
    contact_phone: '',
    contact_remark: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const authImageTypes = ['五金刻字', '内标走线', '防尘袋烫金']
  const hasPurchaseProof = bag.purchase_proof_images.length > 0
  const hasAllAuthImages = authImageTypes.every(type =>
    bag.authentication_images.some(img => img.image_type === type)
  )
  const canSubmit = hasPurchaseProof && hasAllAuthImages

  const purchaseRefs = bag.purchase_proof_images.map(img => img.id).join(',')
  const authRefs = bag.authentication_images.map(img => img.id).join(',')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      alert('请先上传购买凭证和所有必要的鉴定照片（五金刻字、内标走线、防尘袋烫金）')
      return
    }
    setSubmitting(true)
    try {
      const res = await appraisalAPI.createOrder({
        bag_id: bag.id,
        ...formData,
        purchase_proof_refs: purchaseRefs,
        auth_image_refs: authRefs,
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
            <h3 className="text-lg font-semibold">发起第三方鉴定委托</h3>
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
              资料完整性检查
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {hasPurchaseProof ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className={hasPurchaseProof ? 'text-gray-700' : 'text-red-600'}>
                  购买凭证 ({bag.purchase_proof_images.length}张)
                </span>
              </div>
              {authImageTypes.map(type => {
                const count = bag.authentication_images.filter(img => img.image_type === type).length
                const has = count > 0
                return (
                  <div key={type} className="flex items-center gap-2">
                    {has ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={has ? 'text-gray-700' : 'text-red-600'}>
                      {type} ({count}张)
                    </span>
                  </div>
                )
              })}
            </div>
            {!canSubmit && (
              <p className="text-xs text-orange-600 mt-3">
                * 请返回包包详情页上传缺失的资料后再发起委托
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期望鉴定机构 *</label>
              <select
                value={formData.expected_agency}
                onChange={(e) => setFormData({ ...formData, expected_agency: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                required
              >
                <option value="">请选择鉴定机构</option>
                {AGENCIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">加急选项</label>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.is_urgent === 0
                    ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="urgent"
                    checked={formData.is_urgent === 0}
                    onChange={() => setFormData({ ...formData, is_urgent: 0 })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">普通鉴定</span>
                  <span className="text-xs text-gray-500">5-7个工作日</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.is_urgent === 1
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="urgent"
                    checked={formData.is_urgent === 1}
                    onChange={() => setFormData({ ...formData, is_urgent: 1 })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">加急鉴定</span>
                  <span className="text-xs text-gray-500">2-3个工作日</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系人 *</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="请输入姓名"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="请输入手机号"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人备注</label>
              <textarea
                value={formData.contact_remark}
                onChange={(e) => setFormData({ ...formData, contact_remark: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="其他需要说明的信息，如特殊鉴定要求等..."
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 space-y-1">
              <p>📋 本次将自动关联以下资料：</p>
              <p className="ml-4">• 购买凭证：{bag.purchase_proof_images.length} 张</p>
              <p className="ml-4">• 鉴定照片：{bag.authentication_images.length} 张
                ({authImageTypes.map(t => `${t}${bag.authentication_images.filter(i => i.image_type === t).length}`).join('、')})
              </p>
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
            disabled={submitting || !canSubmit}
            className="px-6 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交委托申请'}
          </button>
        </div>
      </div>
    </div>
  )
}
