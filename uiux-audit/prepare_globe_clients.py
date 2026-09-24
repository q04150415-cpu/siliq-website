"""Publish only visually reviewed cover images from the supplied client folders."""
from pathlib import Path
from PIL import Image
import json

root=Path(__file__).resolve().parents[1]
audit=root/'uiux-audit/after'
previews=json.loads((audit/'drive-previews.json').read_text(encoding='utf-8'))
catalog=json.loads((audit/'drive-candidates.json').read_text(encoding='utf-8'))
# Contact sheets reviewed: omit empty/black frames, raw folders and a misfiled cover.
chosen=[24,14,53,2,4,0,6,8,10,12,16,18,21,22,26,28,30,32,34,36,38,40,42,44,45,47,49,52,55,58,59,60,62,64,66,68,71,73,75]
assets=root/'assets/globe';assets.mkdir(exist_ok=True)
display_names={
    '希希':'皮膚專科四寶媽希希醫師',
    '大瑪螺螄粉':'賣吃的小安(大瑪螺螄粉)',
    '什麼鳥人生':'SILIQ行銷-什麼鳥人生',
    '六爺':'企業命理風水六爺',
    '可魯':'素食很好吃',
    '周爺':'網紅IP周爺',
    '房仲':'房仲案例',
    '美閣':'美閣SPA',
    '孫老師算命':'老娘算你狠孫老師',
    '天櫻':'天櫻通訊',
    '野餐':'野餐派對',
    '詹姆士':'建材學霸詹姆士',
    '維格':'維格診所',
    '樂凱':'特膜電改里歐',
    '熱浪島':'熱浪小島-島主',
    '鋼鐵爸':'名人阮橋本鋼鐵爸',
    '靜靜':'美甲業主靜靜',
    'lexus賴俊宏':'LEXUS賴俊宏',
    'miru':'個人IP-Miru',
    'william':'工廠醫生',
}
items=[];provenance=[]
for number,index in enumerate(chosen,1):
    selected=previews[index]
    name=selected['client']
    if name in {'夏美女','鴻鼎菓子','藍鯨區塊鏈','鱘龍谷'}:
        continue
    siblings=next(c['candidates'] for c in catalog if c['name']==name)
    videos=[i for i in siblings if i['project']==selected['project'] and 'Video' in i['type']]
    stem=Path(selected['name']).stem.replace('-封面','').replace('_封面','')
    target=next((v for v in videos if Path(v['name']).stem==stem),videos[0] if videos else selected)
    path=f'assets/globe/client-{number:02d}.webp'
    with Image.open(selected['path']) as im:
        im.thumbnail((640,800))
        im.convert('RGB').save(root/path,'WEBP',quality=82,method=6)
    display_name=display_names.get(name,name)
    items.append({'title':display_name,'image':path,'url':'https://drive.google.com/file/d/'+target['id']+'/view','category':'品牌影像'})
    provenance.append({'title':display_name,'source_client':name,'cover':selected,'linked_file':target,'asset':path})
assert len({i['title'] for i in items})==len(items)
(root/'data/globe-clients.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(audit/'globe-sources.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared',len(items),'client covers;',sum((root/i['image']).stat().st_size for i in items),'bytes')
