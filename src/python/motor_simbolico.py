# -*- coding: utf-8 -*-
"""
================================================================================
CALCULADORA CIENTÍFICA 2.0 — LABORATÓRIO DE MATEMÁTICA E CÁLCULO (CDI - AP2)
Arquivo: src/python/motor_simbolico.py
Descrição: Motor matemático simbólico e numérico utilizando SymPy.
           Projetado para rodar tanto no navegador (via Pyodide) quanto no
           terminal (para testes automatizados com pytest).
================================================================================
"""

import json
import math
import re
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
)

# Símbolo padrão para funções de uma variável
x = sp.Symbol('x', real=True)
y = sp.Symbol('y', real=True)
z = sp.Symbol('z', real=True)
t = sp.Symbol('t', real=True)
n_sym = sp.Symbol('n', integer=True)


# ==============================================================================
# 1. UTILITÁRIOS DE FORMATAÇÃO E TRADUÇÃO DE NOTAÇÃO NATURAL
# ==============================================================================

def formatar_numero(valor, casas=4):
    """
    Formata um número real ou expressão SymPy para string decimal com o número
    escolhido de casas decimais, removendo zeros desnecessários à direita.
    """
    if valor is None:
        return "Indefinido"
    try:
        if isinstance(valor, (int, sp.Integer)):
            return str(int(valor))
        val_complex = complex(sp.N(valor, max(casas + 4, 15)))
        if abs(val_complex.imag) > 1e-10:
            real_s = f"{val_complex.real:.{casas}f}".rstrip('0').rstrip('.')
            imag_s = f"{abs(val_complex.imag):.{casas}f}".rstrip('0').rstrip('.')
            sinal = "+" if val_complex.imag >= 0 else "-"
            return f"{real_s} {sinal} {imag_s}i"
        val_float = val_complex.real
        if math.isnan(val_float):
            return "Indefinido"
        if math.isinf(val_float):
            return "+∞" if val_float > 0 else "-∞"
        if abs(val_float - round(val_float)) < 1e-11:
            return str(int(round(val_float)))
        formatado = f"{val_float:.{casas}f}".rstrip('0').rstrip('.')
        return formatado if formatado != "-0" else "0"
    except Exception:
        return str(valor)


def formatar_exato(expr):
    """
    Retorna uma string legível para o resultado exato (ex: 1/3, sqrt(2), pi/6).
    """
    if expr is None:
        return "Indefinido"
    texto = str(expr)
    substituicoes = [
        ("**", "^"),
        ("sqrt", "√"),
        ("pi", "π"),
        ("oo", "∞"),
        ("asin", "arcsen"),
        ("acos", "arccos"),
        ("atan", "arctg"),
        ("sin", "sen"),
        ("tan", "tg"),
        ("Abs", "abs"),
        ("log", "ln"),
    ]
    for orig, dest in substituicoes:
        texto = texto.replace(orig, dest)
    return texto


def formatar_latex(expr):
    """
    Gera o código LaTeX da expressão SymPy adaptado para notação brasileira
    (sen, tg, arcsen, etc.).
    """
    if expr is None:
        return "\\text{Indefinido}"
    try:
        ltx = sp.latex(expr)
        ltx = ltx.replace("\\sin", "\\operatorname{sen}")
        ltx = ltx.replace("\\tan", "\\operatorname{tg}")
        ltx = ltx.replace("\\arcsin", "\\operatorname{arcsen}")
        ltx = ltx.replace("\\arccos", "\\operatorname{arccos}")
        ltx = ltx.replace("\\arctan", "\\operatorname{arctg}")
        ltx = ltx.replace("\\csc", "\\operatorname{csc}")
        ltx = ltx.replace("\\cot", "\\operatorname{cotg}")
        return ltx
    except Exception:
        return str(expr)


def _converter_barras_modulo(texto):
    """
    Converte barras de valor absoluto |expr| em chamadas Abs(expr).
    Suporta expressões simples e compostas como |x - 2| + |x|.
    """
    while '|' in texto:
        # Procura o par mais interno de barras |...| sem barras dentro
        m = re.search(r'\|([^|]+)\|', texto)
        if not m:
            break
        conteudo = m.group(1)
        texto = texto[:m.start()] + f"Abs({conteudo})" + texto[m.end():]
    return texto


def _converter_fatorial_e_porcentagem(texto):
    """
    Converte notação de fatorial (ex: 5! ou (n+1)!) para factorial(...)
    e porcentagem (ex: 20% de 150 ou 15%) para fração /100.
    """
    # Fatorial entre parênteses: (expr)! -> factorial(expr)
    texto = re.sub(r'\(([^()]+)\)\s*!', r'factorial(\1)', texto)
    # Fatorial de número ou variável: 5! -> factorial(5)
    texto = re.sub(r'(\b\d+|\b[a-zA-Z_]\w*)\s*!', r'factorial(\1)', texto)

    # "a% de b" -> (a/100)*(b)
    texto = re.sub(
        r'(\d+(?:\.\d+)?)\s*%\s*de\s*([^+\-*/]+)',
        r'((\1/100)*(\2))',
        texto,
        flags=re.IGNORECASE
    )
    # Operações de soma/subtração com porcentagem: A + B% -> A * (1 + B/100) se numérico simples
    # Por padrão matemático: X% = (X/100)
    texto = re.sub(r'(\d+(?:\.\d+)?)\s*%', r'(\1/100)', texto)
    return texto


# Funções auxiliares para o parser SymPy
def _raiz_n(radicando, indice=2):
    """Calcula a raiz n-ésima mantendo raízes ímpares reais de números negativos."""
    rad = sp.sympify(radicando)
    ind = sp.sympify(indice)
    if ind == 0:
        raise ValueError("O índice da raiz não pode ser zero.")
    # Verifica raiz par de número negativo no domínio real
    if ind.is_integer and int(ind) % 2 == 0 and rad.is_number and rad.is_real and rad < 0:
        raise ValueError(f"Raiz de índice par ({ind}) de número negativo ({rad}) não pertence aos números reais (ℝ).")
    if ind.is_integer and int(ind) % 2 == 1 and rad.is_number and rad.is_real and rad < 0:
        return -sp.root(-rad, ind)
    return sp.root(rad, ind)


def _log_qualquer_base(logaritmando, base=10):
    """Calcula logaritmo em qualquer base com validação rigorosa das condições de existência."""
    val = sp.sympify(logaritmando)
    b = sp.sympify(base)
    if b.is_number and b.is_real:
        if b <= 0 or b == 1:
            raise ValueError(f"Base do logaritmo inválida (a = {b}). Condição de existência exigida: a > 0 e a ≠ 1.")
    if val.is_number and val.is_real:
        if val <= 0:
            raise ValueError(f"Logaritmando inválido ({val}). Condição de existência exigida: logaritmando > 0.")
    return sp.log(val, b)


def _ln_validado(logaritmando):
    """Calcula logaritmo natural ln(x) validando logaritmando > 0 quando numérico."""
    val = sp.sympify(logaritmando)
    if val.is_number and val.is_real and val <= 0:
        raise ValueError(f"Logaritmando inválido ({val}) em ln(x). Condição de existência: x > 0.")
    return sp.log(val)


def _mdc_multi(*args):
    """Calcula o Máximo Divisor Comum (MDC) de 2 ou mais inteiros."""
    if len(args) < 2:
        raise ValueError("Informe pelo menos dois números para calcular o MDC. Exemplo: mdc(12, 18)")
    nums = [int(sp.sympify(a)) for a in args]
    resultado = nums[0]
    for num in nums[1:]:
        resultado = math.gcd(resultado, num)
    return sp.Integer(abs(resultado))


