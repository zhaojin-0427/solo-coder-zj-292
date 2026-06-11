import { useState } from 'react'
import { X, Upload, Camera } from 'lucide-react'
import { bagAPI } from '../api'

const brands = ['Louis Vuitton', 'Chanel', 'Hermes', 'Gucci', 'Dior', 'Prada', 'Bottega Veneta', '其他']
const conditions = ['全新', '99新', '95新', '9成新', '8成新', '使用痕迹明显']
const authImageTypes = ['五金刻字', '内标走线', '防尘袋烫金']

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
  const [bagId, setBagId] = useState<number | null>(initialData?.id || null)
  const [purchaseProofs, setPurchaseProofs] = useState<string[]>(initialData?.purchase_proof_images?.map((p: any) => p.image_path) || [])
  const [authImages, setAuthImages] = useState<Record<string, string[]>>(
    initialData?.authentication_images?.reduce((acc: Record<string, string[]>, img: any) => {
      if (!acc[img.image_type]) acc[img.image_type] = []
      acc[img.image_type].push(img.image_path)
      return acc
    }, {}) || {}
  )
  const [uploading, setUploading] = useState<string | null>(null)

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
      let newBagId: number
      if (bagId) {
        await bagAPI.updateBag(bagId, data)
        newBagId = bagId
        onSuccess()
      } else {
        const res = await bagAPI.createBag(data)
        newBagId = res.data.id
        setBagId(newBagId)
      }
      if (!initialData) {
        alert('包包信息已保存，现在可以上传购买凭证和鉴定点照片了')
      }
    } catch (error) {
      console.error('提交失败', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadPurchaseProof = async () => {
    if (!bagId) {
      alert('请先保存包包信息')
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      setUploading('purchase')
      try {
        const res = await bagAPI.uploadPurchaseProof(bagId, file)
        setPurchaseProofs([...purchaseProofs, res.data.image_path])
        alert('上传成功')
      } catch (error) {
        console.error('上传失败', error)
        alert('上传失败，请重试')
      } finally {
        setUploading(null)
      }
    }
    input.click()
  }

  const handleUploadAuthImage = async (imageType: string) => {
    if (!bagId) {
      alert('请先保存包包信息')
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      setUploading(imageType)
      try {
        const res = await bagAPI.uploadAuthImage(bagId, imageType, file)
        setAuthImages({
          ...authImages,
          [imageType]: [...(authImages[imageType] || []), res.data.image_path]
        })
        alert('上传成功')
      } catch (error) {
        console.error('上传失败', error)
        alert('上传失败，请重试')
      } finally {
        setUploading(null)
      }
    }
    input.click()
  }

  const handleComplete = () => {
    onSuccess()
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品牌 *</label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  required
                  disabled={!!bagId && !initialData}
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
                  disabled={!!bagId && !initialData}
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
                  disabled={!!bagId && !initialData}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  disabled={!!bagId && !initialData}
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
                  disabled={!!bagId && !initialData}
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
                  disabled={!!bagId && !initialData}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">购买日期</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  disabled={!!bagId && !initialData}
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
                  disabled={!!bagId && !initialData}
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
                  disabled={!!bagId && !initialData}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">序列号</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  disabled={!!bagId && !initialData}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">成色</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  disabled={!!bagId && !initialData}
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
                  disabled={!!bagId && !initialData}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                placeholder="其他需要记录的信息..."
                disabled={!!bagId && !initialData}
              />
            </div>

            {!bagId ? (
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
                  {submitting ? '保存中...' : '保存并继续上传照片'}
                </button>
              </div>
            ) : null}
          </form>

          {bagId && (
            <div className="mt-6 pt-6 border-t space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">购买凭证</h4>
                  <button
                    type="button"
                    onClick={handleUploadPurchaseProof}
                    disabled={uploading === 'purchase'}
                    className="text-sm text-luxury-gold hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading === 'purchase' ? '上传中...' : `上传 (${purchaseProofs.length}张)`}
                  </button>
                </div>
                {purchaseProofs.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {purchaseProofs.map((p, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                    <Camera className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-3">鉴定点照片</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {authImageTypes.map((type) => {
                    const images = authImages[type] || []
                    return (
                      <div key={type} className="border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{type}</span>
                          <button
                            type="button"
                            onClick={() => handleUploadAuthImage(type)}
                            disabled={uploading === type}
                            className="text-xs text-luxury-gold hover:underline disabled:opacity-50"
                          >
                            {uploading === type ? '上传中...' : images.length > 0 ? '继续上传' : '上传'}
                          </button>
                        </div>
                        {images.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1">
                            {images.map((img, i) => (
                              <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-50 rounded flex items-center justify-center">
                            <Camera className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="px-6 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90"
                >
                  完成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
