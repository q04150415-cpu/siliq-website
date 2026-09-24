from pathlib import Path
from bs4 import BeautifulSoup
from html import escape
import json
import re

root = Path(__file__).resolve().parents[1]
path = root / 'index.html'
html = path.read_text(encoding='utf-8')
soup = BeautifulSoup(html, 'html.parser')
cards = json.loads((root/'data/globe-clients.json').read_text(encoding='utf-8'))
images = ''.join(f'<img src="{escape(c["image"],quote=True)}" data-title="{escape(c["title"],quote=True)}" data-url="{escape(c["url"],quote=True)}" data-category="{escape(c["category"],quote=True)}" alt="" width="160" height="200" decoding="async">' for c in cards)
first = cards[0]
scene = f'''     <div class="hero-visual hero-gallery-globe" aria-label="互動作品集">
      <div class="globe-heading"><span>OUR WORK, IN MOTION</span><span class="globe-count">01 / {len(cards)}</span></div>
      <div class="portfolio-globe" role="group" tabindex="0" aria-label="作品集球體，可上下左右拖曳；方向鍵瀏覽作品" aria-describedby="globe-help">
       <div class="globe-fallback" aria-hidden="true">{images}</div>
      </div>
      <p class="globe-instruction" id="globe-help">拖曳球體，探索不同品牌的故事</p>
      <div class="globe-details">
       <div><span class="globe-category">{escape(first['category'])}</span><a class="globe-current" href="{escape(first['url'])}" target="_blank" rel="noopener">{escape(first['title'])}</a></div>
       <div class="globe-controls" hidden><button class="globe-previous" type="button" aria-label="上一個作品">←</button><button class="globe-next" type="button" aria-label="下一個作品">→</button></div>
      </div>
      <div class="globe-toolbar"><a href="#portfolio">查看完整案例與策略 ↗</a><div class="globe-options"><button class="globe-replay" type="button" hidden>重播聚合</button><button class="globe-sound" type="button" aria-pressed="false" hidden>開啟音效</button><button class="sphere-toggle" type="button" aria-pressed="false" hidden>暫停旋轉</button></div></div>
     </div>
    </div>
'''
start = html.index('     <div aria-label="SILIQ 球面作品展示"') if 'SILIQ 球面作品展示' in html else html.index('     <div class="hero-visual hero-gallery-globe"')
end = html.index('    <div class="container hero-bottom">', start)
html = html[:start]+scene+html[end:]
html = html.replace('css/hero-spheres.css?v=20260911', 'css/portfolio-globe.css?v=20260911').replace('js/hero-spheres.js?v=20260911','js/portfolio-globe.js?v=20260911')
html = re.sub(r'((?:css|js)/portfolio-globe\.(?:css|js))\?v=[^"\s]+',r'\1?v=20260911-2',html)
if 'js/globe-effects.js' not in html:
    html=html.replace('  <script src="js/portfolio-globe.js', '  <script src="js/globe-effects.js?v=20260911-2" defer></script>\n  <script src="js/portfolio-globe.js')
html=re.sub(r'js/globe-effects\.js\?v=[^"\s]+','js/globe-effects.js?v=20260911-3',html)
path.write_text(html,encoding='utf-8')
print('Built one sphere with',len(cards),'portfolio images.')
