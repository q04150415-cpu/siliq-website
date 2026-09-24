"""Verify release files and work-gallery behavior on the official site."""
from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import json
import sys
import os
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://siliqtw.com/'
OUT = ROOT / 'uiux-audit/after'
local = '--local' in sys.argv
if local:
    class Handler(SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    os.chdir(ROOT)
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    BASE = f'http://127.0.0.1:{server.server_port}/'
expected = json.loads((ROOT / 'data/content.json').read_text(encoding='utf-8'))['portfolio'][0]
prefix = 'local' if local else 'production'

def check_asset(path):
    request = Request(BASE + path, headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
    with urlopen(request, timeout=30) as response:
        body = response.read()
        local = (ROOT / path).read_bytes()
        if path in ['index.html', 'services/taichung-social-media/index.html']:
            assert str(BeautifulSoup(body, 'html.parser').select_one('main')) == str(BeautifulSoup(local, 'html.parser').select_one('main'))
            if path == 'index.html':
                assert BeautifulSoup(body, 'html.parser').select_one('link[href*="casework.css"]')
        else:
            assert body == local, path
    return path

with ThreadPoolExecutor(4) as pool:
    assets = list(pool.map(check_asset, ['index.html', 'css/casework.css', 'js/main.js', 'sitemap.xml', 'data/content.json', 'services/taichung-social-media/index.html', expected['image']]))
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    for width in [1440, 390]:
        page.set_viewport_size({'width': width, 'height': 1000})
        page.goto(BASE, wait_until='domcontentloaded')
        page.wait_for_function("document.documentElement.dataset.contentSource === 'json'")
        assert page.locator('.portfolio-item:visible').count() == 3
        assert page.locator('.portfolio-item.is-lead:visible').count() == 1
        lead = page.locator('.portfolio-item.is-lead')
        assert lead.locator('h3').inner_text() == expected['title']
        assert lead.locator('.portfolio-media-link').get_attribute('href') == expected['video']
        if not expected.get('views'):
            assert lead.locator('.work-result').count() == 0
        assert page.locator('.portfolio-item .work-analysis').count() == 13
        for filter_name in ['featured', 'video', 'marketing', 'social']:
            page.locator(f'[data-filter="{filter_name}"]').click()
            visible = page.locator('.portfolio-item:visible')
            for article in visible.all():
                assert article.locator('.work-analysis dd').count() == 2
                assert article.locator('.work-analysis').is_visible()
                if width > 700:
                    media = article.locator('.portfolio-thumb').bounding_box()
                    analysis = article.locator('.work-analysis').bounding_box()
                    assert analysis['x'] >= media['x'] + media['width'], 'Analysis must sit beside the work'
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('[data-filter="featured"]').click()
        page.locator('#portfolio').scroll_into_view_if_needed()
        page.locator('#portfolio img').evaluate_all("images => images.forEach(i => i.loading = 'eager')")
        page.wait_for_function("Array.from(document.querySelectorAll('#portfolio img')).every(i => i.complete && i.naturalWidth > 0)")
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('#portfolio').screenshot(path=str(OUT / f'{prefix}-casework-{width}.png'))
        page.locator('[data-filter="social"]').click()
        assert page.locator('.portfolio-item:visible').count() == 3
        page.locator('.portfolio-item:visible .portfolio-media-link').first.click()
        assert page.locator('#lightbox').get_attribute('aria-hidden') == 'false'
        page.keyboard.press('Escape')
        assert page.locator('#lightbox').get_attribute('aria-hidden') == 'true'
    page.goto(BASE + 'services/taichung-social-media/', wait_until='domcontentloaded')
    service = page.locator('.local-work').first
    assert service.locator('h3').inner_text() == expected['title']
    assert service.locator('a').get_attribute('href') == expected['video']
    assert page.locator('.local-work .work-analysis dd').count() == 6
    for width in [1440, 390]:
        page.set_viewport_size({'width': width, 'height': 1000})
        page.locator('#work').scroll_into_view_if_needed()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.mouse.move(0, 0)
        page.locator('#work').screenshot(path=str(OUT / f'{prefix}-service-analysis-{width}.png'), style='.header, .skip-link { visibility: hidden !important; }')
    assert not errors, errors
    browser.close()
(OUT / f'casework-{prefix}-checks.json').write_text(json.dumps({'assets': assets, 'widths': [1440, 390], 'errors': errors, 'passed': True}, indent=2), encoding='utf-8')
print('PASS:', prefix, 'assets, desktop/mobile gallery, replacement case, service page, filters and image preview.')
if local:
    server.shutdown()
