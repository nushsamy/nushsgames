import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { EventsListPage } from "@/pages/host/EventsListPage";
import { CreateEventPage } from "@/pages/host/CreateEventPage";
import { EventBuilderPage } from "@/pages/host/EventBuilderPage";
import { ControlPanelPage } from "@/pages/host/ControlPanelPage";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { VotePage } from "@/routes/VotePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      <Route path="/vote/:token" element={<VotePage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/host/events" element={<EventsListPage />} />
          <Route path="/host/create" element={<CreateEventPage />} />
          <Route path="/host/:eventId/builder" element={<EventBuilderPage />} />
          <Route path="/host/:eventId/control" element={<ControlPanelPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/host/events" replace />} />
    </Routes>
  );
}

export default App;
