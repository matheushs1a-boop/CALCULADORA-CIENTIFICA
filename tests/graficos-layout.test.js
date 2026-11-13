// Regressão da cascata CSS que esticava a legenda por cima do canvas.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'css', 'estilos.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const legenda = {};
const coords = {};

// As regras da classe são acumuladas na ordem do arquivo, como na cascata.
for (const regra of css.matchAll(/(?:^|\})\s*\.graph-legend-floating\s*\{([^}]+)\}/g)) {
    for (const declaracao of regra[1].split(';')) {
        const separador = declaracao.indexOf(':');
        if (separador >= 0) {
            const prop = declaracao.slice(0, separador).trim();
            const val = declaracao.slice(separador + 1).trim();
            assert.notStrictEqual(prop === 'top' && val !== 'auto', true, 'Nenhuma regra de .graph-legend-floating pode definir top != auto');
            assert.notStrictEqual(prop === 'right' && val !== 'auto', true, 'Nenhuma regra de .graph-legend-floating pode definir right != auto');
            legenda[prop] = val;
        }
    }
}

for (const regra of css.matchAll(/(?:^|\})\s*\.graph-coords-pill\s*\{([^}]+)\}/g)) {
    for (const declaracao of regra[1].split(';')) {
        const separador = declaracao.indexOf(':');
        if (separador >= 0) coords[declaracao.slice(0, separador).trim()] = declaracao.slice(separador + 1).trim();
    }
}

assert.strictEqual(legenda.top, 'auto', 'A legenda ancorada embaixo deve cancelar top');
assert.strictEqual(legenda.right, 'auto', 'A legenda ancorada à esquerda deve cancelar right');
assert.strictEqual(legenda.bottom, '12px');
assert.strictEqual(legenda.left, '12px');
assert.strictEqual(legenda.width, 'fit-content');
assert.strictEqual(legenda.height, 'fit-content');

assert.strictEqual(coords.bottom, '12px');
assert.strictEqual(coords.right, '12px');
assert.strictEqual(coords.left, 'auto');

console.log('[OK] A legenda e a pílula de coordenadas usam apenas duas âncoras independentes e não cobrem o gráfico.');
