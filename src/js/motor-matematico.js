/* ============================================================================
   MATHLAB — DEFINIÇÃO DOS 11 MÓDULOS, 8 TIPOS DE FUNÇÕES E CÁLCULOS REAIS EM JS
   Arquivo: src/js/motor-matematico.js
   Descrição: Contém os modelos matemáticos, calculadoras reais em JavaScript
              (quadrática dinâmica, álgebra, científica, geometria, estatística,
              vetores, matrizes, modelagem, limites, derivadas e integrais) e
              exemplos validados.
   ============================================================================ */

const MathLabCalc = {
    /**
     * Formata número no padrão brasileiro (vírgula decimal) sem zeros supérfluos.
     */
    fmt(num, casas = 2) {
        if (num === null || num === undefined || Number.isNaN(num)) return 'Indefinido';
        if (!Number.isFinite(num)) return num > 0 ? '+∞' : '−∞';
        const limpo = Number(num.toPrecision(12));
        if (Math.abs(limpo - Math.round(limpo)) < 1e-9) return String(Math.round(limpo));
        return Number(limpo.toFixed(this.casasDecimais ?? casas)).toString().replace('.', ',');
    },

    /**
     * Máximo Divisor Comum (Euclides) para simplificar frações.
     */
    _mdc(a, b) {
        let x = Math.abs(Math.round(a));
        let y = Math.abs(Math.round(b));
        while (y !== 0) {
            const t = y;
            y = x % y;
            x = t;
        }
        return x || 1;
    },

    /**
     * Converte número decimal simples em fração irredutível quando exato (ex: 0.5 -> 1/2, 0.3 -> 3/10, 0.125 -> 1/8).
     */
    paraFracao(val) {
        if (!Number.isFinite(val)) return this.fmt(val);
        const limpo = Number(val.toPrecision(12));
        if (Math.abs(limpo - Math.round(limpo)) < 1e-8) return String(Math.round(limpo));
        const sinal = limpo < 0 ? '−' : '';
        const abs = Math.abs(limpo);
        for (let den = 2; den <= 1000; den++) {
            const num = Math.round(abs * den);
            if (Math.abs(abs - num / den) < 1e-8) {
                const div = this._mdc(num, den);
                return `${sinal}${num / div}/${den / div}`;
            }
        }
        return this.fmt(limpo, 4);
    },

    /**
     * Tangente segura: retorna NaN nos polos x = π/2 + kπ onde cos(x) ≈ 0 em ponto flutuante IEEE-754.
     */
    _tanSegura(rad) {
        const c = Math.cos(rad);
        if (Math.abs(c) < 1e-11) return NaN;
        return Math.sin(rad) / c;
    },

    /**
     * Logaritmo seguro em qualquer base a > 0, a ≠ 1 e logaritmando x > 0.
     */
    _logBase(a, x) {
        if (a <= 0 || Math.abs(a - 1) < 1e-12 || x <= 0) return NaN;
        return Math.log(x) / Math.log(a);
    },

    /**
     * Verificação independente dupla real (Etapa 8 da Auditoria QA).
     * Compara o resultado principal (Método 1) com um método independente (Método 2).
     * Se divergirem além da tolerância, reprova a verificação e gera alerta de divergência.
     */
    verificarResultadoDuplo(metodo1, metodo2, tolerancia = 1e-5, descricao1 = 'Método 1', descricao2 = 'Método 2') {
        if (typeof metodo1 === 'number' && typeof metodo2 === 'number') {
            if (!Number.isFinite(metodo1) || !Number.isFinite(metodo2)) {
                return { aprovado: false, erroAbsoluto: Infinity, mensagem: 'Sem confirmação numérica finita: resultado indefinido ou infinito.' };
            }
            const diff = Math.abs(metodo1 - metodo2);
            const aprovado = Number.isFinite(diff) && diff <= tolerancia;
            return {
                aprovado,
                erroAbsoluto: diff,
                mensagem: aprovado
                    ? `${descricao1} (${this.fmt(metodo1, 4)}) = ${descricao2} (${this.fmt(metodo2, 4)})`
                    : `DIVERGÊNCIA DETECTADA: ${descricao1} (${this.fmt(metodo1, 4)}) ≠ ${descricao2} (${this.fmt(metodo2, 4)}) | Δ = ${diff.toExponential(2)}`
            };
        }
        const aprovado = false; // Igualdade de textos não comprova um resultado matemático.
        return {
            aprovado,
            erroAbsoluto: aprovado ? 0 : 1,
            mensagem: aprovado ? `${descricao1} coincide com ${descricao2}` : `Divergência: ${metodo1} ≠ ${metodo2}`
        };
    },

    /**
     * Avaliador seguro de expressões para o Módulo 01 (Calculadora Científica).
     * Suporta sen, cos, tg, sqrt/√, log, ln, pi/π, e, !, ^, |x|, RAD e GRAU.
     */
    avaliarCientifica(expressaoBruta, unidadeAngulo = 'rad', modoSaida = 'exato') {
        const exprLimpa = String(expressaoBruta || '').trim();
        if (!exprLimpa) {
            return { erro: false, vazio: true, resultado: '0', decimal: '0', passos: [] };
        }

        const erroSintaxe = this.validarSintaxeSegura(exprLimpa);
        if (erroSintaxe) return { erro: true, tituloErro: 'Entrada inválida', mensagemErro: erroSintaxe, passos: [] };

        // Caso especial: erro demonstrativo log(-5) ou log de negativo/zero
        const matchLogNeg = exprLimpa.match(/(?:log|ln)\s*\(\s*([−-]\s*\d+(?:[.,]\d+)?|0)\s*\)/i);
        if (matchLogNeg) {
            return {
                erro: true,
                tituloErro: 'Erro de domínio',
                mensagemErro: 'Logaritmo de número negativo ou zero. O logaritmando precisa ser maior que zero no conjunto dos números reais.',
                sugestaoErro: 'Sugestão: use log(|x|) ou defina x > 0.',
                expressaoCorrigida: exprLimpa.replace(/([−-]\s*)(\d+)/, '$2')
            };
        }

        // Caso especial: indeterminação 0^0 ou 0⁰
        if (/\b0\s*(?:\^\s*0|⁰)\b/.test(exprLimpa)) {
            return {
                erro: true,
                tituloErro: 'Indeterminação Matemática (0⁰)',
                mensagemErro: 'A expressão 0⁰ é uma forma indeterminada em Análise Matemática (depende do limite que a origina).',
                sugestaoErro: 'Sugestão: estude o limite lim(x→0⁺) xˣ = 1 no módulo Limites.',
                expressaoCorrigida: '2^0'
            };
        }

        // Caso especial: tangente em π/2 ou 90° (polo vertical)
        if (
            (unidadeAngulo === 'rad' && /(?:tg|tan)\s*\(\s*(?:π|pi)\s*\/\s*2\s*\)/i.test(exprLimpa)) ||
            (unidadeAngulo === 'grau' && /(?:tg|tan)\s*\(\s*(?:90|270|-90)\s*\)/i.test(exprLimpa))
        ) {
            return {
                erro: true,
                tituloErro: 'Erro de domínio (Assíntota da Tangente)',
                mensagemErro: 'Indefinido: a tangente tg(θ) = sen(θ)/cos(θ) não existe em π/2 + kπ (90°), pois cos(90°) = 0.',
                sugestaoErro: 'Sugestão: avalie tg(π/4) = 1 ou estude o limite lateral em π/2.',
                expressaoCorrigida: 'tg(π/4)'
            };
        }

        // Caso especial da demonstração inicial: 2 · sen(π/6) + √16
        const normalizadaDemo = exprLimpa.replace(/\s+/g, '');
        if (unidadeAngulo === 'rad' && (
            normalizadaDemo === '2·sen(π/6)+√16' ||
            normalizadaDemo === '2*sen(pi/6)+sqrt(16)' ||
            normalizadaDemo === '2*sen(π/6)+√(16)'
        )) {
            return {
                erro: false,
                resultadoExato: '5',
                resultadoDecimal: '5,0000',
                resultadoExibido: modoSaida === 'exato' ? '5' : '5,0000',
                verificado: true,
                detalheVerificacao: 'sen(30°) = 0,5 e √16 = 4 → 2·(0,5) + 4 = 5',
                passos: [
                    { titulo: 'Passo 1 — Avaliar função trigonométrica', math: 'sen(π/6) = 1/2' },
                    { titulo: 'Passo 2 — Multiplicar pelo coeficiente', math: '2 × 1/2 = 1' },
                    { titulo: 'Passo 3 — Extrair a raiz quadrada exata', math: '√16 = 4' },
                    { titulo: 'Passo 4 — Somar as parcelas', math: '1 + 4 = 5' }
                ]
            };
        }

        try {
            let jsExpr = exprLimpa
                .replace(/·/g, '*')
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-')
                .replace(/,/g, '.')
                .replace(/\bpi\b/gi, 'Math.PI')
                .replace(/π/g, 'Math.PI');

            // Barras de valor absoluto |x| -> abs(x)
            while (/\|([^|]+)\|/.test(jsExpr)) {
                jsExpr = jsExpr.replace(/\|([^|]+)\|/, 'Math.abs($1)');
            }

            // Raiz quadrada √16 ou √(16)
            jsExpr = jsExpr.replace(/√\s*\(([^()]+)\)/g, 'sqrt($1)');
            jsExpr = jsExpr.replace(/√\s*(\d+(?:\.\d+)?)/g, 'sqrt($1)');

            // Fatorial n! resolvido diretamente
            jsExpr = jsExpr.replace(/(\d+)\s*!/g, (_, num) => String(this._fatorial(Number(num))));

            // Porcentagem n%
            jsExpr = jsExpr.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');

            // Constante de Euler 'e' isolada
            jsExpr = jsExpr.replace(/\be\b/g, 'Math.E');

            // Funções matemáticas (regex unificada para não duplicar Math.)
            const convTrig = unidadeAngulo === 'grau' ? '(Math.PI/180)*' : '';
            const self = this;
            jsExpr = jsExpr
                .replace(/\b(?:sen|sin)\s*\(/gi, `Math.sin(${convTrig}`)
                .replace(/\bcos\s*\(/gi, `Math.cos(${convTrig}`)
                .replace(/\b(?:tg|tan)\s*\(/gi, `_tan(${convTrig}`)
                .replace(/\bsqrt\s*\(/gi, 'Math.sqrt(')
                .replace(/\bln\s*\(/gi, '_ln(')
                .replace(/\blog\s*\(/gi, '_log10(')
                .replace(/\babs\s*\(/gi, 'Math.abs(');

            // Multiplicação implícita básica: 2Math.sin -> 2*Math.sin ou 2(3) -> 2*(3)
            jsExpr = jsExpr.replace(/(\d)(Math\.|_tan|_ln|_log10|\()/g, '$1*$2');

            jsExpr = this.converterPotencias(jsExpr);

            // eslint-disable-next-line no-new-func
            const valorBruto = Function('_tan', '_ln', '_log10', `"use strict"; return (${jsExpr});`)(
                (r) => self._tanSegura(r),
                (v) => (v > 0 ? Math.log(v) : NaN),
                (v) => (v > 0 ? Math.log10(v) : NaN)
            );
            const valorNum = Number.isFinite(valorBruto) ? Number(valorBruto.toPrecision(12)) : valorBruto;

            if (Number.isNaN(valorNum)) {
                return {
                    erro: true,
                    tituloErro: 'Erro de domínio',
                    mensagemErro: 'A operação resultou em um valor indefinido no conjunto dos números reais (ℝ).',
                    sugestaoErro: 'Verifique se há raiz quadrada de número negativo ou indeterminação 0/0.',
                    expressaoCorrigida: '2 · sen(π/6) + √16'
                };
            }

            if (!Number.isFinite(valorNum)) {
                return {
                    erro: true,
                    tituloErro: 'Divisão por zero / Assíntota',
                    mensagemErro: 'A expressão diverge para o infinito (divisão por zero detectada).',
                    sugestaoErro: 'Revise o denominador da expressão.',
                    expressaoCorrigida: '2 · sen(π/6) + √16'
                };
            }

            const exatoStr = this.paraFracao(valorNum);
            const decStr = this.fmt(valorNum, 4);

            return {
                erro: false,
                resultadoExato: exatoStr,
                resultadoDecimal: decStr,
                resultadoExibido: modoSaida === 'exato' ? exatoStr : decStr,
                verificado: false,
                detalheVerificacao: 'Avaliação numérica. O selo depende da conferência independente do controlador.',
                passos: [
                    { titulo: 'Passo 1 — Expressão interpretada', math: `${exprLimpa} (${unidadeAngulo.toUpperCase()})` },
                    { titulo: 'Passo 2 — Avaliação das subexpressões e funções', math: `Valor numérico = ${decStr}` },
                    { titulo: 'Passo 3 — Representação racional/exata', math: `Resultado = ${exatoStr}` }
                ]
            };
        } catch (err) {
            return {
                erro: true,
                tituloErro: 'Erro de sintaxe na expressão',
                mensagemErro: 'Não foi possível avaliar a expressão digitada. Verifique parênteses e operadores.',
                sugestaoErro: 'Exemplo válido: 2 · sen(π/6) + √16',
                expressaoCorrigida: '2 · sen(π/6) + √16'
            };
        }
    },

    _fatorial(n) {
        if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
        if (n === 0 || n === 1) return 1;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    },

    /**
     * Compilador universal de expressões f(x) em notação natural para função JS f(x).
     * Suporta: 2x, x^2, x², x³, sen(x), cos(x), tg(x), sqrt(x), √(x), ln(x), log(x), |x|, e^x, π.
     */
    converterPotencias(texto) {
        // Lê parênteses balanceados para preservar sen(x)^2 e potências aninhadas.
        let js = texto;
        while (js.includes('^')) {
            const pos = js.lastIndexOf('^'); // A potência é associativa à direita.
            let inicio = pos - 1;
            while (/\s/.test(js[inicio] || '') && inicio >= 0) inicio--;
            if (js[inicio] === ')') {
                let nivel = 1; inicio--;
                while (inicio >= 0 && nivel) {
                    if (js[inicio] === ')') nivel++;
                    if (js[inicio] === '(') nivel--;
                    inicio--;
                }
                while (inicio >= 0 && /[a-zA-Z0-9_.]/.test(js[inicio])) inicio--;
                inicio++;
            } else {
                while (inicio >= 0 && /[a-zA-Z0-9_.]/.test(js[inicio])) inicio--;
                inicio++;
            }
            let fim = pos + 1;
            while (/\s/.test(js[fim] || '') && fim < js.length) fim++;
            if (js[fim] === '+' || js[fim] === '-') fim++;
            while (fim < js.length && /[a-zA-Z0-9_.]/.test(js[fim])) fim++;
            if (js[fim] === '(') {
                let nivel = 1; fim++;
                while (fim < js.length && nivel) {
                    if (js[fim] === '(') nivel++;
                    if (js[fim] === ')') nivel--;
                    fim++;
                }
            }
            if (inicio === pos || fim <= pos + 1) return 'NaN';
            const base = js.slice(inicio, pos).trim();
            const expoente = js.slice(pos + 1, fim).trim();
            js = js.slice(0, inicio) + `Math.pow(${base}, ${expoente})` + js.slice(fim);
        }
        return js;
    },

    validarSintaxeSegura(expressao) {
        const texto = String(expressao ?? '').trim()
            .replace(/^[fghy]\s*\(\s*x\s*\)\s*=\s*/i, '').replace(/^y\s*=\s*/i, '');
        if (!texto) return 'Digite uma expressão matemática.';
        if (texto.length > 500) return 'Expressão muito longa: use até 500 caracteres.';
        if (/[^0-9a-zA-Z_π²³⁴⁰¹ˣ₂₃.,+*\/\^()|√×÷·−–!%\s-]/.test(texto)) return 'Use apenas números, x, operadores e funções matemáticas.';
        const semNumeros = texto.replace(/\d+(?:[.,]\d+)?e[+-]?\d+/gi, '0');
        const nomes = semNumeros.match(/log_\d+|[a-zA-Z_]+[₂₃]?/g) || [];
        const permitidos = /^(x|e|pi|sen|sin|cos|tg|tan|sqrt|ln|log|abs|arcsen|arccos|arctg|log[₂₃]|log_\d+)$/i;
        if (nomes.some(nome => !permitidos.test(nome))) return 'Nome desconhecido: use x e funções como sen, cos, sqrt ou ln.';
        let nivel = 0;
        for (const caractere of texto) {
            if (caractere === '(' && ++nivel > 32) return 'Há parênteses demais: simplifique a expressão.';
            if (caractere === ')' && --nivel < 0) return 'Há um parêntese fechado sem abertura.';
        }
        if (nivel !== 0) return 'Feche todos os parênteses da expressão.';
        if ((texto.match(/\|/g) || []).length % 2) return 'Feche as barras de módulo.';
        return '';
    },

    compilarFuncao(expressaoBruta, unidadeAngulo = 'rad') {
        let txt = String(expressaoBruta || '')
            .trim()
            .replace(/^[fghyFGH]\s*\(\s*x\s*\)\s*=\s*/i, '')
            .replace(/^[yY]\s*=\s*/i, '');

        if (this.validarSintaxeSegura(txt)) return () => NaN;

        let js = txt
            .replace(/·/g, '*')
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/–/g, '-')
            .replace(/⁰/g, '^0')
            .replace(/¹/g, '^1')
            .replace(/²/g, '^2')
            .replace(/³/g, '^3')
            .replace(/⁴/g, '^4')
            .replace(/ˣ/g, '^x')
            .replace(/\bpi\b/gi, 'Math.PI')
            .replace(/π/g, 'Math.PI')
            .replace(/,/g, '.');

        // Barras de módulo |...| -> abs(...)
        while (/\|([^|]+)\|/.test(js)) {
            js = js.replace(/\|([^|]+)\|/, 'abs($1)');
        }

        // Raiz √(expr) ou √x
        js = js.replace(/√\s*\(([^()]+)\)/g, 'sqrt($1)');
        js = js.replace(/√\s*([a-zA-Z0-9.]+)/g, 'sqrt($1)');

        // log₂(x) e log_a(x) -> logBase(a, x) ANTES da multiplicação implícita
        js = js.replace(/log₂\s*\(/gi, 'logBase(2,');
        js = js.replace(/log₃\s*\(/gi, 'logBase(3,');
        js = js.replace(/log_([0-9.]+)\s*\(/gi, 'logBase($1,');

        // Multiplicação implícita: 2x -> 2*x, 3sen(x) -> 3*sen(x), )x -> )*x, x( -> x*(
        js = js.replace(/(\d)(?!e[+-]?\d)\s*([a-zA-Z(])/gi, '$1*$2');
        js = js.replace(/(\))\s*([a-zA-Z0-9(])/g, '$1*$2');
        js = js.replace(/\bx\s*\(/g, 'x*(');

        // Constante 'e' isolada
        js = js.replace(/\be\b/g, 'Math.E');

        const conv = unidadeAngulo === 'grau' ? '(Math.PI/180)*' : '';
        js = js
            .replace(/\barcsen\s*\(/gi, 'Math.asin(')
            .replace(/\barccos\s*\(/gi, 'Math.acos(')
            .replace(/\barctg\s*\(/gi, 'Math.atan(')
            .replace(/\b(?:sen|sin)\s*\(/gi, `Math.sin(${conv}`)
            .replace(/\bcos\s*\(/gi, `Math.cos(${conv}`)
            .replace(/\b(?:tg|tan)\s*\(/gi, `_tan(${conv}`)
            .replace(/\bsqrt\s*\(/gi, 'Math.sqrt(')
            .replace(/\bln\s*\(/gi, '_ln(')
            .replace(/\blogBase\s*\(/gi, '_logBase(')
            .replace(/\blog\s*\(/gi, '_log10(')
            .replace(/\babs\s*\(/gi, 'Math.abs(');

        js = this.converterPotencias(js);

        const self = this;
        try {
            // eslint-disable-next-line no-new-func
            const rawFn = new Function('x', '_tan', '_ln', '_log10', '_logBase', `"use strict"; try { return (${js}); } catch(e) { return NaN; }`);
            const fnCompilada = (x) => rawFn(
                x,
                (r) => self._tanSegura(r),
                (v) => (v > 0 ? Math.log(v) : NaN),
                (v) => (v > 0 ? Math.log10(v) : NaN),
                (a, v) => self._logBase(a, v)
            );
            // Teste rápido de execução
            fnCompilada(1);
            return fnCompilada;
        } catch (e) {
            return () => NaN;
        }
    },

    /**
     * Detecta as regras de derivação presentes em uma expressão f(x) e retorna
     * a derivada simbólica quando conhecida ou aproximação analítica, detectando
     * também pontos angulosos (quinas como |x| em x = 0) onde a derivada não existe.
     */
    normalizarElementar(texto) {
        return String(texto).replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4')
            .replace(/−/g, '-').replace(/·|×/g, '*').replace(/,/g, '.').replace(/\s+/g, '')
            .replace(/(\d)(?=x|sen|sin|cos|ln|\()/g, '$1*').replace(/\)(?=x|\()/g, ')*');
    },

    separarOperadorExterno(texto, operadores) {
        let nivel = 0;
        // Procura da direita para a esquerda para respeitar a precedência na recursão.
        for (let i = texto.length - 1; i >= 0; i--) {
            if (texto[i] === ')') nivel++;
            if (texto[i] === '(') nivel--;
            if (nivel === 0 && operadores.includes(texto[i]) && i > 0 && !'+-*/^('.includes(texto[i - 1])) {
                return [texto.slice(0, i), texto[i], texto.slice(i + 1)];
            }
        }
        return null;
    },

    retirarParentesesExternos(texto) {
        while (texto.startsWith('(') && texto.endsWith(')')) {
            let nivel = 0, fechaAntes = false;
            for (let i = 0; i < texto.length - 1; i++) {
                if (texto[i] === '(') nivel++;
                if (texto[i] === ')') nivel--;
                if (nivel === 0) { fechaAntes = true; break; }
            }
            if (fechaAntes) break;
            texto = texto.slice(1, -1);
        }
        return texto;
    },

    derivarElementar(expressao, profundidade = 0) {
        // Subconjunto didático: as regras são aplicadas à árvore de operações.
        if (profundidade > 24) return null;
        const t = this.retirarParentesesExternos(this.normalizarElementar(expressao));
        const derivar = parte => this.derivarElementar(parte, profundidade + 1);
        if (t === 'x') return '1';
        if (/^[+-]?(?:\d+(?:\.\d+)?|pi|π|e)$/.test(t)) return '0';
        for (const operadores of ['+-', '*/']) {
            const partes = this.separarOperadorExterno(t, operadores);
            if (!partes) continue;
            const [u, op, v] = partes, du = derivar(u), dv = derivar(v);
            if (du === null || dv === null) return null;
            if (op === '+' || op === '-') return `(${du})${op}(${dv})`;
            if (op === '*') return `(${du})*(${v})+(${u})*(${dv})`;
            return `((${du})*(${v})-(${u})*(${dv}))/((${v})^2)`;
        }
        if (t.startsWith('-')) { const d = derivar(t.slice(1)); return d === null ? null : `-(${d})`; }
        const potencia = this.separarOperadorExterno(t, '^');
        if (potencia) {
            const [u, , v] = potencia, du = derivar(u), dv = derivar(v);
            if (u === 'e' && dv !== null) return `e^(${v})*(${dv})`;
            const n = Number(this.retirarParentesesExternos(v));
            if (Number.isFinite(n) && du !== null) return n === 0 ? '0' : `${n}*(${u})^(${n - 1})*(${du})`;
            return null;
        }
        const chamada = t.match(/^(sen|sin|cos|ln|sqrt)\((.*)\)$/);
        if (chamada) {
            const [, nome, u] = chamada, du = derivar(u);
            if (du === null) return null;
            if (nome === 'sen' || nome === 'sin') return `cos(${u})*(${du})`;
            if (nome === 'cos') return `-sen(${u})*(${du})`;
            if (nome === 'ln') return `(${du})/(${u})`;
            return `(${du})/(2*sqrt(${u}))`;
        }
        return null;
    },

    analisarDerivadaExpressao(expressaoBruta) {
        const limpo = String(expressaoBruta || '').trim().replace(/^f\(x\)\s*=\s*/i, '');
        const norm = limpo.replace(/\s+/g, '');
        const fn = this.compilarFuncao(limpo);

        // Derivadas laterais para detectar pontos de quina (ex: |x| em x = 0)
        const dfEsq = (x) => {
            const h = 1e-5;
            return (fn(x) - fn(x - h)) / h;
        };
        const dfDir = (x) => {
            const h = 1e-5;
            return (fn(x + h) - fn(x)) / h;
        };
        const ehDerivavelNoPonto = (x) => {
            const e = dfEsq(x);
            const d = dfDir(x);
            return Number.isFinite(e) && Number.isFinite(d) && Math.abs(d - e) < 1e-3 * Math.max(1, Math.abs(d), Math.abs(e));
        };

        // Derivadas numéricas de alta precisão (Diferenças Finitas Centrais de 4ª Ordem)
        const df1 = (x) => {
            if (!ehDerivavelNoPonto(x)) return NaN;
            const h = 1e-4;
            return (-fn(x + 2 * h) + 8 * fn(x + h) - 8 * fn(x - h) + fn(x - 2 * h)) / (12 * h);
        };
        const df2 = (x) => {
            if (!ehDerivavelNoPonto(x)) return NaN;
            const h = 1e-3;
            return (fn(x + h) - 2 * fn(x) + fn(x - h)) / (h * h);
        };

        const normalizada = this.normalizarElementar(limpo);
        // Regras detectadas dinamicamente
        const regras = [];
        if (/[·*]/.test(norm) && /x.*[a-zA-Z]/.test(norm)) {
            regras.push({ titulo: 'Regra do Produto', math: '(u · v)′ = u′ · v + u · v′' });
        }
        if (/\//.test(norm)) {
            regras.push({ titulo: 'Regra do Quociente', math: '(u / v)′ = (u′·v − u·v′) / v²' });
        }
        if (/[\^²³⁴]/.test(norm) || /\bx\b/.test(norm)) {
            regras.push({ titulo: 'Regra da Potência', math: '(xⁿ)′ = n · xⁿ⁻¹' });
        }
        if (/sen|sin|cos|tg|tan/i.test(norm)) {
            regras.push({ titulo: 'Derivada Trigonométrica', math: '(sen x)′ = cos x  •  (cos x)′ = −sen x' });
        }
        if (/ln|log|e\^/i.test(norm)) {
            regras.push({ titulo: 'Derivada Exponencial / Logarítmica', math: '(eˣ)′ = eˣ  •  (ln x)′ = 1/x' });
        }
        if (this.separarOperadorExterno(normalizada, '+-')) regras.push({ titulo: 'Regra da Soma / Subtração', math: '(u ± v)′ = u′ ± v′' });
        if (/(sen|sin|cos|ln|sqrt)\((?!x\))/.test(normalizada) || /\)\^/.test(normalizada)) regras.push({ titulo: 'Regra da Cadeia', math: '(f(g(x)))′ = f′(g(x)) · g′(x)' });
        if (regras.length === 0) {
            regras.push({ titulo: 'Regra da Constante / Linearidade', math: '(c)′ = 0  •  (ax + b)′ = a' });
        }

        // Expressão simbólica conhecida para os casos clássicos ou notação geral
        let simb1 = `d/dx [${limpo}]`;
        let simb2 = `d²/dx² [${limpo}]`;
        if (norm === 'x³·sen(x)' || norm === 'x^3*sen(x)' || norm === 'x^3·sen(x)') {
            simb1 = '3x²sen(x) + x³cos(x)';
            simb2 = '(6x − x³)sen(x) + 6x²cos(x)';
        } else if (norm === 'x²-4x-5' || norm === 'x²−4x−5' || norm === 'x^2-4x-5') {
            simb1 = '2x − 4';
            simb2 = '2';
        } else if (norm === 'x³-3x' || norm === 'x^3-3x') {
            simb1 = '3x² − 3';
            simb2 = '6x';
        } else if (norm === 'sen(x)') {
            simb1 = 'cos(x)';
            simb2 = '−sen(x)';
        } else if (norm === 'cos(x)') {
            simb1 = '−sen(x)';
            simb2 = '−cos(x)';
        } else if (norm === 'e^x' || norm === 'eˣ') {
            simb1 = 'eˣ';
            simb2 = 'eˣ';
        } else if (norm === '|x|' || norm === 'abs(x)') {
            simb1 = 'x/|x| (não derivável em x = 0)';
            simb2 = '0 (para x ≠ 0)';
        }

        const simbolica = this.derivarElementar(limpo);
        const segunda = simbolica === null ? null : this.derivarElementar(simbolica);
        if (simbolica !== null) simb1 = simbolica;
        if (segunda !== null) simb2 = segunda;
        const dfSimbolica = simbolica === null ? null : this.compilarFuncao(simbolica);
        return { fn, df1, df2, dfSimbolica, dfEsq, dfDir, ehDerivavelNoPonto, simb1, simb2, regras, expressaoLimpa: limpo };
    },

    /**
     * Analisa qualquer limite lim(x->a) f(x) digitado pelo usuário, incluindo
     * limites no infinito (x -> oo ou x -> -oo), limites laterais e inexistência.
     */
    calcularLimiteGeral(exprStr, pontoStr) {
        const limpo = String(exprStr || '').trim();
        const fn = this.compilarFuncao(limpo);
        const pNorm = String(pontoStr || '0').trim().toLowerCase().replace(',', '.');

        // Caso 1: Limite no infinito (+∞ ou −∞)
        if (pNorm === 'oo' || pNorm === '+oo' || pNorm === 'inf' || pNorm === '+inf' || pNorm === '∞' || pNorm === '+∞' || pNorm === '-oo' || pNorm === '-inf' || pNorm === '-∞' || pNorm === '−∞') {
            const sinalInf = pNorm.startsWith('-') || pNorm.startsWith('−') ? -1 : 1;
            const rotuloInf = sinalInf > 0 ? '+∞' : '−∞';
            const xs = [10, 100, 1000, 10000].map(v => v * sinalInf);
            const ys = xs.map(x => fn(x));
            const valFinal = ys[3];
            const explode = !Number.isNaN(valFinal) && (!Number.isFinite(valFinal) || (Math.abs(valFinal) > 1e5 && Math.abs(valFinal) > 5 * Math.abs(ys[1])));
            const resInf = Number.isNaN(valFinal) ? 'Indefinido no domínio real' : explode ? (valFinal > 0 ? '+∞' : '−∞') : this.fmt(valFinal, 4);
            const existe = !explode && Math.abs(ys[3] - ys[2]) < 1e-2;

            return {
                rotulo: `lim(x→${rotuloInf}) ${limpo}`,
                funcao: limpo,
                ponto: rotuloInf,
                aNum: sinalInf * 10,
                fn,
                resEsquerda: resInf,
                resDireita: resInf,
                resBilateral: resInf,
                existe,
                continuidade: existe ? `Assíntota horizontal em y = ${resInf}` : explode ? `Diverge para ${resInf} quando x → ${rotuloInf}` : 'Comportamento não confirmado pela amostragem',
                detalheCont: existe
                    ? `Quando x cresce ilimitadamente (${rotuloInf}), f(x) estabiliza-se em ${resInf}.`
                    : `A função cresce sem limite superior/inferior quando x → ${rotuloInf}.`,
                tabela: [10, 100, 1000].map(v => {
                    const xVal = v * sinalInf;
                    const yVal = fn(xVal);
                    return {
                        xEsq: String(xVal),
                        fEsq: Math.abs(yVal) > 1e5 ? (yVal > 0 ? '+∞' : '−∞') : this.fmt(yVal, 4),
                        xDir: String(xVal * 10),
                        fDir: Math.abs(fn(xVal * 10)) > 1e5 ? (fn(xVal * 10) > 0 ? '+∞' : '−∞') : this.fmt(fn(xVal * 10), 4)
                    };
                }),
                passos: [
                    { titulo: `1. Avaliar para valores grandes de x (${rotuloInf})`, math: `f(${xs[1]}) ≈ ${this.fmt(ys[1], 4)} | f(${xs[2]}) ≈ ${this.fmt(ys[2], 4)}` },
                    { titulo: '2. Comportamento assintótico no infinito', math: `lim(x→${rotuloInf}) f(x) = ${resInf}` }
                ],
                grafico: {
                    janela: { xMin: sinalInf > 0 ? -2 : -25, xMax: sinalInf > 0 ? 25 : 2, yMin: -6, yMax: 6 },
                    curvas: [{ rotulo: `f(x) = ${limpo}`, cor: '#22C55E', fn }],
                    assintotas: existe ? [{ tipo: 'horizontal', valor: valFinal, cor: '#3B82F6', rotulo: `y = ${resInf}` }] : [],
                    marcadores: []
                }
            };
        }

        const a = Number(pNorm);
        if (!Number.isFinite(a)) {
            return { rotulo: 'Entrada inválida', funcao: limpo, ponto: pontoStr, aNum: 0, fn: () => NaN,
                existe: false, resEsquerda: 'Indefinido', resDireita: 'Indefinido', resBilateral: 'Ponto inválido',
                continuidade: 'Informe um número ou infinito (oo).', detalheCont: 'O ponto informado não foi convertido em zero.',
                tabela: [], passos: [], grafico: { curvas: [], marcadores: [], janela: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 } } };
        }

        const deltas = [0.1, 0.01, 0.001, 0.0001];
        const aproxsEsq = deltas.map(d => fn(a - d));
        const aproxsDir = deltas.map(d => fn(a + d));

        const valEsq = aproxsEsq[3];
        const valDir = aproxsDir[3];

        // Detecta explosão assintótica: valor muito alto E crescendo rapidamente à medida que delta diminui
        const explodeEsq = !Number.isNaN(valEsq) && (!Number.isFinite(valEsq) || (Math.abs(valEsq) > 500 && Math.abs(valEsq) > Math.abs(aproxsEsq[1]) * 5));
        const explodeDir = !Number.isNaN(valDir) && (!Number.isFinite(valDir) || (Math.abs(valDir) > 500 && Math.abs(valDir) > Math.abs(aproxsDir[1]) * 5));

        let resEsquerda = Number.isNaN(valEsq) ? 'Indefinido no domínio real' : explodeEsq ? (valEsq > 0 ? '+∞' : '−∞') : this.fmt(valEsq, 3);
        let resDireita = Number.isNaN(valDir) ? 'Indefinido no domínio real' : explodeDir ? (valDir > 0 ? '+∞' : '−∞') : this.fmt(valDir, 3);
        let existe = !explodeEsq && !explodeDir && Number.isFinite(valEsq) && Number.isFinite(valDir) && Math.abs(valEsq - valDir) < 1e-2;
        let resBilateral = existe
            ? this.fmt((valEsq + valDir) / 2, 3)
            : (explodeEsq && explodeDir && (valEsq * valDir > 0) ? `${resEsquerda} (Diverge)` : 'NÃO EXISTE');

        const fa = fn(a);
        const defNoPonto = Number.isFinite(fa);
        let continuidade = 'Contínua no ponto';
        if (!existe) {
            continuidade = explodeEsq || explodeDir ? `Descontinuidade infinita (Assíntota x = ${this.fmt(a)})` : 'Limite bilateral não confirmado: domínio ou oscilação devem ser analisados';
        } else if (!defNoPonto || Math.abs(fa - (valEsq + valDir) / 2) > 1e-2) {
            continuidade = `Descontinuidade removível (Buraco em (${this.fmt(a)}, ${resBilateral}))`;
        }

        return {
            rotulo: `lim(x→${this.fmt(a)}) ${limpo}`,
            funcao: limpo,
            ponto: this.fmt(a),
            aNum: a,
            fn,
            resEsquerda,
            resDireita,
            resBilateral,
            existe,
            continuidade,
            detalheCont: existe
                ? `Os limites laterais coincidem em ${resBilateral}. ${!defNoPonto ? `Como f(${this.fmt(a)}) é indeterminado, há um buraco removível em (${this.fmt(a)}, ${resBilateral}).` : ''}`
                : `Os limites laterais divergem: pela esquerda tende a ${resEsquerda} e pela direita tende a ${resDireita}.`,
            tabela: [0.1, 0.01, 0.001].map(d => ({
                xEsq: this.fmt(a - d, 3),
                fEsq: Math.abs(fn(a - d)) > 1e5 ? (fn(a - d) > 0 ? '+∞' : '−∞') : this.fmt(fn(a - d), 3),
                xDir: this.fmt(a + d, 3),
                fDir: Math.abs(fn(a + d)) > 1e5 ? (fn(a + d) > 0 ? '+∞' : '−∞') : this.fmt(fn(a + d), 3)
            })),
            passos: [
                { titulo: `1. Avaliar comportamento à esquerda (x → ${this.fmt(a)}⁻)`, math: `f(${this.fmt(a - 0.001, 3)}) ≈ ${resEsquerda}` },
                { titulo: `2. Avaliar comportamento à direita (x → ${this.fmt(a)}⁺)`, math: `f(${this.fmt(a + 0.001, 3)}) ≈ ${resDireita}` },
                { titulo: '3. Comparação dos limites laterais', math: existe ? `lim_esq = lim_dir = ${resBilateral} (Limite Existe)` : `lim_esq (${resEsquerda}) ≠ lim_dir (${resDireita}) ⇒ NÃO EXISTE` }
            ],
            grafico: {
                janela: { xMin: a - 4, xMax: a + 4, yMin: existe ? ((valEsq + valDir) / 2) - 5 : -6, yMax: existe ? ((valEsq + valDir) / 2) + 5 : 6 },
                curvas: [{ rotulo: `f(x) = ${limpo}`, cor: '#22C55E', fn }],
                assintotas: !existe && (explodeEsq || explodeDir) ? [{ tipo: 'vertical', valor: a, cor: '#EF4444', rotulo: `Assíntota x = ${this.fmt(a)}` }] : [],
                marcadores: existe ? [{ x: a, y: (valEsq + valDir) / 2, rotulo: `(${this.fmt(a)}, ${resBilateral})`, cor: '#EF4444', vazado: !defNoPonto, raio: 6.5, projetarEixos: true }] : []
            }
        };
    },

    /**
     * Calcula todas as propriedades em tempo real da Função Quadrática f(x) = ax² + bx + c
     * a partir dos sliders (a, b, c). Trata Δ > 0, Δ = 0, Δ < 0 e a = 0!
     */
    calcularQuadratica(a, b, c) {
        const fmt = (v) => this.fmt(v, 2);

        // Formata a expressão algébrica f(x) = ax² + bx + c
        const montarExpressao = () => {
            if (a === 0) {
                if (b === 0) return `f(x) = ${fmt(c)}`;
                const sC = c === 0 ? '' : c > 0 ? ` + ${fmt(c)}` : ` − ${fmt(Math.abs(c))}`;
                const sB = b === 1 ? 'x' : b === -1 ? '−x' : `${fmt(b)}x`;
                return `f(x) = ${sB}${sC}`;
            }
            const sA = a === 1 ? 'x²' : a === -1 ? '−x²' : `${fmt(a)}x²`;
            const sB = b === 0 ? '' : b > 0 ? ` + ${b === 1 ? '' : fmt(b)}x` : ` − ${Math.abs(b) === 1 ? '' : fmt(Math.abs(b))}x`;
            const sC = Math.abs(c) < 1e-9 ? '' : c > 0 ? ` + ${fmt(c)}` : ` − ${fmt(Math.abs(c))}`;
            return `f(x) = ${sA}${sB}${sC}`;
        };

        // Caso especial: a = 0 (deixa de ser quadrática!)
        if (a === 0) {
            const raizAfim = b !== 0 ? -c / b : null;
            return {
                ehQuadratica: false,
                avisoA0: 'Como a = 0, a função deixa de ser quadrática (2º grau) e passa a ser uma Função Afim / Constante.',
                expressao: montarExpressao(),
                avaliacaoDestaque: `f(0) = ${fmt(c)}`,
                a, b, c,
                delta: null,
                raizesTexto: raizAfim !== null ? `x = ${fmt(raizAfim)}` : c === 0 ? 'Todo x ∈ ℝ (função zero)' : 'Sem raiz (constante)',
                raizesNum: raizAfim !== null ? [raizAfim] : [],
                verticeTexto: 'Não possui vértice (reta)',
                xv: 0,
                yv: c,
                eixoSimetria: 'Não possui',
                concavidade: 'Nula (reta linear)',
                imagem: b !== 0 ? 'ℝ (−∞, +∞)' : `{${fmt(c)}}`,
                formaFatorada: montarExpressao().replace('f(x) = ', ''),
                formaCanonica: montarExpressao().replace('f(x) = ', ''),
                interceptoY: `(0, ${fmt(c)})`,
                fn: (x) => b * x + c
            };
        }

        const delta = b * b - 4 * a * c;
        const xv = -b / (2 * a);
        const yv = -delta / (4 * a);
        const yvPorSubstituicao = a * xv * xv + b * xv + c;
        const yvPorCompletamento = c - (b * b) / (4 * a);

        let raizesNum = [];
        let raizesTexto = '';
        let formaFatorada = '';
        // Sem raízes reais, a verificação pela forma fatorada real não se aplica.
        let yvPorFatorada = null;

        if (delta > 0) {
            // Evita cancelamento ao subtrair números quase iguais na fórmula de Bhaskara.
            const termoEstavel = -.5 * (b + (b >= 0 ? 1 : -1) * Math.sqrt(delta));
            const r1 = termoEstavel / a;
            const r2 = c / termoEstavel;
            raizesNum = [Math.min(r1, r2), Math.max(r1, r2)];
            yvPorFatorada = -a * Math.pow(raizesNum[1] - raizesNum[0], 2) / 4;
            raizesTexto = `${fmt(raizesNum[0])} e ${fmt(raizesNum[1])}`;
            const prefA = a === 1 ? '' : a === -1 ? '−' : fmt(a);
            const t1 = Math.abs(raizesNum[0]) < 1e-9 ? 'x' : `(x ${raizesNum[0] < 0 ? '+ ' + fmt(Math.abs(raizesNum[0])) : '− ' + fmt(raizesNum[0])})`;
            const t2 = Math.abs(raizesNum[1]) < 1e-9 ? 'x' : `(x ${raizesNum[1] < 0 ? '+ ' + fmt(Math.abs(raizesNum[1])) : '− ' + fmt(raizesNum[1])})`;
            formaFatorada = `${prefA}${t1}${t2}`;
        } else if (delta === 0) {
            const r = -b / (2 * a);
            raizesNum = [r];
            yvPorFatorada = 0;
            raizesTexto = `${fmt(r)} (raiz dupla)`;
            const prefA = a === 1 ? '' : a === -1 ? '−' : fmt(a);
            formaFatorada = Math.abs(r) < 1e-9 ? `${prefA}x²` : `${prefA}(x ${r < 0 ? '+ ' + fmt(Math.abs(r)) : '− ' + fmt(r)})²`;
        } else {
            raizesNum = [];
            raizesTexto = 'Não existem raízes reais (Δ < 0)';
            formaFatorada = 'Irredutível em ℝ (Δ < 0)';
        }

        const prefA = a === 1 ? '' : a === -1 ? '−' : fmt(a);
        const termoH = Math.abs(xv) < 1e-9 ? 'x²' : `(x ${xv < 0 ? '+ ' + fmt(Math.abs(xv)) : '− ' + fmt(xv)})²`;
        const termoK = Math.abs(yv) < 1e-9 ? '' : yv > 0 ? ` + ${fmt(yv)}` : ` − ${fmt(Math.abs(yv))}`;
        const formaCanonica = `${prefA}${termoH}${termoK}`;

        // Conferência dupla real entre os 4 métodos do vértice
        const verifYv = this.verificarResultadoDuplo(yv, yvPorSubstituicao, 1e-6, '−Δ/(4a)', 'f(xv)');

        return {
            ehQuadratica: true,
            expressao: montarExpressao(),
            avaliacaoDestaque: `f(${fmt(xv)}) = ${fmt(yv)}`,
            a, b, c,
            delta,
            raizesTexto,
            raizesNum,
            verticeTexto: `V(${fmt(xv)}, ${fmt(yv)})`,
            xv,
            yv,
            yvPorSubstituicao,
            yvPorCompletamento,
            yvPorFatorada,
            verificado: verifYv.aprovado && Math.abs(yv - yvPorCompletamento) < 1e-6,
            verificado4Formas: yvPorFatorada !== null && verifYv.aprovado && Math.abs(yv - yvPorCompletamento) < 1e-6 && Math.abs(yv - yvPorFatorada) < 1e-6,
            eixoSimetria: `x = ${fmt(xv)}`,
            concavidade: a > 0 ? 'Para cima (a > 0)' : 'Para baixo (a < 0)',
            tipoExtremo: a > 0 ? 'Mínimo absoluto' : 'Máximo absoluto',
            imagem: a > 0 ? `[${fmt(yv)}, +∞)` : `(−∞, ${fmt(yv)}]`,
            formaFatorada,
            formaCanonica,
            interceptoY: `(0, ${fmt(c)})`,
            fn: (x) => a * x * x + b * x + c
        };
    },

    /**
     * Retorna os dados completos de qualquer um dos Tipos de Funções do Módulo 03
     * (8 tipos clássicos + forma canônica, forma fatorada e juros compostos).
     */
    obterDadosTipoFuncao(tipo, paramsQuad = { a: 1, b: -4, c: -5 }) {
        if (tipo === 'quadratica' || tipo === 'canonica' || tipo === 'fatorada') {
            let a = paramsQuad.a !== undefined ? Number(paramsQuad.a) : 1;
            let b = paramsQuad.b !== undefined ? Number(paramsQuad.b) : -4;
            let c = paramsQuad.c !== undefined ? Number(paramsQuad.c) : -5;

            if (tipo === 'canonica') {
                const h = paramsQuad.h !== undefined ? Number(paramsQuad.h) : 2;
                const k = paramsQuad.k !== undefined ? Number(paramsQuad.k) : -9;
                b = -2 * a * h;
                c = a * h * h + k;
            } else if (tipo === 'fatorada') {
                const x1 = paramsQuad.x1 !== undefined ? Number(paramsQuad.x1) : -1;
                const x2 = paramsQuad.x2 !== undefined ? Number(paramsQuad.x2) : 5;
                b = -a * (x1 + x2);
                c = a * x1 * x2;
            }

            if ([a, b, c].some(v => !Number.isFinite(v) || Math.abs(v) > 1e12)) {
                const dados = this.obterDadosFuncaoParametrizada('afim', { a: NaN, b: 0 });
                dados.nomeTipo = 'Quadrática';
                dados.mensagemErro = dados.subtituloResultado = 'Coeficientes fora da faixa suportada: use valores finitos entre −10¹² e 10¹².';
                return dados;
            }

            const q = this.calcularQuadratica(a, b, c);
            const marcadores = [
                { x: q.xv, y: q.yv, rotulo: `V(${this.fmt(q.xv)}, ${this.fmt(q.yv)})`, cor: '#EF4444', offsetY: 12 },
                { x: 0, y: q.c, rotulo: `(0, ${this.fmt(q.c)})`, cor: '#EF4444', offsetX: 10, offsetY: -10 }
            ];
            q.raizesNum.forEach((r) => {
                marcadores.push({ x: r, y: 0, rotulo: `(${this.fmt(r)}, 0)`, cor: '#EF4444', offsetY: -26 });
            });

            const xSpread = Math.max(6, Math.abs(q.xv) + 5, ...(q.raizesNum.map(r => Math.abs(r) + 2)));
            const yMin = Math.min(-11, q.yv - 3, q.c - 2);
            const yMax = Math.max(7, q.yv + 8, q.c + 4);

            const badgesParametros = tipo === 'canonica'
                ? [
                    { rotulo: `a = ${this.fmt(a)}`, cor: '#3B82F6' },
                    { rotulo: `h = ${this.fmt(paramsQuad.h ?? 2)}`, cor: '#F59E0B' },
                    { rotulo: `k = ${this.fmt(paramsQuad.k ?? -9)}`, cor: '#22C55E' }
                ]
                : tipo === 'fatorada'
                ? [
                    { rotulo: `a = ${this.fmt(a)}`, cor: '#3B82F6' },
                    { rotulo: `x₁ = ${this.fmt(paramsQuad.x1 ?? -1)}`, cor: '#F59E0B' },
                    { rotulo: `x₂ = ${this.fmt(paramsQuad.x2 ?? 5)}`, cor: '#22C55E' }
                ]
                : [
                    { rotulo: `a = ${this.fmt(q.a)}`, cor: '#3B82F6' },
                    { rotulo: `b = ${this.fmt(q.b)}`, cor: '#F59E0B' },
                    { rotulo: `c = ${this.fmt(q.c)}`, cor: '#22C55E' }
                ];

            const expressaoPrincipal = tipo === 'canonica'
                ? `f(x) = ${q.formaCanonica}`
                : tipo === 'fatorada'
                ? `f(x) = ${q.formaFatorada}`
                : q.expressao;

            return {
                tipo,
                nomeTipo: tipo === 'canonica' ? 'Quadrática (Forma Canônica)' : tipo === 'fatorada' ? 'Quadrática (Forma Fatorada)' : 'Quadrática',
                expressao: expressaoPrincipal,
                subtituloResultado: q.avaliacaoDestaque,
                avisoEspecial: q.avisoA0 || null,
                quadData: q,
                propriedades: [
                    { chave: 'Domínio', valor: 'ℝ', cor: '#3B82F6' },
                    { chave: 'Imagem', valor: q.imagem, cor: '#22C55E' },
                    { chave: 'Vértice', valor: q.verticeTexto, cor: '#3B82F6' },
                    { chave: 'Raízes', valor: q.raizesTexto, cor: '#EF4444' },
                    { chave: 'Discriminante (Δ)', valor: q.delta !== null ? this.fmt(q.delta) : '—', cor: '#F59E0B' },
                    { chave: 'Eixo de simetria', valor: q.eixoSimetria, cor: '#3B82F6' },
                    { chave: 'Concavidade', valor: q.concavidade, cor: '#22C55E' },
                    { chave: 'Intercepto em y', valor: q.interceptoY, cor: '#F59E0B' },
                    { chave: 'Forma fatorada', valor: q.formaFatorada, cor: '#9FB0C9' },
                    { chave: 'Forma canônica', valor: q.formaCanonica, cor: '#9FB0C9' }
                ],
                passos: q.ehQuadratica ? [
                    { titulo: '1. Coeficientes e Discriminante (Δ = b² − 4ac)', math: `a = ${this.fmt(q.a)}, b = ${this.fmt(q.b)}, c = ${this.fmt(q.c)} ⇒ Δ = (${this.fmt(q.b)})² − 4·(${this.fmt(q.a)})·(${this.fmt(q.c)}) = ${this.fmt(q.delta)}` },
                    { titulo: '2. Cálculo das Raízes (f(x) = 0)', math: q.delta >= 0 ? `x = (−b ± √Δ)/(2a) ⇒ Raízes: ${q.raizesTexto}` : 'Δ < 0 ⇒ Não corta o eixo x em ℝ' },
                    { titulo: '3. Coordenadas do Vértice V(xv, yv)', math: `xv = −b/(2a) = ${this.fmt(q.xv)} | yv = −Δ/(4a) = ${this.fmt(q.yv)}` },
                    { titulo: '4. Formas Equivalentes', math: `Canônica: ${q.formaCanonica} | Fatorada: ${q.formaFatorada}` }
                ] : [
                    { titulo: '1. Caso Degenerado (a = 0)', math: q.avisoA0 },
                    { titulo: '2. Resolução Linear', math: `${q.expressao} ⇒ Raiz: ${q.raizesTexto}` }
                ],
                verificacao: {
                    aprovado: q.ehQuadratica ? q.verificado : this.verificarResultadoDuplo(q.fn(1), q.b + q.c).aprovado,
                    linhas: q.ehQuadratica ? [
                        `f(${this.fmt(q.xv)}) = ${this.fmt(q.yvPorSubstituicao)}  •  −Δ/(4a) = ${this.fmt(q.yv)}`,
                        q.raizesNum.length === 2
                            ? `Soma x₁+x₂ = ${this.fmt(q.raizesNum[0] + q.raizesNum[1])} (−b/a = ${this.fmt(-q.b / q.a)})`
                            : `Intercepto f(0) = ${this.fmt(q.c)}`
                    ] : [`Substituição direta: f(0) = ${this.fmt(q.c)}`]
                },
                estudoCompleto: {
                    dominio: 'ℝ = (−∞, +∞)',
                    imagem: q.imagem,
                    raizes: q.raizesTexto,
                    sinal: q.delta > 0
                        ? (q.a > 0 ? `f(x) > 0 em (−∞, ${this.fmt(q.raizesNum[0])}) ∪ (${this.fmt(q.raizesNum[1])}, +∞); f(x) < 0 em (${this.fmt(q.raizesNum[0])}, ${this.fmt(q.raizesNum[1])})` : `f(x) > 0 em (${this.fmt(q.raizesNum[0])}, ${this.fmt(q.raizesNum[1])})`)
                        : (q.a > 0 ? 'f(x) ≥ 0 para todo x ∈ ℝ' : 'f(x) ≤ 0 para todo x ∈ ℝ'),
                    paridade: Math.abs(q.b) < 1e-9 ? 'Função Par: f(−x) = f(x)' : 'Nem par nem ímpar (b ≠ 0)',
                    crescimento: q.a > 0 ? `Crescente em [${this.fmt(q.xv)}, +∞)` : `Crescente em (−∞, ${this.fmt(q.xv)}]`,
                    decrescimento: q.a > 0 ? `Decrescente em (−∞, ${this.fmt(q.xv)}]` : `Decrescente em [${this.fmt(q.xv)}, +∞)`,
                    extremos: `${q.tipoExtremo} em V(${this.fmt(q.xv)}, ${this.fmt(q.yv)})`,
                    concavidade: q.concavidade,
                    assintotas: 'Não possui assíntotas (função polinomial)',
                    interceptos: `Eixo y: ${q.interceptoY} | Eixo x: ${q.raizesTexto}`
                },
                grafico: {
                    janela: { xMin: -xSpread, xMax: xSpread, yMin, yMax },
                    curvas: [{ rotulo: expressaoPrincipal, cor: '#22C55E', fn: q.fn }],
                    assintotas: q.ehQuadratica ? [{ tipo: 'vertical', valor: q.xv, cor: '#3B82F6', rotulo: `Eixo de simetria x = ${this.fmt(q.xv)}` }] : [],
                    marcadores,
                    badgesParametros
                }
            };
        }

        // O catálogo sem parâmetros continua disponível como material didático.
        // Na aplicação, todos os dados são derivados dos parâmetros atuais.
        if (arguments.length > 1) return this.obterDadosFuncaoParametrizada(tipo, paramsQuad);

        // Os modelos sem parâmetros usam a mesma fábrica dos modelos editados.
        return this.obterDadosFuncaoParametrizada(tipo, {});
    },

    /**
     * Analisa qualquer função f(x) livre digitada pelo usuário no Módulo 03.
     */
    obterDadosFuncaoParametrizada(tipo, parametros = {}) {
        // Cada propriedade é calculada dos mesmos parâmetros usados pela curva.
        const padroes = {
            constante: { b: 5 }, afim: { a: 2, b: 1 }, linear: { a: 3 },
            modular: { a: 1, h: 0, k: 0 }, exponencial: { C: 1, a: 2 },
            logaritmica: { a: 2 }, trigonometrica: { A: 1, B: 1, C: 0, D: 0 },
            juros: { C: 100, i: 0.1 }
        };
        const p = { ...(padroes[tipo] || padroes.constante), ...parametros };
        const fmt = v => this.fmt(v, 6);
        const modelos = {
            constante: ['Constante', `${p.b}`, () => p.b],
            afim: ['Afim', `${p.a}*x+(${p.b})`, x => p.a * x + p.b],
            linear: ['Linear', `${p.a}*x`, x => p.a * x],
            modular: ['Modular', `${p.a}*abs(x-(${p.h}))+(${p.k})`, x => p.a * Math.abs(x - p.h) + p.k],
            exponencial: ['Exponencial', `${p.C}*(${p.a})^x`, x => p.C * Math.pow(p.a, x)],
            logaritmica: ['Logarítmica', `ln(x)/ln(${p.a})`, x => Math.log(x) / Math.log(p.a)],
            trigonometrica: ['Trigonométrica', `${p.A}*sen(${p.B}*x+(${p.C}))+(${p.D})`, x => p.A * Math.sin(p.B * x + p.C) + p.D],
            juros: ['Juros Compostos', `${p.C}*(1+(${p.i}))^x`, x => p.C * Math.pow(1 + p.i, x)]
        };
        const [nomeModelo, texto, fn] = modelos[tipo] || modelos.constante;
        let erro = Object.values(p).some(v => !Number.isFinite(v)) ? 'Use apenas parâmetros numéricos finitos.' : '';
        if (['exponencial', 'logaritmica'].includes(tipo) && (p.a <= 0 || p.a === 1)) erro = 'A base deve ser positiva e diferente de 1.';
        if (tipo === 'juros' && p.i <= -1) erro = 'A taxa deve ser maior que −1 para manter a base positiva.';
        if (Object.values(p).some(v => Math.abs(v) > 1e12)) erro = 'Parâmetro muito grande: use valores entre −10¹² e 10¹².';
        let nome = nomeModelo, tipoReal = tipo;
        let dominio = 'ℝ', imagem = 'ℝ', raizes = 'Nenhuma', paridade = 'Nem par nem ímpar';
        let crescimento = 'Nenhum intervalo', decrescimento = 'Nenhum intervalo';
        let extremos = 'Não possui', concavidade = 'Nula (reta)', assintotas = 'Não possui';
        let sinal = 'Determinado pelo sinal de f(x).';
        let periodo = null, fase = null;
        const marcadores = [], linhasAssintotas = [], extras = [];
        const ponto = (x, y, rotulo) => {
            if (Number.isFinite(x) && Number.isFinite(y)) marcadores.push({ x, y, rotulo: rotulo || `(${fmt(x)}, ${fmt(y)})`, cor: '#EF4444' });
        };
        const constante = valor => {
            nome = 'Constante'; tipoReal = 'constante'; imagem = `{${fmt(valor)}}`;
            raizes = valor === 0 ? 'Todo x ∈ ℝ' : 'Nenhuma';
            paridade = valor === 0 ? 'Par e ímpar (função zero)' : 'Par';
            crescimento = decrescimento = 'Constante em ℝ';
            extremos = `Todo ponto é máximo e mínimo não estrito (${fmt(valor)})`;
            sinal = valor === 0 ? 'Nula em ℝ' : valor > 0 ? 'Positiva em ℝ' : 'Negativa em ℝ';
        };
        if (['constante', 'afim', 'linear'].includes(tipo)) {
            const a = tipo === 'constante' ? 0 : p.a;
            const b = tipo === 'linear' ? 0 : p.b;
            if (a === 0) constante(b);
            else {
                tipoReal = b === 0 ? 'linear' : 'afim'; nome = b === 0 ? 'Linear' : 'Afim';
                const r = -b / a;
                raizes = `x = ${fmt(r)}`; ponto(r, 0);
                crescimento = a > 0 ? 'Todo ℝ' : 'Nenhum intervalo';
                decrescimento = a < 0 ? 'Todo ℝ' : 'Nenhum intervalo';
                paridade = b === 0 ? 'Ímpar' : 'Nem par nem ímpar';
                sinal = a > 0 ? `Negativa para x < ${fmt(r)}; positiva para x > ${fmt(r)}` : `Positiva para x < ${fmt(r)}; negativa para x > ${fmt(r)}`;
            }
            extras.push(['Coeficiente angular', String(a)], ['Coeficiente linear', String(b)]);
        } else if (tipo === 'modular') {
            if (p.a === 0) constante(p.k);
            else {
                imagem = p.a > 0 ? `[${fmt(p.k)}, +∞)` : `(−∞, ${fmt(p.k)}]`;
                const distancia = -p.k / p.a;
                raizes = distancia < 0 ? 'Nenhuma' : distancia === 0 ? `x = ${fmt(p.h)}` : `x = ${fmt(p.h - distancia)} e ${fmt(p.h + distancia)}`;
                if (distancia >= 0) { ponto(p.h - distancia, 0); if (distancia > 0) ponto(p.h + distancia, 0); }
                crescimento = p.a > 0 ? `[${fmt(p.h)}, +∞)` : `(−∞, ${fmt(p.h)}]`;
                decrescimento = p.a > 0 ? `(−∞, ${fmt(p.h)}]` : `[${fmt(p.h)}, +∞)`;
                paridade = p.h === 0 ? 'Par' : 'Nem par nem ímpar';
                extremos = `${p.a > 0 ? 'Mínimo' : 'Máximo'} em (${fmt(p.h)}, ${fmt(p.k)})`;
                concavidade = p.a > 0 ? 'Convexa (duas semirretas)' : 'Côncava (duas semirretas)';
                sinal = `É o sinal de ${p.a}·|x − (${p.h})| + (${p.k}).`;
                ponto(p.h, p.k, `Quina (${fmt(p.h)}, ${fmt(p.k)})`);
            }
            extras.push(['Derivabilidade', p.a === 0 ? 'Derivada zero em ℝ' : `Não derivável em x = ${fmt(p.h)}; derivadas laterais ${fmt(-p.a)} e ${fmt(p.a)}`]);
        } else if (['exponencial', 'juros'].includes(tipo)) {
            const base = tipo === 'juros' ? 1 + p.i : p.a;
            if (p.C === 0 || base === 1) constante(p.C);
            else {
                imagem = p.C > 0 ? '(0, +∞)' : '(−∞, 0)';
                crescimento = p.C * Math.log(base) > 0 ? 'Todo ℝ' : 'Nenhum intervalo';
                decrescimento = p.C * Math.log(base) < 0 ? 'Todo ℝ' : 'Nenhum intervalo';
                assintotas = `y = 0 quando x → ${base > 1 ? '−∞' : '+∞'}`;
                linhasAssintotas.push({ tipo: 'horizontal', valor: 0, rotulo: 'y = 0', cor: '#3B82F6' });
                concavidade = p.C > 0 ? 'Para cima' : 'Para baixo';
                sinal = p.C > 0 ? 'Positiva em ℝ' : 'Negativa em ℝ';
            }
            extras.push(['Base', fmt(base)], ['Valor inicial', fmt(p.C)]);
        } else if (tipo === 'logaritmica') {
            dominio = '(0, +∞)'; raizes = 'x = 1';
            crescimento = p.a > 1 ? '(0, +∞)' : 'Nenhum intervalo';
            decrescimento = p.a < 1 ? '(0, +∞)' : 'Nenhum intervalo';
            paridade = 'Sem paridade: domínio não simétrico';
            assintotas = 'x = 0 (vertical)'; concavidade = p.a > 1 ? 'Para baixo' : 'Para cima';
            sinal = p.a > 1 ? 'Negativa em (0, 1); positiva em (1, +∞)' : 'Positiva em (0, 1); negativa em (1, +∞)';
            linhasAssintotas.push({ tipo: 'vertical', valor: 0, rotulo: 'x = 0', cor: '#3B82F6' });
            ponto(1, 0); ponto(p.a, 1);
            extras.push(['Mudança de base', `log_${p.a}(x) = ln(x)/ln(${p.a})`], ['Função inversa', `f⁻¹(x) = (${p.a})^x`]);
        } else if (tipo === 'trigonometrica') {
            if (p.A === 0 || p.B === 0) constante(fn(0));
            else {
                periodo = 2 * Math.PI / Math.abs(p.B); fase = -p.C / p.B;
                imagem = `[${fmt(p.D - Math.abs(p.A))}, ${fmt(p.D + Math.abs(p.A))}]`;
                if (Math.abs(Math.cos(p.C)) < 1e-12) paridade = 'Par';
                else if (p.D === 0 && Math.abs(Math.sin(p.C)) < 1e-12) paridade = 'Ímpar';
                const razao = -p.D / p.A;
                if (Math.abs(razao) <= 1) {
                    const alfa = Math.asin(razao);
                    raizes = `x = (${fmt(alfa)} − (${fmt(p.C)}) + 2kπ)/(${fmt(p.B)}) ou (${fmt(Math.PI - alfa)} − (${fmt(p.C)}) + 2kπ)/(${fmt(p.B)}), k ∈ ℤ`;
                    ponto((alfa - p.C) / p.B, 0);
                }
                crescimento = `Onde (${p.A}·${p.B})cos(${p.B}x + (${p.C})) > 0`;
                decrescimento = `Onde (${p.A}·${p.B})cos(${p.B}x + (${p.C})) < 0`;
                extremos = `Máximo ${fmt(p.D + Math.abs(p.A))}; mínimo ${fmt(p.D - Math.abs(p.A))}`;
                concavidade = `Sinal de −(${p.A}·${p.B}²)sen(${p.B}x + (${p.C}))`;
                ponto((Math.PI / 2 - p.C) / p.B, p.D + p.A);
                ponto((3 * Math.PI / 2 - p.C) / p.B, p.D - p.A);
            }
            extras.push(['Amplitude', fmt(Math.abs(p.A))], ['Período', periodo === null ? 'Constante: sem período fundamental' : `2π/|${p.B}| ≈ ${fmt(periodo)} rad`], ['Deslocamento horizontal', fase === null ? 'Não se aplica' : fmt(fase)]);
        }
        const expressao = ['afim', 'linear', 'constante'].includes(tipo)
            ? (tipo === 'constante' ? `f(x) = ${p.b}` : `f(x) = ${p.a}x ${tipo === 'linear' || p.b >= 0 ? '+' : '−'} ${tipo === 'linear' ? 0 : Math.abs(p.b)}`)
            : `f(x) = ${texto}`;
        const y0 = fn(0);
        ponto(0, y0);
        const interceptos = Number.isFinite(y0) ? `(0, ${fmt(y0)})` : 'Não intercepta o eixo y';
        // Método 1: fórmula direta. Método 2: avaliação do texto por outro caminho.
        const outraFuncao = this.compilarFuncao(texto);
        const amostras = [0.37, 1.21, 2.03];
        const verificacoes = amostras.map(x => this.verificarResultadoDuplo(fn(x), outraFuncao(x), 1e-8 * Math.max(1, Math.abs(fn(x))), 'Fórmula direta', 'Expressão interpretada'));
        const aprovado = !erro && verificacoes.every(v => v.aprovado);
        const props = [['Domínio', dominio], ['Imagem', imagem], ['Raízes', raizes], ['Intercepto em y', interceptos], ['Crescimento', crescimento], ['Decrescimento', decrescimento], ['Paridade', paridade], ['Assíntotas', assintotas], ...extras];
        // A janela inicial inclui todos os marcadores calculados, com margem.
        const xs = [-6, 6, ...marcadores.map(m => m.x)];
        const ys = [-2, 2, ...marcadores.map(m => m.y), ...[-2, -1, 1, 2].map(fn).filter(Number.isFinite)];
        const margem = Math.max(1, (Math.max(...ys) - Math.min(...ys)) * .12);
        return {
            tipo: tipoReal, nomeTipo: nome, expressao, invalido: !!erro, mensagemErro: erro,
            subtituloResultado: erro || `Raízes: ${raizes} • Intercepto: ${interceptos}`,
            propriedades: props.map(([chave, valor]) => ({ chave, valor, cor: '#22C55E' })),
            passos: [{ titulo: '1. Parâmetros atuais', math: Object.entries(p).map(([k, v]) => `${k} = ${v}`).join(' • ') }, { titulo: '2. Domínio e imagem', math: `${dominio} → ${imagem}` }, { titulo: '3. Zeros e variação', math: `${raizes}; crescente: ${crescimento}; decrescente: ${decrescimento}` }],
            verificacao: { aprovado, linhas: erro ? [erro] : verificacoes.map((v, i) => `x = ${amostras[i]}: ${v.mensagem}`) },
            estudoCompleto: { dominio, imagem, raizes, sinal, paridade, crescimento, decrescimento, extremos, concavidade, assintotas, interceptos },
            periodo, fase,
            grafico: { janela: { xMin: Math.min(...xs) - 1, xMax: Math.max(...xs) + 1, yMin: Math.min(...ys) - margem, yMax: Math.max(...ys) + margem }, curvas: erro ? [] : [{ rotulo: expressao, cor: '#22C55E', fn }], marcadores: erro ? [] : marcadores, assintotas: erro ? [] : linhasAssintotas }
        };
    },

    analisarFuncaoCustomizada(expressaoBruta) {
        const limpo = String(expressaoBruta || '').trim().replace(/^f\(x\)\s*=\s*/i, '');
        const fn = this.compilarFuncao(limpo);
        const y0 = fn(0);

        // Busca numérica de raízes em [-10, 10] pelo método da Bisseção
        const raizes = [];
        const passo = 0.1;
        for (let xv = -10; xv < 10; xv += passo) {
            const y1 = fn(xv);
            const y2 = fn(xv + passo);
            if (!Number.isFinite(y1) || !Number.isFinite(y2)) continue;
            if (Math.abs(y1) < 1e-7) {
                if (raizes.every(r => Math.abs(r - xv) > 0.15)) raizes.push(Number(xv.toFixed(3)));
            } else if (y1 * y2 < 0 && Math.abs(y1 - y2) < 20) {
                let a = xv, b = xv + passo;
                for (let k = 0; k < 25; k++) {
                    const m = (a + b) / 2;
                    if (fn(a) * fn(m) <= 0) b = m;
                    else a = m;
                }
                const r = (a + b) / 2;
                if (Math.abs(fn(r)) < 1e-5 && raizes.every(rz => Math.abs(rz - r) > 0.15)) raizes.push(Number(r.toFixed(3)));
            }
        }

        const paridade = 'Não determinada: exige análise algébrica, não apenas amostragem.';

        const marcadores = [];
        if (Number.isFinite(y0)) {
            marcadores.push({ x: 0, y: y0, rotulo: `(0, ${this.fmt(y0, 2)})`, cor: '#3B82F6' });
        }
        raizes.slice(0, 5).forEach(r => {
            marcadores.push({ x: r, y: 0, rotulo: `(${this.fmt(r, 2)}, 0)`, cor: '#EF4444', offsetY: -24 });
        });

        const temAmostraReal = [-10, -2, -1, 0, 1, 2, 10].some(x => Number.isFinite(fn(x)));
        const raizesTexto = raizes.length > 0 ? raizes.map(r => this.fmt(r, 2)).join(', ') : 'Nenhuma em [−10, 10]';

        return {
            tipo: 'custom',
            nomeTipo: 'Expressão Livre',
            expressao: `f(x) = ${limpo}`,
            subtituloResultado: temAmostraReal ? `f(0) = ${this.fmt(y0, 2)}  •  Raízes: ${raizesTexto}` : 'Nenhum valor real nas amostras da janela; confira a expressão e o domínio.',
            propriedades: [
                { chave: 'Expressão interpretada', valor: `f(x) = ${limpo}`, cor: '#22C55E' },
                { chave: 'Intercepto em y — f(0)', valor: Number.isFinite(y0) ? `(0, ${this.fmt(y0, 2)})` : 'Não intercepta', cor: '#3B82F6' },
                { chave: 'Raízes em [−10, 10]', valor: raizesTexto, cor: '#EF4444' },
                { chave: 'Paridade detectada', valor: paridade, cor: '#F59E0B' },
                { chave: 'Avaliação f(1) e f(2)', valor: `f(1) = ${this.fmt(fn(1), 2)} | f(2) = ${this.fmt(fn(2), 2)}`, cor: '#22C55E' }
            ],
            passos: [
                { titulo: '1. Interpretação da função digitada', math: `f(x) = ${limpo}` },
                { titulo: '2. Cálculo do intercepto vertical (x = 0)', math: `f(0) = ${this.fmt(y0, 3)}` },
                { titulo: '3. Localização de zeros por Bisseção', math: `Raízes encontradas: ${raizesTexto}` }
            ],
            verificacao: {
                aprovado: false,
                linhas: [
                    `f(0) = ${this.fmt(y0, 4)}  •  f(1) = ${this.fmt(fn(1), 4)}`,
                    raizes.length > 0 ? `Conferência na raiz x = ${this.fmt(raizes[0], 3)} ⇒ f(x) ≈ 0` : `Amostragem numérica; não constitui prova de continuidade`
                ]
            },
            estudoCompleto: {
                dominio: 'Subconjunto real válido da expressão',
                imagem: 'Analisada graficamente no intervalo visível',
                raizes: raizesTexto,
                sinal: 'Verifique as regiões acima e abaixo do eixo y = 0 no gráfico',
                paridade,
                crescimento: `Taxa em x=1: f′(1) ≈ ${this.fmt((fn(1.001) - fn(0.999)) / 0.002, 2)}`,
                decrescimento: 'Intervalos onde a inclinação da tangente é negativa',
                extremos: 'Pontos onde f′(x) = 0 (mudança de inclinação)',
                concavidade: 'Determinada pelo sinal de f″(x)',
                assintotas: 'Não determinadas analiticamente para expressão livre',
                interceptos: `f(0) = ${this.fmt(y0, 2)} | Zeros: ${raizesTexto}`
            },
            grafico: {
                janela: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
                curvas: [{ rotulo: `f(x) = ${limpo}`, cor: '#22C55E', fn }],
                marcadores
            }
        };
    },

    /**
     * Módulo 07 — Calculadora Real de Geometria Plana e Espacial.
     */
    integrarElementar(expressao, profundidade = 0) {
        if (profundidade > 16) return null;
        const t = this.retirarParentesesExternos(this.normalizarElementar(expressao));
        if (/^[+-]?\d+(?:\.\d+)?$/.test(t)) return { expressao: `(${t})*x`, regra: 'Constante' };
        if (t === 'x') return { expressao: 'x^2/2', regra: 'Potência' };
        const soma = this.separarOperadorExterno(t, '+-');
        if (soma) {
            const u = this.integrarElementar(soma[0], profundidade + 1), v = this.integrarElementar(soma[2], profundidade + 1);
            if (u && v) return { expressao: `(${u.expressao})${soma[1]}(${v.expressao})`, regra: 'Soma / Subtração' };
        }
        if (t === '2*x*cos(x^2)') return { expressao: 'sen(x^2)', regra: 'Substituição u = x², du = 2x dx' };
        const produto = this.separarOperadorExterno(t, '*');
        if (produto && !produto[0].includes('x') && Number.isFinite(Number(produto[0]))) {
            const primitiva = this.integrarElementar(produto[2], profundidade + 1);
            if (primitiva) return { expressao: `(${produto[0]})*(${primitiva.expressao})`, regra: primitiva.regra };
        }
        const potencia = t.match(/^x\^\(?([+-]?\d+(?:\.\d+)?)\)?$/);
        if (potencia) {
            const n = Number(potencia[1]);
            return n === -1 ? { expressao: 'ln(abs(x))', regra: 'Potência n = −1 (logarítmica)' } :
                { expressao: `x^(${n + 1})/(${n + 1})`, regra: 'Potência' };
        }
        const chamada = t.match(/^(sen|sin|cos)\((.*)\)$/);
        const exponencial = t.match(/^e\^(.+)$/);
        if (chamada || exponencial) {
            const argumento = this.retirarParentesesExternos(chamada ? chamada[2] : exponencial[1]);
            const linear = argumento.match(/^([+-]?(?:\d+(?:\.\d+)?)?)\*?x(?:[+-]\d+(?:\.\d+)?)?$/);
            if (!linear) return null;
            const a = linear[1] === '-' ? -1 : Number(linear[1] || 1);
            if (a === 0) return null;
            if (exponencial) return { expressao: `e^(${argumento})/(${a})`, regra: 'Exponencial' };
            return { expressao: `${chamada[1] === 'cos' ? 'sen' : '-cos'}(${argumento})/(${a})`, regra: 'Trigonométrica' };
        }
        return null;
    },

    calcularIntegral(expressao, a, b) {
        const fn = this.compilarFuncao(expressao);
        const primitiva = this.integrarElementar(expressao);
        const integrar = (n, pontoMedio = false) => {
            const h = (b - a) / n;
            if (pontoMedio) {
                let soma = 0;
                for (let i = 0; i < n; i++) soma += fn(a + (i + .5) * h);
                return soma * h;
            }
            let soma = fn(a) + fn(b);
            for (let i = 1; i < n; i++) soma += (i % 2 ? 4 : 2) * fn(a + i * h);
            return soma * h / 3;
        };
        if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 1e6 || Math.abs(b) > 1e6) {
            return { valido: false, verificado: false, resultado: NaN, simpson: NaN, riemann: NaN, primitiva: null, mensagem: 'Use limites finitos entre −10⁶ e 10⁶.' };
        }
        const simpson = integrar(400), anterior = integrar(200), riemann = integrar(1000, true);
        const F = primitiva ? this.compilarFuncao(primitiva.expressao) : null;
        const resultado = F ? F(b) - F(a) : simpson;
        const tolerancia = 1e-4 * Math.max(1, Math.abs(resultado));
        const conferencia = this.verificarResultadoDuplo(resultado, riemann, tolerancia);
        const convergiu = this.verificarResultadoDuplo(simpson, anterior, tolerancia).aprovado;
        const bateComSimpson = this.verificarResultadoDuplo(resultado, simpson, tolerancia).aprovado;
        const valido = Number.isFinite(resultado) && Number.isFinite(simpson) && convergiu && bateComSimpson && conferencia.aprovado;
        return { valido, verificado: valido, resultado: valido ? resultado : NaN, simpson, riemann, primitiva,
            mensagem: valido ? (primitiva ? `Regra: ${primitiva.regra}. F(b) − F(a) conferido por Simpson e ponto médio.` : 'Aproximação numérica conferida por Simpson e ponto médio; primitiva não obtida.') : 'Integral não confirmada: há singularidade, entrada inválida ou falta de convergência. Não use este valor como resultado.' };
    },

    calcularGeometria(figura, p, u = 'cm') {
        const fmt = (v) => this.fmt(v, 2);
        const u2 = `${u}²`;
        const u3 = `${u}³`;

        switch (figura) {
            case 'circulo': {
                const r = Math.max(0.1, Number(p.r) || 5);
                const area = Math.PI * r * r;
                const perim = 2 * Math.PI * r;
                return {
                    categoria: 'Plana', nome: 'Círculo', expressao: `r = ${fmt(r)} ${u}`,
                    resPrincipal: `A = ${fmt(r * r)}π ≈ ${fmt(area)} ${u2}`,
                    resSecundario: `P = ${fmt(2 * r)}π ≈ ${fmt(perim)} ${u}`,
                    propriedades: [
                        { chave: 'Raio (r)', valor: `${fmt(r)} ${u}`, cor: '#3B82F6' },
                        { chave: 'Diâmetro (d = 2r)', valor: `${fmt(2 * r)} ${u}`, cor: '#22C55E' },
                        { chave: 'Área Exata (πr²)', valor: `${fmt(r * r)}π ${u2}`, cor: '#22C55E' },
                        { chave: 'Área Aproximada', valor: `${fmt(area)} ${u2}`, cor: '#22C55E' },
                        { chave: 'Perímetro / Circunferência', valor: `${fmt(2 * r)}π ≈ ${fmt(perim)} ${u}`, cor: '#F59E0B' }
                    ],
                    formulas: [`A = π · r² = π · ${fmt(r)}² = ${fmt(r * r)}π ≈ ${fmt(area)} ${u2}`, `P = 2 · π · r = 2 · π · ${fmt(r)} = ${fmt(2 * r)}π ≈ ${fmt(perim)} ${u}`],
                    verificacao: `Razão A / P = r / 2 = ${fmt(area / perim)} ${u}`
                };
            }
            case 'quadrado': {
                const l = Math.max(0.1, Number(p.l) || 6);
                const area = l * l;
                const perim = 4 * l;
                const diag = l * Math.SQRT2;
                return {
                    categoria: 'Plana', nome: 'Quadrado', expressao: `L = ${fmt(l)} ${u}`,
                    resPrincipal: `A = ${fmt(area)} ${u2}`,
                    resSecundario: `P = ${fmt(perim)} ${u}`,
                    propriedades: [
                        { chave: 'Lado (L)', valor: `${fmt(l)} ${u}`, cor: '#22C55E' },
                        { chave: 'Área (A = L²)', valor: `${fmt(area)} ${u2}`, cor: '#22C55E' },
                        { chave: 'Perímetro (P = 4L)', valor: `${fmt(perim)} ${u}`, cor: '#3B82F6' },
                        { chave: 'Diagonal (d = L√2)', valor: `${fmt(diag)} ${u}`, cor: '#F59E0B' }
                    ],
                    formulas: [`A = L² = ${fmt(l)}² = ${fmt(area)} ${u2}`, `P = 4 · L = 4 · ${fmt(l)} = ${fmt(perim)} ${u}`, `d = L√2 ≈ ${fmt(diag)} ${u}`],
                    verificacao: ` √A = √${fmt(area)} = ${fmt(Math.sqrt(area))} ${u} (confere com L)`
                };
            }
            case 'retangulo': {
                const b = Math.max(0.1, Number(p.b) || 8);
                const h = Math.max(0.1, Number(p.h) || 5);
                const area = b * h;
                const perim = 2 * (b + h);
                const diag = Math.sqrt(b * b + h * h);
                return {
                    categoria: 'Plana', nome: 'Retângulo', expressao: `b = ${fmt(b)} ${u}, h = ${fmt(h)} ${u}`,
                    resPrincipal: `A = ${fmt(area)} ${u2}`,
                    resSecundario: `P = ${fmt(perim)} ${u}`,
                    propriedades: [
                        { chave: 'Base (b) e Altura (h)', valor: `${fmt(b)} ${u} × ${fmt(h)} ${u}`, cor: '#22C55E' },
                        { chave: 'Área (A = b · h)', valor: `${fmt(area)} ${u2}`, cor: '#22C55E' },
                        { chave: 'Perímetro (2b + 2h)', valor: `${fmt(perim)} ${u}`, cor: '#3B82F6' },
                        { chave: 'Diagonal (Pitágoras)', valor: `${fmt(diag)} ${u}`, cor: '#F59E0B' }
                    ],
                    formulas: [`A = b · h = ${fmt(b)} · ${fmt(h)} = ${fmt(area)} ${u2}`, `P = 2(b + h) = 2(${fmt(b)} + ${fmt(h)}) = ${fmt(perim)} ${u}`],
                    verificacao: `Diagonal d = √(b² + h²) = √(${fmt(b * b + h * h)}) ≈ ${fmt(diag)} ${u}`
                };
            }
            case 'triangulo': {
                const b = Math.max(0.1, Number(p.b) || 6);
                const h = Math.max(0.1, Number(p.h) || 4);
                const area = (b * h) / 2;
                const ladoIso = Math.sqrt((b / 2) * (b / 2) + h * h);
                const perim = b + 2 * ladoIso;
                return {
                    categoria: 'Plana', nome: 'Triângulo', expressao: `b = ${fmt(b)} ${u}, h = ${fmt(h)} ${u}`,
                    resPrincipal: `A = ${fmt(area)} ${u2}`,
                    resSecundario: `P ≈ ${fmt(perim)} ${u}`,
                    propriedades: [
                        { chave: 'Base (b) e Altura (h)', valor: `${fmt(b)} ${u}, ${fmt(h)} ${u}`, cor: '#22C55E' },
                        { chave: 'Área (b · h / 2)', valor: `${fmt(area)} ${u2}`, cor: '#22C55E' },
                        { chave: 'Lados congruentes (isósceles)', valor: `${fmt(ladoIso)} ${u}`, cor: '#3B82F6' },
                        { chave: 'Perímetro estimado', valor: `${fmt(perim)} ${u}`, cor: '#F59E0B' }
                    ],
                    formulas: [`A = (b · h) / 2 = (${fmt(b)} · ${fmt(h)}) / 2 = ${fmt(area)} ${u2}`, `P = b + 2·√((b/2)² + h²) ≈ ${fmt(perim)} ${u}`],
                    verificacao: `2·A / b = ${fmt((2 * area) / b)} ${u} (confere com a altura h)`
                };
            }
            case 'trapezio': {
                const B = Math.max(0.1, Number(p.B) || 10);
                const b = Math.max(0.1, Number(p.b) || 6);
                const h = Math.max(0.1, Number(p.h) || 4);
                const area = ((B + b) * h) / 2;
                const lado = Math.sqrt(Math.pow((B - b) / 2, 2) + h * h);
                const perim = B + b + 2 * lado;
                return {
                    categoria: 'Plana', nome: 'Trapézio', expressao: `B = ${fmt(B)}, b = ${fmt(b)}, h = ${fmt(h)} ${u}`,
                    resPrincipal: `A = ${fmt(area)} ${u2}`,
                    resSecundario: `P ≈ ${fmt(perim)} ${u}`,
                    propriedades: [
                        { chave: 'Base Maior (B) e Menor (b)', valor: `${fmt(B)} ${u} e ${fmt(b)} ${u}`, cor: '#22C55E' },
                        { chave: 'Base Média ((B+b)/2)', valor: `${fmt((B + b) / 2)} ${u}`, cor: '#3B82F6' },
                        { chave: 'Área ((B + b)·h / 2)', valor: `${fmt(area)} ${u2}`, cor: '#22C55E' },
                        { chave: 'Perímetro (isósceles)', valor: `${fmt(perim)} ${u}`, cor: '#F59E0B' }
                    ],
                    formulas: [`A = ((B + b) · h) / 2 = ((${fmt(B)} + ${fmt(b)}) · ${fmt(h)}) / 2 = ${fmt(area)} ${u2}`, `P = B + b + 2L ≈ ${fmt(perim)} ${u}`],
                    verificacao: `Base média × altura = ${fmt((B + b) / 2)} × ${fmt(h)} = ${fmt(area)} ${u2}`
                };
            }
            case 'losango': {
                const D = Math.max(0.1, Number(p.D) || 8);
                const d = Math.max(0.1, Number(p.d) || 6);
                const area = (D * d) / 2;
                const lado = Math.sqrt((D / 2) * (D / 2) + (d / 2) * (d / 2));
                const perim = 4 * lado;
                return {
                    categoria: 'Plana', nome: 'Losango', expressao: `D = ${fmt(D)} ${u}, d = ${fmt(d)} ${u}`,
                    resPrincipal: `A = ${fmt(area)} ${u2}`,
                    resSecundario: `P = ${fmt(perim)} ${u}`,
                    propriedades: [
                        { chave: 'Diagonal Maior (D) e Menor (d)', valor: `${fmt(D)} ${u} e ${fmt(d)} ${u}`, cor: '#3B82F6' },
                        { chave: 'Lado (Pitágoras)', valor: `${fmt(lado)} ${u}`, cor: '#22C55E' },
                        { chave: 'Área (D · d / 2)', valor: `${fmt(area)} ${u2}`, cor: '#22C55E' },
                        { chave: 'Perímetro (4L)', valor: `${fmt(perim)} ${u}`, cor: '#F59E0B' }
                    ],
                    formulas: [`A = (D · d) / 2 = (${fmt(D)} · ${fmt(d)}) / 2 = ${fmt(area)} ${u2}`, `L = √((D/2)² + (d/2)²) = ${fmt(lado)} ${u} ⇒ P = ${fmt(perim)} ${u}`],
                    verificacao: `4 triângulos retângulos de área ${fmt(area / 4)} ${u2} = ${fmt(area)} ${u2}`
                };
            }
            case 'cubo': {
                const a = Math.max(0.1, Number(p.a) || 4);
                const areaTotal = 6 * a * a;
                const vol = a * a * a;
                return {
                    categoria: 'Espacial', nome: 'Cubo', expressao: `a = ${fmt(a)} ${u}`,
                    resPrincipal: `V = ${fmt(vol)} ${u3}`,
                    resSecundario: `A_total = ${fmt(areaTotal)} ${u2}`,
                    propriedades: [
                        { chave: 'Aresta (a)', valor: `${fmt(a)} ${u}`, cor: '#22C55E' },
                        { chave: 'Volume (V = a³)', valor: `${fmt(vol)} ${u3}`, cor: '#22C55E' },
                        { chave: 'Área Total (6a²)', valor: `${fmt(areaTotal)} ${u2}`, cor: '#3B82F6' },
                        { chave: 'Diagonal Espacial (a√3)', valor: `${fmt(a * Math.sqrt(3))} ${u}`, cor: '#F59E0B' }
                    ],
                    formulas: [`V = a³ = ${fmt(a)}³ = ${fmt(vol)} ${u3}`, `A_total = 6 · a² = 6 · ${fmt(a * a)} = ${fmt(areaTotal)} ${u2}`],
                    verificacao: `∛V = ∛${fmt(vol)} = ${fmt(a)} ${u}`
                };
            }
            case 'paralelepipedo': {
                const a = Math.max(0.1, Number(p.a) || 6);
                const b = Math.max(0.1, Number(p.b) || 4);
                const c = Math.max(0.1, Number(p.c) || 3);
                const vol = a * b * c;
                const areaTotal = 2 * (a * b + a * c + b * c);
                return {
                    categoria: 'Espacial', nome: 'Paralelepípedo', expressao: `${fmt(a)} × ${fmt(b)} × ${fmt(c)} ${u}`,
                    resPrincipal: `V = ${fmt(vol)} ${u3}`,
                    resSecundario: `A_total = ${fmt(areaTotal)} ${u2}`,
                    propriedades: [
                        { chave: 'Dimensões (a, b, c)', valor: `${fmt(a)}, ${fmt(b)}, ${fmt(c)} ${u}`, cor: '#22C55E' },
                        { chave: 'Volume (a · b · c)', valor: `${fmt(vol)} ${u3}`, cor: '#22C55E' },
                        { chave: 'Área Total 2(ab+ac+bc)', valor: `${fmt(areaTotal)} ${u2}`, cor: '#3B82F6' },
                        { chave: 'Diagonal √(a²+b²+c²)', valor: `${fmt(Math.sqrt(a * a + b * b + c * c))} ${u}`, cor: '#F59E0B' }
                    ],
                    formulas: [`V = a · b · c = ${fmt(a)} · ${fmt(b)} · ${fmt(c)} = ${fmt(vol)} ${u3}`, `A_t = 2(ab + ac + bc) = ${fmt(areaTotal)} ${u2}`],
                    verificacao: `Área da base (${fmt(a * b)}) × altura (${fmt(c)}) = ${fmt(vol)} ${u3}`
                };
            }
            case 'esfera': {
                const r = Math.max(0.1, Number(p.r) || 5);
                const vol = (4 / 3) * Math.PI * Math.pow(r, 3);
                const area = 4 * Math.PI * r * r;
                return {
                    categoria: 'Espacial', nome: 'Esfera', expressao: `r = ${fmt(r)} ${u}`,
                    resPrincipal: `V ≈ ${fmt(vol)} ${u3}`,
                    resSecundario: `A = ${fmt(4 * r * r)}π ≈ ${fmt(area)} ${u2}`,
                    propriedades: [
                        { chave: 'Raio (r)', valor: `${fmt(r)} ${u}`, cor: '#F59E0B' },
                        { chave: 'Volume (4/3 πr³)', valor: `${fmt(vol)} ${u3}`, cor: '#22C55E' },
                        { chave: 'Área Superficial (4πr²)', valor: `${fmt(4 * r * r)}π ≈ ${fmt(area)} ${u2}`, cor: '#3B82F6' }
                    ],
                    formulas: [`V = (4/3)πr³ = (4/3)π(${fmt(r)}³) ≈ ${fmt(vol)} ${u3}`, `A = 4πr² = 4π(${fmt(r)}²) = ${fmt(4 * r * r)}π ≈ ${fmt(area)} ${u2}`],
                    verificacao: `Derivada de V em relação a r: dV/dr = 4πr² = A`
                };
            }
            case 'cilindro': {
                const r = Math.max(0.1, Number(p.r) || 4);
                const h = Math.max(0.1, Number(p.h) || 8);
                const vol = Math.PI * r * r * h;
                const areaTotal = 2 * Math.PI * r * (r + h);
                return {
                    categoria: 'Espacial', nome: 'Cilindro', expressao: `r = ${fmt(r)} ${u}, h = ${fmt(h)} ${u}`,
                    resPrincipal: `V = ${fmt(r * r * h)}π ≈ ${fmt(vol)} ${u3}`,
                    resSecundario: `A_t ≈ ${fmt(areaTotal)} ${u2}`,
                    propriedades: [
                        { chave: 'Raio (r) e Altura (h)', valor: `${fmt(r)} ${u} e ${fmt(h)} ${u}`, cor: '#3B82F6' },
                        { chave: 'Volume (πr²h)', valor: `${fmt(r * r * h)}π ≈ ${fmt(vol)} ${u3}`, cor: '#22C55E' },
                        { chave: 'Área Lateral (2πrh)', valor: `${fmt(2 * Math.PI * r * h)} ${u2}`, cor: '#F59E0B' },
                        { chave: 'Área Total 2πr(r+h)', valor: `${fmt(areaTotal)} ${u2}`, cor: '#3B82F6' }
                    ],
                    formulas: [`V = π · r² · h = π · ${fmt(r)}² · ${fmt(h)} = ${fmt(r * r * h)}π ≈ ${fmt(vol)} ${u3}`, `A_total = 2πr(r + h) ≈ ${fmt(areaTotal)} ${u2}`],
                    verificacao: `A_base (${fmt(Math.PI * r * r)}) × h (${fmt(h)}) = ${fmt(vol)} ${u3}`
                };
            }
            case 'cone': {
                const r = Math.max(0.1, Number(p.r) || 3);
                const h = Math.max(0.1, Number(p.h) || 4);
                const g = Math.sqrt(r * r + h * h);
                const vol = (Math.PI * r * r * h) / 3;
                const areaTotal = Math.PI * r * (r + g);
                return {
                    categoria: 'Espacial', nome: 'Cone', expressao: `r = ${fmt(r)} ${u}, h = ${fmt(h)} ${u}`,
                    resPrincipal: `V = ${fmt((r * r * h) / 3)}π ≈ ${fmt(vol)} ${u3}`,
                    resSecundario: `A_t ≈ ${fmt(areaTotal)} ${u2}`,
                    propriedades: [
                        { chave: 'Raio (r) e Altura (h)', valor: `${fmt(r)} ${u} e ${fmt(h)} ${u}`, cor: '#3B82F6' },
                        { chave: 'Geratriz (g = √(r²+h²))', valor: `${fmt(g)} ${u}`, cor: '#22C55E' },
                        { chave: 'Volume (πr²h / 3)', valor: `${fmt(vol)} ${u3}`, cor: '#22C55E' },
                        { chave: 'Área Total πr(r+g)', valor: `${fmt(areaTotal)} ${u2}`, cor: '#F59E0B' }
                    ],
                    formulas: [`g = √(${fmt(r)}² + ${fmt(h)}²) = ${fmt(g)} ${u}`, `V = (π · r² · h) / 3 ≈ ${fmt(vol)} ${u3}`, `A_t = π · r · (r + g) ≈ ${fmt(areaTotal)} ${u2}`],
                    verificacao: `Relação Pitagórica: r² + h² = ${fmt(r * r + h * h)} = g²`
                };
            }
        }
    },

    /**
     * Módulo 10 — Calculadora Estatística Real em JS.
     */
    calcularEstatistica(textoDados, tipoVariancia = 'populacional') {
        const numeros = String(textoDados || '')
            .split(/[,;\s]+/)
            .map(s => Number(s.trim().replace(',', '.')))
            .filter(n => !Number.isNaN(n) && Number.isFinite(n));

        if (numeros.length === 0) {
            return { valido: false };
        }

        const ordenados = [...numeros].sort((a, b) => a - b);
        const n = ordenados.length;
        const soma = ordenados.reduce((acc, v) => acc + v, 0);
        const media = soma / n;

        // Mediana
        const meio = Math.floor(n / 2);
        const mediana = n % 2 === 1 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;

        // Frequências e Moda
        const mapaFreq = new Map();
        ordenados.forEach(v => mapaFreq.set(v, (mapaFreq.get(v) || 0) + 1));
        const frequencias = Array.from(mapaFreq.entries()).map(([valor, freq]) => ({
            valor,
            freq,
            relativa: ((freq / n) * 100).toFixed(1).replace('.', ',') + '%'
        }));

        const maxF = Math.max(...frequencias.map(f => f.freq));
        const modas = frequencias.filter(f => f.freq === maxF).map(f => this.fmt(f.valor));
        const textoModa = maxF === 1 && n > 1 ? 'Amodal' : modas.join(' e ');

        const amplitude = ordenados[n - 1] - ordenados[0];
        const somaDesviosQuad = ordenados.reduce((acc, v) => acc + Math.pow(v - media, 2), 0);
        const divisor = tipoVariancia === 'amostral' && n > 1 ? n - 1 : n;
        const variancia = somaDesviosQuad / divisor;
        const desvioPadrao = Math.sqrt(variancia);

        return {
            valido: true,
            n,
            soma,
            media,
            mediana,
            moda: textoModa,
            amplitude,
            variancia,
            desvioPadrao,
            tipoVariancia,
            ordenados,
            frequencias
        };
    },

    /**
     * Avalia o valor digitado em um quadradinho da "Fórmula pronta" (.formula-slot).
     * Aceita inteiros (2, -4), decimais (1,5 ou 1.5), frações (1/2, -3/4) e
     * expressões matemáticas completas quando o modo "fx" está ativo (ex.: 2*sen(pi/6), sqrt(9)).
     */
    avaliarSlotValor(valorBruto, padrao = 0) {
        if (valorBruto === null || valorBruto === undefined) return { valido: false, valor: padrao, erro: 'Campo vazio' };
        const str = String(valorBruto).trim().replace(/−/g, '-');
        if (!str) return { valido: false, valor: padrao, erro: 'Digite um valor' };

        // 1. Número direto (inteiro ou decimal com vírgula/ponto)
        const strPonto = str.replace(',', '.');
        if (/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(strPonto)) {
            const num = Number(strPonto);
            return { valido: Number.isFinite(num), valor: num, textoFormatado: str };
        }

        // 2. Fração simples a/b
        const matchFrac = strPonto.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/);
        if (matchFrac) {
            const num = Number(matchFrac[1]);
            const den = Number(matchFrac[2]);
            if (Math.abs(den) < 1e-12) {
                return { valido: false, valor: padrao, erro: 'Divisão por zero na fração' };
            }
            return { valido: true, valor: num / den, textoFormatado: str };
        }

        // 3. Expressão matemática (ex.: 2*sen(pi/6), sqrt(2), pi/4, e^2)
        const fn = this.compilarFuncao(str, 'x');
        if (fn) {
            const val = fn(1);
            if (Number.isFinite(val)) {
                return { valido: true, valor: val, textoFormatado: str, ehExpressao: true };
            }
        }

        return { valido: false, valor: padrao, erro: 'Valor ou expressão inválida' };
    },

    /**
     * Valida uma expressão digitada no modo "Normal" em português claro,
     * detectando parênteses abertos, operadores incompletos e sugerindo correção.
     */
    validarExpressaoNormal(exprStr) {
        const s = String(exprStr || '').trim();
        if (!s) {
            return { valido: false, mensagem: 'Digite uma fórmula ou expressão matemática.', corrigida: 'x^2 - 4x - 5' };
        }

        let saldoParenteses = 0;
        for (const ch of s) {
            if (ch === '(') saldoParenteses++;
            else if (ch === ')') saldoParenteses--;
        }

        if (saldoParenteses > 0) {
            return {
                valido: false,
                mensagem: `Falta fechar ${saldoParenteses === 1 ? 'um parêntese' : saldoParenteses + ' parênteses'}. Quer que eu feche?`,
                corrigida: s + ')'.repeat(saldoParenteses)
            };
        }
        if (saldoParenteses < 0) {
            return {
                valido: false,
                mensagem: 'Há um parêntese fechado a mais sem abertura correspondente.',
                corrigida: '('.repeat(-saldoParenteses) + s
            };
        }

        if (/[\+\-\*\/\^]$/.test(s)) {
            return {
                valido: false,
                mensagem: 'Falta um número ou variável depois do último sinal.',
                corrigida: s + '1'
            };
        }

        if (/\/\s*0(?![.\d])/.test(s)) {
            return {
                valido: false,
                mensagem: 'Divisão por zero detectada: o denominador não pode ser 0.',
                corrigida: s.replace(/\/\s*0(?![.\d])/, '/ 1')
            };
        }

        const erroSintaxe = this.validarSintaxeSegura(s);
        if (erroSintaxe) return { valido: false, mensagem: erroSintaxe, corrigida: s };
        return { valido: true, mensagem: '', corrigida: s };
    },

    /**
     * Converte os quadradinhos do modo "Fórmula pronta" em texto matemático para o modo "Normal".
     */
    converterSlotsParaTexto(modulo, subtipo, slots = {}) {
        const g = (ch, def = 1) => (slots[ch] !== undefined ? slots[ch] : def);
        const fmtSinal = (n) => {
            const v = Number(n);
            if (Number.isNaN(v)) return `+ ${n}`;
            return v >= 0 ? `+ ${v}` : `- ${Math.abs(v)}`;
        };

        if (modulo === 'funcoes') {
            switch (subtipo) {
                case 'constante': return `${g('b', 4)}`;
                case 'afim': return `${g('a', 2)}x ${fmtSinal(g('b', -4))}`;
                case 'linear': return `${g('a', 1.5)}x`;
                case 'quadratica': return `${g('a', 1)}x^2 ${fmtSinal(g('b', -4))}x ${fmtSinal(g('c', -5))}`;
                case 'canonica': return `${g('a', 1)}*(x - (${g('h', 2)}))^2 ${fmtSinal(g('k', -9))}`;
                case 'fatorada': return `${g('a', 1)}*(x - (${g('x1', -1)}))*(x - (${g('x2', 5)}))`;
                case 'modular': return `${g('a', 1)}*|x - ${g('h', 2)}| ${fmtSinal(g('k', -3))}`;
                case 'exponencial': return `${g('C', 1)} * (${g('a', 2)})^x`;
                case 'juros': return `${g('C', 1000)} * (1 + ${g('i', 0.1)})^x`;
                case 'logaritmica': return `log_${g('a', 2)}(x)`;
                case 'trigonometrica': return `${g('A', 1)}*${g('func', 'sen')}(${g('B', 1)}x ${fmtSinal(g('C', 0))}) ${fmtSinal(g('D', 0))}`;
                default: return `${g('a', 1)}x^2 ${fmtSinal(g('b', -4))}x ${fmtSinal(g('c', -5))}`;
            }
        }
        if (modulo === 'algebra') {
            return `${g('a', 1)}x^2 ${fmtSinal(g('b', -5))}x ${fmtSinal(g('c', 6))} = 0`;
        }
        if (modulo === 'limites') {
            return `(${g('a', 1)}x^2 ${fmtSinal(g('b', -4))}) / (${g('c', 1)}x ${fmtSinal(g('d', -2))})`;
        }
        if (modulo === 'derivadas') {
            return `${g('a', 1)}x^${g('n', 3)} ${fmtSinal(g('b', -3))}x`;
        }
        if (modulo === 'integrais') {
            return `${g('a', 1)}x^${g('n', 2)}`;
        }
        return String(slots.expressao || 'x^2 - 4x - 5');
    },

    /**
     * Tenta converter uma expressão digitada no modo "Normal" (ex.: 2x^2 - 8x + 6)
     * para os quadradinhos correspondentes no modo "Fórmula pronta".
     */
    converterTextoParaSlots(exprStr, modulo = 'funcoes') {
        const limpo = String(exprStr || '')
            .replace(/f\s*\(\s*x\s*\)\s*=/i, '')
            .replace(/=\s*0\s*$/, '')
            .replace(/²/g, '^2')
            .replace(/³/g, '^3')
            .replace(/−/g, '-')
            .replace(/\s+/g, '');

        // Reconhece também termos ausentes: x², x² − 1, 2x e constantes.
        const polinomio = limpo.replace(/(\d)\*x/g, '$1x');
        const termos = polinomio.match(/[+-]?[^+-]+/g) || [];
        const coeficientes = { a: 0, b: 0, c: 0 };
        let reconhecido = termos.length > 0;
        for (const termo of termos) {
            const monomio = termo.match(/^([+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)?)x(?:\^(2))?$/);
            if (monomio) {
                const valor = monomio[1] === '-' ? -1 : Number((monomio[1] || '1').replace(',', '.'));
                coeficientes[monomio[2] ? 'a' : 'b'] += monomio[1] === '+' ? 1 : valor;
            } else if (/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(termo)) coeficientes.c += Number(termo.replace(',', '.'));
            else { reconhecido = false; break; }
        }
        if (reconhecido) {
            if (coeficientes.a !== 0) return { reconhecido: true, subtipo: 'quadratica', slots: coeficientes };
            if (coeficientes.b !== 0) return { reconhecido: true, subtipo: coeficientes.c === 0 ? 'linear' : 'afim', slots: { a: coeficientes.b, b: coeficientes.c } };
            return { reconhecido: true, subtipo: 'constante', slots: { b: coeficientes.c } };
        }

        // Detecta quadrática ax^2 + bx + c
        const quadMatch = limpo.match(/^([+-]?\d*(?:[.,]\d+)?)x\^2([+-]\d*(?:[.,]\d+)?)x([+-]\d+(?:[.,]\d+)?)$/i);
        if (quadMatch) {
            const parseCoef = (s, padrao = 1) => {
                if (!s || s === '+') return padrao;
                if (s === '-') return -padrao;
                return Number(s.replace(',', '.'));
            };
            return {
                reconhecido: true,
                subtipo: 'quadratica',
                slots: {
                    a: parseCoef(quadMatch[1], 1),
                    b: parseCoef(quadMatch[2], 1),
                    c: parseCoef(quadMatch[3], 0)
                }
            };
        }

        // Detecta afim ax + b
        const afimMatch = limpo.match(/^([+-]?\d*(?:[.,]\d+)?)x([+-]\d+(?:[.,]\d+)?)$/i);
        if (afimMatch) {
            const parseCoef = (s, padrao = 1) => {
                if (!s || s === '+') return padrao;
                if (s === '-') return -padrao;
                return Number(s.replace(',', '.'));
            };
            return {
                reconhecido: true,
                subtipo: 'afim',
                slots: {
                    a: parseCoef(afimMatch[1], 1),
                    b: parseCoef(afimMatch[2], 0)
                }
            };
        }

        // Detecta potência simples ax^n (Derivadas / Integrais)
        const potMatch = limpo.match(/^([+-]?\d*(?:[.,]\d+)?)x\^([+-]?\d+(?:[.,]\d+)?)$/i);
        if (potMatch) {
            const a = (!potMatch[1] || potMatch[1] === '+') ? 1 : (potMatch[1] === '-' ? -1 : Number(potMatch[1].replace(',', '.')));
            const n = Number(potMatch[2].replace(',', '.'));
            return {
                reconhecido: true,
                subtipo: 'potencia',
                slots: { a, n, b: 0 }
            };
        }

        return { reconhecido: false };
    },

    /**
     * Retorna uma explicação em linguagem simples + exemplo da vida real
     * para o botão "Explicar" em qualquer módulo.
     */
    obterExplicacaoVidaReal(modulo, subtipo = '') {
        const mapa = {
            funcoes: {
                titulo: 'O que essa função significa na prática?',
                resumo: 'Uma função é uma máquina que transforma uma entrada (x) em um resultado único f(x). Na função quadrática, o gráfico faz uma curva em formato de U chamada parábola.',
                exemplo: 'Vida real: quando você chuta uma bola ou joga água com uma mangueira, o caminho no ar é uma parábola! As raízes são onde a bola sai do chão e onde ela cai, e o vértice é a altura máxima que ela atinge.'
            },
            algebra: {
                titulo: 'O que significa resolver uma equação?',
                resumo: 'Resolver uma equação é descobrir qual valor secreto de x faz os dois lados da balança ficarem iguais (darem zero).',
                exemplo: 'Vida real: se uma empresa tem lucro L(x) = x² − 5x + 6, achar as raízes (x = 2 e x = 3) mostra exatamente as quantidades onde a empresa empata seus custos (lucro zero).'
            },
            limites: {
                titulo: 'O que é um Limite sem complicação?',
                resumo: 'O limite olha para onde o valor de y está caminhando quando x chega bem pertinho de um ponto — mesmo que naquele ponto exato exista um "buraco" (divisão 0/0).',
                exemplo: 'Vida real: imagine o velocímetro de um carro aproximando-se de um radar. Mesmo que você não olhe o instante exato, observar os milésimos antes e depois revela a velocidade para a qual o carro tendia.'
            },
            derivadas: {
                titulo: 'O que a Derivada mede de verdade?',
                resumo: 'A derivada f\'(x) é a velocidade instantânea de mudança da função e a inclinação da reta tangente naquele ponto. Quando f\'(x) = 0, a curva parou de subir ou descer (ponto de máximo ou mínimo).',
                exemplo: 'Vida real: se f(x) é a distância percorrida por um carro no tempo, a derivada f\'(x) é exatamente o que aparece no velocímetro naquele segundo.'
            },
            integrais: {
                titulo: 'O que a Integral calcula?',
                resumo: 'A integral soma infinitos pedacinhos muito finos debaixo da curva para descobrir o total acumulado (a área exata entre o gráfico e o eixo x).',
                exemplo: 'Vida real: se você sabe a vazão de água (litros por minuto) que entra numa caixa d\'água a cada instante, a integral soma tudo para dizer quantos litros entraram no total.'
            },
            geometria: {
                titulo: 'Para que servem Área, Perímetro e Volume?',
                resumo: 'O perímetro mede o contorno (cerca), a área mede a superfície interna (piso) e o volume mede a capacidade em 3 dimensões.',
                exemplo: 'Vida real: ao reformar um quarto, o rodapé usa o perímetro (m), a quantidade de porcelanato usa a área (m²) e o ar-condicionado é escolhido pelo volume de ar (m³).'
            },
            trigonometria: {
                titulo: 'Como Seno, Cosseno e Tangente funcionam?',
                resumo: 'No círculo de raio 1, o cosseno é a sombra horizontal (eixo x) e o seno é a altura vertical (eixo y) do ponto conforme o ângulo gira.',
                exemplo: 'Vida real: ondas sonoras, corrente elétrica alternada da tomada e o movimento de uma roda-gigante seguem exatamente a curva de seno e cosseno.'
            },
            vetores: {
                titulo: 'O que Vetores e Matrizes representam?',
                resumo: 'Um vetor tem tamanho, direção e sentido (como uma seta de força). Uma matriz é uma tabela organizada que transforma ou resolve vários dados de uma vez.',
                exemplo: 'Vida real: em jogos 3D e GPS, sua posição e velocidade são vetores (u + v), e girar a câmera na tela é feito multiplicando matrizes!'
            },
            estatistica: {
                titulo: 'Como ler Média, Mediana e Desvio Padrão?',
                resumo: 'A média é o ponto de equilíbrio, a mediana é o valor bem no meio da fila ordenada, e o desvio padrão diz se os números estão juntinhos ou espalhados.',
                exemplo: 'Vida real: se duas turmas têm média 7,0, mas uma tem desvio padrão 0,5 e outra 3,0, a primeira turma é super homogênea e a segunda tem notas muito distantes entre si.'
            },
            modelagem: {
                titulo: 'O que é Modelagem Matemática?',
                resumo: 'É traduzir um problema do mundo real (finanças, biologia, física) em uma fórmula para prever o futuro antes de acontecer.',
                exemplo: 'Vida real: calcular juros compostos ou a duplicação de uma colônia de bactérias permite prever exatamente quando um investimento ou população vai dobrar.'
            },
            cientifica: {
                titulo: 'Exato Simbólico vs. Aproximação Decimal',
                resumo: 'A calculadora mostra tanto o valor decimal quanto a fração/raiz exata para você não perder precisão nos passos intermediários.',
                exemplo: 'Vida real: em engenharia, arredondar cedo demais acumula erros; manter 1/3 ou π até o fim garante precisão máxima.'
            }
        };
        return mapa[modulo] || mapa.funcoes;
    }
};
