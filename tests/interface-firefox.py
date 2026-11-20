"""Aceitação real no Firefox via WebDriver, sem pacotes Python externos.
Inicie geckodriver --port 4444 --allow-system-access e npm start (ou servidor na porta 5500).
MATHLAB_URL, MATHLAB_WEBDRIVER e MATHLAB_SESSION permitem reutilizar ambientes.
"""
import atexit
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
# Guarda o identificador e fecha apenas as sessões criadas por este teste.
Path('/tmp/mathlab-firefox-ultima-sessao.json').write_text(json.dumps({'value':{'sessionId':sid}}))
def fechar_sessao():
    if not session_file:
        try:
            urllib.request.urlopen(urllib.request.Request(BASE+'/session/'+sid,method='DELETE'),timeout=30).read()
        except Exception:
            pass
atexit.register(fechar_sessao)
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
cmd('/execute/async',{'script':'const done=arguments[arguments.length-1];document.fonts.ready.then(()=>done(true));','args':[]})
viewport(1366,768)
select('trigonometria')
js('MathLabApp.restaurarExemploModulo()')
shot('trigonometria-' + phase)
modules=['cientifica','algebra','funcoes','limites','derivadas','integrais','geometria','trigonometria','vetores','estatistica','modelagem']
metrics=[]
for module in modules:
    select(module)
    js('MathLabApp.restaurarExemploModulo()')
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

select('trigonometria')
js("""window.pintura={textos:[],segmentos:[]};const c=MathLabGraph.ctx;
const fill=c.fillText.bind(c),move=c.moveTo.bind(c),line=c.lineTo.bind(c),begin=c.beginPath.bind(c);
c.fillText=function(t,...a){pintura.textos.push(t);return fill(t,...a)};
c.beginPath=function(){this.ultimoX=null;return begin()};
c.moveTo=function(x,y){this.ultimoX=x;return move(x,y)};
c.lineTo=function(x,y){if(this.strokeStyle==='#22c55e'&&this.lineWidth===3&&this.ultimoX!==null)pintura.segmentos.push([this.ultimoX,x]);this.ultimoX=x;return line(x,y)};
MathLabGraph.desenhar();""")
check("['π/2','π','3π/2','2π'].every(t=>pintura.textos.includes(t))", '1. Eixos com rótulos em π e extremos desenhados')
check("MathLabGraph.ctx.getImageData(0,0,MathLabGraph.canvas.width,MathLabGraph.canvas.height).data.some((v,i,a)=>i%4===1&&v>140&&a[i-1]<80&&a[i+1]<160)", '1. Canvas contém a curva verde')
check("document.querySelector('.result-hero-value').textContent==='f(x) = sen(x)' && document.getElementById('right-panel-body').textContent.includes('Ímpar')", '2. Resultado único e propriedades do seno')
state(amplitude=2,frequencia=3)
check("MathLabApp.obterDadosTrigonometria().periodo==='2π/3' && Math.abs(MathLabGraph.config.curvas[0].fn(Math.PI/6)-2)<1e-10", '3. A=2, B=3 e máximo em π/6')
state(funcao='cos',amplitude=3,frequencia=2,deslocamento=1)
check("MathLabApp.obterDadosTrigonometria().imagem==='[−2, 4]' && MathLabApp.obterDadosTrigonometria().periodo==='π'", '4. Cosseno com deslocamento vertical')
state(funcao='sen',amplitude=1,frequencia=1,fase=1.5707963267948966,deslocamento=0)
check("[-2,0,.3,2].every(x=>Math.abs(MathLabGraph.config.curvas[0].fn(x)-Math.cos(x))<1e-10)", '5. Fase π/2 equivale ao cosseno')
state(fase=0,anguloGraus=30)
check("document.getElementById('trig-cycle-result').textContent.includes('(√3/2; 1/2)') && document.getElementById('trig-cycle-result').textContent.includes('√3/3')", '6. Valores exatos em 30°')
state(anguloGraus=90)
check("MathLabApp.obterDadosTrigonometria().tangente===null && document.getElementById('trig-cycle-result').textContent.includes('Indefinida')", '6. Tangente indefinida em 90°')
state(funcao='tg')
js('pintura.segmentos=[];MathLabGraph.desenhar()')
check("MathLabGraph.config.assintotas.length===4 && pintura.segmentos.length>100 && MathLabGraph.config.assintotas.every(a=>!pintura.segmentos.some(([x,y])=>x<MathLabGraph.xParaPx(a.valor)&&y>MathLabGraph.xParaPx(a.valor)))", '7. Assíntotas da tangente sem ligação entre ramos')
shot('trigonometria-tangente-depois')
# Identidade do nó, foco e texto são conferidos após cada tecla real do Firefox.
state(funcao='sen',anguloGraus=30)
for key,text in [('amplitude','−0,5'),('fase','π/6')]:
    element=js("window.campoTeste=document.querySelector('[data-slot-key='+arguments[0]+']');campoTeste.focus();campoTeste.value='';campoTeste.dispatchEvent(new Event('input',{bubbles:true}));return campoTeste",key)
    eid=element['element-6066-11e4-a52e-4f735466cecf']
    for char in text:
        cmd('/element/'+eid+'/value', {'text':char})
        check("campoTeste===document.activeElement && campoTeste===document.querySelector('[data-slot-key='+arguments[0]+']')".replace('arguments[0]',json.dumps(key)), '8. Campo e foco preservados após tecla '+char)
    check('campoTeste.value==='+json.dumps(text), '8. Texto preservado: '+text)
