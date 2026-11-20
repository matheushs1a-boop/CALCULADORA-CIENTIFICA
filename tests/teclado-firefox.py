"""Aceitação do teclado em Firefox real. Usa o geckodriver da suíte existente."""
import atexit
import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.request
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

BASE = os.environ.get('MATHLAB_WEBDRIVER', 'http://127.0.0.1:4444')
URL = os.environ.get('MATHLAB_URL', (Path(__file__).resolve().parents[1] / 'index.html').as_uri())
partes = urlsplit(URL)
consulta = parse_qsl(partes.query, keep_blank_values=True)
URL = urlunsplit(partes._replace(query=urlencode([*consulta, ('sem-abertura', '')])))


def request(path, data=None, method=None):
    body = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(BASE + path, body, {'Content-Type': 'application/json'}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.load(response)['value']
    except urllib.error.HTTPError as error:
        raise RuntimeError(error.read().decode()) from error


session = request('/session', {'capabilities': {'alwaysMatch': {
    'browserName': 'firefox', 'moz:firefoxOptions': {'args': ['-headless']}
}}})['sessionId']
session_path = '/session/' + session
atexit.register(lambda: request(session_path, method='DELETE'))


def call(path, data=None):
    return request(session_path + path, data)


def js(script, *args):
    return call('/execute/sync', {'script': script, 'args': args})


def click(selector):
    js("""document.querySelector(arguments[0])?.scrollIntoView({block:'center', inline:'nearest', behavior:'instant'});""", selector)
    element = call('/element', {'using': 'css selector', 'value': selector})
    call('/element/' + next(iter(element.values())) + '/click', {})


def keys(*events):
    call('/actions', {'actions': [{'type': 'key', 'id': 'teclado', 'actions': [
        {'type': kind, 'value': value} for kind, value in events
    ]}]})


def press(value):
    keys(('keyDown', value), ('keyUp', value))


def field(value, start=None, end=None):
    start = len(value) if start is None else start
    js("""const i = document.querySelector('#sci-expr-input, #normal-mode-input');
          i.focus(); i.value = arguments[0]; i.dispatchEvent(new Event('input', {bubbles: true}));
          const atual = document.getElementById(i.id);
          atual.focus(); atual.setSelectionRange(arguments[1], arguments[2]);""",
       value, start, start if end is None else end)


def status():
    return js("""const i = document.querySelector('#sci-expr-input, #normal-mode-input');
        const secondary = document.querySelector('#sci-res-secondary, .result-secondary');
        return {
            campo: i.value, foco: document.activeElement === i,
            cursor: i.selectionStart, selecao: i.selectionEnd,
            resultado: document.querySelector('#sci-res-primary')?.textContent.trim() ?? '',
            decimal: secondary && !secondary.hidden ? secondary.textContent.trim() : '',
            mensagem: document.querySelector('.state-banner-desc')?.textContent.trim() ?? '',
            anel: !!document.querySelector('.key-btn:focus-visible')
        };""")


def module(name):
    js("document.querySelector('[data-module=' + arguments[0] + ']').click()", name)
    if name != 'cientifica':
        if not js("return !!document.querySelector('#normal-mode-input')"):
            click('[data-switch-imode=normal]')
        if js("return !!document.querySelector('#teclado-funcao:not([open])')"):
            click('#teclado-funcao summary')


def log(*values):
    print(json.dumps(values, ensure_ascii=False), flush=True)


def check(name, **expected):
    actual = status()
    passed = all(actual[k] == value for k, value in expected.items())
    log(name, 'PASSOU' if passed else 'FALHOU', actual)
    if not passed:
        failures.append(name)


reciprocal = '[data-key-act=inverse], [data-key-ins="1/("]'
equals = '[data-key-act=eval]'
failures = []
call('/url', {'url': URL})
js("""const script = document.createElement('script');
    script.textContent = 'window.appTeclado = MathLabApp; window.graficoTeclado = MathLabGraph;';
    document.head.append(script); script.remove();""")
module('cientifica')

if '--matriz' in sys.argv:
    for mode in ['cientifica', 'funcoes', 'limites', 'derivadas', 'integrais']:
        module(mode)
        buttons = js("""return [...document.querySelectorAll('.key-btn')].map(b => [
            b.textContent.trim(), b.getAttributeNames().find(k => k.startsWith('data-key-'))
        ]).map(([name, attr], index) => [name, attr, document.querySelectorAll('.key-btn')[index].getAttribute(attr)]);""")
        if not buttons:
            log(mode, 'Sem teclado neste modo')
            continue
        if mode in ['limites', 'derivadas', 'integrais']:
            field('')
            click(reciprocal)
            log(mode, '1/x', 'vazio', 'mouse', status())
            continue
        for label, attr, value in buttons:
            selector = '[' + attr + '=' + json.dumps(value, ensure_ascii=False) + ']'
            contexts = [('vazio', '', 0, 0), ('texto', '2+3', 3, 3), ('resultado', '4+4', 3, 3),
                        ('seleção', '3+4', 2, 3), ('meio', '34', 1, 1)]
            for context, entry, start, end in contexts:
                for method in ['mouse', 'teclado']:
                    field(entry, start, end)
                    if context == 'resultado':
                        click(equals)
                        if mode != 'cientifica' and js("return !!document.querySelector('#teclado-funcao:not([open])')"):
                            click('#teclado-funcao summary')
                    if method == 'mouse':
                        click(selector)
                    else:
                        js('document.querySelector(arguments[0]).focus()', selector)
                        press('\ue007')
                    actual = status()
                    log(mode, label, context, method, actual)
                    if not actual['foco'] or actual['anel']:
                        failures.append(f'{mode} / {label} / {context} / {method}')
    sys.exit('Falhas de foco: ' + ', '.join(failures) if failures else 0)

for value, exact, decimal in [
    ('4', '1/4', '0,25'), ('0,5', '2', '2'), ('2/3', '3/2', '1,5'),
    ('2+3', '1/5', '0,2'), ('−2', '−1/2', '-0,5'), ('1/(4)', '4', '4'),
    ('0,25', '4', '4'), ('1,5', '2/3', '0,6667')
]:
    field(value)
    click(reciprocal)
    click(equals)
    expected = {'campo': f'1/({value})', 'resultado': exact, 'foco': True}
    expected['decimal'] = f'(≈ {decimal})'
    check(value, **expected)

field('0')
click(reciprocal)
click(equals)
check('zero', campo='1/(0)', resultado='Erro', foco=True,
      mensagem='Não existe inverso de zero: divisão por zero')

field('')
click(reciprocal)
check('vazio', campo='1/(', foco=True, cursor=3)
field('4+4')
click(equals)
assert js("return window.appTeclado.state.historico[0].expressao") == '4+4'
click(reciprocal)
check('resultado 8', campo='1/(8)', resultado='1/8', decimal='(≈ 0,125)', foco=True)
field('3+4', 2, 3)
click(reciprocal)
check('seleção', campo='3+1/(4)', foco=True, cursor=7)
field('4')
click(reciprocal)
check('mouse', campo='1/(4)', foco=True, anel=False, cursor=5)
keys(('keyDown', '\ue009'), ('keyDown', 'z'), ('keyUp', 'z'), ('keyUp', '\ue009'))
check('desfazer', campo='4', foco=True)

field('4')
js('document.querySelector(arguments[0]).previousElementSibling.focus()', reciprocal)
press('\ue004')
ring = js("""const a = document.activeElement;
    return a.textContent.trim() === '1/x' && a.matches(':focus-visible') && getComputedStyle(a).outlineStyle === 'solid';""")
log('Tab', 'PASSOU' if ring else 'FALHOU', ring)
if not ring:
    failures.append('Tab')
press('\ue007')
check('Enter', campo='1/(4)', foco=True)

for expression, result in [('200*15', '30'), ('50', '1/2'), ('200+10', '220'), ('200−10', '180')]:
    field(expression)
    click('[data-key-act=percent]')
    click(equals)
    check(expression + '%', resultado=result, campo=expression + '%', foco=True)

for label, selector, expression, start, end, result, cursor in [
    ('dígito no meio', '[data-key-ins="7"]', '34', 1, 1, '374', 2),
    ('troca da seleção', '[data-key-ins="7"]', '34', 0, 2, '7', 1),
    ('função vazia', '[data-key-fn="sen("]', '', 0, 0, 'sen()', 4),
    ('função com seleção', '[data-key-fn="cos("]', '3+4', 2, 3, '3+cos(4)', 8),
    ('quadrado', '[data-key-act=square]', '2+3', 3, 3, '(2+3)^2', 7),
    ('expoente', '[data-key-act=power]', '4', 1, 1, '4^', 2),
    ('sinal', '[data-key-act=sign]', '2+3', 3, 3, '−(2+3)', 6),
    ('backspace', '[data-key-act=back]', 'sen() + 4', 4, 4, ' + 4', 0),
    ('limpar', '[data-key-act=clear]', '2+3', 1, 1, '', 0)
]:
    field(expression, start, end)
    click(selector)
    check(label, campo=result, cursor=cursor, foco=True)

field('')
digit = '[data-key-ins="7"]'
element = call('/element', {'using': 'css selector', 'value': digit})
js("document.querySelector(arguments[0]).scrollIntoView({block:'center'})", digit)
call('/actions', {'actions': [{'type': 'pointer', 'id': 'mouse',
    'parameters': {'pointerType': 'mouse'}, 'actions': [
        {'type': 'pointerMove', 'origin': element, 'x': 0, 'y': 0, 'duration': 0},
        *[{'type': kind, 'button': 0} for _ in range(3) for kind in ['pointerDown', 'pointerUp']]
    ]}]})
check('três cliques seguidos', campo='777', foco=True, cursor=3)

for value, selector, expected in [('2', '[data-key-ins="π"]', '2π'), ('2', '[data-key-ins="e"]', '2·e')]:
    field(value)
    click(selector)
    check('constante ' + expected, campo=expected, foco=True)
    assert status()['resultado'] != 'Erro'
field('0')
click('[data-key-act=power]')
click('[data-key-ins="0"]')
click(equals)
check('0⁰', campo='0^0', resultado='Erro', foco=True)
assert 'indeterminada' in status()['mensagem']

field('4+4')
click(equals)
click('[data-key-fn="cos("]')
check('função após resultado', campo='cos(8)', foco=True)
field('')
click('[data-key-act=ans]')
check('Ans', campo='8', foco=True)
field('1/8')
click('[data-key-mem="m+"]')
assert js("return !document.getElementById('sci-mem').hidden")
field('')
click('[data-key-mem=mr]')
check('MR', campo='0,125', foco=True)
click('[data-key-mem="m-"]')
assert js("return document.getElementById('sci-mem').hidden")
click('[data-key-mem=mc]')

for mode in ['funcoes', 'limites', 'derivadas', 'integrais']:
    module(mode)
    field('')
    if js("return !!document.querySelector('#teclado-funcao:not([open])')"):
        click('#teclado-funcao summary')
    click(reciprocal)
    check(mode + ' vazio', campo='1/x', foco=True, cursor=3)
    if mode != 'funcoes':
        continue
    hyperbola = js("""const g=window.appTeclado.obterDadosAtuaisFuncoes().grafico;
        const f=g.curvas[0]?.fn;
        return [f?.(-2), !Number.isFinite(f?.(0)), f?.(2), g.assintotas?.map(a=>[a.tipo,a.valor])];""")
    log('hipérbole', hyperbola)
    if hyperbola != [-0.5, True, 0.5, [['horizontal', 0], ['vertical', 0]]]:
        failures.append('hipérbole')
    no_bridge = js("""const graph = window.graficoTeclado;
        const pole = graph.xParaPx(0);
        let previous, crosses = 0;
        graph.desenharCurva({
            save() {}, restore() {}, beginPath() {}, stroke() {},
            moveTo(x) { previous = x; },
            lineTo(x) { if (previous < pole && x >= pole) crosses++; previous = x; }
        }, graph.config.curvas[0]);
        return graph.config.assintotas.length === 2 && crosses === 0;""")
    log('curva não cruza o polo', no_bridge)
    if not no_bridge:
        failures.append('traçado da hipérbole')
    field('x²+1')
    click(reciprocal)
    check('função com conteúdo', campo='1/(x²+1)', foco=True, cursor=8)
    maximum = js("""const d=window.appTeclado.obterDadosAtuaisFuncoes();const f=d.grafico.curvas[0]?.fn;
        return [d.estudoCompleto.dominio,d.estudoCompleto.extremos,f?.(-2),f?.(0),f?.(2)];""")
    log('domínio e máximo', maximum)
    if maximum != ['ℝ', 'Máximo 1 em x = 0', 0.2, 1, 0.2]:
        failures.append('domínio e máximo')

module('funcoes')
field('2+3', 1, 2)
click(equals)
check('igual em Funções', campo='2+3', foco=True, cursor=1, selecao=2)
assert js("return window.appTeclado.state.historico[0].expressao") == '2+3'

if failures:
    sys.exit('Falhas: ' + ', '.join(failures))
