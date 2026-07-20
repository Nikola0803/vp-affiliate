/**
 * Storefront theme registry.
 *
 * One login/dashboard implementation, reskinned per storefront so affiliates
 * still feel like they're on "their" brand's site even though this portal is
 * a single shared deployment talking to the one shared vp-affiliates WP
 * plugin (same backend every storefront's own site already uses for
 * click-tracking).
 *
 * To add a new storefront: add an entry here with its colors/fonts/site URL,
 * then point that storefront's "Affiliate Login" link at
 * `https://<this-portal-domain>/<id>/login`. No other code changes needed —
 * the WP plugin already supports arbitrary storefront tabs.
 *
 * As of the "Calibrate Research Network" redesign (2026-07), the portal
 * presents ONE unified dark/gold visual identity across every storefront —
 * matching the client-approved mockup — rather than three separately tinted
 * light themes. Every brand entry below intentionally shares the same
 * colors/fonts for that reason; per-brand identity now comes through only
 * via `name` / `siteUrl` (and the ref link / coupon data itself), not paint.
 */

import type { CSSProperties } from 'react';

/** Shared Calibrate Research Network visual identity (see themeCssVars below). */
const CALIBRATE_FONTS = {
  heading: '"Avenir Next", "Century Gothic", "Futura", -apple-system, sans-serif',
  body: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  mono: '"Consolas", "SFMono-Regular", "Courier New", monospace',
};

const CALIBRATE_COLORS = {
  bg: '#0F1319',
  surface: '#171C24',
  surfaceAlt: '#1D232C',
  border: '#262D38',
  text: '#ECE8DE',
  textMuted: '#98A0AC',
  accent: '#D7A84B',
  accentHover: '#EFC978',
  accentText: '#1A1305',
};

export interface StorefrontTheme {
  id: string;
  name: string;
  /** The storefront's own live site — referral links and the "back to site" link point here. */
  siteUrl: string;
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    /** Text color to use on top of an accent-colored background/button. */
    accentText: string;
  };
}

export const THEMES: Record<string, StorefrontTheme> = {
  vintage: {
    id: 'vintage',
    name: 'Vintage Peptides',
    siteUrl: 'https://vintagepeptides.com',
    fonts: CALIBRATE_FONTS,
    colors: CALIBRATE_COLORS,
  },
  msv: {
    id: 'msv',
    name: 'My Secret Vitality',
    siteUrl: 'https://mysecretvitality.com',
    fonts: CALIBRATE_FONTS,
    colors: CALIBRATE_COLORS,
  },
  liberty: {
    id: 'liberty',
    name: 'Liberty Peptides',
    // Not live yet — update once the storefront has a real domain.
    siteUrl: '',
    fonts: CALIBRATE_FONTS,
    colors: CALIBRATE_COLORS,
  },
};

/** Network-level brand — shown in the shared nav/footer instead of any one storefront's name. */
export const NETWORK_NAME = 'Calibrate Research Network';

export const DEFAULT_THEME_ID = 'vintage';

export function getTheme(id: string | undefined): StorefrontTheme {
  if (id && THEMES[id]) return THEMES[id];
  return THEMES[DEFAULT_THEME_ID];
}

/** CSS custom properties for a theme — applied inline on the page wrapper. */
export function themeCssVars(theme: StorefrontTheme): CSSProperties {
  return {
    '--vp-bg': theme.colors.bg,
    '--vp-surface': theme.colors.surface,
    '--vp-surface-alt': theme.colors.surfaceAlt,
    '--vp-border': theme.colors.border,
    '--vp-text': theme.colors.text,
    '--vp-text-muted': theme.colors.textMuted,
    '--vp-accent': theme.colors.accent,
    '--vp-accent-hover': theme.colors.accentHover,
    '--vp-accent-text': theme.colors.accentText,
    '--vp-font-heading': theme.fonts.heading,
    '--vp-font-body': theme.fonts.body,
    '--vp-font-mono': theme.fonts.mono,
  } as CSSProperties;
}