check("MathLabApp.state.trigonometria.amplitude===-.5 && Math.abs(MathLabApp.state.trigonometria.fase-Math.PI/6)<1e-10", '8. Valores interpretados corretamente')
# Conversão troca a representação, preservando o ângulo físico.
js("document.getElementById('trig-unit').value='rad';document.getElementById('trig-unit').dispatchEvent(new Event('change'))")
check("MathLabApp.state.trigonometria.anguloGraus===30 && document.getElementById('trig-theta').value==='π/6'", 'Conversão GRAUS → RAD preserva θ')
js("document.getElementById('trig-unit').value='graus';document.getElementById('trig-unit').dispatchEvent(new Event('change'))")
check("document.getElementById('trig-theta').value==='30'", 'Conversão RAD → GRAUS preserva θ')
state(visualizacao='tabela')
check("document.querySelectorAll('.trig-angle-table tbody tr').length===17", 'Tabela com os 17 ângulos notáveis')
shot('trigonometria-tabela-depois')
state(visualizacao='circulo')
check("document.querySelector('#custom-stage-wrapper svg')!==null", 'Ciclo com projeções em SVG')
shot('trigonometria-ciclo-depois')
state(visualizacao='grafico',amplitude=1,frequencia=1,fase=0,deslocamento=0)
js("MathLabGraph.aplicarZoom(.7);document.getElementById('btn-graph-fit-fn').click()")
check("Math.abs(MathLabGraph.janela.xMax-2*Math.PI)<1e-10", 'Ajustar à função restaura a janela trigonométrica')
# Clique real sobre a curva: a coordenada retornada precisa pertencer ao seno.
x,y=js('return [MathLabGraph.canvas.getBoundingClientRect().x+MathLabGraph.xParaPx(.4),MathLabGraph.canvas.getBoundingClientRect().y+MathLabGraph.yParaPy(Math.sin(.4))]')
cmd('/actions',{'actions':[{'type':'pointer','id':'mouse','parameters':{'pointerType':'mouse'},'actions':[{'type':'pointerMove','x':round(x),'y':round(y)},{'type':'pointerDown','button':0},{'type':'pointerUp','button':0}]}]})
check("MathLabGraph.pontoHover && Math.abs(MathLabGraph.pontoHover.y-Math.sin(MathLabGraph.pontoHover.x))<1e-10", 'Clique na curva corresponde a f(x)')
# Zoom e arrasto no gráfico preservam as conversões lógicas.
js('MathLabGraph.aplicarZoom(.8)')
check("Math.abs(MathLabGraph.pxParaX(MathLabGraph.xParaPx(.7))-.7)<1e-10", 'Zoom mantém conversão x ↔ pixel')
x,y=js('const r=MathLabGraph.canvas.getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]')
old=js('return MathLabGraph.janela.xMin')
cmd('/actions',{'actions':[{'type':'pointer','id':'mouse','parameters':{'pointerType':'mouse'},'actions':[{'type':'pointerMove','x':x,'y':y},{'type':'pointerDown','button':0},{'type':'pointerMove','x':x+35,'y':y+10,'duration':150},{'type':'pointerUp','button':0}]}]})
check('MathLabGraph.janela.xMin!=='+str(old), 'Arrastar desloca a janela')
js('MathLabGraph.resetarJanela()')
# Abas e tema provocam redesenho sem apagar a curva.
state(visualizacao='circulo')
state(visualizacao='grafico')
js('MathLabApp.alternarTema()')
check("MathLabGraph.largura>100 && MathLabGraph.altura>100 && MathLabGraph.config.curvas.length===1", '9. Troca de aba e tema preserva o gráfico')
shot('trigonometria-claro-depois')
js('MathLabApp.alternarTema()')

