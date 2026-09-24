"""Browser verification for fragments, actual audio output, muting and interruption."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import threading,os,json,sys
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'uiux-audit/after';os.chdir(ROOT)
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
live='--live' in sys.argv;server=None
if live:base='https://siliqtw.com/'
else:
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
result={'checks':[],'errors':[]}
def check(name,ok):
    assert ok,name
    result['checks'].append(name);print('PASS',name,flush=True)
instrument="""(() => {
    window.audioStarts=0;
    for(const type of [OscillatorNode,AudioBufferSourceNode]){const start=type.prototype.start;type.prototype.start=function(...a){window.audioStarts++;return start.apply(this,a)}}
    const connect=AudioNode.prototype.connect;
    AudioNode.prototype.connect=function(destination,...args){if(destination instanceof AudioDestinationNode){window.meter=this.context.createAnalyser();connect.call(this,window.meter)}return connect.call(this,destination,...args)};
    window.audioPeak=()=>{if(!window.meter)return 0;const a=new Float32Array(window.meter.fftSize);window.meter.getFloatTimeDomainData(a);return Math.max(...a.map(Math.abs))};
})();"""
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--autoplay-policy=document-user-activation-required'])
        page=browser.new_page(viewport={'width':1440,'height':1100});page.add_init_script(instrument)
        page.on('pageerror',lambda e:result['errors'].append(str(e)))
        page.goto(base,wait_until='domcontentloaded');page.wait_for_selector('.globe-assembling')
        check('Entry starts with real image fragments',page.locator('.globe-fragment').count()>30)
        check('First visit respects browser audio policy',page.locator('.hero-gallery-globe').get_attribute('data-sound')=='waiting' and page.evaluate('audioStarts')==0)
        check('Only 35 clients remain',page.locator('.globe-fallback img').count()==35)
        check('Requested clients removed',page.locator('.globe-fallback img').evaluate_all("es=>es.every(e=>!['夏美女','鴻鼎菓子','藍鯨區塊鏈','鱘龍谷'].includes(e.dataset.title))"))
        page.evaluate("document.querySelectorAll('.globe-fragment').forEach(e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=650}))")
        page.locator('.hero').screenshot(path=str(OUT/f'{"production" if live else "local"}-globe-fragments.png'))
        page.wait_for_function("document.querySelector('.hero-gallery-globe').dataset.intro==='complete'")
        check('Fragments clean up after assembly',page.locator('.globe-fragment').count()==0)
        page.locator('.globe-replay').click();page.wait_for_timeout(250)
        check('Replay enables audio after interaction',page.locator('.hero-gallery-globe').get_attribute('data-sound')=='on')
        check('Assembly schedules original sound layers',page.evaluate('audioStarts')>=5)
        peaks=[]
        for i in range(45):peaks.append(page.evaluate('audioPeak()'));page.wait_for_timeout(75)
        check('Assembly produces audible signal without clipping',max(peaks)>.0001 and max(peaks)<.95)
        page.locator('.globe-replay').click();page.wait_for_timeout(300)
        surface=page.locator('.portfolio-globe')
        r=surface.bounding_box();x=r['x']+r['width']*.4;y=r['y']+r['height']*.5
        before=page.evaluate('audioStarts');page.mouse.move(x,y);page.mouse.down()
        for i in range(1,12):page.mouse.move(x+i*8,y);page.wait_for_timeout(25)
        page.mouse.up()
        check('Dragging cancels intro immediately',page.locator('.globe-fragment').count()==0)
        check('Sliding produces sound',page.evaluate('audioStarts')>before)
        check('Sliding rate is bounded',page.evaluate('audioStarts')-before<8)
        page.locator('.globe-sound').click();page.wait_for_timeout(350)
        check('Mute silences audio output',page.evaluate('audioPeak()')<.00001)
        before=page.evaluate('audioStarts');page.locator('.globe-next').click()
        check('Muted interaction creates no sound',page.evaluate('audioStarts')==before)
        page.reload(wait_until='domcontentloaded');page.wait_for_selector('.globe-ready')
        check('Mute preference survives reload',page.locator('.hero-gallery-globe').get_attribute('data-sound')=='muted')
        page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100)
        check('Reduced motion skips and interrupts assembly',page.locator('.globe-fragment').count()==0 and page.locator('.globe-replay').is_hidden())
        mobile=browser.new_page(viewport={'width':390,'height':1200},is_mobile=True,has_touch=True)
        mobile.goto(base,wait_until='domcontentloaded');mobile.wait_for_selector('.globe-assembling')
        check('Mobile plays fragment entry',mobile.locator('.globe-fragment').count()>30)
        check('Fragments create no horizontal scrolling',mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        mobile.evaluate("document.querySelectorAll('.globe-fragment').forEach(e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=850}))")
        mobile.locator('.hero').screenshot(path=str(OUT/f'{"production" if live else "local"}-globe-fragments-mobile.png'))
        fallback=browser.new_page(reduced_motion='reduce');fallback.add_init_script('window.AudioContext=undefined;window.webkitAudioContext=undefined;')
        fallback.goto(base,wait_until='domcontentloaded');fallback.wait_for_selector('.globe-ready')
        check('No audio support keeps globe usable',fallback.locator('.globe-sound').is_hidden() and fallback.locator('.globe-next').is_visible())
        check('No JavaScript errors',not result['errors'])
        result['audio_peak']=max(peaks);browser.close()
finally:
    if server:server.shutdown()
    (OUT/f'globe-effects-{"production" if live else "local"}.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
