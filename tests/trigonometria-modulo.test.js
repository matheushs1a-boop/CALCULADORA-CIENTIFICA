// Referências independentes para a família A·fn(Bx+C)+D e ângulos notáveis.
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const ctx=vm.createContext({console,Math,setTimeout,clearTimeout,document:{addEventListener(){},querySelector(){return null},getElementById(){return null}},localStorage:{setItem(){}}});
for(const p of ['src/js/motor-matematico.js','src/js/app.js'])vm.runInContext(fs.readFileSync(p,'utf8'),ctx);
const app=vm.runInContext('MathLabApp',ctx);
app.atualizarTrigonometria=()=>{};
const padrao={funcao:'sen',amplitude:1,frequencia:1,fase:0,deslocamento:0,anguloGraus:30,unidadeAngulo:'graus'};
function dados(p={}){Object.assign(app.state.trigonometria,padrao,p);return app.obterDadosTrigonometria();}
function perto(a,b){assert.ok(Math.abs(a-b)<1e-10,`${a} ≠ ${b}`);}
let d=dados();assert.equal(d.expressao,'sen(x)');assert.equal(d.periodo,'2π');assert.equal(d.imagem,'[−1, 1]');assert.equal(d.paridade,'Ímpar');assert.equal(d.grafico.curvas[0].espessura,3);
assert.ok(d.grafico.marcadores.some(m=>Math.abs(m.x-Math.PI/2)<1e-10&&m.y===1&&m.cor==='#EF4444'));
console.log('[OK] 1–2. Seno: janela, curva, marcadores e propriedades padrão.');
d=dados({amplitude:2,frequencia:3});assert.equal(d.expressao,'2·sen(3x)');assert.equal(d.periodo,'2π/3');perto(d.fn(Math.PI/6),2);
d=dados({funcao:'cos',amplitude:3,frequencia:2,deslocamento:1});assert.equal(d.periodo,'π');assert.equal(d.imagem,'[−2, 4]');assert.equal(d.paridade,'Par');
console.log('[OK] 3–4. Ondas parametrizadas: frequência e deslocamento vertical.');
d=dados({fase:Math.PI/2});for(const x of [-4,-1,0,.5,2,5])perto(d.fn(x),Math.cos(x));assert.equal(d.paridade,'Par');assert.equal(d.fase,'−π/2');
console.log('[OK] 5. sen(x+π/2) = cos(x), com fase e paridade corretas.');
d=dados();perto(d.sen,.5);assert.equal(app.valorExatoTrig(d.cos),'√3/2');assert.equal(app.valorExatoTrig(d.tangente),'√3/3');assert.ok(d.verificado);
d=dados({anguloGraus:90});assert.equal(d.tangente,null);assert.ok(d.verificado);
console.log('[OK] 6. Valores exatos em 30° e tangente indefinida em 90°.');
d=dados({funcao:'tg'});assert.equal(d.grafico.assintotas.length,4);assert.ok(!Number.isFinite(d.fn(Math.PI/2)));assert.equal(d.periodo,'π');
d=dados({funcao:'tg',frequencia:-2,fase:Math.PI/6});for(const a of d.grafico.assintotas)assert.ok(Math.abs(Math.cos(-2*a.valor+Math.PI/6))<1e-10);
console.log('[OK] 7. Polos da tangente transformada, incluindo B negativo.');
for(const p of [{amplitude:NaN},{fase:NaN},{deslocamento:NaN},{anguloGraus:NaN}]){d=dados(p);assert.equal(d.valido,false);assert.equal(d.grafico.curvas.length,0);assert.ok(d.grafico.mensagemVazia);}
d=dados({frequencia:0});assert.equal(d.imagem,'{0}');assert.ok(d.periodo.includes('Constante'));
d=dados({funcao:'tg',frequencia:0,fase:Math.PI/2});assert.equal(d.valido,false);
console.log('[OK] Entradas inválidas e casos degenerados A/B=0.');
const tabela=app.gerarTabelaTrigonometrica();assert.equal((tabela.match(/<tr>/g)||[]).length,18);assert.equal((tabela.match(/Indefinida/g)||[]).length,2);
app.aplicarTextoTrigonometria('3·cos(2x + π/6) + 1');d=app.obterDadosTrigonometria();perto(d.C,Math.PI/6);perto(d.fn(.7),3*Math.cos(1.4+Math.PI/6)+1);
app.aplicarTextoTrigonometria('tg(x)');assert.equal(app.state.trigonometria.funcao,'tg');
console.log('[OK] Tabela completa e sincronização do modo Normal.');
// Sinais, paridade e imagem em uma grade de parâmetros, por avaliação direta.
for(const funcao of ['sen','cos','tg'])for(const amplitude of [-2,0,3])for(const frequencia of [-2,0,3])for(const fase of [0,Math.PI/2,.3])for(const deslocamento of [-1,0,2]){
 d=dados({funcao,amplitude,frequencia,fase,deslocamento});
 if(!d.valido)continue;
 for(const x of [-1.3,.2,.7]){
 const ref=amplitude*(funcao==='sen'?Math.sin(frequencia*x+fase):funcao==='cos'?Math.cos(frequencia*x+fase):Math.tan(frequencia*x+fase))+deslocamento;
 perto(d.fn(x),ref);
 if(d.paridade==='Par')perto(d.fn(x),d.fn(-x));
 if(d.paridade==='Ímpar')perto(d.fn(x),-d.fn(-x));
 }
}
console.log('[OK] 243 combinações de A, B, C, D e função por referência independente.');
