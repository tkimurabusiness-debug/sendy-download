"""ローカルで検証した描画資産だけをGitHub Pagesの配置先へ書き出す。"""
import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path
from urllib.parse import parse_qsl, unquote, urlsplit
from bs4 import BeautifulSoup

parser = argparse.ArgumentParser()
parser.add_argument('--reference', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[1]
source = args.reference.resolve()
runtime = source.parent / 'sendy-faithful/runtime'
supplement = source.parent / 'reference-supplement'
output = args.output.resolve()
BASE = '/sendy-download'
PREFIXES = ('/assets/', '/fonts/', '/images/', '/video/', '/sendy-media/', '/css/', '/js/', '/_next/')


def localize(value):
    # SVGのnamespaceや正規表現には触れない。画像最適化APIは静的ファイルへ。
    if value.startswith('/_next/image?'):
        value = dict(parse_qsl(urlsplit(value).query))['url']
    if value.startswith(PREFIXES) or value in ['/noise-light.png', '/ai.html', '/llms.txt', '/privacy.html', '/terms.html']:
        return BASE + value
    return re.sub(r"url\((['\"]?)(/(?:fonts|images|assets|sendy-media)/[^)]+|/noise-light\.png)", lambda m: 'url(' + m[1] + BASE + m[2], value)


# StringLiteralだけを解析し、JSのUTF-16位置で安全に差し替える。
transform = r"""
const fs=require('fs'),parser=require(process.argv[1]);
let s=fs.readFileSync(process.argv[2],'utf8');
const base='/sendy-download',ast=parser.parse(s,{sourceType:'unambiguous',tokens:true});
const changes=[];
function walk(n) {
 if(!n||typeof n!=='object')return;
 if(n.type==='StringLiteral'){
  let v=n.value;
  if(v.startsWith('/_next/image?'))v=new URLSearchParams(v.split('?')[1]).get('url');
  if(/^\/(assets|fonts|images|video|sendy-media|css|js)\//.test(v)||['/noise-light.png','/ai.html','/llms.txt','/privacy.html','/terms.html'].includes(v))v=base+v;
  v=v.replace(/url\((['"]?)(\/(?:fonts|images|assets|sendy-media)\/[^)]+|\/noise-light\.png)/g,(_,q,p)=>'url('+q+base+p);
  if(v!==n.value)changes.push([n.start,n.end,JSON.stringify(v)]);
 }
 for(const [k,v]of Object.entries(n))if(!['loc','tokens','comments'].includes(k)) {if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
}
walk(ast.program);
for(const [a,b,v]of changes.sort((a,b)=>b[0]-a[0]))s=s.slice(0,a)+v+s.slice(b);
function replace(a,b,count=1){if(s.split(a).length-1!==count)throw Error('Unexpected patch count: '+a.slice(0,100));s=s.replaceAll(a,b);}
const name=process.argv[2];
if(name.includes('main-')) {
 replace('this.basePath=""','this.basePath="'+base+'"');
 replace('addPathPrefix)(e,"")','addPathPrefix)(e,e==="'+base+'"||e.startsWith("'+base+'/")?"":"'+base+'")');
 replace('pathHasPrefix)(e,"")','pathHasPrefix)(e,"'+base+'")');
 replace('function n(e){return e}Object.defineProperty(t,"__esModule"','function n(e){return e==="'+base+'"?"/":e.startsWith("'+base+'/")?e.slice('+base.length+')||"/":e}Object.defineProperty(t,"__esModule"');
}
if(name.includes('1606-')) {
 // この公開物は静的な単一ページ。元のイベントを保ち、anchorの標準動作を使う。
 replace('function g(e,t,r,n,l,o){if(o||','function g(e,t,r,n,l,o){return;if(o||');
 replace('A&&!e.defaultPrevented&&function(e,t,r,n,l,a,u,s,c){','!1&&A&&!e.defaultPrevented&&function(e,t,r,n,l,a,u,s,c){');
 replace('G.href=t||(0,y.addBasePath)((0,c.addLocale)(W,e,null==z?void 0:z.defaultLocale))}',
 'G.href=t||(0,y.addBasePath)((0,c.addLocale)(W,e,null==z?void 0:z.defaultLocale));G.href=G.href.replace(/^\\/sendy-download(?=[?#]|$)/,"'+base+'/")}');
}
s=s.replaceAll('unoptimized:!1','unoptimized:!0');
if(name.includes('_app-')) {
 // 配置先のURLは描画クラス名のhashを変えない。
 replace('5381,JSON.stringify(e))>>>0','5381,JSON.stringify(e).replaceAll("'+base+'/","/"))>>>0');
 // 元サイトの計測初期化とscriptを公開ページへ持ち込まない。
 s=s.replace(/o\.fy\.init\(\{clientToken:[\s\S]*?site:"datadoghq\.com"\}\);/,'');
 replace('void 0!==i&&(0,r.jsx)("script",{defer:!0,"data-domain":m.vt,"event-is_arc":i,src:"/sendy-download/js/arcnet-script.js"},"analytics"),','');
 const props=parser.parse(s).program.body[0].expression.arguments[0].elements[1].properties;
 const telemetry=props.find(p=>p.key.value===66608);
 if(!telemetry)throw Error('Missing reference telemetry module');
 s=s.slice(0,telemetry.start)+'66608:function(e,t,n){n.d(t,{fy:()=>disabled});const disabled={init(){},logger:{log(){},debug(){},info(){},warn(){},error(){}}}}'+s.slice(telemetry.end);
}
if(name.includes('4196-')) {
 s=s.replaceAll('href:"/"','href:"'+base+'/"');
 // 旧サイトの登録・外部送信はSendyの機能ではない。設定値ごと除外。
 let a=parser.parse(s),props=a.program.body[0].expression.arguments[0].elements[1].properties;
 const p=props.find(p=>p.key.value===41964);
 if(!p)throw Error('Missing unused reference service module');
 s=s.slice(0,p.start)+'41964:function(e,t,n){n.d(t,{h3:()=>noop,uP:()=>noop,nd:()=>noop,T3:()=>noop,ve:()=>noop});function noop(){return Promise.reject(Error("Registration is unavailable"))}}'+s.slice(p.end);
 // 別ページをNextルーターへ渡さず静的HTMLとして開く。
 replace('href:t,id:sendyID,className:sendyClass,"data-sendy-download":sendyKind,prefetch:n,scroll:r,replace:l,rel:c,target:d,download:h,tabIndex:p,onMouseEnter:',
 'href:t,id:sendyID,className:sendyClass,"data-sendy-download":sendyKind,prefetch:!1,scroll:r,replace:l,rel:c,target:d,download:h,tabIndex:p,onClick:e=>{if(t.endsWith(".html")||t.endsWith(".txt")||t==="'+base+'/"){e.preventDefault();window.location.assign(t)}},onMouseEnter:');
}
fs.writeFileSync(process.argv[3],s);
"""
babel = Path.home() / 'Prism/node_modules/@babel/parser'
html = BeautifulSoup((repo / 'index.html').read_text(), 'html.parser')
files = set()
for element in html.find_all(True):
    for key in ['src', 'href', 'poster']:
        value = element.get(key)
        if value and value.startswith('/') and not value.startswith('//'):
            value = localize(value)
            element[key] = value
            path = urlsplit(value).path.removeprefix(BASE).lstrip('/')
            if path and not path.endswith('.html'):
                files.add(unquote(path))
    if element.name == 'a' and element.get('href') == '/':
        element['href'] = BASE + '/'
    if element.has_attr('srcset'):
        del element['srcset']
    if element.has_attr('imagesrcset'):
        del element['imagesrcset']
for style in html.find_all('style'):
    style.string = localize(style.get_text())
next_data = html.select_one('#__NEXT_DATA__')
data = json.loads(next_data.string)
data['assetPrefix'] = BASE
next_data.string = json.dumps(data, ensure_ascii=False)
# フォームと外部の計測・iframe・接続を制限。配布版のAPI取得は許可。
csp = html.new_tag('meta')
csp['http-equiv'] = 'Content-Security-Policy'
csp['content'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; media-src 'self' blob:; connect-src 'self' https://api.github.com; form-action 'none'; frame-src 'none'; base-uri 'self'"
html.head.insert(0, csp)
output.mkdir(parents=True, exist_ok=True)
result = str(html)
result = re.sub(r'<a\b([^>]*?)\s+id="download-btn"([^>]*)>', lambda m: '<a id="download-btn"' + m[1] + m[2] + '>', result)
(output / 'index.html').write_text(result)
# 読み込む同一ページのCSSとruntimeのみ。別ルートのchunkや取得資料は含めない。
files.update(str(p.relative_to(runtime)) for p in (runtime / 'sendy-media').glob('*'))
files.update(str(p.relative_to(source)) for p in (source / 'fonts').glob('*'))
files.update(str(p.relative_to(supplement)) for p in (supplement / 'fonts').glob('*'))
files.update(['noise-light.png', 'images/desktop-banner-bg.png', 'images/desktop-banner-mask.svg', 'images/mobile-banner-mask.svg', 'images/dia-background-image.png', '_next/data/ZItv7-G5V1T6S5vw51s7i/index.json'])
for name in sorted(files):
    candidates = [runtime / name, repo / name, source / name, supplement / name]
    original = next((p for p in candidates if p.is_file()), None)
    if original is None:
        raise FileNotFoundError(name)
    target = output / name
    target.parent.mkdir(parents=True, exist_ok=True)
    if name.endswith('.js') and '/chunks/' in name:
        subprocess.run(['node', '-e', transform, str(babel), str(original), str(target)], check=True)
        subprocess.run(['node', '--check', str(target)], check=True, capture_output=True)
    elif name.endswith(('.css', '.js')):
        target.write_text(localize(original.read_text()))
    else:
        shutil.copyfile(original, target)
for name in ['ai.html', 'privacy.html', 'terms.html', 'llms.txt']:
    text = (repo / name).read_text()
    if name == 'ai.html':
        document = BeautifulSoup(text, 'html.parser')
        for element in document.find_all(True):
            for key in ['src', 'href', 'poster']:
                if isinstance(element.get(key), str):
                    element[key] = localize(element[key])
        text = str(document)
    if name == 'privacy.html':
        text = text.replace('index.html#security', 'index.html#for-ai')
    (output / name).write_text(text)
# 既存の法務ページが参照するCSSを保持する。
for path in (repo / 'css').glob('*.css'):
    (output / 'css' / path.name).write_text(localize(path.read_text()))
(output / '.nojekyll').touch()
print(json.dumps({'output': str(output), 'drawingResources': len(files)}, ensure_ascii=False))
