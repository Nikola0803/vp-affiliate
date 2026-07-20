import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getTheme, themeCssVars } from '../themes';

export default function Login() {
  const { storefront } = useParams();
  const theme = getTheme(storefront);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/affiliate-authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storefront: theme.id }),
      });

      // A 404/HTML response (e.g. the API route isn't running — plain `vite`/
      // `npm run dev` doesn't serve /api/*, only `vercel dev` or a real
      // deployment does) won't parse as JSON. Catch that case explicitly
      // instead of letting res.json() throw into a generic "network error".
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError(
          res.status === 404
            ? "Can't reach /api/affiliate-authenticate (404). If you're running `npm run dev`, that only serves the frontend — use `vercel dev` or a real Vercel deployment so the API functions run."
            : `Unexpected response from the server (HTTP ${res.status}).`
        );
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        return;
      }

      // Route to the affiliate's ACTUAL storefront (returned by the API),
      // not necessarily the one in the URL they happened to log in through —
      // that way the dashboard always shows the correct brand regardless of
      // which storefront's "Affiliate Login" link they clicked.
      navigate(`/${data.storefront || storefront || theme.id}/dashboard`);
    } catch {
      setError('Network error — could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen py-16 md:py-24 bg-[var(--vp-bg)]"
      style={themeCssVars(theme)}
    >
      <div className="max-w-md mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <p
            className="font-[var(--vp-font-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--vp-text-muted)] mb-1"
          >
            {theme.name} · Affiliate Program
          </p>
          <h1
            className="font-[var(--vp-font-heading)] text-2xl tracking-[0.1em] uppercase text-[var(--vp-text)]"
          >
            Affiliate Login
          </h1>
          <p className="font-[var(--vp-font-body)] text-sm italic text-[var(--vp-text-muted)] mt-2">
            Access your referral link, clicks, and commission dashboard.
          </p>
        </div>

        <div className="p-6 md:p-8 border rounded-sm bg-[var(--vp-surface)]" style={{ borderColor: 'var(--vp-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase text-[var(--vp-text)] block mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--vp-surface-alt)] border py-2.5 px-3 font-[var(--vp-font-body)] text-sm text-[var(--vp-text)] focus:outline-none transition-colors"
                style={{ borderColor: 'var(--vp-border)' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase text-[var(--vp-text)]">
                  Password
                </label>
                <Link
                  to={`/${theme.id}/forgot-password`}
                  className="font-[var(--vp-font-mono)] text-[10px] tracking-widest uppercase transition-colors"
                  style={{ color: 'var(--vp-text-muted)' }}
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--vp-surface-alt)] border py-2.5 px-3 font-[var(--vp-font-body)] text-sm text-[var(--vp-text)] focus:outline-none transition-colors"
                style={{ borderColor: 'var(--vp-border)' }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div role="alert" className="p-3 border border-red-900/30 bg-red-900/5">
                <p className="font-[var(--vp-font-mono)] text-xs text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full font-[var(--vp-font-heading)] text-xs tracking-[0.2em] uppercase py-3 border transition-all duration-300 disabled:opacity-50"
              style={{
                background: 'var(--vp-accent)',
                color: 'var(--vp-accent-text)',
                borderColor: 'var(--vp-accent)',
              }}
            >
              {submitting ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: 'var(--vp-border)' }}>
            <p className="font-[var(--vp-font-body)] text-xs text-[var(--vp-text-muted)] mb-2">
              New to the program?
            </p>
            <Link
              to={`/${theme.id}/register`}
              className="font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase transition-colors"
              style={{ color: 'var(--vp-accent)' }}
            >
              Apply to Become an Affiliate →
            </Link>
          </div>
        </div>

        {theme.siteUrl && (
          <div className="text-center mt-6">
            <a
              href={theme.siteUrl}
              className="font-[var(--vp-font-mono)] text-[11px] tracking-widest uppercase text-[var(--vp-text-muted)] hover:text-[var(--vp-accent)] transition-colors"
            >
              ← Back to {theme.name}
            </a>
          </div>
        )}

        <div className="text-center mt-3">
          <Link
            to="/"
            className="font-[var(--vp-font-mono)] text-[10px] tracking-widest uppercase hover:text-[var(--vp-text)] transition-colors"
            style={{ color: 'var(--vp-text-muted)', opacity: 0.7 }}
          >
            Wrong storefront?
          </Link>
        </div>
      </div>
    </div>
  );
}
