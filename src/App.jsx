import { useMemo, useState, useEffect } from 'react'
import { Link, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PACKS, ALL_ACCESS, DEMO_UNLOCK_CODE, STRIPE_LINKS, packZipPath } from './packs'

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

function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          SitePack
        </Link>
        <nav className="nav-links">
          <a href="/#gallery">Gallery</a>
          <Link to="/pricing">All-Access</Link>
          <Link to="/success">Unlock</Link>
          <Link to="/pricing" className="nav-cta">Get All-Access — $149</Link>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer shell">
      <div>SitePack by 6Frame Studio · Source ZIPs for personal & client work</div>
      <div>No reselling packs as competing kits · ReadyBatch paused</div>
    </footer>
  )
}

function buyPack(packId, navigate) {
  const link = STRIPE_LINKS[packId]
  if (link) {
    window.location.href = link
    return
  }
  navigate(`/checkout?pack=${encodeURIComponent(packId)}`)
}

function PackCard({ pack, wide, onOpen }) {
  return (
    <article className={`card${wide ? ' wide' : ''}`} style={{ '--pack-accent': pack.accent }}>
      <div className="card-preview">
        <div className="card-preview-fallback">{pack.title}</div>
      </div>
      <div className="card-body">
        <span className="tag">{pack.category}</span>
        <h3>{pack.title}</h3>
        <p>{pack.tagline}</p>
        <div className="card-meta">
          <div className="price">${pack.price}<span>one-time</span></div>
          <div className="card-actions">
            <a className="btn btn-ghost" href={pack.demo} target="_blank" rel="noreferrer">Preview</a>
            <button className="btn btn-primary" type="button" onClick={() => onOpen(pack)}>Unlock</button>
          </div>
        </div>
      </div>
    </article>
  )
}

