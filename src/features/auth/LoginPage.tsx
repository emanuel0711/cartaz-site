import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, LayoutTemplate, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { signIn, recover, isDemo } = useAuth();
  const [email, setEmail] = useState(isDemo ? "team@economix.example" : "");
  const [password, setPassword] = useState(isDemo ? "private-preview" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const error = await signIn(email, password);
    if (error) setMessage(error);
    setBusy(false);
  }

  async function handleRecovery() {
    setMessage(await recover(email));
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="Product introduction">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><LayoutTemplate size={22} /></span>
          <span>Cartaz Economix</span>
        </div>
        <div className="login-copy">
          <span className="eyebrow"><Sparkles size={15} /> Offers ready in minutes</span>
          <h1>From product list to print, without rework.</h1>
          <p>Create a design once, review your products, and generate every poster with the same consistent standard.</p>
          <ul className="benefit-list">
            <li><Check size={18} /> Dynamic fields anyone can understand</li>
            <li><Check size={18} /> Review before generating the PDF</li>
            <li><Check size={18} /> History for quick download and reprint</li>
          </ul>
        </div>
        <p className="privacy-note"><ShieldCheck size={16} /> One workspace for your designs, products, and files.</p>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Welcome back</span>
            <h2 id="login-title">Sign in</h2>
            <p>Continue where your team left off.</p>
          </div>

          {isDemo && <div className="demo-note">Private preview mode: use the filled-in details. Do not enter real credentials or business data.</div>}

          <label>
            <span>Email</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label>
            <span>Password</span>
            <span className="password-field">
              <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {message && <p className="form-message" role="status">{message}</p>}

          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}<ArrowRight size={18} />
          </button>
          <button className="text-button" type="button" onClick={handleRecovery}>Forgot my password</button>
        </form>
      </section>
    </main>
  );
}
