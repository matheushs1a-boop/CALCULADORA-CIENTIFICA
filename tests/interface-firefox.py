"""Aceitação real no Firefox via WebDriver, sem pacotes Python externos.
Inicie geckodriver --port 4444 e npm start (ou servidor na porta 5500).
MATHLAB_URL, MATHLAB_WEBDRIVER e MATHLAB_SESSION permitem reutilizar ambientes.
"""
import base64
import json
import os
from pathlib import Path
import sys
import shutil
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/tmp/mathlab-evidencias-firefox')
BASE = os.environ.get('MATHLAB_WEBDRIVER', 'http://127.0.0.1:4444')
URL = os.environ.get('MATHLAB_URL', 'http://127.0.0.1:5500/index.html')

def request(path, data=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers={'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(req, timeout=60))['value']
    except urllib.error.HTTPError as error:
        raise RuntimeError(error.read().decode()) from error

session_file = os.environ.get('MATHLAB_SESSION')
sid = json.loads(Path(session_file).read_text())['value']['sessionId'] if session_file else request('/session', {
    'capabilities': {'alwaysMatch': {'browserName': 'firefox', 'moz:firefoxOptions': {'args': ['-headless']}}}})['sessionId']
def cmd(path, data=None):
    return request('/session/' + sid + path, data)
def js(script, *args):
    return cmd('/execute/sync', {'script': script, 'args': list(args)})
def viewport(w, h):
    cmd('/window/rect', {'width': w, 'height': h})
    delta = js('return [outerWidth-innerWidth,outerHeight-innerHeight]')
    cmd('/window/rect', {'width': w+delta[0], 'height': h+delta[1]})
    time.sleep(.15)
def shot(name):
    (OUT / (name + '.png')).write_bytes(base64.b64decode(cmd('/screenshot')))
def select(module):
    js("document.querySelector('[data-module=" + module + "]').click()")
    time.sleep(.08)
def state(**parts):
    js('MathLabApp.mudarTrigonometria(arguments[0])', parts)
    time.sleep(.05)
def check(script, message):
    assert js('return (' + script + ')'), message
    print('[OK]', message)

OUT.mkdir(exist_ok=True)
phase = sys.argv[1] if len(sys.argv) > 1 else 'depois'
cmd('/url', {'url': URL})
# Injeta observação no contexto da página antes de interagir com os módulos.
js("""const s=document.createElement('script');s.textContent=`
window.MathLabApp=MathLabApp;window.MathLabGraph=MathLabGraph;
window.mathlabErros=[];addEventListener('error',e=>mathlabErros.push(e.message));
addEventListener('unhandledrejection',e=>mathlabErros.push(String(e.reason)));
`;document.head.append(s);""")
viewport(1366,768)
select('trigonometria')
shot('trigonometria-' + phase)
modules=['cientifica','algebra','funcoes','limites','derivadas','integrais','geometria','trigonometria','vetores','estatistica','modelagem']
metrics=[]
for module in modules:
    select(module)
    shot(module + '-' + phase)
    metrics.append(js("""return {modulo:MathLabApp.state.activeModule,
        largura:innerWidth,documento:document.documentElement.scrollWidth,
        painel:document.getElementById('right-panel-body').getBoundingClientRect().toJSON(),
        botoes:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width&&b.getBoundingClientRect().height).map(b=>({id:b.id,texto:b.textContent.trim(),altura:b.getBoundingClientRect().height,cortado:b.scrollWidth>b.clientWidth+2}))};"""))
(OUT / ('varredura-' + phase + '.json')).write_text(json.dumps(metrics, ensure_ascii=False, indent=2))
if phase != 'depois':
    for f in OUT.glob('*'+phase+'*'): shutil.copy2(f, ROOT/'docs/evidencias'/f.name)
    print('Capturas e medidas dos 11 modos registradas:', phase)
    sys.exit(0)
