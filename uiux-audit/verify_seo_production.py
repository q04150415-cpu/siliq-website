"""Read-only inspection or verification of the SEO release."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = 'https://siliqtw.com'

def fetch(url):
    request = Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
    with urlopen(request, timeout=30) as response:
        return response.geturl(), response.status, response.read()

if '--inspect' in sys.argv:
    for route in ['/privacy.html', '/ip-checklist.html']:
        final, status, body = fetch(DOMAIN + route)
        print(json.dumps({'route': route, 'final': final, 'status': status}))
    sys.exit(0)

final, status, live_sitemap = fetch(DOMAIN + '/sitemap.xml')
assert live_sitemap == (ROOT / 'sitemap.xml').read_bytes(), 'Sitemap differs from release'
assert fetch(DOMAIN + '/robots.txt')[2] == (ROOT / 'robots.txt').read_bytes()
urls = [node.text for node in ET.fromstring(live_sitemap).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]

def verify(url):
    final, status, body = fetch(url)
    assert final == url, f'Sitemap redirects: {url} -> {final}'
    assert status == 200, url
    soup = BeautifulSoup(body, 'html.parser')
    assert soup.select_one('link[rel="canonical"]')['href'] == url, url
    assert 'siliq2378.com' not in body.decode('utf-8'), url
    for script in soup.select('script[type="application/ld+json"]'):
        json.loads(script.string)
    return {'url': url, 'status': status, 'canonical_matches': True}

with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(verify, urls))
for asset in ['/css/local-service.css', '/js/main.js', '/data/content.json']:
    assert fetch(DOMAIN + asset)[2] == (ROOT / asset.lstrip('/')).read_bytes(), asset
(ROOT / 'uiux-audit/after/seo-production-checks.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print('PASS: live sitemap, robots,', len(results), 'pages, canonical URLs, structured data and release assets')
