import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Filter, Package } from 'lucide-react'
import { bagAPI } from '../api'
import { Bag } from '../types'
import BagModal from '../components/BagModal'

export default function BagArchive() {
  const [bags, setBags] = useState<Bag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterBrand, setFilterBrand] = useState('')

  const loadBags = async () => {
    setLoading(true)
    try {
      const res = await bagAPI.getBags(filterBrand || undefined)
      setBags(res.data)
    } catch (error) {
      console.error('加载包包列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBags()
  }, [filterBrand])

  const brands = [...new Set(bags.map(b => b.brand))]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-luxury-black">包包档案</h2>
          <p className="text-gray-500 text-sm mt-1">共 {bags.length} 件藏品</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          录入新包
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 card-shadow">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
          >
            <option value="">全部品牌</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : bags.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center card-shadow">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">还没有录入包包</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-luxury-gold hover:underline text-sm"
          >
            立即录入第一个包包
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bags.map((bag) => (
            <Link
              key={bag.id}
              to={`/bags/${bag.id}`}
              className="bg-white rounded-xl overflow-hidden card-shadow hover:shadow-lg transition-shadow"
            >
              <div className="h-40 bg-gradient-to-br from-luxury-cream to-gray-100 flex items-center justify-center">
                <Package className="w-16 h-16 text-luxury-gold opacity-50" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-luxury-black">{bag.brand}</h3>
                    <p className="text-sm text-gray-600">{bag.model}</p>
                  </div>
                  <span className="px-2 py-1 bg-luxury-cream text-luxury-goldDark text-xs rounded-full">
                    {bag.condition || '待评估'}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {bag.purchase_date || '日期未记录'}
                  </span>
                  {bag.purchase_price && (
                    <span className="font-medium text-luxury-gold">
                      ¥{bag.purchase_price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <BagModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadBags()
          }}
        />
      )}
    </div>
  )
}
