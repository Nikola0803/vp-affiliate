import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getTheme, themeCssVars, THEMES } from '../themes';

interface Referral {
  order_id: number;
  order_total: string | number;
  commission_amount: string | number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  attribution?: 'link' | 'coupon';
  created_at: string;
}

interface Payout {
  id: number;
  amount: string | number;
  method: string;
  destination: string;
  status: 'requested' | 'paid';
  requested_at: string;
  paid_at: string | null;
}

interface ClickDay {
  day: string;
  clicks: number;
}

interface TopPage {
  landing_url: string;
  clicks: number;
}

interface DashboardData {
  name: string;
  email: string;
  ref_code: string;
  coupon_code: string;
  discount_pct: number;
  storefront: string;
  commission_pct: number;
  payout_method: string;
  payout_destination: string;
  payout_methods: Record<string, string>;
  min_payout: number;
  clicks_total: number;
  clicks_30d: number;
  clicks_by_day: ClickDay[];
  top_pages: TopPage[];
  sales_confirmed: number;
  sales_pending: number;
  commission_pending: number;
  commission_confirmed: number;
  commission_paid: number;
  available_balance: number;
  recent: Referral[];
  payouts: Payout[];
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  paid: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-600',
  requested: 'bg-amber-100 text-amber-800',
};

