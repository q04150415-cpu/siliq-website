"""Exercise one multi-client globe through mouse, touch, keyboard and fallbacks."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import threading, os, sys, json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'uiux-audit/after'
live='--live' in sys.argv
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
os.chdir(ROOT)
server=None
if live: base='https://siliqtw.com/'
else:
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/'
results={'checks':[],'errors':[]}
def check(name,ok):
    assert ok,name
    results['checks'].append(name)
    print('PASS',name,flush=True)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        page=browser.new_page(viewport={'width':1440,'height':1000})
        page.on('pageerror',lambda e:results['errors'].append(str(e)))
        page.goto(base,wait_until='domcontentloaded')
        page.wait_for_selector('.globe-ready canvas')
        page.wait_for_function("!document.querySelector('.globe-assembling')")
        scene=page.locator('.hero-gallery-globe')
        surface=page.locator('.portfolio-globe')
        canvas=surface.locator('canvas')
        snap=lambda:canvas.evaluate('(c)=>c.toDataURL()')
        selected=lambda:scene.get_attribute('data-selected')
        check('Exactly one sphere renders',canvas.count()==1 and page.locator('.hero-project').count()==0)
        total=int(scene.get_attribute('data-case-count'))
        check('Each client image loads',page.locator('.globe-fallback img').evaluate_all('es=>es.every(e=>e.complete&&e.naturalWidth>0)'))
        before=snap();page.wait_for_timeout(500)
        check('Auto rotation changes the image',snap()!=before)
        page.locator('.sphere-toggle').click();before=snap();page.wait_for_timeout(300)
        check('Pause freezes the image',snap()==before)
        names=set();links=set()
        for i in range(total):
            names.add(page.locator('.globe-current').inner_text())
            links.add(page.locator('.globe-current').get_attribute('href'))
            page.locator('.globe-next').click()
        check('All client names can be reached',len(names)==total)
        check('Every client has a work link',len(links)==total)
        surface.focus();page.keyboard.press('Home');before=selected();page.keyboard.press('ArrowLeft')
        check('Keyboard previous wraps to last',selected()==str(total-1))
        page.keyboard.press('Home');rect=surface.bounding_box();before=selected()
        x=rect['x']+rect['width']*.5;y=rect['y']+rect['height']*.5
        page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+rect['width']*.22,y,steps=10);page.mouse.up()
        check('Horizontal drag reveals another client',selected()!=before)
        before=selected()
        page.mouse.move(x,y);page.mouse.down();page.mouse.move(x,y+rect['height']*.3,steps=10);page.mouse.up()
        check('Vertical drag reveals another client',selected()!=before)
        check('Dragging stays on homepage',page.url.rstrip('/')==base.rstrip('/'))
        for width in [320,390,700,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':1100})
            page.emulate_media(reduced_motion='reduce')
            page.goto(base,wait_until='domcontentloaded');page.wait_for_selector('.globe-ready canvas')
            check(f'No overflow at {width}px',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
            check(f'Sphere stays circular at {width}px',surface.evaluate('e=>Math.abs(e.offsetWidth-e.offsetHeight)<=1'))
            if width in [390,1440]:page.locator('.hero').screenshot(path=str(OUT/f'{"production" if live else "local"}-globe-{width}.png'))
        check('Reduced motion starts paused',scene.get_attribute('data-motion')=='paused')
        before=snap();page.wait_for_timeout(300);check('Reduced motion remains still',snap()==before)
        mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
        mobile.goto(base,wait_until='domcontentloaded');mobile.wait_for_selector('.globe-ready')
        mobile.locator('.portfolio-globe').scroll_into_view_if_needed()
        r=mobile.locator('.portfolio-globe').bounding_box();x=r['x']+r['width']*.3;y=r['y']+r['height']*.5
        before=mobile.locator('.hero-gallery-globe').get_attribute('data-selected')
        cdp=mobile.context.new_cdp_session(mobile)
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        for i in range(1,9):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+i*9,'y':y}]})
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        check('Real touch gesture changes client',mobile.locator('.hero-gallery-globe').get_attribute('data-selected')!=before)
        fallback=browser.new_page()
        fallback.add_init_script("const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return t==='webgl'?null:original.call(this,t,...args)}")
        fallback.goto(base,wait_until='domcontentloaded')
        check('WebGL fallback keeps photos',fallback.locator('.globe-fallback img:visible').count()==total)
        check('WebGL fallback hides rotation',fallback.locator('.sphere-toggle').is_hidden())
        name=fallback.locator('.globe-current').inner_text();fallback.locator('.globe-next').click()
        check('Fallback still browses clients',fallback.locator('.globe-current').inner_text()!=name)
        nojs=browser.new_page(java_script_enabled=False)
        nojs.goto(base,wait_until='domcontentloaded')
        check('No-JS retains photos and work link',nojs.locator('.globe-fallback img:visible').count()==total and nojs.locator('.globe-current').is_visible())
        check('No-JS hides inactive controls',nojs.locator('.globe-controls').is_hidden() and nojs.locator('.sphere-toggle').is_hidden())
        check('No JavaScript errors',not results['errors'])
        browser.close()
finally:
    if server:server.shutdown()
    (OUT/f'globe-{"production" if live else "local"}-checks.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
