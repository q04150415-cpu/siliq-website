"""Keep server-readable work cards identical to the live JSON renderer."""
from pathlib import Path
from bs4 import BeautifulSoup
import subprocess
import re
import json

ROOT = Path(__file__).resolve().parents[1]
script = r'''const fs = require('fs'), vm = require('vm');
const ctx = {URL, window: {matchMedia: () => ({matches: false})}, document: {baseURI:'https://siliqtw.com/', addEventListener: () => {}}};
vm.createContext(ctx); vm.runInContext(fs.readFileSync('js/main.js','utf8'), ctx);
const data = JSON.parse(fs.readFileSync('data/content.json','utf8'));
const selected = ['老娘教你很系列','低預算改裝系列','阿美上班不無聊'];
const featured = data.portfolio.filter(p=>selected.includes(p.title));
const ordered = [...featured,...data.portfolio.filter(p=>!featured.includes(p))];
process.stdout.write(ordered.map(p=>ctx.renderPortfolio(p,featured.includes(p))).join('\n'));
'''
cards = subprocess.check_output(['node', '-e', script], cwd=ROOT).decode('utf-8').replace('https://siliqtw.com/assets/', '/assets/')
soup = BeautifulSoup(cards, 'html.parser')
soup.select_one('article')['class'].append('is-lead')
path = ROOT / 'index.html'
html = path.read_text(encoding='utf-8')
start = html.index('     <div class="portfolio-grid">')
end = html.index('     <div class="portfolio-foot">', start)
html = html[:start] + '     <div class="portfolio-grid">\n' + str(soup) + '\n     </div>\n' + html[end:]
if 'css/casework.css' not in html:
    html = html.replace('</head>', '<link rel="stylesheet" href="css/casework.css?v=20260910-2">\n </head>')
html = re.sub(r'js/main\.js\?v=[\d-]+', 'js/main.js?v=20260910-5', html)
html = re.sub(r'css/casework\.css\?v=[\d-]+', 'css/casework.css?v=20260910-4', html)
path.write_text(html, encoding='utf-8')
# Keep the three service-page copies aligned with the same JSON and renderer.
data = json.loads((ROOT / 'data/content.json').read_text(encoding='utf-8'))
service_path = ROOT / 'services/taichung-social-media/index.html'
service_html = service_path.read_text(encoding='utf-8')
service_soup = BeautifulSoup(service_html, 'html.parser')
for article, item in zip(service_soup.select('.local-work'), data['portfolio'][:3]):
    original = str(article)
    analysis = article.select_one('.work-analysis')
    if analysis:
        analysis.decompose()
    # Extract the analysis generated for this case by the same JS renderer.
    case = next(a for a in soup.select('.portfolio-item') if a.select_one('h3').get_text(strip=True) == item['title'])
    article.append(BeautifulSoup(str(case.select_one('.work-analysis')), 'html.parser'))
    # Replace only the article, preserving the rest of the service document.
    pattern = re.compile(r'<article class="local-work">.*?</article>', re.S)
    matches = list(pattern.finditer(service_html))
    title = item['title']
    match = next(m for m in matches if f'<h3>{title}</h3>' in m.group())
    service_html = service_html[:match.start()] + str(article) + service_html[match.end():]
service_html = re.sub(r'css/local-service\.css\?v=[\d-]+', 'css/local-service.css?v=20260910-4', service_html)
if 'css/casework.css' not in service_html:
    service_html = service_html.replace('</head>', '<link rel="stylesheet" href="/css/casework.css?v=20260910-4">\n</head>')
service_path.write_text(service_html, encoding='utf-8')
print('Updated static work cards and three service-page analyses.')
