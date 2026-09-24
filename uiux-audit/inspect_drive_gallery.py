"""Read public client folders without a signed-in Google account."""
from pathlib import Path
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup
import json
import sys
import re
from concurrent.futures import ThreadPoolExecutor

out = Path(__file__).resolve().parent / 'after'
if '--previews' in sys.argv:
    from PIL import Image, ImageOps, ImageDraw, ImageFont
    from io import BytesIO
    candidates=json.loads((out/'drive-candidates.json').read_text(encoding='utf-8'))
    previews=out/'drive-previews';previews.mkdir(exist_ok=True)
    jobs=[]
    for client in candidates:
        images=[i for i in client['candidates'] if 'Image' in i['type']]
        files=images or [i for i in client['candidates'] if 'Video' in i['type']]
        distinct=[]
        for item in files:
            if item['project'] not in [d['project'] for d in distinct]:distinct.append(item)
        for item in distinct[:2]:jobs.append({'client':client['name'],**item})
    def download(item):
        try:
            path=previews/(item['id']+'.jpg')
            if not path.exists():
                req=Request('https://drive.google.com/thumbnail?id='+item['id']+'&sz=w800',headers={'User-Agent':'Mozilla/5.0'})
                with urlopen(req,timeout=30) as response:raw=response.read()
                im=Image.open(BytesIO(raw)).convert('RGB');im.save(path,quality=90)
            with Image.open(path) as im:size=im.size
            return {**item,'path':str(path),'size':size}
        except Exception as e:return {**item,'error':str(e)}
    with ThreadPoolExecutor(max_workers=5) as pool:records=list(pool.map(download,jobs))
    (out/'drive-previews.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
    font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',14)
    for start in range(0,len(records),30):
        batch=records[start:start+30];sheet=Image.new('RGB',(1000,((len(batch)+5)//6)*240),'#f5f3ee');d=ImageDraw.Draw(sheet)
        for j,item in enumerate(batch):
            x=j%6*166;y=j//6*240
            if item.get('path'):
                with Image.open(item['path']) as im:
                    thumb=ImageOps.contain(im,(160,204));sheet.paste(thumb,(x+(160-thumb.width)//2,y))
            d.text((x+3,y+208),str(start+j)+' '+item['client'][:9],font=font,fill='#16332a')
        sheet.save(previews/f'sheet-{start//30}.jpg',quality=90)
    print('Downloaded',sum('path' in r for r in records),'of',len(records),'previews')
    sys.exit()

def listing(folder):
    cache = out / ('drive-folder-'+folder+'.html')
    if cache.exists():
        html = cache.read_text(encoding='utf-8')
    else:
        request = Request('https://drive.google.com/drive/folders/'+folder, headers={'User-Agent':'Mozilla/5.0'})
        with urlopen(request, timeout=30) as response:
            html = response.read().decode('utf-8')
        cache.write_text(html,encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    return [{'id':e['data-id'], 'name':e.get_text(strip=True), 'type':e.get('data-tooltip',''),
             'folder':'folder' in e.get('data-tooltip','').lower()}
            for e in soup.select('div[data-id][data-tooltip]')]

if '--candidates' in sys.argv:
    catalog=json.loads((out/'drive-catalog.json').read_text(encoding='utf-8'))
    def explore(client):
        try:
            safe=lambda i:not re.search(r'毛片|原始|素材|合約|報價|腳本|講稿|未完成',i['name'])
            media=lambda i:not i['folder'] and re.search(r'Image|Video',i['type'])
            entries=[i for i in client.get('items',[]) if safe(i)]
            candidates=[{**i,'project':client['name']} for i in entries if media(i)]
            folders=[i for i in entries if i['folder']]
            folders.sort(key=lambda i: -sum(k in i['name'] for k in ['形象','品牌','新品','照片','封面']))
            for folder in folders[:2]:
                children=[i for i in listing(folder['id']) if safe(i)]
                candidates.extend({**i,'project':folder['name']} for i in children if media(i))
                if not any(media(i) for i in children):
                    for sub in [i for i in children if i['folder']][:1]:
                        candidates.extend({**i,'project':folder['name']} for i in listing(sub['id']) if safe(i) and media(i))
            return {'name':client['name'],'id':client['id'],'candidates':candidates}
        except Exception as e: return {'name':client['name'],'error':str(e),'candidates':[]}
    with ThreadPoolExecutor(max_workers=5) as pool:
        candidates=list(pool.map(explore,catalog))
    (out/'drive-candidates.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Saved candidates:',len(candidates),'clients;',sum(bool(c['candidates']) for c in candidates),'with media')
    sys.exit()

if '--catalog' in sys.argv:
    clients=json.loads((out/'drive-clients.json').read_text(encoding='utf-8'))
    excluded={'1234','工作室日常','公司內部共用毛片區','平面設計','excel表格（仅限个人参考学习使用）'}
    def inspect(client):
        try: return {**client,'items':listing(client['id'])}
        except Exception as e: return {**client,'error':str(e)}
    with ThreadPoolExecutor(max_workers=5) as pool:
        catalog=list(pool.map(inspect,[c for c in clients if c['name'] not in excluded]))
    (out/'drive-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Saved catalog:',len(catalog),'clients')
    sys.exit()
folder = sys.argv[1] if len(sys.argv)>1 else '1RCGGEGIllMHVdIO_WBHeL-MSg4ak37jD'
url = 'https://drive.google.com/drive/folders/'+folder
request = Request(url, headers={'User-Agent':'Mozilla/5.0'})
with urlopen(request,timeout=30) as response:
    html = response.read().decode('utf-8')
    final = response.geturl()
(out / ('drive-folder-'+folder+'.html')).write_text(html,encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')
print(json.dumps({'url':final,'title':soup.title.get_text() if soup.title else '', 'text':soup.get_text(' ',strip=True)[:12000],
    'items':[{'tag':e.name,'id':e.get('data-id'),'name':e.get('data-tooltip') or e.get('aria-label'),'text':e.get_text(' ',strip=True)[:150]} for e in soup.select('[data-id]')]},ensure_ascii=True))
