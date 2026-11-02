import {
  Download,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "../../components/AppShell";
import { createBackup, parseBackup } from "../../domain/backup";
import { en } from "../../i18n/en";
import {
  activateStoredImpact,
  clearImpactFont,
  storeImpactFile,
} from "../../lib/impactFont";
import { useAppStore } from "../../store/appStore";
import { useAuth } from "../auth/AuthProvider";

export function SettingsPage() {
  const store = useAppStore();
  const { user, isDemo } = useAuth();
  const [name, setName] = useState(store.brandName);
  const [color, setColor] = useState(store.brandColor);
  const [saved, setSaved] = useState(false);
  const [fontState, setFontState] = useState<
    "uploaded" | "system" | "fallback"
  >("fallback");
  const [message, setMessage] = useState("");
  const backupInput = useRef<HTMLInputElement>(null);
  const fontInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void activateStoredImpact().then(setFontState);
  }, []);

  function exportAll() {
    const text = createBackup({
      designs: store.designs,
      products: store.products,
      batches: store.batches,
      brandName: store.brandName,
      brandColor: store.brandColor,
    });
    const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `cartaz-economix-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  async function importAll(file?: File) {
    if (!file || !confirm(en.settings.overwriteWarning)) return;
    try {
      store.replaceAll(parseBackup(await file.text()));
      setMessage("Backup imported successfully.");
    } catch {
      setMessage(en.settings.backupInvalid);
    }
  }
  async function uploadFont(file?: File) {
    if (!file) return;
    try {
      await storeImpactFile(file);
      setFontState("uploaded");
      setMessage(en.settings.fontStored);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The font could not be loaded.",
      );
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your local workspace, brand, fonts, and portable backup."
      />
      <div className="settings-grid">
        <section className="settings-panel">
          <h2>Brand</h2>
          <p>Used in the workspace and branded templates.</p>
          <label>
            Brand name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
            />
          </label>
          <label>
            Accent color
            <span className="color-control">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
              <code>{color}</code>
            </span>
          </label>
          <button
            className="primary-button"
            onClick={() => {
              store.setBrand(name, color);
              setSaved(true);
            }}
          >
            <Save size={17} /> {saved ? en.common.saved : "Save brand"}
          </button>
        </section>
        <section className="settings-panel">
          <h2>{en.settings.impact}</h2>
          <p>
            Impact is proprietary. Upload your own licensed TTF, or the bundled
            open-license Anton fallback is used.
          </p>
          <div className="account-security">
            <ShieldCheck size={20} />
            <div>
              <strong>
                {fontState === "uploaded"
                  ? "Licensed Impact uploaded"
                  : fontState === "system"
                    ? "System Impact detected"
                    : "Anton fallback active"}
              </strong>
              <span>
                {fontState === "fallback"
                  ? en.editor.impactWarning
                  : "Browser preview and PDF use the selected local font source."}
              </span>
            </div>
          </div>
          <button
            className="secondary-button"
            onClick={() => fontInput.current?.click()}
          >
            <Upload size={17} /> {en.settings.uploadImpact}
          </button>
          <input
            ref={fontInput}
            hidden
            type="file"
            accept=".ttf,font/ttf"
            onChange={(event) => void uploadFont(event.target.files?.[0])}
          />
          {fontState === "uploaded" && (
            <button
              className="text-button"
              onClick={() => void clearImpactFont().then(setFontState)}
            >
              <Trash2 size={17} /> {en.settings.removeImpact}
            </button>
          )}
        </section>
        <section className="settings-panel">
          <h2>{en.settings.backup}</h2>
          <p>
            Move all local data between computers with one versioned JSON file.
          </p>
          <button className="secondary-button" onClick={exportAll}>
            <Download size={17} /> {en.settings.exportAll}
          </button>
          <button
            className="secondary-button"
            onClick={() => backupInput.current?.click()}
          >
            <Upload size={17} /> {en.settings.importAll}
          </button>
          <input
            ref={backupInput}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importAll(event.target.files?.[0])}
          />
        </section>
        <section className="settings-panel">
          <h2>Workspace mode</h2>
          <div className="account-security">
            <ShieldCheck size={20} />
            <div>
              <strong>
                {isDemo ? en.localMode : "Supabase authentication"}
              </strong>
              <span>
                {isDemo
                  ? "No pretend login is used. Data stays in IndexedDB in this browser."
                  : `Signed in as ${user?.email || "account user"}.`}
              </span>
            </div>
          </div>
          {isDemo && (
            <button
              className="secondary-button"
              onClick={() => {
                if (
                  confirm(
                    "Reset all local designs, products, and file history?",
                  )
                )
                  store.resetDemo();
              }}
            >
              <RotateCcw size={17} /> Reset local data
            </button>
          )}
        </section>
      </div>
      {message && (
        <p className="notice-banner" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
