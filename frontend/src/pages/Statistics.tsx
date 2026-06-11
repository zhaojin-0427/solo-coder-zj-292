import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Package, DollarSign, TrendingUp, AlertTriangle, PieChart as PieChartIcon, FileBadge, Clock, ShieldAlert, Store, Percent, Calendar, ArrowDownToLine, Bell, Target, HeartPulse, TrendingDown } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'
import { statsAPI } from '../api'
import { StatsData } from '../types'

const COLORS = ['#C9A962', '#A88B3D', '#D4B86A', '#E8D5A0', '#B8956E', '#8B7355']

export default function Statistics() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await statsAPI.getStats()
      setStats(res.data)
    } catch (error) {
      console.error('加载统计数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-500">暂无数据</div>
  }

  const pieData = (stats.brand_distribution || []).map(b => ({
    name: b.brand,
    value: b.count
  }))

  const barData = (stats.maintenance_cost_by_type || []).map(t => ({
    name: t.type,
    费用: t.total_cost,
    次数: t.count
  }))

  const lineData = (stats.value_retention_period || []).map(v => ({
    name: v.period,
    平均保值率: v.avg_retention
  }))

  const problemData = (stats.common_problem_parts || []).map(p => ({
    name: p.part,
    count: p.count
  }))

  const maintenanceCostRatio = stats.total_bags > 0
    ? stats.total_maintenance_cost / stats.total_bags
    : 0

  const costRatioData = stats.total_purchase_price > 0 ? [
    { name: '购入总价', value: stats.total_purchase_price },
    { name: '保养费用', value: stats.total_maintenance_cost },
  ] : []

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-luxury-black flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-luxury-gold" />
          数据统计
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          全方位了解您的奢侈品收藏与养护状况
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">收藏总数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total_bags}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">共 {stats.total_brands} 个品牌</p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">累计保养费用</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ¥{stats.total_maintenance_cost.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            平均每件 ¥{maintenanceCostRatio.toFixed(0)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均保值率</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.avg_retention_rate || '--'}%
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">基于当前估值计算</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-luxury-gold">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">鉴定委托次数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.total_appraisal_orders}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileBadge className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">第三方专业鉴定委托总量</p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-indigo-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均出报告时长</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.avg_report_days !== undefined && stats.avg_report_days !== null ? stats.avg_report_days : '--'} <span className="text-base font-normal text-gray-500">天</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {stats.total_appraisal_orders === 0 ? '暂无报告数据' :
             stats.avg_report_days <= 3 ? '效率优秀 ⚡' :
             stats.avg_report_days <= 5 ? '效率正常' : '建议选择加急服务'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-rose-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">疑似风险品牌数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.brand_risk_distribution.filter(b => b.risk_ratio > 0).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            共检测 {stats.brand_risk_distribution.length} 个品牌鉴定结果
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="font-semibold text-gray-800 mb-4">品牌持有量分布</h3>
          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              暂无数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="font-semibold text-gray-800 mb-4">保养费用分布</h3>
          {barData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              暂无数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="费用" fill="#C9A962" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="次数" fill="#E8D5A0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="font-semibold text-gray-800 mb-4">平均保值周期</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(value: number) => [`${value}%`, '平均保值率']} />
              <Line
                type="monotone"
                dataKey="平均保值率"
                stroke="#C9A962"
                strokeWidth={2}
                dot={{ fill: '#C9A962', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="font-semibold text-gray-800 mb-4">保养成本占购入总价比例</h3>
          {costRatioData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              暂无数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={costRatioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  <Cell fill="#D4B86A" />
                  <Cell fill="#E8D5A0" />
                </Pie>
                <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="font-semibold text-gray-800 mb-4">高频问题部位</h3>
          <div className="space-y-4">
            {stats.common_problem_parts.map((part, index) => (
              <div key={part.part}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                      index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                    {part.part}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{part.count} 次</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-luxury-gold to-luxury-goldDark rounded-full transition-all"
                    style={{
                      width: `${(part.count / stats.common_problem_parts[0].count) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  常见问题：{part.issues.join('、')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.brand_risk_distribution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              各品牌疑似风险占比
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.brand_risk_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
                <YAxis dataKey="brand" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} />
                <Legend />
                <Bar dataKey="high_ratio" name="高风险" fill="#F43F5E" radius={[0, 4, 4, 0]} stackId="a" />
                <Bar dataKey="medium_ratio" name="中风险" fill="#F59E0B" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="low_ratio" name="低风险" fill="#10B981" radius={[4, 0, 0, 4]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              品牌风险排行榜
            </h3>
            <div className="space-y-4">
              {stats.brand_risk_distribution.slice(0, 6).map((brand, index) => (
                <div key={brand.brand}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium ${
                        index === 0 ? 'bg-red-500' :
                        index === 1 ? 'bg-orange-500' :
                        index === 2 ? 'bg-amber-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      {brand.brand}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        样本 {brand.total} 件
                      </span>
                      <span className={`text-sm font-bold ${
                        brand.risk_ratio >= 50 ? 'text-red-600' :
                        brand.risk_ratio >= 25 ? 'text-orange-600' :
                        brand.risk_ratio > 0 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        风险值 {brand.risk_ratio}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all ${
                        brand.risk_ratio >= 50 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                        brand.risk_ratio >= 25 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                        brand.risk_ratio > 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                        'bg-gradient-to-r from-green-400 to-green-500'
                      }`}
                      style={{ width: `${Math.max(brand.risk_ratio, 2)}%` }}
                    />
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                    {brand.high_count > 0 && (
                      <span className="text-red-600">高风险 {brand.high_count}件</span>
                    )}
                    {brand.medium_count > 0 && (
                      <span className="text-orange-600">中风险 {brand.medium_count}件</span>
                    )}
                    {brand.low_count > 0 && (
                      <span className="text-green-600">低风险 {brand.low_count}件</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-luxury-black flex items-center gap-3 mb-4">
          <Store className="w-6 h-6 text-luxury-gold" />
          寄售数据统计
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-luxury-gold">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">寄售总数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.total_consignments}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-purple-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">成交率</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.consignment_sell_rate}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均成交周期</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.avg_sell_cycle} <span className="text-base font-normal text-gray-500">天</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均让价幅度</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.avg_price_reduction}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">各平台成交金额</p>
              <p className="text-lg font-bold text-gray-800 mt-1">
                {stats.platform_revenue_distribution.length} 个平台
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {stats.platform_revenue_distribution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4">各平台成交金额占比</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.platform_revenue_distribution.map(p => ({
                    name: p.platform,
                    value: p.amount
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.platform_revenue_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '成交金额']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4">各平台成交金额明细</h3>
            <div className="space-y-4">
              {stats.platform_revenue_distribution.map((item, index) => {
                const total = stats.platform_revenue_distribution.reduce((s, i) => s + i.amount, 0)
                const percent = total > 0 ? (item.amount / total * 100).toFixed(1) : '0'
                return (
                  <div key={item.platform}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700 flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium ${
                          index === 0 ? 'bg-luxury-gold' :
                          index === 1 ? 'bg-amber-500' :
                          index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                        {item.platform}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{percent}%</span>
                        <span className="text-sm font-bold text-gray-800">
                          ¥{item.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-luxury-gold to-luxury-goldDark rounded-full transition-all"
                        style={{ width: `${Number(percent)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 mt-8">
        <h3 className="text-xl font-bold text-luxury-black flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-luxury-gold" />
          保值监控统计
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-luxury-gold">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">监控中包包</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.monitored_bags_count}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            开启保值监控的包包数量
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-red-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">触发预警数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.alert_bags_count}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            需要关注的预警包包数
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均持有收益率</p>
              <p className={`text-2xl font-bold mt-1 ${
                stats.avg_hold_return_rate >= 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {stats.avg_hold_return_rate >= 0 ? '+' : ''}{stats.avg_hold_return_rate}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            监控包包的平均收益
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">建议换手数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.suggest_sell_count}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            达到卖出条件的包包数
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {(stats.brand_health || []).length > 0 && (
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              各品牌保值健康度
            </h3>
            <div className="space-y-4">
              {(stats.brand_health || []).slice(0, 6).map((brand, index) => (
                <div key={brand.brand}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium ${
                        index === 0 ? 'bg-green-500' :
                        index === 1 ? 'bg-emerald-500' :
                        index === 2 ? 'bg-yellow-500' :
                        index === 3 ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      {brand.brand}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {brand.total} 件
                      </span>
                      <span className={`text-sm font-bold ${
                        brand.health_score >= 80 ? 'text-green-600' :
                        brand.health_score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        健康度 {brand.health_score}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all ${
                        brand.health_score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                        brand.health_score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      style={{ width: `${Math.max(brand.health_score, 5)}%` }}
                    />
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="text-green-600">健康 {brand.healthy}件</span>
                    <span className="text-yellow-600">关注 {brand.warning}件</span>
                    <span className="text-red-600">预警 {brand.danger}件</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(stats.value_trend_30d || []).length > 0 && (
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-luxury-gold" />
              近30天价值波动趋势
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.value_trend_30d || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={5} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '总估值']}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_value"
                    stroke="#C9A962"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#C9A962' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              监控包包的总估值走势
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end mb-6">
        <Link
          to="/value-alerts"
          className="inline-flex items-center gap-2 px-5 py-2.5 luxury-gradient text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          <Bell className="w-4 h-4" />
          查看全部保值预警
        </Link>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>小贴士：</strong>定期保养可以有效延长包包使用寿命，建议每3-6个月进行一次基础清洁护理。
          对于高频磨损部位，可以提前做好防护措施，减少保养成本。
        </p>
      </div>
    </div>
  )
}
