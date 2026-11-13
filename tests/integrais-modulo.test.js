// Exercita o estado real, sem simular resultados matemáticos ou depender do DOM.
const assert=require('assert'), fs=require('fs'), vm=require('vm'), path=require('path');
const c=vm.createContext({console,Math,document:{addEventListener(){}},localStorage:{setItem(){}}});
for(const f of ['src/js/motor-matematico.js','src/js/app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
const app=vm.runInContext('MathLabApp',c), calc=vm.runInContext('MathLabCalc',c);
app.state.activeModule='integrais'; app.renderModuloIntegrais=()=>{};
function dados(expr='x^2',a=0,b=3,tipo='definida'){
    Object.assign(app.state.integrais,{funcaoExpr:expr,a,b,tipo});app.state.slotTextos={};return app.obterDadosIntegrais();
}
function perto(a,b,tol=1e-6){assert.ok(Math.abs(a-b)<=tol,`${a} ≠ ${b}`);}
let d=dados();assert.ok(d.verificado);perto(d.integral.resultado,9);
assert.strictEqual(d.resultado,'∫₀³ x² dx = 9');assert.strictEqual(d.numero(d.integral.resultado),'9,000000');
assert.deepStrictEqual(JSON.parse(JSON.stringify(d.janela)),{xMin:-.6,xMax:3.6,yMin:-.9,yMax:9.9});
for(const [n,v] of [[4,8.859375],[10,8.9775],[100,8.999775]])perto(d.medio(n),v);
console.log('[OK] D1/D2/D5: janela, resultado único, três pontos médios e verificação.');
d=dados('x^2',0,5);assert.ok(d.resultado.includes('125/3'));assert.strictEqual(d.numero(d.integral.resultado),'41,666667');
app.state.slotTextos.integrais_b='π/2';d=app.obterDadosIntegrais();perto(d.b,Math.PI/2);
console.log('[OK] D3: b = 5 e limite em expressão π/2 atualizam o mesmo estado.');
d=dados('sen(x)',0,Math.PI);perto(d.integral.resultado,2);assert.ok(d.verificado);
d=dados('sen(x)',0,2*Math.PI);perto(d.integral.resultado,0);perto(d.areaGeometrica,4);assert.ok(d.positiva&&d.negativa);
d=dados('x^3',-1,1);perto(d.integral.resultado,0);assert.ok(d.positiva&&d.negativa);
console.log('[OK] Áreas com sinal: seno em [0,π], [0,2π] e potência ímpar em [-1,1].');
d=dados('x^2',0,3,'indefinida');assert.ok(d.resultado.includes('x³/3 + C'));perto(d.F(3),9);
d=dados('x^2',3,0);perto(d.integral.resultado,-9);assert.ok(d.aviso.includes('troca de sinal'));
d=dados('');assert.ok(!d.valido);assert.strictEqual(d.aviso,'Digite uma função válida');
d=dados();app.state.slotTextos.integrais_b='';d=app.obterDadosIntegrais();assert.ok(!d.valido);assert.strictEqual(app.state.slotTextos.integrais_b,'');
console.log('[OK] Indefinida, limites invertidos, função vazia e limite vazio preservados.');
d=dados();const original=calc.calcularIntegral.bind(calc);
calc.calcularIntegral=(...args)=>({...original(...args),simpson:9.01});assert.ok(!app.obterDadosIntegrais().verificado);
calc.calcularIntegral=(...args)=>({...original(...args),primitiva:{expressao:'x',regra:'Forçada'}});assert.ok(!app.obterDadosIntegrais().verificado);calc.calcularIntegral=original;
console.log('[OK] Verificação rejeita Simpson divergente e primitiva incorreta.');
app.state.inputMode='normal';app.aplicarExpressaoModoNormal('∫(0,3) x^2 dx');assert.strictEqual(app.state.integrais.funcaoExpr,'x^2');perto(app.obterDadosIntegrais().integral.resultado,9);
app.state.inputMode='pronta';assert.strictEqual(app.obterExpressaoTextoAtual(),'∫(0,3) x^2 dx');
app.aplicarValorSlot('b',5);assert.strictEqual(app.state.integrais.b,5);
const html=app.obterConfigFormulaPronta().formulaMontada;assert.ok(html.includes('integral-limits'));assert.ok(html.includes('<sup>'));
console.log('[OK] Conversão texto ↔ fórmula, limites empilhados e expoente.');
