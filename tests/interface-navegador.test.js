// Teste opcional em navegador real. Requer Playwright e Chromium/Brave instalados.
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
catch (erro) { console.error('NÃO TESTADO: Playwright indisponível. Consulte README.md.'); process.exit(2); }
(async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: true, executablePath: process.env.MATHLAB_BROWSER || undefined, args: ['--no-sandbox'] });
    } catch (erro) {
        console.error(`NÃO TESTADO: navegador não iniciou. ${erro.message.split('\n')[0]}`);
        process.exitCode = 2; return;
    }
    try {
        const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
        const erros = [];
        page.on('pageerror', erro => erros.push(erro.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href);
        await page.locator('[data-module=cientifica].active').waitFor();
        assert.strictEqual(await page.locator('#sci-expr-input').inputValue(), '');
        assert.strictEqual((await page.locator('#sci-res-primary').innerText()).trim(), '0');
        await page.locator('[data-module=funcoes]').click();
        await page.locator('.result-hero-card').waitFor();
        await page.locator('[data-switch-imode="normal"]').click();
        await page.locator('#normal-mode-input').fill('2x + 1');
        assert.strictEqual(await page.evaluate(() => MathLabApp.obterDadosAtuaisFuncoes().grafico.curvas[0].fn(2)), 5);
        await page.locator('[data-switch-imode="pronta"]').click();
        assert.strictEqual(await page.locator('.formula-slot[data-slot-key="a"]').inputValue(), '2');
        await page.locator('.formula-slot[data-slot-key="a"]').fill('7');
        await page.locator('[data-switch-imode="normal"]').click();
        assert.ok((await page.locator('#normal-mode-input').inputValue()).includes('7x'));
        await page.locator('#normal-mode-input').fill('');
        assert.strictEqual(await page.evaluate(() => MathLabApp.obterDadosAtuaisFuncoes().grafico.curvas.length), 0);
        await page.locator('[data-switch-imode="pronta"]').click();
        assert.strictEqual(await page.locator('#ready-custom-expression').inputValue(), '');
        await page.locator('#btn-open-share').click();
        await page.keyboard.press('ArrowDown');
        assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'btn-share-latex');
        await page.keyboard.press('Escape');
        assert.strictEqual(await page.locator('#btn-open-share').getAttribute('aria-expanded'), 'false');
        assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'btn-open-share');
        await page.locator('#btn-open-settings').click();
        await page.locator('#cfg-decimals').selectOption('6');
        assert.strictEqual(await page.evaluate(() => MathLabCalc.casasDecimais), 6);
        await page.locator('.header-brand').click();
        assert.strictEqual(await page.locator('#btn-open-settings').getAttribute('aria-expanded'), 'false');
        await page.keyboard.press('Control+k');
        assert.strictEqual(await page.locator('#modal-cmd-backdrop').evaluate(el => el.classList.contains('hidden')), false);
        await page.keyboard.press('Escape');
        for(const tamanho of [{width:1366,height:768},{width:1600,height:900},{width:1920,height:1080}]) {
            await page.setViewportSize(tamanho);
            for(const mod of ['cientifica','algebra','funcoes','limites','derivadas','integrais','geometria','trigonometria','vetores','estatistica','modelagem']) {
                await page.evaluate(modulo => MathLabApp.selecionarModulo(modulo), mod);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Rolagem horizontal: ${mod}`);
                const rodape = await page.locator('#btn-generate-footer').boundingBox();
                assert.ok(rodape && rodape.y >= 0 && rodape.y+rodape.height <= tamanho.height, `Rodapé fora da tela: ${mod}`);
            }
            await page.evaluate(() => { MathLabApp.selecionarModulo('funcoes'); MathLabApp.aplicarExpressaoModoNormal('x^2-4x-5'); });
            await page.screenshot({ path: path.resolve(__dirname, '..', 'docs', 'evidencias', `depois-${tamanho.width}.png`) });
        }
        assert.deepStrictEqual(erros, []);
        console.log('[OK] Navegador: estado, menus, teclado, 11 módulos e 3 resoluções desktop.');
    } finally { await browser.close(); }
})().catch(erro => { console.error(erro); process.exitCode=1; });
