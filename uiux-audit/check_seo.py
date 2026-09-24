"""Check crawl targets, structured data, service links and responsive rendering."""
from pathlib import Path
from bs4 import BeautifulSoup
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse, unquote, urljoin
import xml.etree.ElementTree as ET
import json
import threading
import os

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'uiux-audit/after'
DOMAIN = 'https://siliqtw.com'
route = '/services/taichung-social-media/'
results = {'sitemap_pages': [], 'viewports': [], 'browser_errors': []}
urls = [node.text for node in ET.parse(ROOT / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls) == len(set(urls)), 'Duplicate sitemap entries'
for url in urls:
    parsed = urlparse(url)
    assert parsed.scheme == 'https' and parsed.netloc == 'siliqtw.com', url
    path = ROOT / parsed.path.lstrip('/')
    if path.is_dir():
        path /= 'index.html'
    elif not path.is_file():
        path = path.with_suffix('.html')
    assert path.is_file(), f'Missing sitemap target: {url}'
    html = path.read_text(encoding='utf-8')
    assert 'siliq2378.com' not in html, f'Old domain in {path}'
    soup = BeautifulSoup(html, 'html.parser')
    canonical = soup.select('link[rel="canonical"]')
    assert len(canonical) == 1 and canonical[0]['href'] == url, f'Canonical mismatch: {url}'
    assert soup.title and soup.title.get_text(strip=True), url
    robots = soup.select_one('meta[name="robots"]')
    assert not robots or 'noindex' not in robots.get('content', ''), url
    for script in soup.select('script[type="application/ld+json"]'):
        json.loads(script.string)
    for meta in soup.select('meta[property="og:url"]'):
        assert meta['content'] == url, f'OG URL mismatch: {url}'
    results['sitemap_pages'].append(parsed.path)
assert DOMAIN + route in urls
assert 'Sitemap: ' + DOMAIN + '/sitemap.xml' in (ROOT / 'robots.txt').read_text()
service = BeautifulSoup((ROOT / route.strip('/') / 'index.html').read_text(encoding='utf-8'), 'html.parser')
assert len(service.select('h1')) == 1
for element in service.select('[href], [src]'):
    value = element.get('href') or element.get('src')
    full = urlparse(urljoin(DOMAIN + route, value))
    if full.netloc != 'siliqtw.com' or full.scheme not in ['http', 'https']:
        continue
    path = ROOT / unquote(full.path).lstrip('/')
    if path.is_dir():
        path /= 'index.html'
    assert path.is_file(), f'Broken local link: {value}'
    if full.fragment:
        target = BeautifulSoup(path.read_text(encoding='utf-8'), 'html.parser')
        assert target.find(id=unquote(full.fragment)), f'Broken anchor: {value}'
home = BeautifulSoup((ROOT / 'index.html').read_text(encoding='utf-8'), 'html.parser')
assert home.select_one(f'a[href="{route}"]'), 'Missing crawlable homepage link'
print('PASS: sitemap, canonical, OG URLs and JSON-LD on', len(urls), 'pages; service links and anchors', flush=True)

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

os.chdir(ROOT)
server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on('pageerror', lambda e: results['browser_errors'].append(str(e)))
        response = page.goto(base + route, wait_until='networkidle')
        assert response.status == 200
        for width in [320, 390, 700, 768, 1024, 1440]:
            page.set_viewport_size({'width': width, 'height': 1000})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
            assert page.locator('h1').is_visible()
            assert page.evaluate("Array.from(document.images).every(i => i.loading === 'lazy' || i.complete && i.naturalWidth > 0)")
            results['viewports'].append(width)
            if width in [390, 1440]:
                page.screenshot(path=str(OUT / f'seo-service-{width}.png'), full_page=True)
        page.set_viewport_size({'width': 390, 'height': 844})
        page.locator('#hamburger').click()
        assert page.locator('#hamburger').get_attribute('aria-expanded') == 'true'
        page.keyboard.press('Escape')
        assert page.locator('#hamburger').get_attribute('aria-expanded') == 'false'
        page.locator('details summary').first.click()
        assert page.locator('details').first.get_attribute('open') is not None
        page.goto(base + '/')
        page.locator(f'#services a[href="{route}"]').click()
        assert page.url == base + route
        offline = browser.new_context(java_script_enabled=False)
        plain = offline.new_page()
        plain.goto(base + route)
        assert plain.locator('h1').is_visible() and plain.locator('.local-work').count() == 3
        plain.locator('details summary').first.click()
        assert plain.locator('details').first.get_attribute('open') is not None
        offline.close()
        assert not results['browser_errors'], results['browser_errors']
        browser.close()
    (OUT / 'seo-checks.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print('PASS: service at 6 widths, navigation, FAQ, homepage link and no-JavaScript content', flush=True)
finally:
    server.shutdown()
