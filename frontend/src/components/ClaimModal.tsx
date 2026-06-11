import { useState, useEffect } from 'react'
import { X, FileWarning, Upload, Camera } from 'lucide-react'
import { insuranceAPI } from '../api'
import { ClaimEvent, InsurancePolicy, ClaimPhoto } from '../types'

const incidentTypes = [
  '意外刮擦',
  '五金氧化',
  '皮革磨损',
  '水渍损坏',
  '污渍污染',
  '边角磨损',
  '手柄断裂',
  '内衬损坏',
  '拉链损坏',
  '失窃',
  '其他',
]

const damageParts = [
  '包身正面',
  '包身背面',
  '包底',
  '边角',
  '手柄/肩带',
  '五金件',
  '内里',
  '拉链',
  '防尘袋',
  '其他',
]

interface ClaimModalProps {
  policyId: number
  bagId: number
  policy?: InsurancePolicy
  onClose: () => void
  onSuccess: (claim: ClaimEvent) => void
  initialData?: ClaimEvent
}

export default function ClaimModal({ policyId, bagId, policy, onClose, onSuccess, initialData }: ClaimModalProps) {
  const [formData, setFormData] = useState({
    incident_type: initialData?.incident_type || '',
    incident_date: initialData?.incident_date || new Date().toISOString().split('T')[0],
    damaged_parts: initialData?.damaged_parts || '',
    repair_estimate: initialData?.repair_estimate?.toString() || '',
    description: initialData?.description || '',
    claim_no: initialData?.claim_no || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [claimId, setClaimId] = useState<number | null>(initialData?.id || null)
  const [photos, setPhotos] = useState<ClaimPhoto[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (initialData) {
      loadClaimDetail()
    }
  }, [initialData?.id])

  const loadClaimDetail = async () => {
    if (!initialData?.id) return
    try {
      const res = await insuranceAPI.getClaim(initialData.id)
      setPhotos(res.data.photos || [])
    } catch (error) {
      console.error('加载理赔详情失败', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = {
        ...formData,
        insurance_policy_id: policyId,
        bag_id: bagId,
        repair_estimate: formData.repair_estimate ? Number(formData.repair_estimate) : undefined,
      }
      let res
      if (initialData && claimId) {
        res = await insuranceAPI.updateClaim(claimId, data)
      } else {
        res = await insuranceAPI.createClaim(data)
        setClaimId(res.data.id)
      }
      if (!initialData) {
        onSuccess(res.data)
      } else {
        onSuccess(res.data)
      }
    } catch (error) {
      console.error('提交失败', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadPhoto = async () => {
    if (!claimId) {
      alert('请先保存理赔记录')
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = async (e: any) => {
      const files = e.target.files
      if (!files || files.length === 0) return
      setUploading(true)
      try {
        for (const file of files) {
          const res = await insuranceAPI.uploadClaimPhoto(claimId, file)
          setPhotos(prev => [...prev, res.data])
        }
      } catch (error) {
        console.error('上传失败', error)
        alert('上传失败，请重试')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-orange-500" />
            {initialData ? '编辑理赔记录' : '登记理赔事件'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {policy && !initialData && (
            <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-800">
                <span className="font-medium">保单：</span>
                {policy.policy_no} ({policy.insurance_company})
              </p>
              <p className="text-xs text-orange-600 mt-1">
                保额：¥{policy.insured_amount.toLocaleString()} · 免赔额：¥{policy.deductible?.toLocaleString() || 0}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">事故类型 *</label>
                <select
                  value={formData.incident_type}
                  onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  required
                  disabled={!!claimId && !initialData}
                >
                  <option value="">请选择</option>
                  {incidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发生日期 *</label>
                <input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  required
                  disabled={!!claimId && !initialData}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">损伤部位</label>
              <select
                value={formData.damaged_parts}
                onChange={(e) => setFormData({ ...formData, damaged_parts: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                disabled={!!claimId && !initialData}
              >
                <option value="">请选择</option>
                {damageParts.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">维修估价 (元)</label>
              <input
                type="number"
                value={formData.repair_estimate}
                onChange={(e) => setFormData({ ...formData, repair_estimate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="0.00"
                disabled={!!claimId && !initialData}
              />
            </div>

            {initialData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">理赔编号</label>
                <input
                  type="text"
                  value={formData.claim_no}
                  onChange={(e) => setFormData({ ...formData, claim_no: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="保险公司理赔编号"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">事故描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="详细描述事故经过和损伤情况..."
                disabled={!!claimId && !initialData}
              />
            </div>

            {!claimId ? (
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
            ) : null}
          </form>

          {claimId && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">凭证照片</h4>
                <button
                  type="button"
                  onClick={handleUploadPhoto}
                  disabled={uploading}
                  className="text-sm text-luxury-gold flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? '上传中...' : '上传照片'}
                </button>
              </div>
              {photos.length === 0 ? (
                <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">暂未上传凭证照片</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(photo => (
                    <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img src={photo.photo_path} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (initialData) {
                      handleSubmit({ preventDefault: () => {} } as any)
                    } else {
                      onClose()
                    }
                  }}
                  className="px-6 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90"
                >
                  {initialData ? '保存修改' : '完成'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
