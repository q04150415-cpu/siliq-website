"""Verify old website paths permanently redirect to their new equivalents."""
from urllib.request import Request,build_opener,HTTPRedirectHandler
from urllib.parse import urlsplit
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse,json

parser=argparse.ArgumentParser()
parser.add_argument('--base',default='https://siliq.netlify.app')
args=parser.parse_args()
paths=['/','/blog/','/blog/brand-marketing-strategy/','/resources/index.html','/faq/','/robots.txt','/sitemap.xml','/?utm_source=legacy-check']
def inspect(path):
    hops=[]
    class Redirects(HTTPRedirectHandler):
        def redirect_request(self,req,fp,code,msg,headers,newurl):
            hops.append({'status':code,'from':req.full_url,'to':newurl})
            return super().redirect_request(req,fp,code,msg,headers,newurl)
    request=Request(args.base.rstrip('/')+path,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'})
    with build_opener(Redirects()).open(request,timeout=30) as response:
        body=response.read()
        assert response.status==200,(path,response.status)
        assert urlsplit(response.url).netloc=='siliqtw.com',(path,response.url)
        assert any(h['status']==301 and urlsplit(h['to']).netloc=='siliqtw.com' for h in hops),(path,hops)
        assert urlsplit(response.url).query==urlsplit(path).query,(path,response.url)
        if path=='/':assert b'hero-gallery-globe' in body
        return {'path':path,'hops':hops,'final':response.url,'status':response.status}
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(inspect,paths))
out=Path(__file__).resolve().parent/'after'/('legacy-redirect-live.json' if args.base=='https://siliq.netlify.app' else 'legacy-redirect-preview.json')
out.write_text(json.dumps(results,indent=2),encoding='utf-8')
print('PASS',len(results),'paths permanently redirect to siliqtw.com; article paths and query parameters preserved')
