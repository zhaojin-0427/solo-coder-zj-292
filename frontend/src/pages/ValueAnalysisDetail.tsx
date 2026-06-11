import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar,
  Wrench, ShieldAlert, Store, Target, AlertTriangle, Settings,
  BarChart3, Clock, CheckCircle2
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { valueMonitorAPI } from '../api'
import { ValueAnalysis, ValueHistoryItem, ValueMonitor } from '../types'
import ValueMonitorModal from '../components/ValueMonitorModal'

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200', dot: 'bg-green-500' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-500' },
  red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', dot: 'bg-purple-500' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-500' },
}

const TREND_MAP: Record<string, { label: string; color: string }> = {
  up: { label: '上涨趋势', color: 'text-green-500' },
  stable: { label: '稳定', color: 'text-blue-500' },
  down: { label: '下跌趋势', color: 'text-red-500' },
}

export default function ValueAnalysisDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<ValueAnalysis | null>(null)
  const [monitor, setMonitor] = useState<ValueMonitor | null>(null)
  const [history, setHistory] = useState<ValueHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showMonitorModal, setShowMonitorModal] = useState(false)
  const [bag, setBag] = useState<any>(null)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [analysisRes, monitorRes, historyRes] = await Promise.all([
        valueMonitorAPI.getAnalysis(Number(id)),
        valueMonitorAPI.getMonitorByBag(Number(id)),
        valueMonitorAPI.getValueHistory(Number(id), 30),
      ])
      setAnalysis(analysisRes.data)
      setMonitor(monitorRes.data)
      setHistory(historyRes.data)
      setBag({
        id: Number(id),
        brand: analysisRes.data.bag_brand,
        model: analysisRes.data.bag_model,
        purchase_price: analysisRes.data.purchase_price,
      })
    } catch (error) {
      console.error('加载分析数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  if (!analysis) {
    return <div className="text-center py-12 text-gray-500">数据加载失败</div>
  }

  const statusInfo = STATUS_COLOR_MAP[analysis.status_color] || STATUS_COLOR_MAP.gray
  const trendInfo = analysis.market_price_trend ? TREND_MAP[analysis.market_price_trend] : null

  const chartData = history.map(h => ({
    date: h.record_date.slice(5),
    value: h.estimated_value,
  }))

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/value-alerts" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-luxury-black">
            {analysis.bag_brand} {analysis.bag_model}
          </h2>
          <p className="text-sm text-gray-500 mt-1">保值分析详情</p>
        </div>
        <button
          onClick={() => navigate(`/bags/${id}`)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          返回包包详情
        </button>
        {monitor && (
          <button
            onClick={() => setShowMonitorModal(true)}
            className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90"
          >
            <Settings className="w-4 h-4" />
            监控设置
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 card-shadow mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full ${statusInfo.bg} flex items-center justify-center`}>
              {analysis.value_change_percent != null && analysis.value_change_percent >= 0 ? (
                <TrendingUp className={`w-8 h-8 ${statusInfo.text}`} />
              ) : (
                <TrendingDown className={`w-8 h-8 ${statusInfo.text}`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-800">保值状态</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                  {analysis.status_label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                持有 {analysis.hold_days} 天
                {trendInfo && (
                  <span className={`ml-3 ${trendInfo.color}`}>
                    市场行情：{trendInfo.label}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-luxury-cream rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">购入价格</span>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {analysis.purchase_price ? `¥${analysis.purchase_price.toLocaleString()}` : '-'}
            </p>
          </div>
          <div className="p-4 bg-luxury-cream rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">当前估值</span>
            </div>
            <p className="text-lg font-bold text-luxury-gold">
              {analysis.current_value ? `¥${analysis.current_value.toLocaleString()}` : '-'}
            </p>
          </div>
          <div className="p-4 bg-luxury-cream rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">价值变动</span>
            </div>
            <p className={`text-lg font-bold ${
              analysis.value_change_percent != null && analysis.value_change_percent >= 0
                ? 'text-green-600'
                : analysis.value_change_percent != null
                  ? 'text-red-500'
                  : 'text-gray-400'
            }`}>
              {analysis.value_change_percent != null
                ? `${analysis.value_change_percent >= 0 ? '+' : ''}${analysis.value_change_percent}%`
                : '-'}
            </p>
          </div>
          <div className="p-4 bg-luxury-cream rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">累计保养</span>
            </div>
            <p className="text-lg font-bold text-gray-800">
              ¥{analysis.total_maintenance_cost.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">浮动盈亏</p>
            <p className={`text-base font-semibold ${
              analysis.net_profit != null && analysis.net_profit >= 0
                ? 'text-green-600'
                : analysis.net_profit != null
                  ? 'text-red-500'
                  : 'text-gray-400'
            }`}>
              {analysis.net_profit != null
                ? `${analysis.net_profit >= 0 ? '+' : ''}¥${analysis.net_profit.toLocaleString()}`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">持有收益率</p>
            <p className={`text-base font-semibold ${
              analysis.profit_rate != null && analysis.profit_rate >= 0
                ? 'text-green-600'
                : analysis.profit_rate != null
                  ? 'text-red-500'
                  : 'text-gray-400'
            }`}>
              {analysis.profit_rate != null
                ? `${analysis.profit_rate >= 0 ? '+' : ''}${analysis.profit_rate}%`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">历史成交</p>
            <p className="text-base font-semibold text-gray-800">
              {analysis.consignment_sold_count} 次
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">平均成交周期</p>
            <p className="text-base font-semibold text-gray-800">
              {analysis.avg_sell_cycle ? `${analysis.avg_sell_cycle} 天` : '-'}
            </p>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl p-6 card-shadow mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">近30天价值趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, '估值']}
                />
                {monitor?.stop_loss_price && (
                  <ReferenceLine y={monitor.stop_loss_price} stroke="#F43F5E" strokeDasharray="5 5" label="止损线" />
                )}
                {monitor?.target_sell_price && (
                  <ReferenceLine y={monitor.target_sell_price} stroke="#10B981" strokeDasharray="5 5" label="目标线" />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#C9A962"
                  strokeWidth={2}
                  dot={{ fill: '#C9A962', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            换手建议
          </h3>
          <div className="space-y-3">
            {analysis.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-luxury-cream rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusInfo.dot}`} />
                <p className="text-sm text-gray-600">{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            监控指标
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">止损价</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-red-500">
                  {monitor?.stop_loss_price ? `¥${monitor.stop_loss_price.toLocaleString()}` : '未设置'}
                </p>
                {analysis.is_stop_loss_triggered && (
                  <p className="text-xs text-red-500 mt-0.5">已触发</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">目标价</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">
                  {monitor?.target_sell_price ? `¥${monitor.target_sell_price.toLocaleString()}` : '未设置'}
                </p>
                {analysis.is_target_reached && (
                  <p className="text-xs text-green-500 mt-0.5">已达成</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">计划持有周期</span>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {monitor?.planned_hold_months ? `${monitor.planned_hold_months} 个月` : '未设置'}
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">关注平台</span>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {monitor?.follow_platforms || '未设置'}
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-600">鉴定风险</span>
              </div>
              <span className={`text-sm font-medium ${
                analysis.auth_risk_level === 'high' ? 'text-red-500' :
                analysis.auth_risk_level === 'medium' ? 'text-yellow-600' :
                analysis.auth_risk_level === 'low' ? 'text-green-600' :
                'text-gray-500'
              }`}>
                {analysis.auth_risk_level === 'high' ? '高风险' :
                 analysis.auth_risk_level === 'medium' ? '中风险' :
                 analysis.auth_risk_level === 'low' ? '低风险' : '暂无数据'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-luxury-gold to-amber-500 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">快速操作</h3>
            <p className="text-sm text-white/80 mb-4">
              基于当前分析，您可以采取以下行动
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/bags/${id}?tab=consignment`)}
                className="px-5 py-2.5 bg-white text-luxury-gold rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
              >
                创建寄售单
              </button>
              <button
                onClick={() => navigate(`/bags/${id}?tab=appraisal`)}
                className="px-5 py-2.5 bg-white/20 text-white border border-white/30 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              >
                发起鉴定委托
              </button>
            </div>
          </div>
          <CheckCircle2 className="w-12 h-12 text-white/30" />
        </div>
      </div>

      {showMonitorModal && bag && (
        <ValueMonitorModal
          bagId={Number(id)}
          bag={bag}
          existingMonitor={monitor}
          onClose={() => setShowMonitorModal(false)}
          onSuccess={(newMonitor) => {
            setShowMonitorModal(false)
            setMonitor(newMonitor)
            loadData()
            alert('监控设置已更新')
          }}
        />
      )}
    </div>
  )
}
