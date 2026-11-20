const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const arquivoMotor = path.resolve(__dirname, '../../../src/js/motor-matematico.js');
const motor = vm.runInNewContext(fs.readFileSync(arquivoMotor, 'utf8') + '\nMathLabCalc', { console });
const casos = [];
function incluir(grupo, metodo, entradas) {
  for (const args of entradas) casos.push({ grupo, metodo, args });
}

incluir('A1', 'avaliarCientifica', [
  '(2/3)^(−2)', '2/3^(−2)', '(−2)^(−2)', '−2^(−2)', '2^(−1)+2^(−2)', '(3/4)^0', '0^0',
  '(2³)²', '2^(3²)', '2^3^2', '8^(2/3)', '16^(−1/2)', '27^(−2/3)', '(0,25)^(−1/2)', '(−8)^(1/3)',
  '(2/3)² · (3/2)²', '√((-3)²)', '(−8)^(1/2)', '2/3+3/4', '(2/3)÷(4/9)', '18/24',
  '1/√2', '3/(1+√2)', '1 1/2', '0,75', '0,333…', '0,1666…', '1/8', '1/7', '3,2·10⁻³', '5000', '√12', '∛54'
].map(expr => [expr]));
incluir('A1 conversões', 'avaliarCientifica', ['0,75', '1/8', '1/7', '5000'].map(expr => [expr, 'rad', 'decimal']));
incluir('A2', 'avaliarCientifica', [
  'log2(8)', 'log_2(8)', 'log(8,2)', 'log2(1/8)', 'log(8,1/2)', 'log(1000)', 'ln(e³)', 'e^(ln(5))',
  'log(3,2)·log(2,3)', 'log2(10)', '|−5|', '−|−3|', '|x−3|=5', '|x|<3', '|x|>3',
  'x²−4x−5≤0', '−1≤x≤5', '[−1,5]', ']2,3[', '(x−2)(x−3)>0'
].map(expr => [expr]));
incluir('A3', 'compilarFuncao', [
  'x^2','x²','x**2','x^(2)','2^-1','2^(−1)','2^−1','√x','sqrt(x)','raiz(x)','x^(1/2)','x^0,5',
  'e^x','exp(x)','E^x','ln(x)','log(x)','log2(x)','log(x, 2)','sen(x)','sin(x)','tg(x)','tan(x)',
  'cotg(x)','sec(x)','cossec(x)','arcsen(x)','asin(x)','sen²(x)','sen^2(x)','sen(x)^2','sen^(−1)(x)',
  '2,5','2.5','1e-3','π','pi','2π','1/3','2x','2*x','2·x','2×x','2÷x','−x²','2x²','2^−x','1/2x','1.000'
].map(expr => [expr]));
incluir('A1 identidades', 'compilarFuncao', ['2^x·2^(−x)','4^x','2^(2x)','2^(x+1)','2·2^x','√(x²)','1/√x','x^(−1/2)'].map(e=>[e]));
incluir('A2 polinômios', 'compilarFuncao', ['x²−4x−5','(x+1)(x−5)','(x−2)²−9','2x²−8x+6','2(x−1)(x−3)','2(x−2)²−2'].map(e=>[e]));
incluir('A4', 'obterDadosTipoFuncao', Object.entries({
  constante: [{b:5},{b:-5},{b:0},{b:.25}],
  afim: [{a:2,b:3},{a:-.5,b:3},{a:0,b:3},{a:2,b:0},{a:2/3,b:-4},{a:1e-10,b:2}],
  linear: [{a:3},{a:-3},{a:0}],
  quadratica: [{a:1,b:-4,c:-5},{a:-1,b:-4,c:5},{a:1,b:-6,c:9},{a:1,b:0,c:7},{a:1,b:-2,c:0},{a:.5,b:2/3,c:-.25},{a:0,b:2,c:1}],
  modular: [{a:1,h:0,k:0},{a:1,h:2,k:1},{a:-1,h:0,k:0},{a:-2,h:3,k:1}],
  exponencial: [{a:2,C:1},{a:2/3,C:1},{a:2,C:-1},{a:Math.E,C:1},{a:1,C:1},{a:0,C:1},{a:-2,C:1}],
  logaritmica: [{a:2},{a:.5},{a:1},{a:0},{a:-2}],
  trigonometrica: [{A:3,B:2,C:0,D:0},{A:-3,B:2,C:0,D:0},{A:1,B:-2,C:0,D:0},{A:2,B:3,C:Math.PI/2,D:-1}]
}).flatMap(([tipo, parametros]) => parametros.map(p => [tipo,p])));
incluir('A4 expressões', 'analisarFuncaoCustomizada', ['|2x+3|','2^x+3','2^(x-3)','log(x-3)','−log(x)','log2(x²)','x²','e^x'].map(e=>[e]));
for (let i = 1; i <= 10; i++) {
  const a = i + 1;
  const b = i + 2;
  const m = i % 3 - 1;
  const n = i % 4 + 1;
  incluir('P11', 'avaliarCientifica', [
    [`(${a}·${b})^${n}`], [`(${a}/${b})^${n}`], [`(${a}^(${m}))^${n}`],
    [`${a}^(${m})·${a}^${n}`], [`${a}^(${m})/${a}^${n}`]
  ]);
}
incluir('Álgebra', 'calcularQuadratica', [[1,-4,-5],[2,-8,6],[1,0,1],[1,-2,1],[0,2,-3]]);
incluir('Geometria', 'calcularGeometria', [['circulo',{r:5}],['quadrado',{l:4}],['esfera',{r:3}]]);
incluir('A5 limites', 'calcularLimiteGeral', [['(x²−4)/(x−2)','2'],['1/x','0'],['|x|/x','0'],['sen(1/x)','0'],['sen(x)/x','0'],['(1−cos(x))/x²','0'],['(3x²+2x)/(x²+1)','∞'],['x²+1','2'],['(sqrt(1+x)-1)/x','0'],['(x+1)*(x-1)','2'],['(x+1)^2','2']]);
incluir('A5 derivadas', 'analisarDerivadaExpressao', ['7','x^5','3x²+2x−5','x²*sen(x)','(x²+1)/(x−1)','(3x+1)^4','2^x','log2(x)','|x|','x^(−2)','x^(2/3)'].map(e=>[e]));
incluir('A5 integrais', 'calcularIntegral', ['5','x^3','3x²+2x−1','e^x','cos(x)','2x*cos(x²)','x^(−2)','x^(−1)','x^(1/2)'].map(e=>[e,.2,1.1]).concat([['x²',0,3],['sen(x)',0,Math.PI],['sen(x)',0,2*Math.PI],['1/x',-1,1],['1/sqrt(x)',0,1],['1/x²',1,Infinity]]));
incluir('Trigonometria', 'avaliarCientifica', [['sen(30)','grau'],['cos(60)','grau'],['tg(90)','grau'],['sen(π/6)'],['cos(π/3)'],['tg(π/2)']]);

