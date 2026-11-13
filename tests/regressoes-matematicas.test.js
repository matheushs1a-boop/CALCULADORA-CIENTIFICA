const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const contexto = vm.createContext({ console, Math });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'motor-matematico.js'), 'utf8') + ';globalThis.Calc=MathLabCalc;', contexto);
const C = contexto.Calc;
let total = 0;
function testar(nome, fn) { fn(); console.log(`[OK] ${++total}. ${nome}`); }
const perto = (a, b, tol = 1e-6) => assert.ok(Number.isFinite(a) && Math.abs(a - b) < tol, `${a} ≠ ${b}`);
testar('Função zero tem todos os reais como raízes', () => assert.ok(C.calcularQuadratica(0, 0, 0).raizesTexto.includes('Todo x')));
testar('Quadrática negativa: imagem limitada acima e quatro formas do vértice', () => {
    const q = C.calcularQuadratica(-2, 8, 10);
    perto(q.xv, 2); perto(q.yv, 18);
    assert.strictEqual(q.imagem, '(−∞, 18]');
    for (const v of [q.yvPorSubstituicao, q.yvPorCompletamento, q.yvPorFatorada]) perto(v, 18);
    assert.strictEqual(q.verificado4Formas, true);
});
testar('Delta negativo não inventa conferência por fatoração real', () => {
    const q = C.calcularQuadratica(1, 1, 5);
    assert.strictEqual(q.yvPorFatorada, null); assert.strictEqual(q.verificado4Formas, false); assert.strictEqual(q.verificado, true);
});
testar('Coeficiente pequeno não é transformado silenciosamente em zero', () => assert.strictEqual(C.calcularQuadratica(1e-10, 0, -1).ehQuadratica, true));
testar('Raiz pequena preservada com Bhaskara estável', () => {
    const q = C.calcularQuadratica(1, 1e9, 1);
    perto(q.raizesNum[1], -1e-9, 1e-15); perto(q.fn(q.raizesNum[1]), 0);
});
testar('NaN, infinito e textos iguais não autorizam selo Verificado', () => {
    for (const valor of [NaN, Infinity, -Infinity, '5']) assert.strictEqual(C.verificarResultadoDuplo(valor, valor).aprovado, false);
});
testar('Erro forçado no segundo método é detectado', () => {
    const original = C.compilarFuncao;
    try {
        C.compilarFuncao = () => () => 12345;
        const d = C.obterDadosTipoFuncao('afim', { a: 2, b: 1 });
        assert.strictEqual(d.verificacao.aprovado, false);
    } finally { C.compilarFuncao = original; }
});
testar('Amostragem não prova paridade nem gera selo em expressão livre', () => {
    const d = C.analisarFuncaoCustomizada('x*(x^2-4)+1');
    assert.ok(d.estudoCompleto.paridade.startsWith('Não determinada'));
    assert.strictEqual(d.verificacao.aprovado, false);
});
testar('Exemplo científico respeita graus e radianos', () => {
    const rad = C.avaliarCientifica('2 · sen(π/6) + √16', 'rad');
    const grau = C.avaliarCientifica('2 · sen(π/6) + √16', 'grau');
    assert.strictEqual(rad.resultadoExibido, '5');
    perto(Number(grau.resultadoDecimal.replace(',', '.')), 4 + 2 * Math.sin(Math.PI * Math.PI / 1080), 1e-3);
    assert.strictEqual(C.avaliarCientifica('tg(pi/2)', 'grau').erro, false);
});
testar('π e pi têm o mesmo valor sem duplicar Math no compilador', () => {
    perto(C.compilarFuncao('sen(π/2)')(0), 1);
    perto(C.compilarFuncao('sen(pi/2)')(0), 1);
    assert.strictEqual(C.avaliarCientifica('cos(π)', 'rad').resultadoExibido, '-1');
});
testar('Entradas sujas: 2x, vírgula decimal, parênteses, notação científica', () => {
    perto(C.compilarFuncao('2x + 1,5')(2), 5.5);
    perto(C.compilarFuncao('1e100')(0) / 1e100, 1);
    assert.strictEqual(C.validarExpressaoNormal('sen(').valido, false);
    assert.strictEqual(C.validarExpressaoNormal('x'.repeat(501)).valido, false);
    assert.ok(Number.isNaN(C.compilarFuncao('') (0)));
});
testar('Código JavaScript e identificadores desconhecidos não são executados', () => {
    for (const e of ['(()=>{while(true){}})()', 'globalThis.alert(1)', 'x.constructor', 'banana(x)']) {
        assert.ok(C.validarSintaxeSegura(e));
        assert.ok(Number.isNaN(C.compilarFuncao(e)(1)));
        assert.strictEqual(C.avaliarCientifica(e).erro, true);
    }
});
testar('Divisão por zero, raiz negativa, log inválido e tangente indefinida', () => {
    for (const e of ['1/0', 'sqrt(-1)', 'log(0)', 'log(-2)', 'tg(pi/2)']) assert.strictEqual(C.avaliarCientifica(e).erro, true, e);
    assert.ok(Number.isNaN(C.compilarFuncao('tg(x)')(Math.PI / 2)));
    perto(C.compilarFuncao('sen(x)', 'grau')(30), .5);
    perto(C.compilarFuncao('sen(x)^2+cos(x)^2')(.7), 1);
});
testar('Potência preserva funções, precedência e associação à direita', () => {
    perto(C.compilarFuncao('sen(x)^2+cos(x)^2')(.7), 1);
    perto(C.compilarFuncao('2^3^2')(0), 512);
    perto(C.compilarFuncao('-x^2')(3), -9);
    perto(C.compilarFuncao('(-x)^2')(3), 9);
    perto(C.compilarFuncao('(x+1)^(-2)')(1), .25);
});
testar('Limite sem domínio real não é chamado de infinito negativo', () => {
    const l = C.calcularLimiteGeral('sqrt(x)', '0');
    assert.strictEqual(l.resEsquerda, 'Indefinido no domínio real');
    assert.strictEqual(l.resBilateral, 'NÃO EXISTE');
});
testar('Limite em ponto inválido não é calculado em zero', () => {
    const l = C.calcularLimiteGeral('x+1', 'abc');
    assert.strictEqual(l.resBilateral, 'Ponto inválido');
    assert.strictEqual(l.grafico.curvas.length, 0);
});
testar('Gráfico de limite removível conserva o buraco sem inventar valores', () => {
    const l = C.calcularLimiteGeral('(x^2-4)/(x-2)', '2');
    assert.strictEqual(l.resBilateral, '4');
    assert.ok(Number.isNaN(l.grafico.curvas[0].fn(2)));
    assert.strictEqual(l.grafico.marcadores[0].vazado, true);
    // Método independente: fatoração (x²−4)/(x−2) = x+2 para x ≠ 2.
    for (const x of [1.99, 2.01]) perto(l.fn(x), x + 2);
});
testar('Oscilação no infinito não é descrita como crescimento ilimitado', () => {
    const l = C.calcularLimiteGeral('sen(x)', 'oo');
    assert.strictEqual(l.existe, false);
    assert.ok(l.continuidade.includes('não confirmado'));
});
testar('Coeficientes enormes não geram gráfico ou selo em silêncio', () => {
    const d = C.obterDadosTipoFuncao('quadratica', { a: 1e300, b: 1e300, c: 1e300 });
    assert.strictEqual(d.invalido, true); assert.strictEqual(d.grafico.curvas.length, 0); assert.strictEqual(d.verificacao.aprovado, false);
    assert.ok(d.mensagemErro.includes('faixa suportada'));
});

testar('Fatorial acima da faixa suportada não retorna 170! silenciosamente', () => {
    assert.strictEqual(C.avaliarCientifica('171!').erro, true);
    assert.ok(Number.isNaN(C._fatorial(2.5)));
    assert.strictEqual(C._fatorial(5), 120);
});
console.log(`${total} regressões aprovadas.`);
