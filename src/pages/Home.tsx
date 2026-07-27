import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, NETWORK_NAME } from '../themes';

/**
 * Full recruiting microsite — restored from the client-approved mockup
 * (affiliate-mockups-2026-07-19.html) after a prior session had quietly
 * stripped it down to a bare "choose your house" login/apply picker,
 * without ever discussing that change. That picker is kept, but now lives
 * inside the fuller page (see the Houses section below) rather than being
 * the whole page.
 *
 * Content (headlines, stats, why-partner cards, how-it-works steps, terms,
 * compliance checklist) is fetched from the VP CMS plugin's Affiliate
 * Portal admin page (wp-admin -> VP CMS -> Affiliate Portal), the same way
 * the 3 storefronts' own page content is already wp-admin editable. The
 * DEFAULTS object below matches the plugin's own PHP defaults exactly, so
 * the page still renders correctly even if that fetch fails or hasn't
 * loaded yet — never a blank/broken landing page.
 */

const WP_URL = (import.meta.env.VITE_WP_URL as string | undefined) ?? 'https://db.vintagepeptides.com';
const CONTENT_ENDPOINT = `${WP_URL}/wp-json/vp-cms/v1/affiliate-portal`;

interface StatItem { value: string; label: string; }
interface WhyCard { glyph: string; title: string; body: string; }
interface HowStep { title: string; body: string; }
interface TermRow { k: string; v: string; ex: string; }

interface PortalContent {
  hero: {
    eyebrow: string;
    headline_prefix: string;
    headline_accent: string;
    headline_suffix: string;
    body: string;
    cta1_label: string;
    cta2_label: string;
  };
  stats: StatItem[];
  why: { eyebrow: string; headline: string; cards: WhyCard[] };
  how: { eyebrow: string; steps: HowStep[] };
  terms: { eyebrow: string; rows: TermRow[] };
  compliance: { headline: string; body: string; checks: string[] };
  footer: { left: string; right: string };
}

const DEFAULTS: PortalContent = {
  hero: {
    eyebrow: 'Research Use Only · By Application',
    headline_prefix: 'Join an independent research ',
    headline_accent: 'network',
    headline_suffix: ', not a link farm.',
    body: "Get accepted once and you're not tied to a single storefront — represent every research house in the network, get real marketing support, and shape your own path to the top.",
    cta1_label: 'Apply to the Network',
    cta2_label: 'Sign In',
  },
  stats: [
    { value: '3', label: 'research houses, one login' },
    { value: '30d', label: 'referral tracking window' },
    { value: '10%', label: 'starting commission (example)' },
    { value: '1:1', label: 'applications read by hand' },
  ],
  why: {
    eyebrow: 'Why partners join',
    headline: 'Built to invest in you the way you invest in it',
    cards: [
      { glyph: 'N', title: 'Multi-house access', body: 'Accepted once, represent every house in the network — one application instead of separate programs per brand.' },
      { glyph: '%', title: 'Real commission, plus your own code', body: 'Earn a starting 10% commission, and hand out a personal 10% discount code your audience will actually want to use.' },
      { glyph: '↑', title: 'Compensation that grows with you', body: "Your rate isn't fixed. Performance moves you through several tiers — the more you build, the more you keep." },
      { glyph: '$', title: 'Personalized payouts', body: 'Get paid the way that works for you — automatically every month, or as soon as you cross a set threshold. Your call.' },
      { glyph: 'K', title: 'A welcome worth showing off', body: 'Accepted partners get exclusive branded merch and digital goods from day one at the network — not a form-letter welcome.' },
      { glyph: 'M', title: 'We hand you the marketing, too', body: 'Social-ready graphics, captions, and content strategy — built for you, not left for you to invent alone.' },
    ],
  },
  how: {
    eyebrow: 'How it works',
    steps: [
      { title: 'Apply', body: 'Tell us where you publish and which houses fit your audience. Every application is read by a person — never auto-approved.' },
      { title: 'Share, on-record', body: 'Post with your code and link using research-framed talking points and creative we build for you — as-is, or in your own voice.' },
      { title: 'Earn, and move up', body: 'Track everything from your portal. Get paid on your terms, and climb toward higher-tier compensation as you perform.' },
    ],
  },
  terms: {
    eyebrow: 'Program terms',
    rows: [
      { k: 'Starting commission', v: '10%', ex: 'example figure' },
      { k: 'Customer discount code', v: '10% off', ex: 'example figure' },
      { k: 'Payout timing', v: 'Monthly, or at a threshold you set', ex: '' },
      { k: 'Compensation growth', v: 'Increases with performance, across several tiers', ex: '' },
      { k: 'Tracking window', v: '30 days per referral', ex: '' },
      { k: 'Review process', v: 'Manual — no instant approval', ex: '' },
    ],
  },
  compliance: {
    headline: 'Every house in the network operates strictly Research Use Only.',
    body: 'Partners describe the research, not a human outcome — no exceptions. Your application includes specific confirmations, not one blanket agreement, for example:',
    checks: [
      'I will describe the research, not imply a human health, medical, or performance benefit.',
      'I will disclose the partnership (#ad) on every post that includes my code or link.',
      'I understand no income is promised or guaranteed by participating in this program.',
    ],
  },
  footer: {
    left: 'Calibrate Research Network — an independent network for RUO research partners',
    right: 'Program terms subject to attorney review before partners sign',
  },
};