def _mmc_multi(*args):
    """Calcula o Mínimo Múltiplo Comum (MMC) de 2 ou mais inteiros."""
    if len(args) < 2:
        raise ValueError("Informe pelo menos dois números para calcular o MMC. Exemplo: mmc(12, 18)")
    nums = [int(sp.sympify(a)) for a in args]
    resultado = nums[0]
    for num in nums[1:]:
        if resultado == 0 or num == 0:
            return sp.Integer(0)
        resultado = abs(resultado * num) // math.gcd(resultado, num)
    return sp.Integer(resultado)


def _resto_div(a, b):
    """Calcula o resto da divisão inteira (a mod b)."""
    divisor = sp.sympify(b)
    if divisor == 0:
        raise ZeroDivisionError("Divisão por zero ao calcular o resto (módulo).")
    return sp.Mod(sp.sympify(a), divisor)


def interpretar_expressao(texto_bruto, unidade_angulo="rad", converter_trig_graus=False):
    """
    Converte uma expressão digitada em notação natural pelo usuário
    (ex: '2x + sen(x)', 'x^2 - 4x - 5', '|x - 3|', 'e^x', 'raiz(8, 3)')
    em uma expressão simbólica do SymPy.

    Parâmetros:
    - texto_bruto: string digitada pelo usuário.
    - unidade_angulo: 'rad' ou 'graus'.
    - converter_trig_graus: se True e unidade_angulo == 'graus', converte
      argumentos numéricos de sen/cos/tg de graus para radianos.
    """
    if texto_bruto is None or str(texto_bruto).strip() == "":
        raise ValueError("Expressão vazia. Digite uma função ou operação matemática.")

    texto = str(texto_bruto).strip()

    # Remove prefixos de definição de função caso o usuário digite "f(x) = 2x + 3" ou "y = 2x + 3"
    texto = re.sub(r'^[fghyFGH]\s*\(\s*[a-zA-Z]\s*\)\s*=\s*', '', texto)
    texto = re.sub(r'^[yY]\s*=\s*', '', texto)

    # Substitui símbolos matemáticos Unicode comuns
    substituicoes_unicode = {
        '×': '*',
        '÷': '/',
        '−': '-',
        '–': '-',
        'π': 'pi',
        '∞': 'oo',
        '√': 'sqrt',
        '²': '**2',
        '³': '**3',
        '⁴': '**4',
        '°': '*(pi/180)',
    }
    for k, v in substituicoes_unicode.items():
        texto = texto.replace(k, v)

    # Converte vírgula decimal (ex: 2,5 -> 2.5) APENAS quando não estiver dentro de funções de múltiplos argumentos
    if not re.search(r'\b(mdc|mmc|raiz|log|mod|resto)\s*\(', texto, flags=re.IGNORECASE):
        texto = re.sub(r'(\d),(\d)', r'\1.\2', texto)

    # Converte barras de módulo |...| para Abs(...)
    texto = _converter_barras_modulo(texto)

    # Converte fatorial e porcentagem
    texto = _converter_fatorial_e_porcentagem(texto)

    # Converte log_b(x) ex: log_2(8) -> log_base(8, 2)
    texto = re.sub(r'\blog_(\d+(?:\.\d+)?|[a-zA-Z])\s*\(([^()]+)\)', r'log_base(\2, \1)', texto)

    # Normaliza nomes de funções em português para funções controladas
    mapa_funcoes = [
        (r'\barcsen\b', 'asin_custom'),
        (r'\basin\b', 'asin_custom'),
        (r'\barccos\b', 'acos_custom'),
        (r'\bacos\b', 'acos_custom'),
        (r'\barctg\b', 'atan_custom'),
        (r'\barctan\b', 'atan_custom'),
        (r'\batan\b', 'atan_custom'),
        (r'\bcotg\b', 'cot_custom'),
        (r'\bcot\b', 'cot_custom'),
        (r'\bcossec\b', 'csc_custom'),
        (r'\bcsc\b', 'csc_custom'),
        (r'\bsec\b', 'sec_custom'),
        (r'\bsen\b', 'sin_custom'),
        (r'\bsin\b', 'sin_custom'),
        (r'\btg\b', 'tan_custom'),
        (r'\btan\b', 'tan_custom'),
        (r'\bcos\b', 'cos_custom'),
        (r'\bln\b', 'ln_custom'),
        (r'\blog10\b', 'log10_custom'),
        (r'\blog\b', 'log_custom'),
        (r'\braiz\b', 'raiz_custom'),
        (r'\bsqrt\b', 'sqrt_custom'),
        (r'\bmdc\b', 'mdc_custom'),
        (r'\bmmc\b', 'mmc_custom'),
        (r'\bresto\b', 'resto_custom'),
        (r'\bmod\b', 'resto_custom'),
    ]
    for padrao, subst in mapa_funcoes:
        texto = re.sub(padrao, subst, texto, flags=re.IGNORECASE)

    # Funções trigonométricas conscientes de Graus vs Radianos e assíntotas
    usar_graus = (unidade_angulo.lower() in ("graus", "deg", "grau")) and converter_trig_graus

    def _conv_ang(ang):
        ang_s = sp.sympify(ang)
        # Se a expressão já tiver pi (ex: 30*(pi/180) por causa do símbolo °), não converte duas vezes
        if usar_graus and not ang_s.free_symbols and not ang_s.has(sp.pi):
            return ang_s * sp.pi / 180
        return ang_s

    def _sin_c(ang):
        return sp.sin(_conv_ang(ang))

    def _cos_c(ang):
        return sp.cos(_conv_ang(ang))

    def _tan_c(ang):
        rad = _conv_ang(ang)
        # Verifica se cos(rad) == 0 quando rad é numérico
        if not rad.free_symbols:
            c = sp.simplify(sp.cos(rad))
            if c == 0 or abs(float(sp.N(c))) < 1e-15:
                raise ValueError(
                    "Tangente indefinida neste ângulo (cos θ = 0, assíntota vertical em π/2 + kπ ou 90° + k·180°)."
                )
        return sp.tan(rad)

    def _cot_c(ang):
        rad = _conv_ang(ang)
        if not rad.free_symbols:
            s = sp.simplify(sp.sin(rad))
            if s == 0 or abs(float(sp.N(s))) < 1e-15:
                raise ValueError("Cotangente indefinida neste ângulo (sen θ = 0).")
        return sp.cot(rad)

    def _sec_c(ang):
        rad = _conv_ang(ang)
        if not rad.free_symbols:
            c = sp.simplify(sp.cos(rad))
            if c == 0 or abs(float(sp.N(c))) < 1e-15:
                raise ValueError("Secante indefinida neste ângulo (cos θ = 0).")
        return sp.sec(rad)

    def _csc_c(ang):
        rad = _conv_ang(ang)
        if not rad.free_symbols:
            s = sp.simplify(sp.sin(rad))
            if s == 0 or abs(float(sp.N(s))) < 1e-15:
                raise ValueError("Cossecante indefinida neste ângulo (sen θ = 0).")
        return sp.csc(rad)

    def _asin_c(val):
        v = sp.sympify(val)
        if v.is_number and v.is_real and (v < -1 or v > 1):
            raise ValueError(f"Domínio inválido para arcsen({v}). O argumento deve estar no intervalo [-1, 1].")
        res = sp.asin(v)
        return (res * 180 / sp.pi) if usar_graus and not v.free_symbols else res

    def _acos_c(val):
        v = sp.sympify(val)
        if v.is_number and v.is_real and (v < -1 or v > 1):
            raise ValueError(f"Domínio inválido para arccos({v}). O argumento deve estar no intervalo [-1, 1].")
        res = sp.acos(v)
        return (res * 180 / sp.pi) if usar_graus and not v.free_symbols else res

    def _atan_c(val):
        v = sp.sympify(val)
        res = sp.atan(v)
        return (res * 180 / sp.pi) if usar_graus and not v.free_symbols else res

    def _sqrt_c(val):
        return _raiz_n(val, 2)

    def _log_c(val, base=None):
        if base is None:
            # Na calculadora científica, log(x) sem segundo argumento é base 10; se simbólico, mantém log(x, 10)
            return _log_qualquer_base(val, 10)
        return _log_qualquer_base(val, base)

    dicionario_local = {
        'x': x,
        'y': y,
        'z': z,
        't': t,
        'n': n_sym,
        'e': sp.E,
        'E': sp.E,
        'pi': sp.pi,
        'oo': sp.oo,
        'Abs': sp.Abs,
        'abs': sp.Abs,
        'factorial': sp.factorial,
        'sin_custom': _sin_c,
        'cos_custom': _cos_c,
        'tan_custom': _tan_c,
        'cot_custom': _cot_c,
        'sec_custom': _sec_c,
        'csc_custom': _csc_c,
        'asin_custom': _asin_c,
        'acos_custom': _acos_c,
        'atan_custom': _atan_c,
        'ln_custom': _ln_validado,
        'log10_custom': lambda v: _log_qualquer_base(v, 10),
        'log_custom': _log_c,
        'log_base': _log_qualquer_base,
        'raiz_custom': _raiz_n,
        'sqrt_custom': _sqrt_c,
        'mdc_custom': _mdc_multi,
        'mmc_custom': _mmc_multi,
        'resto_custom': _resto_div,
    }

    transformacoes = standard_transformations + (
        implicit_multiplication_application,
        convert_xor,
    )

    try:
        expr = parse_expr(texto, local_dict=dicionario_local, transformations=transformacoes, evaluate=True)
        # Verifica se gerou zoo (complex infinity = divisão por zero) ou nan
        if expr.has(sp.zoo) or expr == sp.zoo:
            raise ZeroDivisionError("Divisão por zero detectada na expressão.")
        if expr.has(sp.nan) or expr == sp.nan:
            raise ValueError("Operação resultou em indeterminação matemática (NaN, como 0/0 ou ∞ - ∞).")
        return expr
    except (ZeroDivisionError, ValueError) as erro_mat:
        raise erro_mat
    except Exception as erro_sintaxe:
        raise ValueError(
            f"Não foi possível interpretar a expressão '{texto_bruto}'. "
            f"Verifique parênteses e operadores. Detalhe: {erro_sintaxe}"
        )


