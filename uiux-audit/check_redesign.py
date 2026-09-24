"""Local browser checks. Does not submit forms or contact external services."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import threading
import json
import os
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'uiux-audit' / 'after'
OUT.mkdir(exist_ok=True)
os.chdir(ROOT)

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
results = {'viewports': [], 'checks': [], 'errors': []}

def check(name, condition):
    assert condition, name
    results['checks'].append(name)
    print('PASS', name, flush=True)

def visit(page, route=''):
    page.goto(base + '/' + route, wait_until='domcontentloaded')
    page.evaluate('() => Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1800))])')
    page.wait_for_timeout(200)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
        page.on('pageerror', lambda error: results['errors'].append(str(error)))
        visit(page)
        page.wait_for_function("document.documentElement.dataset.contentSource === 'json'")
        check('Homepage loads editable JSON content', True)
        check('Three featured projects visible', page.locator('.portfolio-item:visible').count() == 3)
        check('Six services preserved', page.locator('.service-card').count() == 6)
        check('Original theme colors preserved', page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()") == '#5b8a72')
        page.screenshot(path=str(OUT / 'desktop-home.png'))
        for work_width in [1440, 390]:
            page.set_viewport_size({'width': work_width, 'height': 1000})
            page.locator('#portfolio').scroll_into_view_if_needed()
            page.locator('#portfolio img').evaluate_all("images => images.forEach(i => i.loading = 'eager')")
            page.wait_for_function("Array.from(document.querySelectorAll('#portfolio img')).every(i => i.complete && i.naturalWidth > 0)")
            page.locator('#portfolio').screenshot(path=str(OUT / f'casework-{work_width}.png'))
            check(f'Work collection fits {work_width}px', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
            check(f'Portrait work stays inside its frame at {work_width}px', page.locator('.portfolio-item:visible .portfolio-image').evaluate_all('images => images.every(i => { const a = i.getBoundingClientRect(), b = i.closest(".portfolio-thumb").getBoundingClientRect(); return a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom; })'))
        page.set_viewport_size({'width': 1440, 'height': 1000})
        # Load lazy images for a representative complete-page capture.
        for y in range(0, page.locator('body').evaluate('(e)=>e.scrollHeight'), 800):
            page.evaluate("(y)=>window.scrollTo({top:y,behavior:'instant'})", y)
            page.wait_for_timeout(60)
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT / 'desktop-full.png'), full_page=True)
        page.locator('[data-filter="social"]').click()
        check('Social filter shows three cases', page.locator('.portfolio-item:visible').count() == 3)
        preview = page.locator('.portfolio-item:visible .portfolio-media-link').first
        preview.click()
        check('Image preview opens accessibly', page.locator('#lightbox').get_attribute('aria-hidden') == 'false')
        check('Modal starts with close-button focus', page.evaluate("document.activeElement.id") == 'lightboxClose')
        page.keyboard.press('Escape')
        check('Modal closes and restores focus', page.locator('#lightbox').get_attribute('aria-hidden') == 'true' and preview.evaluate('(e)=>e===document.activeElement'))
        page.locator('[data-filter="marketing"]').click()
        check('Marketing filter shows two cases', page.locator('.portfolio-item:visible').count() == 2)
        page.locator('[data-filter="video"]').click()
        check('All eight short-video cases reachable', page.locator('.portfolio-item:visible').count() == 8)
        page.locator('.logo').click()
        page.wait_for_timeout(700)
        check('Logo returns to top without selector error', page.evaluate('window.scrollY') < 5)
        page.locator('.service-cta').first.click()
        check('Service CTA preselects service', page.locator('#service').input_value() == 'video')
        page.locator('#name').fill('UI 測試')
        page.locator('#email').fill('test@example.com')
        page.locator('#message').fill('本機驗證，不寄出訊息。')
        page.evaluate("""() => {
            const original = HTMLAnchorElement.prototype.click;
            HTMLAnchorElement.prototype.click = function() {
                if (this.href.startsWith('mailto:')) { window.testDraft = this.href; return; }
                return original.call(this);
            };
        }""")
        page.locator('#contactForm button[type="submit"]').click()
        check('Contact prepares mail draft, never claims sent', 'mailto:' in page.evaluate('window.testDraft') and '確認並寄出' in page.locator('#contactStatus').inner_text())
        check('Contact retains entered data', page.locator('#message').input_value() == '本機驗證，不寄出訊息。')
        for width in [1440, 1024, 820, 768, 700, 390, 320]:
            page.set_viewport_size({'width': width, 'height': 844})
            page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
            page.wait_for_timeout(100)
            metrics = page.evaluate("""() => ({width: innerWidth, documentWidth: document.documentElement.scrollWidth,
                heroTextWidth: document.querySelector('.hero-title').scrollWidth,
                heroTextBox: document.querySelector('.hero-title').clientWidth})""")
            results['viewports'].append(metrics)
            check(f'No page or title overflow at {width}px', metrics['documentWidth'] <= width and metrics['heroTextWidth'] <= metrics['heroTextBox'] + 1)
        page.set_viewport_size({'width': 390, 'height': 844})
        page.locator('.logo').click()
        page.wait_for_timeout(700)
        page.screenshot(path=str(OUT / 'mobile-home.png'))
        page.locator('#hamburger').click()
        check('Mobile navigation opens', page.locator('#hamburger').get_attribute('aria-expanded') == 'true')
        page.wait_for_timeout(450)
        check('Mobile navigation is visible and receives focus', abs(page.locator('#nav').bounding_box()['x']) < 1 and page.locator('#nav a').first.evaluate('(e)=>e===document.activeElement'))
        page.screenshot(path=str(OUT / 'mobile-menu.png'))
        page.keyboard.press('Escape')
        check('Escape closes mobile navigation', page.locator('#hamburger').get_attribute('aria-expanded') == 'false')
        page.locator('[data-filter="featured"]').click()
        page.locator('#portfolio').scroll_into_view_if_needed()
        page.wait_for_timeout(350)
        page.screenshot(path=str(OUT / 'mobile-work.png'))
        for route in ['blog/', 'resources/', 'faq/', 'blog/brand-marketing-strategy/']:
            for width in [1440, 390]:
                page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
                visit(page, route)
                check(f'{route} fits {width}px', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
                if route == 'blog/':
                    page.wait_for_selector('.blog-card')
                page.screenshot(path=str(OUT / (route.strip('/').replace('/', '-') + f'-{width}.png')))
        visit(page, 'blog/')
        page.wait_for_selector('.blog-card')
        check('Blog initially displays nine articles', page.locator('.blog-card').count() == 9)
        page.locator('#blogMore').click()
        check('Blog load more displays eighteen articles', page.locator('.blog-card').count() == 18)
        page.locator('#blogSearch').fill('zzzz-no-result-test')
        check('Blog empty search state', page.locator('#clearSearch').is_visible())
        page.locator('#clearSearch').click()
        page.locator('.blog-filters [data-filter="短影音製作"]').click()
        check('Blog category filter', all(t == '短影音製作' for t in page.locator('.blog-card-tag').all_text_contents()))
        visit(page, 'resources/')
        check('Resources have four direct tool links', page.locator('.resource-card a[href$=".html"]').count() == 4)
        check('No nonfunctional lead gate', page.locator('#downloadModal').count() == 0)
        for link in page.locator('.resource-card a[href$=".html"]').all():
            response = page.request.get(urljoin(page.url, link.get_attribute('href')))
            check('Resource reachable: ' + link.get_attribute('href'), response.status == 200)
        visit(page, 'faq/')
        question = page.locator('.faq-question').first
        question.click()
        check('FAQ exposes expanded state', question.get_attribute('aria-expanded') == 'true')
        question.click()
        check('FAQ exposes collapsed state', question.get_attribute('aria-expanded') == 'false')
        # Failure states: local endpoints only, no real form requests.
        page.route('**/articles.json', lambda route: route.fulfill(status=503, body='unavailable'))
        visit(page, 'blog/')
        check('Blog failure offers retry', page.locator('#blogRetry').is_visible())
        page.unroute('**/articles.json')
        page.locator('#blogRetry').click()
        page.wait_for_selector('.blog-card')
        check('Blog retry recovers', page.locator('.blog-card').count() == 9)
        page.route('**/data/content.json', lambda route: route.fulfill(status=503, body='unavailable'))
        visit(page)
        check('Homepage readable when JSON fails', page.locator('.portfolio-item:visible').count() == 3 and page.locator('.service-card').count() == 6)
        check('No JavaScript page errors', not results['errors'])
        nojs = browser.new_page(java_script_enabled=False, viewport={'width': 390, 'height': 844})
        nojs.goto(base, wait_until='domcontentloaded')
        check('No-JS work and services remain readable', nojs.locator('.portfolio-item:visible').count() == 13 and nojs.locator('.service-card:visible').count() == 6)
        browser.close()
finally:
    server.shutdown()
    (OUT / 'checks.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Results:', OUT, flush=True)
