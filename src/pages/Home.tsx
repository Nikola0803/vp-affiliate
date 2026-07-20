import { useState } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, NETWORK_NAME } from '../themes';

/**
 * Recruiting / landing page for the shared affiliate portal — reached when
 * someone visits the bare portal domain without a storefront-specific link
 * (normally affiliates arrive via "Affiliate Login" on their own storefront's
 * site, which links straight to /<storefront>/login or /register).
 *
 * Visual design ported from the client-approved mockup
 * (affiliate-mockups-2026-07-19.html, "01 · Recruiting Portal" screen) —
 * see index.css's ".calibrate-landing" block for the ported CSS.
 *
 * Copy differs from the mockup in a few places where the mockup's marketing
 * language didn't match how the program actually works today:
 *  - The mockup pitches "accepted once, represent every house" — but the WP
 *    backend (vp-affiliates plugin) scopes affiliate accounts per storefront;
 *    applying to a second house is a separate (fast) application, not
 *    automatic. Copy below says that honestly instead.
 *  - The mockup shows a fixed "10%" commission/discount and automatic tier
 *    progression — there's no tier system in the backend today, and rates
 *    are set per affiliate by our team. Copy below reflects that.
 *  - The mockup's "welcome merch kit" and "partner card / QR / wallet pass"
 *    features aren't built — left out rather than promised.
 */

type Picker = 'apply' | 'signin' | null;

const houses = Object.values(THEMES);
const liveHouses = houses.filter((h) => h.siteUrl);

