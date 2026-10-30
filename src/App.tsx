import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useAuth } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";

const DesignsPage = lazy(() => import("./features/designs/DesignsPage").then((module) => ({ default: module.DesignsPage })));
const EditorPage = lazy(() => import("./features/editor/EditorPage").then((module) => ({ default: module.EditorPage })));
const FilesPage = lazy(() => import("./features/files/FilesPage").then((module) => ({ default: module.FilesPage })));
const GeneratePage = lazy(() => import("./features/generation/GeneratePage").then((module) => ({ default: module.GeneratePage })));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage").then((module) => ({ default: module.SettingsPage })));

function LoadingScreen() {
  return <main className="loading-screen"><div className="loading-mark" /><p>Preparing your workspace…</p></main>;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <LoginPage />;

  return <AppShell><Suspense fallback={<LoadingScreen />}><Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/designs" element={<DesignsPage />} />
    <Route path="/designs/:id/edit" element={<EditorPage />} />
    <Route path="/generate" element={<GeneratePage />} />
    <Route path="/files" element={<FilesPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></AppShell>;
}
