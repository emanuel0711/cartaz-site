import { RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/AppShell";
import { useAuth } from "../auth/AuthProvider";
import { useAppStore } from "../../store/appStore";

export function SettingsPage() {
  const storeName = useAppStore((state) => state.brandName), storeColor = useAppStore((state) => state.brandColor); const setBrand = useAppStore((state) => state.setBrand); const resetDemo = useAppStore((state) => state.resetDemo); const { user, isDemo } = useAuth();
  const [name, setName] = useState(storeName); const [color, setColor] = useState(storeColor); const [saved, setSaved] = useState(false);
  return <div className="page-stack"><PageHeader eyebrow="Workspace" title="Settings" description="Manage your brand and account preferences." /><div className="settings-grid"><section className="settings-panel"><h2>Brand</h2><p>Used in the workspace and future branded templates.</p><label>Brand name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} /></label><label>Accent color<span className="color-control"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /><code>{color}</code></span></label><button className="primary-button" onClick={() => { setBrand(name, color); setSaved(true); }}><Save size={17} /> {saved ? "Saved" : "Save brand"}</button></section><section className="settings-panel"><h2>Account</h2><p>{user?.email}</p><div className="account-security"><ShieldCheck size={20} /><div><strong>{isDemo ? "Private preview mode" : "Supabase authentication"}</strong><span>{isDemo ? "Data stays in this browser and is not suitable for production." : "Session management is provided by Supabase Auth."}</span></div></div>{isDemo && <button className="secondary-button" onClick={() => { if (confirm("Reset all local preview designs, products, and file history?")) resetDemo(); }}><RotateCcw size={17} /> Reset preview data</button>}</section></div></div>;
}
