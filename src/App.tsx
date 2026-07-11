import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/providers/theme-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { ErrorBoundary } from '@/components/error-boundary'
import { LoginPage } from '@/pages/login'
import { NotFoundPage } from '@/pages/not-found'
import { useAuth } from '@/hooks/use-auth'

const OverviewPage = lazy(() => import('@/pages/overview').then((m) => ({ default: m.OverviewPage })))
const XLCPage = lazy(() => import('@/pages/xlc').then((m) => ({ default: m.XLCPage })))
const GSFPage = lazy(() => import('@/pages/gsf').then((m) => ({ default: m.GSFPage })))
const MerchantPage = lazy(() => import('@/pages/merchant').then((m) => ({ default: m.MerchantPage })))
const WOPage = lazy(() => import('@/pages/wo').then((m) => ({ default: m.WOPage })))
const EXPOPage = lazy(() => import('@/pages/expo').then((m) => ({ default: m.EXPOPage })))
const XLSatuPage = lazy(() => import('@/pages/xlsatu').then((m) => ({ default: m.XLSatuPage })))
const ELITEPage = lazy(() => import('@/pages/elite').then((m) => ({ default: m.ELITEPage })))
const PromotorPage = lazy(() => import('@/pages/promotor').then((m) => ({ default: m.PromotorPage })))
const TargetPage = lazy(() => import('@/pages/target').then((m) => ({ default: m.TargetPage })))
const ReportingPage = lazy(() => import('@/pages/reporting').then((m) => ({ default: m.ReportingPage })))
const MonitoringPage = lazy(() => import('@/pages/monitoring').then((m) => ({ default: m.MonitoringPage })))
const UploadPage = lazy(() => import('@/pages/upload').then((m) => ({ default: m.UploadPage })))
const Excel365SettingsPage = lazy(() => import('@/pages/excel365-settings').then((m) => ({ default: m.Excel365Settings })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <AuthGuard>
                    <AppLayout />
                  </AuthGuard>
                }
              >
                <Route index element={<OverviewPage />} />
                <Route path="/xlc" element={<XLCPage />} />
                <Route path="/gsf" element={<GSFPage />} />
                <Route path="/merchant" element={<MerchantPage />} />
                <Route path="/wo" element={<WOPage />} />
                <Route path="/expo" element={<EXPOPage />} />
                <Route path="/xlsatu" element={<XLSatuPage />} />
                <Route path="/elite" element={<ELITEPage />} />
                <Route path="/promotor" element={<PromotorPage />} />
                <Route path="/target" element={<TargetPage />} />
                <Route path="/reporting" element={<ReportingPage />} />
                <Route path="/monitoring" element={<MonitoringPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/excel365" element={<Excel365SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
