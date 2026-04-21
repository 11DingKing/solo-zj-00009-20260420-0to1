export interface User {
  id: number
  username: string
  email: string
  created_at: string
}

export interface Exercise {
  id: number
  name: string
  category: string
  unit: string
  is_system: boolean
  user_id: number | null
}

export interface PlanDayExercise {
  id: number
  exercise_id: number
  target_sets: number | null
  target_reps: number | null
  target_km: number | null
  target_minutes: number | null
  exercise?: Exercise
}

export interface PlanDay {
  id: number
  day_of_week: number
  exercises: PlanDayExercise[]
}

export interface WeeklyPlan {
  id: number
  name: string
  description: string | null
  is_active: boolean
  user_id: number
  plan_days: PlanDay[]
  created_at: string
  updated_at: string
}

export interface TrainingRecord {
  id: number
  user_id: number
  exercise_id: number
  plan_day_exercise_id: number | null
  actual_sets: number | null
  actual_reps: number | null
  actual_km: number | null
  actual_minutes: number | null
  weight: number | null
  duration_minutes: number | null
  notes: string | null
  recorded_at: string
  created_at: string
  exercise?: Exercise
}

export interface WeeklyStats {
  training_days: number
  total_records: number
}

export interface MonthlyStats {
  total_duration_minutes: number
  training_days: number
}

export interface DailyFrequencyItem {
  date: string
  has_training: boolean
}

export interface DailyFrequencyResponse {
  data: DailyFrequencyItem[]
}

export interface CategoryDurationItem {
  category: string
  category_name: string
  duration_minutes: number
  percentage: number
}

export interface CategoryDurationResponse {
  data: CategoryDurationItem[]
  total_duration: number
}

export interface DashboardStats {
  weekly_training_days: number
  monthly_total_duration: number
  daily_frequency: DailyFrequencyResponse
  category_duration: CategoryDurationResponse
}

export const CATEGORIES: Record<string, { label: string; color: string }> = {
  cardio: { label: '有氧', color: 'bg-blue-100 text-blue-800' },
  strength: { label: '力量', color: 'bg-red-100 text-red-800' },
  flexibility: { label: '柔韧', color: 'bg-green-100 text-green-800' },
}

export const UNITS: Record<string, string> = {
  km: '公里',
  reps: '次',
  sets_reps: '组×次',
  minutes: '分钟',
}

export const DAYS_OF_WEEK = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
