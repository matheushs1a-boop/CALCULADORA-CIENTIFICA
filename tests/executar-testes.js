/* ============================================================================
   MATHLAB — ORQUESTRADOR CENTRAL DA SUÍTE DE TESTES AUTOMATIZADOS
   Arquivo: tests/executar-testes.js
   Execução: npm test  (ou: node tests/executar-testes.js)
   ============================================================================ */

const { spawnSync } = require('child_process');
const path = require('path');

const suites = [
    'modulos-gerais.test.js',
    'sincronizacao-estado.test.js',
    'funcoes-auditoria.test.js',
    'regressoes-matematicas.test.js',
    'calculo-regras.test.js',
    'graficos-renderizacao.test.js',
    'integrais-modulo.test.js',
    'graficos-layout.test.js'
];

for (const suite of suites) {
    console.log(`\nExecutando ${suite}`);
    const resultado = spawnSync(process.execPath, [path.join(__dirname, suite)], { stdio: 'inherit' });
    if (resultado.status !== 0) process.exit(resultado.status || 1);
}

console.log(`\nSUCESSO: ${suites.length} suítes aprovadas. Interface visual: executar interface-navegador.test.js separadamente.`);
