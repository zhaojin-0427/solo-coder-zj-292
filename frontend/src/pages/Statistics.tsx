import { useState, useEffect } from 'react'
import { BarChart3, Package, DollarSign, TrendingUp, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react'
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

  const pieData = stats.brand_distribution.map(b => ({
    name: b.brand,
    value: b.count
  }))

  const barData = stats.maintenance_cost_by_type.map(t => ({
    name: t.type,
    费用: t.total_cost,
    次数: t.count
  }))

  const lineData = stats.value_retention_period.map(v => ({
    name: v.period,
    平均保值率: v.avg_retention
  }))

  const problemData = stats.common_problem_parts.map(p => ({
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <p className="text-sm text-gray-500">保养成本占比</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.maintenance_cost_ratio || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <PieChartIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            购入总价 ¥{stats.total_purchase_price.toLocaleString()}
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

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>小贴士：</strong>定期保养可以有效延长包包使用寿命，建议每3-6个月进行一次基础清洁护理。
          对于高频磨损部位，可以提前做好防护措施，减少保养成本。
        </p>
      </div>
    </div>
  )
}
