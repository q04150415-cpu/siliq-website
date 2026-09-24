"""Inspect the public Instagram post without accessing a signed-in profile."""
from urllib.request import Request, urlopen
from pathlib import Path
from bs4 import BeautifulSoup
import json

OUT = Path(__file__).resolve().parent / 'after'
for suffix in ['', 'embed/']:
    url = 'https://www.instagram.com/p/DY69y4TSG6H/' + suffix
    try:
        request = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urlopen(request, timeout=25) as response:
            html = response.read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        result = {'url': url, 'title': soup.title.get_text() if soup.title else '',
                  'meta': {m.get('property', m.get('name')): m.get('content') for m in soup.select('meta[property^="og:"], meta[name="description"]')},
                  'caption': [e.get_text(' ', strip=True) for e in soup.select('.Caption, .Username')],
                  'images': [{'class': i.get('class'), 'alt': i.get('alt'), 'src': i.get('src')} for i in soup.select('img')]}
        (OUT / ('instagram-case-embed.html' if suffix else 'instagram-case.html')).write_text(html, encoding='utf-8')
        if not suffix and result['meta'].get('og:image'):
            image_request = Request(result['meta']['og:image'], headers={'User-Agent': 'Mozilla/5.0'})
            with urlopen(image_request, timeout=25) as image_response:
                image_bytes = image_response.read()
            target = OUT.parents[1] / 'assets/portfolio/16-zhudong-story.jpg'
            target.write_bytes(image_bytes)
            print('Downloaded public post cover:', target.name, len(image_bytes))
        print(json.dumps(result, ensure_ascii=True))
    except Exception as error:
        print(type(error).__name__, str(error))