function money(n: number | string): string {
  return `$${Number(n).toFixed(2)}`;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { storefront: urlStorefront } = useParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [payoutRequesting, setPayoutRequesting] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => {
    fetch('/api/affiliate-dashboard')
      .then(async (res) => {
        if (res.status === 401) {
          navigate(`/${urlStorefront || ''}/login`.replace('//', '/'));
          return null;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load dashboard');
        return json as DashboardData;
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch((e) => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Theme follows the affiliate's REAL storefront (from the API response) once
  // loaded — that's the source of truth, not whatever URL they arrived through.
  const theme = getTheme(data?.storefront || urlStorefront);

  const handleLogout = async () => {
    await fetch('/api/affiliate-logout', { method: 'POST' }).catch(() => {});
    navigate(`/${data?.storefront || urlStorefront || theme.id}/login`);
  };

  const refLink = data && theme.siteUrl ? `${theme.siteUrl}/?ref=${data.ref_code}` : '';

  const copyLink = async () => {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      /* clipboard permissions denied — silently ignore */
    }
  };

  const copyCoupon = async () => {
    if (!data?.coupon_code) return;
    try {
      await navigator.clipboard.writeText(data.coupon_code);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    } catch {
      /* clipboard permissions denied — silently ignore */
    }
  };

  const requestPayout = async () => {
    setPayoutMsg(null);
    setPayoutRequesting(true);
    try {
      const res = await fetch('/api/affiliate-payout-request', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to request payout.');
      setPayoutMsg({ text: `Payout of ${money(json.amount)} requested.`, ok: true });
      load();
    } catch (e) {
      setPayoutMsg({ text: e instanceof Error ? e.message : 'Failed to request payout.', ok: false });
    } finally {
      setPayoutRequesting(false);
    }
  };

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`referrals-${data.ref_code}-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Order ID', 'Order Total', 'Commission', 'Status', 'Attribution', 'Date'],
      ...recent.map((r) => [r.order_id, r.order_total, r.commission_amount, r.status, r.attribution || 'link', r.created_at]),
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1ec]">
        <p className="font-mono text-sm text-neutral-500">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1ec] px-4">
        <p className="font-mono text-sm text-red-800 text-center">{error || 'Something went wrong.'}</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Pending', value: Number(data.commission_pending) },
    { name: 'Confirmed', value: Number(data.commission_confirmed) },
    { name: 'Paid', value: Number(data.commission_paid) },
  ];

  // Fall back to empty arrays/objects defensively — e.g. if the WordPress
  // plugin serving this data hasn't been redeployed to the newer version
  // yet, these newer fields simply won't be in the response.
  const recent = data.recent || [];
  const payouts = data.payouts || [];
  const topPages = data.top_pages || [];
  const clicksByDay = data.clicks_by_day || [];
  const payoutMethods = data.payout_methods || {};
  const minPayout = data.min_payout ?? 0;
  const availableBalance = data.available_balance ?? 0;

  const canRequestPayout = !!data.payout_method && !!data.payout_destination && availableBalance >= minPayout;

  return (
    <div className="min-h-screen py-10 bg-[var(--vp-bg)]" style={themeCssVars(theme)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Portal nav */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b" style={{ borderColor: 'var(--vp-border)' }}>
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-[var(--vp-font-heading)] font-bold text-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--vp-accent), #4FB8A6)', color: 'var(--vp-accent-text)' }}
            >
              {data.name?.trim()?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-[var(--vp-font-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--vp-text-muted)] mb-0.5">
                {theme.name} · Affiliate Program
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-[var(--vp-font-heading)] text-xl tracking-[0.03em] text-[var(--vp-text)]">
                  {data.name}
                </h1>
                <span
                  className="font-[var(--vp-font-mono)] text-[9px] uppercase tracking-[0.08em] px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(111,190,134,0.14)', color: '#6FBE86' }}
                >
                  Active · {data.commission_pct}% commission
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/${data.storefront}/materials`}
              className="px-4 py-2 border font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase transition-colors"
              style={{ borderColor: 'var(--vp-border)', color: 'var(--vp-text-muted)', background: 'var(--vp-surface-alt)' }}
            >
              Materials
            </Link>
            <Link
              to={`/${data.storefront}/account`}
              className="px-4 py-2 border font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase transition-colors"
              style={{ borderColor: 'var(--vp-border)', color: 'var(--vp-text-muted)', background: 'var(--vp-surface-alt)' }}
            >
              Account
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase transition-colors"
              style={{ borderColor: 'var(--vp-border)', color: 'var(--vp-text-muted)', background: 'var(--vp-surface-alt)' }}
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Referral link + coupon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 border" style={{ borderColor: 'var(--vp-accent)', background: 'var(--vp-surface)' }}>
            <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase text-[var(--vp-text-muted)] mb-2">
              Your Referral Link
            </p>
            {refLink ? (
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <code className="flex-1 font-[var(--vp-font-mono)] text-xs md:text-sm text-[var(--vp-text)] border py-2.5 px-3 truncate" style={{ background: 'var(--vp-surface-alt)', borderColor: 'var(--vp-border)' }}>
                  {refLink}
                </code>
                <button
                  onClick={copyLink}
                  className="px-5 py-2.5 font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase border transition-colors whitespace-nowrap"
                  style={{ background: 'var(--vp-accent)', color: 'var(--vp-accent-text)', borderColor: 'var(--vp-accent)' }}
                >
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            ) : (
              <p className="font-[var(--vp-font-body)] text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                Referral code: <code className="font-[var(--vp-font-mono)]">{data.ref_code}</code>
              </p>
            )}
            <p className="font-[var(--vp-font-body)] text-[11px] mt-2" style={{ color: 'var(--vp-text-muted)' }}>
              Tracked for 30 days after a click. You earn commission once the order ships.
            </p>
          </div>

          <div className="p-5 border" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase text-[var(--vp-text-muted)]">
                Your Personal Discount Code
              </p>
              <Link to={`/${data.storefront}/account`} className="font-[var(--vp-font-mono)] text-[10px] underline whitespace-nowrap" style={{ color: 'var(--vp-accent)' }}>
                Change code
              </Link>
            </div>
            {data.coupon_code ? (
              <>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <code className="flex-1 font-[var(--vp-font-mono)] text-xs md:text-sm text-[var(--vp-text)] border py-2.5 px-3 truncate" style={{ background: 'var(--vp-surface-alt)', borderColor: 'var(--vp-border)' }}>
                    {data.coupon_code}
                  </code>
                  <button
                    onClick={copyCoupon}
                    className="px-5 py-2.5 font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase border transition-colors whitespace-nowrap"
                    style={{ background: 'var(--vp-accent)', color: 'var(--vp-accent-text)', borderColor: 'var(--vp-accent)' }}
                  >
                    {copiedCoupon ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <p className="font-[var(--vp-font-body)] text-[11px] mt-2" style={{ color: 'var(--vp-text-muted)' }}>
                  Gives shoppers {data.discount_pct}% off — you still earn commission on the discounted total, even without a link click.
                </p>
              </>
            ) : (
              <p className="font-[var(--vp-font-body)] text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                Your coupon is being set up.
              </p>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Clicks (30d)', value: data.clicks_30d },
            { label: 'Total Clicks', value: data.clicks_total },
            { label: 'Confirmed Sales', value: data.sales_confirmed },
            { label: 'Pending Sales', value: data.sales_pending },
          ].map((s) => (
            <div key={s.label} className="p-4 border text-center" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface-alt)' }}>
              <p className="font-[var(--vp-font-mono)] text-xl font-bold" style={{ color: 'var(--vp-accent)' }}>{s.value}</p>
              <p className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase mt-1" style={{ color: 'var(--vp-text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          <div className="p-4 border border-amber-200 bg-amber-50/40 text-center">
            <p className="font-mono text-2xl text-amber-700 font-bold">{money(data.commission_pending)}</p>
            <p className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase text-amber-800/70 mt-1">Pending Commission</p>
          </div>
          <div className="p-4 border border-green-200 bg-green-50/40 text-center">
            <p className="font-mono text-2xl text-green-700 font-bold">{money(data.commission_confirmed)}</p>
            <p className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase text-green-800/70 mt-1">Confirmed — Owed to You</p>
          </div>
          <div className="p-4 border border-blue-200 bg-blue-50/40 text-center">
            <p className="font-mono text-2xl text-blue-700 font-bold">{money(data.commission_paid)}</p>
            <p className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase text-blue-800/70 mt-1">Paid Out</p>
          </div>
        </div>

        {/* Payout request */}
        <div className="p-5 border mb-10" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--vp-text-muted)' }}>
              Withdraw Your Earnings
            </p>
            <p className="font-mono text-sm font-bold" style={{ color: 'var(--vp-accent)' }}>
              {money(availableBalance)} available
            </p>
          </div>

          {!data.payout_method || !data.payout_destination ? (
            <p className="font-[var(--vp-font-body)] text-sm" style={{ color: 'var(--vp-text-muted)' }}>
              Add your payout details in{' '}
              <Link to={`/${data.storefront}/account`} className="underline" style={{ color: 'var(--vp-accent)' }}>
                Account Settings
              </Link>{' '}
              before requesting a withdrawal.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={requestPayout}
                disabled={!canRequestPayout || payoutRequesting}
                className="font-[var(--vp-font-heading)] text-xs tracking-[0.2em] uppercase py-2.5 px-6 border transition-all duration-300 disabled:opacity-50"
                style={{ background: 'var(--vp-accent)', color: 'var(--vp-accent-text)', borderColor: 'var(--vp-accent)' }}
              >
                {payoutRequesting ? 'Requesting…' : 'Request Payout'}
              </button>
              <p className="font-[var(--vp-font-body)] text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                Minimum payout: {money(minPayout)} · Sent via {payoutMethods[data.payout_method] || data.payout_method}
              </p>
            </div>
          )}

          {payoutMsg && (
            <p className={`font-[var(--vp-font-mono)] text-xs mt-3 ${payoutMsg.ok ? 'text-green-700' : 'text-red-800'}`}>
              {payoutMsg.text}
            </p>
          )}

          {payouts.length > 0 && (
            <div className="overflow-x-auto mt-5 pt-4 border-t" style={{ borderColor: 'var(--vp-border)' }}>
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase pr-4 pb-2" style={{ color: 'var(--vp-text-muted)' }}>Amount</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase pr-4 pb-2" style={{ color: 'var(--vp-text-muted)' }}>Status</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase pb-2" style={{ color: 'var(--vp-text-muted)' }}>Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="font-[var(--vp-font-mono)] text-xs pr-4 py-1.5" style={{ color: 'var(--vp-text)' }}>{money(p.amount)}</td>
                      <td className="py-1.5 pr-4">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 tracking-wider ${STATUS_STYLE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-[var(--vp-font-mono)] text-[11px] py-1.5" style={{ color: 'var(--vp-text-muted)' }}>
                        {new Date(p.requested_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
          <div className="p-5 border" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
            <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--vp-text-muted)' }}>
              Commission Breakdown
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4c39a55" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="value" fill={theme.colors.accent} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-5 border" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
            <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--vp-text-muted)' }}>
              Clicks — Last 14 Days
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={clicksByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4c39a55" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="clicks" stroke={theme.colors.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top landing pages */}
        {topPages.length > 0 && (
          <div className="border mb-10" style={{ borderColor: 'var(--vp-border)' }}>
            <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase p-5 pb-3" style={{ color: 'var(--vp-text-muted)' }}>
              Top Landing Pages
            </p>
            <table className="w-full">
              <tbody>
                {topPages.map((p, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: 'var(--vp-border)' }}>
                    <td className="font-[var(--vp-font-mono)] text-xs px-5 py-2.5 truncate max-w-0" style={{ color: 'var(--vp-text)' }}>{p.landing_url}</td>
                    <td className="font-[var(--vp-font-mono)] text-xs px-5 py-2.5 text-right whitespace-nowrap" style={{ color: 'var(--vp-accent)' }}>{p.clicks} clicks</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Brand access — the real set of houses in the network, each one
            linking straight to its live site (siteUrl is only set once a
            storefront has a real domain — see themes.ts). No fake "locked
            until you hit a tier" gating here, just what's actually live. */}
        <div className="border mb-10" style={{ borderColor: 'var(--vp-border)' }}>
          <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase p-5 pb-3" style={{ color: 'var(--vp-text-muted)' }}>
            Our Network — Visit the Other Houses
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t" style={{ borderColor: 'var(--vp-border)' }}>
            {Object.values(THEMES).map((t, i) => {
              const isLive = !!t.siteUrl;
              const row = (
                <div
                  className={`p-5 flex items-center justify-between gap-3 ${i % 2 === 0 ? 'sm:border-r' : ''} border-t sm:border-t-0 ${isLive ? 'transition-colors hover:bg-[var(--vp-surface-alt)]' : ''}`}
                  style={{ borderColor: 'var(--vp-border)' }}
                >
                  <div>
                    <p className="font-[var(--vp-font-body)] text-sm" style={{ color: 'var(--vp-text)' }}>{t.name}</p>
                    <p className="font-[var(--vp-font-body)] text-xs mt-0.5" style={{ color: 'var(--vp-text-muted)' }}>
                      {isLive ? t.siteUrl.replace(/^https?:\/\//, '') : 'Launching soon'}
                    </p>
                  </div>
                  <span
                    className="font-[var(--vp-font-mono)] text-[9px] uppercase tracking-[0.08em] px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={isLive
                      ? { background: 'rgba(111,190,134,0.14)', color: '#6FBE86' }
                      : { background: 'var(--vp-surface-alt)', color: 'var(--vp-text-muted)' }}
                  >
                    {isLive ? 'Visit site →' : 'Coming soon'}
                  </span>
                </div>
              );
              return isLive ? (
                <a key={t.id} href={t.siteUrl} target="_blank" rel="noreferrer">{row}</a>
              ) : (
                <div key={t.id}>{row}</div>
              );
            })}
          </div>
        </div>

        {/* Recent referrals */}
        <div className="border" style={{ borderColor: 'var(--vp-border)' }}>
          <div className="flex items-center justify-between p-5 pb-0">
            <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--vp-text-muted)' }}>
              Recent Referrals
            </p>
            {recent.length > 0 && (
              <button
                onClick={exportCsv}
                className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors"
                style={{ borderColor: 'var(--vp-border)', color: 'var(--vp-text-muted)' }}
              >
                Export CSV
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="font-[var(--vp-font-body)] text-xs italic text-center py-10" style={{ color: 'var(--vp-text-muted)' }}>
              No referrals yet — share your link or coupon code to start earning.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full mt-3">
                <thead>
                  <tr className="border-t text-left" style={{ borderColor: 'var(--vp-border)' }}>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Order</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Order Total</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Your Commission</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Via</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Status</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.order_id} className="border-t" style={{ borderColor: 'var(--vp-border)' }}>
                      <td className="font-[var(--vp-font-mono)] text-xs px-5 py-3" style={{ color: 'var(--vp-text)' }}>#{r.order_id}</td>
                      <td className="font-[var(--vp-font-mono)] text-xs px-5 py-3" style={{ color: 'var(--vp-text)' }}>{money(r.order_total)}</td>
                      <td className="font-[var(--vp-font-mono)] text-xs font-bold px-5 py-3" style={{ color: 'var(--vp-accent)' }}>{money(r.commission_amount)}</td>
                      <td className="font-[var(--vp-font-mono)] text-[11px] px-5 py-3" style={{ color: 'var(--vp-text-muted)' }}>
                        {r.attribution === 'coupon' ? 'Coupon' : 'Link'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 tracking-wider ${STATUS_STYLE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-[var(--vp-font-mono)] text-[11px] px-5 py-3" style={{ color: 'var(--vp-text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
