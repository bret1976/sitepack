/** SitePack catalog — 7 sellable sites */
export const PACKS = [
  {
    id: 'still-theory-studio',
    slug: 'still-theory-studio',
    title: 'Still Theory Studio',
    category: 'Film Studio',
    tagline: 'Cinematic portfolio with scroll-scrub film energy.',
    demo: 'https://still-theory-studio.vercel.app',
    price: 49,
    stack: 'Next.js / Vite hybrid · film assets · studio portfolio',
    source: 'repo:bret1976/still-theory-studio',
    included: [
      'Full sanitized source (lite pack on unlock; full film media in complete archive on box)',
      'SITEPACK_README + LICENSE',
      'Run with npm install && npm run dev',
    ],
    accent: '#e8ff6b',
  },
  {
    id: 'jmi-entertainment',
    slug: 'jmi-entertainment',
    title: 'JMI Entertainment',
    category: 'Entertainment',
    tagline: 'Bold entertainment brand site — ready to remix.',
    demo: 'https://jmi-entertainment.vercel.app',
    price: 49,
    stack: 'Next.js / Vite · entertainment landing',
    source: 'repo:bret1976/jmi-entertainment',
    included: ['Full sanitized source ZIP', 'README + LICENSE', 'npm install && npm run dev'],
    accent: '#ff7a59',
  },
  {
    id: '6frame-rate-website',
    slug: '6frame-rate-website',
    title: '6Frame Rates',
    category: 'Agency Rates',
    tagline: 'Production rates site used live at 6framerates.com.',
    demo: 'https://www.6framerates.com',
    price: 49,
    stack: 'React + Vite + Firebase (keys redacted)',
    source: 'repo:bret1976/6frame-rate-website',
    included: ['Full sanitized source', 'Firebase config placeholders', 'npm install && npm run dev'],
    accent: '#7dd3fc',
  },
  {
    id: 'starling',
    slug: 'starling',
    title: 'Starling',
    category: 'SaaS',
    tagline: 'Local-business reviews & inbox SaaS — Python FastAPI.',
    demo: 'https://starling-production-5190.up.railway.app',
    price: 49,
    stack: 'Python FastAPI · Railway-ready',
    source: 'repo:bret1976/starling',
    included: ['Full sanitized source', 'requirements.txt', 'uvicorn app.main:app'],
    accent: '#c4b5fd',
  },
  {
    id: 'cory-warfield-coaching-site',
    slug: 'cory-warfield-coaching-site',
    title: 'Cory Warfield Coaching',
    category: 'Coaching',
    tagline: 'Clean multi-page coaching site — pure HTML/CSS/JS.',
    demo: 'https://cory-warfield-coaching-site.vercel.app',
    price: 49,
    stack: 'Static HTML · CSS · JS',
    source: 'repo:VegasCryptoAgent/cory-warfield-coaching-site',
    included: ['Static pages + assets', 'Open index.html or npx serve'],
    accent: '#fbbf24',
  },
  {
    id: 'your-fresh-start-solutions',
    slug: 'your-fresh-start-solutions',
    title: 'Your Fresh Start Solutions',
    category: 'Services',
    tagline: 'Service-business site with Vite front + Node server.',
    demo: 'https://your-fresh-start-solutions.vercel.app',
    price: 49,
    stack: 'Vite + Node server',
    source: 'repo:bret1976/your-fresh-start-solutions',
    included: ['Full sanitized source', 'npm install && npm run dev'],
    accent: '#86efac',
  },
  {
    id: 'north-and-mercer',
    slug: 'north-and-mercer',
    title: 'North & Mercer',
    category: 'Design-Build',
    tagline: 'Award-winning design-build aesthetic — Framer static capture.',
    demo: 'https://north-and-mercer.vercel.app',
    price: 49,
    stack: 'Framer → static HTML/CSS/JS capture',
    source: 'static-capture (no public GitHub)',
    included: [
      'Static site capture from live deploy',
      'Design/structure reference to remix',
      'Not a Framer .framer project export',
    ],
    accent: '#f9a8d4',
  },
]

export const ALL_ACCESS = {
  id: 'all-access',
  slug: 'all-access',
  title: 'All-Access',
  price: 149,
  compareAt: 343,
  tagline: 'Unlock all 7 SitePacks in one purchase.',
}

/** Demo unlock — Bret can test without Stripe while gateway is down */
export const DEMO_UNLOCK_CODE = 'SITEPACK-DEMO-2026'

/**
 * Stripe Payment Link URLs — filled when Stripe MCP recovers.
 * Buy buttons fall back to /checkout?pack=<id> demo path until set.
 */
export const STRIPE_LINKS = {
  'still-theory-studio': '',
  'jmi-entertainment': '',
  '6frame-rate-website': '',
  starling: '',
  'cory-warfield-coaching-site': '',
  'your-fresh-start-solutions': '',
  'north-and-mercer': '',
  'all-access': '',
}

export function packZipPath(id) {
  if (id === 'all-access') return null // all-access too large for Vercel host; per-pack downloads
  return `/packs/${id}.zip`
}
