import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTheme, themeCssVars } from '../themes';

export default function Register() {
  const { storefront } = useParams();
  const theme = getTheme(storefront);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      const res = await fetch('/api/affiliate-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, storefront: theme.id }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError(
          res.status === 404
            ? "Can't reach /api/affiliate-signup (404). If you're running `npm run dev`, that only serves the frontend — use `vercel dev` or a real Vercel deployment so the API functions run."
            : `Unexpected response from the server (HTTP ${res.status}).`
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
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
            Become an Affiliate
          </h1>
          <p className="font-[var(--vp-font-body)] text-sm italic text-[var(--vp-text-muted)] mt-2">
            Earn commission sharing your referral link, or your own personal discount code.
          </p>
        </div>

        <div className="p-6 md:p-8 border rounded-sm bg-[var(--vp-surface)]" style={{ borderColor: 'var(--vp-border)' }}>
          {done ? (
            <div className="text-center py-4">
              <p className="font-[var(--vp-font-heading)] text-sm tracking-[0.1em] uppercase text-[var(--vp-text)] mb-3">
                Application received
              </p>
              <p className="font-[var(--vp-font-body)] text-sm text-[var(--vp-text-muted)]">
                Your account is pending approval. We'll activate it — and your personal discount coupon — once our team
                reviews your application. You'll be able to log in once approved.
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
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--vp-surface-alt)] border py-2.5 px-3 font-[var(--vp-font-body)] text-sm text-[var(--vp-text)] focus:outline-none transition-colors"
                  style={{ borderColor: 'var(--vp-border)' }}
                  placeholder="Jane Doe"
                />
              </div>
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
                <label className="font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase text-[var(--vp-text)] block mb-1.5">
                  Password
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
                  Confirm Password
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
                {submitting ? 'Submitting…' : 'Apply Now'}
              </button>

              <p className="font-[var(--vp-font-body)] text-[11px] text-center text-[var(--vp-text-muted)] pt-1">
                Applications are reviewed by our team before your account is activated.
              </p>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            to={`/${theme.id}/login`}
            className="font-[var(--vp-font-mono)] text-[11px] tracking-widest uppercase text-[var(--vp-text-muted)] hover:text-[var(--vp-accent)] transition-colors"
          >
            Already an affiliate? Log in →
          </Link>
        </div>
      </div>
    </div>
  );
}
