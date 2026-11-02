import {
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContinueCard, PageHeader } from "../../components/AppShell";
import { useAppStore } from "../../store/appStore";

export function DashboardPage() {
  const navigate = useNavigate();
  const batches = useAppStore((state) => state.batches);
  const designs = useAppStore((state) => state.designs);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Good to see you"
        title="What are we creating today?"
        description="Choose a design, review your products, and generate print-ready posters in one guided flow."
      />
      <div className="hero-grid">
        <section className="hero-card">
          <div>
            <span className="eyebrow">
              <Sparkles size={15} /> Guided workflow
            </span>
            <h2>Posters ready, your way.</h2>
            <p>
              Paste a spreadsheet or type products. You review everything before
              the PDF is generated.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate("/generate")}
          >
            <Plus size={18} /> Create posters
          </button>
          <div className="hero-steps" aria-label="Workflow steps">
            <span className="is-current">1</span>
            <i />
            <span>2</span>
            <i />
            <span>3</span>
            <i />
            <span>4</span>
            <i />
            <span>5</span>
          </div>
        </section>
        <ContinueCard />
      </div>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Workspace</span>
            <h2>At a glance</h2>
          </div>
        </div>
        <div className="metric-grid">
          <article>
            <FileText size={20} />
            <strong>{designs.length}</strong>
            <span>active designs</span>
          </article>
          <article>
            <CheckCircle2 size={20} />
            <strong>{batches.length}</strong>
            <span>generated batches</span>
          </article>
          <article>
            <Clock3 size={20} />
            <strong>Local</strong>
            <span>preview storage</span>
          </article>
        </div>
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Recent</span>
            <h2>Your latest work</h2>
          </div>
          <button className="text-button" onClick={() => navigate("/files")}>
            View all
          </button>
        </div>
        {batches.length ? (
          <div className="recent-list">
            {batches.slice(0, 3).map((batch) => (
              <div className="recent-row" key={batch.id}>
                <span className="file-icon">
                  <FileText size={19} />
                </span>
                <span className="recent-name">
                  <strong>{batch.name}</strong>
                  <small>{batch.products.length} products</small>
                </span>
                <span className="status success">
                  <CheckCircle2 size={14} /> PDF ready
                </span>
                <button
                  className="secondary-button compact-button"
                  onClick={() => navigate("/files")}
                >
                  <Download size={15} /> Open
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            <RefreshCw size={21} />
            <span>Your generated batches will appear here.</span>
            <button
              className="text-button"
              onClick={() => navigate("/generate")}
            >
              Create the first one
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