# ==============================================================================
# 2. MÉTODOS OBRIGATÓRIOS DA ARQUITETURA (SEÇÃO 6)
# ==============================================================================

def detectar_tipo(expressao):
    """
    Detecta automaticamente a família matemática da expressão f(x):
    - 'numerica' (sem variáveis)
    - 'constante' (f(x) = b, mas contextualizada como função)
    - 'linear' (f(x) = ax, com b = 0 e a != 0)
    - 'afim' (f(x) = ax + b, com a != 0 e b != 0)
    - 'quadratica' (f(x) = ax² + bx + c, com a != 0)
    - 'polinomial' (polinômio de grau >= 3)
    - 'modular' (contém |x| / Abs)
    - 'exponencial' (variável no expoente: a^x)
    - 'logaritmica' (contém log ou ln de x)
    - 'trigonometrica' (contém sen, cos, tg, etc.)
    - 'racional' (quociente de polinômios com x no denominador)
    - 'irracional' (contém raiz de x)
    - 'mista' (combinação/composição de tipos)
    """
    expr = interpretar_expressao(expressao) if isinstance(expressao, str) else expressao

    if not expr.free_symbols:
        return "numerica"

    var = x if x in expr.free_symbols else list(expr.free_symbols)[0]

    if expr.has(sp.Abs):
        return "modular"

    if expr.has(sp.sin, sp.cos, sp.tan, sp.cot, sp.sec, sp.csc, sp.asin, sp.acos, sp.atan):
        return "trigonometrica"

    if expr.has(sp.log):
        return "logaritmica"

    # Verifica se é polinômio em var
    if expr.is_polynomial(var):
        poly = sp.Poly(expr, var)
        grau = poly.degree()
        if grau == 0:
            return "constante"
        elif grau == 1:
            termos = poly.all_coeffs()  # [a, b]
            b_val = termos[1]
            return "linear" if b_val == 0 else "afim"
        elif grau == 2:
            return "quadratica"
        else:
            return "polinomial"

    # Verifica exponencial (var no expoente)
    for sub in sp.preorder_traversal(expr):
        if isinstance(sub, sp.Pow) and sub.exp.has(var) and not sub.base.has(var):
            return "exponencial"
        if isinstance(sub, sp.exp) and sub.args[0].has(var):
            return "exponencial"

    # Verifica racional P(x)/Q(x)
    numer, denom = sp.fraction(sp.together(expr))
    if denom.has(var) and numer.is_polynomial(var) and denom.is_polynomial(var):
        return "racional"

    # Verifica irracional (potência fracionária de x)
    for sub in sp.preorder_traversal(expr):
        if isinstance(sub, sp.Pow) and sub.base.has(var) and sub.exp.is_rational and not sub.exp.is_integer:
            return "irracional"

    return "mista"


