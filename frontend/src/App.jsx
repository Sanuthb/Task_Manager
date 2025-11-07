import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import TaskDashboard from './pages/TaskDashboard.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import FinalReportPage from './pages/FinalReportPage.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/tasks" element={<TaskDashboard />} />
        <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
        <Route path="/dashboard/final-report" element={<FinalReportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
