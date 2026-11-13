// Aceitação visual: PLAYWRIGHT_MODULE e MATHLAB_BROWSER permitem usar instalações existentes.
const assert=require('assert'),path=require('path'),fs=require('fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const pasta=path.resolve(__dirname,'../docs/evidencias');fs.mkdirSync(pasta,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.MATHLAB_BROWSER||undefined,args:['--no-sandbox']});
 try {
 const p=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:2});const erros=[];p.on('pageerror',e=>erros.push(e.message));
 await p.goto(process.env.MATHLAB_URL||'http://127.0.0.1:5500/index.html');
 await p.evaluate(()=>{MathLabApp.state.inputMode='pronta';MathLabApp.selecionarModulo('integrais')});
 const foto=nome=>p.screenshot({path:path.join(pasta,nome+'.png')});
 if(process.env.MATHLAB_CAPTURA_ANTES==='1'){await p.waitForTimeout(150);await foto('antes');console.log('Captura inicial salva.');return;}
 const dado=()=>p.evaluate(()=>{const d=MathLabApp.state.integrais.dados;return {valido:d.valido,valor:d.integral.resultado,geometrica:d.areaGeometrica,positivo:d.positiva,negativo:d.negativa}});
 async function grafico(){
  await p.waitForTimeout(100);
  const g=await p.evaluate(()=>{
   const c=document.querySelector('canvas'),r=c.getBoundingClientRect(),g=MathLabGraph;
   const pixels=g.ctx.getImageData(0,0,c.width,c.height).data;let verdes=0;
   for(let i=0;i<pixels.length;i+=4)if(pixels[i+1]>pixels[i]*1.6&&pixels[i+1]>pixels[i+2]*1.3)verdes++;
   return {w:r.width,h:r.height,cw:c.width,ch:c.height,dpr:devicePixelRatio,verdes,area:!!g.config.areaSombreada,limites:g.config.assintotas?.length};
  });
  // Pixels no canvas não revelam um painel HTML opaco cobrindo o desenho.
  const sobreposicao=await p.evaluate(()=>{
   const canvas=document.querySelector('canvas'),r=canvas.getBoundingClientRect();
   const legenda=document.querySelector('.graph-legend-floating').getBoundingClientRect();
   return {livre:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===canvas,altura:legenda.height,alturaGrafico:r.height};
  });
  assert.ok(sobreposicao.livre,'Há um elemento HTML cobrindo o centro do gráfico');
  assert.ok(sobreposicao.altura < sobreposicao.alturaGrafico/2,'A legenda cobre uma parcela excessiva do gráfico');
  assert.ok(g.w>100&&g.h>100);assert.ok(Math.abs(g.cw-g.w*g.dpr)<3);assert.ok(Math.abs(g.ch-g.h*g.dpr)<3);assert.ok(g.verdes>200,'Curva/área verde ausente');return g;
 }
 // 1 e 2: conteúdo e pixels, além de captura para revisão dos eixos e rótulos.
 let g=await grafico();assert.ok(g.area);assert.strictEqual(g.limites,2);
 assert.ok((await p.locator('.result-hero-value').innerText()).includes('∫₀³ x² dx = 9'));
 assert.ok((await p.locator('.result-hero-value').innerText()).includes('≈ 9,000000'));await foto('depois-D1-D4');
 // 3: mudança pelo campo real sem perder o foco.
 await p.locator('[data-slot-key="b"]').fill('5');assert.strictEqual(await p.evaluate(()=>document.activeElement.dataset.slotKey),'b');assert.ok(Math.abs((await dado()).valor-125/3)<1e-6);
 await p.locator('[data-tab-id="metodos"]').click();assert.ok((await p.locator('.integral-methods').innerText()).includes('41,666667'));await foto('depois-D5-metodos');
 // 4, 5 e 6: casos analíticos pelo mesmo controlador da entrada Normal.
 for(const [expr,a,b,valor,area] of [['sen(x)',0,Math.PI,2,2],['sen(x)',0,2*Math.PI,0,4],['x^3',-1,1,0,.5]]){
  await p.evaluate(({expr,a,b})=>{Object.assign(MathLabApp.state.integrais,{funcaoExpr:expr,a,b,abaAtiva:'area'});MathLabApp.state.slotTextos={};MathLabApp.renderModuloIntegrais()},{expr,a,b});
  const d=await dado();assert.ok(Math.abs(d.valor-valor)<1e-6);assert.ok(Math.abs(d.geometrica-area)<1e-6);await grafico();await foto('depois-area-'+(expr==='x^3'?'impar':b>4?'seno-2pi':'seno-pi'));
 }
 await p.evaluate(()=>{Object.assign(MathLabApp.state.integrais,{funcaoExpr:'x^2',tipo:'indefinida'});MathLabApp.renderModuloIntegrais()});assert.ok(!(await grafico()).area);assert.ok((await p.locator('.result-hero-value').innerText()).includes('x³/3 + C'));await foto('depois-indefinida');
 // 7, 8 e 9: troca de abas, resoluções e temas, limites acima do rodapé.
 await p.evaluate(()=>MathLabApp.restaurarExemploModulo());
 await p.locator('[data-pick-template="definida"]').click();
 for(const viewport of [{width:1366,height:768},{width:1920,height:1080}])for(const tema of ['dark','light']){
  await p.setViewportSize(viewport);await p.evaluate(t=>{document.documentElement.setAttribute('data-theme',t);MathLabGraph.desenhar()},tema);
  for(const aba of ['resolucao','verificacao','area','metodos','area'])await p.locator(`[data-tab-id="${aba}"]`).click();
  await grafico();
  for(const chave of ['a','b']){const campo=p.locator(`[data-slot-key="${chave}"]`);await campo.scrollIntoViewIfNeeded();const r=await campo.boundingBox(),f=await p.locator('.input-panel-footer').boundingBox();assert.ok(r.y>=0&&r.y+r.height<=f.y);}
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await foto(`depois-${viewport.width}-${tema}`);
 }
 // 10: preservação das entradas inválidas e orientação para limites invertidos.
 await p.locator('[data-slot-key="a"]').fill('7');assert.ok((await p.locator('#left-panel-body').innerText()).includes('troca de sinal'));
 await p.locator('[data-slot-key="b"]').fill('');assert.ok(!(await dado()).valido);assert.strictEqual(await p.locator('[data-slot-key="b"]').inputValue(),'');await foto('depois-invalido');
 await p.evaluate(()=>MathLabApp.aplicarExpressaoModoNormal('',true));assert.ok(!(await dado()).valido);
 // D6: todos os módulos e seus exemplos, gráficos e concordância dos cartões.
 for(const modulo of ['cientifica','algebra','funcoes','limites','derivadas','integrais','geometria','trigonometria','vetores','estatistica','modelagem']){
  await p.evaluate(m=>{MathLabApp.selecionarModulo(m);if(m==='integrais')MathLabApp.restaurarExemploModulo()},modulo);await p.waitForTimeout(80);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),modulo);
  const resultado=await p.locator('.result-hero-value').innerText();assert.ok(resultado.trim(),modulo);
  if(!['cientifica','funcoes','integrais','estatistica'].includes(modulo)) {const esquerda=await p.locator('#left-panel-body .result-primary').first().innerText();assert.ok(resultado.includes(esquerda.trim()),`Painéis divergem: ${modulo}`);}
  if(await p.locator('#canvas-stage-wrapper').isVisible()) {const r=await p.locator('canvas').boundingBox();assert.ok(r.width>100&&r.height>100,modulo);}
  await foto('depois-D6-'+modulo);
 }
 assert.deepStrictEqual(erros,[]);console.log('[OK] 10 cenários de aceitação e D6; capturas em '+pasta);
 } finally {await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
