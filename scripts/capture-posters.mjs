#!/usr/bin/env node
/**
 * Capture real homepage screenshots for SitePack gallery posters.
 * Writes JPEG posters to public/posters/<slug>.jpg and a JSON report.
 */
import { chromium } from 'playwright'
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'public', 'posters')
const reportPath = path.join(root, 'scripts', 'poster-capture-report.json')

const packsMod = await import(pathToFileURL(path.join(root, 'src', 'packs.js')).href)
const packs = packsMod.PACKS.filter((p) => p.demo && !p.comingSoon)

const CONCURRENCY = 4
const VIEWPORT = { width: 1280, height: 900 }
const TIMEOUT_MS = 45000
const WAIT_AFTER_LOAD_MS = 2500

fs.mkdirSync(outDir, { recursive: true })

const results = []

async function captureOne(browser, pack) {
  const out = path.join(outDir, `${pack.slug}.jpg`)
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()
  const started = Date.now()
  try {
    const resp = await page.goto(pack.demo, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_MS,
    })
    const status = resp ? resp.status() : 0
    // Soft wait for paint / fonts / hero
    await page.waitForTimeout(WAIT_AFTER_LOAD_MS)
    try {
      await page.waitForLoadState('networkidle', { timeout: 8000 })
    } catch {
      /* ok — many sites keep sockets open */
    }
    // Extra settle for motion sites
    await page.waitForTimeout(800)
    await page.screenshot({
      path: out,
      type: 'jpeg',
      quality: 78,
      fullPage: false,
    })
    const size = fs.statSync(out).size
    const row = {
      slug: pack.slug,
      demo: pack.demo,
      ok: true,
      status,
      bytes: size,
      ms: Date.now() - started,
      out: `/posters/${pack.slug}.jpg`,
    }
    results.push(row)
    console.log(`OK  ${pack.slug}  ${status}  ${(size / 1024).toFixed(0)}KB  ${row.ms}ms`)
    return row
  } catch (err) {
    const row = {
      slug: pack.slug,
      demo: pack.demo,
      ok: false,
      error: String(err.message || err).slice(0, 240),
      ms: Date.now() - started,
    }
    results.push(row)
    console.log(`FAIL ${pack.slug}  ${row.error}`)
    return row
  } finally {
    await context.close().catch(() => {})
  }
}

async function pool(items, limit, worker) {
  const q = [...items]
  const runners = Array.from({ length: limit }, async () => {
    while (q.length) {
      const item = q.shift()
      await worker(item)
    }
  })
  await Promise.all(runners)
}

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})

console.log(`Capturing ${packs.length} posters → ${outDir}`)
await pool(packs, CONCURRENCY, (pack) => captureOne(browser, pack))
await browser.close()

const ok = results.filter((r) => r.ok)
const fail = results.filter((r) => !r.ok)
const report = {
  capturedAt: new Date().toISOString(),
  total: packs.length,
  ok: ok.length,
  fail: fail.length,
  results: results.sort((a, b) => a.slug.localeCompare(b.slug)),
}
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
console.log(`\nDone: ${ok.length}/${packs.length} ok, ${fail.length} failed`)
console.log(`Report: ${reportPath}`)
process.exit(fail.length > packs.length / 2 ? 1 : 0)
