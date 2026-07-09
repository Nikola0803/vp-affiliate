import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getTheme, themeCssVars } from '../themes';

interface Referral {
  order_id: number;
  order_total: string | number;
  commission_amount: string | number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  created_at: string;
}

interface DashboardData {
  name: string;
  email: string;
  ref_code: string;
  storefront: string;
  commission_pct: number;
  clicks_total: number;
  clicks_30d: number;
  sales_confirmed: number;
  sales_pending: number;
  commission_pending: number;
  commission_confirmed: number;
  commission_paid: number;
  recent: Referral[];
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  paid: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

function money(n: number | string): string {
  return `$${Number(n).toFixed(2)}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { storefront: urlStorefront } = useParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/affiliate-dashboard')
      .then(async (res) => {
        if (res.status === 401) {
          if (!cancelled) navigate(`/${urlStorefront || ''}/login`.replace('//', '/'));
          return null;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load dashboard');
        return json as DashboardData;
      })
      .then((json) => {
        if (!cancelled && json) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard permissions denied — silently ignore */
    }
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

  return (
    <div className="min-h-screen py-10 bg-[var(--vp-bg)]" style={themeCssVars(theme)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-[var(--vp-font-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--vp-text-muted)] mb-1">
              {theme.name} · Affiliate Program
            </p>
            <h1 className="font-[var(--vp-font-heading)] text-2xl tracking-[0.1em] uppercase text-[var(--vp-text)]">
              Welcome, {data.name}
            </h1>
            <p className="font-[var(--vp-font-body)] text-xs text-[var(--vp-text-muted)] mt-1">
              Commission rate: {data.commission_pct}%
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase transition-colors"
            style={{ borderColor: 'var(--vp-border)', color: 'var(--vp-text-muted)', background: 'var(--vp-surface-alt)' }}
          >
            Log Out
          </button>
        </div>

        {/* Referral link */}
        <div className="mb-8 p-5 border" style={{ borderColor: 'var(--vp-accent)', background: 'var(--vp-surface)' }}>
          <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase text-[var(--vp-text-muted)] mb-2">
            Your Referral Link
          </p>
          {refLink ? (
            <>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <code className="flex-1 font-[var(--vp-font-mono)] text-xs md:text-sm text-[var(--vp-text)] border py-2.5 px-3 truncate" style={{ background: 'var(--vp-surface-alt)', borderColor: 'var(--vp-border)' }}>
                  {refLink}
                </code>
                <button
                  onClick={copyLink}
                  className="px-5 py-2.5 font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase border transition-colors whitespace-nowrap"
                  style={{ background: 'var(--vp-accent)', color: 'var(--vp-accent-text)', borderColor: 'var(--vp-accent)' }}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <p className="font-[var(--vp-font-body)] text-[11px] mt-2" style={{ color: 'var(--vp-text-muted)' }}>
                Referrals are tracked for 30 days after a visitor clicks your link. You earn commission once their order ships and WooCommerce marks it completed.
              </p>
            </>
          ) : (
            <p className="font-[var(--vp-font-body)] text-xs" style={{ color: 'var(--vp-text-muted)' }}>
              Referral code: <code className="font-[var(--vp-font-mono)]">{data.ref_code}</code> — this storefront's live site URL hasn't been configured in the portal yet.
            </p>
          )}
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

        {/* Chart */}
        <div className="p-5 border mb-10" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
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

        {/* Recent referrals */}
        <div className="border" style={{ borderColor: 'var(--vp-border)' }}>
          <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase p-5 pb-0" style={{ color: 'var(--vp-text-muted)' }}>
            Recent Referrals
          </p>
          {data.recent.length === 0 ? (
            <p className="font-[var(--vp-font-body)] text-xs italic text-center py-10" style={{ color: 'var(--vp-text-muted)' }}>
              No referrals yet — share your link to start earning.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full mt-3">
                <thead>
                  <tr className="border-t text-left" style={{ borderColor: 'var(--vp-border)' }}>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Order</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Order Total</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Your Commission</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Status</th>
                    <th className="font-[var(--vp-font-heading)] text-[9px] tracking-[0.15em] uppercase px-5 py-2" style={{ color: 'var(--vp-text-muted)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.order_id} className="border-t" style={{ borderColor: 'var(--vp-border)' }}>
                      <td className="font-[var(--vp-font-mono)] text-xs px-5 py-3" style={{ color: 'var(--vp-text)' }}>#{r.order_id}</td>
                      <td className="font-[var(--vp-font-mono)] text-xs px-5 py-3" style={{ color: 'var(--vp-text)' }}>{money(r.order_total)}</td>
                      <td className="font-[var(--vp-font-mono)] text-xs font-bold px-5 py-3" style={{ color: 'var(--vp-accent)' }}>{money(r.commission_amount)}</td>
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
