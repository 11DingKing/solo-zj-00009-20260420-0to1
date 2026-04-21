import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Dumbbell, Search, Filter } from 'lucide-react'
import { Exercise, CATEGORIES, UNITS } from '@/types'
import { exercisesApi } from '@/services/api'

const Exercises: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    category: 'strength',
    unit: 'sets_reps',
  })

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      const response = await exercisesApi.getAll()
      setExercises(response.data)
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingExercise) {
        await exercisesApi.update(editingExercise.id, formData)
      } else {
        await exercisesApi.create(formData)
      }
      fetchExercises()
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save exercise:', error)
    }
  }

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setFormData({
      name: exercise.name,
      category: exercise.category,
      unit: exercise.unit,
    })
    setShowModal(true)
  }

  const handleDelete = async (exercise: Exercise) => {
    if (window.confirm(`确定要删除运动项目"${exercise.name}"吗？`)) {
      try {
        await exercisesApi.delete(exercise.id)
        fetchExercises()
      } catch (error) {
        console.error('Failed to delete exercise:', error)
      }
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingExercise(null)
    setFormData({
      name: '',
      category: 'strength',
      unit: 'sets_reps',
    })
  }

  const filteredExercises = exercises.filter((exercise) => {
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">运动项目库</h1>
          <p className="text-gray-500 mt-1">管理您的运动项目</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={20} />
          添加运动项目
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索运动项目..."
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field min-w-[150px]"
            >
              <option value="all">全部分类</option>
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => (
          <div key={exercise.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${CATEGORIES[exercise.category]?.color}`}>
                      {CATEGORIES[exercise.category]?.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {UNITS[exercise.unit]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {exercise.is_system ? (
                  <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                    系统
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(exercise)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(exercise)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="card text-center py-12">
          <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无运动项目</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingExercise ? '编辑运动项目' : '添加运动项目'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  运动名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="例如：俯卧撑"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  运动分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="input-field"
                >
                  {Object.entries(CATEGORIES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  计量单位
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="input-field"
                >
                  {Object.entries(UNITS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingExercise ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Exercises
