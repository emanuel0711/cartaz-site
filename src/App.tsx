import { Archive, FileText, LayoutGrid, Plus, Settings, WandSparkles } from "lucide-react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell, PageHeader } from "./components/AppShell";
import { useAuth } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";

function LoadingScreen() {
  return <main className="loading-screen"><div className="loading-mark" /><p>Preparando seu espaço…</p></main>;
}

function PlaceholderPage({ title, description, icon: Icon, action }: { title: string; description: string; icon: typeof LayoutGrid; action?: string }) {
  const navigate = useNavigate();
  return (
    <div className="page-stack">
      <PageHeader title={title} description={description} action={action ? <button className="primary-button" onClick={() => navigate("/gerar")}><Plus size={18} /> {action}</button> : undefined} />
      <section className="empty-state">
        <span className="empty-icon"><Icon size={27} /></span>
        <h2>Esta área entra na próxima fase.</h2>
        <p>A navegação, os estados e a experiência responsiva já estão prontos para receber o fluxo completo.</p>
      </section>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <LoginPage />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/designs" element={<PlaceholderPage title="Designs" description="Modelos, rascunhos e designs publicados em um só lugar." icon={LayoutGrid} action="Novo design" />} />
        <Route path="/gerar" element={<PlaceholderPage title="Criar cartazes" description="Modelo, produtos, revisão, prévia e saída em um fluxo contínuo." icon={WandSparkles} />} />
        <Route path="/arquivos" element={<PlaceholderPage title="Arquivos" description="PDFs e lotes salvos para baixar ou reimprimir." icon={Archive} />} />
        <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" description="Conta, segurança e identidade visual da sua equipe." icon={Settings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
