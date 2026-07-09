import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getTheme, themeCssVars } from '../themes';

interface Material {
  id: number;
  type: 'image' | 'text' | 'link';
  title: string;
  content: string;
  created_at: string;
}

export default function Materials() {
  const navigate = useNavigate();
  const { storefront: urlStorefront } = useParams();
  const [storefront, setStorefront] = useState<string | undefined>(urlStorefront);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Confirm the affiliate is logged in and find their REAL storefront —
    // materials themselves are a public read, but we still gate the page on
    // auth so it feels like part of the portal, not an open directory.
    fetch('/api/affiliate-dashboard')
      .then(async (res) => {
        if (res.status === 401) {
          if (!cancelled) navigate(`/${urlStorefront || ''}/login`.replace('//', '/'));
          return null;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load materials');
        return json;
      })
      .then((json) => {
        if (cancelled || !json) return null;
        const sf = json.storefront || urlStorefront;
        setStorefront(sf);
        return fetch(`/api/affiliate-materials?storefront=${encodeURIComponent(sf)}`).then((r) => r.json());
      })
      .then((json) => {
        if (!cancelled && json) setMaterials(json.materials || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load materials');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const theme = getTheme(storefront);

  const copy = async (m: Material) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard permissions denied — ignore */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1ec]">
        <p className="font-mono text-sm text-neutral-500">Loading materials…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-[var(--vp-bg)]" style={themeCssVars(theme)}>
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-[var(--vp-font-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--vp-text-muted)] mb-1">
              {theme.name} · Affiliate Program
            </p>
            <h1 className="font-[var(--vp-font-heading)] text-2xl tracking-[0.1em] uppercase text-[var(--vp-text)]">
              Marketing Materials
            </h1>
          </div>
          <Link
            to={`/${storefront}/dashboard`}
            className="px-4 py-2 border font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase transition-colors"
            style={{ borderColor: 'var(--vp-border)', color: 'var(--vp-text-muted)', background: 'var(--vp-surface-alt)' }}
          >
            ← Dashboard
          </Link>
        </div>

        {error && (
          <div role="alert" className="p-3 border border-red-900/30 bg-red-900/5 mb-6">
            <p className="font-[var(--vp-font-mono)] text-xs text-red-800">{error}</p>
          </div>
        )}

        {materials.length === 0 && !error ? (
          <div className="p-10 border text-center" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
            <p className="font-[var(--vp-font-body)] text-sm italic text-[var(--vp-text-muted)]">
              No marketing materials have been added for this storefront yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((m) => (
              <div key={m.id} className="p-5 border" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-[var(--vp-font-heading)] text-sm tracking-[0.05em] text-[var(--vp-text)]">{m.title}</p>
                  <span
                    className="font-[var(--vp-font-mono)] text-[9px] tracking-widest uppercase px-1.5 py-0.5"
                    style={{ background: 'var(--vp-surface-alt)', color: 'var(--vp-text-muted)' }}
                  >
                    {m.type}
                  </span>
                </div>

                {m.type === 'image' ? (
                  <img src={m.content} alt={m.title} className="w-full rounded-sm border mb-3" style={{ borderColor: 'var(--vp-border)' }} />
                ) : (
                  <p
                    className="font-[var(--vp-font-body)] text-sm mb-3 whitespace-pre-wrap break-words"
                    style={{ color: 'var(--vp-text)' }}
                  >
                    {m.content}
                  </p>
                )}

                <button
                  onClick={() => copy(m)}
                  className="w-full font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase py-2 border transition-colors"
                  style={{ borderColor: 'var(--vp-accent)', color: 'var(--vp-accent)' }}
                >
                  {copiedId === m.id ? 'Copied!' : m.type === 'link' || m.type === 'image' ? 'Copy URL' : 'Copy Text'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
