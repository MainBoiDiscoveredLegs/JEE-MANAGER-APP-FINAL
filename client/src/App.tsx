import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import API from "./api";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Calendar from "./Pages/Calendar";
import Admin from "./Pages/Admin";
import Study from "./Pages/Study";
import ProfilePicker from './Components/ProfilePicker';

type Me = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  first_name: string;
  last_name: string;
  full_name: string;
};

type OutletCtx = {
  user: Me | null;
};

function useBreadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);
  const crumbs = useMemo(() => {
    const acc: { to: string; label: string }[] = [];
    let path = "";
    for (const p of parts) {
      path += `/${p}`;
      const label = p.charAt(0).toUpperCase() + p.slice(1);
      acc.push({ to: path, label });
    }
    return acc;
  }, [parts]);
  return crumbs;
}

function Header({ user }: { user: Me | null }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? 'var(--ds-accent)' : '#272727',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 15,
    display: 'block',
    padding: isMobile ? '12px 16px' : '0',
    width: isMobile ? '100%' : 'auto',
  });

  return (
    <header role="banner" aria-label="Primary" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#ffffff',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      boxShadow: isMenuOpen ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
    }}>
      <nav
        aria-label="Main navigation"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 1200,
          margin: '0 auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
          color: '#272727',
          width: '100%',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Left: avatar & names */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ProfilePicker size={isMobile ? 48 : 64} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <div style={{ fontWeight: 700, color: '#272727', fontSize: 16 }}>{user?.full_name || ''}</div>
              <div style={{ fontSize: 13, color: '#272727', opacity: 0.5 }}>{user ? `@${user.username}` : ''}</div>
            </div>
          </div>

          {/* Hamburger menu for mobile */}
          {isMobile && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                width: '40px',
                height: '40px',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span style={{
                display: 'block',
                width: '24px',
                height: '2px',
                background: '#272727',
                transition: 'transform 0.2s ease',
                transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
              }} />
              <span style={{
                display: 'block',
                width: '24px',
                height: '2px',
                background: '#272727',
                opacity: isMenuOpen ? 0 : 1,
                transition: 'opacity 0.2s ease',
              }} />
              <span style={{
                display: 'block',
                width: '24px',
                height: '2px',
                background: '#272727',
                transition: 'transform 0.2s ease',
                transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
              }} />
            </button>
          )}

          {/* Desktop navigation */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <NavLink to="/dashboard" style={navLinkStyle}>Dashboard</NavLink>
              <NavLink to="/calendar" style={navLinkStyle}>Calendar</NavLink>
              <NavLink to="/study" style={navLinkStyle}>Study</NavLink>
              {user?.is_staff ? <NavLink to="/admin" style={navLinkStyle}>Admin</NavLink> : null}
              <button
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  window.location.href = '/';
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#272727',
                  opacity: 0.5,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 15
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile navigation menu */}
        {isMobile && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#ffffff',
            padding: '8px 0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            transform: isMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
            opacity: isMenuOpen ? 1 : 0,
            visibility: isMenuOpen ? 'visible' : 'hidden',
            transition: 'all 0.2s ease',
            zIndex: 40,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <NavLink to="/dashboard" style={navLinkStyle}>Dashboard</NavLink>
              <NavLink to="/calendar" style={navLinkStyle}>Calendar</NavLink>
              <NavLink to="/study" style={navLinkStyle}>Study</NavLink>
              {user?.is_staff ? <NavLink to="/admin" style={navLinkStyle}>Admin</NavLink> : null}
              <button
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  window.location.href = '/';
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#272727',
                  opacity: 0.5,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 15,
                  padding: '12px 16px',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        marginTop: "auto",
        padding: "16px",
        borderTop: "1px solid #e5e7eb",
        color: "#374151",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <small>© {new Date().getFullYear()} Study Planner</small>
      </div>
    </footer>
  );
}

function Breadcrumbs() {
  const crumbs = useBreadcrumbs();
  if (!crumbs.length) return null;
  return (
    <nav aria-label="Breadcrumb" style={{ margin: "12px 0" }}>
      <ol
        style={{
          listStyle: "none",
          display: "flex",
          gap: 8,
          padding: 0,
          margin: 0,
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        <li>
          <NavLink to="/dashboard" style={{ color: "#2563eb" }}>
            Home
          </NavLink>
        </li>
        {crumbs.map((c, idx) => (
          <li key={c.to} aria-current={idx === crumbs.length - 1 ? "page" : undefined}>
            <span aria-hidden="true" style={{ margin: "0 6px" }}>
              /
            </span>
            {idx === crumbs.length - 1 ? (
              <span style={{ color: "#111827" }}>{c.label}</span>
            ) : (
              <NavLink to={c.to} style={{ color: "#2563eb" }}>
                {c.label}
              </NavLink>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ProtectedLayout() {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await API.get("me/");
        if (!alive) return;
        setUser(res.data);
      } catch (e) {
        // Not authenticated — back to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/");
        return;
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div role="status" aria-live="polite">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#272727",
      }}
    >
      <Header user={user} />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: "100vw", margin: "0 auto", padding: "16px" }}>
          {/* <Breadcrumbs /> */}
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

function AccessDenied() {
  const navigate = useNavigate();
  return (
    <div role="alert" aria-live="assertive" style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8, color: "#111827" }}>Access Denied</h1>
      <p style={{ color: "#374151" }}>
        You do not have permission to view this page.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          marginTop: 12,
          padding: "8px 12px",
          borderRadius: 8,
          background: "#2563eb",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

function AdminGate() {
  const ctx = useOutletContext<OutletCtx>();
  if (!ctx?.user?.is_staff) {
    return <AccessDenied />;
  }
  return <Admin />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Protected area */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/study" element={<Study />} />
          <Route path="/admin" element={<AdminGate />} />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={
            <div style={{ padding: 24 }}>
              <h1>404</h1>
              <p>Page not found</p>
              <NavLink to="/dashboard">Go to Dashboard</NavLink>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;