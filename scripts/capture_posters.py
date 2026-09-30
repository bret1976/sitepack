#!/usr/bin/env python3
"""Capture homepage screenshots for SitePack gallery posters."""
from __future__ import annotations

import asyncio
import json
import re
import time
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
PACKS_JS = ROOT / "src" / "packs.js"
OUT_DIR = ROOT / "public" / "posters"
REPORT = ROOT / "scripts" / "poster-capture-report.json"

CONCURRENCY = 5
VIEWPORT = {"width": 1280, "height": 900}
GOTO_TIMEOUT = 45000
WAIT_MS = 2500


def parse_packs(text: str) -> list[dict]:
    """Extract active packs with demo+slug from packs.js without executing JS."""
    packs = []
    # Split on object starts within PACKS array roughly
    for m in re.finditer(
        r"\{[^{}]*?id:\s*\"([^\"]+)\"[^{}]*?slug:\s*\"([^\"]+)\"[^{}]*?(?:demo:\s*\"([^\"]*)\")?[^{}]*?(?:comingSoon:\s*true)?[^{}]*?\}",
        text,
        re.S,
    ):
        blob = m.group(0)
        if "comingSoon: true" in blob or "comingSoon:true" in blob:
            continue
        demo_m = re.search(r'demo:\s*"([^"]+)"', blob)
        slug_m = re.search(r'slug:\s*"([^"]+)"', blob)
        if not demo_m or not slug_m:
            continue
        packs.append({"slug": slug_m.group(1), "demo": demo_m.group(1)})
    # Deduplicate by slug
    seen = set()
    out = []
    for p in packs:
        if p["slug"] in seen:
            continue
        seen.add(p["slug"])
        out.append(p)
    return out


async def capture_one(browser, pack: dict, sem: asyncio.Semaphore, results: list) -> None:
    async with sem:
        out = OUT_DIR / f"{pack['slug']}.jpg"
        started = time.time()
        context = await browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=1,
            ignore_https_errors=True,
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = await context.new_page()
        try:
            resp = await page.goto(pack["demo"], wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
            status = resp.status if resp else 0
            await page.wait_for_timeout(WAIT_MS)
            try:
                await page.wait_for_load_state("networkidle", timeout=8000)
            except Exception:
                pass
            await page.wait_for_timeout(800)
            await page.screenshot(path=str(out), type="jpeg", quality=78, full_page=False)
            size = out.stat().st_size
            row = {
                "slug": pack["slug"],
                "demo": pack["demo"],
                "ok": True,
                "status": status,
                "bytes": size,
                "ms": int((time.time() - started) * 1000),
                "out": f"/posters/{pack['slug']}.jpg",
            }
            results.append(row)
            print(f"OK  {pack['slug']:40s} {status}  {size/1024:6.0f}KB  {row['ms']}ms", flush=True)
        except Exception as e:
            row = {
                "slug": pack["slug"],
                "demo": pack["demo"],
                "ok": False,
                "error": str(e)[:240],
                "ms": int((time.time() - started) * 1000),
            }
            results.append(row)
            print(f"FAIL {pack['slug']:40s} {row['error']}", flush=True)
        finally:
            await context.close()


async def main() -> int:
    text = PACKS_JS.read_text()
    packs = parse_packs(text)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Capturing {len(packs)} posters → {OUT_DIR}", flush=True)
    results: list = []
    sem = asyncio.Semaphore(CONCURRENCY)
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel="chrome",
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        await asyncio.gather(*(capture_one(browser, pack, sem, results) for pack in packs))
        await browser.close()

    ok = [r for r in results if r.get("ok")]
    fail = [r for r in results if not r.get("ok")]
    report = {
        "capturedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total": len(packs),
        "ok": len(ok),
        "fail": len(fail),
        "results": sorted(results, key=lambda r: r["slug"]),
    }
    REPORT.write_text(json.dumps(report, indent=2))
    print(f"\nDone: {len(ok)}/{len(packs)} ok, {len(fail)} failed", flush=True)
    print(f"Report: {REPORT}", flush=True)
    return 0 if len(ok) >= len(packs) * 0.5 else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
