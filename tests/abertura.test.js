const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const local = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
const raiz = new URL(process.env.MATHLAB_URL || local);
raiz.searchParams.delete('sem-abertura');
const semAbertura = new URL(raiz);
semAbertura.searchParams.set('sem-abertura', '');
const pasta = process.env.CALCLAB_CAPTURAS_ABERTURA;
const erros = [];

async function novaPagina(navegador, opcoes = {}, tema = 'dark') {
    const contexto = await navegador.newContext(opcoes);
    const pagina = await contexto.newPage();
    pagina.on('pageerror', erro => erros.push(erro.message));
    pagina.on('response', resposta => {
        if (resposta.status() >= 400) erros.push(resposta.url());
    });
    await contexto.route(/^https?:/, rota => {
        if (new URL(rota.request().url()).origin === raiz.origin) return rota.continue();
        erros.push('Recurso externo: ' + rota.request().url());
        return rota.abort();
    });
    await pagina.addInitScript(temaAtual => {
        try { localStorage.setItem('mathlab_theme', temaAtual); } catch {}
        window.medidas = { deslocamentos: [] };
        function registrarCamada() {
            const camada = document.getElementById('abertura');
            if (camada && !camada.hidden && window.medidas.inicio == null) {
                window.medidas.inicio = performance.now();
            } else if (!camada && window.medidas.inicio != null && window.medidas.fim == null) {
                window.medidas.fim = performance.now();
            }
        }
        new MutationObserver(registrarCamada).observe(document, { subtree: true, attributes: true, childList: true });
        new PerformanceObserver(lista => {
            for (const entrada of lista.getEntries()) {
                if (!entrada.hadRecentInput) window.medidas.deslocamentos.push({ tempo: entrada.startTime, valor: entrada.value });
            }
        }).observe({ type: 'layout-shift', buffered: true });
        addEventListener('focusin', evento => {
            if (evento.target.id === 'sci-expr-input' && window.medidas.pronta == null) {
                window.medidas.pronta = performance.now();
            }
        });
    }, tema);
    return pagina;
}

async function abrir(pagina, url = raiz.href) {
    await pagina.goto(url, { waitUntil: 'domcontentloaded' });
    await pagina.locator('#sci-expr-input').waitFor();
}

async function visorZero(pagina) {
    assert.equal(await pagina.locator('.module-tab.active').getAttribute('data-module'), 'cientifica');
    assert.equal((await pagina.locator('#sci-res-primary').textContent()).trim(), '0');
    assert.equal(await pagina.locator('.modal-backdrop:not(.hidden)').count(), 0);
}

async function fecharAutomaticamente(pagina, min, max) {
    await pagina.waitForFunction(() => window.medidas.fim != null && performance.now() >= window.medidas.fim + 100);
    const medidas = await pagina.evaluate(() => window.medidas);
    const duracao = medidas.fim - medidas.inicio;
    assert.ok(duracao >= min && duracao <= max, `Duração: ${duracao} ms`);
    await visorZero(pagina);
    return medidas;
}

async function verificarCores(pagina) {
    const contraste = await pagina.locator('#abertura').evaluate(el => {
        const luminancia = rgb => {
            const canais = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => v / 255);
            return canais.map((v, i) =>
                (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i]
            ).reduce((a, b) => a + b);
        };
        const fundo = luminancia(getComputedStyle(el).backgroundColor);
        const contrasteComFundo = (seletor, prop) => {
            const frente = luminancia(getComputedStyle(el.querySelector(seletor))[prop]);
            return (Math.max(fundo, frente) + .05) / (Math.min(fundo, frente) + .05);
        };
        return {
            calc: contrasteComFundo('.calc', 'color'), lab: contrasteComFundo('.lab', 'color'),
            lema: contrasteComFundo('.abertura-lema', 'color'),
            eixo: contrasteComFundo('.eixos', 'stroke'),
            azul: contrasteComFundo('.traco-azul', 'stroke'), verde: contrasteComFundo('.traco-verde', 'stroke')
        };
    });
    for (const [parte, valor] of Object.entries(contraste)) {
        assert.ok(valor >= (parte === 'lema' ? 4.5 : 3), `Contraste: ${parte} ${valor}`);
    }
    return Object.fromEntries(Object.entries(contraste).map(([nome, valor]) => [nome, Number(valor.toFixed(2))]));
}