/** Shallow-merges fetched content over the defaults so a partially-configured
 *  wp-admin save (or a fetch that returns a subset) never blanks out a
 *  section — same defensive pattern the storefronts' own sections use. */
function mergeContent(base: PortalContent, over: Partial<PortalContent> | null): PortalContent {
  if (!over) return base;
  return {
    hero: { ...base.hero, ...over.hero },
    stats: Array.isArray(over.stats) && over.stats.length ? over.stats : base.stats,
    why: {
      eyebrow: over.why?.eyebrow ?? base.why.eyebrow,
      headline: over.why?.headline ?? base.why.headline,
      cards: Array.isArray(over.why?.cards) && over.why.cards.length ? over.why.cards : base.why.cards,
    },
    how: {
      eyebrow: over.how?.eyebrow ?? base.how.eyebrow,
      steps: Array.isArray(over.how?.steps) && over.how.steps.length ? over.how.steps : base.how.steps,
    },
    terms: {
      eyebrow: over.terms?.eyebrow ?? base.terms.eyebrow,
      rows: Array.isArray(over.terms?.rows) && over.terms.rows.length ? over.terms.rows : base.terms.rows,
    },
    compliance: {
      headline: over.compliance?.headline ?? base.compliance.headline,
      body: over.compliance?.body ?? base.compliance.body,
      checks: Array.isArray(over.compliance?.checks) && over.compliance.checks.length ? over.compliance.checks : base.compliance.checks,
    },
    footer: { ...base.footer, ...over.footer },
  };
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Home() {
  const houses = Object.values(THEMES);
  const [content, setContent] = useState<PortalContent>(DEFAULTS);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);
    fetch(CONTENT_ENDPOINT, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setContent((prev) => mergeContent(prev, data));
      })
      .catch(() => {
        // Non-fatal — DEFAULTS (matching the mockup exactly) already render.
      })
      .finally(() => clearTimeout(timeout));
    return () => controller.abort();
  }, []);

  const { hero, stats, why, how, terms, compliance, footer } = content;

  // BUG FIX 2026-07-25: the mockup file's own ".page" card (bordered,
  // rounded, drop-shadowed, max-width, centered) is how that FILE presents
  // multiple screens for review — it's not meant to be the live site's own
  // layout. Every section below is now full-width (background/dividers run
  // edge-to-edge); only the ".band-inner" wrapper inside each one caps
  // content at a readable width, like a normal website.
  return (
    <div className="calibrate-landing">
      <div className="page">
        <nav className="site-nav">
          <div className="band-inner">
            <span className="brand-mark">
              CALIBRATE<span className="sub">RESEARCH NETWORK</span>
            </span>
            <div className="links">
              <button onClick={() => scrollToId('why')}>Program</button>
              <button onClick={() => scrollToId('houses')}>Houses</button>
              <button onClick={() => scrollToId('how')}>How It Works</button>
              <button onClick={() => scrollToId('terms')}>Terms</button>
            </div>
            <div className="right">
              <button className="linkbtn" onClick={() => scrollToId('houses')}>
                Sign In
              </button>
              <button className="cta" onClick={() => scrollToId('houses')}>
                Apply
              </button>
            </div>
          </div>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="hero">
          <div className="hero-glow" />
          <div className="band-inner">
            <div>
              <span className="eyebrow">{hero.eyebrow}</span>
              <h1 style={{ marginTop: 16 }}>
                {hero.headline_prefix}
                <span className="accent">{hero.headline_accent}</span>
                {hero.headline_suffix}
              </h1>
              <p className="lede">{hero.body}</p>
              <div className="cta-row">
                <button className="cta" onClick={() => scrollToId('houses')}>
                  {hero.cta1_label}
                </button>
                <button className="cta ghost" onClick={() => scrollToId('houses')}>
                  {hero.cta2_label}
                </button>
              </div>
            </div>
            <div className="collage" aria-hidden="true">
              <div className="tile t1" />
              <div className="tile t2" />
              <div className="tile t3" />
              <div className="tile t4" />
            </div>
          </div>
        </div>

        {/* ── Stats strip ──────────────────────────────────────────────── */}
        <div className="stripe">
          <div className="band-inner">
            {stats.map((s, i) => (
              <div className="cell" key={i}>
                <div className="n">{s.value}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why partners join ────────────────────────────────────────── */}
        <div className="band" id="why">
          <div className="band-inner">
            <span className="eyebrow">{why.eyebrow}</span>
            <h2 style={{ marginTop: 10, fontSize: '1.75rem' }}>{why.headline}</h2>
            <div className="why-grid">
              {why.cards.map((c, i) => (
                <div className="why-card" key={i}>
                  <div className="glyph">{c.glyph}</div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <div className="band" id="how">
          <div className="band-inner">
            <span className="eyebrow">{how.eyebrow}</span>
            <div className="how-grid">
              {how.steps.map((step, i) => (
                <div className="how-step" key={i}>
                  <div className="stepno">{String(i + 1).padStart(2, '0')}</div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Houses (real login/apply picker) ─────────────────────────── */}
        <div className="band" id="houses">
          <div className="band-inner">
            <span className="eyebrow">Choose your house</span>
            <h2 style={{ marginTop: 10, fontSize: '1.6rem' }}>Accepted once, represented everywhere</h2>
            <p style={{ color: '#98A0AC', fontSize: '0.9rem', marginTop: 10, maxWidth: '60ch', lineHeight: 1.6 }}>
              Each house has its own affiliate account — pick the one you want to apply to or sign in to.
            </p>
            <div className="house-grid">
              {houses.map((h) => (
                <div key={h.id} className="house-card">
                  <div className="plate" />
                  <div className="inner">
                    <h3>{h.name}</h3>
                    <div className="desc">
                      {h.siteUrl ? `Live now at ${h.siteUrl.replace(/^https?:\/\//, '')}` : 'Launching soon'}
                    </div>
                    <div className="status">
                      <span className={`dot${h.siteUrl ? '' : ' soon'}`} />
                      {h.siteUrl ? 'Accepting applications' : 'Not yet open'}
                    </div>
                    <div className="btn-row">
                      <Link to={`/${h.id}/login`} className="cta ghost" style={{ padding: '8px 16px', fontSize: '0.72rem' }}>
                        Sign In
                      </Link>
                      <Link to={`/${h.id}/register`} className="cta" style={{ padding: '8px 16px', fontSize: '0.72rem' }}>
                        Apply
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Program terms + compliance ────────────────────────────────── */}
        <div className="band" id="terms">
          <div className="band-inner">
            <span className="eyebrow">{terms.eyebrow}</span>
            <div className="term-list">
              {terms.rows.map((row, i) => (
                <div className="term" key={i}>
                  <div className="k">{row.k}</div>
                  <div className="v">
                    {row.v}
                    {row.ex && <span className="ex">{row.ex}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="compliance-box">
              <strong style={{ fontSize: '0.95rem' }}>{compliance.headline}</strong>
              <p style={{ fontSize: '0.86rem', color: '#98A0AC', marginTop: 8, lineHeight: 1.6 }}>{compliance.body}</p>
              <div className="checks">
                {compliance.checks.map((chk, i) => (
                  <div className="chk" key={i}>
                    <span className="box" />
                    {chk}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="pagefoot">
          <div className="band-inner">
            <span>{footer.left}</span>
            <span>{footer.right}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
