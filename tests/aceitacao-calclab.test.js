const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const raiz = path.resolve(__dirname, '..');
const url = process.env.MATHLAB_URL || pathToFileURL(path.join(raiz, 'index.html')).href;
const pasta = process.env.CALCLAB_CAPTURAS;
const modos = ['cientifica', 'algebra', 'funcoes', 'limites', 'derivadas', 'integrais',
    'geometria', 'trigonometria', 'vetores', 'estatistica', 'modelagem'];

async function testar() {
    const navegador = await chromium.launch({ executablePath: process.env.MATHLAB_BROWSER || undefined, args: ['--no-sandbox'] });
    try {
        const contexto = await navegador.newContext({ viewport: { width: 1920, height: 1080 } });
        const externos = [];
        await contexto.route(/^https?:/, rota => {
            if (new URL(rota.request().url()).origin === new URL(url).origin) return rota.continue();
            externos.push(rota.request().url());
            return rota.abort();
        });
        const pagina = await contexto.newPage();
        const erros = [];
        pagina.on('pageerror', erro => erros.push(erro.message));
        pagina.on('response', resposta => { if (resposta.status() >= 400) erros.push(resposta.url()); });
        const clipboardReal = /^https?:/.test(url);
        if (clipboardReal) {
            await contexto.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(url).origin });
        } else {
            await pagina.addInitScript(() => {
                Object.defineProperty(navigator, 'clipboard', {
                    value: { writeText: async texto => { window.textoCopiado = texto; } }
                });
            });
        }

        const selecionar = modo => pagina.locator(`.module-tab[data-module="${modo}"]`).click();
        const modoAtual = () => pagina.locator('.module-tab.active').getAttribute('data-module');
        const expressao = pagina.locator('#sci-expr-input');
        const visor = () => pagina.locator('#sci-res-primary').innerText().then(texto => texto.trim());
        const foto = async nome => {
            if (pasta) await pagina.screenshot({ path: path.join(pasta, nome + '.png') });
        };

        await pagina.goto(url);
        assert.equal(await modoAtual(), 'cientifica');
        assert.equal(await visor(), '0');
        assert.equal(await expressao.inputValue(), '');
        assert.equal(await pagina.evaluate(() => document.activeElement.id), 'sci-expr-input');
        assert.equal(await pagina.locator('.modal-backdrop:not(.hidden)').count(), 0);
        assert.equal(await pagina.locator('#fav-count-badge').isVisible(), false);
        assert.equal(await pagina.locator('#sci-mem').isVisible(), false);
        assert.ok((await pagina.locator('#right-panel-body').textContent()).includes('Seus cálculos aparecerão aqui'));
        for (const tema of ['escuro', 'claro']) {
            if (tema === 'claro') {
                await pagina.locator('#btn-open-settings').click();
                await pagina.locator('#btn-toggle-theme').click();
                await pagina.keyboard.press('Escape');
                await pagina.reload();
            }
            const logo = pagina.locator('#logo-inicio img:visible');
            assert.equal(await logo.count(), 1);
            assert.ok((await logo.getAttribute('src')).includes(tema));
            assert.equal(await logo.evaluate(img => img.naturalWidth > 0 && img.height === 28), true);
            await foto('abertura-' + tema);
            if (pasta) await pagina.locator('.app-header').screenshot({ path: path.join(pasta, 'cabecalho-' + tema + '.png') });
        }
        assert.equal(await pagina.locator('link[rel=icon][type="image/svg+xml"]').count(), 1);
        assert.ok((await pagina.title()).startsWith('CalcLab'));
        const marcasVisiveis = [];
        await selecionar('cientifica');
        for (const modo of modos) {
            await selecionar(modo);
            marcasVisiveis.push((await pagina.locator('body').innerText()).match(/\bMathLab\b/gi));
            const preenchidos = await pagina.locator('#left-panel-body input:not([type=range]):not([type=checkbox]), #left-panel-body textarea')
                .evaluateAll(campos => campos.filter(campo => campo.value).map(campo => campo.id || campo.value));
            assert.deepEqual(preenchidos, [], modo);
            assert.equal(await pagina.locator('#btn-generate-footer').getAttribute('aria-disabled'), 'true', modo);
            if (modo !== 'cientifica') {
                assert.equal(await pagina.evaluate(() => MathLabGraph.config.curvas.length), 0, modo);
                assert.ok((await pagina.locator('#right-panel-body').innerText()).includes('Aguardando entrada.'), modo);
            }
            await pagina.locator('#logo-inicio').click();
            assert.equal(await modoAtual(), 'cientifica', modo);
        }
        assert.ok(marcasVisiveis.every(marca => !marca));

        await expressao.fill('2+3×4');
        await expressao.press('Enter');
        assert.equal(await visor(), '14');
        await pagina.locator('#btn-copy-sci').click();
        await pagina.getByText('Copiado', { exact: true }).waitFor();
        assert.equal(await pagina.evaluate(real => real ? navigator.clipboard.readText() : window.textoCopiado, clipboardReal), '14');
        await pagina.locator('#left-panel-body [data-key-act=inverse]').click();
        assert.equal(await visor(), '1/14');
        await expressao.fill('200+10');
        await pagina.locator('#left-panel-body [data-key-act=percent]').click();
        assert.equal(await visor(), '220');
        await pagina.locator('#left-panel-body [data-key-mem="m+"]').click();
        const limpar = pagina.locator('#left-panel-body [data-key-act=clear]');
        await limpar.click();
        assert.equal(await limpar.innerText(), 'AC');
        assert.equal(await pagina.locator('#sci-mem').isVisible(), true);
        await limpar.click();
        assert.equal(await limpar.innerText(), 'C');
        assert.equal(await pagina.locator('#sci-mem').isVisible(), false);
        assert.equal(await visor(), '0');
        await pagina.locator('#left-panel-body [data-key-act=ans]').click();
        assert.equal(await expressao.inputValue(), '');

        await pagina.locator('#btn-open-settings').click();
        await pagina.locator('#btn-toggle-theme').click();
        await pagina.keyboard.press('Escape');
        for (const [modo, resultado] of [['funcoes', /V\(2, -9\).*Raízes: -1 e 5/],
            ['limites', /^4$/], ['derivadas', /3,0647/], ['integrais', /∫₀³ x² dx = 9/]]) {
            await selecionar(modo);
            await pagina.locator('[data-exemplo-modulo="1"]').click();
            assert.match(await pagina.locator('.result-hero-value').innerText(), resultado);
            assert.ok(await pagina.evaluate(() => MathLabGraph.config.curvas.length > 0), modo);
            if (pasta) await pagina.locator('.toast-msg').last().waitFor({ state: 'hidden' });
            await foto('exemplo-' + modo);
        }
        await selecionar('funcoes');
        const marca = pagina.locator('#logo-inicio');
        await pagina.keyboard.press('Tab');
        await marca.focus();
        assert.equal(await marca.evaluate(link => getComputedStyle(link).outlineWidth), '2px');
        assert.ok((await marca.getAttribute('aria-label')).includes('CalcLab'));
        await marca.press('Enter');
        assert.equal(await modoAtual(), 'cientifica');

        await selecionar('limites');
        await pagina.locator('#area-center').evaluate(painel => painel.requestFullscreen());
        assert.ok(await pagina.evaluate(() => document.fullscreenElement));
        await pagina.keyboard.press('Alt+h');
        await pagina.waitForFunction(() => !document.fullscreenElement);
        assert.equal(await modoAtual(), 'cientifica');
        await selecionar('limites');
        for (const numero of [2, 3]) {
            await pagina.locator(`[data-exemplo-modulo="${numero}"]`).click();
            assert.match(await pagina.locator('.result-hero-value').innerText(), /NÃO EXISTE/i);
        }

        await pagina.locator('#btn-open-settings').click();
        await pagina.keyboard.press('Alt+h');
        assert.equal(await pagina.locator('#settings-menu').isVisible(), false);
        assert.equal(await modoAtual(), 'cientifica');
        await pagina.goBack();
        assert.equal(await modoAtual(), 'limites');
        assert.match(await pagina.locator('.result-hero-value').innerText(), /NÃO EXISTE/i);
        await pagina.goForward();
        assert.equal(await modoAtual(), 'cientifica');
        await pagina.locator('#btn-open-settings').click();
        await pagina.locator('#cfg-angle').selectOption('grau');
        await pagina.locator('#cfg-decimals').selectOption('6');
        await pagina.keyboard.press('Escape');
        await expressao.fill('7×6');
        await expressao.press('Enter');
        await pagina.locator('details').filter({ has: pagina.locator('[data-fav-id]') }).locator('summary').click();
        await pagina.locator('[data-fav-id]').first().click();
        assert.equal(await pagina.locator('#fav-count-badge').innerText(), '1');
        await selecionar('funcoes');
        await pagina.keyboard.press('Control+Shift+Backspace');
        assert.equal(await modoAtual(), 'cientifica');
        assert.equal(await visor(), '0');
        assert.equal(await pagina.locator('#fav-count-badge').innerText(), '1');
        await pagina.getByRole('button', { name: 'Desfazer', exact: true }).last().click();
        assert.equal(await modoAtual(), 'funcoes');
        assert.match(await pagina.locator('.result-hero-value').innerText(), /V\(2, -9\)/);
        await pagina.reload();
        assert.equal(await modoAtual(), 'cientifica');
        assert.equal(new URL(pagina.url()).hash, '');
        assert.equal(await visor(), '0');
        assert.equal(await pagina.locator('#fav-count-badge').innerText(), '1');
        assert.equal(await pagina.locator('#right-panel-body [data-hist-id]').count(), 0);
        assert.equal(await pagina.locator('#left-panel-body [data-sci-ang=grau]').evaluate(el => el.classList.contains('active')), true);
        assert.equal(await pagina.evaluate(() => MathLabCalc.casasDecimais), 6);

        await pagina.locator('#btn-open-settings').click();
        await pagina.locator('#btn-clear-session').click();
        await pagina.getByText('Tudo limpo.', { exact: false }).waitFor();
        assert.equal(await visor(), '0');

        const outra = await contexto.newPage();
        await outra.goto(new URL('#limites', url).href);
        assert.equal(await outra.locator('.module-tab.active').getAttribute('data-module'), 'limites');
        assert.equal(await outra.title(), 'CalcLab — Limites');

        const celular = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        const tela = await celular.newPage();
        await tela.goto(url);
        assert.equal(await tela.locator('#logo-inicio .logo-simbolo:visible').count(), 1);
        assert.equal(await tela.locator('#logo-inicio .logo-horizontal:visible').count(), 0);
        assert.notEqual(await tela.evaluate(() => document.activeElement.id), 'sci-expr-input');
        assert.deepEqual(externos, []);
        assert.deepEqual(erros, []);
        console.log('[OK] Abertura vazia, 11 modos, exemplos, histórico, favoritos, atalhos, cópia, temas e recursos locais.');
    } finally {
        await navegador.close();
    }
}

testar().catch(erro => { console.error(erro); process.exitCode = 1; });
