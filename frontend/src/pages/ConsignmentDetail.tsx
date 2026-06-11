import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Store, Clock, CheckCircle2, Eye, XCircle,
  DollarSign, MessageSquare, Package, Camera, Image as ImageIcon,
  Trash2, Edit3, ArrowDownToLine, TrendingDown, FileText, Tag, FileBadge
} from 'lucide-react'
import { consignmentAPI, bagAPI, appraisalAPI } from '../api'
import { ConsignmentOrderDetail, ConsignmentStatus, BagDetail as BagDetailType, AppraisalOrderDetail } from '../types'

const STATUS_MAP: Record<ConsignmentStatus, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  draft: { label: '草稿', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock, desc: '寄售单已创建，等待提交审核' },
  pending_review: { label: '待审核', color: 'text-blue-600', bg: 'bg-blue-100', icon: Eye, desc: '已提交，等待平台审核' },
  listed: { label: '已上架', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2, desc: '已上架在售中' },
  negotiating: { label: '议价中', color: 'text-orange-600', bg: 'bg-orange-100', icon: MessageSquare, desc: '有买家出价，正在议价' },
  sold: { label: '已成交', color: 'text-purple-600', bg: 'bg-purple-100', icon: DollarSign, desc: '已完成交易' },
  delisted: { label: '已下架', color: 'text-red-500', bg: 'bg-red-100', icon: XCircle, desc: '已下架' },
}

const STATUS_FLOW: ConsignmentStatus[] = ['draft', 'pending_review', 'listed', 'negotiating', 'sold']

