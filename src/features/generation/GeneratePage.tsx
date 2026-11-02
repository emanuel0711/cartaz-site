import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSearchParams } from "react-router-dom";
import { PosterCanvas } from "../../components/PosterCanvas";
import { formatMoney, parseMoney } from "../../domain/format";
import { downloadBatchPdf } from "../../domain/pdf";
import {
  findDuplicates,
  mapRows,
  MAX_PASTE_CHARACTERS,
  parseCsv,
  readProductFile,
  TEMPLATE_CSV,
  validateProduct,
} from "../../domain/products";
import type { Batch, Product } from "../../domain/types";
import { useAppStore } from "../../store/appStore";
import { newId } from "../../lib/id";
import { en } from "../../i18n/en";

const steps = ["Design", "Products", "Review data", "Preview", "Output"];

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cartaz-economix-products.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function GeneratePage() {
  const designs = useAppStore((state) => state.designs);
  const storedProducts = useAppStore((state) => state.products);
  const setStoredProducts = useAppStore((state) => state.setProducts);
  const addBatch = useAppStore((state) => state.addBatch);
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [designId, setDesignId] = useState(
    params.get("design") || designs[0]?.id || "",
  );
  const [secondDesignId, setSecondDesignId] = useState("");
  const [products, setProducts] = useState<Product[]>(storedProducts);
  const [paste, setPaste] = useState("");
  const [importError, setImportError] = useState("");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [copies, setCopies] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Batch | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [draftDescription, setDraftDescription] = useState("");
  const [descriptionHistory, setDescriptionHistory] = useState<
    Array<{ id: string; value: string }>
  >([]);
  const design = designs.find((item) => item.id === designId) || designs[0];
  const selectedProducts = products.filter((product) => product.selected);
  const duplicates = useMemo(() => findDuplicates(products), [products]);
  const errors = products.reduce(
    (sum, product) =>
      sum + product.issues.filter((issue) => issue.level === "error").length,
    0,
  );
  const warnings =
    products.reduce(
      (sum, product) =>
        sum +
        product.issues.filter((issue) => issue.level === "warning").length,
      0,
    ) + duplicates.size;
  function replaceProducts(next: Product[]) {
    setProducts(next);
    setStoredProducts(next);
    setImportError("");
  }
  function updateProduct(id: string, patch: Partial<Product>) {
    const next = products
      .map((product) =>
        product.id === id ? { ...product, ...patch } : product,
      )
      .map((product) => ({ ...product, issues: validateProduct(product) }));
    replaceProducts(next);
  }
  async function handleFile(file?: File) {
    if (!file) return;
    try {
      replaceProducts(mapRows(await readProductFile(file)));
      setStep(2);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "We could not read this file.",
      );
    }
  }
  function handlePaste() {
    try {
      if (paste.length > MAX_PASTE_CHARACTERS)
        throw new Error(
          "Pasted data is larger than the 2 million character limit.",
        );
      const rows = parseCsv(paste);
      const next = mapRows(rows);
      if (!next.length)
        throw new Error("Paste a header row and at least one product.");
      replaceProducts(next);
      setStep(2);
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "We could not parse this data.",
      );
    }
  }
  function addRow() {
    replaceProducts([
      ...products,
      {
        id: newId(),
        selected: true,
        description: "",
        reference: "",
        ean: "",
        normalPriceCents: null,
        promotionalPriceCents: null,
        installments: null,
        installmentValueCents: null,
        unit: "",
        package: "",
        size: "",
        note: "",
        bundlePriceCents: null,
        savingsCents: null,
        issues: [
          {
            level: "error",
            field: "description",
            message: "Description is required.",
          },
          {
            level: "error",
            field: "promotionalPriceCents",
            message: "Promotional price is required.",
          },
        ],
      },
    ]);
  }
  function openDescription(product: Product) {
    setEditingProduct(product);
    setDraftDescription(product.description);
  }
  function saveDescription() {
    if (!editingProduct) return;
    setDescriptionHistory((history) =>
      [
        ...history,
        { id: editingProduct.id, value: editingProduct.description },
      ].slice(-20),
    );
    updateProduct(editingProduct.id, { description: draftDescription });
    setEditingProduct(null);
  }
  function undoDescription() {
    const previous = descriptionHistory.at(-1);
    if (!previous) return;
    updateProduct(previous.id, { description: previous.value });
    setDescriptionHistory((history) => history.slice(0, -1));
  }
  async function generate() {
    setGenerating(true);
    try {
      const pages = selectedProducts.length * copies * (secondDesignId ? 2 : 1);
      if (pages > 1000)
        throw new Error(
          "This browser preview is limited to 1,000 PDF pages per batch.",
        );
      const batch: Batch = {
        id: newId(),
        name: `Poster batch ${new Date().toLocaleDateString("en-US")}`,
        designId,
        secondDesignId: secondDesignId || undefined,
        products: selectedProducts,
        copies,
        outputMode: "single",
        status: "ready",
        createdAt: new Date().toISOString(),
      };
      await downloadBatchPdf(batch, designs);
      addBatch(batch);
      setGenerated(batch);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "PDF generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }
  const canContinue =
    step === 0
      ? Boolean(designId)
      : step === 1
        ? products.length > 0
        : step === 2
          ? errors === 0 && selectedProducts.length > 0
          : true;
  return (
    <div className="wizard-page">
      <header className="wizard-header">
        <div>
          <span className="eyebrow">Create posters</span>
          <h1>{steps[step]}</h1>
        </div>
        <ol className="stepper">
          {steps.map((label, index) => (
            <li
              className={`${index === step ? "is-active" : ""} ${index < step ? "is-done" : ""}`}
              key={label}
            >
              <span>{index < step ? <Check size={14} /> : index + 1}</span>
              <em>{label}</em>
            </li>
          ))}
        </ol>
      </header>
      <main className="wizard-content">
        {step === 0 && (
          <section>
            <h2>Choose a design</h2>
            <p className="section-copy">
              Every selected product gets its own copy of this design.
            </p>
            <div className="choice-grid">
              {designs.map((item) => (
                <div
                  role="button"
                  tabIndex={0}
                  className={`design-choice ${designId === item.id ? "is-selected" : ""}`}
                  onClick={() => setDesignId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      setDesignId(item.id);
                  }}
                  key={item.id}
                >
                  <PosterCanvas
                    design={item}
                    product={products[0] || storedProducts[0]}
                    compact
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.widthMm} × {item.heightMm} mm
                    </small>
                  </span>
                  {designId === item.id && <Check size={18} />}
                </div>
              ))}
            </div>
            <label className="field-label">
              Optional second design
              <select
                value={secondDesignId}
                onChange={(event) => setSecondDesignId(event.target.value)}
              >
                <option value="">No second design</option>
                {designs
                  .filter((item) => item.id !== designId)
                  .map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
              <small>Creates two pages per product, one design per page.</small>
            </label>
          </section>
        )}
        {step === 1 && (
          <section className="import-layout">
            <div>
              <h2>Add products</h2>
              <p className="section-copy">
                Paste from Excel, upload a file, or continue with the sample
                products.
              </p>
              <textarea
                className="paste-area"
                value={paste}
                onChange={(event) => setPaste(event.target.value)}
                placeholder={
                  "DESCRIPTION\tEAN\tPROMOTIONAL PRICE\nWhole Milk 1L\t0789123400012\t4.99"
                }
                aria-label="Paste spreadsheet data"
              />
              <div className="inline-actions">
                <button
                  className="primary-button"
                  onClick={handlePaste}
                  disabled={!paste.trim()}
                >
                  <FileSpreadsheet size={18} /> Use pasted data
                </button>
                <button
                  className="secondary-button"
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={18} /> Upload .xlsx or .csv
                </button>
                <input
                  ref={fileInput}
                  hidden
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />
                <button className="text-button" onClick={downloadTemplate}>
                  <Download size={17} /> Download template
                </button>
              </div>
              {importError && (
                <p className="error-banner" role="alert">
                  {importError}
                </p>
              )}
            </div>
            <div
              className="drop-card"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void handleFile(event.dataTransfer.files[0]);
              }}
            >
              <Upload size={30} />
              <h3>Drop your spreadsheet here</h3>
              <p>CSV or XLSX, up to 16 MB and 5,000 products.</p>
            </div>
          </section>
        )}
        {step === 2 && (
          <section>
            <div className="review-heading">
              <div>
                <h2>{en.generation.reviewTitle}</h2>
                <p className="section-copy">{en.generation.reviewHelp}</p>
                {descriptionHistory.length > 0 && (
                  <button className="text-button" onClick={undoDescription}>
                    {en.generation.undo}
                  </button>
                )}
              </div>
              <div className="issue-summary">
                <span className="error">
                  <AlertTriangle size={15} /> {errors} errors
                </span>
                <span className="warning">
                  <AlertTriangle size={15} /> {warnings} warnings
                </span>
                <span className="success">
                  <Check size={15} />{" "}
                  {products.length -
                    products.filter((product) =>
                      product.issues.some((issue) => issue.level === "error"),
                    ).length}{" "}
                  ready
                </span>
              </div>
            </div>
            <div className="product-table-wrap">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>
                      <span className="sr-only">Include</span>
                    </th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>EAN</th>
                    <th>Regular price</th>
                    <th>Promotional price</th>
                    <th>Unit</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const rowErrors = product.issues.filter(
                      (issue) => issue.level === "error",
                    );
                    const rowWarnings = product.issues.filter(
                      (issue) => issue.level === "warning",
                    );
                    return (
                      <tr
                        key={product.id}
                        className={rowErrors.length ? "has-error" : ""}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={product.selected}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                selected: event.target.checked,
                              })
                            }
                            aria-label={`Include ${product.description || "product"}`}
                          />
                        </td>
                        <td>
                          <span
                            className={`row-status ${rowErrors.length ? "error" : rowWarnings.length || duplicates.has(product.id) ? "warning" : "success"}`}
                            title={[...rowErrors, ...rowWarnings]
                              .map((issue) => issue.message)
                              .join("\n")}
                          >
                            {rowErrors.length
                              ? "Error"
                              : rowWarnings.length || duplicates.has(product.id)
                                ? "Warning"
                                : "OK"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="table-edit-button"
                            onClick={() => openDescription(product)}
                            aria-label={`Edit description: ${product.description || "empty"}`}
                          >
                            {product.description || "Empty description"}
                          </button>
                        </td>
                        <td>
                          <input
                            inputMode="numeric"
                            value={product.ean}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                ean: event.target.value.replace(/\D/g, ""),
                              })
                            }
                            aria-label="EAN"
                          />
                        </td>
                        <td>
                          <input
                            inputMode="decimal"
                            defaultValue={
                              product.normalPriceCents === null
                                ? ""
                                : (product.normalPriceCents / 100).toFixed(2)
                            }
                            onBlur={(event) =>
                              updateProduct(product.id, {
                                normalPriceCents: parseMoney(
                                  event.target.value,
                                ),
                              })
                            }
                            aria-label="Regular price"
                          />
                        </td>
                        <td>
                          <input
                            inputMode="decimal"
                            defaultValue={
                              product.promotionalPriceCents === null
                                ? ""
                                : (product.promotionalPriceCents / 100).toFixed(
                                    2,
                                  )
                            }
                            onBlur={(event) =>
                              updateProduct(product.id, {
                                promotionalPriceCents: parseMoney(
                                  event.target.value,
                                ),
                              })
                            }
                            aria-label="Promotional price"
                          />
                        </td>
                        <td>
                          <input
                            value={product.unit}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                unit: event.target.value,
                              })
                            }
                            aria-label="Unit"
                          />
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            onClick={() =>
                              replaceProducts(
                                products.filter(
                                  (item) => item.id !== product.id,
                                ),
                              )
                            }
                            aria-label="Delete row"
                            title="Delete row"
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button className="secondary-button" onClick={addRow}>
              <Plus size={17} /> Add row
            </button>
          </section>
        )}
        {step === 3 && design && selectedProducts.length > 0 && (
          <section className="preview-layout">
            <div>
              <h2>Final preview</h2>
              <p className="section-copy">
                This preview uses the same design definition as the PDF.
              </p>
              <PosterCanvas
                design={
                  designs.find(
                    (item) =>
                      item.id === selectedProducts[previewIndex]?.designId,
                  ) || design
                }
                product={selectedProducts[previewIndex]}
              />
            </div>
            <aside className="preview-sidebar">
              <span className="eyebrow">
                Product {previewIndex + 1} of {selectedProducts.length}
              </span>
              <h3>{selectedProducts[previewIndex].description}</h3>
              <dl>
                <div>
                  <dt>EAN</dt>
                  <dd>{selectedProducts[previewIndex].ean || "—"}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>
                    {formatMoney(
                      selectedProducts[previewIndex].promotionalPriceCents,
                    )}
                  </dd>
                </div>
              </dl>
              <div className="inline-actions">
                <button
                  className="secondary-button"
                  disabled={previewIndex === 0}
                  onClick={() => setPreviewIndex(previewIndex - 1)}
                >
                  Previous
                </button>
                <button
                  className="secondary-button"
                  disabled={previewIndex === selectedProducts.length - 1}
                  onClick={() => setPreviewIndex(previewIndex + 1)}
                >
                  Next
                </button>
              </div>
            </aside>
          </section>
        )}
        {step === 4 && (
          <section className="output-layout">
            <div>
              <h2>Output</h2>
              <p className="section-copy">
                Generate a single vector PDF with one page per poster.
              </p>
              <div className="settings-card">
                <label>
                  Copies per product
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={copies}
                    onChange={(event) =>
                      setCopies(
                        Math.min(20, Math.max(1, Number(event.target.value))),
                      )
                    }
                  />
                </label>
                <div>
                  <span>Pages</span>
                  <strong>
                    {selectedProducts.length *
                      copies *
                      (secondDesignId ? 2 : 1)}
                  </strong>
                </div>
                <div>
                  <span>Page size</span>
                  <strong>
                    {design.widthMm} × {design.heightMm} mm
                  </strong>
                </div>
                <div>
                  <span>Output</span>
                  <strong>Single vector PDF</strong>
                </div>
              </div>
              <button
                className="primary-button generate-button"
                onClick={() => void generate()}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="spin" size={19} /> Generating PDF…
                  </>
                ) : (
                  <>
                    <FileText size={19} /> Generate and download PDF
                  </>
                )}
              </button>
              {importError && (
                <p className="error-banner" role="alert">
                  {importError}
                </p>
              )}
              {generated && (
                <div className="success-banner">
                  <Check size={20} />
                  <div>
                    <strong>PDF generated</strong>
                    <span>It was downloaded and saved in Files.</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <footer className="wizard-footer">
        <button
          className="secondary-button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <span>{selectedProducts.length} products selected</span>
        {step < 4 && (
          <button
            className="primary-button"
            onClick={() => setStep(step + 1)}
            disabled={!canContinue}
          >
            Continue <ArrowRight size={18} />
          </button>
        )}
      </footer>
      <Dialog.Root
        open={Boolean(editingProduct)}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="dialog-content"
            aria-describedby="description-edit-help"
          >
            <Dialog.Title>{en.generation.editDescription}</Dialog.Title>
            <p id="description-edit-help">
              Edit the product name and check its fit before saving.
            </p>
            <p className="original-value">
              <strong>{en.generation.original}:</strong>{" "}
              {editingProduct?.description || "—"}
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveDescription();
              }}
            >
              <label>
                Description
                <textarea
                  autoFocus
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  maxLength={1000}
                />
              </label>
              <div className="character-count" aria-live="polite">
                {draftDescription.length}/1000 {en.generation.characterCount}
              </div>
              {draftDescription.length > 120 && (
                <p className="warning-banner" role="alert">
                  {en.generation.tooLong}
                </p>
              )}
              {editingProduct && design && (
                <div className="modal-poster-preview">
                  <span>{en.generation.livePreview}</span>
                  <PosterCanvas
                    design={
                      designs.find(
                        (item) => item.id === editingProduct.designId,
                      ) || design
                    }
                    product={{
                      ...editingProduct,
                      description: draftDescription,
                    }}
                    compact
                  />
                </div>
              )}
              <div className="dialog-actions">
                <Dialog.Close asChild>
                  <button type="button" className="secondary-button">
                    {en.common.cancel}
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={!draftDescription.trim()}
                >
                  {en.common.save}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