async function testar() {
    const navegador = await chromium.launch({ executablePath: process.env.MATHLAB_BROWSER || undefined, args: ['--no-sandbox'] });
    try {
        const pagina = await novaPagina(navegador);
        await abrir(pagina);
        await pagina.locator('#abertura').waitFor();
        await visorZero(pagina);
        assert.equal(await pagina.evaluate(() => document.activeElement.id), 'sci-expr-input');
        const inicio = await pagina.locator('#sci-expr-input').boundingBox();
        const normal = await fecharAutomaticamente(pagina, 1850, 2400);
        assert.deepEqual(await pagina.locator('#sci-expr-input').boundingBox(), inicio);
        const clsSaida = normal.deslocamentos.filter(item => item.tempo >= normal.fim - 400)
            .reduce((total, item) => total + item.valor, 0);
        assert.ok(clsSaida < .01, `CLS na saída: ${clsSaida}`);
        await pagina.reload();
        assert.equal(await pagina.locator('#abertura').count(), 0);
        await pagina.goto(semAbertura.href);
        assert.equal(await pagina.locator('#abertura').count(), 0);
        await pagina.locator('#btn-open-settings').click();
        await pagina.locator('#btn-open-tour').click();
        await Promise.all([pagina.waitForEvent('load'), pagina.locator('#btn-rever-abertura').click()]);
        await pagina.locator('#abertura').waitFor();
        assert.equal(new URL(pagina.url()).searchParams.has('sem-abertura'), false);
        await pagina.keyboard.press('7');
        await pagina.locator('#abertura').waitFor({ state: 'detached', timeout: 500 });
        assert.equal(await pagina.locator('#sci-expr-input').inputValue(), '7');
        await pagina.context().close();

        const clique = await novaPagina(navegador);
        await abrir(clique);
        await clique.locator('#abertura').waitFor();
        await clique.mouse.click(640, 160);
        await clique.locator('#abertura').waitFor({ state: 'detached', timeout: 500 });
        await visorZero(clique);
        await clique.context().close();

        const bypass = await novaPagina(navegador);
        await abrir(bypass, semAbertura.href);
        assert.equal(await bypass.locator('#abertura').count(), 0);
        const deslocamentosSemAbertura = await bypass.evaluate(() => window.medidas.deslocamentos);
        await bypass.context().close();

        const reduzida = await novaPagina(navegador, { reducedMotion: 'reduce' });
        await abrir(reduzida);
        await reduzida.locator('#abertura').waitFor();
        assert.equal(await reduzida.locator('#abertura').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
        const mReduzida = await fecharAutomaticamente(reduzida, 500, 850);
        await reduzida.context().close();

        for (const [width, height] of [[375, 667], [390, 844]]) {
            const celular = await novaPagina(navegador, { viewport: { width, height }, isMobile: true, hasTouch: true });
            await abrir(celular);
            await celular.locator('#abertura').waitFor();
            for (const seletor of ['.abertura-simbolo', '.abertura-nome']) {
                const r = await celular.locator(seletor).boundingBox();
                assert.ok(Math.abs(r.x + r.width / 2 - width / 2) < 2);
            }
            assert.equal(await celular.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            assert.notEqual(await celular.evaluate(() => document.activeElement.id), 'sci-expr-input');
            await fecharAutomaticamente(celular, 1850, 2400);
            assert.notEqual(await celular.evaluate(() => document.activeElement.id), 'sci-expr-input');
            await celular.context().close();
        }

        const offline = await novaPagina(navegador, { offline: true });
        await abrir(offline, local);
        await offline.locator('#abertura').waitFor();
        await offline.keyboard.press('7');
        assert.equal(await offline.locator('#sci-expr-input').inputValue(), '7');
        await offline.context().close();

        for (const tema of ['dark', 'light']) {
            const tempos = pasta ? [300, 900, 1500, 2200] : [300];
            for (const tempo of tempos) {
                const quadro = await novaPagina(navegador, { viewport: { width: 1366, height: 768 } }, tema);
                await abrir(quadro);
                await quadro.locator('#abertura').waitFor();
                if (tempo === 300) console.log(tema, JSON.stringify(await verificarCores(quadro)));
                if (pasta) {
                    await quadro.waitForFunction(ms => window.medidas.inicio != null && performance.now() - window.medidas.inicio >= ms, tempo);
                    await quadro.screenshot({ path: path.join(pasta, `${tema}-${tempo}ms.png`) });
                }
                await quadro.context().close();
            }
        }

        const amostras = { com: [], sem: [] };
        for (let repeticao = 0; repeticao < 10; repeticao++) {
            for (const variante of ['com', 'sem']) {
                const medicao = await novaPagina(navegador);
                await abrir(medicao, variante === 'com' ? raiz.href : semAbertura.href);
                const t = await medicao.evaluate(() => window.medidas.pronta);
                assert.ok(Number.isFinite(t));
                amostras[variante].push(Math.round(t * 10) / 10);
                await medicao.context().close();
            }
        }
        const mediana = lista => {
            const ordem = [...lista].sort((a, b) => a - b);
            return ((ordem[4] + ordem[5]) / 2).toFixed(1);
        };
        assert.deepEqual(erros, []);
        console.log(`Encerramento automático: ${(normal.fim - normal.inicio).toFixed(1)} ms; movimento reduzido: ${(mReduzida.fim - mReduzida.inicio).toFixed(1)} ms; CLS na saída: ${clsSaida}.`);
        console.log(`Tempo da navegação ao foco na Científica, 10 amostras por variante: com ${mediana(amostras.com)} ms; sem ${mediana(amostras.sem)} ms.`);
        console.log('Amostras (ms):', JSON.stringify(amostras));
        console.log('Deslocamentos de layout com e sem abertura:', JSON.stringify([normal.deslocamentos, deslocamentosSemAbertura]));
        console.log('[OK] Sessão, pulo por clique e tecla, revisão pela Ajuda, zoom móvel, contraste e app offline.');
    } finally {
        await navegador.close();
    }
}

testar().catch(erro => { console.error(erro); process.exitCode = 1; });
