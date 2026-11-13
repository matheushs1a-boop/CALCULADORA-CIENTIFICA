// Referência independente: fórmulas diretas e identidades, sem usar o compilador do app.
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const contexto = vm.createContext({ Math, console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'motor-matematico.js'), 'utf8') + ';globalThis.Calc=MathLabCalc;', contexto);
const C = contexto.Calc;
let semente = 20261111;
const aleatorio = () => ((semente = (1664525 * semente + 1013904223) >>> 0) / 2 ** 32);
const inteiro = () => Math.floor(aleatorio() * 17) - 8;
const naoZero = () => inteiro() || 1;
const perto = (a, b, mensagem) => assert.ok(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(b)), `${mensagem}: ${a} ≠ ${b}`);
let funcoes = 0, comparacoes = 0;
for (const tipo of ['constante', 'afim', 'linear', 'quadratica', 'modular', 'exponencial', 'logaritmica', 'trigonometrica']) {
    for (let i = 0; i < 100; i++) {
        const a = naoZero(), b = inteiro(), c = inteiro();
        let p, referencia, identidade;
        if (tipo === 'constante') { p = { b }; referencia = () => b; identidade = f => perto(f(-3), f(5), 'Independência de x'); }
        if (tipo === 'afim' || tipo === 'linear') {
            p = { a, b: tipo === 'linear' ? 0 : b };
            referencia = x => a * x + p.b;
            identidade = f => { perto(f(1) - f(0), a, 'Inclinação por diferenças'); perto(f(-p.b / a), 0, 'Substituição da raiz'); };
        }
        if (tipo === 'quadratica') {
            p = { a, b, c }; referencia = x => a * (x + b / (2 * a)) ** 2 + c - b * b / (4 * a);
            identidade = f => {
                const q = C.calcularQuadratica(a, b, c);
                perto(q.delta, b ** 2 - 4 * a * c, 'Delta');
                perto(q.yv, f(q.xv), 'Vértice por substituição');
                perto(q.yv, c - b * b / (4 * a), 'Vértice por completamento');
                perto(f(q.xv - .7), f(q.xv + .7), 'Simetria');
                if (q.raizesNum.length) {
                    const [r1, r2 = r1] = q.raizesNum;
                    perto(f(r1), 0, 'Primeira raiz'); perto(f(r2), 0, 'Segunda raiz');
                    perto(r1 + r2, -b / a, 'Viète: soma'); perto(r1 * r2, c / a, 'Viète: produto');
                    perto(q.yv, -a * (r2 - r1) ** 2 / 4, 'Vértice pela forma fatorada');
                }
            };
        }
        if (tipo === 'modular') {
            p = { a, h: b, k: c }; referencia = x => x >= b ? a * (x - b) + c : -a * (x - b) + c;
            identidade = f => { perto(f(b - 2), f(b + 2), 'Simetria no vértice modular'); perto((f(b) - f(b - .5)) / .5, -a, 'Inclinação esquerda'); perto((f(b + .5) - f(b)) / .5, a, 'Inclinação direita'); };
        }
        if (tipo === 'exponencial') {
            p = { C: naoZero(), a: i % 2 ? 2 + aleatorio() : .2 + .6 * aleatorio() };
            referencia = x => p.C * Math.exp(x * Math.log(p.a));
            identidade = f => { perto(f(2) / f(1), p.a, 'Razão exponencial'); perto(f(.7) * f(1.3) / p.C, f(2), 'Lei dos expoentes'); };
        }
        if (tipo === 'logaritmica') {
            p = { a: i % 2 ? 2 + aleatorio() : .2 + .6 * aleatorio() };
            referencia = x => Math.log10(x) / Math.log10(p.a);
            identidade = f => { perto(f(1), 0, 'Log(1)'); perto(f(p.a), 1, 'Log(base)'); perto(Math.pow(p.a, f(2.3)), 2.3, 'Inversa exponencial'); assert.ok(Number.isNaN(f(-1))); };
        }
        if (tipo === 'trigonometrica') {
            p = { A: a, B: naoZero(), C: b, D: c };
            referencia = x => p.A * Math.cos(Math.PI / 2 - (p.B * x + p.C)) + p.D;
            identidade = f => { perto(f(.3), f(.3 + 2 * Math.PI / Math.abs(p.B)), 'Periodicidade'); perto(f((Math.PI / 2 - p.C) / p.B), p.D + p.A, 'Extremo do seno'); };
        }
        const dados = C.obterDadosTipoFuncao(tipo, p);
        assert.strictEqual(dados.invalido || false, false);
        const f = dados.grafico.curvas[0].fn;
        for (const x of tipo === 'logaritmica' ? [.1, .7, 1, 2, 5] : [-3, -.7, 0, 1, 2.3]) { perto(f(x), referencia(x), `${tipo}, amostra ${i}, x=${x}`); comparacoes++; }
        identidade(f);
        for (const chave of ['dominio', 'imagem', 'raizes', 'interceptos', 'crescimento', 'decrescimento', 'paridade', 'assintotas']) assert.ok(dados.estudoCompleto[chave], `${tipo}: ${chave} ausente`);
        for (const m of dados.grafico.marcadores) {
            perto(f(m.x), m.y, `${tipo}: marcador pertence à curva`);
            assert.ok(m.x >= dados.grafico.janela.xMin && m.x <= dados.grafico.janela.xMax, `${tipo}: marcador fora da janela x`);
            assert.ok(m.y >= dados.grafico.janela.yMin && m.y <= dados.grafico.janela.yMax, `${tipo}: marcador fora da janela y`);
        }
        funcoes++;
    }
    console.log(`[OK] ${tipo}: 100 funções, duas referências (fórmula e identidade), propriedades presentes e marcadores coerentes`);
}
console.log(`${funcoes} funções aleatórias; ${comparacoes} comparações de valores + identidades e marcadores. Semente: 20261111.`);
// Regressões de classificação, restrições e propriedades analíticas.
assert.strictEqual(C.obterDadosTipoFuncao('afim', { a: 0, b: 3 }).tipo, 'constante');
assert.strictEqual(C.obterDadosTipoFuncao('afim', { a: 2, b: 0 }).tipo, 'linear');
for (const a of [-2, 0, 1]) {
    for (const tipo of ['exponencial', 'logaritmica']) {
        const d = C.obterDadosTipoFuncao(tipo, { a });
        assert.strictEqual(d.invalido, true); assert.strictEqual(d.grafico.curvas.length, 0); assert.strictEqual(d.verificacao.aprovado, false);
    }
}
const modular = C.obterDadosTipoFuncao('modular', { a: 1, h: 0, k: 0 });
assert.strictEqual(modular.estudoCompleto.imagem, '[0, +∞)');
assert.strictEqual(modular.estudoCompleto.paridade, 'Par');
assert.strictEqual(modular.estudoCompleto.crescimento, '[0, +∞)');
assert.strictEqual(modular.estudoCompleto.decrescimento, '(−∞, 0]');
const exp = C.obterDadosTipoFuncao('exponencial', { C: 1, a: .5 });
assert.strictEqual(exp.estudoCompleto.imagem, '(0, +∞)');
assert.strictEqual(exp.estudoCompleto.interceptos, '(0, 1)');
assert.strictEqual(exp.estudoCompleto.decrescimento, 'Todo ℝ');
const log = C.obterDadosTipoFuncao('logaritmica', { a: .5 });
assert.strictEqual(log.estudoCompleto.dominio, '(0, +∞)');
assert.strictEqual(log.estudoCompleto.imagem, 'ℝ');
assert.strictEqual(log.estudoCompleto.raizes, 'x = 1');
assert.strictEqual(log.estudoCompleto.assintotas, 'x = 0 (vertical)');
const trig = C.obterDadosTipoFuncao('trigonometrica', { A: 2, B: 3, C: 1, D: 4 });
assert.strictEqual(trig.estudoCompleto.imagem, '[2, 6]');
perto(trig.periodo, 2 * Math.PI / 3, 'Período'); perto(trig.fase, -1 / 3, 'Fase');
console.log('[OK] Regressões analíticas: classificação, bases inválidas, imagem, paridade, monotonicidade, assíntotas, período e fase.');
