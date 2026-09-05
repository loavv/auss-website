import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PublicLayout from '@/components/layout/PublicLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

// Public pages
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const EventsPage = lazy(() => import('@/pages/public/EventsPage'))
const FeedbackPage = lazy(() => import('@/pages/public/FeedbackPage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))

// Admin auth pages
const LoginPage = lazy(() => import('@/pages/admin/LoginPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/admin/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/admin/ResetPasswordPage'))

// Admin pages
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const AnnouncementsPage = lazy(() => import('@/pages/admin/AnnouncementsPage'))
const EventsAdminPage = lazy(() => import('@/pages/admin/EventsAdminPage'))
const OfficersPage = lazy(() => import('@/pages/admin/OfficersPage'))
const AchievementsPage = lazy(() => import('@/pages/admin/AchievementsPage'))
const GalleryAdminPage = lazy(() => import('@/pages/admin/GalleryAdminPage'))
const FeedbackAdminPage = lazy(() => import('@/pages/admin/FeedbackAdminPage'))
const InquiriesPage = lazy(() => import('@/pages/admin/InquiriesPage'))
const AdministratorsPage = lazy(() => import('@/pages/admin/AdministratorsPage'))
const ActivityLogsPage = lazy(() => import('@/pages/admin/ActivityLogsPage'))
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
})

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>

              {/* Admin Auth Routes */}
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="events" element={<EventsAdminPage />} />
                <Route path="officers" element={<OfficersPage />} />
                <Route path="achievements" element={<AchievementsPage />} />
                <Route path="gallery" element={<GalleryAdminPage />} />
                <Route path="feedback" element={<FeedbackAdminPage />} />
                <Route path="inquiries" element={<InquiriesPage />} />
                <Route path="administrators" element={
                  <ProtectedRoute requireSuperAdmin>
                    <AdministratorsPage />
                  </ProtectedRoute>
                } />
                <Route path="activity-logs" element={<ActivityLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}
