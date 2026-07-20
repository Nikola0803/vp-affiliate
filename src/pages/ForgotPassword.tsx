import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTheme, themeCssVars } from '../themes';

export default function ForgotPassword() {
  const { storefront } = useParams();
  const theme = getTheme(storefront);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/affiliate-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, storefront: theme.id }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError(
          res.status === 404
            ? "Can't reach /api/affiliate-forgot-password (404). If you're running `npm run dev`, that only serves the frontend — use `vercel dev` or a real Vercel deployment so the API functions run."
            : `Unexpected response from the server (HTTP ${res.status}).`
        );
        return;
      }

      // Server always responds 200 with a generic message, win or lose —
      // that's intentional (doesn't reveal whether the email is registered).
      await res.json().catch(() => ({}));
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
            Reset Your Password
          </h1>
          <p className="font-[var(--vp-font-body)] text-sm italic text-[var(--vp-text-muted)] mt-2">
            Enter your account email and we'll send you a link to set a new password.
          </p>
        </div>

        <div className="p-6 md:p-8 border rounded-sm bg-[var(--vp-surface)]" style={{ borderColor: 'var(--vp-border)' }}>
          {done ? (
            <div className="text-center py-4">
              <p className="font-[var(--vp-font-heading)] text-sm tracking-[0.1em] uppercase text-[var(--vp-text)] mb-3">
                Check your email
              </p>
              <p className="font-[var(--vp-font-body)] text-sm text-[var(--vp-text-muted)]">
                If an affiliate account exists for that email, we've sent a link to reset your password. It expires in
                1 hour.
              </p>
              <Link
                to={`/${theme.id}/login`}
                className="inline-block mt-6 font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase transition-colors"
                style={{ color: 'var(--vp-accent)' }}
              >
                Back to Login →
              </Link>
            </div>
          ) : (
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
                {submitting ? 'Sending…' : 'Send Reset Link'}
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
