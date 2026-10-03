import { useEffect, useMemo, useState } from 'react'
import { Link, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  PACKS,
  PLACEHOLDERS,
  GALLERY,
  FILTERS,
  ALL_ACCESS,
  PLANS,
  DEMO_UNLOCK_CODE,
  STRIPE_LINKS,
  packZipPath,
} from './packs'

const UNLOCK_KEY = 'sitepack_unlocked'

function useUnlocked() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(UNLOCK_KEY) || 'null')
    } catch {
      return null
    }
  })
  const save = (payload) => {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(payload))
    setUnlocked(payload)
  }
  return [unlocked, save]
}

function buyPack(packId, navigate) {
  const link = STRIPE_LINKS[packId]
  if (link) {
    window.location.href = link
    return
  }
  navigate(`/checkout?pack=${encodeURIComponent(packId)}`)
}


async function writeClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    el.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

const PROMPT_ZIPS = {
  'cold-shine': ['/prompt-files/cold-shine-extra.zip'],
  'penguin-inc': ['/prompt-files/penguin-inc-extra.zip'],
  'north-and-mercer': ['/prompt-files/north-and-mercer-extra.zip'],
  'moment-path': ['/prompt-files/moment-path-extra.zip'],
  'commerce-dispatch-winter-shift': [
    '/prompt-files/commerce-dispatch-winter-shift-extra-1.zip',
    '/prompt-files/commerce-dispatch-winter-shift-extra-2.zip',
    '/prompt-files/commerce-dispatch-winter-shift-extra-3.zip',
    '/prompt-files/commerce-dispatch-winter-shift-extra-4.zip',
  ],
}

function downloadPromptZips(packId) {
  const hrefs = PROMPT_ZIPS[packId]
  if (!hrefs) return
  for (const href of hrefs) {
    const a = document.createElement('a')
    a.href = href
    a.download = href.split('/').pop()
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}

function CopyPromptButton({ packId, variant = 'card' }) {
  const [state, setState] = useState('idle')
  const copy = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (state === 'copying') return
    setState('copying')
    downloadPromptZips(packId)
    try {
      const res = await fetch(`/prompts/${packId}.txt`)
      if (!res.ok) throw new Error('missing')
      const text = await res.text()
      if (!text.trim()) throw new Error('empty')
      const ok = await writeClipboard(text)
      if (!ok) throw new Error('clipboard')
      setState('copied')
    } catch {
      setState('error')
    }
    window.setTimeout(() => setState('idle'), 2000)
  }
  if (variant === 'modal') {
    const label = state === 'copying' ? 'Copying…' : state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : 'Copy prompt'
    return (
      <button type="button" className="ms-btn-block ms-btn-ghost" onClick={copy} aria-live="polite">
        {label}
      </button>
    )
  }
  const label = state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : 'Copy prompt'
  return (
    <button
      type="button"
      className={`ms-card-copy${state === 'copied' ? ' is-copied' : ''}${state === 'error' ? ' is-error' : ''}`}
      aria-label={label}
      onClick={copy}
    >
      {state === 'copied' ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 2a9 9 0 0 1 9 9 8.96 8.96 0 0 1-1.968 5.617l3.675 3.676a1 1 0 0 1-1.32 1.497l-.094-.083-3.676-3.675A8.96 8.96 0 0 1 11 20a9 9 0 1 1 0-18zm0 2a7 7 0 1 0 0 14c1.89 0 3.606-.749 4.865-1.967a.73.73 0 0 1 .077-.09l.09-.077C17.251 14.606 18 12.89 18 11a7 7 0 0 0-7-7z" />
    </svg>
  )
}

function UnlockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-1.8 10H4.8L3 8z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function Nav({ onSearch }) {
  return (
    <nav className="ms-nav">
      <Link to="/" className="ms-logo">
        <span className="ms-logo-badge">S</span>
        <span>SitePack</span>
      </Link>
      <div className="ms-nav-links no-scrollbar">
        <a href="/#gallery">Gallery</a>
        <Link to="/pricing">Unlimited</Link>
        <Link to="/success">Unlock</Link>
      </div>
      <div className="ms-nav-right">
        <button type="button" className="ms-icon-btn" aria-label="Search" onClick={onSearch}>
          <SearchIcon />
        </button>
        <Link to="/pricing" className="ms-btn-solid">
          Go Unlimited
        </Link>
      </div>
      <div className="ms-nav-mobile">
        <button type="button" className="ms-icon-btn" aria-label="Search" onClick={onSearch}>
          <SearchIcon />
        </button>
        <Link to="/pricing" className="ms-btn-solid">
          Unlimited
        </Link>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="ms-footer">
      <span>© SitePack {new Date().getFullYear()}. Source ZIPs for personal & client work.</span>
      <div className="ms-footer-social">
        <span style={{ fontSize: 12 }}>No resale as competing packs</span>
      </div>
    </footer>
  )
}

function SearchOverlay({ open, onClose, onSelect }) {
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return GALLERY.slice(0, 8)
    return GALLERY.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle) ||
        (p.tagline || '').toLowerCase().includes(needle),
    ).slice(0, 12)
  }, [q])

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  if (!open) return null
  return (
    <div className="ms-search-overlay" onClick={onClose}>
      <div className="ms-search-box" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search packs…"
          aria-label="Search packs"
        />
        <div className="ms-search-results">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p)
                onClose()
              }}
            >
              <span>{p.title}</span>
              <span className="cat">{p.category}{p.comingSoon ? ' · Soon' : ''}</span>
            </button>
          ))}
          {!results.length && <div style={{ padding: 12, color: 'var(--dim)', fontSize: 14 }}>No matches</div>}
        </div>
      </div>
    </div>
  )
}

