# VP Affiliate Portal

One shared affiliate login + dashboard, themed per storefront, deployed once
instead of copy-pasted into every VP storefront's own repo (Vintage
Peptides, My Secret Vitality, and any future storefront like Liberty
Peptides). Talks to the same shared `vp-affiliates` WordPress plugin every
storefront's own site already uses for click-tracking — this portal doesn't
change the backend at all, it just gives affiliates one place to log in and
check stats, correctly re-skinned to whichever brand they belong to.

## Why this exists

Each storefront's own site still needs its own tiny copy of:
- `src/utils/affiliate.ts` (cookie capture)
- `src/components/AffiliateTracker.tsx` (mounted in App.tsx, catches `?ref=`)
- `api/affiliate-track-click.ts` (click beacon proxy)
- the `affiliate_ref` line in checkout

— because that logic has to run *where the shopping happens*. But the
login/dashboard UI doesn't need to live on every storefront's site at all;
it's identical functionality just reskinned. This app is that one shared
implementation.

## How theming works

`src/themes.ts` has one entry per storefront (id, name, live site URL, fonts,
colors). The route is `/:storefront/login` and `/:storefront/dashboard` —
whichever storefront's "Affiliate Login" link an affiliate clicks decides the
theme on the login screen. After a successful login the *dashboard* always
themes itself off the storefront the WordPress plugin says the affiliate
actually belongs to (`GET /dashboard` → `storefront` field), not the URL —
so even if someone lands on the wrong storefront's login link by mistake,
their dashboard still renders correctly branded.

To add a new storefront (e.g. once Liberty Peptides has a real domain):
1. Add an entry to `THEMES` in `src/themes.ts` (colors/fonts/`siteUrl`).
2. Point that storefront's own site's "Affiliate Login" link at
   `https://<this-portal-domain>/<id>/login`.
3. Nothing else — the WP plugin already supports arbitrary storefront tabs.

## Environment variables (Vercel)

Same WordPress backend as every other storefront:

| Variable | Required | Notes |
|---|---|---|
| `WC_URL` | ✅ | Shared WordPress root URL, e.g. `https://db.vintagepeptides.com` |
| `WC_USER` | ✅ | WordPress username (WC_APP_PASSWORD auth) |
| `WC_APP_PASSWORD` | ✅ | WP Admin → Users → Application Passwords |

No `STOREFRONT` env var here — unlike each storefront's own site, this app
is multi-tenant by design. Affiliate login is by email only (emails are
globally unique in `wp_vp_affiliates`), and the storefront comes back from
the API.

## Deploying

Deploy this folder as its own Vercel project, e.g. at
`affiliates.vintagepeptides.com` (or whatever subdomain/domain you point at
it). `vercel.json` already rewrites all non-`/api` routes to `index.html`
for client-side routing.
