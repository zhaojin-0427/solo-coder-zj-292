import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit3, Trash2, Upload, Camera, ShieldCheck, Wrench, FileText, Plus } from 'lucide-react'
import { bagAPI, authAPI, maintenanceAPI } from '../api'
import { BagDetail as BagDetailType, AuthResult } from '../types'
import BagModal from '../components/BagModal'
import MaintenanceModal from '../components/MaintenanceModal'

export default function BagDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [bag, setBag] = useState<BagDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [authResult, setAuthResult] = useState<AuthResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'auth' | 'maintenance'>('info')

  const loadBag = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await bagAPI.getBag(Number(id))
      setBag(res.data)
    } catch (error) {
      console.error('加载包包详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBag()
  }, [id])

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这个包包档案吗？')) return
    try {
      await bagAPI.deleteBag(Number(id))
      navigate('/')
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleAnalyze = async () => {
    if (!id) return
    setAnalyzing(true)
    try {
      const res = await authAPI.analyzeBag(Number(id))
      setAuthResult(res.data)
    } catch (error) {
      console.error('鉴定分析失败', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUploadAuthImage = async (imageType: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file || !id) return
      try {
        await bagAPI.uploadAuthImage(Number(id), imageType, file)
        loadBag()
      } catch (error) {
        console.error('上传失败', error)
      }
    }
    input.click()
  }

  const handleUploadPurchaseProof = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file || !id) return
      try {
        await bagAPI.uploadPurchaseProof(Number(id), file)
        loadBag()
      } catch (error) {
        console.error('上传失败', error)
      }
    }
    input.click()
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  if (!bag) {
    return <div className="text-center py-12 text-gray-500">包包不存在</div>
  }

  const authImageTypes = ['五金刻字', '内标走线', '防尘袋烫金']

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-luxury-black">{bag.brand} {bag.model}</h2>
          <p className="text-sm text-gray-500 mt-1">{bag.style || '款式未记录'}</p>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          <Edit3 className="w-4 h-4" />
          编辑
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 text-red-500 border border-red-200 rounded-lg text-sm hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          删除
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { key: 'info', label: '基本信息', icon: FileText },
          { key: 'auth', label: '鉴定记录', icon: ShieldCheck },
          { key: 'maintenance', label: '保养记录', icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-luxury-gold text-luxury-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-luxury-gold" />
              基本信息
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { label: '品牌', value: bag.brand },
                { label: '型号', value: bag.model },
                { label: '款式', value: bag.style },
                { label: '颜色', value: bag.color },
                { label: '材质', value: bag.material },
                { label: '尺寸', value: bag.size },
                { label: '成色', value: bag.condition },
                { label: '序列号', value: bag.serial_number },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-800">{item.value || '未记录'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-luxury-gold" />
              购买信息
            </h3>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">购买日期</span>
                <span className="text-gray-800">{bag.purchase_date || '未记录'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">购入价格</span>
                <span className="text-luxury-gold font-medium">
                  {bag.purchase_price ? `¥${bag.purchase_price.toLocaleString()}` : '未记录'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">当前估值</span>
                <span className="text-luxury-gold font-medium">
                  {bag.current_value ? `¥${bag.current_value.toLocaleString()}` : '未记录'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">购买渠道</span>
                <span className="text-gray-800">{bag.purchase_channel || '未记录'}</span>
              </div>
            </div>
            <button
              onClick={handleUploadPurchaseProof}
              className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-luxury-gold hover:text-luxury-gold flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              上传购买凭证 ({bag.purchase_proof_images.length}张)
            </button>
            {bag.purchase_proof_images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {bag.purchase_proof_images.map((img) => (
                  <div key={img.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img src={img.image_path} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {bag.notes && (
            <div className="bg-white rounded-xl p-6 card-shadow lg:col-span-2">
              <h3 className="font-semibold mb-2">备注</h3>
              <p className="text-sm text-gray-600">{bag.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'auth' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-luxury-gold" />
                自鉴分析
              </h3>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 luxury-gradient text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {analyzing ? '分析中...' : '开始自鉴分析'}
              </button>
            </div>

            {authResult && (
              <div className="mb-6 p-4 bg-luxury-cream rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                    authResult.score >= 80 ? 'bg-green-100 text-green-600' :
                    authResult.score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {authResult.score}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{authResult.level}</p>
                    <p className="text-sm text-gray-500">{authResult.suggestion}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {authResult.details.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${
                        d.status === '已上传' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-gray-700">{d.type}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-gray-500">{d.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {authImageTypes.map((type) => {
                const images = bag.authentication_images.filter(img => img.image_type === type)
                return (
                  <div key={type} className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-medium text-sm mb-3">{type}</h4>
                    {images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {images.map((img) => (
                          <div key={img.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img src={img.image_path} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                        <Camera className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <button
                      onClick={() => handleUploadAuthImage(type)}
                      className="w-full py-2 text-sm text-luxury-gold border border-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-white transition-colors"
                    >
                      {images.length > 0 ? '继续上传' : '上传照片'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="font-semibold mb-4">鉴定指引</h3>
            <p className="text-sm text-gray-500 mb-4">前往鉴定指引页面，查看{bag.brand}品牌的详细鉴定特征</p>
            <Link
              to={`/auth-guide?brand=${encodeURIComponent(bag.brand)}`}
              className="text-sm text-luxury-gold hover:underline"
            >
              查看{bag.brand}鉴定要点 →
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowMaintenanceModal(true)}
              className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              添加保养记录
            </button>
          </div>

          {bag.maintenance_records.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center card-shadow">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">暂无保养记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bag.maintenance_records.map((record) => (
                <div key={record.id} className="bg-white rounded-xl p-4 card-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-luxury-cream rounded-full flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-luxury-gold" />
                      </div>
                      <div>
                        <p className="font-medium">{record.service_type}</p>
                        <p className="text-sm text-gray-500">{record.service_date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-luxury-gold">
                        ¥{record.cost?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                  {record.service_items && (
                    <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                      服务项目：{record.service_items}
                    </p>
                  )}
                  {record.service_provider && (
                    <p className="text-sm text-gray-500 mt-1">
                      服务商：{record.service_provider}
                    </p>
                  )}
                  {(record.before_photo || record.after_photo) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">前后对比</p>
                      <div className="grid grid-cols-2 gap-3">
                        {record.before_photo ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">保养前</p>
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img src={record.before_photo} alt="保养前" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        ) : null}
                        {record.after_photo ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">保养后</p>
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img src={record.after_photo} alt="保养后" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                  {record.notes && (
                    <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      备注：{record.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEditModal && (
        <BagModal
          initialData={bag}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            loadBag()
          }}
        />
      )}

      {showMaintenanceModal && (
        <MaintenanceModal
          bagId={Number(id)}
          onClose={() => setShowMaintenanceModal(false)}
          onSuccess={() => {
            setShowMaintenanceModal(false)
            loadBag()
          }}
        />
      )}
    </div>
  )
}
