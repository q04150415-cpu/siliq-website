"""Stage public website assets only; no account credentials or workspace files."""
from pathlib import Path
from datetime import datetime
import shutil
import json
import argparse

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--label', choices=['seo', 'casework'], default='seo')
label = parser.parse_args().label
stage = ROOT / 'uiux-audit' / (label + '-release-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
stage.mkdir()
public = stage / 'public'
public.mkdir()
globe_images={Path(item['image']).name for item in json.loads((ROOT/'data/globe-clients.json').read_text(encoding='utf-8'))}
def public_ignore(directory,names):
    ignored=set(shutil.ignore_patterns('.*','__pycache__')(directory,names))
    if Path(directory).resolve()==(ROOT/'assets/globe').resolve():
        ignored.update(name for name in names if name not in globe_images)
    return ignored
for name in ['assets', 'blog', 'css', 'data', 'faq', 'js', 'resources', 'services']:
    shutil.copytree(ROOT / name, public / name, ignore=public_ignore)
for path in list(ROOT.glob('*.html')) + [ROOT / 'robots.txt', ROOT / 'sitemap.xml']:
    shutil.copy2(path, public / path.name)
config = {'name': 'siliq-website', 'compatibility_date': '2026-08-05', 'compatibility_flags': ['nodejs_compat'], 'assets': {'directory': './public', 'html_handling': 'auto-trailing-slash', 'not_found_handling': 'none'}}
(stage / 'wrangler.json').write_text(json.dumps(config, indent=2), encoding='utf-8')
manifest = {'stage': str(stage), 'config': str(stage / 'wrangler.json'), 'files': sorted(p.relative_to(public).as_posix() for p in public.rglob('*') if p.is_file())}
(ROOT / 'uiux-audit/after' / (label + '-release-manifest.json')).write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'config': manifest['config'], 'files': len(manifest['files'])}))
