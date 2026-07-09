import { Link } from 'react-router-dom';
import { THEMES } from '../themes';

/**
 * Bare-domain landing page — only reached if someone visits the portal
 * without a storefront-specific link (normally affiliates arrive via
 * "Affiliate Login" on their own storefront's site, which links straight to
 * /<storefront>/login).
 */
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f1ec] px-4">
      <div className="max-w-md w-full text-center">
        <p className="font-mono text-[11px] tracking-widest uppercase text-neutral-500 mb-2">
          VP Affiliate Portal
        </p>
        <h1 className="text-xl font-semibold text-neutral-800 mb-8">
          Choose your storefront to log in
        </h1>
        <div className="space-y-3">
          {Object.values(THEMES).map((t) => (
            <Link
              key={t.id}
              to={`/${t.id}/login`}
              className="block w-full py-3 px-4 border border-neutral-300 bg-white hover:border-neutral-500 rounded transition-colors text-sm text-neutral-700"
            >
              {t.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
