import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { AppShell } from './features/layout/AppShell';
import { ProtectedRoute } from './features/layout/ProtectedRoute';
import { MyIssuesPage } from './pages/MyIssuesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<MyIssuesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/board" element={<ProjectBoardPage />} />
          <Route path="/projects/:projectId/tickets/:ticketId" element={<TicketDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
