"""Apply the reviewed domain consolidation and build the local service page."""
from pathlib import Path
from bs4 import BeautifulSoup
import json
import re
import xml.etree.ElementTree as ET
from html import escape

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = 'https://siliqtw.com'
ROUTE = '/services/taichung-social-media/'
pages = list(ROOT.glob('*.html'))
for folder in ['blog', 'faq', 'resources']:
    pages.extend((ROOT / folder).rglob('*.html'))
changed = []
for path in pages:
    if path.name == 'admin.html':
        continue
    original = path.read_text(encoding='utf-8')
    content = original.replace('http://siliq2378.com', DOMAIN).replace('siliq2378.com', 'siliqtw.com')
    route = '/' + path.relative_to(ROOT).as_posix()
    route = route.removesuffix('index.html').removesuffix('.html')
    content = re.sub(r'https://siliqtw\.com/([^"\s<>]*?)\.html', lambda m: DOMAIN + '/' + m[1].removesuffix('/index'), content)
    if not BeautifulSoup(content, 'html.parser').select_one('link[rel="canonical"]'):
        content = content.replace('</head>', f'  <link rel="canonical" href="{DOMAIN}{route}">\n</head>', 1)
    if path == ROOT / 'index.html':
        content = content.replace('SILIQ 行銷 | 希利克鳥有限公司 - 品牌行銷的領航者', '台中自媒體公司｜短影音製作・社群經營｜SILIQ 行銷')
        content = content.replace('SILIQ行銷（希利克鳥有限公司）提供短影音製作、品牌行銷策略、社群經營、廣告投放、平面設計、商業模式顧問等全方位行銷服務。擁有自研行銷系統，為品牌打造高效精準的行銷方案。', 'SILIQ 行銷（希利克鳥有限公司）位於台中，提供自媒體內容企劃、短影音製作、社群經營與品牌策略。查看實際作品與合作流程，透過 LINE 討論你的品牌需求。')
        content = content.replace('"@type": "ProfessionalService",', '"@type": "ProfessionalService",\n        "@id": "https://siliqtw.com/#organization",', 1) if '"@id": "https://siliqtw.com/#organization"' not in content else content
        # Repair a pre-existing invalid closing tag in the document head.
        content = content.replace('  </meta>\n', '')
        content = re.sub(r'(?:從台中出發，)*整合策略、內容與傳播，找到適合你品牌的成長方式。', '從台中出發，整合策略、內容與傳播，找到適合你品牌的成長方式。', content)
        if f'href="{ROUTE}"' not in content:
            marker = '     <div class="services-grid">'
            content = content.replace(marker, f'     <p style="text-align:center; margin-bottom:32px"><a class="text-link" href="{ROUTE}">了解台中自媒體經營服務 <span aria-hidden="true">↗</span></a></p>\n' + marker, 1)
            content = content.replace('       短影音製作\n      </a>', '       短影音製作\n      </a>\n      <a href="' + ROUTE + '">台中自媒體經營</a>', 1)
    if content != original:
        path.write_text(content, encoding='utf-8')
        changed.append(path.relative_to(ROOT).as_posix())

home = BeautifulSoup((ROOT / 'index.html').read_text(encoding='utf-8'), 'html.parser')
header = home.select_one('header')
footer = home.select_one('footer')
for part in [header, footer]:
    for el in part.select('[href], [src]'):
        for attr in ['href', 'src']:
            value = el.get(attr)
            if value and not value.startswith(('https:', 'http:', 'mailto:', '/', 'tel:')):
                el[attr] = '/' + value
title = '台中自媒體經營公司｜短影音製作與品牌內容｜SILIQ 行銷'
description = 'SILIQ 行銷位於台中，整合品牌定位、自媒體內容企劃、短影音製作與社群經營。了解服務內容、實際作品、合作流程與諮詢前準備事項，找到適合品牌的內容方向。'
schema = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'Service', '@id': DOMAIN + ROUTE + '#service', 'name': '自媒體經營與短影音製作', 'url': DOMAIN + ROUTE, 'description': description, 'serviceType': ['自媒體內容企劃', '短影音製作', '社群經營', '品牌策略'], 'provider': {'@type': 'Organization', '@id': DOMAIN + '/#organization', 'name': 'SILIQ 行銷', 'url': DOMAIN + '/'}},
    {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': '首頁', 'item': DOMAIN + '/'}, {'@type': 'ListItem', 'position': 2, 'name': '台中自媒體經營', 'item': DOMAIN + ROUTE}]}
]}
data = json.loads((ROOT / 'data/content.json').read_text(encoding='utf-8'))
def work_analysis(item):
    strategy = item.get('strategy', {})
    if not strategy.get('intent') or not strategy.get('trust'):
        return ''
    return f'<dl class="work-analysis"><div><dt>設計思路</dt><dd>{escape(strategy["intent"])}</dd></div><div><dt>信任價值</dt><dd>{escape(strategy["trust"])}</dd></div></dl>'

