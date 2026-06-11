import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Search, Filter } from 'lucide-react'
import { statsAPI } from '../api'
import { MarketPrice } from '../types'

export default function Market() {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [allBrands, setAllBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBrand, setFilterBrand] = useState('')
  const [searchModel, setSearchModel] = useState('')

  useEffect(() => {
    loadPrices()
  }, [filterBrand])

  const loadPrices = async () => {
    setLoading(true)
    try {
      const res = await statsAPI.getMarketPrices(filterBrand || undefined)
      setPrices(res.data)
      if (!filterBrand) {
        const brands = [...new Set(res.data.map((p: MarketPrice) => p.brand))]
        setAllBrands(brands)
      }
    } catch (error) {
      console.error('加载行情数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrices = prices.filter(p =>
    p.model.toLowerCase().includes(searchModel.toLowerCase())
  )

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrendText = (trend?: string) => {
    switch (trend) {
      case 'up': return '上涨'
      case 'down': return '下跌'
      default: return '平稳'
    }
  }

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-green-600 bg-green-50'
      case 'down': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-luxury-black flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-luxury-gold" />
          行情追踪
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          热门款式二手行情参考，把握市场动态
        </p>
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 card-shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
            >
              <option value="">全部品牌</option>
              {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[250px] flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
              placeholder="搜索型号..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl card-shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">品牌</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">型号</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">公价</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">二手价</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">保值率</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-gray-600">走势</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPrices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无匹配的行情数据
                  </td>
                </tr>
              ) : (
                filteredPrices.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">{price.brand}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{price.model}</td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      ¥{price.new_price?.toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800">
                      ¥{price.second_hand_price?.toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${
                        (price.retention_rate || 0) >= 80 ? 'text-green-600' :
                        (price.retention_rate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {price.retention_rate?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getTrendColor(price.price_trend)}`}>
                        {getTrendIcon(price.price_trend)}
                        {getTrendText(price.price_trend)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>温馨提示：</strong>以上行情数据仅供参考，实际价格可能因包包成色、配件完整性、
          购买渠道等因素而有所浮动。建议多渠道对比价格后再做决策。
        </p>
      </div>
    </div>
  )
}
