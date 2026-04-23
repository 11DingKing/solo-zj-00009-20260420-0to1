import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, ClipboardList, Calendar as CalendarIcon, Clock, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import { TrainingRecord, Exercise, CATEGORIES } from '@/types'
import { recordsApi, exercisesApi } from '@/services/api'

const Records: React.FC = () => {
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null)
  const [selectedDate, setSelectedDate] = useState(dayjs())

  const [formData, setFormData] = useState({
    exercise_id: 0,
    actual_sets: null as number | null,
    actual_reps: null as number | null,
    actual_km: null as number | null,
    actual_minutes: null as number | null,
    weight: null as number | null,
    duration_minutes: null as number | null,
    notes: '',
    recorded_at: dayjs().toISOString(),
  })

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      const [recordsResponse, exercisesResponse] = await Promise.all([
        recordsApi.getAll({
          start_date: selectedDate.startOf('month').format('YYYY-MM-DD'),
          end_date: selectedDate.endOf('month').format('YYYY-MM-DD'),
        }),
        exercisesApi.getAll(),
      ])
      setRecords(recordsResponse.data)
      setExercises(exercisesResponse.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getExerciseById = (id: number) => exercises.find((e) => e.id === id)

  const handleEdit = (record: TrainingRecord) => {
    setEditingRecord(record)
    setFormData({
      exercise_id: record.exercise_id,
      actual_sets: record.actual_sets,
      actual_reps: record.actual_reps,
      actual_km: record.actual_km,
      actual_minutes: record.actual_minutes,
      weight: record.weight,
      duration_minutes: record.duration_minutes,
      notes: record.notes || '',
      recorded_at: record.recorded_at,
    })
    setShowModal(true)
  }

  const handleDelete = async (record: TrainingRecord) => {
    if (window.confirm('确定要删除这条训练记录吗？')) {
      try {
        await recordsApi.delete(record.id)
        fetchData()
      } catch (error) {
        console.error('Failed to delete record:', error)
      }
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRecord(null)
    setFormData({
      exercise_id: exercises[0]?.id || 0,
      actual_sets: null,
      actual_reps: null,
      actual_km: null,
      actual_minutes: null,
      weight: null,
      duration_minutes: null,
      notes: '',
      recorded_at: dayjs().toISOString(),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRecord) {
        await recordsApi.update(editingRecord.id, formData)
      } else {
        await recordsApi.create(formData)
      }
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save record:', error)
    }
  }

  const formatRecordDisplay = (record: TrainingRecord) => {
    const parts: string[] = []
    if (record.actual_sets && record.actual_reps) {
      parts.push(`${record.actual_sets}组×${record.actual_reps}次`)
    }
    if (record.actual_km) {
      parts.push(`${record.actual_km}公里`)
    }
    if (record.actual_minutes) {
      parts.push(`${record.actual_minutes}分钟`)
    }
    if (record.actual_reps && !record.actual_sets) {
      parts.push(`${record.actual_reps}次`)
    }
    return parts.join(' ') || '已完成'
  }

  // Group records by date
  const recordsByDate = records.reduce((acc, record) => {
    const date = dayjs(record.recorded_at).format('YYYY-MM-DD')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(record)
    return acc
  }, {} as Record<string, TrainingRecord[]>)

  // Get all dates in current month
  const daysInMonth = []
  const startOfMonth = selectedDate.startOf('month')
  const endOfMonth = selectedDate.endOf('month')
  let currentDay = startOfMonth

  while (currentDay.isBefore(endOfMonth) || currentDay.isSame(endOfMonth, 'day')) {
    daysInMonth.push(currentDay)
    currentDay = currentDay.add(1, 'day')
  }

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
          <h1 className="text-2xl font-bold text-gray-900">训练记录</h1>
          <p className="text-gray-500 mt-1">记录您的每一次训练</p>
        </div>
        <button
          onClick={() => {
            if (exercises.length > 0 && formData.exercise_id === 0) {
              setFormData({ ...formData, exercise_id: exercises[0].id })
            }
            setShowModal(true)
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={20} />
          记录训练
        </button>
      </div>

      {/* Month Selector */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedDate(selectedDate.subtract(1, 'month'))}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedDate.format('YYYY年MM月')}
          </h3>
          <button
            onClick={() => setSelectedDate(selectedDate.add(1, 'month'))}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: startOfMonth.day() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {daysInMonth.map((day) => {
            const dateStr = day.format('YYYY-MM-DD')
            const dayRecords = recordsByDate[dateStr] || []
            const hasRecords = dayRecords.length > 0
            const isToday = day.isSame(dayjs(), 'day')

            return (
              <div
                key={dateStr}
                className={`aspect-square p-1 rounded-lg border transition-colors ${
                  isToday
                    ? 'border-primary-500 bg-primary-50'
                    : hasRecords
                    ? 'border-green-300 bg-green-50 cursor-pointer hover:bg-green-100'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-center">
                  <span
                    className={`text-sm ${
                      isToday ? 'font-bold text-primary-600' : 'text-gray-700'
                    }`}
                  >
                    {day.date()}
                  </span>
                  {hasRecords && (
                    <div className="flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-xs text-gray-500 ml-1">
                        {dayRecords.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Records List */}
      {Object.keys(recordsByDate).length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">本月暂无训练记录</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={20} />
            记录第一次训练
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(recordsByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dayRecords]) => (
              <div key={date} className="card">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">
                    {dayjs(date).format('YYYY年MM月DD日')}
                  </h3>
                  {dayjs(date).isSame(dayjs(), 'day') && (
                    <span className="badge bg-primary-100 text-primary-800">今天</span>
                  )}
                  <span className="badge bg-gray-100 text-gray-600">
                    {dayRecords.length}项训练
                  </span>
                </div>

                <div className="space-y-3">
                  {dayRecords.map((record) => {
                    const exercise = record.exercise || getExerciseById(record.exercise_id)
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {exercise?.name}
                              </span>
                              {exercise && (
                                <span className={`badge ${CATEGORIES[exercise.category]?.color}`}>
                                  {CATEGORIES[exercise.category]?.label}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span>{formatRecordDisplay(record)}</span>
                              {record.weight && (
                                <span className="flex items-center gap-1">
                                  <Dumbbell size={14} />
                                  {record.weight}kg
                                </span>
                              )}
                              {record.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock size={14} />
                                  {record.duration_minutes}分钟
                                </span>
                              )}
                            </div>
                            {record.notes && (
                              <p className="text-sm text-gray-500 mt-1">
                                备注：{record.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(record)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRecord ? '编辑训练记录' : '记录训练'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* Exercise Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择运动
                  </label>
                  <select
                    value={formData.exercise_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exercise_id: parseInt(e.target.value),
                      })
                    }
                    className="input-field"
                    required
                  >
                    {exercises.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} - {CATEGORIES[e.category]?.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    训练时间
                  </label>
                  <input
                    type="datetime-local"
                    value={dayjs(formData.recorded_at).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recorded_at: new Date(e.target.value).toISOString(),
                      })
                    }
                    className="input-field"
                    required
                  />
                </div>

                {/* Quantity Inputs based on exercise unit */}
                {(() => {
                  const selectedExercise = getExerciseById(formData.exercise_id)
                  const unit = selectedExercise?.unit

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      {unit === 'sets_reps' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              组数
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.actual_sets || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  actual_sets: e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
                                })
                              }
                              className="input-field"
                              placeholder="4"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              次数
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.actual_reps || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  actual_reps: e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
                                })
                              }
                              className="input-field"
                              placeholder="12"
                            />
                          </div>
                        </>
                      )}
                      {unit === 'km' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            距离（公里）
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={formData.actual_km || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                actual_km: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              })
                            }
                            className="input-field"
                            placeholder="5"
                          />
                        </div>
                      )}
                      {unit === 'minutes' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            时长（分钟）
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.actual_minutes || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                actual_minutes: e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              })
                            }
                            className="input-field"
                            placeholder="30"
                          />
                        </div>
                      )}
                      {unit === 'reps' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            次数
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.actual_reps || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                actual_reps: e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              })
                            }
                            className="input-field"
                            placeholder="100"
                          />
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Weight and Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      重量（kg）
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.weight || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weight: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="input-field"
                      placeholder="例如：60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      训练时长（分钟）
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration_minutes || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_minutes: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      className="input-field"
                      placeholder="例如：45"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备注（可选）
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field min-h-[80px]"
                    placeholder="记录训练感受..."
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingRecord ? '保存' : '记录'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Records
