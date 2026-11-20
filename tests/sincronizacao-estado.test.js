// Testa o controlador real sem dependências de navegador.
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const contexto = vm.createContext({
    console, Math, setTimeout, clearTimeout,
    document: { addEventListener() {} },
    localStorage: { setItem() {} }
});
for (const arquivo of ['src/js/motor-matematico.js', 'src/js/app.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', arquivo), 'utf8'), contexto);
}
const app = vm.runInContext('MathLabApp', contexto);
app.state.activeModule = 'funcoes';
// Somente a pintura é substituída; conversão, estado e análise são os da aplicação.
app.renderizarModuloAtivo = () => {};
app.renderModuloFuncoes = () => {};
app.atualizarCentroEDireitaFuncoes = dados => { app.ultimoRender = dados; };
let total = 0;
function testar(nome, teste) { teste(); console.log(`[OK] ${++total}. ${nome}`); }
function valores() {
    const d = app.obterDadosAtuaisFuncoes();
    return [-2, 0, 1, 3].map(x => d.grafico.curvas[0].fn(x));
}
testar('Normal afim mantém gráfico, propriedades e parâmetros na Fórmula pronta', () => {
    app.state.inputMode = 'normal';
    app.aplicarExpressaoModoNormal('2x + 1');
    const antes = valores();
    app.alternarModoEntrada('pronta');
    assert.deepStrictEqual(valores(), antes);
    assert.deepStrictEqual(antes, [-3, 1, 3, 7]);
    assert.strictEqual(app.state.funcoes.tipoAtivo, 'afim');
    assert.strictEqual(app.state.funcoes.paramsExtras.afim.b, 1);
    const d = app.obterDadosAtuaisFuncoes();
    assert.ok(d.propriedades.some(p => String(p.valor).includes('−0,5') || String(p.valor).includes('-0,5')));
    assert.ok(app.obterConfigFormulaPronta().formulaMontada.includes('value="2"'));
});
testar('Editar um quadradinho atualiza o texto Normal e o gráfico', () => {
    app.aplicarValorSlot('a', 7);
    assert.ok(app.obterExpressaoTextoAtual().includes('7x'));
    app.alternarModoEntrada('normal');
    assert.strictEqual(app.obterDadosAtuaisFuncoes().grafico.curvas[0].fn(2), 15);
    assert.ok(app.obterExpressaoTextoAtual().includes('7x'));
});
testar('Função vazia limpa todas as visualizações e sobrevive à troca de modo', () => {
    app.aplicarExpressaoModoNormal('');
    app.alternarModoEntrada('pronta');
    const d = app.obterDadosAtuaisFuncoes();
    assert.strictEqual(d.vazio, true);
    assert.strictEqual(d.grafico.curvas.length, 0);
    assert.strictEqual(d.propriedades.length, 0);
    assert.strictEqual(d.verificacao.aprovado, false);
    assert.strictEqual(app.obterExpressaoTextoAtual(), '');
    assert.ok(app.obterConfigFormulaPronta().formulaMontada.includes('ready-custom-expression'));
});
testar('Expressão livre não herda quadradinhos antigos nem muda ao alternar', () => {
    app.aplicarExpressaoModoNormal('sen(x)');
    const antes = valores();
    app.alternarModoEntrada('pronta');
    app.alternarModoEntrada('normal');
    assert.deepStrictEqual(valores(), antes);
    assert.strictEqual(app.obterExpressaoTextoAtual(), 'sen(x)');
    assert.ok(!app.obterConfigFormulaPronta().formulaMontada.includes('data-slot-key="a"'));
});
testar('Quadrática mantém coeficientes, raízes e curva nos dois modos', () => {
    app.aplicarExpressaoModoNormal('3x^2 - 6x + 2');
    const antes = valores();
    app.alternarModoEntrada('pronta');
    assert.deepStrictEqual(valores(), antes);
    app.aplicarValorSlot('c', 9);
    app.alternarModoEntrada('normal');
    assert.strictEqual(app.obterDadosAtuaisFuncoes().grafico.curvas[0].fn(0), 9);
});
testar('Constante digitada mantém o valor nos dois modos', () => {
    app.aplicarExpressaoModoNormal('2');
    app.alternarModoEntrada('pronta');
    assert.strictEqual(app.state.funcoes.tipoAtivo, 'constante');
    assert.deepStrictEqual(valores(), [2, 2, 2, 2]);
});
testar('Entrada incompleta suspende o gráfico anterior', () => {
    app.aplicarExpressaoModoNormal('sen(');
    const d = app.obterDadosAtuaisFuncoes();
    assert.strictEqual(d.invalido, true);
    assert.strictEqual(d.grafico.curvas.length, 0);
});
testar('Termos ausentes mantêm classificação e quadradinhos corretos', () => {
    for(const [texto, tipo, esperado] of [['x^2', 'quadratica', 4], ['x^2-1', 'quadratica', 3], ['2x', 'linear', 4], ['0', 'constante', 0]]) {
        app.aplicarExpressaoModoNormal(texto);
        app.alternarModoEntrada('pronta');
        assert.strictEqual(app.state.funcoes.tipoAtivo, tipo);
        assert.strictEqual(app.obterDadosAtuaisFuncoes().grafico.curvas[0].fn(2), esperado);
    }
});
testar('Casas decimais não arredondam os coeficientes ao gerar no modo Normal', () => {
    app.state.activeModule = 'funcoes';
    app.state.funcoes.tipoAtivo = 'quadratica';
    app.state.funcoes.quad = { a: 1/3, b: -2/7, c: 1/9 };
    const antes = valores();
    app.alternarModoEntrada('normal');
    const texto = app.obterExpressaoTextoAtual();
    assert.ok(texto.includes(String(1/3)));
    app.aplicarExpressaoModoNormal(texto);
    assert.deepStrictEqual(valores(), antes);
});
testar('Todos os modelos preservam a curva no ciclo pronta → Normal → gerar', () => {
    for (const tipo of ['constante','afim','linear','quadratica','canonica','fatorada','modular','exponencial','logaritmica','trigonometrica','juros']) {
        app.state.funcoes.tipoAtivo = tipo;
        if(tipo === 'exponencial') app.state.funcoes.paramsExtras.exponencial.C = 3;
        const antes = app.obterDadosAtuaisFuncoes().grafico.curvas[0].fn;
        const esperados = [.5,1,2].map(antes);
        const texto = app.obterExpressaoTextoAtual();
        app.alternarModoEntrada('normal');
        app.aplicarExpressaoModoNormal(texto);
        const depois = app.obterDadosAtuaisFuncoes().grafico.curvas[0].fn;
        [.5,1,2].forEach((x,i) => assert.ok(Math.abs(depois(x)-esperados[i])<1e-8, `${tipo}: ${texto}`));
    }
});
testar('Derivada e integral livres não mostram quadradinhos de outro modelo', () => {
    app.state.activeModule = 'derivadas';
    app.aplicarExpressaoModoNormal('cos(x)');
    app.alternarModoEntrada('pronta');
    assert.ok(app.obterConfigFormulaPronta().formulaMontada.includes('cos(x)'));
    app.state.activeModule = 'integrais';
    app.aplicarExpressaoModoNormal('sen(x)');
    app.alternarModoEntrada('pronta');
    assert.ok(app.obterConfigFormulaPronta().formulaMontada.includes('sen(x)'));
    app.state.activeModule = 'funcoes';
});
testar('PNG na aba tabela usa a função atual e restaura a aba visível', () => {
    app.state.activeModule = 'funcoes';
    app.definirExpressaoFuncao('7x+1');
    app.state.funcoes.abaAtiva = 'tabela';
    const elementos = {
        'canvas-stage-wrapper': { style: { display: 'none' } },
        'custom-stage-wrapper': { style: { display: 'flex' } },
        'main-graph-canvas': {}
    };
    contexto.document.getElementById = id => elementos[id];
    let desenhado, exportado = false;
    contexto.MathLabGraph = { conectarCanvas: (canvas, dados) => { desenhado = dados; }, exportarPNG: () => { exportado = true; } };
    app.exportarGraficoAtual();
    assert.strictEqual(desenhado.curvas[0].fn(2), 15);
    assert.strictEqual(exportado, true);
    assert.strictEqual(elementos['canvas-stage-wrapper'].style.display, 'none');
    assert.strictEqual(elementos['custom-stage-wrapper'].style.display, 'flex');
});
testar('Dois desfazeres permitem dois refazeres consecutivos', () => {
    app.mostrarToast = () => {};
    app.state.undoStack = []; app.state.redoStack = [];
    app.definirExpressaoFuncao('1'); app.salvarSnapshotUndo();
    app.definirExpressaoFuncao('2'); app.salvarSnapshotUndo();
    app.definirExpressaoFuncao('3');
    app.desfazer(); app.desfazer();
    assert.strictEqual(app.obterDadosAtuaisFuncoes().grafico.curvas[0].fn(0), 1);
    app.refazer(); app.refazer();
    assert.strictEqual(app.obterDadosAtuaisFuncoes().grafico.curvas[0].fn(0), 3);
});
console.log(`${total} testes de estado aprovados.`);