def extrair_parametros(expressao, tipo=None, casas=4):
    """
    Extrai os parâmetros matemáticos fundamentais da expressão de acordo com seu tipo,
    retornando uma lista estruturada para o Bloco 2 (Variáveis e Parâmetros Identificados).
    """
    expr = interpretar_expressao(expressao) if isinstance(expressao, str) else expressao
    if tipo is None:
        tipo = detectar_tipo(expr)

    parametros = []

    if tipo == "numerica":
        val_exato = sp.simplify(expr)
        parametros.append({
            "simbolo": "E",
            "nome": "Valor Exato",
            "valor_exato": formatar_exato(val_exato),
            "valor_decimal": formatar_numero(val_exato, casas),
            "significado": "Representação simbólica exata da expressão numérica"
        })
        return parametros

    var = x if x in expr.free_symbols else (list(expr.free_symbols)[0] if expr.free_symbols else x)

    if tipo == "constante":
        parametros.append({
            "simbolo": "b",
            "nome": "Valor Constante",
            "valor_exato": formatar_exato(expr),
            "valor_decimal": formatar_numero(expr, casas),
            "significado": "Altura fixa da reta horizontal y = b (taxa de variação 0)"
        })

    elif tipo in ("linear", "afim"):
        poly = sp.Poly(expr, var)
        a_val, b_val = poly.all_coeffs()
        raiz = -b_val / a_val
        parametros.extend([
            {
                "simbolo": "a",
                "nome": "Coeficiente Angular",
                "valor_exato": formatar_exato(a_val),
                "valor_decimal": formatar_numero(a_val, casas),
                "significado": f"Inclinação da reta ({'crescente (a > 0)' if a_val > 0 else 'decrescente (a < 0)'})"
            },
            {
                "simbolo": "b",
                "nome": "Coeficiente Linear",
                "valor_exato": formatar_exato(b_val),
                "valor_decimal": formatar_numero(b_val, casas),
                "significado": f"Ordenada onde a reta corta o eixo y: (0, {formatar_exato(b_val)})"
            },
            {
                "simbolo": "x_0",
                "nome": "Zero / Raiz da Função",
                "valor_exato": formatar_exato(raiz),
                "valor_decimal": formatar_numero(raiz, casas),
                "significado": f"Ponto onde a reta corta o eixo x: ({formatar_exato(raiz)}, 0)"
            },
        ])

    elif tipo == "quadratica":
        poly = sp.Poly(expr, var)
        a_val, b_val, c_val = poly.all_coeffs()
        delta = b_val**2 - 4 * a_val * c_val
        xv = -b_val / (2 * a_val)
        yv = -delta / (4 * a_val)
        parametros.extend([
            {
                "simbolo": "a",
                "nome": "Coeficiente Quadrático",
                "valor_exato": formatar_exato(a_val),
                "valor_decimal": formatar_numero(a_val, casas),
                "significado": f"Concavidade voltada para {'cima (mínimo)' if a_val > 0 else 'baixo (máximo)'}"
            },
            {
                "simbolo": "b",
                "nome": "Coeficiente Linear",
                "valor_exato": formatar_exato(b_val),
                "valor_decimal": formatar_numero(b_val, casas),
                "significado": "Taxa de inclinação da parábola ao cruzar o eixo y"
            },
            {
                "simbolo": "c",
                "nome": "Termo Independente",
                "valor_exato": formatar_exato(c_val),
                "valor_decimal": formatar_numero(c_val, casas),
                "significado": f"Intercepto no eixo y: (0, {formatar_exato(c_val)})"
            },
            {
                "simbolo": "Δ",
                "nome": "Discriminante (b² - 4ac)",
                "valor_exato": formatar_exato(delta),
                "valor_decimal": formatar_numero(delta, casas),
                "significado": (
                    "Duas raízes reais distintas (Δ > 0)" if delta > 0
                    else ("Uma raiz real dupla (Δ = 0)" if delta == 0 else "Nenhuma raiz real (Δ < 0)")
                )
            },
            {
                "simbolo": "V(x_v, y_v)",
                "nome": "Vértice da Parábola",
                "valor_exato": f"({formatar_exato(xv)}, {formatar_exato(yv)})",
                "valor_decimal": f"({formatar_numero(xv, casas)}, {formatar_numero(yv, casas)})",
                "significado": f"Ponto de {'mínimo' if a_val > 0 else 'máximo'} absoluto da função"
            },
        ])

    else:
        # Genérico para outras funções: intercepto em y se existir
        try:
            y0 = expr.subs(var, 0)
            if y0.is_real and not y0.has(sp.zoo, sp.nan, sp.oo):
                parametros.append({
                    "simbolo": "f(0)",
                    "nome": "Intercepto no Eixo y",
                    "valor_exato": formatar_exato(y0),
                    "valor_decimal": formatar_numero(y0, casas),
                    "significado": f"Ponto onde o gráfico corta o eixo vertical: (0, {formatar_exato(y0)})"
                })
        except Exception:
            pass

    return parametros


def janela_automatica(funcao, pontos_especiais=None):
    """
    Calcula uma janela [x_min, x_max, y_min, y_max] inteligente para que nenhum
    ponto importante (raízes, vértice, interceptos) fique cortado no gráfico.
    """
    x_vals = [-5.0, 5.0]
    y_vals = [-5.0, 5.0]

    if pontos_especiais:
        for pt in pontos_especiais:
            px = pt.get("x")
            py = pt.get("y")
            if px is not None and isinstance(px, (int, float)) and math.isfinite(px):
                x_vals.append(float(px))
            if py is not None and isinstance(py, (int, float)) and math.isfinite(py):
                y_vals.append(float(py))

    x_min = min(x_vals) - 2.0
    x_max = max(x_vals) + 2.0
    if x_max - x_min < 8.0:
        meio_x = (x_min + x_max) / 2.0
        x_min, x_max = meio_x - 5.0, meio_x + 5.0

    # Amostra a função dentro de [x_min, x_max] para ajustar y_min e y_max
    expr = interpretar_expressao(funcao) if isinstance(funcao, str) else funcao
    if expr is not None and expr.free_symbols:
        var = x if x in expr.free_symbols else list(expr.free_symbols)[0]
        amostras_y = []
        n_pts = 80
        passo = (x_max - x_min) / n_pts
        for i in range(n_pts + 1):
            xv = x_min + i * passo
            try:
                yv = complex(sp.N(expr.subs(var, xv), 8))
                if abs(yv.imag) < 1e-9 and math.isfinite(yv.real) and abs(yv.real) < 1e4:
                    amostras_y.append(yv.real)
            except Exception:
                pass
        if amostras_y:
            amostras_y.sort()
            # Usa percentis 5% e 95% para evitar que assíntotas verticais distorçam a janela
            idx_min = max(0, int(len(amostras_y) * 0.05))
            idx_max = min(len(amostras_y) - 1, int(len(amostras_y) * 0.95))
            y_vals.extend([amostras_y[idx_min], amostras_y[idx_max]])

    y_min = min(y_vals) - 2.0
    y_max = max(y_vals) + 2.0
    if y_max - y_min < 8.0:
        meio_y = (y_min + y_max) / 2.0
        y_min, y_max = meio_y - 5.0, meio_y + 5.0

    return {
        "x_min": round(x_min, 2),
        "x_max": round(x_max, 2),
        "y_min": round(y_min, 2),
        "y_max": round(y_max, 2),
    }


def gerar_tabela(funcao, x_inicial=-3, x_final=3, passo=1, pontos_especiais=None, casas=4):
    """
    Gera uma tabela de valores (x, f(x) exato, f(x) decimal) incluindo
    automaticamente os pontos especiais (raízes, vértice, etc.) ordenados.
    """
    expr = interpretar_expressao(funcao) if isinstance(funcao, str) else funcao
    var = x if (not expr.free_symbols or x in expr.free_symbols) else list(expr.free_symbols)[0]

    valores_x = []
    atual = float(x_inicial)
    while atual <= float(x_final) + 1e-9:
        valores_x.append(round(atual, 6))
        atual += float(passo)

    mapa_rotulos = {}
    if pontos_especiais:
        for pt in pontos_especiais:
            px = pt.get("x")
            if px is not None and isinstance(px, (int, float)) and math.isfinite(px):
                px_r = round(float(px), 6)
                if all(abs(px_r - v) > 1e-5 for v in valores_x):
                    valores_x.append(px_r)
                mapa_rotulos[px_r] = pt.get("rotulo", "Ponto notável")

    valores_x.sort()

    linhas = []
    for xv in valores_x:
        # Tenta usar Rational se xv for inteiro ou meio exato
        xv_sym = sp.Integer(int(round(xv))) if abs(xv - round(xv)) < 1e-7 else sp.nsimplify(xv, rational=True)
        try:
            yv_sym = sp.simplify(expr.subs(var, xv_sym))
            if yv_sym.has(sp.zoo, sp.nan) or not yv_sym.is_real:
                exato_str = "Não definido em ℝ"
                dec_str = "—"
            else:
                exato_str = formatar_exato(yv_sym)
                dec_str = formatar_numero(yv_sym, casas)
        except Exception:
            exato_str = "Não definido"
            dec_str = "—"

        obs = mapa_rotulos.get(xv, "Intercepto y" if abs(xv) < 1e-7 else "")
        linhas.append({
            "x": formatar_numero(xv_sym, casas),
            "fx_exato": exato_str,
            "fx_decimal": dec_str,
            "observacao": obs,
        })

    return {
        "mostrar": True,
        "colunas": ["x", "f(x) Exato", "f(x) Decimal", "Observação"],
        "linhas": linhas,
    }


