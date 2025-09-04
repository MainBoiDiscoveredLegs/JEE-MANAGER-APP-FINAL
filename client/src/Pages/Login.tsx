import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, EnvelopeSimple, LockKey, Eye, EyeClosed } from 'phosphor-react';
import API from "../api";

type Mode = "login" | "register";

function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regEmailConfirm, setRegEmailConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showModal, setShowModal] = useState<null | "terms" | "privacy">(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const resetFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const validateLogin = () => {
    if (loginUsername.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return false;
    }
    if (loginPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const validateRegister = () => {
    const errs: Record<string, string> = {};
    const cleanName = (s: string) => s.trim().replace(/\s+/g, " ");
    const nameOk = (s: string) => /^[A-Za-z\u00C0-\u024F' -]{1,50}$/.test(s);
    const emailOk = (s: string) =>
      /^(?=.{3,254}$)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(s.trim());
    const isDisposable = (s: string) =>
      /@(mailinator\.com|10minutemail\.com|yopmail\.com|guerrillamail\.com|temp-mail\.org)$/i.test(
        s
      );

    // First name
    const fn = cleanName(regFirstName);
    if (!fn) errs.first_name = "First name is required.";
    else if (!nameOk(fn))
      errs.first_name = "Use 1-50 letters, spaces, hyphens or apostrophes.";

    // Last name
    const ln = cleanName(regLastName);
    if (!ln) errs.last_name = "Last name is required.";
    else if (!nameOk(ln))
      errs.last_name = "Use 1-50 letters, spaces, hyphens or apostrophes.";

    // Email + confirm
    const em = regEmail.trim();
    const emc = regEmailConfirm.trim();
    if (!em) errs.email = "Email is required.";
    else if (!emailOk(em)) errs.email = "Enter a valid email address.";
    else if (isDisposable(em)) errs.email = "Disposable email addresses are not allowed.";
    if (!emc) errs.email_confirm = "Please confirm your email.";
    else if (em.toLowerCase() !== emc.toLowerCase())
      errs.email_confirm = "Email addresses do not match.";

    // Username
    const un = regUsername.trim();
    if (un.length < 3) errs.username = "Username must be at least 3 characters.";

    // Password
    if (regPassword.length < 6)
      errs.password = "Password must be at least 6 characters.";

    // Consent
    if (!acceptTerms) errs.consent = "You must accept the Terms and Privacy Policy.";

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Please correct the highlighted fields.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    if (!validateLogin()) return;

    try {
      setSubmitting(true);
      const response = await API.post("token/", {
        username: loginUsername,
        password: loginPassword,
      });
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      setSuccess("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      setError("Invalid username or password.");
      console.error("Login error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    if (!validateRegister()) return;

    try {
      setSubmitting(true);
      const first_name = regFirstName.trim().replace(/\s+/g, " ");
      const last_name = regLastName.trim().replace(/\s+/g, " ");
      const email = regEmail.trim().toLowerCase();

      const response = await API.post("auth/users/", {
        username: regUsername.trim(),
        password: regPassword,
        first_name,
        last_name,
        email,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      setSuccess("Account created. You're all set!");
      navigate(response.data?.next || "/dashboard");
    } catch (err: any) {
      const resp = err?.response;
      let msg = "Registration failed.";
      const newFieldErrors: Record<string, string> = {};
      if (resp && resp.data) {
        const data = resp.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (data.error && typeof data.error === 'string') {
          msg = data.error;
        } else if (typeof data === 'object') {
          const parts: string[] = [];
          Object.keys(data).forEach((k) => {
            const v = (data as any)[k];
            if (Array.isArray(v)) {
              const combined = v.join(' ');
              parts.push(combined);
              if (['username', 'password', 'first_name', 'last_name', 'email', 'email_confirm'].includes(k)) {
                newFieldErrors[k] = combined;
              }
            } else if (typeof v === 'string') {
              parts.push(v);
              if (['username', 'password', 'first_name', 'last_name', 'email', 'email_confirm'].includes(k)) {
                newFieldErrors[k] = v;
              }
            }
          });
          if (parts.length > 0) msg = parts.join(' ');
        }
      }

      if (Object.keys(newFieldErrors).length > 0) setFieldErrors((fe) => ({ ...fe, ...newFieldErrors }));

      const detail = resp?.data?.detail;
      setError(detail ? `${msg} — ${detail}` : msg);

      console.error('Registration error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const nameOkLite = (s: string) => !!s.trim() && /^[A-Za-z\u00C0-\u024F' -]{1,50}$/.test(s.trim().replace(/\s+/g, " "));
  const emailOkLite = (s: string) =>
    /^(?=.{3,254}$)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(s.trim());
  const emailsMatch = regEmail.trim().length > 0 && regEmailConfirm.trim().length > 0 &&
    regEmail.trim().toLowerCase() === regEmailConfirm.trim().toLowerCase();
  const canSubmitRegister =
    nameOkLite(regFirstName) &&
    nameOkLite(regLastName) &&
    emailOkLite(regEmail) &&
    emailsMatch &&
    regUsername.trim().length >= 3 &&
    regPassword.length >= 6 &&
    acceptTerms;

  return (
    <div className="auth-page" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace' }}>
      <div
        className="auth-card ds-card"
        role="dialog"
        aria-labelledby="auth-title"
        aria-describedby="auth-desc"
        style={{ maxWidth: 560, width: 'min(96%,560px)', padding: '28px 54px' }}
      >

        <div className="auth-brand" style={{ textAlign: 'center', marginBottom: 8 }}>
          <div aria-hidden="true" style={{ color: 'inherit', lineHeight: 1.05, fontFamily: 'inherit' }}>
            <pre className="ascii-anim" style={{ margin: 0, fontSize: 20 }}>
              {String.raw`
|￣￣￣￣￣￣￣￣￣￣￣￣|
|       WELCOME!       |
|＿＿＿＿＿＿＿＿＿＿＿＿|
       ||
(\__/) ||
(•ㅅ•) ||
/ づ

`}
            </pre>
            <div className="ascii-compact" aria-hidden style={{ marginTop: 6, fontSize: 14 }}>
              <pre style={{ margin: 0, lineHeight: 1 }}>{String.raw`•ㅅ•`}</pre>
            </div>
          </div>
          <h1 id="auth-title" style={{ margin: '8px 0 4px', letterSpacing: 1, fontSize: 22 }}>
            {mode === 'login' ? 'LOGIN' : 'REGISTER'}
          </h1>
          <p id="auth-desc" className="ds-muted" style={{ margin: 0, height: 0, overflow: 'hidden' }} aria-hidden>

          </p>
        </div>

        <style>{` 
        @keyframes bob {
     0%{
        transform: translateY(0)
    }
    50%{
        transform: translateY(-4px)
    }
    100%{
        transform: translateY(0)
    }
    }
    .ascii-anim{
        display:inline-block;
        animation: bob 2.6s ease-in-out infinite;
        transition: transform .25s;
        color: inherit 
    }
    .icon-left{
        position:absolute;
        left:12px;
        top:50%;
        transform:translateY(-50%);
        width:20px;
        height:20px;
        opacity:.95;
        fill: currentColor;
        pointer-events:none 
    }
    .input-with-icon{
        position: relative 
    }
    .input-with-icon input{
        padding-left:44px;
        padding-top:10px;
        padding-bottom:10px;
        min-height:44px;
        border-radius:6px 
    }
    .ds-label{
        color: inherit;
        font-size:13px 
    }
    .ds-input{
        color: var(--ds-on-surface);
        background: var(--ds-surface);
        border: 1px solid var(--ds-border);
        box-sizing: border-box;
        width:100% 
    }
    .ds-input{
        font-family: inherit 
    }
    .ds-input::placeholder{
        color: rgba(17,24,39,0.55) 
    }
    .ds-helper{
        color: inherit;
        opacity: .78;
        font-size: 13px 
    }
    .icon-toggle{
        background: transparent;
        border: none;
        padding: 8px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        color: inherit;
        width:36px;
        height:36px;
        border-radius:6px 
    }
    .icon-toggle:hover{
        background: rgba(0,0,0,0.04) 
    }
    .modal-backdrop{
        position:fixed;
        inset:0;
        background: rgba(0,0,0,0.5);
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:1200 
    }
    .modal-box{
        background: #0b0b0b;
        border: 1px solid rgba(255,255,255,0.06);
        color:#ddd;
        max-width:720px;
        width:92%;
        padding:20px;
        border-radius:8px;
        max-height:90vh;
        overflow:auto 
    }
    /* Make modal buttons legible on dark background */
    .modal-box .ds-btn{
        color: #f3f3f3;
        background: transparent;
        border: 1px solid rgba(255,255,255,0.06) 
    }
    .modal-box .ds-btn--secondary{
        background: rgba(255,255,255,0.06);
        color: #ffffff 
    }
    .modal-box .ds-btn:focus{
        outline: none;
        box-shadow: 0 0 0 4px rgba(99,102,241,0.12) 
    }
    .auth-actions{
        display:flex;
        gap:8px;
        margin-top:12px;
        justify-content: space-between;
        align-items: center 
    }
    .auth-actions .ds-btn{
        min-height:44px;
        padding: 10px 14px 
    }
    .auth-actions .ds-btn--secondary{
        opacity: .9 
    }
    .ascii-compact{
        display:none;
        color: inherit;
        font-family: inherit;
        text-align:center 
    }
    @keyframes micro-bob {
        0%{
            transform: translateY(0)
        }
        50%{
            transform: translateY(-3px)
        }
        100%{
            transform: translateY(0)
        }
    }
    .ascii-compact pre{
        display:inline-block;
        animation: micro-bob 2s ease-in-out infinite 
    }
    .name-row input.ds-input{
        padding-left: 12px 
    }
    @media (max-width: 520px) {
        .ascii-anim{
            display:none 
        }
        .ascii-compact{
            display:inline-block 
        }
        .auth-card{
            padding:20px 16px !important 
        }
        .name-row{
            grid-template-columns: 1fr;
            gap: 8px 
        }
        .auth-brand h1{
            font-size:18px 
        }
        .auth-actions{
            flex-direction:column 
        }
        .auth-actions .ds-btn{
            width:100% 
        }
        .modal-box{
            width:94%;
            height:94%;
            max-width:none;
            max-height:none;
            border-radius:6px;
            padding:14px 
        }
        .icon-left{
            left:10px;
            width:18px;
            height:18px 
        }
        .input-with-icon input{
            padding-left:42px 
        }
        .icon-toggle{
            top:8px;
            right:8px;
            width:40px;
            height:40px 
        }
        .ascii-anim{
            display:none 
        }
    }
    @media (min-width: 521px) and (max-width: 800px) {
        .ascii-anim{
            font-size:11px 
        }
        .auth-card{
            padding:22px 20px !important 
        }
        .auth-actions .ds-btn{
            min-height:46px 
        }
    }

        `}</style>
        {error && (
          <div
            role="alert"
            style={{
              background: "var(--ds-accent-weak)",
              border: "1px solid var(--ds-accent)",
              color: "var(--ds-accent)",
              borderRadius: "var(--ds-radius-sm)",
              padding: "10px 12px",
              marginBottom: "var(--ds-space-3)",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            style={{
              background: "rgba(80,200,120,.15)",
              border: "1px solid rgba(80,200,120,.5)",
              color: "#f2f2f2",
              borderRadius: "var(--ds-radius-sm)",
              padding: "10px 12px",
              marginBottom: "var(--ds-space-3)",
            }}
          >
            {success}
          </div>
        )}
        {mode === "login" && (
          <form id="panel-login" role="tabpanel" aria-labelledby="tab-login" onSubmit={handleLogin} noValidate>
            <div style={{ marginBottom: "var(--ds-space-3)" }}>
              <label className="ds-label" htmlFor="login-username">Username</label>
              <div className="input-with-icon">
                <User className="icon-left" size={18} weight="regular" />
                <input
                  id="login-username"
                  className="ds-input"
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  autoComplete="username"
                  required
                  aria-required="true"
                />
              </div>
              <div className="ds-helper">At least 3 characters.</div>
            </div>

            <div style={{ marginBottom: "var(--ds-space-3)" }}>
              <label className="ds-label" htmlFor="login-password">Password</label>
              <div style={{ position: "relative" }} className="input-with-icon">
                <LockKey className="icon-left" size={18} weight="regular" />
                <input
                  id="login-password"
                  className="ds-input"
                  type={showLoginPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  className="icon-toggle"
                  onClick={() => setShowLoginPwd((s) => !s)}
                  aria-label={showLoginPwd ? "Hide password" : "Show password"}
                  style={{ position: "absolute", top: 6, right: 6 }}
                >
                  {showLoginPwd ? <Eye size={18} weight="regular" /> : <EyeClosed size={18} weight="regular" />}
                </button>
              </div>
              <div className="ds-helper">At least 6 characters.</div>
            </div>

            <div className="auth-actions">
              <button className="ds-btn ds-btn--primary" type="submit" disabled={submitting} aria-disabled={submitting} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace' }}>
                {submitting ? "Signing in..." : "Log In"}
              </button>
              <button
                className="ds-btn ds-btn--secondary"
                type="button"
                disabled={submitting}
                onClick={() => { setMode("register"); resetFeedback(); }}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace' }}
              >
                Need an account? Register
              </button>
            </div>
          </form>
        )}

        {mode === "register" && (
          <form id="panel-register" role="tabpanel" aria-labelledby="tab-register" onSubmit={handleRegister} noValidate>
            <div style={{ marginBottom: "var(--ds-space-3)" }}>
              <div className="name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="ds-label" htmlFor="reg-first-name">First name</label>
                  <input
                    id="reg-first-name"
                    className="ds-input"
                    placeholder="Your first name"
                    value={regFirstName}
                    onChange={(e) => { setRegFirstName(e.target.value); setFieldErrors((fe) => ({ ...fe, first_name: "" })); }}
                    autoComplete="given-name"
                    required
                    aria-required="true"
                    aria-invalid={!!fieldErrors.first_name}
                    aria-describedby={fieldErrors.first_name ? "err-first-name" : undefined}
                    style={{ width: '100%' }}
                  />
                  {fieldErrors.first_name && <div id="err-first-name" role="alert" className="ds-helper" style={{ color: "#dc2626" }}>{fieldErrors.first_name}</div>}
                </div>
                <div>
                  <label className="ds-label" htmlFor="reg-last-name">Last name</label>
                  <input
                    id="reg-last-name"
                    className="ds-input"
                    placeholder="Your last name"
                    value={regLastName}
                    onChange={(e) => { setRegLastName(e.target.value); setFieldErrors((fe) => ({ ...fe, last_name: "" })); }}
                    autoComplete="family-name"
                    required
                    aria-required="true"
                    aria-invalid={!!fieldErrors.last_name}
                    aria-describedby={fieldErrors.last_name ? "err-last-name" : undefined}
                    style={{ width: '100%' }}
                  />
                  {fieldErrors.last_name && <div id="err-last-name" role="alert" className="ds-helper" style={{ color: "#dc2626" }}>{fieldErrors.last_name}</div>}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "var(--ds-space-3)" }}>
              <label className="ds-label" htmlFor="reg-email">Email</label>
              <div className="input-with-icon">
                <EnvelopeSimple className="icon-left" size={18} weight="regular" />
                <input
                  id="reg-email"
                  className="ds-input"
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => { setRegEmail(e.target.value); setFieldErrors((fe) => ({ ...fe, email: "" })); }}
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "err-email" : undefined}
                />
              </div>
              {fieldErrors.email && <div id="err-email" role="alert" className="ds-helper" style={{ color: "#dc2626" }}>{fieldErrors.email}</div>}
              <div className="ds-helper">We’ll use this for account recovery.</div>
            </div>

            <div style={{ marginBottom: "var(--ds-space-3)" }}>
              <label className="ds-label" htmlFor="reg-email-confirm">Confirm email</label>
              <div className="input-with-icon">
                <EnvelopeSimple className="icon-left" size={18} weight="regular" />
                <input
                  id="reg-email-confirm"
                  className="ds-input"
                  type="email"
                  placeholder="Re-enter your email"
                  value={regEmailConfirm}
                  onChange={(e) => { setRegEmailConfirm(e.target.value); setFieldErrors((fe) => ({ ...fe, email_confirm: "" })); }}
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.email_confirm}
                  aria-describedby={fieldErrors.email_confirm ? "err-email-confirm" : undefined}
                />
              </div>
              {fieldErrors.email_confirm && <div id="err-email-confirm" role="alert" className="ds-helper" style={{ color: "#dc2626" }}>{fieldErrors.email_confirm}</div>}
            </div>

            <div style={{ marginBottom: "var(--ds-space-3)" }}>
              <label className="ds-label" htmlFor="reg-username">Username</label>
              <div className="input-with-icon">
                <User className="icon-left" size={18} weight="regular" />
                <input
                  id="reg-username"
                  className="ds-input"
                  placeholder="Choose a username"
                  value={regUsername}
                  onChange={(e) => { setRegUsername(e.target.value); setFieldErrors((fe) => ({ ...fe, username: "" })); }}
                  autoComplete="username"
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.username}
                  aria-describedby={fieldErrors.username ? "err-username" : undefined}
                />
              </div>
              {fieldErrors.username && <div id="err-username" role="alert" className="ds-helper" style={{ color: "#dc2626" }}>{fieldErrors.username}</div>}
              <div className="ds-helper">At least 3 characters. Letters and numbers.</div>
            </div>

            <div style={{ marginBottom: "var(--ds-space-3)" }}>
              <label className="ds-label" htmlFor="reg-password">Password</label>
              <div style={{ position: "relative" }} className="input-with-icon">
                <LockKey className="icon-left" size={18} weight="regular" />
                <input
                  id="reg-password"
                  className="ds-input"
                  type={showRegPwd ? "text" : "password"}
                  placeholder="Create a password"
                  value={regPassword}
                  onChange={(e) => { setRegPassword(e.target.value); setFieldErrors((fe) => ({ ...fe, password: "" })); }}
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "err-password" : undefined}
                />
                <button
                  type="button"
                  className="icon-toggle"
                  onClick={() => setShowRegPwd((s) => !s)}
                  aria-label={showRegPwd ? "Hide password" : "Show password"}
                  style={{ position: "absolute", top: 6, right: 6 }}
                >
                  {showRegPwd ? <Eye size={18} weight="regular" /> : <EyeClosed size={18} weight="regular" />}
                </button>
              </div>
              {fieldErrors.password && <div id="err-password" role="alert" className="ds-helper" style={{ color: "#dc2626" }}>{fieldErrors.password}</div>}
              <div className="ds-helper">At least 6 characters.</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--ds-space-2)" }}>
              <input
                id="reg-consent"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => { setAcceptTerms(e.target.checked); setFieldErrors((fe) => ({ ...fe, consent: "" })); }}
                aria-invalid={!!fieldErrors.consent}
                className="ds-focus-ring"
                style={{ width: 18, height: 18 }}
              />
              <label htmlFor="reg-consent" className="ds-label" style={{ marginBottom: 0 }}>
                I agree to the <a href="#" aria-label="Terms of Service" onClick={(e) => { e.preventDefault(); setShowModal('terms'); }}>Terms</a> and <a href="#" aria-label="Privacy Policy" onClick={(e) => { e.preventDefault(); setShowModal('privacy'); }}>Privacy</a>.
              </label>
            </div>
            {fieldErrors.consent && <div role="alert" className="ds-helper" style={{ color: "#dc2626", marginBottom: "var(--ds-space-3)" }}>{fieldErrors.consent}</div>}

            <div className="auth-actions">
              <button className="ds-btn ds-btn--primary" type="submit" disabled={submitting || !canSubmitRegister} aria-disabled={submitting || !canSubmitRegister} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace' }}>
                {submitting ? "Creating..." : "Continue"}
              </button>
              <button
                className="ds-btn ds-btn--secondary"
                type="button"
                disabled={submitting}
                onClick={() => { setMode("login"); resetFeedback(); }}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace' }}
              >
                Back to login
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <span>By continuing you agree to our</span>{" "}
          <a href="#" aria-label="Terms of Service" onClick={(e) => { e.preventDefault(); setShowModal('terms'); }}>Terms</a>{" "}
          <span>and</span>{" "}
          <a href="#" aria-label="Privacy Policy" onClick={(e) => { e.preventDefault(); setShowModal('privacy'); }}>Privacy</a>.
        </div>

        {showModal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowModal(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>{showModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</h3>
              <p style={{ color: '#cfcfcf' }}>This is sample text to represent the {showModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}. prige'rgjeprfqe'rgfporpekq'</p>
              <p style={{ color: '#bdbdbd', fontSize: 13 }}>keruguoerh oreigfwoerigjr;o ghw;oeigth;oegi jt;ogi jwotgij wegvnaierhfeorg 'r gjorg aeoe geaorgjaeo</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button className="ds-btn ds-btn--secondary" onClick={() => setShowModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;