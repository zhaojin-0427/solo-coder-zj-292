import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wrench, Filter, Calendar, DollarSign, Package } from 'lucide-react'
import { bagAPI, maintenanceAPI } from '../api'
import { Bag, MaintenanceRecord } from '../types'

export default function Maintenance() {
  const [bags, setBags] = useState<Bag[]>([])
  const [selectedBagId, setSelectedBagId] = useState<number | null>(null)
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [allRecords, setAllRecords] = useState<{ bag: Bag; record: MaintenanceRecord }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBags()
  }, [])

  useEffect(() => {
    if (bags.length > 0) {
      loadAllRecords()
    }
  }, [bags])

  useEffect(() => {
    if (selectedBagId) {
      loadRecords(selectedBagId)
    }
  }, [selectedBagId])

  const loadBags = async () => {
    try {
      const res = await bagAPI.getBags()
      setBags(res.data)
    } catch (error) {
      console.error('加载包包列表失败', error)
    }
  }

  const loadAllRecords = async () => {
    setLoading(true)
    try {
      const all: { bag: Bag; record: MaintenanceRecord }[] = []
      for (const bag of bags) {
        const res = await maintenanceAPI.getRecords(bag.id)
        res.data.forEach((record: MaintenanceRecord) => {
          all.push({ bag, record })
        })
      }
      all.sort((a, b) => new Date(b.record.service_date).getTime() - new Date(a.record.service_date).getTime())
      setAllRecords(all)
    } catch (error) {
      console.error('加载保养记录失败', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecords = async (bagId: number) => {
    setLoading(true)
    try {
      const res = await maintenanceAPI.getRecords(bagId)
      setRecords(res.data)
    } catch (error) {
      console.error('加载保养记录失败', error)
    } finally {
      setLoading(false)
    }
  }

  const displayRecords = selectedBagId ? records.map(r => {
    const bag = bags.find(b => b.id === selectedBagId)
    return { bag: bag!, record: r }
  }) : allRecords

  const totalCost = displayRecords.reduce((sum, item) => sum + (item.record.cost || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-luxury-black flex items-center gap-3">
          <Wrench className="w-7 h-7 text-luxury-gold" />
          保养记录
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          记录每一次保养，让爱包常新
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{displayRecords.length}</p>
              <p className="text-xs text-gray-500">保养次数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">¥{totalCost.toLocaleString()}</p>
              <p className="text-xs text-gray-500">累计保养费用</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{bags.length}</p>
              <p className="text-xs text-gray-500">在养包包</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 card-shadow">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedBagId || ''}
            onChange={(e) => setSelectedBagId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
          >
            <option value="">全部包包</option>
            {bags.map(bag => (
              <option key={bag.id} value={bag.id}>
                {bag.brand} {bag.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : displayRecords.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center card-shadow">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">暂无保养记录</p>
          <p className="text-sm text-gray-400 mb-4">选择一个包包开始记录保养吧</p>
          {bags.length > 0 && (
            <Link
              to={`/bags/${bags[0].id}`}
              className="text-luxury-gold text-sm hover:underline"
            >
              去包包详情页添加保养记录 →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayRecords.map(({ bag, record }) => (
            <Link
              key={record.id}
              to={`/bags/${bag.id}`}
              className="block bg-white rounded-xl p-4 card-shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-luxury-cream rounded-xl flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-luxury-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{record.service_type}</p>
                    <p className="text-sm text-gray-500">
                      {bag.brand} {bag.model}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{record.service_date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-luxury-gold">
                    ¥{record.cost?.toLocaleString() || 0}
                  </p>
                  {record.service_provider && (
                    <p className="text-xs text-gray-400 mt-0.5">{record.service_provider}</p>
                  )}
                </div>
              </div>
              {record.service_items && (
                <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  {record.service_items}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
