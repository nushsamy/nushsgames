import { Navigate, Route, Routes } from "react-router-dom";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      <Route path="/display" element={<JoinPage />} />
      <Route path="/display/:gamekey" element={<DisplayPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/games" element={<GameSelectPage />} />
          <Route path="/host/create" element={<CreateBeePage />} />
          <Route path="/host/bees" element={<BeesListPage />} />
          <Route path="/host/:beeId/builder" element={<RoundBuilderPage />} />
          <Route path="/host/:beeId/control" element={<ControlPanelPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/host/bees" replace />} />
    </Routes>
  );
}

export default App;
