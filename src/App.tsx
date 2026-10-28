import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Setup Wizard
import { SetupWizardPage } from '@/pages/setup/SetupWizardPage';

// Public Pages
import { HomePage } from '@/pages/public/HomePage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { SuccessPage } from '@/pages/public/SuccessPage';

// Auth Page
import { LoginPage } from '@/pages/auth/LoginPage';

// Volunteer Pages
import { VolunteerSearchPage } from '@/pages/volunteer/VolunteerSearchPage';
import { QuickRegisterPage } from '@/pages/volunteer/QuickRegisterPage';

// Admin & Management Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { RegistrationsManagePage } from '@/pages/admin/RegistrationsManagePage';
import { AreaReportPage } from '@/pages/admin/AreaReportPage';
import { CardPrintingPage } from '@/pages/admin/CardPrintingPage';
import { HelpdeskLookupPage } from '@/pages/admin/HelpdeskLookupPage';
import { RegistrationSettingsPage } from '@/pages/admin/RegistrationSettingsPage';
import { StaffAccountsPage } from '@/pages/admin/StaffAccountsPage';
import { ScrollToTop } from '@/components/common/ScrollToTop';

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Setup Wizard Route: Available only in local development mode.
                When deployed to production, /setup is completely disabled and safely redirects to / */}
            {import.meta.env.DEV ? (
              <Route path="/setup" element={<SetupWizardPage />} />
            ) : (
              <Route path="/setup" element={<Navigate to="/" replace />} />
            )}

            {/* Public Portal Routes (Always loads Festive Homepage directly) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/chandlodiya" element={<HomePage dedicatedVistar="CHANDLODIYA" />} />
            <Route path="/vadaj" element={<HomePage dedicatedVistar="VADAJ" />} />
            <Route path="/c" element={<Navigate to="/chandlodiya" replace />} />
            <Route path="/v" element={<Navigate to="/vadaj" replace />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/success" element={<SuccessPage />} />

            {/* Authentication */}
            <Route path="/login" element={<LoginPage />} />

            {/* Volunteer Portal Routes (Mobile-first, fast, non-Claymorphic) */}
            <Route
              path="/volunteer"
              element={
                <ProtectedRoute>
                  <VolunteerSearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/quick-register"
              element={
                <ProtectedRoute>
                  <QuickRegisterPage />
                </ProtectedRoute>
              }
            />

            {/* Coordinator & Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/setup-wizard"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <SetupWizardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/helpdesk"
              element={
                <ProtectedRoute requiredRoles={['COORDINATOR', 'ADMIN', 'SUPER_ADMIN']}>
                  <HelpdeskLookupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/registrations"
              element={
                <ProtectedRoute requiredRoles={['COORDINATOR', 'ADMIN', 'SUPER_ADMIN']}>
                  <RegistrationsManagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/area-report"
              element={
                <ProtectedRoute requiredRoles={['COORDINATOR', 'ADMIN', 'SUPER_ADMIN']}>
                  <AreaReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/printing"
              element={
                <ProtectedRoute requiredRoles={['COORDINATOR', 'ADMIN', 'SUPER_ADMIN']}>
                  <CardPrintingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <RegistrationSettingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/accounts"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <StaffAccountsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
