import * as Avatar from "@radix-ui/react-avatar";
import { Archive, ChevronRight, FileText, Home, LayoutGrid, LogOut, Menu, Plus, Settings, WandSparkles, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { cn } from "../lib/cn";

const navigation = [
  { to: "/", label: "Início", icon: Home },
  { to: "/designs", label: "Designs", icon: LayoutGrid },
  { to: "/gerar", label: "Gerar", icon: WandSparkles },
  { to: "/arquivos", label: "Arquivos", icon: Archive },
  { to: "/configuracoes", label: "Ajustes", icon: Settings },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="nav-list" aria-label="Navegação principal">
      {navigation.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === "/"} onClick={onNavigate} className={({ isActive }) => cn("nav-item", isActive && "is-active")}>
          <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-lockup compact">
          <span className="brand-mark" aria-hidden="true"><FileText size={20} /></span>
          <span>Cartaz Economix</span>
        </div>
        <button className="primary-button create-button" onClick={() => navigate("/gerar")}><Plus size={18} /> Criar cartazes</button>
        <Navigation />
        <div className="sidebar-user">
          <Avatar.Root className="avatar-root">
            <Avatar.Fallback className="avatar-fallback">EE</Avatar.Fallback>
          </Avatar.Root>
          <span><strong>{user?.name}</strong><small>{user?.email}</small></span>
          <button className="icon-button" onClick={handleSignOut} aria-label="Sair" title="Sair"><LogOut size={18} /></button>
        </div>
      </aside>

      <header className="mobile-header">
        <div className="brand-lockup compact"><span className="brand-mark"><FileText size={18} /></span><span>Cartaz</span></div>
        <button className="icon-button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} title={mobileOpen ? "Fechar menu" : "Abrir menu"}>
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {mobileOpen && (
        <div className="mobile-sheet">
          <Navigation onNavigate={() => setMobileOpen(false)} />
          <button className="secondary-button" onClick={handleSignOut}><LogOut size={18} /> Sair</button>
        </div>
      )}

      <main className="app-content" key={location.pathname}>{children}</main>

      <nav className="bottom-nav" aria-label="Navegação inferior">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => cn("bottom-nav-item", isActive && "is-active")}>
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="mobile-create" onClick={() => navigate("/gerar")} aria-label="Criar cartazes" title="Criar cartazes"><Plus size={22} /></button>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action && <div className="page-action">{action}</div>}
    </header>
  );
}

export function ContinueCard() {
  return (
    <button className="continue-card">
      <span className="continue-icon"><WandSparkles size={22} /></span>
      <span><small>Continuar de onde parei</small><strong>Ofertas do fim de semana</strong><em>8 de 10 produtos revisados</em></span>
      <ChevronRight size={20} />
    </button>
  );
}