export default function ConsignmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<ConsignmentOrderDetail | null>(null)
  const [bag, setBag] = useState<BagDetailType | null>(null)
  const [appraisalOrders, setAppraisalOrders] = useState<AppraisalOrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [transactionForm, setTransactionForm] = useState({
    sold_price: '',
    platform_commission: '',
    actual_amount: '',
    buyer_note: '',
    sold_date: '',
  })

  const loadOrder = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await consignmentAPI.getOrder(Number(id))
      const orderData = res.data
      setOrder(orderData)
      if (orderData.bag_id) {
        try {
          const bagRes = await bagAPI.getBag(orderData.bag_id)
          setBag(bagRes.data)
        } catch (e) {
          console.error('加载关联包包失败', e)
        }
        try {
          const appraisalRes = await appraisalAPI.getOrders({ bag_id: orderData.bag_id })
          setAppraisalOrders(appraisalRes.data)
        } catch (e) {
          console.error('加载鉴定报告失败', e)
        }
      }
    } catch (error) {
      console.error('加载寄售详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const handleStatusChange = async (newStatus: ConsignmentStatus) => {
    if (!order) return
    if (!confirm(`确定将状态变更为「${STATUS_MAP[newStatus].label}」吗？`)) return
    setUpdating(true)
    try {
      await consignmentAPI.updateStatus(order.id, { status: newStatus })
      alert('状态更新成功')
      loadOrder()
    } catch (error: any) {
      alert(error?.response?.data?.detail || '状态更新失败，请重试')
    } finally {
      setUpdating(false)
    }
  }

  const handleTransactionSubmit = async () => {
    if (!order) return
    if (!transactionForm.sold_price) {
      alert('请填写成交价格')
      return
    }
    setUpdating(true)
    try {
      await consignmentAPI.updateTransaction(order.id, {
        sold_price: Number(transactionForm.sold_price),
        platform_commission: transactionForm.platform_commission ? Number(transactionForm.platform_commission) : undefined,
        actual_amount: transactionForm.actual_amount ? Number(transactionForm.actual_amount) : undefined,
        buyer_note: transactionForm.buyer_note || undefined,
        sold_date: transactionForm.sold_date || undefined,
      })
      alert('成交信息录入成功')
      setShowTransactionForm(false)
      loadOrder()
    } catch (error: any) {
      alert(error?.response?.data?.detail || '录入失败，请重试')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    if (!confirm('确定删除此寄售单吗？删除后不可恢复')) return
    setUpdating(true)
    try {
      await consignmentAPI.deleteOrder(order.id)
      alert('删除成功')
      navigate('/consignments')
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
        <p className="text-gray-500 mb-4">寄售单不存在</p>
        <Link to="/consignments" className="text-luxury-gold hover:underline">返回寄售列表</Link>
      </div>
    )
  }

  const statusInfo = STATUS_MAP[order.status]
  const StatusIcon = statusInfo.icon
  const isOnFlow = STATUS_FLOW.includes(order.status)
  const currentIdx = STATUS_FLOW.indexOf(order.status)

  const formatTime = (t?: string) => t ? t.slice(0, 16).replace('T', ' ') : '-'

  const priceReduction = order.expected_price && order.sold_price
    ? ((order.expected_price - order.sold_price) / order.expected_price * 100).toFixed(1)
    : null

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/consignments" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-luxury-black">{order.order_no}</h2>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{order.bag_brand} {order.bag_model}</p>
        </div>
        <div className="flex gap-2">
          {order.status === 'draft' && (
            <button
              onClick={() => handleStatusChange('pending_review')}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              提交审核
            </button>
          )}
          {order.status === 'pending_review' && (
            <button
              onClick={() => handleStatusChange('listed')}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              确认上架
            </button>
          )}
          {order.status === 'listed' && (
            <button
              onClick={() => handleStatusChange('negotiating')}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              进入议价
            </button>
          )}
          {order.status === 'negotiating' && (
            <button
              onClick={() => {
                setTransactionForm({
                  sold_price: order.min_price?.toString() || '',
                  platform_commission: order.commission_rate ? (Number(order.min_price || 0) * order.commission_rate / 100).toFixed(2) : '',
                  actual_amount: '',
                  buyer_note: '',
                  sold_date: new Date().toISOString().split('T')[0],
                })
                setShowTransactionForm(true)
              }}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              <DollarSign className="w-4 h-4" />
              录入成交
            </button>
          )}
          {['listed', 'negotiating'].includes(order.status) && (
            <button
              onClick={() => handleStatusChange('delisted')}
              disabled={updating}
              className="px-3 py-2 text-red-500 border border-red-200 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
            >
              下架
            </button>
          )}
          {(order.status === 'draft' || order.status === 'delisted') && (
            <button
              onClick={handleDelete}
              disabled={updating}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 card-shadow mb-6">
        <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Store className="w-5 h-5 text-luxury-gold" />
          状态流转
        </h3>
        <div className="relative">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((s, i) => {
              const info = STATUS_MAP[s]
              const Icon = info.icon
              const isDone = !isOnFlow ? false : i < currentIdx
              const isCurrent = isOnFlow && i === currentIdx
              return (
                <div key={s} className="flex-1 relative">
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-0.5 ${
                        isDone || isCurrent ? 'bg-luxury-gold' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  <div className="relative flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      !isOnFlow
                        ? s === 'draft'
                          ? 'bg-red-50 border-red-200 text-red-400'
                          : 'bg-white border-gray-200 text-gray-400'
                        : isCurrent
                          ? 'bg-luxury-gold border-luxury-gold text-white'
                          : isDone
                            ? 'bg-luxury-gold/20 border-luxury-gold text-luxury-gold'
                            : 'bg-white border-gray-200 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className={`text-xs mt-2 font-medium ${
                      isCurrent || isDone ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {info.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s === 'draft' && formatTime(order.created_at)}
                      {s === 'pending_review' && formatTime(order.created_at)}
                      {s === 'listed' && formatTime(order.listed_at)}
                      {s === 'negotiating' && formatTime(order.negotiating_at)}
                      {s === 'sold' && formatTime(order.sold_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          {order.status === 'delisted' && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">已下架</p>
              <p className="text-xs text-red-500 mt-1">下架时间：{formatTime(order.delisted_at)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-luxury-gold" />
              寄售信息
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: '寄售单号', value: order.order_no, icon: Store },
                { label: '寄售平台', value: order.platform || '未指定', icon: Tag },
                { label: '期望售价', value: order.expected_price ? `¥${order.expected_price.toLocaleString()}` : '未填写', icon: DollarSign },
                { label: '最低接受价', value: order.min_price ? `¥${order.min_price.toLocaleString()}` : '未填写', icon: TrendingDown },
                { label: '佣金比例', value: order.commission_rate ? `${order.commission_rate}%` : '未填写', icon: DollarSign },
                { label: '创建时间', value: formatTime(order.created_at), icon: Clock },
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
            {order.accessory_completeness && (
              <div className="mt-4 p-3 bg-luxury-cream rounded-lg">
                <p className="text-xs text-gray-500 mb-1">配件完整度</p>
                <div className="flex flex-wrap gap-2">
                  {order.accessory_completeness.split(',').map((a, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white text-gray-700 text-xs rounded border border-gray-200">
                      {a.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {order.listing_copy && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">上架文案</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{order.listing_copy}</p>
              </div>
            )}
            {order.defect_description && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-xs text-orange-600 mb-1">瑕疵说明</p>
                <p className="text-sm text-orange-800 whitespace-pre-wrap">{order.defect_description}</p>
              </div>
            )}
          </div>

          {order.status === 'sold' && (
            <div className="bg-white rounded-xl p-6 card-shadow">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                成交复盘
              </h3>
              <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">期望售价</p>
                    <p className="text-lg font-bold text-gray-400 line-through">
                      ¥{order.expected_price?.toLocaleString() || '-'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1">实际成交价</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ¥{order.sold_price?.toLocaleString() || '-'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-white rounded-lg border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 mb-1">平台佣金</p>
                    <p className="text-lg font-semibold text-gray-800">
                      ¥{order.platform_commission?.toLocaleString() || '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-luxury-gold/30 text-center">
                    <p className="text-xs text-luxury-gold mb-1">实际到手</p>
                    <p className="text-lg font-bold text-luxury-gold">
                      ¥{order.actual_amount?.toLocaleString() || '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 mb-1">让价幅度</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {priceReduction ? `${priceReduction}%` : '-'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">成交日期：</span>
                    <span className="text-gray-800">{order.sold_date || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">成交时间：</span>
                    <span className="text-gray-800">{formatTime(order.sold_at)}</span>
                  </div>
                </div>
                {order.buyer_note && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">买家备注</p>
                    <p className="text-sm text-gray-800">{order.buyer_note}</p>
                  </div>
                )}
              </div>
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
              {bag && (
                <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                  <p>颜色：{bag.color || '未记录'}</p>
                  <p>成色：{bag.condition || '未记录'}</p>
                  <p>购入价：{bag.purchase_price ? `¥${bag.purchase_price.toLocaleString()}` : '未记录'}</p>
                </div>
              )}
              <p className="text-xs text-luxury-gold mt-3">查看包包详情 →</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-luxury-gold" />
              关联资料
            </h3>
            {bag ? (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    购买凭证
                    <span className="ml-2 text-xs text-gray-400">
                      {bag.purchase_proof_images.length} 张
                    </span>
                  </p>
                  {bag.purchase_proof_images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {bag.purchase_proof_images.map((img) => (
                        <div key={img.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img src={img.image_path} alt="购买凭证" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    鉴定照片
                    <span className="ml-2 text-xs text-gray-400">
                      {bag.authentication_images.length} 张
                    </span>
                  </p>
                  {bag.authentication_images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {bag.authentication_images.slice(0, 6).map((img) => (
                        <div key={img.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img src={img.image_path} alt={img.image_type} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                {appraisalOrders.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      专业鉴定报告
                      <span className="ml-2 text-xs text-gray-400">
                        {appraisalOrders.filter(o => o.status === 'reported').length} 份
                      </span>
                    </p>
                    <div className="space-y-2">
                      {appraisalOrders.filter(o => o.status === 'reported').map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center gap-3 p-3 bg-luxury-cream rounded-lg border border-luxury-gold/20 cursor-pointer hover:bg-luxury-gold/10 transition-colors"
                          onClick={() => navigate(`/appraisals/${report.id}`)}
                        >
                          <div className="w-10 h-10 bg-luxury-gold/20 rounded-lg flex items-center justify-center">
                            <FileBadge className="w-5 h-5 text-luxury-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{report.order_no}</p>
                            <p className="text-xs text-gray-500">
                              {report.report_agency || '专业鉴定机构'} · {report.report_score !== undefined ? `${report.report_score}分` : ''}
                            </p>
                          </div>
                          <span className="text-xs text-luxury-gold">查看 →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {(() => {
                  const purchaseCount = order.purchase_proof_refs ? order.purchase_proof_refs.split(',').length : 0
                  const authCount = order.auth_image_refs ? order.auth_image_refs.split(',').length : 0
                  const reportCount = order.report_refs ? order.report_refs.split(',').length : 0
                  return (
                    <>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">购买凭证</span>
                        <span className={"font-medium " + (purchaseCount > 0 ? 'text-green-600' : 'text-gray-400')}>
                          {purchaseCount > 0 ? purchaseCount + ' 张' : '未上传'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">鉴定照片</span>
                        <span className="font-medium text-green-600">{authCount} 张</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">专业鉴定报告</span>
                        <span className={"font-medium " + (reportCount > 0 ? 'text-green-600' : 'text-gray-400')}>
                          {reportCount > 0 ? reportCount + ' 份' : '未上传'}
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {showTransactionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">录入成交信息</h3>
              <button onClick={() => setShowTransactionForm(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">成交价格 *</label>
                <input
                  type="number"
                  value={transactionForm.sold_price}
                  onChange={(e) => {
                    const val = e.target.value
                    const price = Number(val)
                    let commission = transactionForm.platform_commission
                    let actual = transactionForm.actual_amount
                    if (order?.commission_rate && val) {
                      commission = (price * order.commission_rate / 100).toFixed(2)
                      actual = (price - Number(commission)).toFixed(2)
                    }
                    setTransactionForm({
                      ...transactionForm,
                      sold_price: val,
                      platform_commission: commission,
                      actual_amount: actual,
                    })
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="¥"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">平台佣金</label>
                  <input
                    type="number"
                    value={transactionForm.platform_commission}
                    onChange={(e) => setTransactionForm({ ...transactionForm, platform_commission: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    placeholder="¥"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">实际到手金额</label>
                  <input
                    type="number"
                    value={transactionForm.actual_amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, actual_amount: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    placeholder="¥"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">成交日期</label>
                <input
                  type="date"
                  value={transactionForm.sold_date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, sold_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">买家备注</label>
                <textarea
                  value={transactionForm.buyer_note}
                  onChange={(e) => setTransactionForm({ ...transactionForm, buyer_note: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="记录买家信息、交易备注等..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowTransactionForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleTransactionSubmit}
                disabled={updating || !transactionForm.sold_price}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? '提交中...' : '确认成交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
