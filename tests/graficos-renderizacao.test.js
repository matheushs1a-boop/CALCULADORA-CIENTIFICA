// Testa os comandos de desenho reais. Não substitui a inspeção visual no navegador.
const assert = require('assert'), fs = require('fs'), vm = require('vm'), path = require('path');
const contexto = vm.createContext({ Math, console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'motor-grafico.js'), 'utf8') + ';globalThis.G=MathLabGraph', contexto);
const G = contexto.G;
G.largura = 801; G.altura = 500; G.janela = { xMin: -4, xMax: 4, yMin: -6, yMax: 6 };
let comandos = [];
const ctx = { save(){}, restore(){}, beginPath(){}, stroke(){}, fill(){}, closePath(){}, setLineDash(){}, moveTo(x,y){comandos.push(['M',x,y]);}, lineTo(x,y){comandos.push(['L',x,y]);} };
for(const [nome, fn, polos] of [['1/x', x=>1/x, [0]], ['tg(x)', x=>Math.tan(x), [-Math.PI/2, Math.PI/2]]]) {
    comandos=[]; G.desenharCurva(ctx,{fn});
    let anterior;
    for(const c of comandos) {
        const x=G.pxParaX(c[1]);
        if(c[0]==='L' && anterior!==undefined) for(const polo of polos) assert.ok(!((anterior < polo && x > polo)||(anterior > polo && x < polo)), `${nome}: linha ligando ramos pelo polo`);
        anterior=x;
    }
    console.log(`[OK] Gráfico ${nome}: ramos não são unidos através das assíntotas.`);
}
for(const [nome, fn, a,b,esperado] of [['x²', x=>x*x,0,3,9],['x',x=>x,-1,1,0]]) {
    comandos=[]; G.desenharAreaIntegral(ctx,{a,b,fn});
    const pontos=comandos.map(c=>[G.pxParaX(c[1]),G.pyParaY(c[2])]);
    let soma=0;
    for(let i=0;i<pontos.length;i++){const u=pontos[i],v=pontos[(i+1)%pontos.length];soma+=u[0]*v[1]-v[0]*u[1];}
    const integralDesenhada=-soma/2;
    assert.ok(Math.abs(integralDesenhada-esperado)<1e-3, `${nome}: área líquida ${integralDesenhada} ≠ ${esperado}`);
    console.log(`[OK] Sombreamento ${nome}: integral líquida do polígono ≈ ${integralDesenhada.toFixed(6)}; referência ${esperado}.`);
}
