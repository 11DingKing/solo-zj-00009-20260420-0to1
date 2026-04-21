import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Exercises from '@/pages/Exercises'
import Plans from '@/pages/Plans'
import Records from '@/pages/Records'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="plans" element={<Plans />} />
        <Route path="records" element={<Records />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
