import {
  Archive,
  Copy,
  Edit3,
  Plus,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PosterCanvas } from "../../components/PosterCanvas";
import { PageHeader } from "../../components/AppShell";
import { sampleProducts } from "../../domain/fixtures";
import type { DesignStatus, TltImportReport } from "../../domain/types";
import { importTltHar } from "../../domain/tlt";
import { en } from "../../i18n/en";
import { useAppStore } from "../../store/appStore";
import { newId } from "../../lib/id";

export function DesignsPage() {
  const { designs, duplicateDesign, archiveDesign } = useAppStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DesignStatus | "all">("all");
  const navigate = useNavigate();
  const tltInput = useRef<HTMLInputElement>(null);
  const backgroundInput = useRef<HTMLInputElement>(null);
  const [reports, setReports] = useState<TltImportReport[]>([]);
  const [importError, setImportError] = useState("");
  const filtered = useMemo(
    () =>
      designs.filter(
        (design) =>
          design.name.toLowerCase().includes(query.toLowerCase()) &&
          (status === "all" || design.status === status),
      ),
    [designs, query, status],
  );
  function createDesign() {
    const id = newId();
    const source = designs[0];
    useAppStore.getState().addDesign({
      ...source,
      id,
      name: "Untitled design",
      status: "draft",
      version: 1,
      updatedAt: new Date().toISOString(),
      elements: source.elements.map((element) => ({
        ...element,
        id: newId(),
      })),
    });
    navigate(`/designs/${id}/edit`);
  }
  async function importHar(file?: File) {
    if (!file) return;
    try {
      const result = importTltHar(JSON.parse(await file.text()));
      if (!result.designs.length) throw new Error(en.tlt.noDesigns);
      useAppStore.getState().addDesigns(result.designs);
      setReports(result.reports);
      setImportError("");
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "The TLT capture could not be imported.",
      );
    }
  }
  async function importBackground(file?: File) {
    if (!file) return;
    if (
      !/^image\/(png|jpeg|webp)$/.test(file.type) ||
      file.size > 10 * 1024 * 1024
    )
      return setImportError("Choose a PNG, JPEG, or WebP image up to 10 MB.");
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const id = newId();
    const base = designs[0];
    useAppStore.getState().addDesign({
      ...base,
      id,
      name: `${file.name} background`,
      status: "draft",
      backgroundImageDataUrl: source,
      elements: [],
      version: 1,
      updatedAt: new Date().toISOString(),
    });
    navigate(`/designs/${id}/edit`);
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Library"
        title="Designs"
        description="Templates, drafts, and published designs in one clear workspace."
        action={
          <button className="primary-button" onClick={createDesign}>
            <Plus size={18} /> New design
          </button>
        }
      />
      <section className="toolbar-card tlt-import-card">
        <div>
          <strong>{en.tlt.title}</strong>
          <p>{en.tlt.help}</p>
        </div>
        <div className="inline-actions">
          <button
            className="secondary-button"
            onClick={() => tltInput.current?.click()}
          >
            <Upload size={17} /> {en.tlt.choose}
          </button>
          <input
            ref={tltInput}
            hidden
            type="file"
            accept=".har,application/json"
            onChange={(event) => void importHar(event.target.files?.[0])}
          />
          <button
            className="text-button"
            onClick={() => backgroundInput.current?.click()}
          >
            <Upload size={17} /> Import background image
          </button>
          <input
            ref={backgroundInput}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => void importBackground(event.target.files?.[0])}
          />
        </div>
      </section>
      {importError && (
        <p className="error-banner" role="alert">
          {importError}
        </p>
      )}
      {reports.length > 0 && (
        <details className="settings-panel">
          <summary>
            TLT import report —{" "}
            {reports.filter((item) => item.status !== "failed").length}{" "}
            converted,{" "}
            {reports.filter((item) => item.status === "failed").length}{" "}
            unavailable
          </summary>
          <ul>
            {reports.map((report) => (
              <li key={`${report.sourceId}-${report.name}`}>
                <strong>{report.name}</strong> — {report.status}
                {report.warnings.length ? `: ${report.warnings.join(" ")}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="toolbar-card">
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search designs"
            aria-label="Search designs"
          />
        </label>
        <div className="segmented" aria-label="Filter designs">
          {(["all", "template", "draft", "published"] as const).map((item) => (
            <button
              className={status === item ? "is-active" : ""}
              onClick={() => setStatus(item)}
              key={item}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {filtered.length ? (
        <div className="design-grid">
          {filtered.map((design) => (
            <article className="design-card" key={design.id}>
              <div className="design-thumb">
                <PosterCanvas
                  design={design}
                  product={sampleProducts[0]}
                  compact
                />
              </div>
              <div className="design-meta">
                <div>
                  <span
                    className={`status ${design.status === "published" ? "success" : "neutral"}`}
                  >
                    {design.status}
                  </span>
                  <h2>{design.name}</h2>
                  <p>
                    {design.widthMm} × {design.heightMm} mm · v{design.version}
                  </p>
                </div>
              </div>
              <div className="design-actions">
                <button
                  className="primary-button"
                  onClick={() => navigate(`/generate?design=${design.id}`)}
                >
                  <Sparkles size={16} /> Use
                </button>
                <button
                  className="secondary-button"
                  onClick={() => navigate(`/designs/${design.id}/edit`)}
                >
                  <Edit3 size={16} /> Edit
                </button>
                <button
                  className="text-button"
                  onClick={() => duplicateDesign(design.id)}
                >
                  <Copy size={16} /> Duplicate
                </button>
                <button
                  className="archive-button"
                  onClick={() => {
                    if (
                      confirm(
                        `Archive “${design.name}”? You can restore it from version history in a future release.`,
                      )
                    )
                      archiveDesign(design.id);
                  }}
                >
                  <Archive size={16} /> Archive
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <Search size={28} />
          <h2>No designs found</h2>
          <p>Try another search or create a new design.</p>
        </section>
      )}
    </div>
  );
}
