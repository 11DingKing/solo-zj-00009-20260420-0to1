import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Calendar, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { WeeklyPlan, Exercise, DAYS_OF_WEEK, CATEGORIES } from '@/types'
import { plansApi, exercisesApi } from '@/services/api'

interface PlanDayExerciseForm {
  exercise_id: number
  target_sets: number | null
  target_reps: number | null
  target_km: number | null
  target_minutes: number | null
}

interface PlanDayForm {
  day_of_week: number
  exercises: PlanDayExerciseForm[]
}

const Plans: React.FC = () => {
  const [plans, setPlans] = useState<WeeklyPlan[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<WeeklyPlan | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan_days: [] as PlanDayForm[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [plansResponse, exercisesResponse] = await Promise.all([
        plansApi.getAll(),
        exercisesApi.getAll(),
      ])
      setPlans(plansResponse.data)
      setExercises(exercisesResponse.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getExerciseById = (id: number) => exercises.find((e) => e.id === id)

  const handleEdit = (plan: WeeklyPlan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || '',
      plan_days: plan.plan_days.map((day) => ({
        day_of_week: day.day_of_week,
        exercises: day.exercises.map((ex) => ({
          exercise_id: ex.exercise_id,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          target_km: ex.target_km,
          target_minutes: ex.target_minutes,
        })),
      })),
    })
    setShowModal(true)
  }

  const handleDelete = async (plan: WeeklyPlan) => {
    if (window.confirm(`确定要删除训练计划"${plan.name}"吗？`)) {
      try {
        await plansApi.delete(plan.id)
        fetchData()
      } catch (error) {
        console.error('Failed to delete plan:', error)
      }
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPlan(null)
    setSelectedDay(null)
    setFormData({
      name: '',
      description: '',
      plan_days: [],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingPlan) {
        await plansApi.update(editingPlan.id, {
          ...formData,
          is_active: editingPlan.is_active,
        })
      } else {
        await plansApi.create(formData)
      }
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save plan:', error)
    }
  }

  const toggleDay = (dayIndex: number) => {
    const exists = formData.plan_days.find((d) => d.day_of_week === dayIndex)
    if (exists) {
      setFormData({
        ...formData,
        plan_days: formData.plan_days.filter((d) => d.day_of_week !== dayIndex),
      })
      if (selectedDay === dayIndex) {
        setSelectedDay(null)
      }
    } else {
      setFormData({
        ...formData,
        plan_days: [...formData.plan_days, { day_of_week: dayIndex, exercises: [] }],
      })
    }
  }

  const getDayData = (dayIndex: number) =>
    formData.plan_days.find((d) => d.day_of_week === dayIndex)

  const addExerciseToDay = (dayIndex: number) => {
    const dayData = getDayData(dayIndex)
    if (!dayData) return

    const updatedDays = formData.plan_days.map((day) => {
      if (day.day_of_week === dayIndex) {
        return {
          ...day,
          exercises: [
            ...day.exercises,
            {
              exercise_id: exercises[0]?.id || 1,
              target_sets: null,
              target_reps: null,
              target_km: null,
              target_minutes: null,
            },
          ],
        }
      }
      return day
    })

    setFormData({ ...formData, plan_days: updatedDays })
  }

  const removeExerciseFromDay = (dayIndex: number, exerciseIndex: number) => {
    const updatedDays = formData.plan_days.map((day) => {
      if (day.day_of_week === dayIndex) {
        return {
          ...day,
          exercises: day.exercises.filter((_, i) => i !== exerciseIndex),
        }
      }
      return day
    })

    setFormData({ ...formData, plan_days: updatedDays })
  }

  const updateExercise = (
    dayIndex: number,
    exerciseIndex: number,
    field: string,
    value: any
  ) => {
    const updatedDays = formData.plan_days.map((day) => {
      if (day.day_of_week === dayIndex) {
        const newExercises = [...day.exercises]
        newExercises[exerciseIndex] = {
          ...newExercises[exerciseIndex],
          [field]: value,
        }
        return { ...day, exercises: newExercises }
      }
      return day
    })

    setFormData({ ...formData, plan_days: updatedDays })
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
          <h1 className="text-2xl font-bold text-gray-900">训练计划</h1>
          <p className="text-gray-500 mt-1">创建和管理您的周训练计划</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={20} />
          创建计划
        </button>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">暂无训练计划</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={20} />
            创建第一个计划
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    {plan.is_active && (
                      <span className="badge bg-green-100 text-green-800">激活中</span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-gray-500 mt-1">{plan.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(plan)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Plan Days Preview */}
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day, index) => {
                  const planDay = plan.plan_days.find((d) => d.day_of_week === index)
                  const hasExercises = planDay && planDay.exercises.length > 0
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded-lg text-center ${
                        hasExercises ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                      }`}
                    >
                      <p className={`text-xs font-medium ${
                        hasExercises ? 'text-primary-600' : 'text-gray-400'
                      }`}>
                        {day}
                      </p>
                      {hasExercises && (
                        <p className="text-xs text-gray-500 mt-1">
                          {planDay!.exercises.length}项
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Exercises Detail */}
              {plan.plan_days.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {plan.plan_days
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((planDay) => (
                      <div key={planDay.id}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {DAYS_OF_WEEK[planDay.day_of_week]}
                        </h4>
                        <div className="space-y-2">
                          {planDay.exercises.map((ex) => {
                            const exercise = ex.exercise || getExerciseById(ex.exercise_id)
                            return (
                              <div
                                key={ex.id}
                                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-gray-900">
                                    {exercise?.name}
                                  </span>
                                  <span className={`badge ${CATEGORIES[exercise?.category || '']?.color}`}>
                                    {CATEGORIES[exercise?.category || '']?.label}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {ex.target_sets && ex.target_reps && `${ex.target_sets}组×${ex.target_reps}次`}
                                  {ex.target_km && `${ex.target_km}公里`}
                                  {ex.target_minutes && `${ex.target_minutes}分钟`}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPlan ? '编辑训练计划' : '创建训练计划'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      计划名称
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="例如：增肌计划"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      描述（可选）
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="input-field"
                      placeholder="计划说明..."
                    />
                  </div>
                </div>

                {/* Day Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择训练日
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day, index) => {
                      const isSelected = getDayData(index)
                      return (
                        <button
                          type="button"
                          key={index}
                          onClick={() => toggleDay(index)}
                          className={`p-3 rounded-lg text-center transition-colors ${
                            isSelected
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 mx-auto" />
                          )}
                          <p className="text-xs mt-1">{day}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Selected Day Detail */}
                {formData.plan_days.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      配置训练日详情
                    </label>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {formData.plan_days
                        .sort((a, b) => a.day_of_week - b.day_of_week)
                        .map((day) => (
                          <button
                            type="button"
                            key={day.day_of_week}
                            onClick={() => setSelectedDay(day.day_of_week)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                              selectedDay === day.day_of_week
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {DAYS_OF_WEEK[day.day_of_week]}
                            <ChevronRight size={14} />
                            {day.exercises.length}项
                          </button>
                        ))}
                    </div>

                    {selectedDay !== null && (
                      <div className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">
                            {DAYS_OF_WEEK[selectedDay]} - 训练项目
                          </h4>
                          <button
                            type="button"
                            onClick={() => addExerciseToDay(selectedDay)}
                            className="btn-primary text-sm py-1.5 px-3"
                          >
                            <Plus size={16} className="inline mr-1" />
                            添加运动
                          </button>
                        </div>

                        {getDayData(selectedDay)?.exercises.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">
                            点击上方按钮添加运动项目
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {getDayData(selectedDay)?.exercises.map((ex, index) => {
                              const exercise = getExerciseById(ex.exercise_id)
                              return (
                                <div
                                  key={index}
                                  className="p-4 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 flex-1">
                                      <select
                                        value={ex.exercise_id}
                                        onChange={(e) =>
                                          updateExercise(
                                            selectedDay,
                                            index,
                                            'exercise_id',
                                            parseInt(e.target.value)
                                          )
                                        }
                                        className="input-field max-w-xs"
                                      >
                                        {exercises.map((e) => (
                                          <option key={e.id} value={e.id}>
                                            {e.name}
                                          </option>
                                        ))}
                                      </select>
                                      {exercise && (
                                        <span className={`badge ${CATEGORIES[exercise.category]?.color}`}>
                                          {CATEGORIES[exercise.category]?.label}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeExerciseFromDay(selectedDay, index)
                                      }
                                      className="p-1 text-gray-400 hover:text-red-600"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>

                                  {/* Target Inputs based on unit */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {exercise?.unit === 'sets_reps' && (
                                      <>
                                        <div>
                                          <label className="block text-xs text-gray-500 mb-1">
                                            组数
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            value={ex.target_sets || ''}
                                            onChange={(e) =>
                                              updateExercise(
                                                selectedDay,
                                                index,
                                                'target_sets',
                                                e.target.value ? parseInt(e.target.value) : null
                                              )
                                            }
                                            className="input-field"
                                            placeholder="4"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-gray-500 mb-1">
                                            次数
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            value={ex.target_reps || ''}
                                            onChange={(e) =>
                                              updateExercise(
                                                selectedDay,
                                                index,
                                                'target_reps',
                                                e.target.value ? parseInt(e.target.value) : null
                                              )
                                            }
                                            className="input-field"
                                            placeholder="12"
                                          />
                                        </div>
                                      </>
                                    )}
                                    {exercise?.unit === 'km' && (
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                          距离（公里）
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.1"
                                          value={ex.target_km || ''}
                                          onChange={(e) =>
                                            updateExercise(
                                              selectedDay,
                                              index,
                                              'target_km',
                                              e.target.value ? parseFloat(e.target.value) : null
                                            )
                                          }
                                          className="input-field"
                                          placeholder="5"
                                        />
                                      </div>
                                    )}
                                    {exercise?.unit === 'minutes' && (
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                          时长（分钟）
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={ex.target_minutes || ''}
                                          onChange={(e) =>
                                            updateExercise(
                                              selectedDay,
                                              index,
                                              'target_minutes',
                                              e.target.value ? parseInt(e.target.value) : null
                                            )
                                          }
                                          className="input-field"
                                          placeholder="30"
                                        />
                                      </div>
                                    )}
                                    {exercise?.unit === 'reps' && (
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                          次数
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={ex.target_reps || ''}
                                          onChange={(e) =>
                                            updateExercise(
                                              selectedDay,
                                              index,
                                              'target_reps',
                                              e.target.value ? parseInt(e.target.value) : null
                                            )
                                          }
                                          className="input-field"
                                          placeholder="100"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                  {editingPlan ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Plans
