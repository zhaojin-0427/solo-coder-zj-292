import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, AlertTriangle, TrendingDown, Target, ShieldAlert, Filter, BarChart3 } from 'lucide-react'
import { valueMonitorAPI } from '../api'
import { ValueMonitorListItem, ValueAlertItem } from '../types'

const ALERT_ICON_MAP: Record<string, any> = {
  stop_loss: TrendingDown,
  target_reached: Target,
  mild_decline: TrendingDown,
  auth_risk: ShieldAlert,
}

const ALERT_LEVEL_MAP: Record<string, { bg: string; text: string; iconBg: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', iconBg: 'bg-yellow-100' },
  success: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
}

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
}

export default function ValueAlertList() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'alerts' | 'monitors'>('alerts')
  const [alerts, setAlerts] = useState<ValueAlertItem[]>([])
  const [monitors, setMonitors] = useState<ValueMonitorListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const loadAlerts = async () => {
    try {
      const res = await valueMonitorAPI.getAlerts()
      setAlerts(res.data)
    } catch (error) {
      console.error('加载预警列表失败', error)
    }
  }

  const loadMonitors = async (status?: string) => {
    setLoading(true)
    try {
      const res = await valueMonitorAPI.getMonitorList(
        status === 'all' ? undefined : status
      )
      setMonitors(res.data)
    } catch (error) {
      console.error('加载监控列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'alerts') {
      loadAlerts()
    } else {
      loadMonitors(filterStatus)
    }
  }, [activeTab, filterStatus])

  const getAlertTypeName = (type: string) => {
    const map: Record<string, string> = {
      stop_loss: '止损预警',
      target_reached: '目标达成',
      mild_decline: '轻度下滑',
      auth_risk: '鉴定风险',
    }
    return map[type] || type
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-luxury-black flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-luxury-gold" />
          保值预警与换手建议
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          实时监控包包价值变化，智能提供换手建议
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'luxury-gradient text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            预警提醒
            {alerts.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {alerts.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('monitors')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'monitors'
              ? 'luxury-gradient text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            全部监控
          </div>
        </button>
      </div>

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center card-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-gray-700 font-medium mb-2">暂无预警</p>
              <p className="text-sm text-gray-400">
                所有监控中的包包状态良好，继续保持关注
              </p>
            </div>
          ) : (
            alerts.map((alert, index) => {
              const levelInfo = ALERT_LEVEL_MAP[alert.alert_level]
              const AlertIcon = ALERT_ICON_MAP[alert.alert_type] || AlertTriangle
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-5 card-shadow cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                    alert.alert_level === 'high' ? 'border-l-red-500' :
                    alert.alert_level === 'medium' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  }`}
                  onClick={() => navigate(`/value-analysis/${alert.bag_id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${levelInfo?.iconBg || 'bg-gray-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <AlertIcon className={`w-6 h-6 ${levelInfo?.text || 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800">
                          {alert.bag_brand} {alert.bag_model}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${levelInfo?.bg || 'bg-gray-100'} ${levelInfo?.text || 'text-gray-600'}`}>
                          {getAlertTypeName(alert.alert_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      {alert.current_value !== undefined && alert.threshold_value !== undefined && (
                        <div className="mt-3 flex gap-6 text-xs">
                          <span className="text-gray-500">
                            当前估值：<span className="text-luxury-gold font-medium">¥{alert.current_value.toLocaleString()}</span>
                          </span>
                          <span className="text-gray-500">
                            阈值：<span className="font-medium">¥{alert.threshold_value.toLocaleString()}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'monitors' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            {['all', 'active', 'inactive'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-luxury-gold text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {status === 'all' ? '全部' : status === 'active' ? '监控中' : '已暂停'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : monitors.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center card-shadow">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">暂无监控包包</p>
              <p className="text-xs text-gray-400 mt-2">
                前往包包详情页开启保值监控
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {monitors.map(item => {
                const colorInfo = STATUS_COLOR_MAP[item.status_color]
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/value-analysis/${item.bag_id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-luxury-cream rounded-full flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-luxury-gold" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {item.bag_brand} {item.bag_model}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {item.is_active === 1 ? '监控中' : '已暂停'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${colorInfo?.bg || 'bg-gray-100'} ${colorInfo?.text || 'text-gray-600'}`}>
                          {item.status_label}
                        </span>
                        <p className="text-sm text-gray-700 mt-2">
                          {item.current_value ? `¥${item.current_value.toLocaleString()}` : '-'}
                          {item.value_change_percent != null && (
                            <span className={`ml-2 text-xs ${
                              item.value_change_percent >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {item.value_change_percent >= 0 ? '+' : ''}{item.value_change_percent}%
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {(item.stop_loss_price || item.target_sell_price) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
                        {item.stop_loss_price && (
                          <div>
                            <span className="text-gray-400">止损价：</span>
                            <span className="text-red-500 font-medium">¥{item.stop_loss_price.toLocaleString()}</span>
                          </div>
                        )}
                        {item.target_sell_price && (
                          <div>
                            <span className="text-gray-400">目标价：</span>
                            <span className="text-green-600 font-medium">¥{item.target_sell_price.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
