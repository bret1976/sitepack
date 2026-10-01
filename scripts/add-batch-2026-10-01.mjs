#!/usr/bin/env node
/**
 * Package explicit URLs + Fable-25-ruby demos into SitePack ZIPs + JPEG posters.
 * Uses Vercel edge 76.76.21.21 (box default Vercel IPs fail TLS).
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFileSync, spawnSync } from 'child_process'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const buildRoot = path.join(root, '_packbuild')
const packsOut = path.join(root, 'public', 'packs')
const postersOut = path.join(root, 'public', 'posters')
const VERCEL_IP = '76.76.21.21'
const HOST = 'fable-25-ruby.vercel.app'

fs.mkdirSync(buildRoot, { recursive: true })
fs.mkdirSync(packsOut, { recursive: true })
fs.mkdirSync(postersOut, { recursive: true })

const LICENSE = `SitePack Source License (v1)

Copyright (c) 2026 Bret / 6Frame Studio

You may:
- Use this source for personal projects
- Use this source for client work (build/customize sites for paying clients)
- Modify, remix, and adapt the code and design

You may NOT:
- Resell, redistribute, or publish this pack (or a substantially identical pack)
  as a competing source-code product, template marketplace listing, or downloadable kit
- Share the raw ZIP with non-licensees
- Claim original authorship of the unmodified pack

No warranty. Provided as-is. Third-party fonts/assets retain their own licenses.
Demo/client branding in the pack is illustrative — replace before shipping client work.
`

const SITES = [
  ['01','aurora','Auroré','WebGL aurora shader · luxury fragrance','#7fffd4'],
  ['02','monolith','Monolith','Three.js refractive crystal · museum of one','#9fc4ff'],
  ['03','brut','BRUT*','Brutalist type · design collective','#ff2e00'],
  ['04','helvetia','Studio Helvetia','Swiss grid · International Style','#e30613'],
  ['05','verse','Verse','Kinetic typography · a poem you scroll','#e8a33d'],
  ['06','stellar','Stellar Cartography','1,400 living particles · invented constellations','#ffd9a0'],
  ['07','terminal','OBSOLETE.SYS','Working CRT terminal · museum of dead machines','#5cff8f'],
  ['08','ma','間 — Ma','Japanese negative space · four seasons','#b23a2f'],
  ['09','gatsby','The Meridian','Art Deco grand hotel · gilded SVG','#c9a24b'],
  ['10','bauhaus','Spielplatz','Bauhaus playground · draggable physics','#f2b705'],
  ['11','lumen','Lumen','Organic gradient blobs · soft SaaS','#e88a6a'],
  ['12','gazette','The Evening Gazette','1890s broadsheet · pure letterpress','#8a7a5c'],
  ['13','neon-district','Neon District','Cyberpunk glitch · techwear lookbook','#00f0ff'],
  ['14','storybook','The Snail Who Mailed Herself','Watercolor storybook · SVG illustration','#e8a3a3'],
  ['15','atelier','Atelier Grau','Monochrome architecture · layered parallax','#9b9b9b'],
  ['16','pulse','Pulse//Metropolis','Six living charts · data as ornament','#4ecdc4'],
  ['17','daydream','Daydream Plaza™','Vaporwave mall · open 3–4 a.m. only','#ff71ce'],
  ['18','radiola','Radiola 7','Skeuomorphic radio · real Web Audio synthesis','#ffb347'],
  ['19','odyssey','Odyssey','Solar system scrollytelling · canvas planets','#7fb4ff'],
  ['20','ascii','Glyphwerk','Real-time ASCII engine · 3D in characters','#7fdc6f'],
  ['21','herbarium','Herbarium Perdita','Engraved botany · plants that never were','#5d6b4a'],
  ['22','synth','Polyphon','Playable synthesizer · reactive visuals','#9d7bff'],
  ['23','flux','Flux','Seeded generative gallery · eight algorithms','#e2543e'],
  ['24','codex','Codex Luminis','Illuminated manuscript · gold leaf in CSS','#b8860b'],
  ['25','chrome','Chrome2000','Y2K liquid metal · per-pixel metaballs','#8ff0ff'],
]
const ENCORE = [
  ['26','axiom','Axiom','AI SaaS platform · cursor spotlight, pinned feature theater','#7c5cff'],
  ['27','chronos','Chronos Atelier','Haute horlogerie · scroll-assembled watch, horizontal rail','#d4b06a'],
  ['28','vanta','Vanta','Fintech infrastructure · Three.js particle Earth, live rails','#2ee6a8'],
  ['29','kine','KINE®','Motion studio · velocity-reactive type, cursor previews','#ff4d00'],
  ['30','ascent','Ascent Equipment','Expedition apparel · parallax range, altitude scrollytelling','#ff5a1f'],
]
const CINEMA = [
  ['31','orbital','Orbital','Space hotel · scroll-driven NASA film, statement type','#9db8ff'],
  ['32','eidolon','Eidolon','Dreamworld atelier · JWST worlds, glass reels','#c9b8ff'],
  ['33','ember','Ember Elite','Product theater · live 3D basketball, drag to spin','#ff4d12'],
  ['34','casa','Casa.','Architecture journal · Muralla Roja, sticky study','#b8302a'],
  ['35','nocturne','Nocturne','Night film house · full-screen scene wipes','#57e8e0'],
]

const EXPLICIT = [
  { slug: 'vence-jewelry', title: 'Vence Jewelry', demo: 'https://vence-jewelry.vercel.app/', accent: '#e8c39e', tagline: 'Vence jewelry brand landing' },
  { slug: 'hewn-six', title: 'HEWN SIX', demo: 'https://hewn-six.vercel.app/#home', accent: '#c4a574', tagline: 'HEWN SIX — distinct Hewn variant (re-added)' },
  { slug: 'lumora-omega', title: 'Lumora Omega', demo: 'https://lumora-omega-sooty.vercel.app/', accent: '#f9a8d4', tagline: 'Lumora Omega (sooty) brand landing' },
  { slug: 'penguin-inc', title: 'Penguin Inc', demo: 'https://penguin-inc.vercel.app/', accent: '#fb923c', tagline: 'Penguin Inc brand landing', refreshOnly: true },
  { slug: 'moment-path', title: 'Moment Path', demo: 'https://moment-path.vercel.app/', accent: '#fb7185', tagline: 'Moment Path 3D memory/time-capsule', refreshOnly: true },
]

function curl(url, host, outPath) {
  const args = ['-sL', '--fail', '--resolve', `${host}:443:${VERCEL_IP}`, '--max-time', '60', '-A', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '-o', outPath, url]
  const r = spawnSync('curl', args, { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`curl fail ${url}: ${r.stderr || r.status}`)
  return fs.statSync(outPath).size
}

function hostOf(url) {
  return new URL(url).host
}

function writeReadme({ slug, title, demo, sourceNote }) {
  return `# ${title} — SitePack

**Demo:** ${demo}
**Pack ID:** \`${slug}\`
**Source:** ${sourceNote}
**Stack notes:** Static HTML/CSS/JS capture

## What's included
- Full project source (sanitized — no live secrets)
- LICENSE.txt (personal + client work OK; no resale as competing packs)
- This README

## How to run
\`\`\`bash
open index.html  # or: npx serve .
\`\`\`

## Notes
- Replace any placeholder API keys / Firebase config with your own.
- Client/demo branding is illustrative — rebrand before shipping.
- Packaged for SitePack (sitepack). Motionsites-style browse → buy → unlock ZIP.
- Some remote CDN assets may still require network when viewing offline.
`
}

function zipDir(dir, zipPath) {
  const parent = path.dirname(dir)
  const base = path.basename(dir)
  fs.mkdirSync(path.dirname(zipPath), { recursive: true })
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
  execFileSync('zip', ['-r', '-q', zipPath, base], { cwd: parent })
  return fs.statSync(zipPath).size
}

function downloadLocalAssets(html, pageUrl, destDir, host) {
  const base = new URL(pageUrl)
  const urls = new Set()
  const re = /(?:src|href)=["']([^"']+)["']/gi
  let m
  while ((m = re.exec(html))) {
    const raw = m[1]
    if (!raw || raw.startsWith('#') || raw.startsWith('data:') || raw.startsWith('mailto:') || raw.startsWith('javascript:')) continue
    let abs
    try {
      abs = new URL(raw, pageUrl)
    } catch { continue }
    if (abs.host !== host && abs.host !== base.host) continue
    // same-host relative assets only
    if (abs.pathname === '/' || abs.pathname.endsWith('/')) continue
    if (/\.(html?)$/i.test(abs.pathname) && abs.pathname === base.pathname) continue
    urls.add(abs.href)
  }
  let n = 0
  for (const u of urls) {
    try {
      const p = new URL(u).pathname.replace(/^\//, '')
      if (!p || p.includes('..')) continue
      const out = path.join(destDir, p)
      fs.mkdirSync(path.dirname(out), { recursive: true })
      curl(u, host, out)
      n++
    } catch (e) {
      console.log('  asset skip', u, e.message.slice(0, 80))
    }
  }
  return n
}

function packageStatic({ slug, title, demo, sourceNote }) {
  const dir = path.join(buildRoot, slug)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const host = hostOf(demo)
  const cleanDemo = demo.split('#')[0]
  const indexPath = path.join(dir, 'index.html')
  const bytes = curl(cleanDemo.endsWith('/') ? cleanDemo : cleanDemo + (cleanDemo.match(/\/[^/]+\.[a-z]+$/i) ? '' : '/'), host, indexPath)
  let html = fs.readFileSync(indexPath, 'utf8')
  const assets = downloadLocalAssets(html, cleanDemo.endsWith('/') ? cleanDemo : cleanDemo + '/', dir, host)
  fs.writeFileSync(path.join(dir, 'SITEPACK_README.md'), writeReadme({ slug, title, demo: cleanDemo, sourceNote }))
  fs.writeFileSync(path.join(dir, 'LICENSE.txt'), LICENSE)
  const zipPath = path.join(packsOut, `${slug}.zip`)
  const zbytes = zipDir(dir, zipPath)
  return { slug, bytes, assets, zbytes, zipPath, ok: true }
}

const report = { packaged: [], posters: [], errors: [] }

// --- Package Fable demos (all linked: SITES + ENCORE + CINEMA) ---
const fableAll = [...SITES, ...ENCORE, ...CINEMA]
console.log(`Packaging ${fableAll.length} Fable demos…`)
for (const [no, slug, name, genre, accent] of fableAll) {
  const packSlug = `fable-${slug}`
  const demo = `https://${HOST}/${no}-${slug}/`
  try {
    const row = packageStatic({
      slug: packSlug,
      title: `Fable · ${name}`,
      demo,
      sourceNote: `static-capture from ${HOST}/${no}-${slug}/ (Fable × 25)`,
    })
    row.meta = { no, slug, name, genre, accent, demo, packSlug, category: Number(no) <= 25 ? 'collection' : Number(no) <= 30 ? 'encore' : 'cinema' }
    report.packaged.push(row)
    console.log(`OK  ${packSlug}  html=${row.bytes} assets=${row.assets} zip=${(row.zbytes/1024).toFixed(1)}KB`)
  } catch (e) {
    console.log(`FAIL ${packSlug}`, e.message.slice(0, 160))
    report.errors.push({ slug: packSlug, error: String(e.message).slice(0, 240) })
  }
}

// --- Explicit URLs ---
console.log(`\nPackaging explicit URLs…`)
for (const item of EXPLICIT) {
  try {
    const row = packageStatic({
      slug: item.slug,
      title: item.title,
      demo: item.demo,
      sourceNote: `static-capture (no public GitHub)`,
    })
    row.meta = { ...item, refreshOnly: !!item.refreshOnly }
    report.packaged.push(row)
    console.log(`OK  ${item.slug}  html=${row.bytes} assets=${row.assets} zip=${(row.zbytes/1024).toFixed(1)}KB`)
  } catch (e) {
    console.log(`FAIL ${item.slug}`, e.message.slice(0, 160))
    report.errors.push({ slug: item.slug, error: String(e.message).slice(0, 240) })
  }
}

// Save catalog fragment for packs.js merge
const catalogPath = path.join(root, 'scripts', 'new-packs-catalog.json')
const catalog = []
for (const [no, slug, name, genre, accent] of fableAll) {
  catalog.push({
    id: `fable-${slug}`,
    slug: `fable-${slug}`,
    title: `Fable · ${name}`,
    category: 'Creative',
    filters: ['Landing', 'Creative'],
    tagline: `${genre} (Fable × 25 #${no})`,
    demo: `https://${HOST}/${no}-${slug}/`,
    poster: `/posters/fable-${slug}.jpg`,
    price: 49,
    stack: 'Static HTML capture',
    source: 'static-capture (Fable × 25)',
    included: ['Sanitized source ZIP (no live secrets)', 'SITEPACK_README + LICENSE', 'Personal & client work OK'],
    accent,
    featured: Number(no) <= 5,
  })
}
for (const item of EXPLICIT.filter(x => !x.refreshOnly)) {
  catalog.push({
    id: item.slug,
    slug: item.slug,
    title: item.title,
    category: 'Landing',
    filters: ['Landing', 'Creative'],
    tagline: item.tagline,
    demo: item.demo.replace(/#.*$/, ''),
    poster: `/posters/${item.slug}.jpg`,
    price: 49,
    stack: 'Static HTML capture',
    source: 'static-capture (no public GitHub)',
    included: ['Sanitized source ZIP (no live secrets)', 'SITEPACK_README + LICENSE', 'Personal & client work OK'],
    accent: item.accent,
    featured: item.slug === 'hewn-six' || item.slug === 'vence-jewelry',
    tall: item.slug === 'hewn-six',
  })
}
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2))

// --- Posters via Playwright with host resolver ---
console.log(`\nCapturing posters…`)
const posterTargets = [
  ...fableAll.map(([no, slug, name, , accent]) => ({
    slug: `fable-${slug}`,
    demo: `https://${HOST}/${no}-${slug}/`,
  })),
  ...EXPLICIT.map((x) => ({ slug: x.slug, demo: x.demo.split('#')[0] })),
]

const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    `--host-resolver-rules=MAP *.vercel.app ${VERCEL_IP}`,
  ],
})

async function capturePoster(pack) {
  const out = path.join(postersOut, `${pack.slug}.jpg`)
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  })
  const page = await context.newPage()
  const started = Date.now()
  try {
    const resp = await page.goto(pack.demo, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(2200)
    try { await page.waitForLoadState('networkidle', { timeout: 6000 }) } catch {}
    await page.waitForTimeout(600)
    await page.screenshot({ path: out, type: 'jpeg', quality: 78, fullPage: false })
    const row = { slug: pack.slug, demo: pack.demo, ok: true, status: resp?.status(), bytes: fs.statSync(out).size, ms: Date.now() - started }
    report.posters.push(row)
    console.log(`POSTER OK  ${pack.slug}  ${(row.bytes/1024).toFixed(0)}KB`)
  } catch (e) {
    const row = { slug: pack.slug, demo: pack.demo, ok: false, error: String(e.message).slice(0, 200), ms: Date.now() - started }
    report.posters.push(row)
    console.log(`POSTER FAIL ${pack.slug}  ${row.error}`)
  } finally {
    await context.close().catch(() => {})
  }
}

// concurrency 3
const q = [...posterTargets]
const workers = Array.from({ length: 3 }, async () => {
  while (q.length) {
    const item = q.shift()
    await capturePoster(item)
  }
})
await Promise.all(workers)
await browser.close()

fs.writeFileSync(path.join(root, 'scripts', 'batch-2026-10-01-report.json'), JSON.stringify(report, null, 2))
console.log(`\nDone. packaged=${report.packaged.length} poster_ok=${report.posters.filter(p=>p.ok).length} errors=${report.errors.length}`)
console.log(`Catalog: ${catalogPath}`)
