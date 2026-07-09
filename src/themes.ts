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
 */

import type { CSSProperties } from 'react';

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
    fonts: {
      heading: '"Playfair Display", serif',
      body: '"Lora", serif',
      mono: '"Courier Prime", monospace',
    },
    colors: {
      bg: '#F0E6D0',
      surface: '#FAF6ED',
      surfaceAlt: '#EDE4CC',
      border: '#D9C89A',
      text: '#2B1A0E',
      textMuted: '#6B4226',
      accent: '#B8942A',
      accentHover: '#D4B84A',
      accentText: '#2B1A0E',
    },
  },
  msv: {
    id: 'msv',
    name: 'My Secret Vitality',
    siteUrl: 'https://mysecretvitality.com',
    fonts: {
      heading: '"Cormorant Garamond", serif',
      body: '"Montserrat", sans-serif',
      mono: '"Courier Prime", monospace',
    },
    colors: {
      bg: '#EDE9E1',
      surface: '#F6F3ED',
      surfaceAlt: '#E4DFD4',
      border: '#D6CFC0',
      text: '#2E2E24',
      textMuted: '#5B5A4B',
      accent: '#BE8A3E',
      accentHover: '#D6A25A',
      accentText: '#2E2E24',
    },
  },
  liberty: {
    id: 'liberty',
    name: 'Liberty Peptides',
    // Not live yet — update once the storefront has a real domain.
    siteUrl: '',
    fonts: {
      heading: '"Playfair Display", serif',
      body: '"Montserrat", sans-serif',
      mono: '"Courier Prime", monospace',
    },
    colors: {
      bg: '#E8ECEE',
      surface: '#F5F7F8',
      surfaceAlt: '#DCE2E5',
      border: '#C7D0D4',
      text: '#1E2A30',
      textMuted: '#51636C',
      accent: '#2F5D6B',
      accentHover: '#3D7B8C',
      accentText: '#F5F7F8',
    },
  },
};

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
