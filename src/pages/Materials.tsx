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
  const [canSubmit, setCanSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [subType, setSubType] = useState<'text' | 'image' | 'link'>('text');
  const [subTitle, setSubTitle] = useState('');
  const [subContent, setSubContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const loadMaterials = (sf: string) => {
    fetch(`/api/affiliate-materials?storefront=${encodeURIComponent(sf)}`)
      .then((r) => r.json())
      .then((json) => setMaterials(json.materials || []))
      .catch(() => {
        /* non-fatal — page still usable for submitting */
      });
  };

  useEffect(() => {
    let cancelled = false;

    // Confirm the affiliate is logged in and find their REAL storefront —
    // materials themselves are a public read, but we still gate the page on
    // auth so it feels like part of the portal, not an open directory. This
    // also tells us whether their storefront accepts affiliate submissions.
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
        setCanSubmit(!!json.allow_affiliate_materials);
        loadMaterials(sf);
        return null;
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

  const submitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg(null);
    if (!subTitle || !subContent) {
      setSubmitMsg({ text: 'Title and content are required.', ok: false });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/affiliate-materials-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: subType, title: subTitle, content: subContent }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit material.');
      setSubmitMsg({ text: 'Submitted — pending admin review before it appears here.', ok: true });
      setSubTitle('');
      setSubContent('');
      setSubType('text');
    } catch (e) {
      setSubmitMsg({ text: e instanceof Error ? e.message : 'Failed to submit material.', ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1ec]">
        <p className="font-mono text-sm text-neutral-500">Loading materials…</p>
      </div>
    );
  }

  const labelCls = 'font-[var(--vp-font-heading)] text-[11px] tracking-[0.15em] uppercase text-[var(--vp-text)] block mb-1.5';
  const inputCls = 'w-full bg-[var(--vp-surface-alt)] border py-2.5 px-3 font-[var(--vp-font-body)] text-sm text-[var(--vp-text)] focus:outline-none transition-colors';

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

        {canSubmit && (
          <div className="mb-8 p-5 border" style={{ borderColor: 'var(--vp-border)', background: 'var(--vp-surface)' }}>
            <div className="flex items-center justify-between">
              <p className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--vp-text-muted)' }}>
                Have your own material to share?
              </p>
              <button
                onClick={() => setShowForm((v) => !v)}
                className="font-[var(--vp-font-heading)] text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors"
                style={{ borderColor: 'var(--vp-accent)', color: 'var(--vp-accent)' }}
              >
                {showForm ? 'Cancel' : 'Submit a Material'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={submitMaterial} className="space-y-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--vp-border)' }}>
                <div>
                  <label className={labelCls}>Title</label>
                  <input
                    type="text"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                    className={inputCls}
                    style={{ borderColor: 'var(--vp-border)' }}
                    placeholder="e.g. Instagram caption idea"
                  />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    value={subType}
                    onChange={(e) => setSubType(e.target.value as 'text' | 'image' | 'link')}
                    className={inputCls}
                    style={{ borderColor: 'var(--vp-border)' }}
                  >
                    <option value="text">Text (e.g. sample caption)</option>
                    <option value="image">Image URL</option>
                    <option value="link">Link URL</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Content</label>
                  <textarea
                    value={subContent}
                    onChange={(e) => setSubContent(e.target.value)}
                    className={inputCls}
                    style={{ borderColor: 'var(--vp-border)' }}
                    rows={3}
                    placeholder={subType === 'text' ? 'Your caption or copy…' : 'https://…'}
                  />
                </div>
                {submitMsg && (
                  <p className={`font-[var(--vp-font-mono)] text-xs ${submitMsg.ok ? 'text-green-700' : 'text-red-800'}`}>
                    {submitMsg.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="font-[var(--vp-font-heading)] text-xs tracking-[0.2em] uppercase py-2.5 px-6 border transition-all duration-300 disabled:opacity-50"
                  style={{ background: 'var(--vp-accent)', color: 'var(--vp-accent-text)', borderColor: 'var(--vp-accent)' }}
                >
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </button>
              </form>
            )}
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
