import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Calendar, Clock, Activity, TrendingUp } from 'lucide-react'
import dayjs from 'dayjs'
import { statsApi } from '@/services/api'
import { DashboardStats } from '@/types'

const COLORS = ['#0ea5e9', '#ef4444', '#22c55e']

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await statsApi.getDashboard()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">暂无数据</div>
      </div>
    )
  }

  const lineChartData = stats.daily_frequency.data.map((item) => ({
    date: dayjs(item.date).format('MM-DD'),
    training: item.has_training ? 1 : 0,
    label: item.has_training ? '有训练' : '无训练',
  }))

  const pieChartData = stats.category_duration.data
    .filter((item) => item.duration_minutes > 0)
    .map((item) => ({
      name: item.category_name,
      value: item.duration_minutes,
    }))

  const totalMinutes = stats.monthly_total_duration
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">统计看板</h1>
        <p className="text-gray-500 mt-1">查看您的训练统计数据</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">本周训练天数</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.weekly_training_days}
                <span className="text-sm font-normal text-gray-500 ml-1">天</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">本月训练时长</p>
              <p className="text-2xl font-bold text-gray-900">
                {hours}
                <span className="text-sm font-normal text-gray-500 ml-1">小时</span>
                {minutes > 0 && (
                  <>
                    <span className="text-lg ml-1">{minutes}</span>
                    <span className="text-sm font-normal text-gray-500">分钟</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">近30天训练天数</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.daily_frequency.data.filter((d) => d.has_training).length}
                <span className="text-sm font-normal text-gray-500 ml-1">天</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">训练分类数</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.category_duration.data.filter((c) => c.duration_minutes > 0).length}
                <span className="text-sm font-normal text-gray-500 ml-1">类</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">近30天训练频率</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  interval={Math.floor(lineChartData.length / 6)}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  ticks={[0, 1]}
                  tickFormatter={(value) => (value === 1 ? '有训练' : '无训练')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [value === 1 ? '有训练' : '无训练', '训练状态']}
                />
                <Line
                  type="stepAfter"
                  dataKey="training"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">训练分类时长占比（近30天）</h3>
          <div className="h-80">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} 分钟`, '训练时长']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                暂无训练数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Details */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">各分类训练详情（近30天）</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分类</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">训练时长</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">占比</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">进度</th>
              </tr>
            </thead>
            <tbody>
              {stats.category_duration.data.map((item, index) => (
                <tr key={item.category} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-gray-900">{item.category_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {item.duration_minutes} 分钟
                    {item.duration_minutes >= 60 && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({Math.floor(item.duration_minutes / 60)}小时{item.duration_minutes % 60 > 0 ? `${item.duration_minutes % 60}分` : ''})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700">{item.percentage}%</td>
                  <td className="py-3 px-4">
                    <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
