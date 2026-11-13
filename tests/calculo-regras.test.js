// Cada derivada é conferida pela regra algébrica e pelo limite do quociente incremental.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = vm.createContext({ console, Math });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'motor-matematico.js'), 'utf8') + ';globalThis.C=MathLabCalc', ctx);
const C = ctx.C;
function perto(a, b, tol = 1e-4) { assert.ok(Number.isFinite(a) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`); }
const derivadas = [
    ['constante', '7', () => 0, () => 7],
    ['potência', 'x^4', x => 4*x**3, x => x**4],
    ['soma/subtração', 'x^3-3x', x => 3*x*x-3, x => x**3-3*x],
    ['produto', 'x^3*sen(x)', x => 3*x*x*Math.sin(x)+x**3*Math.cos(x), x => x**3*Math.sin(x)],
    ['quociente', '(x^2+1)/(x+2)', x => (2*x*(x+2)-(x*x+1))/(x+2)**2, x => (x*x+1)/(x+2)],
    ['cadeia', 'sen(2x+1)', x => 2*Math.cos(2*x+1), x => Math.sin(2*x+1)]
];
for (const [regra, expr, referencia, f] of derivadas) {
    const d = C.analisarDerivadaExpressao(expr);
    assert.ok(d.dfSimbolica, `Derivação simbólica ausente: ${expr}`);
    for (const x of [.3, .7, 1.2]) {
        perto(d.df1(x), referencia(x));
        perto(d.dfSimbolica(x), referencia(x));
        const h = 1e-5;
        const pelaDefinicao = (f(x+h)-f(x))/h;
        perto(d.dfSimbolica(x), pelaDefinicao, 3e-4);
    }
    console.log(`[OK] Derivada: ${regra}; regra simbólica, fórmula independente e quociente incremental`);
}
assert.ok(Number.isNaN(C.analisarDerivadaExpressao('abs(x)').df1(0)));
console.log('[OK] Modular: derivada não existe na quina x=0.');
// Integrais: primeiro derivamos a primitiva; depois comparamos com Simpson independente.
const integrais = [
    ['constante', '3', x => 3*x, () => 3],
    ['potência', 'x^2', x => x**3/3, x => x*x],
    ['soma/subtração', 'x^2+2x-1', x => x**3/3+x*x-x, x => x*x+2*x-1],
    ['exponencial', 'e^(2x)', x => Math.exp(2*x)/2, x => Math.exp(2*x)],
    ['trigonométrica', 'sen(x)', x => -Math.cos(x), x => Math.sin(x)],
    ['substituição', '2x*cos(x^2)', x => Math.sin(x*x), x => 2*x*Math.cos(x*x)]
];
function simpsonReferencia(f, a, b) {
    const n = 600, h = (b-a)/n;
    let s = f(a) + f(b);
    for(let i=1;i<n;i++) s += (i%2?4:2)*f(a+i*h);
    return s*h/3;
}
for(const [regra, expr, Fref, fref] of integrais) {
    const r = C.calcularIntegral(expr, .2, 1.1);
    assert.strictEqual(r.valido, true, `${expr}: ${r.mensagem}`);
    assert.ok(r.primitiva, expr);
    const derivada = C.derivarElementar(r.primitiva.expressao);
    assert.ok(derivada, r.primitiva.expressao);
    const df = C.compilarFuncao(derivada);
    for(const x of [.3,.7,1]) perto(df(x), fref(x));
    perto(r.resultado, Fref(1.1)-Fref(.2));
    perto(r.resultado, simpsonReferencia(fref,.2,1.1));
    console.log(`[OK] Integral: ${regra}; derivada da primitiva, fórmula independente e Simpson`);
}
assert.strictEqual(C.calcularIntegral('1/x', -1, 1).valido, false);
const naoElementar = C.calcularIntegral('e^(-x^2)', 0, 1);
assert.strictEqual(naoElementar.primitiva, null);
assert.strictEqual(naoElementar.valido, true);
perto(naoElementar.resultado, .7468241328124271);
console.log('[OK] Singularidade rejeitada e integral não elementar identificada como aproximação.');
