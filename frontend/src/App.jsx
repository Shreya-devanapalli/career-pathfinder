import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import ThemeToggle from './components/ThemeToggle'

import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import SkillGap from './pages/SkillGap'
import Roadmap from './pages/Roadmap'
import Chat from './pages/Chat'
import Landing from './pages/Landing'
import CareerMatches from './pages/CareerMatches'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Landing />} />

        <Route
          path="/assessment"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/career-matches"
          element={
            <ProtectedRoute>
              <CareerMatches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/skill-gap"
          element={
            <ProtectedRoute>
              <SkillGap />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roadmap"
          element={
            <ProtectedRoute>
              <Roadmap />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:recommendationId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* One consistent theme control across the entire application. */}
      <ThemeToggle />
    </>
  )
}
