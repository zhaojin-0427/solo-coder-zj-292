import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShieldCheck, Search, ChevronRight } from 'lucide-react'
import { authAPI } from '../api'
import { BrandFeature } from '../types'

export default function AuthGuide() {
  const [searchParams] = useSearchParams()
  const [features, setFeatures] = useState<BrandFeature[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [featureTypes, setFeatureTypes] = useState<string[]>([])
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '')
  const [selectedType, setSelectedType] = useState('')
  const [selectedFeature, setSelectedFeature] = useState<BrandFeature | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBrands()
    loadFeatureTypes()
  }, [])

  useEffect(() => {
    loadFeatures()
  }, [selectedBrand, selectedType])

  const loadBrands = async () => {
    try {
      const res = await authAPI.getBrands()
      setBrands(res.data)
    } catch (error) {
      console.error('加载品牌失败', error)
    }
  }

  const loadFeatureTypes = async () => {
    try {
      const res = await authAPI.getFeatureTypes()
      setFeatureTypes(res.data)
    } catch (error) {
      console.error('加载鉴定类型失败', error)
    }
  }

  const loadFeatures = async () => {
    setLoading(true)
    try {
      const res = await authAPI.getFeatures(
        selectedBrand || undefined,
        selectedType || undefined
      )
      setFeatures(res.data)
    } catch (error) {
      console.error('加载鉴定特征失败', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-luxury-black flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-luxury-gold" />
          鉴定指引
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          各大奢侈品品牌鉴定要点参考，助您快速识别真伪
        </p>
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 card-shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">品牌筛选</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
            >
              <option value="">全部品牌</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">鉴定部位</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
            >
              <option value="">全部部位</option>
              {featureTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl card-shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium text-sm">鉴定特征列表</h3>
              <p className="text-xs text-gray-500 mt-1">共 {features.length} 条</p>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-sm">加载中...</div>
            ) : features.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                暂无匹配的鉴定特征
              </div>
            ) : (
              <div className="divide-y">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setSelectedFeature(feature)}
                    className={`w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                      selectedFeature?.id === feature.id ? 'bg-luxury-cream' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{feature.brand}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{feature.title}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {feature.feature_type}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedFeature ? (
            <div className="bg-white rounded-xl card-shadow">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 luxury-gradient rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedFeature.title}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedFeature.brand} · {selectedFeature.feature_type}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">特征描述</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedFeature.description || '暂无描述'}
                  </p>
                </div>

                {selectedFeature.key_points && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">鉴定要点</h4>
                    <div className="bg-green-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {selectedFeature.key_points.split('\n').map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                            <span className="text-green-500 mt-0.5">✓</span>
                            {point.replace(/^\d+\.\s*/, '')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {selectedFeature.common_fakes && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">常见仿品特征</h4>
                    <div className="bg-red-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {selectedFeature.common_fakes.split('\n').map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                            <span className="text-red-500 mt-0.5">✕</span>
                            {point.replace(/^\d+\.\s*/, '')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>温馨提示：</strong>以上鉴定要点仅供参考，高仿品可能具有极高的仿真度。
                    建议您联系专业的第三方鉴定机构进行实物鉴定，以确保鉴定结果的准确性。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl card-shadow h-full flex items-center justify-center p-12">
              <div className="text-center">
                <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">请从左侧选择一个鉴定特征查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
