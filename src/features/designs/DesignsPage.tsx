import { Archive, Copy, Edit3, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PosterCanvas } from "../../components/PosterCanvas";
import { PageHeader } from "../../components/AppShell";
import { sampleProducts } from "../../domain/fixtures";
import type { DesignStatus } from "../../domain/types";
import { useAppStore } from "../../store/appStore";
import { newId } from "../../lib/id";

export function DesignsPage() {
  const { designs, duplicateDesign, archiveDesign } = useAppStore();
  const [query, setQuery] = useState(""); const [status, setStatus] = useState<DesignStatus | "all">("all");
  const navigate = useNavigate();
  const filtered = useMemo(() => designs.filter((design) => design.name.toLowerCase().includes(query.toLowerCase()) && (status === "all" || design.status === status)), [designs, query, status]);
  function createDesign() {
    const id = newId(); const source = designs[0];
    useAppStore.getState().addDesign({ ...source, id, name: "Untitled design", status: "draft", version: 1, updatedAt: new Date().toISOString(), elements: source.elements.map((element) => ({ ...element, id: newId() })) });
    navigate(`/designs/${id}/edit`);
  }
  return <div className="page-stack">
    <PageHeader eyebrow="Library" title="Designs" description="Templates, drafts, and published designs in one clear workspace." action={<button className="primary-button" onClick={createDesign}><Plus size={18} /> New design</button>} />
    <div className="toolbar-card">
      <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search designs" aria-label="Search designs" /></label>
      <div className="segmented" aria-label="Filter designs">{(["all", "template", "draft", "published"] as const).map((item) => <button className={status === item ? "is-active" : ""} onClick={() => setStatus(item)} key={item}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
    </div>
    {filtered.length ? <div className="design-grid">{filtered.map((design) => <article className="design-card" key={design.id}>
      <div className="design-thumb"><PosterCanvas design={design} product={sampleProducts[0]} compact /></div>
      <div className="design-meta"><div><span className={`status ${design.status === "published" ? "success" : "neutral"}`}>{design.status}</span><h2>{design.name}</h2><p>{design.widthMm} × {design.heightMm} mm · v{design.version}</p></div></div>
      <div className="design-actions"><button className="primary-button" onClick={() => navigate(`/generate?design=${design.id}`)}><Sparkles size={16} /> Use</button><button className="secondary-button" onClick={() => navigate(`/designs/${design.id}/edit`)}><Edit3 size={16} /> Edit</button><button className="text-button" onClick={() => duplicateDesign(design.id)}><Copy size={16} /> Duplicate</button><button className="archive-button" onClick={() => { if (confirm(`Archive “${design.name}”? You can restore it from version history in a future release.`)) archiveDesign(design.id); }}><Archive size={16} /> Archive</button></div>
    </article>)}</div> : <section className="empty-state"><Search size={28} /><h2>No designs found</h2><p>Try another search or create a new design.</p></section>}
  </div>;
}
