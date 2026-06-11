import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit3, Trash2, Upload, Camera, ShieldCheck, Wrench, FileText, Plus, FileBadge, Clock, CheckCircle2, AlertCircle, Eye, XCircle, Store, TrendingUp, Settings, BarChart3 } from 'lucide-react'
import { bagAPI, authAPI, maintenanceAPI, appraisalAPI, consignmentAPI, valueMonitorAPI } from '../api'
import { BagDetail as BagDetailType, AuthResult, AppraisalOrderDetail, AppraisalStatus, ConsignmentOrderDetail, ConsignmentStatus, ValueMonitor, ValueAnalysis } from '../types'
import BagModal from '../components/BagModal'
import MaintenanceModal from '../components/MaintenanceModal'
import AppraisalModal from '../components/AppraisalModal'
import ConsignmentModal from '../components/ConsignmentModal'
import ValueMonitorModal from '../components/ValueMonitorModal'

const STATUS_MAP: Record<AppraisalStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending_submit: { label: '待提交', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  pending_accept: { label: '待受理', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  appraising: { label: '鉴定中', color: 'text-orange-600', bg: 'bg-orange-100', icon: Eye },
  reported: { label: '已出报告', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'text-red-500', bg: 'bg-red-100', icon: XCircle },
}

const CONSIGNMENT_STATUS_MAP: Record<ConsignmentStatus, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: '草稿', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  pending_review: { label: '待审核', color: 'text-blue-600', bg: 'bg-blue-100', icon: Eye },
  listed: { label: '已上架', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  negotiating: { label: '议价中', color: 'text-orange-600', bg: 'bg-orange-100', icon: Store },
  sold: { label: '已成交', color: 'text-purple-600', bg: 'bg-purple-100', icon: CheckCircle2 },
  delisted: { label: '已下架', color: 'text-red-500', bg: 'bg-red-100', icon: XCircle },
}

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
}