works = '\n'.join(f'''<article class="local-work"><a href="{p['video']}" target="_blank" rel="noopener"><img src="/{p['image']}" alt="{p['title']}短影音作品" width="360" height="640" loading="lazy"><div><span class="eyebrow">{p['categoryName']}</span><h3>{p['title']}</h3><p>{p['desc']}</p><span class="text-link">觀看作品 ↗</span></div></a>{work_analysis(p)}</article>''' for p in data['portfolio'][:3])
page = f'''<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{DOMAIN}{ROUTE}">
<meta property="og:type" content="website">
<meta property="og:locale" content="zh_TW">
<meta property="og:site_name" content="SILIQ 行銷">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{DOMAIN}{ROUTE}">
<meta property="og:image" content="{DOMAIN}/assets/logo.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{DOMAIN}/assets/logo.png">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False, indent=2)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&amp;family=Montserrat:wght@400;600;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css?v=20260909">
<link rel="stylesheet" href="/css/refined.css?v=20260909">
<link rel="stylesheet" href="/css/local-service.css?v=20260910-4">
<link rel="stylesheet" href="/css/casework.css?v=20260910-4">
</head>
<body class="local-service-page">
{header}
<main id="main-content">
<section class="local-hero"><div class="container">
<nav class="local-breadcrumb" aria-label="麵包屑"><a href="/">首頁</a><span aria-hidden="true">／</span><span aria-current="page">台中自媒體經營</span></nav>
<div class="local-hero-grid"><div>
<p class="eyebrow">SILIQ · CONTENT &amp; STRATEGY</p>
<h1>台中自媒體經營，<br><span>把專業變成<br>值得關注的內容。</span></h1>
<p class="local-lead">SILIQ 行銷是位於台中的品牌行銷公司，提供自媒體內容企劃、短影音製作、社群經營與品牌策略。從你想對誰說話開始，一起找到能持續累積的內容方向。</p>
<div class="local-actions"><a class="btn btn-primary" href="https://line.me/R/ti/p/@311imzhl" target="_blank" rel="noopener">LINE 討論自媒體需求 ↗</a><a class="text-link" href="#work">先看實際作品 ↓</a></div>
</div><figure class="local-hero-photo"><img src="/assets/portfolio/03-building.jpg" alt="摩瑪建材研究所短影音作品畫面" width="360" height="640" fetchpriority="high"><figcaption>讓產品與專業，有更容易被理解的表達方式。<br><span>摩瑪建材研究所 · 短影音作品</span></figcaption></figure></div>
</div></section>
<section class="local-section"><div class="container local-split"><div><p class="eyebrow">START WITH YOUR BRAND</p><h2>你有專業，<br>我們一起找到說法。</h2></div><div><p class="local-lead">找自媒體公司之前，先想清楚這次最想改善什麼。不同階段的品牌，需要的內容與協助也不同。</p><ul class="local-list"><li><strong>剛開始經營：</strong>有產品或專業，想梳理品牌定位、受眾與內容主題。</li><li><strong>已經持續發文：</strong>想讓短影音、圖文與品牌訊息更一致。</li><li><strong>需要製作支援：</strong>希望整合企劃、拍攝與剪輯，讓內容製作更有方向。</li></ul></div></div></section>
<section class="local-section local-tint" id="scope"><div class="container"><p class="eyebrow">WHAT WE DO</p><h2>從內容方向，到實際製作。</h2><div class="local-service-grid">
<article><span class="local-number">01</span><h3>品牌定位與內容企劃</h3><p>梳理品牌特色、目標受眾與溝通重點，規劃適合自媒體經營的內容主題。</p></article>
<article><span class="local-number">02</span><h3>短影音製作</h3><p>從腳本發想、拍攝到剪輯，將產品、服務或專業知識轉化為影像內容。</p></article>
<article><span class="local-number">03</span><h3>社群經營與素材</h3><p>整合社群內容規劃、圖文素材與互動管理，建立一致的品牌表達。</p></article>
<article><span class="local-number">04</span><h3>廣告與品牌策略</h3><p>依品牌目標討論 Meta、Google 廣告及行銷策略需求，搭配內容規劃推廣方向。</p></article>
</div><p class="local-note">實際交付項目、平台、數量與執行範圍，依需求討論後確認。</p></div></section>
<section class="local-section" id="work"><div class="container"><p class="eyebrow">SELECTED WORK</p><div class="local-heading"><h2>不同產業，都有值得說的故事。</h2><a class="text-link" href="/#portfolio">查看全部作品 ↗</a></div><div class="local-work-grid">{works}</div></div></section>
<section class="local-section local-tint"><div class="container local-split"><div><p class="eyebrow">HOW WE WORK</p><h2>先對齊目標，<br>再開始創作。</h2><p>團隊位於台中市潭子區。拍攝地點、遠端溝通與跨區合作方式，可在需求討論時一併確認。</p></div><ol class="local-steps"><li><h3>聊聊品牌與需求</h3><p>分享目前的社群帳號、產品服務、目標客群與想改善的問題。</p></li><li><h3>確認方向與合作內容</h3><p>討論內容形式、製作項目、預算與時程，再確認合作範圍。</p></li><li><h3>製作、確認與後續調整</h3><p>依確認的企劃執行內容，對齊素材與回饋，再討論後續經營方向。</p></li></ol></div></section>
<section class="local-section"><div class="container local-split"><div><p class="eyebrow">BEFORE WE TALK</p><h2>諮詢前，<br>可以先準備這些。</h2><p>不需要準備完整企劃，有現有資料就能開始討論。</p></div><ul class="local-list"><li>品牌名稱、官網或現有社群帳號。</li><li>主要產品／服務，以及最想接觸的客群。</li><li>這次希望改善的問題與喜歡的內容範例。</li><li>可配合的拍攝地點、人員、預計時程與預算範圍。</li></ul></div></section>
<section class="local-section local-tint" id="questions"><div class="container local-faq"><p class="eyebrow">COMMON QUESTIONS</p><h2>合作前，你可能想知道。</h2>
<details><summary>自媒體經營與單支短影音製作有什麼不同？</summary><p>單支影片著重一次內容的企劃與製作；自媒體經營還需要考慮品牌定位、主題安排、社群內容與持續調整。可依你目前的階段，討論單次製作或較完整的合作需求。</p></details>
<details><summary>短影音與社群經營怎麼報價？</summary><p>請先提供需求、預計數量、內容形式、拍攝條件與時程，透過 LINE 討論適合的合作範圍與報價。實際費用與交付內容以雙方確認的方案為準。</p></details>
<details><summary>我不在台中，也可以先諮詢嗎？</summary><p>可以先透過 LINE 分享品牌與需求，再確認是否適合合作，以及溝通方式、拍攝地點與交通安排。</p></details>
<details><summary>有可以先看的作品嗎？</summary><p>本頁整理故事型自媒體、醫美與建材的短影音作品，也可以到<a href="/#portfolio">首頁精選作品</a>查看其他產業與社群經營素材。</p></details>
</div></section>
<section class="local-section local-contact"><div class="container"><p class="eyebrow">LET’S TALK</p><h2>從你的品牌故事開始。</h2><p>傳給我們品牌名稱、社群帳號與目前的需求，一起討論下一步。</p><a class="btn btn-primary" href="https://line.me/R/ti/p/@311imzhl" target="_blank" rel="noopener">LINE 聊聊你的品牌 ↗</a><p class="local-note">SILIQ 行銷 · 希利克鳥有限公司 · 台中市潭子區<br><a href="mailto:siliq369.service@gmail.com">siliq369.service@gmail.com</a></p></div></section>
</main>
{footer}
<script src="/js/main.js?v=20260909" defer></script>
</body></html>
'''
target = ROOT / ROUTE.strip('/') / 'index.html'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(page, encoding='utf-8')