export default function Home() {
  const [picker, setPicker] = useState<Picker>(null);

  const openPicker = (which: Picker) => {
    setPicker(which);
    requestAnimationFrame(() => {
      document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="calibrate-landing min-h-screen py-6 md:py-10 px-3 md:px-6">
      <div className="page">
        <nav className="site-nav">
          <span className="brand-mark">
            CALIBRATE<span className="sub">RESEARCH NETWORK</span>
          </span>
          <div className="links">
            <span>Program</span>
            <span>Houses</span>
            <span>How It Works</span>
            <span>Terms</span>
          </div>
          <div className="right">
            <button className="linkbtn" onClick={() => openPicker('signin')}>Sign In</button>
            <button className="cta" onClick={() => openPicker('apply')}>Apply</button>
          </div>
        </nav>

        <div className="hero">
          <div className="hero-glow" />
          <div>
            <span className="eyebrow">Research Use Only · By Application</span>
            <h1 style={{ marginTop: 16 }}>
              Represent an independent research <span className="accent">network</span>, not a single storefront.
            </h1>
            <p className="lede">
              Apply to the research houses that fit your audience, share your referral link or your own discount
              code, and track everything — clicks, orders, and commission — from one dashboard.
            </p>
            <div className="cta-row">
              <button className="cta" onClick={() => openPicker('apply')}>Apply to a House</button>
              <button className="cta ghost" onClick={() => openPicker('signin')}>Sign In</button>
            </div>
          </div>
          <div className="collage">
            <div className="tile t1" />
            <div className="tile t2" />
            <div className="tile t3" />
            <div className="tile t4" />
          </div>
        </div>

        <div className="stripe">
          <div className="cell"><div className="n">{houses.length}</div><div className="l">research houses in the network</div></div>
          <div className="cell"><div className="n">{liveHouses.length} live</div><div className="l">{houses.length - liveHouses.length} more launching soon</div></div>
          <div className="cell"><div className="n">30d</div><div className="l">referral tracking window</div></div>
          <div className="cell"><div className="n">1:1</div><div className="l">every application read by a person</div></div>
        </div>

        <div className="band">
          <span className="eyebrow">Why partners join</span>
          <h2 style={{ marginTop: 10, fontSize: '1.75rem' }}>Built around what actually pays you</h2>
          <div className="why-grid">
            <div className="why-card">
              <div className="glyph">H</div>
              <h3>Apply per house, on your terms</h3>
              <p>Each research house is its own quick application — apply to the ones that fit your audience, skip the ones that don't.</p>
            </div>
            <div className="why-card">
              <div className="glyph">%</div>
              <h3>Your own link, plus your own code</h3>
              <p>A trackable referral link and a personal discount code your audience can actually use — you earn commission either way.</p>
            </div>
            <div className="why-card">
              <div className="glyph">R</div>
              <h3>Rates reviewed by our team</h3>
              <p>Your commission is confirmed when you're approved, and our team can revisit it as you grow — just reach out.</p>
            </div>
            <div className="why-card">
              <div className="glyph">$</div>
              <h3>Request payouts on your schedule</h3>
              <p>Once your confirmed balance crosses your minimum, request a payout straight from your dashboard — no waiting on a fixed date.</p>
            </div>
            <div className="why-card">
              <div className="glyph">M</div>
              <h3>Materials ready on day one</h3>
              <p>Approved partners get a library of talking points, captions, and brand assets per house, ready to share immediately.</p>
            </div>
            <div className="why-card">
              <div className="glyph">D</div>
              <h3>We do the legwork</h3>
              <p>Can't find the right angle? Use our ready-made captions and creative as-is, or adapt them in your own voice.</p>
            </div>
          </div>
        </div>

        <div className="band">
          <span className="eyebrow">How it works</span>
          <div className="how-grid">
            <div className="how-step">
              <div className="stepno">01</div>
              <h3>Apply</h3>
              <p>Tell us where you publish and which house(s) fit your audience. Every application is read by a person — never auto-approved.</p>
            </div>
            <div className="how-step">
              <div className="stepno">02</div>
              <h3>Share, on-record</h3>
              <p>Post with your link or code using research-framed talking points — as-is, or in your own voice. Always with a visible #ad disclosure.</p>
            </div>
            <div className="how-step">
              <div className="stepno">03</div>
              <h3>Track and get paid</h3>
              <p>Watch clicks and orders roll in from your dashboard, and request a payout once your confirmed balance clears the minimum.</p>
            </div>
          </div>
        </div>

        <div className="band" id="get-started">
          <span className="eyebrow">Program terms</span>
          <div className="term-list">
            <div className="term"><div className="k">Commission rate</div><div className="v">Set per affiliate <span className="ex">confirmed on approval</span></div></div>
            <div className="term"><div className="k">Customer discount code</div><div className="v">Your own code <span className="ex">rate shown in your dashboard</span></div></div>
            <div className="term"><div className="k">Payout timing</div><div className="v">You request it, once you clear your minimum balance</div></div>
            <div className="term"><div className="k">Payout methods</div><div className="v">Multiple options — your choice, set in Account</div></div>
            <div className="term"><div className="k">Tracking window</div><div className="v">30 days per referral click</div></div>
            <div className="term"><div className="k">Review process</div><div className="v">Manual — no instant approval</div></div>
          </div>

          <div className="compliance-box">
            <strong style={{ fontSize: '0.95rem' }}>Every house in the network operates strictly Research Use Only.</strong>
            <p style={{ fontSize: '0.86rem', color: '#98A0AC', marginTop: 8, lineHeight: 1.6 }}>
              Partners describe the research, not a human outcome — no exceptions. Your application includes specific
              confirmations, not one blanket agreement, for example:
            </p>
            <div className="checks">
              <div className="chk"><span className="box" />I will describe the research, not imply a human health, medical, or performance benefit.</div>
              <div className="chk"><span className="box" />I will disclose the partnership (#ad) on every post that includes my code or link.</div>
              <div className="chk"><span className="box" />I understand no income is promised or guaranteed by participating in this program.</div>
            </div>
          </div>

          {picker && (
            <div style={{ marginTop: 40 }}>
              <span className="eyebrow">{picker === 'apply' ? 'Apply — choose a house' : 'Sign in — choose your house'}</span>
              <div className="house-pick">
                {houses.map((h) => (
                  <Link
                    key={h.id}
                    to={`/${h.id}/${picker === 'apply' ? 'register' : 'login'}`}
                    className="house-btn"
                  >
                    <div className="hb-name">{h.name}</div>
                    <div className="hb-sub">
                      {h.siteUrl ? (picker === 'apply' ? 'Apply to this house →' : 'Sign in →') : 'Launching soon — applications open at launch'}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="pagefoot">
          <span>{NETWORK_NAME} — a shared affiliate program across our research houses</span>
          <span>Every house operates Research Use Only, no exceptions</span>
        </footer>
      </div>
    </div>
  );
}
