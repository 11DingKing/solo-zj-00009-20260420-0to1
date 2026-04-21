import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api'

type Mode = 'login' | 'register'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const response = await authApi.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        })
        setAuth(response.data.user, response.data.access_token)
      } else {
        const response = await authApi.login({
          username: formData.username,
          password: formData.password,
        })
        setAuth(response.data.user, response.data.access_token)
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">健身运动记录系统</h1>
          <p className="text-gray-500 mt-2">记录每一次训练，见证更好的自己</p>
        </div>

        {/* Tab Switch */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            注册
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="input-field pl-10"
                placeholder="请输入用户名"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input-field pl-10"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input-field pl-10 pr-10"
                placeholder="请输入密码"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
