import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
}

export const exercisesApi = {
  getAll: (category?: string) =>
    api.get('/exercises/', { params: { category } }),
  getById: (id: number) =>
    api.get(`/exercises/${id}`),
  create: (data: { name: string; category: string; unit: string }) =>
    api.post('/exercises/', data),
  update: (id: number, data: { name: string; category: string; unit: string }) =>
    api.put(`/exercises/${id}`, data),
  delete: (id: number) =>
    api.delete(`/exercises/${id}`),
}

export const plansApi = {
  getAll: () =>
    api.get('/plans/'),
  getById: (id: number) =>
    api.get(`/plans/${id}`),
  create: (data: any) =>
    api.post('/plans/', data),
  update: (id: number, data: any) =>
    api.put(`/plans/${id}`, data),
  delete: (id: number) =>
    api.delete(`/plans/${id}`),
}

export const recordsApi = {
  getAll: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/records/', { params }),
  getByDate: (date: string) =>
    api.get(`/records/days/${date}`),
  getById: (id: number) =>
    api.get(`/records/${id}`),
  create: (data: any) =>
    api.post('/records/', data),
  update: (id: number, data: any) =>
    api.put(`/records/${id}`, data),
  delete: (id: number) =>
    api.delete(`/records/${id}`),
}

export const statsApi = {
  getWeekly: () =>
    api.get('/stats/weekly'),
  getMonthly: () =>
    api.get('/stats/monthly'),
  getDailyFrequency: () =>
    api.get('/stats/daily-frequency'),
  getCategoryDuration: () =>
    api.get('/stats/category-duration'),
  getDashboard: () =>
    api.get('/stats/dashboard'),
}

export default api