export default function BagDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [bag, setBag] = useState<BagDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [showAppraisalModal, setShowAppraisalModal] = useState(false)
  const [showConsignmentModal, setShowConsignmentModal] = useState(false)
  const [showValueMonitorModal, setShowValueMonitorModal] = useState(false)
  const [authResult, setAuthResult] = useState<AuthResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [appraisalOrders, setAppraisalOrders] = useState<AppraisalOrderDetail[]>([])
  const [consignmentOrders, setConsignmentOrders] = useState<ConsignmentOrderDetail[]>([])
  const [valueMonitor, setValueMonitor] = useState<ValueMonitor | null>(null)
  const [valueAnalysis, setValueAnalysis] = useState<ValueAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'auth' | 'maintenance' | 'appraisal' | 'consignment' | 'value'>('info')

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

  const loadAppraisalOrders = async () => {
    if (!id) return
    try {
      const res = await appraisalAPI.getOrders({ bag_id: Number(id) })
      setAppraisalOrders(res.data)
    } catch (error) {
      console.error('加载委托记录失败', error)
    }
  }

  const loadConsignmentOrders = async () => {
    if (!id) return
    try {
      const res = await consignmentAPI.getOrders({ bag_id: Number(id) })
      setConsignmentOrders(res.data)
    } catch (error) {
      console.error('加载寄售记录失败', error)
    }
  }

  const loadValueMonitor = async () => {
    if (!id) return
    try {
      const res = await valueMonitorAPI.getMonitorByBag(Number(id))
      setValueMonitor(res.data)
    } catch (error) {
      console.error('加载保值监控失败', error)
    }
  }

  const loadValueAnalysis = async () => {
    if (!id) return
    try {
      const res = await valueMonitorAPI.getAnalysis(Number(id))
      setValueAnalysis(res.data)
    } catch (error) {
      console.error('加载保值分析失败', error)
    }
  }

  useEffect(() => {
    loadBag()
    loadAppraisalOrders()
    loadConsignmentOrders()
    loadValueMonitor()
    loadValueAnalysis()
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

      <div className="flex gap-1 mb-6 border-b border-gray-200 flex-wrap">
        {[
          { key: 'info', label: '基本信息', icon: FileText },
          { key: 'auth', label: '鉴定记录', icon: ShieldCheck },
          { key: 'appraisal', label: '鉴定委托', icon: FileBadge },
          { key: 'consignment', label: '寄售管理', icon: Store },
          { key: 'maintenance', label: '保养记录', icon: Wrench },
          { key: 'value', label: '保值监控', icon: TrendingUp },
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

      {activeTab === 'consignment' && bag && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowConsignmentModal(true)}
              className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              创建寄售单
            </button>
          </div>

          {consignmentOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center card-shadow">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">暂无寄售记录</p>
              <p className="text-xs text-gray-400 mb-4">
                一键创建寄售单，自动复用包包基础信息、购买凭证、鉴定点照片和专业鉴定报告
              </p>
              <button
                onClick={() => setShowConsignmentModal(true)}
                className="px-4 py-2 text-sm text-luxury-gold border border-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-white transition-colors"
              >
                立即创建寄售单
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {consignmentOrders.map((cOrder) => {
                const cStatusInfo = CONSIGNMENT_STATUS_MAP[cOrder.status]
                const CStatusIcon = cStatusInfo.icon
                return (
                  <div
                    key={cOrder.id}
                    className="bg-white rounded-xl p-4 card-shadow cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/consignments/${cOrder.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${cStatusInfo.bg} rounded-full flex items-center justify-center`}>
                          <CStatusIcon className={`w-5 h-5 ${cStatusInfo.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{cOrder.order_no}</p>
                          </div>
                          <p className="text-sm text-gray-500">
                            平台：{cOrder.platform || '未指定'}
                            {cOrder.expected_price && ` · 期望价：¥${cOrder.expected_price.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${cStatusInfo.bg} ${cStatusInfo.color}`}>
                          <CStatusIcon className="w-3 h-3" />
                          {cStatusInfo.label}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">
                          {cOrder.created_at.slice(0, 16).replace('T', ' ')}
                        </p>
                      </div>
                    </div>
                    {cOrder.status === 'sold' && cOrder.sold_price && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">成交价：</span>
                          <span className="font-medium text-purple-600">¥{cOrder.sold_price.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">平台佣金：</span>
                          <span className="text-gray-800">¥{cOrder.platform_commission?.toLocaleString() || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">实际到手：</span>
                          <span className="font-medium text-luxury-gold">¥{cOrder.actual_amount?.toLocaleString() || '-'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'appraisal' && bag && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAppraisalModal(true)}
              className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              发起鉴定委托
            </button>
          </div>

          {appraisalOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center card-shadow">
              <FileBadge className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">暂无鉴定委托记录</p>
              <p className="text-xs text-gray-400 mb-4">
                一键发起第三方专业鉴定，基于已上传的购买凭证、五金刻字、内标走线、防尘袋烫金照片
              </p>
              <button
                onClick={() => setShowAppraisalModal(true)}
                className="px-4 py-2 text-sm text-luxury-gold border border-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-white transition-colors"
              >
                立即发起委托
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appraisalOrders.map((order) => {
                const statusInfo = STATUS_MAP[order.status]
                const StatusIcon = statusInfo.icon
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-4 card-shadow cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/appraisals/${order.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${statusInfo.bg} rounded-full flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{order.order_no}</p>
                            {order.is_urgent === 1 && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">加急</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            期望机构：{order.expected_agency || '未指定'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">
                          {order.created_at.slice(0, 16).replace('T', ' ')}
                        </p>
                      </div>
                    </div>
                    {order.status === 'reported' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">鉴定机构：</span>
                          <span className="text-gray-800">{order.report_agency || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">鉴定结论：</span>
                          <span className={`font-medium ${
                            order.report_score && order.report_score >= 80 ? 'text-green-600' :
                            order.report_score && order.report_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>{order.report_conclusion || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">鉴定评分：</span>
                          <span className="font-medium text-luxury-gold">{order.report_score ?? '-'}</span>
                        </div>
                      </div>
                    )}
                    {(order.status === 'pending_submit' || order.status === 'pending_accept') && order.contact_name && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        联系人：{order.contact_name} {order.contact_phone}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'value' && bag && (
        <div className="space-y-6">
          {!valueMonitor ? (
            <div className="bg-white rounded-xl p-12 text-center card-shadow">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">暂未开启保值监控</p>
              <p className="text-xs text-gray-400 mb-6">
                开启保值监控后，系统将自动追踪包包价值变化，在达到止损价或目标价时提醒您
              </p>
              <button
                onClick={() => setShowValueMonitorModal(true)}
                className="px-6 py-2.5 luxury-gradient text-white rounded-lg text-sm hover:opacity-90"
              >
                开启保值监控
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    valueMonitor.is_active === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      valueMonitor.is_active === 1 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                    {valueMonitor.is_active === 1 ? '监控中' : '已暂停'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowValueMonitorModal(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    监控设置
                  </button>
                  <button
                    onClick={() => navigate(`/value-analysis/${bag.id}`)}
                    className="flex items-center gap-2 px-4 py-2 luxury-gradient text-white rounded-lg text-sm hover:opacity-90"
                  >
                    <BarChart3 className="w-4 h-4" />
                    查看分析
                  </button>
                </div>
              </div>

              {valueAnalysis && (
                <div className="bg-white rounded-xl p-6 card-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg">保值状态</h3>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                      STATUS_COLOR_MAP[valueAnalysis.status_color]?.bg || 'bg-gray-100'
                    } ${STATUS_COLOR_MAP[valueAnalysis.status_color]?.text || 'text-gray-600'}`}>
                      {valueAnalysis.status_label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-luxury-cream rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">购入价格</p>
                      <p className="text-lg font-bold text-gray-800">
                        {valueAnalysis.purchase_price ? `¥${valueAnalysis.purchase_price.toLocaleString()}` : '-'}
                      </p>
                    </div>
                    <div className="p-4 bg-luxury-cream rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">当前估值</p>
                      <p className="text-lg font-bold text-luxury-gold">
                        {valueAnalysis.current_value ? `¥${valueAnalysis.current_value.toLocaleString()}` : '-'}
                      </p>
                    </div>
                    <div className="p-4 bg-luxury-cream rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">价值变动</p>
                      <p className={`text-lg font-bold ${
                        valueAnalysis.value_change_percent != null && valueAnalysis.value_change_percent >= 0
                          ? 'text-green-600'
                          : valueAnalysis.value_change_percent != null
                            ? 'text-red-500'
                            : 'text-gray-400'
                      }`}>
                        {valueAnalysis.value_change_percent != null
                          ? `${valueAnalysis.value_change_percent >= 0 ? '+' : ''}${valueAnalysis.value_change_percent}%`
                          : '-'}
                      </p>
                    </div>
                    <div className="p-4 bg-luxury-cream rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">持有天数</p>
                      <p className="text-lg font-bold text-gray-800">
                        {valueAnalysis.hold_days} 天
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">换手建议</h4>
                    {valueAnalysis.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          valueAnalysis.status_color === 'green' ? 'bg-green-500' :
                          valueAnalysis.status_color === 'red' ? 'bg-red-500' :
                          valueAnalysis.status_color === 'yellow' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-6 card-shadow">
                <h3 className="font-semibold mb-4">监控参数</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">止损价</span>
                    <span className="text-red-500 font-medium">
                      {valueMonitor.stop_loss_price ? `¥${valueMonitor.stop_loss_price.toLocaleString()}` : '未设置'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">目标价</span>
                    <span className="text-green-600 font-medium">
                      {valueMonitor.target_sell_price ? `¥${valueMonitor.target_sell_price.toLocaleString()}` : '未设置'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">计划持有</span>
                    <span className="text-gray-800 font-medium">
                      {valueMonitor.planned_hold_months ? `${valueMonitor.planned_hold_months} 个月` : '未设置'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">关注平台</span>
                    <span className="text-gray-800 font-medium">
                      {valueMonitor.follow_platforms || '未设置'}
                    </span>
                  </div>
                </div>
              </div>
            </>
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

      {showAppraisalModal && bag && (
        <AppraisalModal
          bag={bag}
          onClose={() => setShowAppraisalModal(false)}
          onSuccess={(orderId) => {
            setShowAppraisalModal(false)
            loadAppraisalOrders()
            alert('委托申请已创建，可在委托详情中提交')
            navigate(`/appraisals/${orderId}`)
          }}
        />
      )}

      {showConsignmentModal && bag && (
        <ConsignmentModal
          bag={bag}
          appraisalOrders={appraisalOrders}
          onClose={() => setShowConsignmentModal(false)}
          onSuccess={(orderId) => {
            setShowConsignmentModal(false)
            loadConsignmentOrders()
            alert('寄售单已创建')
            navigate(`/consignments/${orderId}`)
          }}
        />
      )}

      {showValueMonitorModal && bag && (
        <ValueMonitorModal
          bagId={Number(id)}
          bag={bag}
          existingMonitor={valueMonitor}
          onClose={() => setShowValueMonitorModal(false)}
          onSuccess={(monitor) => {
            setShowValueMonitorModal(false)
            setValueMonitor(monitor)
            loadValueAnalysis()
            alert(valueMonitor ? '监控设置已更新' : '保值监控已开启')
          }}
        />
      )}
    </div>
  )
}
