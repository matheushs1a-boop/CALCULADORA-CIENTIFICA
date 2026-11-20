const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const local = pathToFileURL(path.resolve(__dirname, '..', 'index.html'));
local.searchParams.set('sem-abertura', '');
const url = new URL(process.env.MATHLAB_URL || local);
url.searchParams.set('sem-abertura', '');
const pasta = process.env.CALCLAB_CAPTURAS_CIENTIFICA;

async function testar() {
    const browser = await chromium.launch({ executablePath: process.env.MATHLAB_BROWSER || undefined, args: ['--no-sandbox'] });
    const erros = [];
    try {
        async function paginaNova(opcoes, tema = 'dark') {
            const contexto = await browser.newContext(opcoes);
            const pagina = await contexto.newPage();
            pagina.on('pageerror', erro => erros.push(erro.message));
            pagina.on('response', resposta => { if (resposta.status() >= 400) erros.push(resposta.url()); });
            await contexto.route(/^https?:/, rota => {
                if (new URL(rota.request().url()).origin === url.origin) return rota.continue();
                erros.push(rota.request().url());
                return rota.abort();
            });
            await pagina.addInitScript(valor => localStorage.setItem('mathlab_theme', valor), tema);
            return pagina;
        }
        async function conferirTela(pagina) {
            const painel = pagina.locator('.area-left');
            assert.equal(await painel.locator('[data-switch-imode], .formula-slot, #btn-sci-err-demo, #btn-restore-example, #btn-random-slots').count(), 0);
            assert.equal(await pagina.locator('#btn-Restore-Demo-Sci').count(), 0);
            assert.equal(await painel.locator('.panel-subtitle-badge').count(), 1);
            assert.equal(await painel.locator('details.sci-exemplos[open]').count(), 0);
            assert.equal(await painel.locator('#sci-expr-input').inputValue(), '');
            assert.equal((await painel.locator('#sci-res-primary').innerText()).trim(), '0');
            assert.equal(await painel.locator('#sci-mem').isVisible(), false);
        }
        const pagina = await paginaNova({ viewport: { width: 1366, height: 768 } });
        await pagina.goto(url.href);
        await conferirTela(pagina);
        if (pasta) await pagina.screenshot({ path: path.join(pasta, 'depois-dark.png') });
        const entrada = pagina.locator('#sci-expr-input');
        const visor = () => pagina.locator('#sci-res-primary').innerText().then(valor => valor.trim());
        const teclado = pagina.locator('#left-panel-body .scientific-keypad');
        const tecla = seletor => teclado.locator(seletor).click();
        assert.equal(await pagina.evaluate(() => document.activeElement.id), 'sci-expr-input');
        await pagina.keyboard.type('2+3*45');
        await pagina.keyboard.press('Backspace');
        await pagina.keyboard.press('Enter');
        assert.equal(await visor(), '14');
        await tecla('[data-key-act=clear]');
        for (const rotulo of ['2', '+', '3', '×', '4', '=']) {
            await teclado.getByRole('button', { name: rotulo, exact: true }).click();
        }
        assert.equal(await visor(), '14');
        await tecla('[data-key-act=inverse]');
        assert.equal(await visor(), '1/14');
        await entrada.fill('200+10');
        await tecla('[data-key-act=percent]');
        assert.equal(await visor(), '220');
        await tecla('[data-key-mem="m+"]');
        await entrada.fill('');
        await tecla('[data-key-mem=mr]');
        assert.equal(await visor(), '220');
        await tecla('[data-key-mem=mc]');
        assert.equal(await pagina.locator('#sci-mem').isVisible(), false);
        await entrada.fill('');
        await tecla('[data-key-fn="sen("]');
        assert.equal(await entrada.inputValue(), 'sen()');
        await pagina.keyboard.type('0');
        assert.equal(await visor(), '0');
        await entrada.fill('');
        await tecla('[data-key-fn="√("]');
        assert.match(await entrada.inputValue(), /^sqrt\(/);
        await pagina.keyboard.type('16');
        assert.equal(await visor(), '4');

        const escolher = async nome => {
            await pagina.locator('.sci-exemplos summary').click();
            await pagina.locator('.sci-exemplos').getByRole('button', { name: nome, exact: true }).click();
        };
        const historicoAntes = await pagina.locator('[data-hist-id]').count();
        await escolher('(2/3)^(−2)');
        assert.equal(await entrada.inputValue(), '(2/3)^(−2)');
        assert.equal(await visor(), '0');
        assert.equal(await pagina.locator('[data-hist-id]').count(), historicoAntes);
        await pagina.keyboard.press('Enter');
        assert.equal(await visor(), '9/4');
        await pagina.locator('[data-sci-out=decimal]').click();
        assert.equal(await visor(), '2,25');
        await pagina.locator('[data-sci-out=exato]').click();
        await escolher('sen(π/6)+√16');
        await tecla('[data-key-act=eval]');
        assert.equal(await visor(), '9/2');
        for (const [rotulo, resultado] of [['2+3×4', '14'], ['5!', '120'], ['log₂(8)', '3'], ['1/3', '1/3']]) {
            await escolher(rotulo);
            assert.equal(await visor(), '0');
            await entrada.press('Enter');
            assert.equal(await visor(), resultado);
        }
        await entrada.fill('55');
        await entrada.fill('56');
        await pagina.locator('#btn-undo').click();
        assert.equal(await entrada.inputValue(), '55');
        await pagina.locator('#btn-redo').click();
        assert.equal(await entrada.inputValue(), '56');

        const estados = async () => {
            await pagina.locator('#btn-open-settings').click();
            await pagina.locator('#btn-open-states').click();
        };
        await estados();
        await pagina.getByText('Logaritmo de número negativo: o logaritmando precisa ser maior que zero.', { exact: true }).waitFor();
        await pagina.locator('#btn-trigger-state-err').click();
        assert.equal(await visor(), 'Erro');
        assert.match(await pagina.locator('#right-panel-body .state-banner-desc').innerText(), /logaritmando precisa ser maior que zero/i);
        await pagina.locator('#btn-voltar-demonstracao').click();
        assert.equal(await entrada.inputValue(), '56');
        for (const [id, modo, texto] of [
            ['btn-trigger-state-zero', 'cientifica', /divisão por zero/i],
            ['btn-trigger-state-lim', 'limites', /NÃO EXISTE/i],
            ['btn-demo-removivel', 'limites', /4/],
            ['btn-demo-derivadas', 'derivadas', /3,0647/],
            ['btn-demo-estatistica', 'estatistica', /Média/],
            ['btn-demo-modelagem', 'modelagem', /400/],
            ['btn-demo-cientifica', 'cientifica', /5/]
        ]) {
            await estados();
            await pagina.locator('#' + id).click();
            assert.equal(await pagina.locator('.module-tab.active').getAttribute('data-module'), modo);
            assert.match(await pagina.locator('#right-panel-body').innerText(), texto);
            await pagina.locator('#btn-voltar-demonstracao').click();
            assert.equal(await entrada.inputValue(), '56');
        }

        const selecionarModulo = modo => pagina.locator(`.module-tab[data-module="${modo}"]`).click();
        await selecionarModulo('funcoes');
        await pagina.locator('[data-switch-imode=normal]').click();
        await pagina.locator('#normal-mode-input').fill('x^2+1');
        await pagina.locator('[data-switch-imode=pronta]').click();
        await pagina.locator('[data-switch-imode=normal]').click();
        assert.ok((await pagina.locator('#normal-mode-input').inputValue()).includes('x^2'));
        assert.deepEqual(await pagina.evaluate(() => [-2, 0, 2].map(x => MathLabApp.obterDadosAtuaisFuncoes().grafico.curvas[0].fn(x))), [5, 1, 5]);
        for (const modo of ['limites', 'derivadas', 'integrais', 'trigonometria', 'funcoes']) {
            await selecionarModulo(modo);
            assert.equal(await pagina.locator('[data-switch-imode=normal]').getAttribute('aria-selected'), 'true', modo);
            assert.equal(await pagina.locator('[data-switch-imode]').count(), 2, modo);
        }
        await selecionarModulo('cientifica');
        assert.equal(await entrada.inputValue(), '56');
        assert.equal(await pagina.locator('[data-switch-imode]').count(), 0);
        await pagina.reload();
        await conferirTela(pagina);
        await selecionarModulo('funcoes');
        assert.equal(await pagina.locator('[data-switch-imode=normal]').getAttribute('aria-selected'), 'true');

        const clara = await paginaNova({ viewport: { width: 1366, height: 768 } }, 'light');
        await clara.goto(url.href);
        await conferirTela(clara);
        if (pasta) await clara.screenshot({ path: path.join(pasta, 'depois-light.png') });

        for (const [width, height] of [[375, 667], [390, 844]]) {
            const celular = await paginaNova({ viewport: { width, height }, isMobile: true, hasTouch: true });
            await celular.goto(url.href);
            await conferirTela(celular);
            assert.notEqual(await celular.evaluate(() => document.activeElement.id), 'sci-expr-input');
            assert.equal(await celular.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            await celular.locator('[data-key-ins="7"]').tap();
            assert.equal(await celular.locator('#sci-expr-input').inputValue(), '7');
            if (pasta && width === 390) await celular.screenshot({ path: path.join(pasta, 'depois-celular-390.png') });
            await celular.context().close();
        }

        const offline = await paginaNova({ offline: true });
        await offline.goto(local.href);
        await conferirTela(offline);
        await offline.keyboard.type('2+3*4');
        await offline.keyboard.press('Enter');
        assert.equal((await offline.locator('#sci-res-primary').innerText()).trim(), '14');
        assert.deepEqual(erros, []);
        console.log('[OK] Científica vazia, teclado físico/virtual, 6 exemplos, demonstrações com retorno, modos preservados, 2 telas móveis e app offline.');
    } finally {
        await browser.close();
    }
}
testar().catch(erro => { console.error(erro); process.exitCode = 1; });