function PackModal({ pack, onClose }) {
  const navigate = useNavigate()
  if (!pack) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div className="modal-iframe-wrap">
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
            <iframe title={`${pack.title} preview`} src={pack.demo} loading="lazy" sandbox="allow-scripts allow-same-origin" />
          </div>
          <div className="modal-info">
            <span className="tag" style={{ '--pack-accent': pack.accent }}>{pack.category}</span>
            <h2>{pack.title}</h2>
            <p className="lead">{pack.tagline}</p>
            <div className="stack-note">
              <strong>Stack:</strong> {pack.stack}<br />
              <strong>Source:</strong> {pack.source}
            </div>
            <strong>What’s included</strong>
            <ul className="included">
              {pack.included.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div style={{ display: 'grid', gap: 10 }}>
              <button className="btn btn-primary btn-block" type="button" onClick={() => buyPack(pack.id, navigate)}>
                Buy — ${pack.price}
              </button>
              <a className="btn btn-ghost btn-block" href={pack.demo} target="_blank" rel="noreferrer">Open live demo</a>
              <Link className="btn btn-ghost btn-block" to={`/p/${pack.slug}`} onClick={onClose}>Open pack page</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Home() {
  const [selected, setSelected] = useState(null)
  return (
    <>
      <section className="hero shell">
        <div className="hero-kicker"><span>NEW</span> Motionsites-shaped UX · real source ZIPs, not prompts</div>
        <h1>Browse the demo.<br /><em>Unlock the code.</em></h1>
        <p className="hero-sub">
          SitePack sells downloadable website source for Bret’s live sites.
          Preview → buy once → download the ZIP. Remix for personal projects and client work.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#gallery">Browse packs</a>
          <Link className="btn btn-ghost" to="/pricing">All-Access $149 <s style={{ opacity: 0.5, marginLeft: 6 }}>$343</s></Link>
        </div>
      </section>

      <section className="shell" id="gallery">
        <div className="section-head">
          <h2>The gallery</h2>
          <p>7 sellable sites · $49 each</p>
        </div>
        <div className="grid">
          {PACKS.map((pack, i) => (
            <PackCard key={pack.id} pack={pack} wide={i < 2} onOpen={setSelected} />
          ))}
        </div>
      </section>

      <section className="shell faq">
        <h2>FAQ</h2>
        <details open>
          <summary>Can I use packs for client work?</summary>
          <p>Yes. Personal projects and client work are both OK. Rebrand before shipping.</p>
        </details>
        <details>
          <summary>Can I resell the pack?</summary>
          <p>No. Don’t redistribute or list the ZIP (or a near-identical kit) as a competing source pack or template product.</p>
        </details>
        <details>
          <summary>What’s different from Motionsites?</summary>
          <p>Motionsites sells AI prompts. SitePack sells actual website source ZIPs you can run and remix.</p>
        </details>
        <details>
          <summary>Secrets & keys?</summary>
          <p>Packs are sanitized — .env, private keys, and live Stripe/API secrets stripped or placeholdered. Drop in your own credentials.</p>
        </details>
      </section>

      {selected && <PackModal pack={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function PackPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const pack = PACKS.find((p) => p.slug === slug)
  if (!pack) {
    return (
      <div className="shell success">
        <h1>Pack not found</h1>
        <Link to="/">← Back to gallery</Link>
      </div>
    )
  }
  return (
    <div className="shell" style={{ paddingTop: 40 }}>
      <div className="modal" style={{ maxWidth: 980, margin: '0 auto' }}>
        <div className="modal-top">
          <div className="modal-iframe-wrap">
            <iframe title={pack.title} src={pack.demo} loading="lazy" sandbox="allow-scripts allow-same-origin" />
          </div>
          <div className="modal-info">
            <span className="tag" style={{ '--pack-accent': pack.accent }}>{pack.category}</span>
            <h2>{pack.title}</h2>
            <p className="lead">{pack.tagline}</p>
            <div className="stack-note">
              <strong>Stack:</strong> {pack.stack}<br />
              <strong>Source:</strong> {pack.source}
            </div>
            <ul className="included">
              {pack.included.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <button className="btn btn-primary btn-block" type="button" onClick={() => buyPack(pack.id, navigate)}>
              Buy — ${pack.price}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Pricing() {
  const navigate = useNavigate()
  return (
    <div className="shell">
      <div className="pricing-hero">
        <h1>All-Access</h1>
        <p style={{ color: 'var(--muted)', maxWidth: 480, margin: '0 auto' }}>
          Unlock every SitePack — all 7 sources — for one payment. Built for freelancers and studios who ship client sites weekly.
        </p>
      </div>
      <div className="pricing-card">
        <div className="tag" style={{ margin: '0 auto 12px' }}>Best value</div>
        <div className="big">${ALL_ACCESS.price}<span className="compare">${ALL_ACCESS.compareAt}</span></div>
        <p style={{ color: 'var(--muted)' }}>One-time · all 7 packs · personal + client OK</p>
        <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} type="button" onClick={() => buyPack('all-access', navigate)}>
          Unlock All-Access
        </button>
      </div>
      <div className="faq">
        <h2>License</h2>
        <details open>
          <summary>Personal & client work</summary>
          <p>Allowed. Build and customize for yourself or paying clients.</p>
        </details>
        <details>
          <summary>No competing resale</summary>
          <p>Don’t sell the packs themselves (or near-identical ZIPs) as a template/source marketplace product.</p>
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
    <div className="shell success">
      <h1>Checkout</h1>
      <p style={{ color: 'var(--muted)' }}>
        Stripe Payment Links are not wired yet (Stripe MCP gateway unavailable in this build).
        Use the demo unlock path so you can test downloads end-to-end.
      </p>
      <div className="unlock-box">
        <strong>{pack?.title || packId}</strong>
        <div style={{ color: 'var(--muted)', marginTop: 6 }}>
          ${pack?.price || '—'} one-time · when Stripe is live, Buy will open a Payment Link with success → /success?session_id=…
        </div>
        <button
          className="btn btn-primary btn-block"
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
      <p className="stub-note">
        Real path when Stripe recovers: Payment Link → /success?session_id=&#123;CHECKOUT_SESSION_ID&#125; → verify session → show downloads.
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
    <div className="shell success">
      <h1>{active ? 'You’re in.' : 'Unlock your packs'}</h1>
      <p style={{ color: 'var(--muted)' }}>
        {sessionId
          ? `Checkout session received: ${sessionId} (session verify stub — Stripe API gateway was unavailable at build time).`
          : active
            ? 'Download your SitePack ZIP(s) below.'
            : 'Enter your unlock code after purchase, or use the demo code to test.'}
      </p>

      {!active && (
        <form className="unlock-box" onSubmit={tryCode}>
          <label htmlFor="code">Unlock code</label>
          <input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SITEPACK-…" autoComplete="off" />
          {error && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</div>}
          <button className="btn btn-primary" type="submit">Unlock downloads</button>
          <p className="stub-note">Demo unlock code for Bret: <code>{DEMO_UNLOCK_CODE}</code></p>
        </form>
      )}

      {active && (
        <div className="download-list">
          {downloads.map((d) => (
            <div className="download-row" key={d.id}>
              <div>
                <strong>{d.title}</strong>
                <div style={{ color: 'var(--dim)', fontSize: 13 }}>{d.id}.zip</div>
              </div>
              {d.href ? (
                <a className="btn btn-primary" href={d.href} download>
                  Download
                </a>
              ) : (
                <span style={{ color: 'var(--dim)', fontSize: 13 }}>Hosted per-pack</span>
              )}
            </div>
          ))}
          <p className="stub-note">
            Note: still-theory on this host is the lite pack (film scrub MP4s omitted for deploy size).
            Full 406MB archive lives on the build box at /workspace/sitepack/packs/still-theory-studio.zip.
            All-Access serves all 7 hosted zips (not a single 454MB bundle on Vercel).
          </p>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/p/:slug" element={<PackPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
      </Routes>
      <Footer />
    </>
  )
}