function PackCard({ pack, onOpen }) {
  const [loaded, setLoaded] = useState(false)
  const [live, setLive] = useState(false)
  const canLive = Boolean(pack.demo) && !pack.comingSoon
  return (
    <article
      className="ms-card"
      onClick={() => onOpen(pack)}
      onMouseEnter={() => { if (canLive) setLive(true) }}
      onMouseLeave={() => setLive(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(pack) }}
    >
      <div className="ms-card-media">
        {!loaded && !live && <div className="shimmer" />}
        {pack.comingSoon && <span className="ms-card-soon">Coming soon</span>}
        <img
          src={pack.poster}
          alt={pack.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{ opacity: live ? 0 : loaded ? 1 : 0 }}
        />
        {live && (
          <iframe
            className="ms-card-live"
            title={`${pack.title} live preview`}
            src={pack.demo}
            tabIndex={-1}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            allow="autoplay; fullscreen"
          />
        )}
      </div>
      <div className="ms-card-meta">
        <div className="min-w-0" style={{ minWidth: 0 }}>
          <h3>{pack.title}</h3>
          <span className="cat">{pack.category}</span>
        </div>
        <div className="ms-card-actions">
          {!pack.comingSoon && <CopyPromptButton packId={pack.id} />}
          <button
            type="button"
            className="ms-card-unlock"
            aria-label={pack.comingSoon ? 'Coming soon' : 'Unlock pack'}
            onClick={(e) => {
              e.stopPropagation()
              onOpen(pack)
            }}
          >
            <UnlockIcon />
          </button>
        </div>
      </div>
    </article>
  )
}

