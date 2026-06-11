import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, Clock, CheckCircle2, Eye, XCircle, Search, Filter, DollarSign, MessageSquare, ArrowDownToLine } from 'lucide-react'
import { consignmentAPI } from '../api'
import { ConsignmentOrderDetail, ConsignmentStatus } from '../types'

const STATUS_MAP: Record<ConsignmentStatus, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  draft: { label: '草稿', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock, desc: '寄售单已创建，等待提交审核' },
  pending_review: { label: '待审核', color: 'text-blue-600', bg: 'bg-blue-100', icon: Eye, desc: '已提交，等待平台审核' },
  listed: { label: '已上架', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2, desc: '已上架在售中' },
  negotiating: { label: '议价中', color: 'text-orange-600', bg: 'bg-orange-100', icon: MessageSquare, desc: '有买家出价，正在议价' },
  sold: { label: '已成交', color: 'text-purple-600', bg: 'bg-purple-100', icon: DollarSign, desc: '已完成交易' },
  delisted: { label: '已下架', color: 'text-red-500', bg: 'bg-red-100', icon: XCircle, desc: '已下架' },
}

const STATUS_FILTERS = [
  { value: '', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_review', label: '待审核' },
  { value: 'listed', label: '已上架' },
  { value: 'negotiating', label: '议价中' },
  { value: 'sold', label: '已成交' },
  { value: 'delisted', label: '已下架' },
]

export default function ConsignmentList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<ConsignmentOrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [keyword, setKeyword] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      const res = await consignmentAPI.getOrders(params)
      setOrders(res.data)
    } catch (error) {
      console.error('加载寄售列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const filteredOrders = orders.filter(o => {
    if (!keyword) return true
    const kw = keyword.toLowerCase()
    return (
      o.order_no.toLowerCase().includes(kw) ||
      (o.bag_brand || '').toLowerCase().includes(kw) ||
      (o.bag_model || '').toLowerCase().includes(kw) ||
      (o.platform || '').toLowerCase().includes(kw)
    )
  })

  const stats = {
    total: orders.length,
    active: orders.filter(o => ['listed', 'negotiating'].includes(o.status)).length,
    sold: orders.filter(o => o.status === 'sold').length,
    totalRevenue: orders.filter(o => o.status === 'sold').reduce((sum, o) => sum + (o.actual_amount || 0), 0),
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-luxury-black flex items-center gap-3">
          <Store className="w-7 h-7 text-luxury-gold" />
          寄售上架与成交复盘
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          管理寄售上架流程，追踪成交状态与收益复盘
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '寄售总数', value: stats.total, color: 'text-gray-800', iconBg: 'bg-gray-200', Icon: Store },
          { label: '在售中', value: stats.active, color: 'text-green-600', iconBg: 'bg-green-100', Icon: CheckCircle2 },
          { label: '已成交', value: stats.sold, color: 'text-purple-600', iconBg: 'bg-purple-100', Icon: DollarSign },
          { label: '实际到手总额', value: `¥${stats.totalRevenue.toLocaleString()}`, color: 'text-luxury-gold', iconBg: 'bg-amber-100', Icon: ArrowDownToLine },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl p-5 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className={"text-2xl font-bold mt-1 " + item.color}>{item.value}</p>
              </div>
              <div className={"w-12 h-12 rounded-xl flex items-center justify-center " + item.iconBg}>
                <item.Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 card-shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索寄售单号、品牌、型号、平台..."
              className="w-full pl-10 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors " +
                    (statusFilter === f.value
                      ? 'luxury-gradient text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center card-shadow">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">暂无寄售记录</p>
          <p className="text-xs text-gray-400 mb-4">前往包包详情页即可创建寄售单</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-luxury-gold border border-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-white transition-colors"
          >
            前往包包档案
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusInfo = STATUS_MAP[order.status]
            const StatusIcon = statusInfo.icon
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/consignments/' + order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={"w-12 h-12 rounded-full flex items-center justify-center " + statusInfo.bg}>
                      <StatusIcon className={"w-6 h-6 " + statusInfo.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800">{order.order_no}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.bag_brand} {order.bag_model}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        平台：{order.platform || '未指定'}
                        {order.expected_price && ` · 期望价：¥${order.expected_price.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={"inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium " + statusInfo.bg + " " + statusInfo.color}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">
                      创建时间：{order.created_at.slice(0, 16).replace('T', ' ')}
                    </p>
                  </div>
                </div>

                {order.status === 'sold' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">成交价：</span>
                      <span className="font-medium text-purple-600">¥{order.sold_price?.toLocaleString() || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">平台佣金：</span>
                      <span className="text-gray-800">¥{order.platform_commission?.toLocaleString() || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">实际到手：</span>
                      <span className="font-medium text-luxury-gold">¥{order.actual_amount?.toLocaleString() || '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-luxury-gold text-xs font-medium">
                        查看成交复盘 →
                      </span>
                    </div>
                  </div>
                )}

                {order.status === 'negotiating' && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100 text-sm text-orange-700">
                    💬 有买家正在议价，请及时前往详情页处理
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
