import { Link, useLocation } from 'react-router-dom'
import { Package, ShieldCheck, Wrench, TrendingUp, BarChart3, FileBadge } from 'lucide-react'

const navItems = [
  { path: '/', label: '包包档案', icon: Package },
  { path: '/auth-guide', label: '鉴定指引', icon: ShieldCheck },
  { path: '/appraisals', label: '鉴定委托', icon: FileBadge },
  { path: '/maintenance', label: '保养记录', icon: Wrench },
  { path: '/market', label: '行情追踪', icon: TrendingUp },
  { path: '/stats', label: '数据统计', icon: BarChart3 },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-luxury-cream">
      <header className="bg-luxury-black text-white py-4 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 luxury-gradient rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">奢鉴</h1>
              <p className="text-xs text-gray-400">二手奢侈品包包真伪自鉴与养护记录平台</p>
            </div>
          </Link>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path ||
                (item.path === '/' && location.pathname.startsWith('/bags/')) ||
                (item.path === '/appraisals' && location.pathname.startsWith('/appraisals/'))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'border-luxury-gold text-luxury-gold'
                      : 'border-transparent text-gray-600 hover:text-luxury-gold hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {children}
      </main>

      <footer className="bg-luxury-black text-gray-400 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm">
          <p>© 2024 奢鉴 - 二手奢侈品包包真伪自鉴与养护记录平台</p>
          <p className="mt-1">鉴定结果仅供参考，建议联系专业机构进行实物鉴定</p>
        </div>
      </footer>
    </div>
  )
}
