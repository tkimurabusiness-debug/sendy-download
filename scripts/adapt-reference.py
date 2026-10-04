"""Arcの描画コードを保ち、Sendyの内容だけをHTMLとruntimeへ反映する。"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit

from bs4 import BeautifulSoup
import tinycss2

parser = argparse.ArgumentParser()
parser.add_argument('--reference', type=Path, required=True)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[1]
source = args.reference.resolve()
evidence = source.parent / 'sendy-faithful'
runtime = evidence / 'runtime'
runtime.mkdir(parents=True, exist_ok=True)
ARM = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/latest/download/Sendy-arm64.dmg'
INTEL = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/download/v0.2.106/Sendy-intel.dmg'
WIN = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/download/v0.2.106/Sendy-Setup-0.2.106.exe'
SITE = 'https://tkimurabusiness-debug.github.io/sendy-download/'
HEAD = 'All your messages, together in Sendy'
DESCRIPTION = 'Messenger・LINE・Instagram・メールを1か所に。AIと一緒に返信を片づける macOS アプリ。'
mapping = {
    'Meet Dia, the next evolution of Arc': HEAD,
    'Weekly security updates, SOC 2 certification, and the Arc DNA you know (and love).': DESCRIPTION,
    'Try Dia': 'Download Sendy', 'Dia Icon': 'Sendy', 'Dia Hero Image': 'Sendyの統合受信箱',
    '/images/dia_app_icon.png': '/assets/icon.png', '/dia-icon.png': '/assets/icon.png',
    '/favicon.png': '/assets/icon.png', '/favicon.ico': '/assets/icon.png',
    '/apple-touch-icon.png': '/assets/icon.png',
    '/images/dia-hero-image.png': '/assets/frames/s1/0030.webp',
    '/video/ArcDiaPLG_Video-poster.jpg': '/assets/frames/s1/0030.webp',
    '/video/ArcDiaPLG_Video.webm': '/sendy-media/sendy-hero.webm',
    '/video/ArcDiaPLG_Video.mp4': '/sendy-media/sendy-hero.mp4',
    'https://diabrowser.com?utm_campaign=arc-cta': ARM,
    'Arc is the Chrome ': 'すべての連絡を',
    " replacement I've been ": 'ひとつの受信箱へ', ' waiting for.': '自分のペースで返信',
    'Arc is the Chrome replacement ': 'すべての連絡を',
    " I've been waiting for.": 'ひとつの受信箱に',
    'FYI: Arc receives Chromium updates only. For active security patches and enterprise-grade protection, download Dia instead.': 'macOS 12以降 · Apple Silicon · ベータ期間中は無料。Intel・Windows版は試験中。',
    'Download Arc for Mac': 'Mac Apple Silicon版',
    'Download Arc for Windows': 'Windows版 · ベータ',
    'https://releases.arc.net/release/Arc-latest.dmg': ARM,
    'https://releases.arc.net/windows/ArcInstaller.exe': WIN,
    'Versions 13.0 and later': 'macOS 12以降',
    'Arc from The Browser Company': 'Sendy — 連絡を1か所に',
    'Experience a calmer, more personal internet in this browser designed for you. Let go of the clicks, the clutter, the distractions with the Arc browser.': DESCRIPTION,
    'Experience a calmer, more personal internet in this browser designed for you. Let go of the clicks, the clutter, the distractions.': DESCRIPTION,
    'https://arc.net': SITE.rstrip('/'), 'https://arc.net/': SITE,
    'https://arc.net/og.png': SITE + 'assets/shot-inbox.png',
    'Screenshot of Arc by The Browser Company of New York': 'Sendyの会話と返信案の画面',
    '/browser-mmmhome.png': '/assets/shot-inbox.png',
    '/windows-browser-mmmhome.png': '/assets/shot-inbox.png',
    'A browser that doesn’t just meet your ': 'すべての連絡を',
    ' needs — it anticipates them.': 'ひとつの受信箱に',
    'Clean and calm, Arc shapes itself to how you use the internet.': 'Messenger・LINE・Instagram・LinkedIn・Chatwork・メールの会話を、ひとつの画面で読み書き。',
    'Space for the different sides of you.': 'あなたらしい言葉で返信',
    'Effortlessly organize everything you do online — work, study, hobbies — all in one window with': '過去のやり取りと言い回しを覚えて、返信を一緒に。',
    'Spaces': 'AIの下書き', 'Profiles': '日程の提案',
    'Your perfect setup.': '自分のペースで整理',
    'Find your perfect setup with ': '仕事もプライベートも、',
    'Split View': 'フォルダ', 'Themes': 'ショートカット', ', and more.': 'で自分のペースに。',
    'The comfort of privacy.': '安心して使える設計',
    'Arc is built from the ground up to be private and secure. We don’t ': 'メッセージ本文とログイン情報はMacの中に保存。',
    ' know what sites you visit or what you search for.': ' AIへの送信は、下書きに必要な範囲だけ。',
    'Learn more about privacy in Arc →': 'AIと使い方を考える →',
    'Way more powerful than Chrome. Arc looks like the future of browsers.': '読んだだけでは既読を付けず、返せるときに返信。',
    'Arc brought order to the chaos that was my online life. There’s no going back.': 'これまでの会話をもとに、あなたらしい返信案を。',
    'Arc lives up to the hype. So intuitive, playful and pretty.': '仕事もプライベートも、自分のフォルダで整理。',
    'I just tried using a computer without Arc and it was miserable.': '相手に届く時間を選んで、返信を予約。',
    '@beebomco': '既読は送信時', '@katelaurielee': 'AIの返信案',
    '@fiveboiii': '会話を整理', '@markfishman_XYZ': '予約送信',
    'Enter ': '連絡を', 'your': 'あなたの', ' new ': 'ペースで', ' home on the internet': 'ひとつにまとめよう',
    ' new home on the internet': 'ペースでひとつにまとめよう',
    'We can email you a quick download link to get you started on desktop.': 'Macで利用するアプリです。ダウンロードして、アプリケーションへ移動。',
    'Max': 'Features', 'Mobile': 'Services', 'Developers': 'Privacy',
    'Students': 'Download', 'Blog': 'Contact',
    '/max': '#features', '/search': '#services', '/developers': '#for-ai',
    '/students': '#download', '/blog': 'mailto:info@stockvalue.co.jp',
    '/download': ARM, '/privacy': '/privacy.html',
    'https://start.arc.net/terms-of-use': '/terms.html', '/security': '/privacy.html',
    'Arc Max': 'AIの返信案', 'Arc for iPhone': '対応サービス',
    '/integrations': '#services', '/credits': 'https://stockvalue.co.jp/',
    'Credits': '開発元', 'Resource Center': '製品情報',
    'https://resources.arc.net': '/llms.txt',
    'https://resources.arc.net/hc/en-us/articles/20498293324823-2024-Release-Notes': 'https://github.com/tkimurabusiness-debug/sendy-download/releases',
    '/faq': '#for-ai', 'FAQ': 'AIに聞く', 'Careers @ BCNY': 'お問い合わせ',
    'https://thebrowser.company/careers/': 'mailto:info@stockvalue.co.jp',
    'https://www.youtube.com/c/TheBrowserCompany': 'mailto:info@stockvalue.co.jp',
    'https://twitter.com/browsercompany': 'https://github.com/tkimurabusiness-debug/sendy-download',
    'https://thebrowser.company': 'https://stockvalue.co.jp/',
    'The Browser Company of New York': '株式会社 Stock Value', 'Arc Logo': 'Sendy',
    'TheBrowserCompany on Youtube': 'Sendyへメール', '@browsercompany on Twitter': 'Sendy on GitHub',
    'https://www.theverge.com/23462235/arc-web-browser-review': 'https://stockvalue.co.jp/',
    'Product': '製品', 'Resources': 'サポート', 'Download': 'ダウンロード', 'Privacy Policy': 'プライバシー', 'Terms of Use': '利用規約', 'Security': 'データの扱い', 'Release Notes': '更新履歴', 'More': '詳しく', ' Details': '見る',
    'zero-chrome': 'sendy-inbox', 'space-swiping': 'sendy-drafts', 'theme-picker': 'sendy-folders',
}
records = []
structural_records = []
social_icons = {
    'Sendyへメール': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Sendyへメール"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="m3 6 9 7 9-7" stroke="currentColor" stroke-width="1.8"/></svg>',
    'Sendy on GitHub': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Sendy on GitHub"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}
sha = lambda data: hashlib.sha256(data).hexdigest()

# JS parserのStringLiteral tokenだけを編集する。ライブラリやCSS内の引用符を誤認しない。
tokenizer = '''const fs=require('fs'),parser=require(process.argv[1]);
const s=fs.readFileSync(process.argv[2],'utf8');
const ast=parser.parse(s,{sourceType:'unambiguous',tokens:true});
process.stdout.write(JSON.stringify(ast.tokens.filter(t=>t.type.label==='string').map(t=>({start:t.start,end:t.end,value:t.value}))));'''
babel = Path.home() / 'Prism/node_modules/@babel/parser'

def replace_once(text, before, after, count=1):
    actual = text.count(before)
    assert actual == count, (before[:120], actual, count)
    structural_records.append({'path':name,'matchSHA256':sha(before.encode()),'expectedCount':count,'actualCount':actual})
    return text.replace(before, after)

active = BeautifulSoup((source/'index.html').read_text(), 'html.parser')
mapping[active.select_one('meta[name="keywords"]')['content']] = 'Sendy, macOS, Messenger, LINE, Instagram, メール, 統合受信箱, AI返信, Stock Value'
chunks = [x['src'] for x in active.select('script[src]') if x['src'].startswith('/_next/static/')]
for name in chunks:
    path = source/name.lstrip('/')
    before = path.read_bytes()
    text = before.decode()
    tokens = json.loads(subprocess.check_output(['node', '-e', tokenizer, str(babel), str(path)], text=True))
    counts = {}
    # BabelのoffsetはUTF-16。先に位置をPythonのcodepointへ変換する。
    offsets = [0]
    for i, char in enumerate(text):
        offsets.extend([i+1] * (2 if ord(char) > 0xffff else 1))
    changes = []
    for token in tokens:
        value = token['value']
        # Downloadはiconのexport名にもある。表示されるfooterの文字だけを下で変更する。
        if value == 'Download': continue
        if value in mapping:
            counts[value] = counts.get(value, 0) + 1
            changes.append((offsets[token['start']], offsets[token['end']], json.dumps(mapping[value], ensure_ascii=False)))
    for start, end, value in reversed(changes):
        text = text[:start] + value + text[end:]
    if name.endswith('pages/_app-549c2dcbaa19fc61.js'):
        text = replace_once(text, '(0,r.jsx)("meta",{name:"twitter:site",content:"@thebrowsercompany"}),', '')
        text = replace_once(text, '(0,r.jsx)("meta",{name:"twitter:creator",content:"@thebrowsercompany"}),', '')
        text = replace_once(text, 'media:"(prefers-color-scheme: light)",content:"#3139FB"', 'media:"(prefers-color-scheme: light)",content:"#3b6dff"')
    if name.endswith('4196-e646878f89c77cbb.js'):
        text = replace_once(text, 'href:' + json.dumps(ARM) + ',children:"Download"', 'href:' + json.dumps(ARM) + ',children:"ダウンロード"')
        text = replace_once(text, '(0,a.jsx)(P.IV,{width:32,height:32})', '(0,a.jsx)("img",{src:"/assets/icon.png",alt:"Sendy",width:32,height:32})')
        text = replace_once(text, 'name:"theme-color",content:v.themeColor', 'name:"theme-color",content:"#3b6dff"')
        text = replace_once(text, '(0,a.jsx)($.x,{css:{textAlign:"center"},children:(0,a.jsx)(P.RZ,{})}),', '')
        text = replace_once(text, '(0,a.jsx)(P.UK,{})', '(0,a.jsx)("img",{src:"/assets/icon.png",alt:"Sendy",width:40,height:40})')
        text = replace_once(text, '(0,a.jsx)(P.XH,{})', '(0,a.jsx)("img",{src:"/assets/stockvalue-logo.png",alt:"Stock Value",width:190,height:40,style:{objectFit:"contain"}})', 3)
        for old,label in [('P._F','Sendyへメール'),('P.tL','Sendy on GitHub')]:
            svg=social_icons[label]
            props={'width':24,'height':24,'viewBox':'0 0 24 24','fill':'none','xmlns':'http://www.w3.org/2000/svg','aria-label':label,'dangerouslySetInnerHTML':{'__html':svg.split('>',1)[1].rsplit('</svg>',1)[0]}}
            text = replace_once(text, '(0,a.jsx)('+old+',{\"aria-label\":'+json.dumps(label,ensure_ascii=False)+'})', '(0,a.jsx)("svg",'+json.dumps(props,ensure_ascii=False)+')')
        text = replace_once(text, '(0,a.jsxs)(t9,{children:', '(0,a.jsxs)(t9,{id:"features",children:')
        text = replace_once(text, '(0,a.jsxs)(t4,{children:', '(0,a.jsxs)(t4,{id:"services","aria-label":"対応サービス",children:')
        # 元は別ページへ移動して閉じるメニュー。Sendyの同一ページ内リンクでも閉じる。
        text = replace_once(text, '(0,a.jsxs)(eC,{"aria-label":e.name,href:e.href,passHref:!0,children:', '(0,a.jsxs)(eC,{"aria-label":e.name,href:e.href,passHref:!0,onClick:()=>u(!1),children:')
        text = replace_once(text, '(0,a.jsxs)(t8,{children:[(0,a.jsx)(t7,{children:"安心して使える設計"})', '(0,a.jsxs)(t8,{id:"for-ai",children:[(0,a.jsx)(t7,{children:"安心して使える設計"})')
        text = replace_once(text, '" and ",(0,a.jsx)("strong",{children:"日程の提案"}),"."', '"と",(0,a.jsx)("strong",{children:"日程の提案"}),"を活用できます。"')
        text = replace_once(text, '(0,a.jsx)("strong",{children:"フォルダ"}),", "', '(0,a.jsx)("strong",{children:"フォルダ"}),"と"')
        text = replace_once(text, 'href:"/privacy.html",passHref:!0,children:"AIと使い方を考える →"', 'href:"/ai.html",passHref:!0,prefetch:!1,onClick:e=>{e.preventDefault();window.location.assign("/ai.html")},children:"AIと使い方を考える →"')
        text = replace_once(text, 'setTimeout(()=>{f.push("/downloaded")},2e3),', '')
        text = replace_once(text, '(0,a.jsx)(tn,{buttonStyle:r.Red,page:"home"})', '(0,a.jsx)(eq,{})')
        text = replace_once(text, '(0,a.jsx)(eq,{})', '(0,a.jsx)(eq,{downloadPosition:"footer",text:"Sendyをダウンロード"})', 2)
        start = text.index('return(0,eO.s)()?ed.tq&&t?null:ed.gn||i?')
        end = text.index(':o()},eG=', start) + len(':o()')
        text = text[:start] + 'return(0,eO.s)(),o()' + text[end:]
        text = replace_once(text, 'location:"top",includeRequirements:n,nonDominantOS:t', 'location:"top",downloadPosition:e.downloadPosition,text:e.text,includeRequirements:n,nonDominantOS:t')
        text = replace_once(text, 'url:s.n9,logo:', 'url:s.n9,downloadPosition:e.downloadPosition,logo:')
        text = replace_once(text, 'url:s.xq,logo:', 'url:s.xq,downloadPosition:e.downloadPosition,logo:')
        text = replace_once(text, 'poster:"/".concat(t,".png")', 'poster:"/sendy-media/".concat(t,".webp")')
        text = replace_once(text, 'src:"/".concat(t,".png")', 'src:"/sendy-media/".concat(t,".webp")')
        text = replace_once(text, 'src:"/windows-".concat(t,".png")', 'src:"/sendy-media/".concat(t,".webp")')
        text = replace_once(text, 'sourceMp4:"/".concat(t,".mp4")', 'sourceMp4:"/sendy-media/".concat(t,".mp4")')
        start = text.index('let t3=[')
        end = text.index('],t5=()=>', start) + 1
        providers = [("Messenger", "messenger"), ("LINE", "line"), ("Instagram", "instagram"), ("Email", "gmail")]
        items = [f'{{quote:{json.dumps(label)},logo:(0,a.jsx)("img",{{src:"/assets/{icon}.png",alt:{json.dumps(label)},width:120,height:40,style:{{objectFit:"contain"}}}}),link:"#features"}}' for label, icon in providers]
        text = text[:start] + 'let t3=[' + ','.join(items) + ']' + text[end:]
        # download.jsが唯一の配布先更新主体。描画側は意味のhookと初期直リンクだけ持つ。
        text = replace_once(text, 'href:t,onClick:function(e){void 0!==x', 'href:t,"data-sendy-download":e.downloadPosition==="footer"?"auto":t.includes(".exe")?"win":"arm",linkID:e.downloadPosition==="main"&&t.endsWith(".dmg")?"download-btn":void 0,linkClass:e.downloadPosition==="footer"&&t.endsWith(".dmg")?"footer-dl-btn":void 0,onClick:function(e){void 0!==x')
        text = replace_once(text, 'wrapperCSS:x,...u}=e', 'wrapperCSS:x,"data-sendy-download":sendyKind,linkID:sendyID,linkClass:sendyClass,...u}=e')
        text = replace_once(text, 'href:t,prefetch:n,scroll:r,replace:l,rel:c,target:d,download:h,tabIndex:p,onMouseEnter:', 'href:t,id:sendyID,className:sendyClass,"data-sendy-download":sendyKind,prefetch:n,scroll:r,replace:l,rel:c,target:d,download:h,tabIndex:p,onMouseEnter:')
        text = replace_once(text, 'href:' + json.dumps(ARM) + ',target:"_blank",rel:"noreferrer",onClick:L', 'href:' + json.dumps(ARM) + ',"data-sendy-download":"auto",target:"_blank",rel:"noreferrer",onClick:L')
        # 追従CTAは独立したコンポーネント。
        text = replace_once(text, 'href:' + json.dumps(ARM) + ',onClick:t', 'href:' + json.dumps(ARM) + ',"data-sendy-download":"auto",onClick:t', 1) if 'href:' + json.dumps(ARM) + ',onClick:t' in text else text
    if name.endswith('pages/index-de1a668006350c05.js'):
        text = replace_once(text, 'children:[(0,i.jsx)(x,{"aria-hidden":"true"}),', 'children:[', 2)
        text = replace_once(text, ',(0,i.jsx)(x,{"aria-hidden":"true"})]', ']', 2)
        text = replace_once(text, '(0,i.jsx)(m,{ref:e,', '(0,i.jsx)(m,{id:"download",ref:e,')
        text = replace_once(text, '(0,i.jsx)("a",{href:"https://stockvalue.co.jp/",target:"_blank",rel:"noreferrer",tabIndex:-1,className:"jsx-a3167a8f337afc2f",children:(0,i.jsx)(u.gy,{})}),', '')
        text = replace_once(text, '(0,i.jsx)(j,{children:' + json.dumps(mapping['FYI: Arc receives Chromium updates only. For active security patches and enterprise-grade protection, download Dia instead.'],ensure_ascii=False) + '}),', '')
        text = replace_once(text, '(0,i.jsx)(c.k6,{})', '(0,i.jsx)(c.k6,{downloadPosition:"main"})')
        classes='c-bCeQxv c-bCeQxv-jbZBFp-size-large c-bCeQxv-dQyHWl-type-primaryLightAlt c-bCeQxv-obFYN-border-false c-bCeQxv-fitBEy-shadow-true sendy-intel'
        intel='(0,i.jsxs)("a",{id:"dl-intel",href:'+json.dumps(INTEL)+',"data-sendy-download":"intel",className:'+json.dumps(classes)+',children:[(0,i.jsx)(u.uZ,{width:"16px"}),"Mac Intel版 · ベータ"]})'
        text = replace_once(text, '(0,i.jsx)(c.k6,{nonDominantOS:!0})', '(0,i.jsx)(c.k6,{nonDominantOS:!0}),'+intel)
    if text != before.decode():
        target = runtime/name.lstrip('/')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text)
        subprocess.run(['node', '--check', str(target)], check=True, capture_output=True)
        records.append({'path':name,'inputSHA256':sha(before),'outputSHA256':sha(text.encode()),'literalCounts':counts})

html = BeautifulSoup((source/'index.html').read_text(), 'html.parser')
for node in list(html.find_all(string=True)):
    if node.parent.name in ['script', 'style']: continue
    if str(node) in mapping: node.replace_with(mapping[str(node)])
for element in html.find_all(True):
    for key, value in list(element.attrs.items()):
        if isinstance(value, str):
            if value in mapping: element[key] = mapping[value]
            elif value.startswith('/_next/image?'):
                params=dict(parse_qsl(urlsplit(value).query))
                image=params['url']
                slots={'/zero-chrome.png':'/sendy-media/sendy-inbox.webp','/space-swiping.png':'/sendy-media/sendy-drafts.webp','/theme-picker.png':'/sendy-media/sendy-folders.webp'}
                if image in slots: element[key] = '/_next/image?' + urlencode({**params,'url':slots[image]})
    if element.name=='img' and element.has_attr('srcset'): element.attrs.pop('srcset')
html.html['lang']='ja'
html.body['id']='top'
quote_spans=html.select('.c-gzjVCE')
assert len(quote_spans)==4, ('quotation decorations', len(quote_spans))
for span in quote_spans: span.decompose()
html.title.string='Sendy — 連絡を1か所に'
for meta in html.select('meta[name="twitter:site"],meta[name="twitter:creator"]'): meta.decompose()
head_count=html.select_one('meta[name="next-head-count"]')
head_count['content']=str(int(head_count['content'])-2)
for meta in html.select('meta[property],meta[name]'):
    key=meta.get('property',meta.get('name'))
    if key in ['description','og:description','twitter:description']:meta['content']=DESCRIPTION
    if key in ['og:title','twitter:title']:meta['content']='Sendy — 連絡を1か所に'
    if key in ['og:image','twitter:image']:meta['content']=SITE+'assets/shot-inbox.png'
    if key=='og:url':meta['content']=SITE
for link in html.select('link[rel="canonical"]'):link['href']=SITE
for script in html.select('script[src="/js/arcnet-script.js"]'):script.decompose()
for a in html.select('.c-kYDOWo'):
    a['aria-label']='Sendy';a.clear();a.append(html.new_tag('img',src='/assets/icon.png',alt='Sendy',width='32',height='32'))
for a in html.select('.c-ckytNz > a'):
    a.clear();a.append(html.new_tag('img',src='/assets/stockvalue-logo.png',alt='Stock Value',width='84',height='15',style='object-fit:contain'))
for a in html.select('footer a'):
    svg=a.find('svg')
    if svg and a.get('href')=='/':a.clear();a.append(html.new_tag('img',src='/assets/icon.png',alt='Sendy',width='40',height='40'))
    elif svg and a.get('href')=='https://stockvalue.co.jp/':a.clear();a.append(html.new_tag('img',src='/assets/stockvalue-logo.png',alt='Stock Value',width='190',height='40',style='object-fit:contain'))
for svg in html.select('svg[aria-label]'):
    if svg['aria-label'] in social_icons: svg.replace_with(BeautifulSoup(social_icons[svg['aria-label']],'html.parser').svg)
html.select_one('.c-gujhdE')['id']='download'
html.select_one('.c-ivWXJT')['id']='features'
html.select_one('.c-ivWXJT').find_all('section',recursive=False)[-1]['id']='for-ai'
html.select_one('.c-CPmpi')['id']='services'
html.select_one('.c-CPmpi')['aria-label']='対応サービス'
for a in html.find_all('a'):
    href=a.get('href','')
    if href in [ARM,WIN]:a['data-sendy-download']='win' if href==WIN else 'auto' if 'c-koCplY' in a.get('class',[]) else 'arm'
primary=next(a for a in html.select('.c-ckytNz a') if a.get('href')==ARM)
primary['id']='download-btn'
for a in html.select('footer a'):
    if a.get('href') in [ARM,WIN]:
        a['data-sendy-download']='auto'
        if a['href']==ARM:a['class']=a.get('class',[])+['footer-dl-btn']
        for node in a.find_all(string=True):
            if str(node) in ['Mac Apple Silicon版','Windows版 · ベータ']: node.replace_with('Sendyをダウンロード')
intel=html.new_tag('a',id='dl-intel',href=INTEL)
intel['data-sendy-download']='intel'
intel['class']='c-bCeQxv c-bCeQxv-jbZBFp-size-large c-bCeQxv-dQyHWl-type-primaryLightAlt c-bCeQxv-obFYN-border-false c-bCeQxv-fitBEy-shadow-true sendy-intel'.split()
from copy import deepcopy
intel.append(deepcopy(primary.find('svg')))
intel.append('Mac Intel版 · ベータ')
html.select_one('.c-ckytNz > .PJLV-ikpquJp-css').append(intel)
for label in html.select('.c-ecFNtn')[1].find_all(string=True):
    if str(label)==' and ':label.replace_with('と')
    elif str(label)=='.':label.replace_with('を活用できます。')
for label in html.select('.c-ecFNtn')[2].find_all(string=True):
    if str(label)==', ':label.replace_with('と')
for a in html.find_all('a'):
    if a.get_text() == 'AIと使い方を考える →': a['href']='/ai.html'
for element in html.select('.PJLV-igjdJOs-css,.c-iPjdSy,.c-ckytNz > a'): element.decompose()
link=html.new_tag('link',rel='stylesheet',href='/css/arc-sendy.css');html.head.append(link)
script=html.new_tag('script',src='/js/download.js',defer='');html.body.append(script)
widget='''<aside class="sendy-ai" id="sendy-ai" aria-label="SendyについてAIに聞く">
<div class="sendy-ai-panel" id="sendy-ai-panel" hidden>
  <p class="sendy-ai-title" id="sendy-ai-title">あなたに合う使い方を</p>
  <p class="sendy-ai-intro">いつものAIにあなたに合う使い方を聞く</p>
  <div class="sendy-ai-providers" aria-labelledby="sendy-ai-title">
    <a data-ai-provider="chatgpt" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer"><span class="sendy-ai-mark" aria-hidden="true">G</span><span>ChatGPT<small>説明と一緒に開く</small></span><span class="sendy-ai-arrow" aria-hidden="true">↗</span></a>
    <a data-ai-provider="claude" href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"><span class="sendy-ai-mark sendy-ai-mark-claude" aria-hidden="true">C</span><span>Claude<small>説明と一緒に開く</small></span><span class="sendy-ai-arrow" aria-hidden="true">↗</span></a>
    <a data-ai-provider="grok" href="https://grok.com/" target="_blank" rel="noopener noreferrer"><span class="sendy-ai-mark sendy-ai-mark-grok" aria-hidden="true">x</span><span>Grok<small>送信前に確認</small></span><span class="sendy-ai-arrow" aria-hidden="true">↗</span></a>
  </div>
  <p class="sendy-ai-hint">説明を渡して開きます<br>入力欄が空の場合は貼り付けてください</p>
  <div class="sendy-ai-actions"><button type="button" data-ai-copy>説明文をコピー</button><a data-ai-provider="claude-desktop" href="https://claude.ai/new">Claude Desktop ↗</a></div>
  <p class="sendy-ai-status" role="status" aria-live="polite"></p>
  <div class="sendy-ai-manual" hidden><label for="sendy-ai-prompt">コピーできない場合はこちらを選択</label><textarea id="sendy-ai-prompt" readonly rows="5"></textarea></div>
  <a class="sendy-ai-guide" href="/ai.html">Sendyの解説を読む →</a>
</div>
<button class="sendy-ai-toggle" type="button" aria-label="SendyについてAIに聞く" aria-expanded="false" aria-controls="sendy-ai-panel"><svg viewBox="0 0 28 28" width="28" height="28" fill="none" aria-hidden="true"><path d="M13 5c1.2 5.2 2.8 6.8 8 8-5.2 1.2-6.8 2.8-8 8-1.2-5.2-2.8-6.8-8-8 5.2-1.2 6.8-2.8 8-8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M23 2v6M20 5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span class="sendy-ai-tooltip">AIに聞く</span></button>
<noscript><a class="sendy-ai-noscript" href="/ai.html">Sendyの解説</a></noscript>
</aside>'''
def add_widget(document):
    for old in document.select('#sendy-ai,link[href^="/css/sendy-ai.css"],script[src^="/js/sendy-ai.js"]'): old.decompose()
    document.head.append(document.new_tag('link',rel='stylesheet',href='/css/sendy-ai.css'))
    widget_dom=BeautifulSoup(widget,'html.parser')
    # 見た目はpanelを上に、Tab順はtoggleの次にproviderを置く。
    widget_root=widget_dom.select_one('#sendy-ai')
    widget_root.insert(0,widget_root.select_one('.sendy-ai-toggle').extract())
    document.body.append(widget_dom)
    document.body.append(document.new_tag('script',src='/js/sendy-ai.js',defer=''))
add_widget(html)
result=str(html)
result=re.sub(r'<a\b([^>]*?)\s+id="download-btn"([^>]*)>',lambda m:'<a id="download-btn"'+m.group(1)+m.group(2)+'>',result)

media=runtime/'sendy-media';media.mkdir(exist_ok=True)
for slot,number in [('sendy-inbox',1),('sendy-drafts',2),('sendy-folders',3)]:
    shutil.copyfile(repo/f'assets/frames/s{number}/0030.webp',media/(slot+'.webp'))
    shutil.copyfile(source.parent/f'sendy-media/sendy-{number}.mp4',media/(slot+'.mp4'))
shutil.copyfile(source.parent/'sendy-media/sendy-1.mp4',media/'sendy-hero.mp4')
# ブラウザは原版同様webmを先に選ぶため、公開frame由来の同一動画を別containerへ変換する。
subprocess.run(['ffmpeg','-v','error','-y','-i',str(media/'sendy-hero.mp4'),'-c:v','libvpx-vp9','-crf','25','-b:v','0','-an',str(media/'sendy-hero.webm')],check=True)

# 原版CSSは変更しない。brand背景を持つselectorだけ同じ紙粒子+横方向gradientへ対応。
selectors=set()
selectors.add('.c-kFyPaX-ikGFajo-css')  # 文字を載せる層。手前のメニューボタン用透明層は塗らない。
waves={}
def collect(rules):
    for rule in rules:
        if rule.type=='at-rule' and rule.content:collect(tinycss2.parse_rule_list(rule.content))
        elif rule.type=='qualified-rule':
            for d in tinycss2.parse_declaration_list(rule.content):
                if d.type!='declaration':continue
                value=tinycss2.serialize(d.value).replace(' ','')
                selector=tinycss2.serialize(rule.prelude).strip()
                if d.name=='background-image' and selector.endswith('::after') and ('fill:rgba(49,57,251,1)' in value or 'fill:#3139FB' in value):
                    waves[selector]=tinycss2.serialize(d.value)
                if d.name in ['background','background-color'] and ('var(--colors-brandBlue)' in value or value in ['rgb(49,57,251)','rgba(49,57,251,1)']):
                    selectors.add(tinycss2.serialize(rule.prelude).strip())
for state in ['top-1440','top-390','scroll-390','menu-390']:
    dom=BeautifulSoup((source.parent/f'source-states/{state}.html').read_text(),'html.parser')
    for style in dom.find_all('style'):collect(tinycss2.parse_stylesheet(style.get_text()))
css='''/* 原版の書体・粒子・波形・構造は保持し、Sendyの色の役割だけ対応する。 */
:root { --sendy-blue: #3b6dff; --sendy-purple: #8b5cf6; --colors-brandBlue: #4331ac; --sendy-paper: url(/noise-light.png), linear-gradient(90deg, color-mix(in srgb, var(--sendy-blue) 85%, black), color-mix(in srgb, var(--sendy-purple) 85%, black)); }
'''+',\n'.join('html '+s for s in sorted(selectors))+''' {
  background-image: var(--sendy-paper);
  background-size: 220px 220px, 100% 100%;
  background-repeat: repeat, no-repeat;
}
.c-koCplY, .c-bMjifB { color: white; }
/* 原版で無地のメニューは無地の質感を保ち、同じ色相の濃いgradientへ。 */
html .c-cnDoQN { background-image: linear-gradient(90deg, color-mix(in srgb, var(--sendy-blue) 55%, black), color-mix(in srgb, var(--sendy-purple) 55%, black)); }
html .c-bCeQxv-dQyHWl-type-primaryLightAlt { background-color: var(--colors-brandBlue); }
html .c-bCeQxv-ebGbss-type-primaryLight { color: var(--colors-brandBlue); }
.c-kYDOWo img { width: 32px; height: 32px; }
.c-iOOuR img, .c-ftWcvJ img { width: 100%; height: 100%; object-fit: contain; }
/* Arcの動画にはwindowの外に余白がある。余白のないSendy素材を同じ実画面幅へ収める。 */
html .c-fEjWMl { width: 100%; max-width: 1200px; }
html .c-elxicI, html .c-eebHKF { position: absolute; top: 22%; left: 23%; width: 54%; height: auto; padding: 0; object-fit: contain; border: 1px solid #d8d8de; border-radius: 8px; box-shadow: none; mask-image: linear-gradient(to bottom, black 20%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 100%); }
/* 同じwindowを二重に重ねない。静止状態はvideo自身のposterが表示する。 */
html .c-elxicI { visibility: hidden; }
html .c-dkzSUV { display: block; width: 80.556%; height: auto; margin: 0 auto; object-fit: contain; }
html .c-sCqiu > div { box-sizing: border-box; padding: 5.8% 13.75% 7%; }
html .c-sCqiu video { display: block; width: 100%; height: auto; margin: 0; border: 1px solid #d8d8de; border-radius: 8px; box-sizing: border-box; }
html .c-sCqiu > img { display: block; width: 72.5%; height: auto; margin: 5.8% auto 0; border: 1px solid #d8d8de; border-radius: 8px; box-sizing: border-box; }
[data-sendy-download] { scroll-margin-top: 220px; }
.sendy-intel { display: inline-flex; align-items: center; justify-content: center; }
html .c-ckytNz { margin-bottom: 48px; }
@media (max-width: 650px) { html .c-ckytNz { margin-bottom: 32px; } }
.c-ckytNz > .PJLV-ikpquJp-css { flex-wrap: wrap; justify-content: center; max-width: 90vw; }
'''
for selector, mask in sorted(waves.items()):
    css+=f'''html {selector} {{ background-image: var(--sendy-paper); background-size: 220px 220px, 100% 100%; background-repeat: repeat, no-repeat; mask-image: {mask}; -webkit-mask-image: {mask}; mask-size: contain; mask-repeat: repeat-x; }}
html {selector.removesuffix('::after')}::before {{ background-image: none; }}
'''
(repo/'css/arc-sendy.css').write_text(css)
# 原版と同じchunk名を使うため、既に開いているブラウザの原版cacheと区別する。
for record in records:
    result=result.replace('src="'+record['path']+'"', 'src="'+record['path']+'?sendy='+record['outputSHA256'][:12]+'"')
for asset in ['css/arc-sendy.css','js/download.js','css/sendy-ai.css','js/sendy-ai.js']:
    result=result.replace('"/'+asset+'"', '"/'+asset+'?sendy='+sha((repo/asset).read_bytes())[:12]+'"')
(repo/'index.html').write_text(result)
guide=BeautifulSoup((repo/'ai.html').read_text(),'html.parser')
add_widget(guide)
guide_result=str(guide)
for asset in ['css/sendy-ai.css','js/sendy-ai.js']:
    guide_result=re.sub(r'"/'+re.escape(asset)+r'(?:\?[^\"]*)?"', '"/'+asset+'?sendy='+sha((repo/asset).read_bytes())[:12]+'"', guide_result)
(repo/'ai.html').write_text(guide_result)
manifest={'source':'https://arc.net/','baseline':'baseline-restoration/report.json','stylePolicy':'original CSS and animation runtime retained; brand-role overrides and actual Sendy asset fitting only','headlineFonts':'original Exposure and Marlin; Japanese descriptions use source fallback stack','chunks':records,'structuralReplacements':structural_records,'brandSelectors':sorted(selectors),'otherColorRoles':{'menu':'.c-cnDoQN','alternateButton':'.c-bCeQxv-dQyHWl-type-primaryLightAlt','buttonInk':'.c-bCeQxv-ebGbss-type-primaryLight'},'waveMasks':sorted(waves),'noiseSHA256':sha((source/'noise-light.png').read_bytes()),'indexSHA256':sha((repo/'index.html').read_bytes()),'overridesSHA256':sha((repo/'css/arc-sendy.css').read_bytes()),'unusedSharedReferenceCode':'Other-route components, unused SVG brand functions and internal original enum names remain in private shared bundles; these are not published or used as Sendy page content.'}
(evidence/'mapping.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2))
(evidence/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'changedChunks':len(records),'brandSelectors':len(selectors),'indexSHA256':manifest['indexSHA256']}))
