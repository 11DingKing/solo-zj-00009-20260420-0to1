import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { 
  LayoutDashboard, 
  Dumbbell, 
  Calendar, 
  ClipboardList, 
  LogOut, 
  User,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/dashboard', label: '统计看板', icon: LayoutDashboard },
  { path: '/exercises', label: '运动项目', icon: Dumbbell },
  { path: '/plans', label: '训练计划', icon: Calendar },
  { path: '/records', label: '训练记录', icon: ClipboardList },
]

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-lg font-semibold text-gray-900">健身记录</h1>
        <div className="w-8" />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-bold text-gray-900">健身记录</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block ml-auto p-1 text-gray-400 hover:text-gray-600"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full mt-3 flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
              sidebarOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen pt-16 lg:pt-0 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
