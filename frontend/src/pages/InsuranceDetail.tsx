import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Shield, FileWarning, Clock, CheckCircle2, Eye, XCircle,
  AlertCircle, Plus, Edit3, Trash2, Calendar, DollarSign, FileText,
  Upload, Camera
} from 'lucide-react'
import { insuranceAPI, bagAPI } from '../api'
import { InsurancePolicyDetail, ClaimEvent, ClaimStatus, BagDetail as BagDetailType } from '../types'
import ClaimModal from '../components/ClaimModal'

const INSURANCE_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '保障中', color: 'text-green-600', bg: 'bg-green-100' },
  expired: { label: '已过期', color: 'text-gray-500', bg: 'bg-gray-100' },
  cancelled: { label: '已取消', color: 'text-red-500', bg: 'bg-red-100' },
  pending: { label: '待生效', color: 'text-yellow-600', bg: 'bg-yellow-100' },
}

const CLAIM_STATUS_MAP: Record<ClaimStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending_submit: { label: '待提交', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  under_review: { label: '审核中', color: 'text-blue-600', bg: 'bg-blue-100', icon: Eye },
  needs_material: { label: '需补充材料', color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertCircle },
  paid: { label: '已赔付', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  rejected: { label: '已拒赔', color: 'text-red-500', bg: 'bg-red-100', icon: XCircle },
  cancelled: { label: '已撤销', color: 'text-gray-500', bg: 'bg-gray-100', icon: XCircle },
}

export default function InsuranceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [policy, setPolicy] = useState<InsurancePolicyDetail | null>(null)
  const [bag, setBag] = useState<BagDetailType | null>(null)
  const [claims, setClaims] = useState<ClaimEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [editingClaim, setEditingClaim] = useState<ClaimEvent | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'claims'>('info')

  const loadPolicy = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await insuranceAPI.getPolicy(Number(id))
      const policyData = res.data
      setPolicy(policyData)
      if (policyData.bag_id) {
        try {
          const bagRes = await bagAPI.getBag(policyData.bag_id)
          setBag(bagRes.data)
        } catch (e) {
          console.error('加载关联包包失败', e)
        }
      }
      const claimsRes = await insuranceAPI.getClaims({ policy_id: Number(id) })
      setClaims(claimsRes.data)
    } catch (error) {
      console.error('加载保险详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPolicy()
  }, [id])

  const handleDelete = async () => {
    if (!policy || !confirm('确定要删除这个保险档案吗？相关理赔记录也会被删除。')) return
    try {
      await insuranceAPI.deletePolicy(policy.id)
      alert('删除成功')
      navigate(-1)
    } catch (error) {
      console.error('删除失败', error)
      alert('删除失败，请重试')
    }
  }

  const handleClaimStatusChange = async (claimId: number, newStatus: ClaimStatus) => {
    if (!confirm(`确定将理赔状态变更为「${CLAIM_STATUS_MAP[newStatus]?.label || newStatus}」吗？`)) return
    try {
      let payoutAmount: number | undefined = undefined
      if (newStatus === 'paid') {
        const input = prompt('请输入赔付金额（元）：')
        if (input === null) return
        payoutAmount = Number(input) || 0
      }
      await insuranceAPI.updateClaimStatus(claimId, {
        claim_status: newStatus,
        payout_amount: payoutAmount,
      })
      alert('状态更新成功')
      loadPolicy()
    } catch (error: any) {
      alert(error?.response?.data?.detail || '状态更新失败，请重试')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  if (!policy) {
    return <div className="text-center py-12 text-gray-500">保险档案不存在</div>
  }

  const statusInfo = INSURANCE_STATUS_MAP[policy.status] || INSURANCE_STATUS_MAP.active

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-luxury-black flex items-center gap-2">
            <Shield className="w-6 h-6 text-luxury-gold" />
            {policy.policy_no}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {policy.insurance_company}
            {policy.bag_brand && ` · ${policy.bag_brand} ${policy.bag_model}`}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 text-red-500 border border-red-200 rounded-lg text-sm hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          删除
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { key: 'info', label: '保单信息', icon: FileText },
          { key: 'claims', label: '理赔记录', icon: FileWarning },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-luxury-gold text-luxury-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'claims' && claims.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-luxury-gold/10 text-luxury-gold text-xs rounded-full">
                  {claims.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 card-shadow lg:col-span-2">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-luxury-gold" />
                保单信息
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">保险公司</span>
                  <span className="text-gray-800 font-medium">{policy.insurance_company}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">保单号</span>
                  <span className="text-gray-800 font-medium">{policy.policy_no}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">保障开始日期</span>
                  <span className="text-gray-800">{policy.coverage_start_date}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">保障结束日期</span>
                  <span className="text-gray-800">{policy.coverage_end_date}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">投保金额</span>
                  <span className="text-luxury-gold font-bold text-lg">
                    ¥{policy.insured_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">免赔额</span>
                  <span className="text-gray-800">
                    ¥{(policy.deductible || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">保费</span>
                  <span className="text-gray-800">
                    ¥{(policy.premium || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">保费费率</span>
                  <span className="text-gray-800">
                    {policy.insured_amount > 0 && policy.premium
                      ? ((policy.premium / policy.insured_amount) * 100).toFixed(2) + '%'
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {bag && (
              <div className="bg-white rounded-xl p-6 card-shadow">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-luxury-gold" />
                  投保包包
                </h3>
                <div
                  className="cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/bags/${bag.id}`)}
                >
                  <p className="font-medium text-gray-800">{bag.brand} {bag.model}</p>
                  <p className="text-sm text-gray-500 mt-1">{bag.style || '款式未记录'}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                    <span className="text-gray-500">购入价</span>
                    <span className="text-gray-800">
                      {bag.purchase_price ? `¥${bag.purchase_price.toLocaleString()}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">当前估值</span>
                    <span className="text-luxury-gold font-medium">
                      {bag.current_value ? `¥${bag.current_value.toLocaleString()}` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {policy.coverage_scope && (
            <div className="bg-white rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-luxury-gold" />
                承保范围
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{policy.coverage_scope}</p>
            </div>
          )}

          {policy.special_exclusions && (
            <div className="bg-white rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                特殊除外条款
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{policy.special_exclusions}</p>
            </div>
          )}

          {policy.notes && (
            <div className="bg-white rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-3">备注</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{policy.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">理赔记录</h3>
            <button
              onClick={() => {
                setEditingClaim(null)
                setShowClaimModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              登记理赔
            </button>
          </div>

          {claims.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center card-shadow">
              <FileWarning className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">暂无理赔记录</p>
              <p className="text-xs text-gray-400 mb-6">
                发生保险事故后，可在此登记理赔事件，跟踪理赔进度
              </p>
              <button
                onClick={() => {
                  setEditingClaim(null)
                  setShowClaimModal(true)
                }}
                className="px-4 py-2 text-sm text-luxury-gold border border-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-white transition-colors"
              >
                立即登记理赔
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => {
                const claimStatus = CLAIM_STATUS_MAP[claim.claim_status]
                const ClaimIcon = claimStatus?.icon || Clock
                return (
                  <div
                    key={claim.id}
                    className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/claims/${claim.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${claimStatus?.bg || 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                          <ClaimIcon className={`w-5 h-5 ${claimStatus?.color || 'text-gray-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{claim.incident_type}</p>
                            {claim.claim_no && (
                              <span className="text-xs text-gray-400">#{claim.claim_no}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {claim.incident_date}
                            {claim.damaged_parts && ` · ${claim.damaged_parts}`}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${claimStatus?.bg || 'bg-gray-100'} ${claimStatus?.color || 'text-gray-600'}`}>
                        <ClaimIcon className="w-3 h-3" />
                        {claimStatus?.label || claim.claim_status}
                      </span>
                    </div>

                    {(claim.repair_estimate || claim.payout_amount) && (
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-sm">
                        {claim.repair_estimate && (
                          <div>
                            <span className="text-gray-500">维修估价：</span>
                            <span className="text-gray-800">¥{claim.repair_estimate.toLocaleString()}</span>
                          </div>
                        )}
                        {claim.payout_amount && (
                          <div>
                            <span className="text-gray-500">赔付金额：</span>
                            <span className="font-medium text-green-600">¥{claim.payout_amount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {claim.claim_status !== 'paid' && claim.claim_status !== 'rejected' && claim.claim_status !== 'cancelled' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                        {claim.claim_status === 'pending_submit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClaimStatusChange(claim.id, 'under_review')
                            }}
                            className="px-3 py-1.5 text-xs bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            提交审核
                          </button>
                        )}
                        {claim.claim_status === 'under_review' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClaimStatusChange(claim.id, 'needs_material')
                              }}
                              className="px-3 py-1.5 text-xs bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                            >
                              需补充材料
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClaimStatusChange(claim.id, 'paid')
                              }}
                              className="px-3 py-1.5 text-xs bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              已赔付
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClaimStatusChange(claim.id, 'rejected')
                              }}
                              className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              拒赔
                            </button>
                          </>
                        )}
                        {claim.claim_status === 'needs_material' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClaimStatusChange(claim.id, 'under_review')
                            }}
                            className="px-3 py-1.5 text-xs bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            材料已补充
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClaimStatusChange(claim.id, 'cancelled')
                          }}
                          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors ml-auto"
                        >
                          撤销
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showClaimModal && policy && bag && (
        <ClaimModal
          policyId={policy.id}
          bagId={policy.bag_id}
          policy={policy}
          initialData={editingClaim || undefined}
          onClose={() => {
            setShowClaimModal(false)
            setEditingClaim(null)
          }}
          onSuccess={() => {
            setShowClaimModal(false)
            setEditingClaim(null)
            loadPolicy()
          }}
        />
      )}
    </div>
  )
}
