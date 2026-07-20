import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getTheme, themeCssVars } from '../themes';

export default function ResetPassword() {
  const { storefront } = useParams();
  const theme = getTheme(storefront);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing or invalid reset link. Please request a new one.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/affiliate-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError(
          res.status === 404
            ? "Can't reach /api/affiliate-reset-password (404). If you're running `npm run dev`, that only serves the frontend — use `vercel dev` or a real Vercel deployment so the API functions run."
            : `Unexpected response from the server (HTTP ${res.status}).`
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not reset password. Please request a new link.');
        return;
      }

      setDone(true);
    } catch {
      setError('Network error — could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-16 md:py-24 bg-[var(--vp-bg)]" style={themeCssVars(theme)}>
      <div className="max-w-md mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <p className="font-[var(--vp-font-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--vp-text-muted)] mb-1">
            {theme.name} · Affiliate Program
          </p>
          <h1 className="font-[var(--vp-font-heading)] text-2xl tracking-[0.1em] uppercase text-[var(--vp-text)]">
            Set a New Password
          </h1>
        </div>

        <div className="p-6 md:p-8 border rounded-sm bg-[var(--vp-surface)]" style={{ borderColor: 'var(--vp-border)' }}>
          {done ? (
            <div className="text-center py-4">
              <p className="font-[var(--vp-font-heading)] text-sm tracking-[0.1em] uppercase text-[var(--vp-text)] mb-3">
                Password updated
              </p>
              <p className="font-[var(--vp-font-body)] text-sm text-[var(--vp-text-muted)]">
                You can now log in with your new password.
              </p>
              <Link
                to={`/${theme.id}/login`}
                className="inline-block mt-6 font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase transition-colors"
                style={{ color: 'var(--vp-accent)' }}
              >
                Go to Login →
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center py-4">
              <p className="font-[var(--vp-font-body)] text-sm text-[var(--vp-text-muted)] mb-4">
                This reset link is missing its token. Request a new one from the login page.
              </p>
              <Link
                to={`/${theme.id}/forgot-password`}
                className="inline-block font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase transition-colors"
                style={{ color: 'var(--vp-accent)' }}
              >
                Request Reset Link →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase text-[var(--vp-text)] block mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--vp-surface-alt)] border py-2.5 px-3 font-[var(--vp-font-body)] text-sm text-[var(--vp-text)] focus:outline-none transition-colors"
                  style={{ borderColor: 'var(--vp-border)' }}
                  placeholder="min. 8 characters"
                />
              </div>
              <div>
                <label className="font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase text-[var(--vp-text)] block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                style={{ background: 'var(--vp-accent)', color: 'var(--vp-accent-text)', borderColor: 'var(--vp-accent)' }}
              >
                {submitting ? 'Saving…' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            to={`/${theme.id}/login`}
            className="font-[var(--vp-font-mono)] text-[11px] tracking-widest uppercase text-[var(--vp-text-muted)] hover:text-[var(--vp-accent)] transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
