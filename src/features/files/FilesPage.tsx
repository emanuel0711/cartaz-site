import { Download, FileText, History, RefreshCw } from "lucide-react";
import { PageHeader } from "../../components/AppShell";
import { downloadBatchPdf } from "../../domain/pdf";
import { useAppStore } from "../../store/appStore";

export function FilesPage() {
  const batches = useAppStore((state) => state.batches);
  const designs = useAppStore((state) => state.designs);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="History"
        title="Files"
        description="Download and reprint completed batches without rebuilding them."
      />
      {batches.length ? (
        <div className="file-grid">
          {batches.map((batch) => (
            <article className="file-card" key={batch.id}>
              <span className="file-icon large">
                <FileText size={24} />
              </span>
              <div>
                <span className="status success">PDF ready</span>
                <h2>{batch.name}</h2>
                <p>
                  {batch.products.length} products · {batch.copies}{" "}
                  {batch.copies === 1 ? "copy" : "copies"} ·{" "}
                  {new Date(batch.createdAt).toLocaleString("en-US")}
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={() => void downloadBatchPdf(batch, designs)}
              >
                <Download size={17} /> Download again
              </button>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <History size={30} />
          <h2>No generated files yet</h2>
          <p>
            Your completed PDF batches will appear here for quick reprinting.
          </p>
        </section>
      )}
      <div className="retention-note">
        <RefreshCw size={17} />
        <p>
          Preview history is stored in this browser. Configure Supabase before
          using real business data or sharing across devices.
        </p>
      </div>
    </div>
  );
}