robots = ROOT / 'robots.txt'
robots.write_text(robots.read_text(encoding='utf-8').replace('https://siliq2378.com', DOMAIN), encoding='utf-8')
ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
ET.register_namespace('', ns)
tree = ET.parse(ROOT / 'sitemap.xml')
urlset = tree.getroot()
known = set()
for url in list(urlset):
    loc = url.find(f'{{{ns}}}loc')
    loc.text = loc.text.replace('https://siliq2378.com', DOMAIN).removesuffix('.html')
    local = ROOT / loc.text.removeprefix(DOMAIN).lstrip('/')
    if local.is_dir():
        local /= 'index.html'
    elif not local.is_file():
        local = local.with_suffix('.html')
    soup = BeautifulSoup(local.read_text(encoding='utf-8'), 'html.parser')
    if any('noindex' in meta.get('content', '') for meta in soup.select('meta[name="robots"]')):
        urlset.remove(url)
        continue
    known.add(loc.text)
    if loc.text in [DOMAIN + p for p in ['/', '/faq/', '/resources/', '/blog/']]:
        url.find(f'{{{ns}}}lastmod').text = '2026-09-10'
for path in pages + [target]:
    if path.name == 'admin.html':
        continue
    soup = BeautifulSoup(path.read_text(encoding='utf-8'), 'html.parser')
    if any('noindex' in meta.get('content', '') for meta in soup.select('meta[name="robots"]')):
        continue
    route = '/' + path.relative_to(ROOT).as_posix().removesuffix('index.html').removesuffix('.html')
    if DOMAIN + route not in known:
        url = ET.SubElement(urlset, f'{{{ns}}}url')
        ET.SubElement(url, f'{{{ns}}}loc').text = DOMAIN + route
        if path == target:
            ET.SubElement(url, f'{{{ns}}}lastmod').text = '2026-09-10'
        known.add(DOMAIN + route)
ET.indent(tree, space='  ')
tree.write(ROOT / 'sitemap.xml', encoding='UTF-8', xml_declaration=True)
print(json.dumps({'updated_existing_pages': len(changed), 'sitemap_urls': len(known), 'new_service_page': ROUTE}, ensure_ascii=False))
