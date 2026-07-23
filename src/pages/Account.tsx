import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getTheme, themeCssVars } from '../themes';

interface DashboardLite {
  storefront: string;
  ref_code: string;
  coupon_code: string;
  payout_method: string;
  payout_destination: string;
  payout_methods: Record<string, string>;
}

export default function Account() {
  const navigate = useNavigate();
  const { storefront: urlStorefront } = useParams();
  const [data, setData] = useState<DashboardLite | null>(null);
  const [loading, setLoading] = useState(true);

  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutDestination, setPayoutDestination] = useState('');
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/affiliate-dashboard')
      .then(async (res) => {
        if (res.status === 401) {
          if (!cancelled) navigate(`/${urlStorefront || ''}/login`.replace('//', '/'));
          return null;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load account');
        return json as DashboardLite;
      })
      .then((json) => {
        if (!cancelled && json) {
          setData(json);
          setPayoutMethod(json.payout_method || '');
          setPayoutDestination(json.payout_destination || '');
          setCouponCode(json.coupon_code || json.ref_code || '');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const theme = getTheme(data?.storefront || urlStorefront);

  const savePayoutInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutMsg(null);
    if (!payoutMethod || !payoutDestination) {
      setPayoutMsg({ text: 'Choose a payout method and enter a destination.', ok: false });
      return;
    }
    setPayoutSaving(true);
    try {
      const res = await fetch('/api/affiliate-payout-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_method: payoutMethod, payout_destination: payoutDestination }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save payout info.');
      setPayoutMsg({ text: 'Payout info saved.', ok: true });
    } catch (e) {
      setPayoutMsg({ text: e instanceof Error ? e.message : 'Failed to save payout info.', ok: false });
    } finally {
      setPayoutSaving(false);
    }
  };

  const saveCouponCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponMsg(null);
    const code = couponCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      setCouponMsg({ text: 'Code must be 3–20 letters/numbers only, no spaces or symbols.', ok: false });
      return;
    }
    setCouponSaving(true);
    try {
      const res = await fetch('/api/affiliate-coupon-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update your code.');
      setCouponCode(json.coupon_code || code);
      setCouponMsg({ text: 'Your referral link and coupon code are now updated.', ok: true });
    } catch (e) {
      setCouponMsg({ text: e instanceof Error ? e.message : 'Failed to update your code.', ok: false });
    } finally {
      setCouponSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ text: 'New password must be at least 8 characters.', ok: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: 'New passwords do not match.', ok: false });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api/affiliate-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to change password.');
      setPwMsg({ text: 'Password updated.', ok: true });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setPwMsg({ text: e instanceof Error ? e.message : 'Failed to change password.', ok: false });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1ec]">
        <p className="font-mono text-sm text-neutral-500">Loading account…</p>
      </div>
    );
  }
  if (!data) return null;

  const labelCls = 'font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase text-[var(--vp-text)] block mb-1.5';
  const inputCls = 'w-full bg-[var(--vp-surface-alt)] border py-2.5 px-3 font-[var(--vp-font-body)] text-sm text-[var(--vp-text)] focus:outline-none transition-colors';

  return (
    <div className="min-h-screen py-10 bg-[var(--vp-bg)]" style={themeCssVars(theme)}>
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-[var(--vp-font-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--vp-text-muted)] mb-1">
              {theme.name} · Affiliate Program
            </p>
            <h1 className="font-[var(--vp-font-heading)] text-2xl tracking-[0.1em] uppercase text-[var(--vp-text)]">
              Account Settings
            </h1>
          </div>
          <Link
            to={`/${data.storefront}/dashboard`}
            className="px-4 py-2 border font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase transition-colors"
            style={{ borderColor: 'var(--vp-border)', color: 'var(--vp-text-muted)', background: 'var(--vp-surface-alt)' }}
          >
            ← Dashboard
          </Link>
        </div>

        {/* Referral / coupon code */}
        <div className="p-6 border mb-8" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
          <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--vp-text-muted)' }}>
            Your Referral / Coupon Code
          </p>
          <form onSubmit={saveCouponCode} className="space-y-4">
            <div>
              <label className={labelCls}>Code</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className={inputCls}
                style={{ borderColor: 'var(--vp-border)' }}
                placeholder="e.g. YOURNAME15"
                maxLength={20}
              />
              <p className="font-[var(--vp-font-mono)] text-[10px] text-[var(--vp-text-muted)] mt-1.5">
                Used both for your referral link (?ref=) and as a real checkout coupon. You can change this anytime, but changing it means links/codes you've already shared under the old one stop working.
              </p>
            </div>
            {couponMsg && (
              <p className={`font-[var(--vp-font-mono)] text-xs ${couponMsg.ok ? 'text-green-700' : 'text-red-800'}`}>
                {couponMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={couponSaving}
              className="font-[var(--vp-font-heading)] text-xs tracking-[0.2em] uppercase py-2.5 px-6 border transition-all duration-300 disabled:opacity-50"
              style={{ background: 'var(--vp-accent)', color: 'var(--vp-accent-text)', borderColor: 'var(--vp-accent)' }}
            >
              {couponSaving ? 'Saving…' : 'Save Code'}
            </button>
          </form>
        </div>

        {/* Payout info */}
        <div className="p-6 border mb-8" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
          <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--vp-text-muted)' }}>
            Payout Info
          </p>
          <form onSubmit={savePayoutInfo} className="space-y-4">
            <div>
              <label className={labelCls}>Payout Method</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className={inputCls}
                style={{ borderColor: 'var(--vp-border)' }}
              >
                <option value="">Select a method…</option>
                {Object.entries(data.payout_methods || {}).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Destination (email, phone, or wallet address)</label>
              <input
                type="text"
                value={payoutDestination}
                onChange={(e) => setPayoutDestination(e.target.value)}
                className={inputCls}
                style={{ borderColor: 'var(--vp-border)' }}
                placeholder="e.g. you@example.com or a wallet address"
              />
            </div>
            {payoutMsg && (
              <p className={`font-[var(--vp-font-mono)] text-xs ${payoutMsg.ok ? 'text-green-700' : 'text-red-800'}`}>
                {payoutMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={payoutSaving}
              className="font-[var(--vp-font-heading)] text-xs tracking-[0.2em] uppercase py-2.5 px-6 border transition-all duration-300 disabled:opacity-50"
              style={{ background: 'var(--vp-accent)', color: 'var(--vp-accent-text)', borderColor: 'var(--vp-accent)' }}
            >
              {payoutSaving ? 'Saving…' : 'Save Payout Info'}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="p-6 border" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
          <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--vp-text-muted)' }}>
            Change Password
          </p>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className={labelCls}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputCls}
                style={{ borderColor: 'var(--vp-border)' }}
              />
            </div>
            <div>
              <label className={labelCls}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputCls}
                style={{ borderColor: 'var(--vp-border)' }}
                placeholder="min. 8 characters"
              />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls}
                style={{ borderColor: 'var(--vp-border)' }}
              />
            </div>
            {pwMsg && (
              <p className={`font-[var(--vp-font-mono)] text-xs ${pwMsg.ok ? 'text-green-700' : 'text-red-800'}`}>
                {pwMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwSaving}
              className="font-[var(--vp-font-heading)] text-xs tracking-[0.2em] uppercase py-2.5 px-6 border transition-all duration-300 disabled:opacity-50"
              style={{ background: 'var(--vp-accent)', color: 'var(--vp-accent-text)', borderColor: 'var(--vp-accent)' }}
            >
              {pwSaving ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