const pontos = [-3, -.5, 0, .3, 1, 2, 3];
function serializar(valor) {
  if (typeof valor === 'number' && !Number.isFinite(valor)) return { numero: String(valor) };
  if (typeof valor === 'function') return { amostras: pontos.map(x => {
    try { return [x, serializar(valor(x))]; }
    catch (erro) { return [x, { erro: erro.name, mensagem: erro.message }]; }
  }) };
  if (Array.isArray(valor)) return Array.from(valor, serializar);
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.keys(valor).sort().map(chave => [chave, serializar(valor[chave])]));
  return valor;
}

const saidas = casos.map(caso => {
  let saida;
  try { saida = serializar(motor[caso.metodo](...caso.args)); }
  catch (erro) { saida = { erro: erro.name, mensagem: erro.message }; }
  return { ...caso, args: serializar(caso.args), saida };
});
const atual = JSON.stringify({ pontos, casos: saidas }, null, 2) + '\n';
if (process.argv[2] === '--capturar') {
  process.stdout.write(atual);
} else {
  const esperado = fs.readFileSync(path.join(__dirname, 'saidas.json'), 'utf8');
  assert.equal(atual, esperado, 'Saídas do motor mudaram em relação à referência.');
  console.log(`[OK] Golden master: ${casos.length} entradas reproduzidas.`);
}