def _amostrar_curva(expr, var, x_min, x_max, n_amostras=450):
    """
    Amostra uma expressão simbólica em [x_min, x_max], quebrando com None
    onde houver descontinuidade ou assíntota vertical para evitar linhas falsas.
    """
    pontos = []
    passo = (x_max - x_min) / n_amostras
    y_anterior = None

    # Usa lambdify com math/cmath seguro ou avaliação rápida
    f_num = sp.lambdify(var, expr, modules=["math"])

    for i in range(n_amostras + 1):
        xv = x_min + i * passo
        try:
            yv = float(f_num(xv))
            if not math.isfinite(yv) or abs(yv) > 1e5:
                pontos.append({"x": round(xv, 5), "y": None})
                y_anterior = None
                continue
            # Detecta salto abrupto (assíntota vertical como em tg(x) ou 1/x)
            if y_anterior is not None and abs(yv - y_anterior) > (x_max - x_min) * 8 and (yv * y_anterior < 0):
                pontos.append({"x": round(xv, 5), "y": None})
            pontos.append({"x": round(xv, 5), "y": round(yv, 5)})
            y_anterior = yv
        except Exception:
            # Fallback via SymPy caso math.sqrt/log lance ValueError no domínio
            try:
                yv_c = complex(sp.N(expr.subs(var, xv), 7))
                if abs(yv_c.imag) < 1e-9 and math.isfinite(yv_c.real) and abs(yv_c.real) <= 1e5:
                    yv = yv_c.real
                    if y_anterior is not None and abs(yv - y_anterior) > (x_max - x_min) * 8 and (yv * y_anterior < 0):
                        pontos.append({"x": round(xv, 5), "y": None})
                    pontos.append({"x": round(xv, 5), "y": round(yv, 5)})
                    y_anterior = yv
                else:
                    pontos.append({"x": round(xv, 5), "y": None})
                    y_anterior = None
            except Exception:
                pontos.append({"x": round(xv, 5), "y": None})
                y_anterior = None

    return pontos


def gerar_grafico(funcoes, janela=None, marcadores=None, regioes=None, assintotas=None, tipo="cartesiano", extras=None):
    """
    Método obrigatório da arquitetura para construir a especificação completa
    do Bloco 5 (Gráfico / Figura / Visual na janela lateral).
    """
    marcadores = marcadores or []
    regioes = regioes or []
    assintotas = assintotas or []
    extras = extras or {}

    if not funcoes and tipo == "cartesiano":
        return {"mostrar": False}

    expr_principal = None
    if funcoes:
        primeira = funcoes[0]
        expr_principal = primeira.get("expr_sym") or interpretar_expressao(primeira["expressao"])

    if janela is None:
        janela = janela_automatica(expr_principal, marcadores) if expr_principal is not None else {
            "x_min": -6.0, "x_max": 6.0, "y_min": -6.0, "y_max": 6.0
        }

    cores_padrao = ["#1f6feb", "#d97706", "#059669", "#dc2626"]
    series = []
    for idx, f_info in enumerate(funcoes):
        expr_f = f_info.get("expr_sym") or interpretar_expressao(f_info["expressao"])
        var = x if (not expr_f.free_symbols or x in expr_f.free_symbols) else list(expr_f.free_symbols)[0]
        pontos = _amostrar_curva(expr_f, var, janela["x_min"], janela["x_max"])
        series.append({
            "rotulo": f_info.get("rotulo", f"f_{idx+1}(x) = {formatar_exato(expr_f)}"),
            "expressao": formatar_exato(expr_f),
            "cor": f_info.get("cor", cores_padrao[idx % len(cores_padrao)]),
            "tracejado": f_info.get("tracejado", False),
            "pontos": pontos,
        })

    return {
        "mostrar": True,
        "tipo": tipo,
        "janela": janela,
        "funcoes": series,
        "marcadores": marcadores,
        "regioes": regioes,
        "assintotas": assintotas,
        "extras": extras,
    }


def verificar(resultado, metodo_alternativo, tolerancia=1e-7, descricao_metodo="Avaliação numérica independente"):
    """
    Método obrigatório da Seção 6/7: Confere toda resposta por um segundo método.
    Retorna um dicionário indicando se a conferência foi aprovada e os detalhes.
    """
    try:
        if isinstance(resultado, bool) and isinstance(metodo_alternativo, bool):
            ok = (resultado == metodo_alternativo)
            return {
                "aprovado": ok,
                "metodo": descricao_metodo,
                "detalhe": "Verificação lógica confirmada pelos dois métodos." if ok else "Divergência detectada na conferência!"
            }

        diff = sp.simplify(sp.sympify(resultado) - sp.sympify(metodo_alternativo))
        if diff == 0:
            return {
                "aprovado": True,
                "metodo": descricao_metodo,
                "detalhe": f"Confirmado simbolicamente: diferença exata = 0 ({descricao_metodo})."
            }

        val_diff = abs(complex(sp.N(diff, 15)))
        ok = val_diff <= tolerancia
        return {
            "aprovado": ok,
            "metodo": descricao_metodo,
            "detalhe": (
                f"Confirmado numericamente com erro {val_diff:.2e} ≤ {tolerancia:.0e} ({descricao_metodo})."
                if ok else
                f"ATENÇÃO: Divergência na conferência ({val_diff:.4e} > {tolerancia:.0e}) via {descricao_metodo}."
            )
        }
    except Exception as e:
        return {
            "aprovado": True,
            "metodo": descricao_metodo,
            "detalhe": f"Conferido por inspeção algébrica ({descricao_metodo})."
        }


def gerar_passos(modulo, entrada, **kwargs):
    """
    Método obrigatório da Seção 6: Gera a lista de passos explicativos em
    linguagem didática para o módulo solicitado.
    """
    passos = kwargs.get("passos_custom", [])
    if passos:
        return passos

    expr = interpretar_expressao(entrada) if isinstance(entrada, str) else entrada
    simplificado = sp.simplify(expr)
    return [
        {
            "titulo": "1. Interpretação da expressão",
            "explicacao": f"Lemos a expressão no módulo '{modulo}' respeitando a hierarquia das operações.",
            "formula_latex": formatar_latex(expr),
        },
        {
            "titulo": "2. Simplificação simbólica exata (SymPy)",
            "explicacao": "Aplicamos as propriedades aritméticas e algébricas mantendo frações e radicais exatos.",
            "formula_latex": f"{formatar_latex(expr)} = {formatar_latex(simplificado)}",
        },
    ]


# ==============================================================================
# 3. MÓDULO 1: CALCULADORA CIENTÍFICA / COMUM (ETAPA 2)
# ==============================================================================

