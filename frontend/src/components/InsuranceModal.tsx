import { useState, useEffect } from 'react'
import { X, Shield, Sparkles } from 'lucide-react'
import { insuranceAPI } from '../api'
import { InsurancePolicy, InsuranceValuation, BagDetail } from '../types'

interface InsuranceModalProps {
  bagId: number
  bag: BagDetail
  onClose: () => void
  onSuccess: (policy: InsurancePolicy) => void
  initialData?: InsurancePolicy
}

export default function InsuranceModal({ bagId, bag, onClose, onSuccess, initialData }: InsuranceModalProps) {
  const [formData, setFormData] = useState({
    insurance_company: initialData?.insurance_company || '',
    policy_no: initialData?.policy_no || '',
    coverage_start_date: initialData?.coverage_start_date || new Date().toISOString().split('T')[0],
    coverage_end_date: initialData?.coverage_end_date || '',
    insured_amount: initialData?.insured_amount?.toString() || '',
    deductible: initialData?.deductible?.toString() || '0',
    premium: initialData?.premium?.toString() || '0',
    coverage_scope: initialData?.coverage_scope || '',
    special_exclusions: initialData?.special_exclusions || '',
    notes: initialData?.notes || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [valuation, setValuation] = useState<InsuranceValuation | null>(null)
  const [loadingValuation, setLoadingValuation] = useState(false)

  useEffect(() => {
    if (!initialData) {
      loadValuation()
    }
  }, [bagId])

  const loadValuation = async () => {
    setLoadingValuation(true)
    try {
      const res = await insuranceAPI.getValuation(bagId)
      setValuation(res.data)
      if (res.data && !formData.insured_amount) {
        setFormData(prev => ({
          ...prev,
          insured_amount: res.data.suggested_insured_amount.toString(),
          deductible: (res.data.deductible_suggestion || 0).toString(),
          premium: (res.data.premium_estimate || 0).toString(),
        }))
      }
    } catch (error) {
      console.error('加载估值分析失败', error)
    } finally {
      setLoadingValuation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = {
        ...formData,
        bag_id: bagId,
        insured_amount: Number(formData.insured_amount) || 0,
        deductible: Number(formData.deductible) || 0,
        premium: Number(formData.premium) || 0,
      }
      let res
      if (initialData) {
        res = await insuranceAPI.updatePolicy(initialData.id, data)
      } else {
        res = await insuranceAPI.createPolicy(data)
      }
      onSuccess(res.data)
    } catch (error) {
      console.error('提交失败', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const riskLevelMap = {
    low: { label: '低风险', color: 'text-green-600', bg: 'bg-green-100' },
    medium: { label: '中风险', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    high: { label: '高风险', color: 'text-red-600', bg: 'bg-red-100' },
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-luxury-gold" />
            {initialData ? '编辑保险档案' : '创建保险档案'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!initialData && valuation && (
            <div className="mb-6 p-4 bg-gradient-to-r from-luxury-cream to-amber-50 rounded-xl border border-luxury-gold/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-luxury-gold" />
                <h4 className="font-medium text-gray-800">智能投保建议</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">建议保额</p>
                  <p className="text-lg font-bold text-luxury-gold">
                    ¥{valuation.suggested_insured_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">预估保费</p>
                  <p className="text-lg font-bold text-gray-800">
                    ¥{valuation.premium_estimate?.toLocaleString() || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">风险等级</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${riskLevelMap[valuation.risk_level]?.bg} ${riskLevelMap[valuation.risk_level]?.color}`}>
                    {riskLevelMap[valuation.risk_level]?.label}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                {valuation.risk_tips.map((tip, i) => (
                  <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-luxury-gold mt-0.5">•</span>
                    {tip}
                  </p>
                ))}
              </div>
              {valuation.value_retention_rate && (
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-luxury-gold/20">
                  保值率：{valuation.value_retention_rate}% · 
                  累计保养费：¥{valuation.total_maintenance_cost?.toLocaleString() || 0}
                  {valuation.appraisal_score && ` · 鉴定评分：${valuation.appraisal_score}分`}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保险公司 *</label>
                <input
                  type="text"
                  value={formData.insurance_company}
                  onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="如：平安保险"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保单号 *</label>
                <input
                  type="text"
                  value={formData.policy_no}
                  onChange={(e) => setFormData({ ...formData, policy_no: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="请输入保单号"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保障开始日期 *</label>
                <input
                  type="date"
                  value={formData.coverage_start_date}
                  onChange={(e) => setFormData({ ...formData, coverage_start_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保障结束日期 *</label>
                <input
                  type="date"
                  value={formData.coverage_end_date}
                  onChange={(e) => setFormData({ ...formData, coverage_end_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">投保金额 (元) *</label>
                <input
                  type="number"
                  value={formData.insured_amount}
                  onChange={(e) => setFormData({ ...formData, insured_amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">免赔额 (元)</label>
                <input
                  type="number"
                  value={formData.deductible}
                  onChange={(e) => setFormData({ ...formData, deductible: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保费 (元)</label>
                <input
                  type="number"
                  value={formData.premium}
                  onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">承保范围</label>
              <textarea
                value={formData.coverage_scope}
                onChange={(e) => setFormData({ ...formData, coverage_scope: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="详细描述承保范围，如：意外损坏、失窃、水渍等..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">特殊除外条款</label>
              <textarea
                value={formData.special_exclusions}
                onChange={(e) => setFormData({ ...formData, special_exclusions: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="描述不在承保范围内的情况..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
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
                {submitting ? '保存中...' : initialData ? '保存修改' : '创建保险'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