def zoom_nativo(percent):
    cmd('/moz/context',{'context':'chrome'})
    try:
        js('window.gBrowser.selectedBrowser.fullZoom=arguments[0]',percent/100)
    finally:
        cmd('/moz/context',{'context':'content'})
    time.sleep(.12)
    check('Math.abs(devicePixelRatio-'+str(percent/100)+')<.03','Zoom nativo confirmado em '+str(percent)+'%')

layout=[]
for w,h in [(1366,768),(1536,864),(1920,1080)]:
    zoom_nativo(100)
    viewport(w,h)
    for zoom in [90,100,110,125]:
        zoom_nativo(zoom)
        for module in modules:
            select(module)
            measure=js("""const r=document.querySelector('.area-right').getBoundingClientRect();
                const f=document.getElementById('btn-generate-footer').getBoundingClientRect();
                const buttons=[...document.querySelectorAll('.header-actions > *,#btn-open-share,#btn-open-settings')].filter(e=>e.getBoundingClientRect().width);
                return {modulo:MathLabApp.state.activeModule,w:innerWidth,h:innerHeight,dpr:devicePixelRatio,
                largura:document.documentElement.scrollWidth,painelDireito:r.right,rodape:f.bottom,
                ctaCentralizado:(()=>{const l=document.querySelector('.generate-label').getBoundingClientRect();return Math.abs(f.x+f.width/2-l.x-l.width/2)<1})(),
                botoesVisiveis:buttons.every(e=>e.getBoundingClientRect().right<=innerWidth+1)};""")
            measure.update(resolucao=[w,h],zoom=zoom)
            layout.append(measure)
            assert measure['largura']<=measure['w'], str(measure)
            assert measure['painelDireito']<=measure['w']+1, str(measure)
            assert measure['rodape']<=measure['h']+1, str(measure)
            assert measure['botoesVisiveis'], str(measure)
            assert measure['ctaCentralizado'], str(measure)
            check("[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().height&&b.getBoundingClientRect().width).every(b=>b.scrollWidth<=b.clientWidth+2)", 'Textos dos botões cabem: '+module)
            check("(()=>{const a=document.querySelector('.generate-label').getBoundingClientRect(),k=document.querySelector('#btn-generate-footer kbd').getBoundingClientRect();return a.right+4<=k.left})()", 'Rótulo separado do selo Enter: '+module)
        print('[OK] 9. Onze modos em',w,h,'zoom',zoom,'% (DPR',measure['dpr'],')')
zoom_nativo(100)
viewport(1366,768)
select('trigonometria')
for opener,name in [('btn-open-share','compartilhar'),('btn-open-settings','configuracoes')]:
    js('document.getElementById(arguments[0]).click()',opener)
    shot('menu-'+name+'-depois')
    check("[...document.querySelectorAll('.dropdown-panel:not([hidden]) button')].every(b=>b.scrollWidth<=b.clientWidth+2)", 'Menu '+name+' sem texto cortado')
    js('document.getElementById(arguments[0]).click()',opener)
