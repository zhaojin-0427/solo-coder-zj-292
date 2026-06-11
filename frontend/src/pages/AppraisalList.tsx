import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileBadge, Clock, CheckCircle2, Eye, XCircle, Search, Filter } from 'lucide-react'
import { appraisalAPI } from '../api'
import { AppraisalOrderDetail, AppraisalStatus } from '../types'

const STATUS_MAP: Record<AppraisalStatus, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  pending_submit: { label: '待提交', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock, desc: '委托单已创建，等待提交' },
  pending_accept: { label: '待受理', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock, desc: '已提交，等待鉴定机构受理' },
  appraising: { label: '鉴定中', color: 'text-orange-600', bg: 'bg-orange-100', icon: Eye, desc: '鉴定机构正在进行鉴定' },
  reported: { label: '已出报告', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2, desc: '鉴定完成，报告已出具' },
  cancelled: { label: '已取消', color: 'text-red-500', bg: 'bg-red-100', icon: XCircle, desc: '委托已取消' },
}

const STATUS_FILTERS = [
  { value: '', label: '全部' },
  { value: 'pending_submit', label: '待提交' },
  { value: 'pending_accept', label: '待受理' },
  { value: 'appraising', label: '鉴定中' },
  { value: 'reported', label: '已出报告' },
  { value: 'cancelled', label: '已取消' },
]

export default function AppraisalList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<AppraisalOrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [keyword, setKeyword] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      const res = await appraisalAPI.getOrders(params)
      setOrders(res.data)
    } catch (error) {
      console.error('加载委托列表失败', error)
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
      (o.expected_agency || '').toLowerCase().includes(kw)
    )
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => ['pending_submit', 'pending_accept'].includes(o.status)).length,
    appraising: orders.filter(o => o.status === 'appraising').length,
    reported: orders.filter(o => o.status === 'reported').length,
  }

  const getConclusionColor = (score?: number) => {
    if (!score) return 'text-gray-600'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskColorClass = (flag?: string) => {
    if (flag === 'high') return 'bg-red-50 text-red-700 border border-red-100'
    if (flag === 'medium') return 'bg-yellow-50 text-yellow-700 border border-yellow-100'
    return 'bg-green-50 text-green-700 border border-green-100'
  }

  const getRiskText = (flag?: string) => {
    if (flag === 'high') return '高风险 - 疑似仿品'
    if (flag === 'medium') return '中风险 - 建议复检'
    return '低风险 - 正品'
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-luxury-black flex items-center gap-3">
          <FileBadge className="w-7 h-7 text-luxury-gold" />
          专业鉴定委托
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          管理第三方专业鉴定委托，追踪鉴定进度与报告结果
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '委托总数', value: stats.total, color: 'text-gray-800', iconBg: 'bg-gray-200' },
          { label: '待处理', value: stats.pending, color: 'text-blue-600', iconBg: 'bg-blue-100' },
          { label: '鉴定中', value: stats.appraising, color: 'text-orange-600', iconBg: 'bg-orange-100' },
          { label: '已出报告', value: stats.reported, color: 'text-green-600', iconBg: 'bg-green-100' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl p-5 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className={"text-2xl font-bold mt-1 " + item.color}>{item.value}</p>
              </div>
              <div className={"w-12 h-12 rounded-xl flex items-center justify-center " + item.iconBg}>
                <FileBadge className="w-6 h-6" />
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
              placeholder="搜索委托单号、品牌、型号、机构..."
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
          <FileBadge className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">暂无委托记录</p>
          <p className="text-xs text-gray-400 mb-4">前往包包详情页即可发起鉴定委托</p>
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
                onClick={() => navigate('/appraisals/' + order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={"w-12 h-12 rounded-full flex items-center justify-center " + statusInfo.bg}>
                      <StatusIcon className={"w-6 h-6 " + statusInfo.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800">{order.order_no}</p>
                        {order.is_urgent === 1 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">加急</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.bag_brand} {order.bag_model}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        期望机构：{order.expected_agency || '未指定'}
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

                {order.status === 'reported' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">鉴定机构：</span>
                      <span className="text-gray-800">{order.report_agency || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">鉴定结论：</span>
                      <span className={"font-medium " + getConclusionColor(order.report_score)}>
                        {order.report_conclusion || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">鉴定评分：</span>
                      <span className="font-medium text-luxury-gold">{order.report_score ?? '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-luxury-gold text-xs font-medium">
                        查看报告详情 →
                      </span>
                    </div>
                  </div>
                )}

                {order.risk_flag && (
                  <div className={"mt-3 p-3 rounded-lg text-sm " + getRiskColorClass(order.risk_flag)}>
                    ⚠️ 风险等级：{getRiskText(order.risk_flag)}
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