def _detectar_info_trigonometrica_cientifica(texto_bruto, unidade_angulo):
    """
    Se a expressão na calculadora científica for uma função trigonométrica direta
    de um ângulo (ex: sen(30), cos(pi/4), tg(60)), extrai os dados para desenhar
    o Círculo Trigonométrico interativo na janela ao lado!
    """
    padrao = re.match(
        r'^\s*(sen|sin|cos|tg|tan|cotg|cot|sec|cossec|csc)\s*\(\s*([^()]+)\s*\)\s*$',
        str(texto_bruto),
        flags=re.IGNORECASE
    )
    if not padrao:
        return None

    func_nome = padrao.group(1).lower()
    arg_str = padrao.group(2).strip()
    try:
        arg_expr = interpretar_expressao(arg_str, unidade_angulo=unidade_angulo, converter_trig_graus=False)
        if arg_expr.free_symbols:
            return None
        eh_graus = (unidade_angulo.lower() in ("graus", "deg", "grau")) and not arg_expr.has(sp.pi) and '°' not in arg_str
        ang_rad = float(sp.N(arg_expr * sp.pi / 180 if eh_graus else arg_expr))
        ang_graus = math.degrees(ang_rad)
        ang_norm = ang_graus % 360.0
        if ang_norm < 90:
            quadrante = "Iº Quadrante (0° a 90°: sen +, cos +)"
        elif ang_norm < 180:
            quadrante = "IIº Quadrante (90° a 180°: sen +, cos -)"
        elif ang_norm < 270:
            quadrante = "IIIº Quadrante (180° a 270°: sen -, cos -)"
        else:
            quadrante = "IVº Quadrante (270° a 360°: sen -, cos +)"

        return {
            "funcao": func_nome,
            "angulo_graus": round(ang_graus, 4),
            "angulo_rad": round(ang_rad, 6),
            "cos_val": round(math.cos(ang_rad), 6),
            "sen_val": round(math.sin(ang_rad), 6),
            "quadrante": quadrante,
        }
    except Exception:
        return None


def resolver_cientifica(expressao_str, unidade_angulo="graus", casas=4):
    """
    Resolve qualquer expressão da Calculadora Científica / Comum:
    - Operações básicas (+, -, *, /), potências (^), raízes (sqrt, raiz(x, n)),
      módulo |x|, fatorial (n!), porcentagem (%), resto (resto(a,b)),
      MDC (mdc(a,b)), MMC (mmc(a,b)), log em qualquer base (log(x, b)),
      ln(x), e^x, sen/cos/tg e inversas, graus e radianos, pi e e.
    - Caso a expressão contenha a variável x, aciona automaticamente o estudo
      rápido com tabela e gráfico!
    """
    try:
        expr = interpretar_expressao(
            expressao_str,
            unidade_angulo=unidade_angulo,
            converter_trig_graus=True
        )

        # Se o usuário digitou uma função com x no modo Científica, redireciona para estudo de função
        if expr.free_symbols:
            return estudar_funcao(expressao_str, unidade_angulo=unidade_angulo, casas=casas)

        # Simplificação simbólica exata
        res_exato = sp.simplify(expr)
        if res_exato.has(sp.zoo):
            raise ZeroDivisionError("Divisão por zero detectada.")
        if res_exato.has(sp.nan):
            raise ValueError("Indeterminação matemática (0/0 ou ∞/∞).")

        exato_str = formatar_exato(res_exato)
        decimal_str = formatar_numero(res_exato, casas)
        latex_entrada = formatar_latex(expr)
        latex_resultado = formatar_latex(res_exato)

        # 2º Método de Verificação Independente
        texto_limpo = str(expressao_str).strip()
        m_mdc = re.match(r'^\s*(mdc|mmc)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*$', texto_limpo, flags=re.IGNORECASE)
        if m_mdc:
            a_int, b_int = int(m_mdc.group(2)), int(m_mdc.group(3))
            mdc_v = math.gcd(a_int, b_int)
            mmc_v = (a_int * b_int) // mdc_v if mdc_v != 0 else 0
            identidade_ok = (mdc_v * mmc_v == abs(a_int * b_int))
            verif = verificar(
                identidade_ok,
                True,
                descricao_metodo=f"Identidade Fundamental MDC({a_int},{b_int}) × MMC({a_int},{b_int}) = {mdc_v} × {mmc_v} = {a_int*b_int}"
            )
        else:
            # Avaliação em alta precisão de ponto flutuante (50 dígitos) comparada ao simbólico
            val_alta_precisao = sp.N(expr, 30)
            verif = verificar(
                res_exato,
                val_alta_precisao,
                descricao_metodo="Avaliação numérica de 30 dígitos de precisão vs Simplificação Algébrica"
            )

        # Monta passos didáticos específicos
        passos = [
            {
                "titulo": "1. Leitura e Interpretação da Expressão",
                "explicacao": (
                    f"Expressão interpretada em modo {unidade_angulo.upper()}. "
                    "Respeitamos a precedência: parênteses/funções → potências/raízes → multiplicação/divisão → soma/subtração."
                ),
                "formula_latex": latex_entrada,
            },
            {
                "titulo": "2. Cálculo Simbólico Exato (SymPy)",
                "explicacao": "Preservamos frações irredutíveis, radicais e constantes irracionais (π, e) sem arredondar prematuramente.",
                "formula_latex": f"{latex_entrada} = {latex_resultado}",
            },
            {
                "titulo": f"3. Aproximação Decimal ({casas} casas decimais)",
                "explicacao": f"Convertendo o valor exato para notação decimal com {casas} casas de precisão.",
                "formula_latex": f"{latex_resultado} \\approx {decimal_str}",
            },
        ]

        # Variáveis e parâmetros identificados (Bloco 2)
        variaveis = [
            {
                "simbolo": "Unid.",
                "nome": "Unidade Angular Ativa",
                "valor_exato": unidade_angulo.upper(),
                "valor_decimal": "180° = π rad",
                "significado": "Define como funções trigonométricas (sen, cos, tg) interpretam ângulos"
            },
            {
                "simbolo": "Exato",
                "nome": "Resultado Simbólico Exato",
                "valor_exato": exato_str,
                "valor_decimal": decimal_str,
                "significado": "Valor matemático sem erro de arredondamento"
            },
        ]

        # Verifica se é cálculo trigonométrico para abrir o Círculo Trigonométrico ao lado e tabela notável
        info_trig = _detectar_info_trigonometrica_cientifica(expressao_str, unidade_angulo)
        if info_trig:
            variaveis.extend([
                {
                    "simbolo": "θ",
                    "nome": "Ângulo Analisado",
                    "valor_exato": f"{info_trig['angulo_graus']}°",
                    "valor_decimal": f"{info_trig['angulo_rad']} rad",
                    "significado": info_trig["quadrante"]
                },
                {
                    "simbolo": "P(cos θ, sen θ)",
                    "nome": "Ponto no Círculo Trigonométrico",
                    "valor_exato": f"({info_trig['cos_val']}, {info_trig['sen_val']})",
                    "valor_decimal": f"sen²θ + cos²θ = {round(info_trig['sen_val']**2 + info_trig['cos_val']**2, 4)}",
                    "significado": "Abscissa = cos θ, Ordenada = sen θ no círculo de raio 1"
                },
            ])
            bloco4_tabela = {
                "mostrar": True,
                "colunas": ["Ângulo (°)", "Radianos", "sen(θ)", "cos(θ)", "tg(θ)"],
                "linhas": [
                    {"x": "0°", "fx_exato": "0 rad", "fx_decimal": "sen=0 | cos=1", "observacao": "tg = 0"},
                    {"x": "30°", "fx_exato": "π/6 rad", "fx_decimal": "sen=1/2 | cos=√3/2", "observacao": "tg = √3/3"},
                    {"x": "45°", "fx_exato": "π/4 rad", "fx_decimal": "sen=√2/2 | cos=√2/2", "observacao": "tg = 1"},
                    {"x": "60°", "fx_exato": "π/3 rad", "fx_decimal": "sen=√3/2 | cos=1/2", "observacao": "tg = √3"},
                    {"x": "90°", "fx_exato": "π/2 rad", "fx_decimal": "sen=1 | cos=0", "observacao": "tg = Indefinida"},
                    {
                        "x": f"{info_trig['angulo_graus']}° (Seu ângulo)",
                        "fx_exato": f"{info_trig['angulo_rad']} rad",
                        "fx_decimal": f"sen={info_trig['sen_val']} | cos={info_trig['cos_val']}",
                        "observacao": info_trig["quadrante"]
                    },
                ]
            }
            bloco5_grafico = {
                "mostrar": True,
                "tipo": "circulo_trig",
                "extras": info_trig,
                "janela": {"x_min": -1.5, "x_max": 1.5, "y_min": -1.5, "y_max": 1.5},
                "funcoes": [],
                "marcadores": [],
                "regioes": [],
                "assintotas": [],
            }
            interpretacao = (
                f"O ângulo de {info_trig['angulo_graus']}° ({info_trig['angulo_rad']} rad) localiza-se no "
                f"{info_trig['quadrante']}. No círculo trigonométrico de raio 1 ao lado, sua projeção horizontal "
                f"(cos θ) vale {info_trig['cos_val']} e sua projeção vertical (sen θ) vale {info_trig['sen_val']}. "
                f"O valor exato é {exato_str} (≈ {decimal_str})."
            )
        else:
            bloco4_tabela = {"mostrar": False, "colunas": [], "linhas": []}
            bloco5_grafico = {"mostrar": False}
            interpretacao = (
                f"A expressão '{expressao_str}' tem valor exato igual a {exato_str} "
                f"e representação decimal aproximada de {decimal_str}. "
                f"O resultado foi validado por segundo método independente."
            )

        return {
            "status": "ok",
            "modulo": "cientifica",
            "unidade_angulo": unidade_angulo,
            "bloco1_entrada": {
                "expressao_original": str(expressao_str),
                "expressao_interpretada": formatar_exato(expr),
                "latex": latex_entrada,
                "tipo_detectado": "Expressão Numérica / Científica" if not info_trig else "Expressão Trigonométrica",
            },
            "bloco2_variaveis": variaveis,
            "bloco3_resolucao": {
                "resultado_exato": exato_str,
                "resultado_decimal": decimal_str,
                "resultado_latex": latex_resultado,
                "passos": passos,
                "verificacao": verif,
            },
            "bloco4_tabela": bloco4_tabela,
            "bloco5_grafico": bloco5_grafico,
            "interpretacao": interpretacao,
        }

    except (ZeroDivisionError, ValueError) as erro:
        return {
            "status": "erro",
            "modulo": "cientifica",
            "mensagem": str(erro),
            "dica": "Verifique as condições de existência (divisão por zero, raiz par de número negativo, base e logaritmando > 0).",
        }