check("[...document.querySelectorAll('.visual-toolbar button,.input-mode-btn,.segmented-btn')].filter(b=>b.getBoundingClientRect().height).every(b=>b.getBoundingClientRect().height===36)", '10. Abas, alternância e zoom com altura de 36 px')
check("(()=>{const b=document.getElementById('btn-generate-footer').getBoundingClientRect(),l=document.querySelector('.generate-label').getBoundingClientRect();return Math.abs(b.x+b.width/2-l.x-l.width/2)<1&&b.height===44})()", '10. Botão principal centralizado com 44 px')
check("[...document.querySelectorAll('button svg')].every(s=>getComputedStyle(s).strokeWidth==='1.75px')", '10. Ícones com traço uniforme de 1,75 px')
js("document.querySelector('[data-switch-imode=normal]').click();window.campoNormal=document.getElementById('normal-mode-input');campoNormal.focus();campoNormal.value='3·cos(2x + π/6) + 1';campoNormal.dispatchEvent(new Event('input',{bubbles:true}))")
check("campoNormal===document.getElementById('normal-mode-input') && MathLabApp.state.trigonometria.funcao==='cos' && MathLabApp.state.trigonometria.deslocamento===1", 'Modo Normal sincroniza a expressão sem recriar o input')
js("document.querySelector('[data-switch-imode=pronta]').click()")
check("document.querySelector('[data-slot-key=amplitude]').value==='3' && document.querySelector('[data-trig-formula-fn]').textContent==='cos'", 'Normal → Fórmula pronta preserva os parâmetros')
state(funcao='sen',amplitude=1,frequencia=1,fase=0,deslocamento=0,anguloGraus=30)
for opener,closer,name in [('btn-open-favorites','btn-close-generic','favoritos'),('btn-keyboard-help','btn-close-generic','atalhos'),('btn-about','btn-close-generic','sobre'),('btn-open-states','btn-close-generic','estados'),('btn-open-tour','btn-tour-skip','tour')]:
    js('document.getElementById(arguments[0]).click()',opener)
    time.sleep(.15)
    shot('menu-'+name+'-depois')
    check("document.documentElement.scrollWidth<=innerWidth", 'Menu '+name+' cabe na janela')
    js('document.getElementById(arguments[0]).click()',closer)
