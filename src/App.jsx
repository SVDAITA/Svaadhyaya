import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./hooks/useTheme";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import AppLayout from "./components/layout/AppLayout";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import {
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./pages/auth/PasswordPages";

import TodayPage from "./pages/svadhyaya/TodayPage";
import DashboardPage from "./pages/svadhyaya/DashboardPage";
import DisruptionPage from "./pages/svadhyaya/DisruptionPage";
import AnushthanamPage from "./pages/svadhyaya/AnushthanamPage";
import NadamPage from "./pages/svadhyaya/NadamPage";
import ShariramPage from "./pages/svadhyaya/ShariramPage";
import VruttiPage from "./pages/svadhyaya/VruttiPage";
import ArthaPage from "./pages/svadhyaya/ArthaPage";
import VidyaPage from "./pages/svadhyaya/VidyaPage";
import SettingsPage from "./pages/svadhyaya/SettingsPage";

// Tracker Pages - Updated Imports to match your new file names
import TrackerPage from "./pages/tracker/TrackerPage";
import AnnaTracker from "./pages/tracker/AnnaTracker";
import ArthaTracker from "./pages/tracker/ArthaTracker";
import ShariramTracker from "./pages/tracker/ShariramTracker";
import VrittiTracker from "./pages/tracker/VrittiTracker";
import PathanamTracker from "./pages/tracker/PathanamTracker";
import PurohitamTracker from "./pages/tracker/PurohitamTracker";
import YatraTracker from "./pages/tracker/YatraTracker";
import NaadaTracker from "./pages/tracker/NaadaTracker";
import VidyaTracker from "./pages/tracker/VidyaTracker";

import NotFoundPage from "./pages/NotFoundPage";
import AdminPage from "./pages/AdminPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false, // prevent refetch flash when switching browser tabs
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
              <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/auth/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
              <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

              {/* Protected app */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/svadhyaya" element={<TodayPage />} />
                <Route
                  path="/svadhyaya/dashboard"
                  element={<DashboardPage />}
                />
                <Route
                  path="/svadhyaya/disruption"
                  element={<DisruptionPage />}
                />
                <Route
                  path="/svadhyaya/anushthanam"
                  element={<AnushthanamPage />}
                />
                <Route path="/svadhyaya/nadam" element={<NadamPage />} />
                <Route path="/svadhyaya/shariram" element={<ShariramPage />} />
                <Route path="/svadhyaya/vrutti" element={<VruttiPage />} />
                <Route
                  path="/svadhyaya/karma"
                  element={<Navigate to="/svadhyaya/vrutti" replace />}
                />
                <Route path="/svadhyaya/artha" element={<ArthaPage />} />
                <Route path="/svadhyaya/vidya" element={<VidyaPage />} />
                <Route path="/svadhyaya/settings" element={<SettingsPage />} />

                {/* Updated Tracker Routes mapping to new component names */}
                <Route path="/tracker" element={<TrackerPage />} />
                <Route path="/tracker/diet" element={<AnnaTracker />} />
                <Route path="/tracker/finance" element={<ArthaTracker />} />
                <Route path="/tracker/health" element={<ShariramTracker />} />
                <Route path="/tracker/career" element={<VrittiTracker />} />
                <Route path="/tracker/reading" element={<Navigate to="/tracker/vidya" replace />} />
                <Route path="/tracker/sacred" element={<PurohitamTracker />} />
                <Route path="/tracker/journey" element={<YatraTracker />} />
                <Route path="/tracker/nadam" element={<NaadaTracker />} />
                <Route path="/tracker/vritti" element={<VrittiTracker />} />
                <Route path="/tracker/vidya" element={<VidyaTracker />} />
              </Route>

              <Route path="/svdaiadmin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
