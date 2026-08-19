import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { LandingPage } from "@/pages/LandingPage";
import { GameSelectPage } from "@/pages/GameSelectPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { CreateBeePage } from "@/pages/host/CreateBeePage";
import { BeesListPage } from "@/pages/host/BeesListPage";
import { RoundBuilderPage } from "@/pages/host/RoundBuilderPage";
import { ControlPanelPage } from "@/pages/host/ControlPanelPage";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { JoinPage } from "@/routes/JoinPage";
import { DisplayPage } from "@/routes/DisplayPage";
import { AppShell as MysteryAppShell } from "@/mystery/components/layout/AppShell";
import { EventsListPage } from "@/mystery/pages/host/EventsListPage";
import { CreateEventPage } from "@/mystery/pages/host/CreateEventPage";
import { EventBuilderPage } from "@/mystery/pages/host/EventBuilderPage";
import { ControlPanelPage as MysteryControlPanelPage } from "@/mystery/pages/host/ControlPanelPage";
import { VotePage } from "@/mystery/routes/VotePage";

function App() {
  useAuthBootstrap();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      <Route path="/display" element={<JoinPage />} />
      <Route path="/display/:gamekey" element={<DisplayPage />} />
      <Route path="/mystery/vote/:token" element={<VotePage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/games" element={<GameSelectPage />} />
          <Route path="/host/create" element={<CreateBeePage />} />
          <Route path="/host/bees" element={<BeesListPage />} />
          <Route path="/host/:beeId/builder" element={<RoundBuilderPage />} />
          <Route path="/host/:beeId/control" element={<ControlPanelPage />} />
        </Route>

        <Route element={<MysteryAppShell />}>
          <Route path="/mystery/host/events" element={<EventsListPage />} />
          <Route path="/mystery/host/create" element={<CreateEventPage />} />
          <Route path="/mystery/host/:eventId/builder" element={<EventBuilderPage />} />
          <Route path="/mystery/host/:eventId/control" element={<MysteryControlPanelPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/games" replace />} />
    </Routes>
  );
}

export default App;