js("document.querySelector('.header-search').click()")
time.sleep(.1)
shot('menu-busca-depois')
js("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
select('algebra')
js("document.getElementById('alg-tool-select').value='expansao';document.getElementById('alg-tool-select').dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('alg-tool-trigger').scrollIntoView({block:'center'})")
time.sleep(.2)
js("document.getElementById('alg-tool-trigger').click()")
time.sleep(.25)
check("document.querySelectorAll('#alg-tool-options [role=option]').length===7 && document.getElementById('alg-tool-trigger').getAttribute('aria-expanded')==='true'", 'Seletor de Álgebra: sete ferramentas preservadas')
shot('seletor-algebra-depois')
check("(()=>{const r=document.getElementById('alg-tool-options').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()", 'Lista de Álgebra cabe na janela sem recorte')
cmd('/actions',{'actions':[{'type':'key','id':'algebra','actions':[{'type':'keyDown','value':'\ue015'},{'type':'keyUp','value':'\ue015'},{'type':'keyDown','value':'\ue007'},{'type':'keyUp','value':'\ue007'}]}]})
check("MathLabApp.state.algebra.ferramenta==='simplificacao' && document.activeElement.id==='alg-tool-trigger'", 'Seletor de Álgebra: setas e Enter selecionam e mantêm foco')
for tool in ['eq2','fatoracao','expansao','simplificacao','eq1','sistema','notaveis']:
    js("document.getElementById('alg-tool-trigger').click();const n=[...document.querySelectorAll('#alg-tool-select option')].findIndex(o=>o.value===arguments[0]);document.querySelector('[data-tool-index=\"'+n+'\"]').click()",tool)
    check('MathLabApp.state.algebra.ferramenta==='+json.dumps(tool), 'Ferramenta preservada: '+tool)
select('funcoes')
js('MathLabApp.restaurarExemploModulo()')
js("const d=[...document.querySelectorAll('.layered-details')].find(d=>d.querySelector('.props-list'));d.open=true;d.scrollIntoView({block:'nearest'})")
time.sleep(.25)
props=js("return document.querySelector('#right-panel-body .props-list')")['element-6066-11e4-a52e-4f735466cecf']
(OUT/'propriedades-depois.png').write_bytes(base64.b64decode(cmd('/element/'+props+'/screenshot')))
check("[...document.querySelectorAll('#right-panel-body .prop-item')].every(row=>{const r=row.getBoundingClientRect(),v=row.querySelector('.prop-val').getBoundingClientRect();return v.right<=r.right+1&&v.left>=r.left&&r.height>=36})", 'Propriedades alinhadas, com margem interna e linhas de 36 px')
js("document.getElementById('btn-study-footer').click()")
shot('menu-estudo-depois')
js("document.getElementById('btn-close-study').click()")
select('trigonometria')
time.sleep(.25)
footer=js("return document.querySelector('.input-panel-footer')")['element-6066-11e4-a52e-4f735466cecf']
(OUT/'botao-relatorio-depois.png').write_bytes(base64.b64decode(cmd('/element/'+footer+'/screenshot')))
# Regressão do chip Intuição: abrir todos os detalhes não pode girar textos.
for module in modules:
    select(module)
    js("document.querySelectorAll('.layered-details').forEach(d=>d.open=true)")
    check("[...document.querySelectorAll('.layered-details > summary > span')].filter(s=>s.textContent.trim()).every(s=>getComputedStyle(s).transform==='none')", 'Textos de detalhes não giram: '+module)
    check("[...document.querySelectorAll('.verified-badge')].filter(b=>b.getBoundingClientRect().width).every(b=>getComputedStyle(b).width!=='auto')", 'Selos com tamanho próprio: '+module)
select('funcoes')
js("const d=[...document.querySelectorAll('.layered-details')].find(d=>d.textContent.includes('Intuição'));d.open=true;d.scrollIntoView({block:'nearest'})")
time.sleep(.2)
summary=js("return [...document.querySelectorAll('.layered-details > summary')].find(s=>s.textContent.includes('Intuição'))")['element-6066-11e4-a52e-4f735466cecf']
(OUT/'intuicao-depois.png').write_bytes(base64.b64decode(cmd('/element/'+summary+'/screenshot')))
select('trigonometria')
state(funcao='tg')
js('MathLabGraph.janela={xMin:10,xMax:20,yMin:-3,yMax:3};MathLabGraph.desenhar()')
check("MathLabGraph.config.assintotas.length>0 && MathLabGraph.config.assintotas.every(a=>a.valor>=10&&a.valor<=20)", 'Assíntotas acompanham o arrasto para fora da janela inicial')
js("MathLabGraph.pontoHover={x:1,y:2,rotulo:'curva anterior'}")
select('algebra')
check("MathLabGraph.pontoHover===null && !document.getElementById('graph-coords-pill').textContent.includes('curva anterior')", 'Trocar de modo limpa coordenadas da curva anterior')
select('trigonometria')
state(funcao='sen')
check('mathlabErros.length===0', 'Console sem erros JavaScript durante a execução')
(OUT/'layout-firefox-depois.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2))
(OUT/'console-firefox-depois.json').write_text(json.dumps(js('return mathlabErros'),ensure_ascii=False))
time.sleep(.25)
shot('trigonometria-depois')
for f in OUT.glob('*depois*'): shutil.copy2(f,ROOT/'docs/evidencias'/f.name)
print('SUCESSO: aceitação T1–T6 e varredura dos 11 modos no Firefox.')