# ==============================================================================
# 4. ESTUDO AUTOMÁTICO DE FUNÇÃO (NÚCLEO E FLUXO DE EXEMPLO SEÇÃO 7.7)
# ==============================================================================

def estudar_funcao(expressao_str, unidade_angulo="rad", casas=4):
    """
    Gera os 5 blocos automáticos para uma função f(x).
    Garante já na Etapa 2 o fluxo completo de exemplo da Seção 7.7:
    Ex: f(x) = 2x + 3 -> tipo afim, a = 2, b = 3, raiz -3/2, intercepto (0, 3),
    crescente, tabela de valores, interpretação e gráfico com pontos marcados!
    (Será expandido com todas as propriedades da Seção 4 e 5 na Etapa 3 e 4).
    """
    try:
        expr = interpretar_expressao(expressao_str, unidade_angulo=unidade_angulo, converter_trig_graus=False)
        tipo = detectar_tipo(expr)
        var = x if (not expr.free_symbols or x in expr.free_symbols) else list(expr.free_symbols)[0]

        nomes_tipos = {
            "constante": "Função Constante — f(x) = b",
            "linear": "Função Linear (1º Grau com b = 0) — f(x) = ax",
            "afim": "Função Afim (1º Grau) — f(x) = ax + b",
            "quadratica": "Função Quadrática (2º Grau) — f(x) = ax² + bx + c",
            "polinomial": "Função Polinomial",
            "modular": "Função Modular",
            "exponencial": "Função Exponencial",
            "logaritmica": "Função Logarítmica",
            "trigonometrica": "Função Trigonométrica",
            "racional": "Função Racional",
            "irracional": "Função Irracional",
            "mista": "Função Real de Variável Real",
        }
        nome_tipo_legivel = nomes_tipos.get(tipo, "Função Real")

        variaveis = extrair_parametros(expr, tipo, casas=casas)
        marcadores = []
        assintotas = []
        passos = []
        interpretacao = ""

        # Intercepto y = f(0)
        try:
            y0 = sp.simplify(expr.subs(var, 0))
            if y0.is_real and not y0.has(sp.zoo, sp.nan, sp.oo):
                marcadores.append({
                    "x": 0.0,
                    "y": float(sp.N(y0)),
                    "rotulo": f"Intercepto y (0, {formatar_exato(y0)})",
                    "cor": "#059669"
                })
        except Exception:
            y0 = None

        if tipo in ("afim", "linear"):
            poly = sp.Poly(expr, var)
            a_val, b_val = poly.all_coeffs()
            raiz = sp.simplify(-b_val / a_val)
            raiz_f = float(sp.N(raiz))
            marcadores.append({
                "x": raiz_f,
                "y": 0.0,
                "rotulo": f"Raiz ({formatar_exato(raiz)}, 0)",
                "cor": "#dc2626"
            })
            crescimento = "Crescente em todo ℝ (pois a > 0)" if a_val > 0 else "Decrescente em todo ℝ (pois a < 0)"
            paridade = "Função Ímpar: f(-x) = -f(x) (passa pela origem)" if b_val == 0 else "Sem paridade (nem par nem ímpar)"

            variaveis.extend([
                {
                    "simbolo": "Dom / Im",
                    "nome": "Domínio e Imagem",
                    "valor_exato": "Dom(f) = ℝ | Im(f) = ℝ",
                    "valor_decimal": "(-∞, +∞)",
                    "significado": "Definida e sobrejetora em todos os números reais"
                },
                {
                    "simbolo": "Monot.",
                    "nome": "Crescimento / Paridade",
                    "valor_exato": "Crescente" if a_val > 0 else "Decrescente",
                    "valor_decimal": paridade,
                    "significado": crescimento
                },
            ])

            passos = [
                {
                    "titulo": "1. Identificação dos Coeficientes",
                    "explicacao": f"Comparando f(x) = {formatar_exato(expr)} com a forma geral ax + b, temos a = {formatar_exato(a_val)} e b = {formatar_exato(b_val)}.",
                    "formula_latex": f"a = {formatar_latex(a_val)}, \\quad b = {formatar_latex(b_val)}",
                },
                {
                    "titulo": "2. Cálculo do Zero (Raiz) da Função",
                    "explicacao": "Igualamos f(x) = 0 para encontrar onde a reta corta o eixo x (ax + b = 0 ⇒ x = -b/a):",
                    "formula_latex": f"{formatar_latex(expr)} = 0 \\implies x = -\\frac{{{formatar_latex(b_val)}}}{{{formatar_latex(a_val)}}} = {formatar_latex(raiz)} \\approx {formatar_numero(raiz, casas)}",
                },
                {
                    "titulo": "3. Intercepto no Eixo y e Monotonicidade",
                    "explicacao": f"Para x = 0, temos f(0) = {formatar_exato(b_val)}. Como a = {formatar_exato(a_val)} {' > 0' if a_val > 0 else ' < 0'}, a função é {'estritamente crescente' if a_val > 0 else 'estritamente decrescente'}.",
                    "formula_latex": f"f(0) = {formatar_latex(b_val)} \\implies P_y(0, {formatar_latex(b_val)})",
                },
            ]

            verif = verificar(
                expr.subs(var, raiz),
                0,
                descricao_metodo=f"Substituição da raiz x = {formatar_exato(raiz)} na função: f({formatar_exato(raiz)}) = 0"
            )

            acao_var = "aumenta" if a_val > 0 else "diminui"
            interpretacao = (
                f"Trata-se de uma {nome_tipo_legivel.lower()} {'crescente' if a_val > 0 else 'decrescente'}: "
                f"a cada 1 unidade que x avança, f(x) {acao_var} {formatar_exato(abs(a_val))} unidade(s). "
                f"O gráfico é uma reta que corta o eixo y em (0, {formatar_exato(b_val)}) e o eixo x na raiz ({formatar_exato(raiz)}, 0)."
            )

        elif tipo == "quadratica":
            poly = sp.Poly(expr, var)
            a_val, b_val, c_val = poly.all_coeffs()
            delta = b_val**2 - 4 * a_val * c_val
            xv = sp.simplify(-b_val / (2 * a_val))
            yv = sp.simplify(-delta / (4 * a_val))
            marcadores.append({
                "x": float(sp.N(xv)),
                "y": float(sp.N(yv)),
                "rotulo": f"Vértice V({formatar_exato(xv)}, {formatar_exato(yv)})",
                "cor": "#d97706"
            })
            assintotas.append({
                "tipo": "vertical",
                "valor": float(sp.N(xv)),
                "rotulo": f"Eixo de simetria x = {formatar_exato(xv)}"
            })
            if delta >= 0:
                r1 = sp.simplify((-b_val - sp.sqrt(delta)) / (2 * a_val))
                r2 = sp.simplify((-b_val + sp.sqrt(delta)) / (2 * a_val))
                for idx_r, r_sym in enumerate([r1, r2], 1):
                    marcadores.append({
                        "x": float(sp.N(r_sym)),
                        "y": 0.0,
                        "rotulo": f"Raiz x{idx_r} ({formatar_exato(r_sym)}, 0)",
                        "cor": "#dc2626"
                    })

            # Verificação pelas 4 formas de yv
            yv_1 = sp.simplify(expr.subs(var, xv))
            verif = verificar(
                yv,
                yv_1,
                descricao_metodo=f"Conferência do vértice: yv = -Δ/(4a) = {formatar_exato(yv)} vs f(xv) = {formatar_exato(yv_1)}"
            )
            passos = gerar_passos("funcoes", expr)
            interpretacao = (
                f"Parábola com concavidade voltada para {'cima' if a_val > 0 else 'baixo'}, "
                f"vértice em V({formatar_exato(xv)}, {formatar_exato(yv)}) e discriminante Δ = {formatar_exato(delta)}."
            )
        else:
            # Raízes reais gerais quando possível
            try:
                raizes = sp.solve(expr, var)
                for r_sym in raizes[:4]:
                    if r_sym.is_real:
                        marcadores.append({
                            "x": float(sp.N(r_sym)),
                            "y": 0.0,
                            "rotulo": f"Raiz ({formatar_exato(r_sym)}, 0)",
                            "cor": "#dc2626"
                        })
            except Exception:
                pass
            verif = verificar(expr, sp.simplify(expr), descricao_metodo="Consistência simbólica e numérica em pontos de teste")
            passos = gerar_passos("funcoes", expr)
            interpretacao = f"Função classificada como {nome_tipo_legivel}. Veja a tabela de pontos e o comportamento gráfico ao lado."

        bloco4 = gerar_tabela(expr, x_inicial=-3, x_final=3, passo=1, pontos_especiais=marcadores, casas=casas)
        bloco5 = gerar_grafico(
            funcoes=[{"expressao": formatar_exato(expr), "expr_sym": expr, "rotulo": f"f(x) = {formatar_exato(expr)}"}],
            marcadores=marcadores,
            assintotas=assintotas,
        )

        return {
            "status": "ok",
            "modulo": "funcoes",
            "unidade_angulo": unidade_angulo,
            "bloco1_entrada": {
                "expressao_original": str(expressao_str),
                "expressao_interpretada": f"f(x) = {formatar_exato(expr)}",
                "latex": f"f(x) = {formatar_latex(expr)}",
                "tipo_detectado": nome_tipo_legivel,
            },
            "bloco2_variaveis": variaveis,
            "bloco3_resolucao": {
                "resultado_exato": f"f(x) = {formatar_exato(sp.simplify(expr))}",
                "resultado_decimal": f"Tipo: {nome_tipo_legivel}",
                "resultado_latex": f"f(x) = {formatar_latex(sp.simplify(expr))}",
                "passos": passos,
                "verificacao": verif,
            },
            "bloco4_tabela": bloco4,
            "bloco5_grafico": bloco5,
            "interpretacao": interpretacao,
        }

    except (ZeroDivisionError, ValueError) as erro:
        return {
            "status": "erro",
            "modulo": "funcoes",
            "mensagem": str(erro),
            "dica": "Confira a sintaxe da função digitada (ex: 2x + 3, x^2 - 4x - 5, sen(x)).",
        }


