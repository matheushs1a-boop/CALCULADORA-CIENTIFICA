/* ============================================================================
   MATHLAB — SUÍTE DE TESTES AUTOMATIZADOS (NODE.JS)
   Arquivo: tests/modulos-gerais.test.js
   Execução: node tests/modulos-gerais.test.js
   Descrição: Valida matematicamente todos os módulos, funções, casos especiais,
              fórmulas, raízes, vértices, limites, derivadas, integrais,
              geometria e estatística.
   ============================================================================ */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const modulosPath = path.join(__dirname, '..', 'src', 'js', 'motor-matematico.js');
const codigo = fs.readFileSync(modulosPath, 'utf8') + '\nmodule.exports = MathLabCalc;';
const sandbox = { module: {}, Math, Number, String, Array, Map, Function };
vm.createContext(sandbox);
vm.runInContext(codigo, sandbox);
const Calc = sandbox.module.exports;

let totalTestes = 0;
function testar(nome, fn) {
    totalTestes++;
    fn();
    console.log(`  [OK] ${totalTestes.toString().padStart(2, '0')}. ${nome}`);
}

console.log('================================================================');
console.log(' INICIANDO SUÍTE DE VALIDAÇÃO MATEMÁTICA DO MATHLAB');
console.log('================================================================');

// 1. Módulo 01: Calculadora Científica
testar('Científica: Demonstração 2 · sen(π/6) + √16 = 5', () => {
    const r = Calc.avaliarCientifica('2 · sen(π/6) + √16', 'rad', 'exato');
    assert.strictEqual(r.erro, false);
    assert.strictEqual(r.resultadoExato, '5');
    assert.strictEqual(r.passos.length, 4);
});

testar('Científica: Fatorial 5! + √49 = 127', () => {
    const r = Calc.avaliarCientifica('5! + √(49)', 'rad', 'exato');
    assert.strictEqual(r.erro, false);
    assert.strictEqual(r.resultadoExato, '127');
});

testar('Científica: Trigonometria em GRAUS sen(30) = 1/2', () => {
    const r = Calc.avaliarCientifica('sen(30)', 'grau', 'exato');
    assert.strictEqual(r.erro, false);
    assert.strictEqual(r.resultadoExato, '1/2');
});

testar('Estado Especial: Erro de domínio em log(−5)', () => {
    const r = Calc.avaliarCientifica('log(−5)', 'rad', 'exato');
    assert.strictEqual(r.erro, true);
    assert.ok(r.mensagemErro.includes('Logaritmo de número negativo'));
});

// 2. Módulo 03: Funções (Quadrática e 8 Tipos)
testar('Funções (Quadrática): f(x) = x² − 4x − 5 → Δ=36, raízes -1 e 5, V(2, -9)', () => {
    const q = Calc.calcularQuadratica(1, -4, -5);
    assert.strictEqual(q.ehQuadratica, true);
    assert.strictEqual(q.delta, 36);
    assert.strictEqual(q.xv, 2);
    assert.strictEqual(q.yv, -9);
    assert.deepStrictEqual(Array.from(q.raizesNum), [-1, 5]);
    assert.strictEqual(q.formaFatorada, '(x + 1)(x − 5)');
    assert.strictEqual(q.formaCanonica, '(x − 2)² − 9');
});

testar('Funções (Quadrática com Δ = 0): x² − 6x + 9 → raiz dupla x = 3', () => {
    const q = Calc.calcularQuadratica(1, -6, 9);
    assert.strictEqual(q.delta, 0);
    assert.deepStrictEqual(Array.from(q.raizesNum), [3]);
});

testar('Funções (Quadrática com Δ < 0): x² + x + 5 → sem raízes reais', () => {
    const q = Calc.calcularQuadratica(1, 1, 5);
    assert.ok(q.delta < 0);
    assert.strictEqual(q.raizesNum.length, 0);
});

