"""Read-only verification of the released site. Never submits contact forms."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import hashlib
import json
import urllib.request
import concurrent.futures

root = Path(__file__).resolve().parents[1]
base = 'https://siliqtw.com'
results = {'url': base, 'version': '7ccc70f9-1ddb-4e2a-8c2c-e8a9bd8ceaf3', 'assets': [], 'pages': [], 'errors': []}

def verify_asset(path):
    req = urllib.request.Request(base + '/' + path, headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
    response = urllib.request.urlopen(req, timeout=20)
    live = response.read()
    local = (root / path).read_bytes()
    if path == 'index.html':
        # Cloudflare inserts its analytics beacon after the main content.
        same = str(BeautifulSoup(live, 'html.parser').select_one('main')) == str(BeautifulSoup(local, 'html.parser').select_one('main'))
    else:
        same = hashlib.sha256(live).digest() == hashlib.sha256(local).digest()
    assert same, path + ' differs from local release'
    return {'path': path, 'status': response.status, 'matches_release': same}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results['assets'] = list(pool.map(verify_asset, ['index.html', 'css/refined.css', 'js/main.js', 'js/blog.js', 'data/content.json', 'blog/articles.json']))
print('Release assets verified:', len(results['assets']), flush=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.on('pageerror', lambda error: results['errors'].append(str(error)))
    for route in ['/', '/blog/', '/resources/', '/faq/']:
        response = page.goto(base + route, wait_until='domcontentloaded', timeout=30000)
        assert response.status == 200, (route, response.status)
        if route == '/':
            page.wait_for_function("document.documentElement.dataset.contentSource === 'json'")
            expected = json.loads((root / 'data/content.json').read_text(encoding='utf-8'))['hero']['titleAccent']
            assert page.locator('.hero-title-accent').inner_text() == expected
            assert page.locator('.portfolio-item:visible').count() == 3
            page.evaluate('() => Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))])')
            page.screenshot(path=str(root / 'uiux-audit/after/production-desktop.png'))
            page.set_viewport_size({'width': 390, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.screenshot(path=str(root / 'uiux-audit/after/production-mobile.png'))
            page.locator('#hamburger').click()
            page.wait_for_timeout(400)
            assert page.locator('#hamburger').get_attribute('aria-expanded') == 'true'
            assert abs(page.locator('#nav').bounding_box()['x']) < 1
            page.keyboard.press('Escape')
        elif route == '/blog/':
            page.wait_for_selector('.blog-card')
            assert page.locator('.blog-card').count() == 9
            page.locator('#blogSearch').fill('zzzz-no-result')
            assert page.locator('#clearSearch').is_visible()
        elif route == '/resources/':
            assert page.locator('.resource-card a[href$=".html"]').count() == 4
            page.locator('.resource-card a[href$=".html"]').first.click()
            page.wait_for_load_state('domcontentloaded')
            assert 'marketing-healthcheck' in page.url
        elif route == '/faq/':
            question = page.locator('.faq-question').first
            question.click()
            assert question.get_attribute('aria-expanded') == 'true'
        results['pages'].append({'route': route, 'status': response.status, 'passed': True})
        print('Live page passed:', route, flush=True)
    assert not results['errors'], results['errors']
    browser.close()
(root / 'uiux-audit/after/production-checks.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print('Production verification complete.', flush=True)
