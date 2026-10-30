import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, LayoutTemplate, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { signIn, recover, isDemo } = useAuth();
  const [email, setEmail] = useState(isDemo ? "equipe@economix.com.br" : "");
  const [password, setPassword] = useState(isDemo ? "demonstracao" : "");
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
      <section className="login-story" aria-label="Apresentação do produto">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><LayoutTemplate size={22} /></span>
          <span>Cartaz Economix</span>
        </div>
        <div className="login-copy">
          <span className="eyebrow"><Sparkles size={15} /> Ofertas prontas em minutos</span>
          <h1>Do produto à impressão, sem retrabalho.</h1>
          <p>Crie um modelo uma vez, revise seus produtos e gere todos os cartazes com o mesmo padrão.</p>
          <ul className="benefit-list">
            <li><Check size={18} /> Campos dinâmicos fáceis de entender</li>
            <li><Check size={18} /> Revisão antes de gerar o PDF</li>
            <li><Check size={18} /> Histórico para baixar e reimprimir</li>
          </ul>
        </div>
        <p className="privacy-note"><ShieldCheck size={16} /> Acesso organizado por conta e equipe.</p>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Bem-vindo de volta</span>
            <h2 id="login-title">Entrar</h2>
            <p>Continue de onde sua equipe parou.</p>
          </div>

          {isDemo && <div className="demo-note">Prévia da fase A: use os dados preenchidos para entrar.</div>}

          <label>
            <span>E-mail</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label>
            <span>Senha</span>
            <span className="password-field">
              <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {message && <p className="form-message" role="status">{message}</p>}

          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}<ArrowRight size={18} />
          </button>
          <button className="text-button" type="button" onClick={handleRecovery}>Esqueci minha senha</button>
        </form>
      </section>
    </main>
  );
}