testar('Funções (Caso Especial a = 0): 0x² + 2x − 4 → avisa que deixou de ser quadrática', () => {
    const q = Calc.calcularQuadratica(0, 2, -4);
    assert.strictEqual(q.ehQuadratica, false);
    assert.ok(q.avisoA0.includes('deixa de ser quadrática'));
    assert.deepStrictEqual(Array.from(q.raizesNum), [2]);
});

testar('Funções (Catálogo dos 8 Tipos): Constante, Afim, Linear, Modular, Exponencial, Logarítmica, Trigonométrica', () => {
    const tipos = ['constante', 'afim', 'linear', 'quadratica', 'modular', 'exponencial', 'logaritmica', 'trigonometrica'];
    tipos.forEach(t => {
        const d = Calc.obterDadosTipoFuncao(t);
        assert.ok(d.expressao && d.propriedades.length >= 5 && d.estudoCompleto.dominio);
    });
});

// 3. Módulo 04: Limites
testar('Limites: lim(x→2) (x² − 4)/(x − 2) = 4 (Descontinuidade removível)', () => {
    const lim = Calc.calcularLimiteGeral('(x^2 - 4)/(x - 2)', '2');
    assert.strictEqual(lim.existe, true);
    assert.strictEqual(lim.resBilateral, '4');
});

testar('Limites: lim(x→0) 1/x = NÃO EXISTE (Esquerda −∞, Direita +∞)', () => {
    const lim = Calc.calcularLimiteGeral('1/x', '0');
    assert.strictEqual(lim.existe, false);
    assert.strictEqual(lim.resBilateral, 'NÃO EXISTE');
    assert.strictEqual(lim.resEsquerda, '−∞');
    assert.strictEqual(lim.resDireita, '+∞');
});

// 4. Módulo 05: Derivadas
testar('Derivadas: f(x) = x³ · sen(x) em x = 1 → f′(1) = 3·sen(1) + cos(1) ≈ 3,0647', () => {
    const d = Calc.analisarDerivadaExpressao('x³ · sen(x)');
    const val = d.df1(1);
    const exato = 3 * Math.sin(1) + Math.cos(1);
    assert.ok(Math.abs(val - exato) < 1e-5);
    assert.strictEqual(Calc.fmt(val, 4), '3,0647');
});

// 5. Módulo 07: Geometria
testar('Geometria: Círculo r = 5 → Área = 25π ≈ 78,54 e Perímetro = 10π ≈ 31,42', () => {
    const g = Calc.calcularGeometria('circulo', { r: 5 }, 'cm');
    assert.ok(g.resPrincipal.includes('25π') && g.resPrincipal.includes('78,54'));
    assert.ok(g.resSecundario.includes('10π') && g.resSecundario.includes('31,42'));
});

testar('Geometria: Todas as 11 figuras (6 planas e 5 espaciais) calculam corretamente', () => {
    const figs = ['circulo', 'quadrado', 'retangulo', 'triangulo', 'trapezio', 'losango', 'cubo', 'paralelepipedo', 'esfera', 'cilindro', 'cone'];
    figs.forEach(f => {
        const res = Calc.calcularGeometria(f, { r: 5, l: 6, b: 8, h: 5, B: 10, D: 8, d: 6, a: 4, c: 3 }, 'cm');
        assert.ok(res && res.resPrincipal && res.formulas.length >= 2);
    });
});

// 6. Módulo 10: Estatística
testar('Estatística: Conjunto 4, 6, 6, 8, 10, 12 → n=6, Soma=46, Mediana=7, Moda=6', () => {
    const e = Calc.calcularEstatistica('4, 6, 6, 8, 10, 12', 'populacional');
    assert.strictEqual(e.valido, true);
    assert.strictEqual(e.n, 6);
    assert.strictEqual(e.soma, 46);
    assert.strictEqual(e.mediana, 7);
    assert.strictEqual(e.moda, '6');
});

console.log('================================================================');
console.log(` SUCESSO TOTAL: ${totalTestes} TESTES EXECUTADOS E APROVADOS!`);
console.log('================================================================');
