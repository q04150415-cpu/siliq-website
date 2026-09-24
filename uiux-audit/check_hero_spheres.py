"""Verify sphere rendering, controls, reduced motion and fallback behavior."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import threading
import os
import sys
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'uiux-audit/after'
live = '--live' in sys.argv
class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

os.chdir(ROOT)
server = None
if live:
    base = 'https://siliqtw.com/'
else:
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'
results = {'checks': [], 'errors': []}
def check(name, value):
    assert value, name
    results['checks'].append(name)
    print('PASS', name, flush=True)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width':1440,'height':1000})
        page.on('pageerror', lambda e: results['errors'].append(str(e)))
        page.goto(base, wait_until='domcontentloaded')
        page.wait_for_function("document.querySelectorAll('.sphere-ready').length === 2")
        check('Both sphere textures render', page.locator('.sphere-ready canvas').count() == 2)
        canvas = page.locator('.sphere-ready canvas').first
        snapshot = lambda: canvas.evaluate('(c)=>c.toDataURL()')
        before = snapshot()
        page.wait_for_timeout(700)
        check('Sphere rotation changes the image', snapshot() != before)
        page.locator('.sphere-toggle').click()
        before = snapshot()
        page.wait_for_timeout(400)
        check('Pause freezes the animation', snapshot() == before)
        anchor = page.locator('.hero-project').first
        anchor.focus()
        page.keyboard.press('ArrowRight')
        check('Keyboard rotates the sphere while paused', snapshot() != before)
        rect = canvas.bounding_box()
        before = snapshot()
        page.mouse.move(rect['x']+rect['width']*.4, rect['y']+rect['height']*.5)
        page.mouse.down()
        page.mouse.move(rect['x']+rect['width']*.65, rect['y']+rect['height']*.5, steps=8)
        page.mouse.up()
        check('Dragging rotates without navigating', snapshot() != before and '#portfolio' not in page.url)
        # Reset the orientation for representative screenshots.
        for width in [320,390,700,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':1000})
            page.emulate_media(reduced_motion='reduce')
            page.goto(base, wait_until='domcontentloaded')
            page.wait_for_function("document.querySelectorAll('.sphere-ready').length === 2")
            check(f'No overflow at {width}px', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
            check(f'Both circles remain square at {width}px', page.locator('.sphere-frame').evaluate_all('es => es.every(e => Math.abs(e.offsetWidth-e.offsetHeight) <= 1)'))
            if width in [390,1440]:
                page.locator('.hero').screenshot(path=str(OUT / f'{"production" if live else "local"}-spheres-{width}.png'))
        check('Reduced motion starts paused', page.locator('.sphere-toggle').get_attribute('aria-pressed') == 'true')
        canvas = page.locator('.sphere-ready canvas').first
        before = snapshot()
        page.wait_for_timeout(300)
        check('Reduced motion renders a still sphere', snapshot() == before)
        page.locator('.hero-project').first.click()
        check('Click still opens the work section', '#portfolio' in page.url)
        fallback = browser.new_page()
        fallback.add_init_script("HTMLCanvasElement.prototype.getContext = function() { return null; };")
        fallback.goto(base, wait_until='domcontentloaded')
        check('WebGL unavailable keeps both image previews', fallback.locator('.sphere-frame img:visible').count() == 2)
        check('WebGL unavailable hides animation controls', fallback.locator('.sphere-toggle').is_hidden())
        nojs = browser.new_page(java_script_enabled=False)
        nojs.goto(base, wait_until='domcontentloaded')
        check('No JavaScript retains both work links', nojs.locator('.hero-project:visible').count() == 2 and nojs.locator('.sphere-toggle').is_hidden())
        check('No JavaScript errors', not results['errors'])
        browser.close()
finally:
    if server:
        server.shutdown()
    (OUT / f'spheres-{"production" if live else "local"}-checks.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
