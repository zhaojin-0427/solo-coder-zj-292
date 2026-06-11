import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileBadge, Clock, CheckCircle2, Eye, XCircle,
  Send, User, Phone, Building, AlertTriangle, FileText,
  Download, Trash2, Edit3, ShieldCheck, Package
} from 'lucide-react'
import { appraisalAPI } from '../api'
import { AppraisalOrderDetail, AppraisalStatus } from '../types'

const STATUS_MAP: Record<AppraisalStatus, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  pending_submit: { label: '待提交', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock, desc: '委托单已创建，等待提交' },
  pending_accept: { label: '待受理', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock, desc: '已提交，等待鉴定机构受理' },
  appraising: { label: '鉴定中', color: 'text-orange-600', bg: 'bg-orange-100', icon: Eye, desc: '鉴定机构正在进行鉴定' },
  reported: { label: '已出报告', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2, desc: '鉴定完成，报告已出具' },
  cancelled: { label: '已取消', color: 'text-red-500', bg: 'bg-red-100', icon: XCircle, desc: '委托已取消' },
}

const STATUS_FLOW: AppraisalStatus[] = ['pending_submit', 'pending_accept', 'appraising', 'reported']

export default function AppraisalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<AppraisalOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showStatusPanel, setShowStatusPanel] = useState(false)
  const [mockForm, setMockForm] = useState({
    report_id: '',
    report_agency: '',
    report_conclusion: '',
    report_score: '',
    report_details: '',
    risk_flag: '' as '' | 'low' | 'medium' | 'high',
  })

  const loadOrder = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await appraisalAPI.getOrder(Number(id))
      setOrder(res.data)
    } catch (error) {
      console.error('加载委托详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const handleStatusChange = async (newStatus: AppraisalStatus) => {
    if (!order) return
    if (!confirm(`确定将状态变更为「${STATUS_MAP[newStatus].label}」吗？`)) return

    setUpdating(true)
    try {
      const data: any = { status: newStatus }
      if (newStatus === 'reported') {
        Object.assign(data, {
          report_id: mockForm.report_id || `RPT${Date.now()}`,
          report_agency: mockForm.report_agency || order.expected_agency || '第三方鉴定机构',
          report_conclusion: mockForm.report_conclusion,
          report_score: mockForm.report_score ? Number(mockForm.report_score) : undefined,
          report_details: mockForm.report_details,
          risk_flag: mockForm.risk_flag || undefined,
        })
      }
      await appraisalAPI.updateStatus(order.id, data)
      alert('状态更新成功')
      setShowStatusPanel(false)
      loadOrder()
    } catch (error: any) {
      console.error('状态更新失败', error)
      alert(error?.response?.data?.detail || '状态更新失败，请重试')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!order) return
    if (!confirm('确定取消此委托单吗？')) return
    setUpdating(true)
    try {
      await appraisalAPI.updateStatus(order.id, { status: 'cancelled' })
      alert('委托已取消')
      loadOrder()
    } catch (error: any) {
      alert(error?.response?.data?.detail || '取消失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    if (!confirm('确定删除此委托单吗？删除后不可恢复')) return
    setUpdating(true)
    try {
      await appraisalAPI.deleteOrder(order.id)
      alert('删除成功')
      navigate('/appraisals')
    } catch (error: any) {
      alert(error?.response?.data?.detail || '删除失败')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">委托单不存在</p>
        <Link to="/appraisals" className="text-luxury-gold hover:underline">返回委托列表</Link>
      </div>
    )
  }

  const statusInfo = STATUS_MAP[order.status]
  const StatusIcon = statusInfo.icon
  const currentIdx = STATUS_FLOW.indexOf(order.status)

  const formatTime = (t?: string) => t ? t.slice(0, 16).replace('T', ' ') : '-'

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/appraisals" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-luxury-black">{order.order_no}</h2>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusInfo.label}
            </span>
            {order.is_urgent === 1 && (
              <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">
                ⚡ 加急
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{order.bag_brand} {order.bag_model}</p>
        </div>
        <div className="flex gap-2">
          {order.status === 'pending_submit' && (
            <>
              <button
                onClick={() => navigate(`/bags/${order.bag_id}`)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                <Edit3 className="w-4 h-4" />
                编辑包包
              </button>
              <button
                onClick={() => handleStatusChange('pending_accept')}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                提交委托
              </button>
            </>
          )}
          {(order.status === 'pending_submit' || order.status === 'pending_accept') && (
            <button
              onClick={handleCancel}
              disabled={updating}
              className="px-3 py-2 text-red-500 border border-red-200 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
            >
              取消委托
            </button>
          )}
          {(order.status === 'pending_submit' || order.status === 'cancelled') && (
            <button
              onClick={handleDelete}
              disabled={updating}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          )}
          {order.status !== 'reported' && order.status !== 'cancelled' && (
            <button
              onClick={() => setShowStatusPanel(true)}
              disabled={updating}
              className="flex items-center gap-2 px-3 py-2 border border-luxury-gold text-luxury-gold rounded-lg text-sm hover:bg-luxury-gold hover:text-white disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              模拟状态流转
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 card-shadow mb-6">
        <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <FileBadge className="w-5 h-5 text-luxury-gold" />
          状态流转
        </h3>
        <div className="relative">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((s, i) => {
              const info = STATUS_MAP[s]
              const Icon = info.icon
              const isDone = order.status === 'cancelled' ? false : i < currentIdx
              const isCurrent = order.status === 'cancelled' ? false : i === currentIdx
              return (
                <div key={s} className="flex-1 relative">
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-0.5 ${
                        isDone ? 'bg-luxury-gold' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  <div className="relative flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      order.status === 'cancelled'
                        ? 'bg-red-50 border-red-200 text-red-400'
                        : isCurrent
                          ? 'bg-luxury-gold border-luxury-gold text-white'
                          : isDone
                            ? 'bg-luxury-gold/20 border-luxury-gold text-luxury-gold'
                            : 'bg-white border-gray-200 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className={`text-xs mt-2 font-medium ${
                      order.status === 'cancelled'
                        ? 'text-red-400'
                        : isCurrent || isDone ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {info.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s === 'pending_submit' && formatTime(order.created_at)}
                      {s === 'pending_accept' && formatTime(order.submitted_at)}
                      {s === 'appraising' && formatTime(order.accepted_at)}
                      {s === 'reported' && formatTime(order.reported_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          {order.status === 'cancelled' && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">委托已取消</p>
              <p className="text-xs text-red-500 mt-1">取消时间：{formatTime(order.cancelled_at)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-luxury-gold" />
              委托信息
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: '委托单号', value: order.order_no, icon: FileBadge },
                { label: '期望鉴定机构', value: order.expected_agency || '未指定', icon: Building },
                { label: '委托类型', value: order.is_urgent === 1 ? '加急鉴定（2-3工作日）' : '普通鉴定（5-7工作日）', icon: Clock },
                { label: '创建时间', value: formatTime(order.created_at), icon: Clock },
                { label: '联系人', value: order.contact_name || '未填写', icon: User },
                { label: '联系电话', value: order.contact_phone || '未填写', icon: Phone },
              ].map((item, i) => {
                const ItemIcon = item.icon
                return (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <ItemIcon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <p className="text-gray-800 font-medium">{item.value}</p>
                  </div>
                )
              })}
            </div>
            {order.contact_remark && (
              <div className="mt-4 p-3 bg-luxury-cream rounded-lg">
                <p className="text-xs text-gray-500 mb-1">联系人备注</p>
                <p className="text-sm text-gray-800">{order.contact_remark}</p>
              </div>
            )}
          </div>

          {order.status === 'reported' && (
            <div className="bg-white rounded-xl p-6 card-shadow">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  鉴定报告结果
                </span>
                {order.report_pdf_path && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-luxury-gold border border-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-white">
                    <Download className="w-3.5 h-3.5" />
                    下载PDF
                  </button>
                )}
              </h3>
              <div className="p-6 bg-gradient-to-br from-luxury-cream/50 to-white rounded-xl border border-luxury-gold/20">
                <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-100">
                  <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center ${
                    order.report_score && order.report_score >= 80 ? 'bg-green-100' :
                    order.report_score && order.report_score >= 60 ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <span className={`text-3xl font-bold ${
                      order.report_score && order.report_score >= 80 ? 'text-green-600' :
                      order.report_score && order.report_score >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {order.report_score ?? '-'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">鉴定评分</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-800 mb-2">{order.report_conclusion}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">报告编号：</span>
                        <span className="text-gray-800">{order.report_id || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">鉴定机构：</span>
                        <span className="text-gray-800">{order.report_agency || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">出具时间：</span>
                        <span className="text-gray-800">{formatTime(order.reported_at)}</span>
                      </div>
                      {order.risk_flag && (
                        <div>
                          <span className="text-gray-500">风险等级：</span>
                          <span className={`font-medium ${
                            order.risk_flag === 'high' ? 'text-red-600' :
                            order.risk_flag === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {order.risk_flag === 'high' ? '高风险（疑似仿品）' :
                             order.risk_flag === 'medium' ? '中风险（建议复检）' :
                             '低风险（正品）'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {order.report_details && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">鉴定详情</p>
                    <div className="p-4 bg-white rounded-lg border border-gray-100 text-sm text-gray-600 whitespace-pre-wrap">
                      {order.report_details}
                    </div>
                  </div>
                )}
              </div>
              {order.risk_flag === 'high' && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">高风险提示</p>
                    <p className="text-xs text-red-600 mt-1">
                      该商品经鉴定存在较高仿品风险，建议谨慎交易或申请复检。如已购买，建议联系商家协商处理。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-luxury-gold" />
              关联包包
            </h3>
            <div
              className="p-4 bg-gradient-to-br from-luxury-gold/5 to-white rounded-lg border border-luxury-gold/20 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/bags/${order.bag_id}`)}
            >
              <p className="font-medium text-gray-800">{order.bag_brand}</p>
              <p className="text-sm text-gray-500 mt-1">{order.bag_model}</p>
              <p className="text-xs text-luxury-gold mt-3">查看包包详情 →</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-luxury-gold" />
              鉴定资料
            </h3>
            <div className="space-y-3 text-sm">
              {(() => {
                const purchaseCount = order.purchase_proof_refs ? order.purchase_proof_refs.split(',').length : 0
                const authCount = order.auth_image_refs ? order.auth_image_refs.split(',').length : 0
                return (
                  <>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">购买凭证</span>
                      <span className={`font-medium ${purchaseCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {purchaseCount > 0 ? `${purchaseCount} 张` : '未上传'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">五金刻字</span>
                      <span className="font-medium text-green-600">已关联</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">内标走线</span>
                      <span className="font-medium text-green-600">已关联</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">防尘袋烫金</span>
                      <span className="font-medium text-green-600">已关联</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      共关联鉴定照片 {authCount} 张
                    </p>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {showStatusPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">模拟状态流转（测试用）</h3>
              <button onClick={() => setShowStatusPanel(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
              <p className="text-sm text-gray-500">选择要流转到的状态：</p>
              <div className="space-y-2">
                {STATUS_FLOW.filter(s => {
                  const idx = STATUS_FLOW.indexOf(s)
                  const curIdx = STATUS_FLOW.indexOf(order.status)
                  return idx > curIdx
                }).map(s => {
                  const info = STATUS_MAP[s]
                  const Icon = info.icon
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={updating || s === 'reported' && !mockForm.report_conclusion}
                      className="w-full p-4 border border-gray-200 rounded-xl flex items-center gap-3 hover:border-luxury-gold hover:bg-luxury-cream/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      <div className={`w-10 h-10 ${info.bg} rounded-full flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${info.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{info.label}</p>
                        <p className="text-xs text-gray-500">{info.desc}</p>
                      </div>
                      <span className="text-luxury-gold text-sm">→</span>
                    </button>
                  )
                })}
              </div>

              {order.status !== 'reported' && (
                <div className="mt-6 p-4 bg-luxury-cream rounded-xl space-y-3">
                  <p className="text-sm font-medium text-gray-700">填写报告信息（流转到「已出报告」时使用）：</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">鉴定机构</label>
                      <input
                        type="text"
                        value={mockForm.report_agency}
                        onChange={(e) => setMockForm({ ...mockForm, report_agency: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="如：中检集团"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">鉴定评分</label>
                      <input
                        type="number"
                        value={mockForm.report_score}
                        onChange={(e) => setMockForm({ ...mockForm, report_score: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="0-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">鉴定结论</label>
                    <select
                      value={mockForm.report_conclusion}
                      onChange={(e) => setMockForm({ ...mockForm, report_conclusion: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">请选择</option>
                      <option value="正品">正品 - 符合品牌工艺特征</option>
                      <option value="符合正品工艺">符合正品工艺</option>
                      <option value="存疑">存疑 - 建议实物复检</option>
                      <option value="不符合正品工艺">不符合正品工艺</option>
                      <option value="疑似仿品">疑似仿品</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">风险等级</label>
                    <div className="flex gap-2">
                      {[
                        { v: 'low', label: '低风险' },
                        { v: 'medium', label: '中风险' },
                        { v: 'high', label: '高风险' },
                      ].map(r => (
                        <label key={r.v} className={`flex-1 py-2 text-center text-sm rounded-lg border cursor-pointer ${
                          mockForm.risk_flag === r.v
                            ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                            : 'border-gray-200 text-gray-600'
                        }`}>
                          <input
                            type="radio"
                            checked={mockForm.risk_flag === r.v}
                            onChange={() => setMockForm({ ...mockForm, risk_flag: r.v as any })}
                            className="sr-only"
                          />
                          {r.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">鉴定详情</label>
                    <textarea
                      value={mockForm.report_details}
                      onChange={(e) => setMockForm({ ...mockForm, report_details: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="详细描述鉴定要点..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
