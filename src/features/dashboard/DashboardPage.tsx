import { ArrowRight, CheckCircle2, Clock3, FileDown, LayoutTemplate, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContinueCard, PageHeader } from "../../components/AppShell";

const recent = [
  { name: "Ofertas do fim de semana", meta: "10 produtos · A3", status: "Em revisão", icon: Clock3 },
  { name: "Quarta do hortifrúti", meta: "24 produtos · A4", status: "PDF pronto", icon: CheckCircle2 },
  { name: "Clube de descontos", meta: "16 produtos · A3", status: "PDF pronto", icon: CheckCircle2 },
];

export function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="page-stack">
      <PageHeader eyebrow="Boa tarde" title="O que vamos criar hoje?" description="Escolha um modelo, revise os produtos e deixe o restante com a gente." />

      <section className="hero-grid">
        <article className="hero-card">
          <div><span className="eyebrow">Fluxo guiado</span><h2>Cartazes prontos, do seu jeito.</h2><p>Importe a lista ou digite os produtos. Você revisa tudo antes de gerar.</p></div>
          <button className="primary-button" onClick={() => navigate("/gerar")}><Plus size={18} /> Criar cartazes</button>
          <div className="hero-steps" aria-label="Etapas"><span className="is-current">1</span><i /><span>2</span><i /><span>3</span><i /><span>4</span></div>
        </article>
        <ContinueCard />
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">Recentes</span><h2>Seus últimos trabalhos</h2></div><button className="text-button" onClick={() => navigate("/arquivos")}>Ver todos <ArrowRight size={16} /></button></div>
        <div className="recent-list">
          {recent.map(({ name, meta, status, icon: Icon }) => (
            <article className="recent-row" key={name}>
              <span className="file-icon"><LayoutTemplate size={20} /></span>
              <span className="recent-name"><strong>{name}</strong><small>{meta}</small></span>
              <span className={status === "PDF pronto" ? "status success" : "status warning"}><Icon size={14} /> {status}</span>
              <button className="secondary-button compact-button">{status === "PDF pronto" ? <><FileDown size={16} /> Baixar</> : <><RefreshCw size={16} /> Continuar</>}</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