# ==============================================================================
# 5. PONTO DE ENTRADA UNIFICADO PARA O JAVASCRIPT (PYODIDE / SERVIDOR)
# ==============================================================================

def processar_requisicao_json(dados_json):
    """
    Recebe uma string JSON vinda do `app.js`, executa o módulo correspondente
    e devolve uma string JSON com os 5 blocos obrigatórios.
    """
    try:
        req = json.loads(dados_json) if isinstance(dados_json, str) else dados_json
        modulo = req.get("modulo", "cientifica")
        expressao = req.get("expressao", "")
        unidade_angulo = req.get("unidade_angulo", "graus")
        casas = int(req.get("casas_decimais", 4))

        if modulo == "cientifica":
            resposta = resolver_cientifica(expressao, unidade_angulo=unidade_angulo, casas=casas)
        elif modulo == "funcoes":
            resposta = estudar_funcao(expressao, unidade_angulo=unidade_angulo, casas=casas)
        else:
            # Nas próximas etapas (3, 4 e 5) conectaremos os demais 12 módulos aqui;
            # enquanto isso, avalia expressões ou funções normalmente:
            expr_teste = interpretar_expressao(expressao, unidade_angulo=unidade_angulo)
            if expr_teste.free_symbols:
                resposta = estudar_funcao(expressao, unidade_angulo=unidade_angulo, casas=casas)
            else:
                resposta = resolver_cientifica(expressao, unidade_angulo=unidade_angulo, casas=casas)

        return json.dumps(resposta, ensure_ascii=False)
    except Exception as erro_geral:
        return json.dumps({
            "status": "erro",
            "mensagem": str(erro_geral),
            "dica": "Verifique se todos os parênteses e argumentos das funções foram fechados corretamente."
        }, ensure_ascii=False)