function PackModal({ pack, onClose }) {
  const navigate = useNavigate()
  const [showLive, setShowLive] = useState(() => Boolean(pack?.demo) && !pack?.comingSoon)
  useEffect(() => {
    if (!pack) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pack, onClose])
  if (!pack) return null

  const isPlaceholder = !!pack.comingSoon

  return (
    <div className="ms-modal-backdrop" onClick={onClose}>
      <div className="ms-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ms-modal-preview">
          <button className="ms-modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
          {showLive && pack.demo && !isPlaceholder ? (
            <iframe title={`${pack.title} preview`} src={pack.demo} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" allow="autoplay; fullscreen" />
          ) : (
            <img src={pack.poster} alt={pack.title} />
          )}
        </div>
        <div className="ms-modal-body">
          <span className="cat">{pack.category}{isPlaceholder ? ' · Coming soon' : ''}</span>
          <h2>{pack.title}</h2>
          <p className="lead">{pack.tagline}</p>
          {!isPlaceholder && (
            <div className="ms-modal-stack">
              <strong>Stack:</strong> {pack.stack}<br />
              <strong>Source:</strong> {pack.source}
            </div>
          )}
          {!isPlaceholder && pack.included && (
            <>
              <strong style={{ fontSize: 13 }}>What’s included</strong>
              <ul>
                {pack.included.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </>
          )}
          {isPlaceholder && (
            <p className="lead" style={{ color: 'var(--dim)' }}>
              Placeholder card so the gallery stays Motionsites-dense. Real ZIP packs will replace these.
            </p>
          )}
          <div className="ms-price-tag">{isPlaceholder ? 'Not for sale yet' : `$${pack.price} one-time · source ZIP`}</div>
          <div className="ms-modal-actions">
            {!isPlaceholder ? (
              <>
                <CopyPromptButton packId={pack.id} variant="modal" />
                <button className="ms-btn-block ms-btn-primary" type="button" onClick={() => buyPack(pack.id, navigate)}>
                  Unlock — ${pack.price}
                </button>
                {pack.demo && (
                  <button className="ms-btn-block ms-btn-ghost" type="button" onClick={() => setShowLive((v) => !v)}>
                    {showLive ? 'Show poster' : 'Live preview'}
                  </button>
                )}
                {pack.demo && (
                  <a className="ms-btn-block ms-btn-ghost" href={pack.demo} target="_blank" rel="noreferrer">
                    Open live site ↗
                  </a>
                )}
              </>
            ) : (
              <Link className="ms-btn-block ms-btn-primary" to="/pricing" onClick={onClose}>
                Go Unlimited instead
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Home({ selected, setSelected }) {
  const [filter, setFilter] = useState('All')

  const filtered = useMemo(() => {
    if (filter === 'All') return GALLERY
    return GALLERY.filter((p) => (p.filters || [p.category]).includes(filter) || p.category === filter)
  }, [filter])

  return (
    <>
      <header className="ms-hero">
        <span className="ms-grad-pill"><span>Fresh source drops</span></span>
        <h1>
          Unlock <em>your</em><br />
          Site <span className="ms-grad-text" data-text="Source">Source</span>
        </h1>
        <p>
          Browse live website demos. Buy once. Download the ZIP — remix for personal projects and client work.
        </p>
        <Link to="/pricing" className="ms-hero-cta">
          Go Unlimited →
        </Link>
      </header>

      <div className="ms-toolbar" id="gallery">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ms-chips no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`ms-chip${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <Link to="/pricing" className="ms-sort-btn">
          <span>Pricing</span>
          <ChevronIcon />
        </Link>
      </div>

      <div className="ms-gallery-wrap">
        <div className="ms-gallery">
          {filtered.map((pack) => (
            <PackCard key={pack.id} pack={pack} onOpen={setSelected} />
          ))}
        </div>
        {!filtered.length && (
          <p style={{ textAlign: 'center', color: 'var(--dim)', padding: 40 }}>No packs in this filter yet.</p>
        )}
      </div>

    </>
  )
}

function PackPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const pack = [...PACKS, ...PLACEHOLDERS].find((p) => p.slug === slug)
  if (!pack) {
    return (
      <div className="ms-page">
        <h1>Pack not found</h1>
        <Link to="/">← Back to gallery</Link>
      </div>
    )
  }
  return <PackModal pack={pack} onClose={() => navigate('/')} />
}

function Pricing() {
  const navigate = useNavigate()
  return (
    <div className="ms-pricing">
      <div className="ms-pricing-hero">
        <span className="ms-grad-pill"><span>All-Access</span></span>
        <h1>
          Unlimited packs,<br />
          <span className="ms-grad-text" data-text="Unlimited Access">Unlimited Access</span>
        </h1>
        <p>Pick the plan that fits your workflow. Yearly or save with lifetime All-Access.</p>
      </div>

      <div className="ms-plan-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`ms-plan${plan.popular ? ' popular' : ''}`}>
            {plan.popular && <span className="ms-plan-badge">Most Popular</span>}
            <h3>{plan.name}</h3>
            <p className="sub">{plan.subtitle}</p>
            <div className="amount">
              {plan.compareAt && <s>${plan.compareAt}</s>}
              ${plan.price}
            </div>
            <div className="period">{plan.period}</div>
            <button
              className="ms-btn-block ms-btn-primary"
              type="button"
              onClick={() => buyPack(plan.packId, navigate)}
            >
              {plan.cta}
            </button>
            <ul>
              {plan.features.map((f) => (
                <li key={f}><CheckIcon /><span>{f}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="ms-pack-offer">
        <div>
          <h3>Single packs</h3>
          <p>One-off website builds when you don’t need All-Access. ${PACKS[0]?.price || 49} each.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="price">${PACKS[0]?.price || 49}</div>
          <a className="ms-btn-solid" href="/#gallery">Browse gallery</a>
        </div>
      </div>

      <div className="ms-faq">
        <details open>
          <summary>What do I get? <ChevronIcon /></summary>
          <p>Downloadable website source ZIPs (HTML/CSS/JS or full repos) — not AI prompts. Preview live demos, unlock, download, remix.</p>
        </details>
        <details>
          <summary>Can I use packs for client work? <ChevronIcon /></summary>
          <p>Yes. Personal projects and client work are both OK. Rebrand before shipping.</p>
        </details>
        <details>
          <summary>Can I resell the pack? <ChevronIcon /></summary>
          <p>No. Don’t redistribute or list the ZIP (or a near-identical kit) as a competing source pack or template product.</p>
        </details>
        <details>
          <summary>What’s different from Motionsites? <ChevronIcon /></summary>
          <p>Motionsites sells AI prompts. SitePack sells actual website source ZIPs you can run and remix.</p>
        </details>
        <details>
          <summary>What currency? <ChevronIcon /></summary>
          <p>USD.</p>
        </details>
      </div>
    </div>
  )
}

function Checkout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [, save] = useUnlocked()
  const packId = params.get('pack') || 'all-access'
  const pack = packId === 'all-access' ? ALL_ACCESS : PACKS.find((p) => p.id === packId)

  return (
    <div className="ms-page">
      <h1>Checkout</h1>
      <p>
        Stripe Payment Links are not wired yet. Use the demo unlock path so you can test downloads end-to-end.
      </p>
      <div className="ms-box">
        <strong>{pack?.title || packId}</strong>
        <div style={{ color: 'var(--dim)', marginTop: 6 }}>
          ${pack?.price || '—'} one-time · when Stripe is live, Buy opens a Payment Link → /success
        </div>
        <button
          className="ms-btn-block ms-btn-primary"
          style={{ marginTop: 16 }}
          type="button"
          onClick={() => {
            save({
              mode: 'demo',
              packId,
              at: new Date().toISOString(),
              code: DEMO_UNLOCK_CODE,
            })
            navigate(`/success?demo=1&pack=${encodeURIComponent(packId)}`)
          }}
        >
          Simulate purchase (demo unlock)
        </button>
      </div>
      <p className="ms-note">
        Real path when Stripe recovers: Payment Link → /success?session_id=&#123;CHECKOUT_SESSION_ID&#125; → verify → downloads.
      </p>
    </div>
  )
}

function Success() {
  const [params] = useSearchParams()
  const [unlocked, save] = useUnlocked()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const sessionId = params.get('session_id')
  const demo = params.get('demo')
  const packParam = params.get('pack')

  useEffect(() => {
    if (demo && !unlocked) {
      save({
        mode: 'demo',
        packId: packParam || 'all-access',
        at: new Date().toISOString(),
        code: DEMO_UNLOCK_CODE,
      })
    }
  }, [demo, packParam]) // eslint-disable-line

  const active = unlocked || (demo ? { mode: 'demo', packId: packParam || 'all-access' } : null)

  const downloads = useMemo(() => {
    if (!active) return []
    if (active.packId === 'all-access' || active.mode === 'all') {
      return PACKS.map((p) => ({ id: p.id, title: p.title, href: packZipPath(p.id) }))
    }
    const pack = PACKS.find((p) => p.id === active.packId)
    if (!pack) return []
    return [{ id: pack.id, title: pack.title, href: packZipPath(pack.id) }]
  }, [active])

  const tryCode = (e) => {
    e.preventDefault()
    if (code.trim().toUpperCase() === DEMO_UNLOCK_CODE) {
      save({ mode: 'demo', packId: 'all-access', at: new Date().toISOString(), code: DEMO_UNLOCK_CODE })
      setError('')
    } else {
      setError('Invalid code')
    }
  }

  return (
    <div className="ms-page">
      <h1>{active ? 'You’re in.' : 'Unlock your packs'}</h1>
      <p>
        {sessionId
          ? `Checkout session received: ${sessionId} (verify stub — Stripe gateway unavailable at build time).`
          : active
            ? 'Download your SitePack ZIP(s) below.'
            : 'Enter your unlock code after purchase, or use the demo code to test.'}
      </p>

      {!active && (
        <form className="ms-box" onSubmit={tryCode}>
          <label htmlFor="code">Unlock code</label>
          <input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SITEPACK-…" autoComplete="off" />
          {error && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</div>}
          <button className="ms-btn-block ms-btn-primary" type="submit">Unlock downloads</button>
          <p className="ms-note" style={{ marginTop: 12 }}>
            Demo unlock code: <code>{DEMO_UNLOCK_CODE}</code>
          </p>
        </form>
      )}

      {active && (
        <div className="ms-download-list">
          {downloads.map((d) => (
            <div className="ms-download-row" key={d.id}>
              <div>
                <strong>{d.title}</strong>
                <div style={{ color: 'var(--dim)', fontSize: 13 }}>{d.id}.zip</div>
              </div>
              {d.href ? (
                <a className="ms-btn-solid" href={d.href} download>Download</a>
              ) : (
                <span style={{ color: 'var(--dim)', fontSize: 13 }}>Hosted per-pack</span>
              )}
            </div>
          ))}
          <p className="ms-note">
            still-theory on release host is the lite pack. Full 406MB archive: /workspace/sitepack/packs/still-theory-studio.zip
          </p>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  return (
    <>
      <Nav onSearch={() => setSearchOpen(true)} />
      <Routes>
        <Route path="/" element={<Home selected={selected} setSelected={setSelected} />} />
        <Route path="/p/:slug" element={<PackPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/unlimited" element={<Pricing />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
      </Routes>
      <Footer />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={setSelected}
      />
      {selected && (
        <PackModal pack={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
