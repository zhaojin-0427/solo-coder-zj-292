import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileWarning, Clock, CheckCircle2, Eye, XCircle,
  AlertCircle, Calendar, DollarSign, FileText, Shield, Image as ImageIcon,
  Upload, Trash2, Plus, Edit3
} from 'lucide-react'
import { insuranceAPI, bagAPI } from '../api'
import { ClaimEventDetail, ClaimStatus, InsurancePolicyDetail, BagDetail as BagDetailType } from '../types'

const CLAIM_STATUS_MAP: Record<ClaimStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending_submit: { label: '待提交', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  under_review: { label: '审核中', color: 'text-blue-600', bg: 'bg-blue-100', icon: Eye },
  needs_material: { label: '需补充材料', color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertCircle },
  paid: { label: '已赔付', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  rejected: { label: '已拒赔', color: 'text-red-500', bg: 'bg-red-100', icon: XCircle },
  cancelled: { label: '已撤销', color: 'text-gray-500', bg: 'bg-gray-100', icon: XCircle },
}

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [claim, setClaim] = useState<ClaimEventDetail | null>(null)
  const [policy, setPolicy] = useState<InsurancePolicyDetail | null>(null)
  const [bag, setBag] = useState<BagDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)

  const loadClaim = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await insuranceAPI.getClaim(Number(id))
      const claimData = res.data
      setClaim(claimData)
      if (claimData.policy_id) {
        try {
          const policyRes = await insuranceAPI.getPolicy(claimData.policy_id)
          setPolicy(policyRes.data)
          if (policyRes.data.bag_id) {
            try {
              const bagRes = await bagAPI.getBag(policyRes.data.bag_id)
              setBag(bagRes.data)
            } catch (e) {
              console.error('加载关联包包失败', e)
            }
          }
        } catch (e) {
          console.error('加载关联保单失败', e)
        }
      }
    } catch (error) {
      console.error('加载理赔详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClaim()
  }, [id])

  const handleStatusChange = async (newStatus: ClaimStatus) => {
    if (!claim) return
    if (!confirm(`确定将理赔状态变更为「${CLAIM_STATUS_MAP[newStatus]?.label || newStatus}」吗？`)) return
    try {
      let payoutAmount: number | undefined = undefined
      if (newStatus === 'paid') {
        const input = prompt('请输入赔付金额（元）：')
        if (input === null) return
        payoutAmount = Number(input) || 0
      }
      await insuranceAPI.updateClaimStatus(claim.id, {
        claim_status: newStatus,
        payout_amount: payoutAmount,
      })
      alert('状态更新成功')
      loadClaim()
    } catch (error: any) {
      alert(error?.response?.data?.detail || '状态更新失败，请重试')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!claim || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploading(true)
    try {
      await insuranceAPI.uploadClaimPhoto(claim.id, file)
      alert('照片上传成功')
      loadClaim()
    } catch (error) {
      console.error('上传失败', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeletePhoto = async (photoId: number) => {
    if (!claim || !confirm('确定删除这张照片吗？')) return
    try {
      await insuranceAPI.deleteClaimPhoto(photoId)
      alert('删除成功')
      loadClaim()
    } catch (error) {
      console.error('删除失败', error)
      alert('删除失败，请重试')
    }
  }

  const handleDelete = async () => {
    if (!claim || !confirm('确定要删除这个理赔记录吗？')) return
    try {
      await insuranceAPI.deleteClaim(claim.id)
      alert('删除成功')
      navigate(-1)
    } catch (error) {
      console.error('删除失败', error)
      alert('删除失败，请重试')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  if (!claim) {
    return <div className="text-center py-12 text-gray-500">理赔记录不存在</div>
  }

  const claimStatus = CLAIM_STATUS_MAP[claim.claim_status]
  const ClaimIcon = claimStatus?.icon || Clock

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-luxury-black flex items-center gap-2">
            <FileWarning className="w-6 h-6 text-orange-500" />
            {claim.incident_type}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {claim.claim_no && `理赔编号：${claim.claim_no} · `}
            {claim.incident_date}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium ${claimStatus?.bg || 'bg-gray-100'} ${claimStatus?.color || 'text-gray-600'}`}>
          <ClaimIcon className="w-4 h-4" />
          {claimStatus?.label || claim.claim_status}
        </span>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 text-red-500 border border-red-200 rounded-lg text-sm hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          删除
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-orange-500" />
              理赔详情
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">事故类型</span>
                <span className="text-gray-800 font-medium">{claim.incident_type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">发生日期</span>
                <span className="text-gray-800">{claim.incident_date}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">损伤部位</span>
                <span className="text-gray-800">{claim.damaged_parts || '未记录'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">维修估价</span>
                <span className="text-gray-800">
                  {claim.repair_estimate ? `¥${claim.repair_estimate.toLocaleString()}` : '未记录'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">赔付金额</span>
                <span className={claim.payout_amount ? 'text-green-600 font-medium' : 'text-gray-500'}>
                  {claim.payout_amount ? `¥${claim.payout_amount.toLocaleString()}` : '待确定'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">报案日期</span>
                <span className="text-gray-800">{claim.created_at?.split('T')[0] || '-'}</span>
              </div>
            </div>
          </div>

          {claim.description && (
            <div className="bg-white rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-luxury-gold" />
                事故描述
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{claim.description}</p>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-luxury-gold" />
                照片 / 凭证
              </h3>
              <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-luxury-gold border border-luxury-gold rounded-lg cursor-pointer hover:bg-luxury-gold hover:text-white transition-colors">
                <Upload className="w-4 h-4" />
                上传照片
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {!claim.photos || claim.photos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无照片</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {claim.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={photo.photo_path}
                      alt={photo.description || '理赔照片'}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewPhoto(photo.photo_path)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewPhoto(photo.photo_path)
                        }}
                        className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-white"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePhoto(photo.id)
                        }}
                        className="p-1.5 bg-red-500/90 rounded-full text-white hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {policy && (
            <div className="bg-white rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-luxury-gold" />
                关联保单
              </h3>
              <div
                className="cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                onClick={() => navigate(`/insurance/${policy.id}`)}
              >
                <p className="font-medium text-gray-800">{policy.policy_no}</p>
                <p className="text-sm text-gray-500">{policy.insurance_company}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-500">保额</span>
                  <span className="text-luxury-gold font-medium">
                    ¥{policy.insured_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {bag && (
            <div className="bg-white rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-luxury-gold" />
                关联包包
              </h3>
              <div
                className="cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                onClick={() => navigate(`/bags/${bag.id}`)}
              >
                <p className="font-medium text-gray-800">{bag.brand} {bag.model}</p>
                <p className="text-sm text-gray-500 mt-1">{bag.style || '款式未记录'}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-500">当前估值</span>
                  <span className="text-luxury-gold font-medium">
                    {bag.current_value ? `¥${bag.current_value.toLocaleString()}` : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {claim.claim_status !== 'paid' && claim.claim_status !== 'rejected' && claim.claim_status !== 'cancelled' && (
            <div className="bg-white rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-4">状态操作</h3>
              <div className="space-y-2">
                {claim.claim_status === 'pending_submit' && (
                  <button
                    onClick={() => handleStatusChange('under_review')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    提交审核
                  </button>
                )}
                {claim.claim_status === 'under_review' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('needs_material')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                      需要补充材料
                    </button>
                    <button
                      onClick={() => handleStatusChange('paid')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      已赔付
                    </button>
                    <button
                      onClick={() => handleStatusChange('rejected')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      拒赔
                    </button>
                  </>
                )}
                {claim.claim_status === 'needs_material' && (
                  <button
                    onClick={() => handleStatusChange('under_review')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    材料已补充
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  撤销理赔
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setPreviewPhoto(null)}
        >
          <img
            src={previewPhoto}
            alt="预览"
            className="max-w-full max-h-full rounded-lg"
          />
          <button
            onClick={() => setPreviewPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}
