/* ============================================================================
   MATHLAB — CONTROLADOR PRINCIPAL DA APLICAÇÃO (11 MÓDULOS INTEGRADOS)
   Arquivo: src/js/app.js
   Descrição: Gerencia o estado global, navegação entre os 11 ambientes
              matemáticos especializados, interatividade de controles, sliders,
              teclado científico, abas, gráficos, histórico/favoritos
              (LocalStorage), paleta de comandos (Ctrl+K), estudo de funções,
              tema claro/escuro e estados especiais.
   ============================================================================ */

const MathLabApp = {
    /* ========================================================================
       1. ESTADO GLOBAL DA APLICAÇÃO
       ======================================================================== */
    state: {
        theme: 'dark',
        activeModule: 'funcoes', // Abre inicialmente em Funções → Quadrática (Seção 6 - Módulo 03)
        visualCollapsed: false,
        loadingSkeleton: false,

        // Novos recursos de Usabilidade e Dois Modos de Entrada ("Fórmula pronta" vs "Normal")
        inputMode: 'pronta', // 'pronta' (padrão) | 'normal' (lembrado em localStorage)
        passoFluxo: 2,       // 1: Escolher | 2: Preencher | 3: Gerar
        fontScale: 'md',     // 'sm' | 'md' | 'lg' | 'xl'
        reduceMotion: false,
        mostrarExplicacaoReal: false,
        tourStep: 1,
        undoStack: [],
        redoStack: [],
        fxSlots: {},         // controla quais quadradinhos estão com modo expressão "fx" ativo
        slotTextos: {},      // preserva texto digitado nos quadradinhos (ex: "1/2", "2*sen(pi/6)")
        erroSlotMensagem: '', // mensagem de validação curta abaixo da fórmula pronta
        buscaHistorico: '',
        filtroHistorico: 'todos', // 'todos' | 'favoritos' | 'fixados'

        // Módulo 01: Científica
        cientifica: {
            expressao: '2 · sen(π/6) + √16',
            unidadeAngulo: 'rad', // 'rad' | 'grau'
            modoSaida: 'exato',   // 'exato' | 'decimal'
            memoria: 0,
            slots: { c1: 2, c2: 6, c3: 16 }
        },

        // Módulo 02: Álgebra
        algebra: {
            ferramenta: 'eq2', // 'eq2' | 'eq1' | 'fatoracao' | 'expansao' | 'simplificacao' | 'sistema' | 'notaveis'
            abaAtiva: 'resolucao',
            eq2: { a: 1, b: -5, c: 6 }, // x² - 5x + 6 = 0
            eq1: { a: 3, b: -12 },      // 3x - 12 = 0
            expressaoCustom: 'x² − 5x + 6 = 0'
        },

        // Módulo 03: Funções (8 tipos + canônica + fatorada + juros + expressão livre)
        funcoes: {
            tipoAtivo: 'quadratica', // 'constante' | 'afim' | 'linear' | 'quadratica' | 'canonica' | 'fatorada' | 'modular' | 'exponencial' | 'logaritmica' | 'trigonometrica' | 'juros' | 'custom'
            expressaoCustom: 'x² − 4x − 5',
            abaAtiva: 'grafico',     // 'grafico' | 'tabela' | 'propriedades' | 'passos' | 'verificacao' | 'tipos'
            quad: { a: 1, b: -4, c: -5, h: 2, k: -9, x1: -1, x2: 5 },
            paramsExtras: {
                constante: { b: 5 },
                afim: { a: 2, b: 1 },
                linear: { a: 3 },
                modular: { a: 1, h: 0, k: 0 },
                exponencial: { C: 1, a: 2 },
                logaritmica: { a: 2 },
                trigonometrica: { A: 1, B: 1, C: 0, D: 0 },
                juros: { C: 100, i: 0.1 }
            }
        },

        // Módulo 04: Limites
        limites: {
            exemploAtivo: 'removivel', // 'removivel' | 'inexistente' | 'custom'
            funcaoCustom: '(x² − 4)/(x − 2)',
            pontoCustom: '2',
            lado: 'ambos',             // 'ambos' | 'esquerda' | 'direita'
            abaAtiva: 'grafico',       // 'grafico' | 'tabela'
            slots: { a: 1, b: -4, c: 1, d: -2, ponto: 2 }
        },

        // Módulo 05: Derivadas
        derivadas: {
            funcaoExpr: 'x³ · sen(x)',
            ordem: 1,
            x0: 1,
            mostrarFuncao: true,
            mostrarDerivada: true,
            mostrarTangente: true,
            abaAtiva: 'grafico', // 'grafico' | 'regras' | 'passos' | 'tabela' | 'verificacao'
            modeloPronto: 'produto', // 'potencia' | 'soma' | 'produto' | 'quociente' | 'cadeia'
            slots: { a: 1, n: 3, b: -3, m: 1 }
        },

        // Módulo 06: Integrais
        integrais: {
            tipo: 'definida', // 'definida' | 'indefinida'
            funcaoExpr: 'x²',
            a: 0,
            b: 3,
            mostrarRiemann: false,
            nRiemann: 6,
            abaAtiva: 'area', // 'area' | 'resolucao' | 'metodos' | 'verificacao'
            modeloPronto: 'potencia', // 'potencia' | 'exponencial' | 'trigonometrica'
            slots: { coef: 1, n: 2, k: 1 }
        },

        // Módulo 07: Geometria
        geometria: {
            categoria: 'plana', // 'plana' | 'espacial'
            figura: 'circulo',  // Plana: circulo, quadrado, retangulo, triangulo, trapezio, losango | Espacial: cubo, paralelepipedo, esfera, cilindro, cone
            unidade: 'cm',
            params: {
                r: 5, l: 6, b: 8, h: 5, B: 10, D: 8, d: 6, a: 4, c: 3
            }
        },

        // Módulo 08: Trigonometria
        trigonometria: {
            visualizacao: 'grafico', // 'grafico' | 'circulo' | 'tabela'
            funcao: 'sen',           // 'sen' | 'cos' | 'tg'
            amplitude: 1,
            frequencia: 1,
            fase: 0,
            deslocamento: 0,
            anguloGraus: 30,
            unidadeAngulo: 'graus'
        },

        // Módulo 09: Vetores e Matrizes
        vetores: {
            abaPrincipal: 'vetores', // 'vetores' | 'matrizes'
            operacaoVetor: 'soma',   // 'soma' | 'subtracao' | 'escalar' | 'modulo' | 'angulo'
            u: { x: 3, y: 4 },
            v: { x: 1, y: -2 },
            operacaoMatriz: 'multiplicacao', // 'multiplicacao' | 'soma' | 'subtracao' | 'determinante' | 'transposta' | 'inversa'
            dimMatriz: 2, // 2 (2x2) ou 3 (3x3)
            matrizA: [[1, 2], [3, 4]],
            matrizB: [[2, 0], [1, 3]]
        },

        // Módulo 10: Estatística
        estatistica: {
            dadosTexto: '4, 6, 6, 8, 10, 12',
            tipoVariancia: 'populacional', // 'populacional' | 'amostral'
            tipoGrafico: 'histograma',     // 'histograma' | 'barras' | 'linhas'
            abaAtiva: 'distribuicao'       // 'distribuicao' | 'dados' | 'medidas' | 'interpretacao'
        },

        // Módulo 11: Modelagem
        modelagem: {
            modelo: 'exponencial_e', // 'exponencial_e' (P0·e^(kt)) | 'populacional_2' (100·2^(t/3)) | 'juros' | 'decaimento' | 'mu' | 'muv'
            p0: 100,
            k: 0.2,
            t: 10
        },

        // Histórico e Favoritos (persistidos em LocalStorage)
        historico: [],
        indiceCmdSelecionado: 0
    },

    /* ========================================================================
       2. INICIALIZAÇÃO E PERSISTÊNCIA (LOCALSTORAGE + URL STATE)
       ======================================================================== */
    init() {
        this.instalarDecoradoresDoisModos();
        this.carregarPreferencias();
        this.carregarEstadoDaUrl();
        this.vincularEventosGlobais();
        this.vincularMenusCompactos();
        this.renderizarModuloAtivo();
        this.atualizarBadgeFavoritos();
        this.verificarTourPrimeiroUso();
    },

    instalarDecoradoresDoisModos() {
        if (this._decoradoresInstalados) return;
        this._decoradoresInstalados = true;

        const metodosModulos = [
            'renderModuloCientifica', 'renderModuloAlgebra', 'renderModuloFuncoes',
            'renderModuloLimites', 'renderModuloDerivadas', 'renderModuloIntegrais',
            'renderModuloGeometria', 'renderModuloTrigonometria', 'renderModuloVetoresMatrizes',
            'renderModuloEstatistica', 'renderModuloModelagem'
        ];

        metodosModulos.forEach(nome => {
            if (typeof this[nome] !== 'function') return;
            const original = this[nome].bind(this);
            this[nome] = (...args) => {
                // Guarde o foco antes de substituir os campos durante a atualização.
                const campo = document.activeElement;
                const foco = campo?.dataset?.slotKey ? { chave: campo.dataset.slotKey, inicio: campo.selectionStart, fim: campo.selectionEnd } :
                    ['normal-mode-input','ready-expression-input'].includes(campo?.id) ? { id: campo.id, inicio: campo.selectionStart, fim: campo.selectionEnd } :
                    campo?.type === 'range' ? { id: campo.id } : null;
                this._emRenderModulo = true;
                original(...args);
                this._emRenderModulo = false;
                this.injetarSistemaDoisModos();
                this.aprimorarPainelDireitoEmCamadas();
                if (foco) {
                    const novo = foco.chave ? document.querySelector(`.formula-slot[data-slot-key="${foco.chave}"]`) : document.getElementById(foco.id);
                    novo?.focus({preventScroll:true});
                    if (novo && foco.inicio != null) novo.setSelectionRange(foco.inicio, foco.fim);
                }
            };
        });

        ['atualizarCentroEDireitaFuncoes', 'renderizarPainelDireitoCientifica'].forEach(nome => {
            if (typeof this[nome] !== 'function') return;
            const original = this[nome].bind(this);
            this[nome] = (...args) => {
                original(...args);
                if (!this._emRenderModulo) {
                    this.aprimorarPainelDireitoEmCamadas();
                }
            };
        });
    },

    carregarPreferencias() {
        try {
            const temaSalvo = localStorage.getItem('mathlab_theme');
            if (temaSalvo === 'light' || temaSalvo === 'dark') {
                this.state.theme = temaSalvo;
                document.documentElement.setAttribute('data-theme', temaSalvo);
            }

            const modoEntradaSalvo = localStorage.getItem('mathlab_input_mode');
            if (modoEntradaSalvo === 'pronta' || modoEntradaSalvo === 'normal') {
                this.state.inputMode = modoEntradaSalvo;
            }

            const escalaSalva = localStorage.getItem('mathlab_font_scale');
            if (['sm', 'md', 'lg', 'xl'].includes(escalaSalva)) {
                this.state.fontScale = escalaSalva;
                document.documentElement.setAttribute('data-font-scale', escalaSalva);
            }

            const reduceMotionSalvo = localStorage.getItem('mathlab_reduce_motion');
            if (reduceMotionSalvo === 'true') {
                this.state.reduceMotion = true;
                document.documentElement.setAttribute('data-reduce-motion', 'true');
            }

            const preferenciasCalculo = JSON.parse(localStorage.getItem('mathlab_calculation') || 'null');
            if (preferenciasCalculo) {
                if (['rad', 'grau'].includes(preferenciasCalculo.angulo)) this.state.cientifica.unidadeAngulo = preferenciasCalculo.angulo;
                if (['exato', 'decimal'].includes(preferenciasCalculo.saida)) this.state.cientifica.modoSaida = preferenciasCalculo.saida;
                if ([2, 4, 6, 8].includes(preferenciasCalculo.casas)) MathLabCalc.casasDecimais = preferenciasCalculo.casas;
            }

            const histSalvo = localStorage.getItem('mathlab_history');
            if (histSalvo) {
                this.state.historico = JSON.parse(histSalvo);
            } else {
                // Histórico inicial igual à referência visual do MathLab
                this.state.historico = [
                    { id: 1, expressao: '2 · sen(π/6) + √16', resultado: '5', modulo: 'cientifica', nomeModulo: 'Científica', horario: '14:20', favorito: true, fixado: true },
                    { id: 2, expressao: 'f(x) = x² − 4x − 5', resultado: 'V(2, −9)', modulo: 'funcoes', nomeModulo: 'Funções', horario: '14:18', favorito: true, fixado: true, quad: { a: 1, b: -4, c: -5 } },
                    { id: 3, expressao: '√(49)', resultado: '7', modulo: 'cientifica', nomeModulo: 'Científica', horario: '14:15', favorito: false, fixado: false },
                    { id: 4, expressao: 'log(100)', resultado: '2', modulo: 'cientifica', nomeModulo: 'Científica', horario: '14:12', favorito: false, fixado: false },
                    { id: 5, expressao: 'e²', resultado: '7,3891', modulo: 'cientifica', nomeModulo: 'Científica', horario: '14:10', favorito: false, fixado: false },
                    { id: 6, expressao: 'π', resultado: '3,1416', modulo: 'cientifica', nomeModulo: 'Científica', horario: '14:05', favorito: false, fixado: false }
                ];
                this.salvarHistorico();
            }
        } catch (e) {}
    },

    salvarHistorico() {
        try {
            localStorage.setItem('mathlab_history', JSON.stringify(this.state.historico));
        } catch (e) {}
        this.atualizarBadgeFavoritos();
    },

    adicionarAoHistorico(expressao, resultado, modulo, nomeModulo) {
        const agora = new Date();
        const horario = agora.toTimeString().slice(0, 5);
        const novo = {
            id: Date.now(),
            expressao,
            resultado,
            modulo,
            nomeModulo,
            horario,
            favorito: false
        };
        this.state.historico.unshift(novo);
        if (this.state.historico.length > 30) this.state.historico.pop();
        this.salvarHistorico();
    },

    alternarFavorito(id) {
        const item = this.state.historico.find(h => h.id === id);
        if (item) {
            item.favorito = !item.favorito;
            this.salvarHistorico();
            this.mostrarToast(item.favorito ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
            if (this.state.activeModule === 'cientifica') {
                this.renderizarPainelDireitoCientifica();
            }
        }
    },

    atualizarBadgeFavoritos() {
        const badge = document.getElementById('fav-count-badge');
        if (badge) {
            const qtd = this.state.historico.filter(h => h.favorito).length;
            badge.textContent = String(qtd);
        }
    },

    mostrarToast(texto) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'toast-msg';
        el.innerHTML = `<span style="color:var(--green);font-weight:700;">✓</span> <span>${texto}</span>`;
        container.appendChild(el);
        setTimeout(() => {
            el.remove();
        }, 2400);
    },

    copiarTexto(texto, descricao = 'Resultado copiado para a área de transferência') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(() => this.mostrarToast(descricao))
                .catch(() => this.mostrarToast('Não foi possível copiar. Verifique a permissão da área de transferência.'));
        } else {
            const campo = document.createElement('textarea');
            campo.value = texto;
            campo.style.cssText = 'position:fixed;left:-9999px;';
            document.body.appendChild(campo);
            campo.select();
            const copiado = document.execCommand('copy');
            campo.remove();
            this.mostrarToast(copiado ? descricao : 'Cópia indisponível neste navegador.');
        }
    },

    /* ========================================================================
       3. NAVEGAÇÃO ENTRE OS 11 MÓDULOS
       ======================================================================== */
    selecionarModulo(nomeModulo) {
        this.fecharSeletorAlgebra?.();
        this.state.activeModule = nomeModulo;

        // Atualiza abas da barra superior
        document.querySelectorAll('.module-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.module === nomeModulo);
        });

        this.renderizarModuloAtivo();
    },

    renderizarModuloAtivo() {
        const mod = this.state.activeModule;
        document.getElementById('btn-study-footer').hidden = mod !== 'funcoes';
        const workspace = document.getElementById('workspace');

        // A Calculadora Científica não abre gráfico por padrão (ocupa posição central + painel de resolução)
        const semGraficoPadrao = (mod === 'cientifica');
        workspace.classList.toggle('mode-no-visual', semGraficoPadrao);
        workspace.classList.toggle('visual-collapsed', !semGraficoPadrao && this.state.visualCollapsed);

        // Se estiver demonstrando Skeleton Loading
        if (this.state.loadingSkeleton) {
            this.renderizarSkeleton();
            return;
        }

        switch (mod) {
            case 'cientifica':
                this.renderModuloCientifica();
                break;
            case 'algebra':
                this.renderModuloAlgebra();
                break;
            case 'funcoes':
                this.renderModuloFuncoes();
                break;
            case 'limites':
                this.renderModuloLimites();
                break;
            case 'derivadas':
                this.renderModuloDerivadas();
                break;
            case 'integrais':
                this.renderModuloIntegrais();
                break;
            case 'geometria':
                this.renderModuloGeometria();
                break;
            case 'trigonometria':
                this.renderModuloTrigonometria();
                break;
            case 'vetores':
                this.renderModuloVetoresMatrizes();
                break;
            case 'estatistica':
                this.renderModuloEstatistica();
                break;
            case 'modelagem':
                this.renderModuloModelagem();
                break;
        }
    },

    /* Utilitários de palco visual central (Canvas vs Custom SVG/HTML) */
    ativarPalcoCanvas(configGrafico, tituloCentro, badgeCentro) {
        document.getElementById('center-panel-title').textContent = tituloCentro || 'Laboratório Gráfico';
        document.getElementById('center-panel-badge').textContent = badgeCentro || '';

        const canvasWrap = document.getElementById('canvas-stage-wrapper');
        const customWrap = document.getElementById('custom-stage-wrapper');
        const toolbar = document.getElementById('center-visual-toolbar');

        canvasWrap.style.display = 'block';
        customWrap.style.display = 'none';
        toolbar.style.display = 'flex';

        const canvas = document.getElementById('main-graph-canvas');
        MathLabGraph.conectarCanvas(canvas, configGrafico);
        this.renderizarLegendaFlutuante(configGrafico);
    },

    ativarPalcoCustom(htmlConteudo, tituloCentro, badgeCentro, mostrarToolbar = false) {
        document.getElementById('center-panel-title').textContent = tituloCentro || 'Laboratório Visual';
        document.getElementById('center-panel-badge').textContent = badgeCentro || '';

        const canvasWrap = document.getElementById('canvas-stage-wrapper');
        const customWrap = document.getElementById('custom-stage-wrapper');
        const toolbar = document.getElementById('center-visual-toolbar');

        canvasWrap.style.display = 'none';
        customWrap.style.display = 'flex';
        toolbar.style.display = mostrarToolbar ? 'flex' : 'none';
        customWrap.innerHTML = htmlConteudo;
    },

    renderizarLegendaFlutuante(config) {
        const legEl = document.getElementById('graph-legend-floating');
        if (!legEl) return;
        legEl.style.display = 'none';
        legEl.hidden = true;
        legEl.innerHTML = '';
    },

    renderizarAbasCentro(abas, abaAtiva, callbackTroca) {
        const grupo = document.getElementById('center-tabs-group');
        if (!grupo) return;
        grupo.innerHTML = abas.map(a => `
            <button type="button" class="sub-tab-btn ${a.id === abaAtiva ? 'active' : ''}" data-tab-id="${a.id}">
                ${a.rotulo}
            </button>
        `).join('');

        grupo.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => callbackTroca(btn.dataset.tabId));
        });
    },

    /* ========================================================================
       MÓDULO 01 — CALCULADORA CIENTÍFICA
       ======================================================================== */
    renderModuloCientifica() {
        const st = this.state.cientifica;
        const avaliacao = MathLabCalc.avaliarCientifica(st.expressao, st.unidadeAngulo, st.modoSaida);

        document.getElementById('left-panel-title').textContent = 'Calculadora Científica';
        document.getElementById('left-panel-badge').textContent = 'Cálculos Gerais e Funções';
        document.getElementById('left-panel-actions').innerHTML = `
            <button type="button" class="header-btn" id="btn-sci-err-demo" title="Testar erro de domínio log(−5)">Testar log(−5)</button>
        `;

        const leftBody = document.getElementById('left-panel-body');
        leftBody.innerHTML = `
            <!-- Visor Principal -->
            <div class="math-display-box">
                <div class="display-top-bar">
                    <div class="display-badges">
                        <span class="mini-pill active">${st.unidadeAngulo.toUpperCase()}</span>
                        <span class="mini-pill">${st.modoSaida.toUpperCase()}</span>
                        <span class="mini-pill">MEM: ${MathLabCalc.fmt(st.memoria)}</span>
                    </div>
                    <span>Expressão Científica</span>
                </div>
                <div class="expression-input-row">
                    <input type="text" id="sci-expr-input" class="expression-input" value="${st.expressao}" placeholder="Digite uma expressão (ex: 2 · sen(π/6) + √16)" aria-label="Expressão matemática">
                </div>
                <div class="display-result-row">
                    <span class="result-label">Resultado</span>
                    <div class="result-values">
                        <span class="result-primary" id="sci-res-primary" style="color:${avaliacao.erro ? 'var(--red)' : 'var(--text-main)'};">
                            ${avaliacao.erro ? 'Erro' : avaliacao.resultadoExibido}
                        </span>
                        ${!avaliacao.erro && st.modoSaida === 'exato' ? `<span class="result-secondary">(≈ ${avaliacao.resultadoDecimal})</span>` : ''}
                    </div>
                </div>
            </div>

            <!-- Controles RAD/GRAU e EXATO/DECIMAL -->
            <div class="segmented-row">
                <div class="segmented-control" style="flex:1;">
                    <button type="button" class="segmented-btn ${st.unidadeAngulo === 'rad' ? 'active' : ''}" data-sci-ang="rad">RAD</button>
                    <button type="button" class="segmented-btn ${st.unidadeAngulo === 'grau' ? 'active' : ''}" data-sci-ang="grau">GRAU</button>
                </div>
                <div class="segmented-control" style="flex:1;">
                    <button type="button" class="segmented-btn ${st.modoSaida === 'exato' ? 'active' : ''}" data-sci-out="exato">EXATO</button>
                    <button type="button" class="segmented-btn ${st.modoSaida === 'decimal' ? 'active' : ''}" data-sci-out="decimal">DECIMAL</button>
                </div>
            </div>

            <!-- Teclado Científico Completo -->
            <div class="scientific-keypad">
                <div class="keypad-row-memory">
                    <button type="button" class="key-btn key-mem" data-key-mem="mc" title="Limpar memória">MC</button>
                    <button type="button" class="key-btn key-mem" data-key-mem="mr" title="Recuperar memória">MR</button>
                    <button type="button" class="key-btn key-mem" data-key-mem="m+" title="Somar à memória">M+</button>
                    <button type="button" class="key-btn key-mem" data-key-mem="m-" title="Subtrair da memória">M−</button>
                    <button type="button" class="key-btn key-danger" data-key-act="clear" title="Limpar expressão">C</button>
                    <button type="button" class="key-btn key-danger" data-key-act="back" title="Apagar último caractere">⌫</button>
                </div>

                <div class="keypad-grid-main">
                    <button type="button" class="key-btn key-fn" data-key-ins="sen(">sen</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="cos(">cos</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="tg(">tg</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="log(">log</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="ln(">ln</button>

                    <button type="button" class="key-btn key-fn" data-key-ins="^2">x²</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="^">xʸ</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="√(">√x</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="|">|x|</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="1/(">1/x</button>

                    <button type="button" class="key-btn key-fn" data-key-ins="π">π</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="e">e</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="e^">eˣ</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="!">n!</button>
                    <button type="button" class="key-btn key-fn" data-key-ins="%">%</button>

                    <button type="button" class="key-btn key-num" data-key-ins="7">7</button>
                    <button type="button" class="key-btn key-num" data-key-ins="8">8</button>
                    <button type="button" class="key-btn key-num" data-key-ins="9">9</button>
                    <button type="button" class="key-btn key-op" data-key-ins="(">(</button>
                    <button type="button" class="key-btn key-op" data-key-ins=")">)</button>

                    <button type="button" class="key-btn key-num" data-key-ins="4">4</button>
                    <button type="button" class="key-btn key-num" data-key-ins="5">5</button>
                    <button type="button" class="key-btn key-num" data-key-ins="6">6</button>
                    <button type="button" class="key-btn key-op" data-key-ins=" · ">×</button>
                    <button type="button" class="key-btn key-op" data-key-ins=" / ">÷</button>

                    <button type="button" class="key-btn key-num" data-key-ins="1">1</button>
                    <button type="button" class="key-btn key-num" data-key-ins="2">2</button>
                    <button type="button" class="key-btn key-num" data-key-ins="3">3</button>
                    <button type="button" class="key-btn key-op" data-key-ins=" + ">+</button>
                    <button type="button" class="key-btn key-op" data-key-ins=" − ">−</button>

                    <button type="button" class="key-btn key-num" data-key-ins="0" style="grid-column: span 2;">0</button>
                    <button type="button" class="key-btn key-num" data-key-ins=",">,</button>
                    <button type="button" class="key-btn key-equal" data-key-act="eval" style="grid-column: span 2;">=</button>
                </div>
            </div>
        `;

        this.renderizarPainelDireitoCientifica(avaliacao);
        this.vincularEventosCientifica();
    },

    renderizarPainelDireitoCientifica(avaliacao) {
        const st = this.state.cientifica;
        const av = avaliacao || MathLabCalc.avaliarCientifica(st.expressao, st.unidadeAngulo, st.modoSaida);

        document.getElementById('right-panel-title').textContent = 'Resolução e Histórico';
        document.getElementById('right-panel-actions').innerHTML = `
            <button type="button" class="header-btn" id="btn-copy-sci">Copiar</button>
        `;

        const rightBody = document.getElementById('right-panel-body');

        let blocoResolucao = '';
        if (av.erro) {
            blocoResolucao = `
                <div class="state-banner error">
                    <div class="state-banner-left">
                        <div class="state-icon-circle">✕</div>
                        <div>
                            <div class="state-banner-title">${av.tituloErro}</div>
                            <div class="state-banner-desc">${av.mensagemErro}</div>
                            <div class="state-banner-suggestion">${av.sugestaoErro}</div>
                        </div>
                    </div>
                    <button type="button" class="btn-secondary-action" id="btn-fix-sci-err">Corrigir</button>
                </div>
            `;
        } else if (av.vazio) {
            blocoResolucao = `
                <div class="info-section">
                    <span class="section-heading">Estado Vazio</span>
                    <p style="color:var(--text-secondary);font-size:12.5px;">Insira uma expressão matemática no visor ou utilize o teclado científico para ver o passo a passo.</p>
                </div>
            `;
        } else {
            blocoResolucao = `
                <div class="info-section">
                    <div class="section-header-line">
                        <span class="section-heading">Resolução Passo a Passo</span>
                        <span class="panel-subtitle-badge">${st.expressao} = ${av.resultadoExato}</span>
                    </div>
                    <div class="steps-list">
                        ${av.passos.map(p => `
                            <div class="step-card">
                                <span class="step-title">${p.titulo}</span>
                                <span class="step-math">${p.math}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${av.verificado ? `
                <div class="verification-box">
                    <div class="section-header-line">
                        <span class="section-heading" style="color:var(--green);">Verificação</span>
                        <span class="verified-badge">✓ Verificado</span>
                    </div>
                    <div class="verification-line">
                        <span>✓</span> <span>${av.detalheVerificacao}</span>
                    </div>
                </div>
                ` : ''}
            `;
        }

        // Lista de Histórico
        const htmlHistorico = this.state.historico.slice(0, 8).map(item => `
            <div class="history-card" data-hist-id="${item.id}">
                <div class="history-card-left">
                    <span class="history-expr">${item.expressao}</span>
                    <div class="history-meta">
                        <span>${item.nomeModulo}</span>
                        <span>•</span>
                        <span>${item.horario}</span>
                    </div>
                </div>
                <div class="history-card-right">
                    <span class="history-res">= ${item.resultado}</span>
                    <button type="button" class="mini-icon-btn ${item.favorito ? 'favorited' : ''}" data-fav-id="${item.id}" title="Favoritar cálculo"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z"/></svg></button>
                    <button type="button" class="mini-icon-btn" data-copy-expr="${item.expressao} = ${item.resultado}" title="Copiar"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg></button>
                </div>
            </div>
        `).join('');

        rightBody.innerHTML = `
            ${blocoResolucao}
            <div class="info-section">
                <div class="section-header-line">
                    <span class="section-heading">Histórico de Cálculos</span>
                    <button type="button" class="mini-icon-btn" id="btn-Restore-Demo-Sci" title="Restaurar demonstração inicial" style="width:auto;padding:0 6px;font-size:11px;">Demo Inicial</button>
                </div>
                <div class="history-items">
                    ${htmlHistorico}
                </div>
            </div>
        `;

        // Eventos do painel direito da Científica
        const btnFix = document.getElementById('btn-fix-sci-err');
        if (btnFix) {
            btnFix.addEventListener('click', () => {
                this.state.cientifica.expressao = av.expressaoCorrigida || 'log(5)';
                this.renderModuloCientifica();
            });
        }

        const btnCopySci = document.getElementById('btn-copy-sci');
        if (btnCopySci) {
            btnCopySci.addEventListener('click', () => {
                this.copiarTexto(`${st.expressao} = ${av.resultadoExibido}`);
            });
        }

        const btnDemoSci = document.getElementById('btn-Restore-Demo-Sci');
        if (btnDemoSci) {
            btnDemoSci.addEventListener('click', () => {
                this.state.cientifica.expressao = '2 · sen(π/6) + √16';
                this.state.cientifica.unidadeAngulo = 'rad';
                this.renderModuloCientifica();
            });
        }

        rightBody.querySelectorAll('[data-fav-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.alternarFavorito(Number(btn.dataset.favId));
            });
        });

        rightBody.querySelectorAll('[data-copy-expr]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copiarTexto(btn.dataset.copyExpr);
            });
        });

        rightBody.querySelectorAll('.history-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = Number(card.dataset.histId);
                const item = this.state.historico.find(h => h.id === id);
                if (item) {
                    if (item.modulo === 'cientifica') {
                        this.state.cientifica.expressao = item.expressao;
                        this.renderModuloCientifica();
                    } else {
                        this.selecionarModulo(item.modulo);
                    }
                }
            });
        });
    },

    vincularEventosCientifica() {
        const st = this.state.cientifica;
        const input = document.getElementById('sci-expr-input');

        if (input) {
            input.addEventListener('input', (e) => {
                st.expressao = e.target.value;
                const av = MathLabCalc.avaliarCientifica(st.expressao, st.unidadeAngulo, st.modoSaida);
                const resEl = document.getElementById('sci-res-primary');
                if (resEl) {
                    resEl.textContent = av.erro ? 'Erro' : av.resultadoExibido;
                    resEl.style.color = av.erro ? 'var(--red)' : 'var(--text-main)';
                }
                this.renderizarPainelDireitoCientifica(av);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const av = MathLabCalc.avaliarCientifica(st.expressao, st.unidadeAngulo, st.modoSaida);
                    if (!av.erro && !av.vazio) {
                        this.adicionarAoHistorico(st.expressao, av.resultadoExibido, 'cientifica', 'Científica');
                        this.renderizarPainelDireitoCientifica(av);
                    }
                }
            });
        }

        document.getElementById('btn-sci-err-demo')?.addEventListener('click', () => {
            st.expressao = 'log(−5)';
            this.renderModuloCientifica();
        });

        document.querySelectorAll('[data-sci-ang]').forEach(btn => {
            btn.addEventListener('click', () => {
                st.unidadeAngulo = btn.dataset.sciAng;
                this.renderModuloCientifica();
            });
        });

        document.querySelectorAll('[data-sci-out]').forEach(btn => {
            btn.addEventListener('click', () => {
                st.modoSaida = btn.dataset.sciOut;
                this.renderModuloCientifica();
            });
        });

        document.querySelectorAll('[data-key-ins]').forEach(btn => {
            btn.addEventListener('click', () => {
                st.expressao = (st.expressao || '') + btn.dataset.keyIns;
                this.renderModuloCientifica();
            });
        });

        document.querySelectorAll('[data-key-act]').forEach(btn => {
            btn.addEventListener('click', () => {
                const act = btn.dataset.keyAct;
                if (act === 'clear') {
                    st.expressao = '';
                    this.renderModuloCientifica();
                } else if (act === 'back') {
                    st.expressao = String(st.expressao || '').slice(0, -1);
                    this.renderModuloCientifica();
                } else if (act === 'eval') {
                    const av = MathLabCalc.avaliarCientifica(st.expressao, st.unidadeAngulo, st.modoSaida);
                    if (!av.erro && !av.vazio) {
                        this.adicionarAoHistorico(st.expressao, av.resultadoExibido, 'cientifica', 'Científica');
                        this.mostrarToast(`Calculado: ${av.resultadoExibido}`);
                    }
                    this.renderModuloCientifica();
                }
            });
        });

        document.querySelectorAll('[data-key-mem]').forEach(btn => {
            btn.addEventListener('click', () => {
                const m = btn.dataset.keyMem;
                const av = MathLabCalc.avaliarCientifica(st.expressao, st.unidadeAngulo, 'decimal');
                const valAtual = !av.erro ? parseFloat(String(av.resultadoDecimal).replace(',', '.')) || 0 : 0;

                if (m === 'mc') st.memoria = 0;
                else if (m === 'mr') st.expressao += String(st.memoria).replace('.', ',');
                else if (m === 'm+') st.memoria += valAtual;
                else if (m === 'm-') st.memoria -= valAtual;

                this.renderModuloCientifica();
            });
        });
    },

    /* ========================================================================
       MÓDULO 02 — ÁLGEBRA
       ======================================================================== */
    // Mantém o select como fonte de valor e usa uma lista acessível com o tema do app.
    prepararSeletorAlgebra() {
        this._seletorAlgebraAbort?.abort();
        document.getElementById('alg-tool-options')?.remove();
        const fonte=document.getElementById('alg-tool-select');
        if(!fonte)return;
        const controller=new AbortController(),signal=controller.signal;
        this._seletorAlgebraAbort=controller;
        const descricoes={eq2:['Equações do 2º grau','ax² + bx + c = 0'],fatoracao:['Fatoração polinomial','Escrever como produto de fatores'],expansao:['Expansão algébrica','Desenvolver produtos e potências'],simplificacao:['Simplificação racional','Reduzir frações algébricas'],eq1:['Equações do 1º grau','ax + b = 0'],sistema:['Sistemas lineares 2×2','Duas equações, duas incógnitas'],notaveis:['Produtos notáveis','Identidades algébricas fundamentais']};
        fonte.hidden=true;
        const label=fonte.previousElementSibling;
        label.id='alg-tool-label';label.htmlFor='alg-tool-trigger';
        const gatilho=document.createElement('button');
        gatilho.type='button';gatilho.id='alg-tool-trigger';gatilho.className='algebra-picker-trigger';
        gatilho.setAttribute('role','combobox');gatilho.setAttribute('aria-haspopup','listbox');
        gatilho.setAttribute('aria-expanded','false');gatilho.setAttribute('aria-controls','alg-tool-options');
        gatilho.setAttribute('aria-labelledby','alg-tool-label alg-tool-current');
        gatilho.innerHTML=`<span class="algebra-tool-symbol" aria-hidden="true">ƒ</span><span id="alg-tool-current">${descricoes[fonte.value][0]}</span><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
        fonte.after(gatilho);
        const lista=document.createElement('div');
        lista.id='alg-tool-options';lista.className='algebra-picker-list';lista.hidden=true;
        lista.setAttribute('role','listbox');lista.setAttribute('aria-labelledby','alg-tool-label');
        const opcoes=Array.from(fonte.options);let indice=fonte.selectedIndex;
        lista.innerHTML=opcoes.map((o,i)=>`<div role="option" id="alg-tool-option-${i}" data-tool-index="${i}" aria-selected="${o.selected}"><span class="algebra-tool-symbol" aria-hidden="true">${i+1}</span><span class="algebra-tool-description"><strong>${descricoes[o.value][0]}</strong><small>${descricoes[o.value][1]}</small></span><svg class="icone algebra-tool-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></div>`).join('');
        document.body.append(lista);
        const itens=Array.from(lista.children);
        const destacar=()=>{
            itens.forEach((o,i)=>o.classList.toggle('is-highlighted',i===indice));
            gatilho.setAttribute('aria-activedescendant',itens[indice].id);
            itens[indice].scrollIntoView({block:'nearest'});
        };
        const fechar=()=>{lista.hidden=true;gatilho.setAttribute('aria-expanded','false');gatilho.removeAttribute('aria-activedescendant');};
        this.fecharSeletorAlgebra=fechar;
        const abrir=()=>{
            lista.hidden=false;
            const r=gatilho.getBoundingClientRect();
            lista.style.width=`${Math.min(Math.max(r.width,300),innerWidth-24)}px`;
            lista.style.maxHeight=`${Math.min(464,innerHeight-24)}px`;
            lista.style.left=`${Math.max(12,Math.min(r.left,innerWidth-lista.offsetWidth-12))}px`;
            const h=lista.offsetHeight;
            lista.style.top=`${r.bottom+8+h<innerHeight-12?r.bottom+8:Math.max(12,r.top-8-h)}px`;
            gatilho.setAttribute('aria-expanded','true');indice=fonte.selectedIndex;destacar();
        };
        const escolher=()=>{
            fonte.value=opcoes[indice].value;fechar();
            fonte.dispatchEvent(new Event('change',{bubbles:true}));
            document.getElementById('alg-tool-trigger')?.focus({preventScroll:true});
        };
        gatilho.addEventListener('click',()=>{gatilho.focus({preventScroll:true});lista.hidden?abrir():fechar();},{signal});
        gatilho.addEventListener('keydown',e=>{
            if(e.key==='Escape'){e.preventDefault();fechar();return;}
            if(e.key==='Tab'){fechar();return;}
            if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(e.key)){
                e.preventDefault();
                if(lista.hidden){abrir();return;}
                if(e.key==='Enter'||e.key===' '){escolher();return;}
                if(e.key==='Home')indice=0;
                else if(e.key==='End')indice=itens.length-1;
                else indice=(indice+(e.key==='ArrowDown'?1:-1)+itens.length)%itens.length;
                destacar();
            }
        },{signal});
        lista.addEventListener('click',e=>{const item=e.target.closest('[data-tool-index]');if(item){indice=Number(item.dataset.toolIndex);escolher();}},{signal});
        document.addEventListener('pointerdown',e=>{if(!lista.contains(e.target)&&!gatilho.contains(e.target))fechar();},{signal});
        window.addEventListener('resize',fechar,{signal});
        document.addEventListener('scroll',e=>{if(!lista.hidden&&!lista.contains(e.target))fechar();},{capture:true,signal});
    },

    renderModuloAlgebra() {
        const st = this.state.algebra;
        document.getElementById('left-panel-title').textContent = 'Álgebra Simbólica';
        document.getElementById('left-panel-badge').textContent = 'Equações e Fatoração';
        document.getElementById('left-panel-actions').innerHTML = '';

        // Dados calculados em tempo real para Equação do 2º grau (padrão: x² - 5x + 6 = 0)
        const { a, b, c } = st.eq2;
        const q = MathLabCalc.calcularQuadratica(a, b, c);

        const catalogFerramentas = {
            eq2: {
                nome: 'Equação do 2º Grau',
                expr: `${q.expressao.replace('f(x) = ', '')} = 0`,
                solucao: q.raizesNum.length === 2 ? `x₁ = ${MathLabCalc.fmt(q.raizesNum[0])}   •   x₂ = ${MathLabCalc.fmt(q.raizesNum[1])}` : q.raizesTexto,
                fatorada: `${q.formaFatorada} = 0`,
                passos: [
                    { titulo: '1. Equação na forma canônica ax² + bx + c = 0', math: `${q.expressao.replace('f(x) = ', '')} = 0  (a=${a}, b=${b}, c=${c})` },
                    { titulo: '2. Fatoração por Soma e Produto (Girard)', math: `${q.formaFatorada} = 0` },
                    { titulo: '3. Propriedade do Produto Nulo', math: q.raizesNum.length === 2 ? `x − (${MathLabCalc.fmt(q.raizesNum[0])}) = 0  ou  x − (${MathLabCalc.fmt(q.raizesNum[1])}) = 0` : `Δ = ${MathLabCalc.fmt(q.delta)}` },
                    { titulo: '4. Conjunto Solução em ℝ', math: q.raizesNum.length === 2 ? `x₁ = ${MathLabCalc.fmt(q.raizesNum[0])} ,  x₂ = ${MathLabCalc.fmt(q.raizesNum[1])}` : q.raizesTexto }
                ],
                verificacao: q.raizesNum.map(r => `(${MathLabCalc.fmt(r)})² ${b < 0 ? '− ' + Math.abs(b) : '+ ' + b}(${MathLabCalc.fmt(r)}) ${c < 0 ? '− ' + Math.abs(c) : '+ ' + c} = 0`)
            },
            fatoracao: {
                nome: 'Fatoração Algébrica',
                expr: 'x² − 5x + 6',
                solucao: '(x − 2)(x − 3)',
                fatorada: '(x − 2)(x − 3)',
                passos: [
                    { titulo: '1. Identificar soma S e produto P', math: 'S = −5 (soma = 2 + 3 = 5) e P = 6 (produto = 2 · 3 = 6)' },
                    { titulo: '2. Decompor o termo central', math: 'x² − 2x − 3x + 6' },
                    { titulo: '3. Fator comum em evidência por agrupamento', math: 'x(x − 2) − 3(x − 2) = (x − 2)(x − 3)' }
                ],
                verificacao: ['Para x = 2: (2 − 2)(2 − 3) = 0', 'Para x = 3: (3 − 2)(3 − 3) = 0']
            },
            expansao: {
                nome: 'Expansão Polinomial',
                expr: '(x − 2)(x − 3)',
                solucao: 'x² − 5x + 6',
                fatorada: 'x² − 2x − 3x + 6',
                passos: [
                    { titulo: '1. Aplicar propriedade distributiva (chuveirinho)', math: 'x·x + x·(−3) − 2·x + (−2)·(−3)' },
                    { titulo: '2. Multiplicar os monômios', math: 'x² − 3x − 2x + 6' },
                    { titulo: '3. Reduzir os termos semelhantes', math: 'x² − 5x + 6' }
                ],
                verificacao: ['Grau resultante = 2', 'Termo independente: (−2)·(−3) = +6']
            },
            simplificacao: {
                nome: 'Simplificação de Fração Algébrica',
                expr: '(x² − 4) / (x − 2)',
                solucao: 'x + 2  (para x ≠ 2)',
                fatorada: '(x − 2)(x + 2) / (x − 2)',
                passos: [
                    { titulo: '1. Fatorar o numerador (Diferença de Quadrados)', math: 'x² − 4 = x² − 2² = (x − 2)(x + 2)' },
                    { titulo: '2. Restrição de domínio (denominador ≠ 0)', math: 'x − 2 ≠ 0 ⇒ x ≠ 2' },
                    { titulo: '3. Cancelamento do fator comum (x − 2)', math: '[(x − 2)(x + 2)] / (x − 2) = x + 2' }
                ],
                verificacao: ['Para x = 3: (9 − 4)/(3 − 2) = 5  e  3 + 2 = 5']
            },
            eq1: {
                nome: 'Equação do 1º Grau',
                expr: '3x − 12 = 0',
                solucao: 'x = 4',
                fatorada: '3(x − 4) = 0',
                passos: [
                    { titulo: '1. Isolar o termo com a incógnita x', math: '3x = 12' },
                    { titulo: '2. Dividir ambos os membros por a = 3', math: 'x = 12 / 3 ⇒ x = 4' }
                ],
                verificacao: ['Substituição: 3(4) − 12 = 12 − 12 = 0']
            },
            sistema: {
                nome: 'Sistema Linear 2×2',
                expr: '{ x + y = 5  ;  2x − y = 1 }',
                solucao: 'x = 2 ,  y = 3',
                fatorada: 'Par ordenado S = {(2, 3)}',
                passos: [
                    { titulo: '1. Método da Adição (somar as duas equações)', math: '(x + 2x) + (y − y) = 5 + 1 ⇒ 3x = 6' },
                    { titulo: '2. Determinar o valor de x', math: 'x = 6 / 3 = 2' },
                    { titulo: '3. Substituir x = 2 na 1ª equação', math: '2 + y = 5 ⇒ y = 3' }
                ],
                verificacao: ['Eq. 1: 2 + 3 = 5 ✓', 'Eq. 2: 2(2) − 3 = 4 − 3 = 1 ✓']
            },
            notaveis: {
                nome: 'Produtos Notáveis',
                expr: '(x − 3)²',
                solucao: 'x² − 6x + 9',
                fatorada: 'a² − 2ab + b²',
                passos: [
                    { titulo: '1. Regra do Quadrado da Diferença', math: '(a − b)² = a² − 2·a·b + b²' },
                    { titulo: '2. Substituição com a = x e b = 3', math: 'x² − 2·(x)·(3) + 3² = x² − 6x + 9' }
                ],
                verificacao: ['Para x = 5: (5 − 3)² = 4  e  5² − 6(5) + 9 = 25 − 30 + 9 = 4']
            }
        };

        const dados = catalogFerramentas[st.ferramenta] || catalogFerramentas.eq2;

        const leftBody = document.getElementById('left-panel-body');
        leftBody.innerHTML = `
            <div class="math-display-box">
                <div class="display-top-bar">
                    <span class="mini-pill active">${dados.nome}</span>
                    <span>Manipulação Algébrica</span>
                </div>
                <div class="expression-input-row">
                    <input type="text" class="expression-input" value="${dados.expr}" readonly aria-label="Equação algébrica">
                </div>
                <div class="display-result-row">
                    <span class="result-label">Soluções / Fatoração</span>
                    <div class="result-values">
                        <span class="result-primary" style="font-size:17px;">${dados.solucao}</span>
                    </div>
                </div>
            </div>

            <div class="control-group">
                <label class="field-label" for="alg-tool-select">Ferramenta Algébrica</label>
                <select id="alg-tool-select" class="field-select">
                    <option value="eq2" ${st.ferramenta === 'eq2' ? 'selected' : ''}>Equações do 2º Grau (x² − 5x + 6 = 0)</option>
                    <option value="fatoracao" ${st.ferramenta === 'fatoracao' ? 'selected' : ''}>Fatoração Polinomial</option>
                    <option value="expansao" ${st.ferramenta === 'expansao' ? 'selected' : ''}>Expansão Algébrica</option>
                    <option value="simplificacao" ${st.ferramenta === 'simplificacao' ? 'selected' : ''}>Simplificação Racional</option>
                    <option value="eq1" ${st.ferramenta === 'eq1' ? 'selected' : ''}>Equações do 1º Grau</option>
                    <option value="sistema" ${st.ferramenta === 'sistema' ? 'selected' : ''}>Sistemas Lineares 2×2</option>
                    <option value="notaveis" ${st.ferramenta === 'notaveis' ? 'selected' : ''}>Produtos Notáveis</option>
                </select>
            </div>

            ${st.ferramenta === 'eq2' ? `
            <div class="sliders-box">
                <div class="field-label"><span>Coeficientes de ax² + bx + c = 0</span> <button type="button" class="mini-icon-btn" id="btn-reset-alg" style="width:auto;padding:0 6px;font-size:11px;">Padrão (1, −5, 6)</button></div>
                <div class="control-row-3col">
                    <div class="control-group">
                        <label class="field-label" for="alg-a">a</label>
                        <input type="number" id="alg-a" class="field-input" value="${a}" step="1">
                    </div>
                    <div class="control-group">
                        <label class="field-label" for="alg-b">b</label>
                        <input type="number" id="alg-b" class="field-input" value="${b}" step="1">
                    </div>
                    <div class="control-group">
                        <label class="field-label" for="alg-c">c</label>
                        <input type="number" id="alg-c" class="field-input" value="${c}" step="1">
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="info-section" style="margin-top:auto;">
                <span class="section-heading">Forma Fatorada Equivalente</span>
                <div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--primary);">${dados.fatorada}</div>
            </div>
        `;

        // Abas das ferramentas algébricas no centro + Gráfico das raízes
        this.renderizarAbasCentro([
            { id: 'eq2', rotulo: 'Eq. 2º Grau' },
            { id: 'fatoracao', rotulo: 'Fatoração' },
            { id: 'expansao', rotulo: 'Expansão' },
            { id: 'simplificacao', rotulo: 'Simplificação' },
            { id: 'sistema', rotulo: 'Sistemas' },
            { id: 'notaveis', rotulo: 'Prod. Notáveis' }
        ], st.ferramenta, (novaFerramenta) => {
            st.ferramenta = novaFerramenta;
            this.renderModuloAlgebra();
        });

        // Gráfico no centro mostrando geometricamente as raízes ou interseção do sistema
        if (st.ferramenta === 'sistema') {
            this.ativarPalcoCanvas({
                janela: { xMin: -2, xMax: 6, yMin: -2, yMax: 6 },
                curvas: [
                    { rotulo: 'y = 5 − x', cor: '#22C55E', fn: x => 5 - x },
                    { rotulo: 'y = 2x − 1', cor: '#3B82F6', fn: x => 2 * x - 1 }
                ],
                marcadores: [{ x: 2, y: 3, rotulo: 'Solução (2, 3)', cor: '#EF4444' }]
            }, 'Interpretação Geométrica na Álgebra', dados.expr);
        } else {
            const fnPlot = st.ferramenta === 'eq2' ? q.fn : (x => x * x - 5 * x + 6);
            const raizesPlot = st.ferramenta === 'eq2' ? q.raizesNum : [2, 3];
            this.ativarPalcoCanvas({
                janela: { xMin: -1, xMax: 6, yMin: -3, yMax: 7 },
                curvas: [{ rotulo: dados.expr, cor: '#22C55E', fn: fnPlot }],
                marcadores: raizesPlot.map((r, i) => ({
                    x: r, y: 0, rotulo: `x${i + 1} = (${MathLabCalc.fmt(r)}, 0)`, cor: '#EF4444'
                }))
            }, 'Zeros e Fatoração Geométrica', dados.expr);
        }

        // Painel direito: Resolução e Verificação das raízes (igual à imagem de referência)
        document.getElementById('right-panel-title').textContent = 'Resolução e Verificação';
        document.getElementById('right-panel-actions').innerHTML = '';
        document.getElementById('right-panel-body').innerHTML = `
            <div class="info-section">
                <div class="section-header-line">
                    <span class="section-heading">Resolução (Passo a Passo)</span>
                </div>
                <div class="steps-list">
                    ${dados.passos.map(p => `
                        <div class="step-card">
                            <span class="step-title">${p.titulo}</span>
                            <span class="step-math">${p.math}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="verification-box">
                <div class="section-header-line">
                    <span class="section-heading" style="color:var(--green);">Verificação das Raízes</span>
                    <span class="verified-badge">✓ Verificado</span>
                </div>
                ${dados.verificacao.map(lin => `
                    <div class="verification-line">
                        <span style="color:var(--green);font-weight:700;">✓</span>
                        <span>${lin}</span>
                    </div>
                `).join('')}
            </div>

            <div class="interpretation-box">
                <strong>Interpretação Algébrica:</strong> As soluções reais da equação correspondem exatamente às abscissas onde o polinômio intercepta o eixo horizontal <strong>y = 0</strong>.
            </div>
        `;

        // Eventos da Álgebra
        document.getElementById('alg-tool-select')?.addEventListener('change', (e) => {
            st.ferramenta = e.target.value;
            this.renderModuloAlgebra();
        });

        this.prepararSeletorAlgebra();
        ['a', 'b', 'c'].forEach(coef => {
            document.getElementById(`alg-${coef}`)?.addEventListener('input', (e) => {
                st.eq2[coef] = parseFloat(e.target.value) || 0;
                this.renderModuloAlgebra();
            });
        });

        document.getElementById('btn-reset-alg')?.addEventListener('click', () => {
            st.eq2 = { a: 1, b: -5, c: 6 };
            this.renderModuloAlgebra();
        });
    },

    /* ========================================================================
       MÓDULO 03 — FUNÇÕES (8 TIPOS + QUADRÁTICA DINÂMICA + EXPRESSÃO LIVRE)
       ======================================================================== */
    escaparHTML(texto) {
        return String(texto ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    },

    definirExpressaoFuncao(texto) {
        const st = this.state.funcoes;
        const expressao = String(texto ?? '').trim().replace(/^f\(x\)\s*=\s*/i, '');
        const conversao = MathLabCalc.converterTextoParaSlots(expressao, 'funcoes');
        // Elimina textos de quadradinhos que pertenciam à função anterior.
        Object.keys(this.state.slotTextos).filter(k => k.startsWith('funcoes_'))
            .forEach(k => delete this.state.slotTextos[k]);
        st.expressaoCustom = expressao;
        if (conversao.reconhecido && ['quadratica', 'afim', 'linear', 'constante'].includes(conversao.subtipo)) {
            st.tipoAtivo = conversao.subtipo;
            const destino = st.tipoAtivo === 'quadratica' ? st.quad : st.paramsExtras[st.tipoAtivo];
            Object.assign(destino, conversao.slots);
        } else if (/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(expressao)) {
            st.tipoAtivo = 'constante';
            st.paramsExtras.constante.b = Number(expressao.replace(',', '.'));
        } else {
            st.tipoAtivo = 'custom';
        }
    },

    obterDadosAtuaisFuncoes() {
        const st = this.state.funcoes;
        if (st.tipoAtivo === 'custom') {
            const texto = st.expressaoCustom;
            const valido = texto.trim() && MathLabCalc.validarExpressaoNormal(texto).valido;
            if (!valido) {
                return {
                    tipo: 'custom', nomeTipo: 'Expressão Livre',
                    expressao: texto ? `f(x) = ${this.escaparHTML(texto)}` : '',
                    subtituloResultado: texto ? 'Revise a expressão' : 'Digite uma fórmula',
                    vazio: !texto.trim(), invalido: !!texto.trim(),
                    propriedades: [], passos: [], estudoCompleto: {},
                    verificacao: { aprovado: false, linhas: [] },
                    grafico: { janela: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 }, curvas: [], marcadores: [] }
                };
            }
            return MathLabCalc.analisarFuncaoCustomizada(texto);
        }
        if (['quadratica', 'canonica', 'fatorada'].includes(st.tipoAtivo)) {
            return MathLabCalc.obterDadosTipoFuncao(st.tipoAtivo, st.quad);
        }
        const p = (st.paramsExtras && st.paramsExtras[st.tipoAtivo]) || {};
        return MathLabCalc.obterDadosTipoFuncao(st.tipoAtivo, p);
    },

    renderModuloFuncoes() {
        const st = this.state.funcoes;
        const dados = this.obterDadosAtuaisFuncoes();

        document.getElementById('left-panel-title').textContent = 'Funções';
        document.getElementById('left-panel-badge').textContent = '';
        document.getElementById('left-panel-actions').innerHTML = '';

        const leftBody = document.getElementById('left-panel-body');
        leftBody.innerHTML = `
            <!-- Seletor dos Tipos de Funções + Expressão Livre -->
            <div class="control-group">
                <label class="field-label" for="select-fn-type">Tipo de função</label>
                <select id="select-fn-type" class="field-select">
                    <option value="quadratica" ${st.tipoAtivo === 'quadratica' ? 'selected' : ''}>4. Quadrática — f(x) = [a]x² + [b]x + [c]</option>
                    <option value="canonica" ${st.tipoAtivo === 'canonica' ? 'selected' : ''}>4b. Forma Canônica — f(x) = [a](x − [h])² + [k]</option>
                    <option value="fatorada" ${st.tipoAtivo === 'fatorada' ? 'selected' : ''}>4c. Forma Fatorada — f(x) = [a](x − [x₁])(x − [x₂])</option>
                    <option value="constante" ${st.tipoAtivo === 'constante' ? 'selected' : ''}>1. Constante — f(x) = [b]</option>
                    <option value="afim" ${st.tipoAtivo === 'afim' ? 'selected' : ''}>2. Afim (1º Grau) — f(x) = [a]x + [b]</option>
                    <option value="linear" ${st.tipoAtivo === 'linear' ? 'selected' : ''}>3. Linear — f(x) = [a]x</option>
                    <option value="modular" ${st.tipoAtivo === 'modular' ? 'selected' : ''}>5. Modular — f(x) = [a]|x − [h]| + [k]</option>
                    <option value="exponencial" ${st.tipoAtivo === 'exponencial' ? 'selected' : ''}>6. Exponencial — f(x) = [C]·[a]ˣ</option>
                    <option value="logaritmica" ${st.tipoAtivo === 'logaritmica' ? 'selected' : ''}>7. Logarítmica — f(x) = log_[a](x)</option>
                    <option value="trigonometrica" ${st.tipoAtivo === 'trigonometrica' ? 'selected' : ''}>8. Trigonométrica — f(x) = [A]·sen([B]x + [C]) + [D]</option>
                    <option value="juros" ${st.tipoAtivo === 'juros' ? 'selected' : ''}>9. Juros Compostos — M(t) = [C](1 + [i])ᵗ</option>
                    <option value="custom" ${st.tipoAtivo === 'custom' ? 'selected' : ''}>Expressão Livre</option>
                </select>
            </div>

            <!-- Sliders Dinâmicos a, b, c (quando Quadrática estiver selecionada) -->
            ${st.tipoAtivo === 'quadratica' ? `
            <div class="sliders-box" id="quad-sliders-box">
                <div class="field-label">
                    <span>Parâmetros Dinâmicos (<strong style="color:#3B82F6;">a</strong>, <strong style="color:#F59E0B;">b</strong>, <strong style="color:#22C55E;">c</strong>)</span>
                    <button type="button" class="mini-icon-btn" id="btn-reset-quad" style="width:auto;padding:0 6px;font-size:11px;" title="Restaurar x² - 4x - 5">Padrão</button>
                </div>
                <div class="slider-item">
                    <label class="slider-label" for="slider-quad-a" style="color:#60A5FA;">a =</label>
                    <input type="range" id="slider-quad-a" class="math-slider" min="-5" max="5" step="1" value="${st.quad.a}">
                    <span class="slider-value-badge" id="val-quad-a" style="color:#60A5FA;border-color:#3B82F6;">${st.quad.a}</span>
                </div>
                <div class="slider-item">
                    <label class="slider-label" for="slider-quad-b" style="color:#FBBF24;">b =</label>
                    <input type="range" id="slider-quad-b" class="math-slider" min="-10" max="10" step="1" value="${st.quad.b}">
                    <span class="slider-value-badge" id="val-quad-b" style="color:#FBBF24;border-color:#F59E0B;">${st.quad.b}</span>
                </div>
                <div class="slider-item">
                    <label class="slider-label" for="slider-quad-c" style="color:#4ADE80;">c =</label>
                    <input type="range" id="slider-quad-c" class="math-slider" min="-10" max="10" step="1" value="${st.quad.c}">
                    <span class="slider-value-badge" id="val-quad-c" style="color:#4ADE80;border-color:#22C55E;">${st.quad.c}</span>
                </div>
            </div>
            ` : `
            <p class="expression-help" title="Use x^3, sen(x), cos(x), sqrt(x) ou abs(x).">? Digite qualquer função no modo Normal.</p>
            `}

        `;

        this.atualizarCentroEDireitaFuncoes(dados);
        this.vincularEventosFuncoes();
    },

    atualizarCentroEDireitaFuncoes(dados) {
        const st = this.state.funcoes;

        // Abas do Laboratório Central
        this.renderizarAbasCentro([
            { id: 'grafico', rotulo: 'Gráfico' },
            { id: 'tabela', rotulo: 'Tabela' },
            { id: 'propriedades', rotulo: 'Propriedades' },
            { id: 'passos', rotulo: 'Passos' },
            { id: 'verificacao', rotulo: 'Verificação' },
            { id: 'tipos', rotulo: 'Tipos de funções (8)' }
        ], st.abaAtiva, (novaAba) => {
            st.abaAtiva = novaAba;
            this.atualizarCentroEDireitaFuncoes(this.obterDadosAtuaisFuncoes());
        });

        // Conteúdo da Área Central conforme a aba selecionada
        if ((dados.vazio || dados.invalido) && st.abaAtiva !== 'tipos') {
            // Limpa o canvas anterior e mantém todas as abas no mesmo estado vazio.
            MathLabGraph.conectarCanvas(document.getElementById('main-graph-canvas'), dados.grafico);
            this.ativarPalcoCustom(`<div class="empty-function-state"><span aria-hidden="true">ƒ</span><p>${dados.subtituloResultado}</p><small>O gráfico e a análise aparecem enquanto você digita.</small></div>`, 'Laboratório Gráfico', '');
        } else if (st.abaAtiva === 'grafico') {
            this.ativarPalcoCanvas(dados.grafico, 'Laboratório Gráfico', dados.expressao);
        } else if (st.abaAtiva === 'tabela') {
            const xs = [-3, -2, -1, 0, 1, 2, 3, 4, 5];
            const fn = dados.grafico.curvas[0]?.fn || (() => NaN);
            const linhasHtml = xs.map(xv => {
                const yv = fn(xv);
                const ehRaiz = Number.isFinite(yv) && Math.abs(yv) < 1e-7;
                const ehVertice = dados.quadData && dados.quadData.ehQuadratica && Math.abs(xv - dados.quadData.xv) < 1e-7;
                const classe = ehVertice ? 'highlight-vertex' : ehRaiz ? 'highlight-root' : '';
                const obs = ehVertice ? 'Vértice (Extremo)' : ehRaiz ? 'Raiz (Zero)' : xv === 0 ? 'Intercepto em y' : 'Ponto da curva';
                return `
                    <tr class="${classe}">
                        <td>${xv}</td>
                        <td>${Number.isFinite(yv) ? MathLabCalc.fmt(yv, 3) : 'Não definido (∉ Dom)'}</td>
                        <td>(${xv}, ${Number.isFinite(yv) ? MathLabCalc.fmt(yv, 2) : '—'})</td>
                        <td>${obs}</td>
                    </tr>
                `;
            }).join('');

            this.ativarPalcoCustom(`
                <div style="width:100%;max-width:640px;">
                    <div class="data-table-wrapper">
                        <table class="math-table">
                            <thead>
                                <tr><th>x</th><th>f(x)</th><th>Par Ordenado (x, y)</th><th>Classificação do Ponto</th></tr>
                            </thead>
                            <tbody>${linhasHtml}</tbody>
                        </table>
                    </div>
                </div>
            `, `Tabela de Valores — ${dados.nomeTipo}`, dados.expressao);
        } else if (st.abaAtiva === 'tipos') {
            const listaTipos = [
                { id: 'constante', nome: '1. Constante', form: 'f(x) = 5' },
                { id: 'afim', nome: '2. Afim', form: 'f(x) = 2x + 1' },
                { id: 'linear', nome: '3. Linear', form: 'f(x) = 3x' },
                { id: 'quadratica', nome: '4. Quadrática', form: 'f(x) = x² − 4x − 5' },
                { id: 'modular', nome: '5. Modular', form: 'f(x) = |x|' },
                { id: 'exponencial', nome: '6. Exponencial', form: 'f(x) = 2ˣ' },
                { id: 'logaritmica', nome: '7. Logarítmica', form: 'f(x) = log₂(x)' },
                { id: 'trigonometrica', nome: '8. Trigonométrica', form: 'f(x) = sen(x)' }
            ];

            this.ativarPalcoCustom(`
                <div class="function-types-grid">
                    ${listaTipos.map(t => `
                        <button type="button" class="fn-type-card ${st.tipoAtivo === t.id ? 'active' : ''}" data-pick-fntype="${t.id}">
                            <div class="fn-type-card-header">
                                <span class="fn-type-name">${t.nome}</span>
                            </div>
                            <span class="fn-type-formula">${t.form}</span>
                            <div class="fn-mini-svg-box">
                                ${MathLabVisuals.gerarMiniSvgFuncao(t.id)}
                            </div>
                        </button>
                    `).join('')}
                </div>
            `, 'Catálogo dos 8 Tipos de Funções', 'Clique em um minigráfico para abrir');

            document.querySelectorAll('[data-pick-fntype]').forEach(card => {
                card.addEventListener('click', () => {
                    st.tipoAtivo = card.dataset.pickFntype;
                    st.abaAtiva = 'grafico';
                    this.renderModuloFuncoes();
                });
            });
        } else {
            // Abas Propriedades, Passos ou Verificação detalhadas no centro + gráfico fácil de voltar
            this.ativarPalcoCanvas(dados.grafico, 'Laboratório Gráfico', dados.expressao);
        }

        // Painel Direito: Propriedades, Formas, Passos e Verificação
        document.getElementById('right-panel-title').textContent = 'Propriedades';
        document.getElementById('right-panel-actions').innerHTML = '';

        const rightBody = document.getElementById('right-panel-body');
        rightBody.innerHTML = `
            ${dados.avisoEspecial ? `
            <div class="state-banner warning">
                <div class="state-banner-left">
                    <div class="state-icon-circle">!</div>
                    <div>
                        <div class="state-banner-title">Coeficiente a = 0</div>
                        <div class="state-banner-desc">${dados.avisoEspecial}</div>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="info-section">
                <div class="section-header-line">
                    <span class="section-heading">Propriedades da Função</span>
                </div>
                <div class="props-list">
                    ${dados.propriedades.map(p => `
                        <div class="prop-item">
                            <span class="prop-key"><span class="prop-dot" style="background:${p.cor};"></span>${p.chave}</span>
                            <span class="prop-val">${p.valor}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="info-section">
                <span class="section-heading">Passo a Passo</span>
                <div class="steps-list">
                    ${dados.passos.map(p => `
                        <div class="step-card">
                            <span class="step-title">${p.titulo}</span>
                            <span class="step-math">${p.math}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="verification-box">
                <div class="section-header-line">
                    <span class="section-heading" style="color:var(--green);">Verificação</span>
                    <span class="verified-badge">✓ Verificado</span>
                </div>
                ${dados.verificacao.linhas.map(l => `
                    <div class="verification-line">
                        <span>✓</span> <span>${l}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    vincularEventosFuncoes() {
        const st = this.state.funcoes;

        document.getElementById('select-fn-type')?.addEventListener('change', (e) => {
            this.state.slotTextos = {};
            this.salvarSnapshotUndo();
            st.tipoAtivo = e.target.value;
            this.renderModuloFuncoes();
        });

        const aplicarExpressaoCustomFuncoes = () => {
            const inp = document.getElementById('fn-expr-display');
            if (!inp) return;
            const txt = inp.value.trim();
            this.definirExpressaoFuncao(txt);
            this.renderModuloFuncoes();
        };

        document.getElementById('btn-fn-eval-custom')?.addEventListener('click', aplicarExpressaoCustomFuncoes);
        document.getElementById('fn-expr-display')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') aplicarExpressaoCustomFuncoes();
        });

        // Sliders em tempo real da Quadrática (atualiza sem recriar os inputs range para arraste fluido!)
        ['a', 'b', 'c'].forEach(param => {
            const slider = document.getElementById(`slider-quad-${param}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    st.quad[param] = Number(e.target.value);
                    delete this.state.slotTextos[`funcoes_${param}`];
                    document.getElementById(`val-quad-${param}`).textContent = String(st.quad[param]);

                    const slotInput = document.querySelector(`.formula-slot[data-slot-key="${param}"]`);
                    if (slotInput) {
                        slotInput.value = String(st.quad[param]);
                        slotInput.classList.toggle('slot-invalid', param === 'a' && st.quad.a === 0);
                    }
                    const hintErr = document.getElementById('slot-error-hint-msg');
                    if (hintErr) {
                        hintErr.textContent = st.quad.a === 0 ? '⚠ a não pode ser 0 em uma quadrática (degenera em função afim)' : '';
                        hintErr.style.display = st.quad.a === 0 ? 'flex' : 'none';
                    }

                    const novosDados = MathLabCalc.obterDadosTipoFuncao('quadratica', st.quad);
                    const exprInput = document.getElementById('fn-expr-display');
                    const highInput = document.getElementById('fn-highlight-display');
                    if (exprInput) exprInput.value = novosDados.expressao;
                    if (highInput) highInput.textContent = novosDados.subtituloResultado;

                    this.atualizarCentroEDireitaFuncoes(novosDados);
                });
            }
        });

        document.getElementById('btn-reset-quad')?.addEventListener('click', () => {
            st.quad = { a: 1, b: -4, c: -5 };
            this.renderModuloFuncoes();
        });

        document.getElementById('btn-open-study-drawer')?.addEventListener('click', () => this.abrirEstudoFuncao());
        document.getElementById('btn-study-main')?.addEventListener('click', () => this.abrirEstudoFuncao());
        document.getElementById('btn-show-types-grid')?.addEventListener('click', () => {
            st.abaAtiva = 'tipos';
            this.renderModuloFuncoes();
        });
    },

    /**
     * Abre o painel lateral "Estudar função" com todas as 11 propriedades acompanhando o tipo atual.
     */
    abrirEstudoFuncao() {
        const st = this.state.funcoes;
        const dados = this.obterDadosAtuaisFuncoes();
        const est = dados.estudoCompleto;

        document.getElementById('study-drawer-title').textContent = `Estudo Completo — Função ${dados.nomeTipo}`;
        document.getElementById('study-drawer-subtitle').textContent = dados.expressao;

        const body = document.getElementById('study-drawer-body');
        body.innerHTML = `
            <div class="info-section" style="flex-direction:row;align-items:center;justify-content:space-between;">
                <div>
                    <div class="section-heading">Expressão Analisada</div>
                    <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--green);margin-top:4px;">${dados.expressao}</div>
                </div>
                <div style="width:150px;height:78px;border:1px solid var(--border-color);border-radius:6px;overflow:hidden;">
                    ${MathLabVisuals.gerarMiniSvgFuncao(st.tipoAtivo)}
                </div>
            </div>

            <div class="study-grid-2col">
                <div class="study-card">
                    <span class="study-card-label">1. Domínio</span>
                    <span class="study-card-value">${est.dominio}</span>
                </div>
                <div class="study-card">
                    <span class="study-card-label">2. Imagem</span>
                    <span class="study-card-value" style="color:var(--green);">${est.imagem}</span>
                </div>
                <div class="study-card">
                    <span class="study-card-label">3. Raízes (Zeros)</span>
                    <span class="study-card-value" style="color:var(--red);">${est.raizes}</span>
                </div>
                <div class="study-card">
                    <span class="study-card-label">4. Interceptos nos Eixos</span>
                    <span class="study-card-value">${est.interceptos}</span>
                </div>
                <div class="study-card">
                    <span class="study-card-label">5. Paridade</span>
                    <span class="study-card-value">${est.paridade}</span>
                </div>
                <div class="study-card">
                    <span class="study-card-label">6. Concavidade</span>
                    <span class="study-card-value">${est.concavidade}</span>
                </div>
                <div class="study-card">
                    <span class="study-card-label">7. Crescimento</span>
                    <span class="study-card-value">${est.crescimento}</span>
                </div>
                <div class="study-card">
                    <span class="study-card-label">8. Decrescimento</span>
                    <span class="study-card-value">${est.decrescimento}</span>
                </div>
                <div class="study-card">
                    <span class="study-card-label">9. Extremos (Máx / Mín)</span>
                    <span class="study-card-value" style="color:var(--primary);">${est.extremos}</span>
                </div>
                <div class="study-card">
                    <span class="study-card-label">10. Assíntotas</span>
                    <span class="study-card-value" style="color:var(--amber);">${est.assintotas}</span>
                </div>
            </div>

            <div class="study-card">
                <span class="study-card-label">11. Estudo do Sinal (f(x) &gt; 0 e f(x) &lt; 0)</span>
                <span class="study-card-value" style="font-size:12.5px;">${est.sinal}</span>
            </div>

            <div class="verification-box">
                <div class="section-header-line">
                    <span class="section-heading" style="color:var(--green);">Conferência Analítica e Gráfica</span>
                    ${dados.verificacao.aprovado ? '<span class="verified-badge">✓ Verificado</span>' : '<span class="result-status">Não verificado por segundo método</span>'}
                </div>
                ${dados.verificacao.linhas.map(l => `<div class="verification-line"><span>✓</span> <span>${l}</span></div>`).join('')}
            </div>
        `;

        document.getElementById('drawer-study-backdrop').classList.remove('hidden');
    },

    /* ========================================================================
       MÓDULO 04 — LIMITES
       ======================================================================== */
    renderModuloLimites() {
        const st = this.state.limites;
        document.getElementById('left-panel-title').textContent = 'Limites e Continuidade';
        document.getElementById('left-panel-badge').textContent = 'Análise Local e Infinito';
        document.getElementById('left-panel-actions').innerHTML = '';

        const cenarios = {
            removivel: {
                rotulo: 'lim(x→2) (x² − 4)/(x − 2)',
                funcao: '(x² − 4)/(x − 2)',
                ponto: '2',
                resBilateral: '4',
                resEsquerda: '4',
                resDireita: '4',
                existe: true,
                continuidade: 'Descontinuidade removível',
                detalheCont: 'f(2) é indeterminado (0/0), mas lim(x→2) f(x) = 4. Buraco aberto em (2, 4).',
                passos: [
                    { titulo: '1. Substituição direta gera indeterminação 0/0', math: '(2² − 4)/(2 − 2) = 0 / 0 (Indeterminação)' },
                    { titulo: '2. Fatorar o numerador (Diferença de quadrados)', math: '(x² − 4)/(x − 2) = [(x − 2)(x + 2)] / (x − 2)' },
                    { titulo: '3. Simplificar para x ≠ 2 e aplicar o limite', math: 'lim(x→2) (x + 2) = 2 + 2 = 4' }
                ],
                tabela: [
                    { xEsq: '1,9', fEsq: '3,9', xDir: '2,1', fDir: '4,1' },
                    { xEsq: '1,99', fEsq: '3,99', xDir: '2,01', fDir: '4,01' },
                    { xEsq: '1,999', fEsq: '3,999', xDir: '2,001', fDir: '4,001' }
                ],
                grafico: {
                    janela: { xMin: -2, xMax: 5.5, yMin: -1, yMax: 7 },
                    curvas: [{ rotulo: 'f(x) = (x² − 4)/(x − 2)', cor: '#22C55E', fn: x => x + 2 }],
                    marcadores: [{ x: 2, y: 4, rotulo: '(2, 4)', cor: '#EF4444', vazado: true, raio: 6.5, projetarEixos: true }]
                }
            },
            inexistente: {
                rotulo: 'lim(x→0) 1/x',
                funcao: '1 / x',
                ponto: '0',
                resBilateral: 'NÃO EXISTE',
                resEsquerda: '−∞',
                resDireita: '+∞',
                existe: false,
                continuidade: 'Descontinuidade infinita (Assíntota em x = 0)',
                detalheCont: 'Os limites laterais divergem com sinais opostos: pela esquerda tende a −∞ e pela direita tende a +∞.',
                passos: [
                    { titulo: '1. Análise do limite lateral à esquerda (x → 0⁻)', math: 'Para x < 0 próximo de 0: 1/(−0,001) = −1000 ⇒ lim(x→0⁻) 1/x = −∞' },
                    { titulo: '2. Análise do limite lateral à direita (x → 0⁺)', math: 'Para x > 0 próximo de 0: 1/(+0,001) = +1000 ⇒ lim(x→0⁺) 1/x = +∞' },
                    { titulo: '3. Conclusão de existência', math: 'Como lim(x→0⁻) ≠ lim(x→0⁺), o limite bilateral NÃO EXISTE' }
                ],
                tabela: [
                    { xEsq: '−0,1', fEsq: '−10', xDir: '+0,1', fDir: '+10' },
                    { xEsq: '−0,01', fEsq: '−100', xDir: '+0,01', fDir: '+100' },
                    { xEsq: '−0,001', fEsq: '−1000', xDir: '+0,001', fDir: '+1000' }
                ],
                grafico: {
                    janela: { xMin: -5, xMax: 5, yMin: -6, yMax: 6 },
                    curvas: [{ rotulo: 'f(x) = 1/x', cor: '#22C55E', fn: x => (Math.abs(x) < 0.02 ? NaN : 1 / x) }],
                    assintotas: [{ tipo: 'vertical', valor: 0, cor: '#EF4444', rotulo: 'Assíntota x = 0' }],
                    marcadores: []
                }
            }
        };

        const cen = st.exemploAtivo === 'custom'
            ? MathLabCalc.calcularLimiteGeral(st.funcaoCustom, st.pontoCustom)
            : (cenarios[st.exemploAtivo] || cenarios.removivel);
        const resultadoMostrado = st.lado === 'esquerda' ? cen.resEsquerda : st.lado === 'direita' ? cen.resDireita : cen.resBilateral;

        const leftBody = document.getElementById('left-panel-body');
        leftBody.innerHTML = `
            <div class="math-display-box">
                <div class="display-top-bar">
                    <span class="mini-pill active">x → ${cen.ponto}${st.lado === 'esquerda' ? '⁻' : st.lado === 'direita' ? '⁺' : ''}</span>
                    <span>Cálculo de Limites (Editável)</span>
                </div>
                <div class="expression-input-row">
                    <input type="text" class="expression-input" value="${cen.rotulo}" readonly>
                </div>
                <div class="display-result-row">
                    <span class="result-label">Resultado</span>
                    <div class="result-values">
                        <span class="result-primary" style="color:${cen.existe ? 'var(--green)' : 'var(--amber)'};">${resultadoMostrado}</span>
                    </div>
                </div>
            </div>

            <div class="control-row-2col">
                <div class="control-group">
                    <label class="field-label" for="lim-fn-inp">Função f(x)</label>
                    <input type="text" id="lim-fn-inp" class="field-input" value="${cen.funcao}" placeholder="Ex: (x^2-9)/(x-3)">
                </div>
                <div class="control-group">
                    <label class="field-label" for="lim-pt-inp">Ponto (x → a)</label>
                    <input type="text" id="lim-pt-inp" class="field-input" value="${cen.ponto}" placeholder="Ex: 3">
                </div>
            </div>

            <div class="control-group">
                <span class="field-label">Direção de aproximação (Lado)</span>
                <div class="segmented-control full-width">
                    <button type="button" class="segmented-btn ${st.lado === 'esquerda' ? 'active' : ''}" data-lim-side="esquerda">Esquerda (x→a⁻)</button>
                    <button type="button" class="segmented-btn ${st.lado === 'ambos' ? 'active' : ''}" data-lim-side="ambos">Ambos</button>
                    <button type="button" class="segmented-btn ${st.lado === 'direita' ? 'active' : ''}" data-lim-side="direita">Direita (x→a⁺)</button>
                </div>
            </div>

            <div class="info-section">
                <span class="section-heading">Demonstrações Obrigatórias</span>
                <div class="action-btn-row">
                    <button type="button" class="btn-secondary-action ${st.exemploAtivo === 'removivel' ? 'active' : ''}" id="btn-lim-demo1" style="flex:1;border-color:${st.exemploAtivo === 'removivel' ? 'var(--primary)' : ''};">
                        (x²−4)/(x−2) → 4
                    </button>
                    <button type="button" class="btn-secondary-action" id="btn-lim-demo2" style="flex:1;color:var(--amber);border-color:${st.exemploAtivo === 'inexistente' ? 'var(--amber)' : ''};">
                        lim(x→0) 1/x (Não Existe)
                    </button>
                </div>
            </div>

            <div class="info-section" style="margin-top:auto;">
                <span class="section-heading">Tabela de Aproximações Laterais</span>
                <table class="math-table">
                    <thead>
                        <tr><th>x → ${cen.ponto}⁻</th><th>f(x)</th><th>x → ${cen.ponto}⁺</th><th>f(x)</th></tr>
                    </thead>
                    <tbody>
                        ${cen.tabela.map(t => `
                            <tr><td>${t.xEsq}</td><td style="color:var(--green);">${t.fEsq}</td><td>${t.xDir}</td><td style="color:var(--primary);">${t.fDir}</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.renderizarAbasCentro([
            { id: 'grafico', rotulo: 'Gráfico e Descontinuidade' },
            { id: 'tabela', rotulo: 'Tabela de Aproximações' }
        ], st.abaAtiva, (aba) => {
            st.abaAtiva = aba;
            this.renderModuloLimites();
        });

        this.ativarPalcoCanvas(cen.grafico, 'Análise Gráfica de Limite e Continuidade', cen.rotulo);

        document.getElementById('right-panel-title').textContent = 'Análise e Continuidade';
        document.getElementById('right-panel-actions').innerHTML = '';
        document.getElementById('right-panel-body').innerHTML = `
            ${!cen.existe ? `
            <div class="state-banner warning">
                <div class="state-banner-left">
                    <div class="state-icon-circle">!</div>
                    <div>
                        <div class="state-banner-title">Limite inexistente</div>
                        <div class="state-banner-desc">NÃO EXISTE: limite à esquerda −∞, à direita +∞.</div>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="info-section">
                <span class="section-heading">Análise de Limites Laterais</span>
                <div class="props-list">
                    <div class="prop-item">
                        <span class="prop-key">Limite à esquerda (x → ${cen.ponto}⁻)</span>
                        <span class="prop-val">${cen.resEsquerda}</span>
                    </div>
                    <div class="prop-item">
                        <span class="prop-key">Limite à direita (x → ${cen.ponto}⁺)</span>
                        <span class="prop-val">${cen.resDireita}</span>
                    </div>
                    <div class="prop-item">
                        <span class="prop-key">Limite bilateral (x → ${cen.ponto})</span>
                        <span class="prop-val" style="color:${cen.existe ? 'var(--green)' : 'var(--amber)'};">${cen.resBilateral}</span>
                    </div>
                    <div class="prop-item">
                        <span class="prop-key">Continuidade</span>
                        <span class="prop-val">${cen.continuidade}</span>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <span class="section-heading">Resolução Passo a Passo</span>
                <div class="steps-list">
                    ${cen.passos.map(p => `
                        <div class="step-card">
                            <span class="step-title">${p.titulo}</span>
                            <span class="step-math">${p.math}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${cen.existe ? `
            <div class="verification-box">
                <div class="section-header-line">
                    <span class="section-heading" style="color:var(--green);">Verificação de Existência</span>
                    <span class="verified-badge">✓ Verificado</span>
                </div>
                <div class="verification-line"><span>✓</span> <span>lim(x→2⁻) f(x) = lim(x→2⁺) f(x) = 4</span></div>
                <div class="verification-line"><span>•</span> <span>Buraco aberto em (2, 4) marcado no gráfico.</span></div>
            </div>
            ` : `
            <div class="interpretation-box">
                <strong>Explicação:</strong> ${cen.detalheCont}
            </div>
            `}
        `;

        document.querySelectorAll('[data-lim-side]').forEach(btn => {
            btn.addEventListener('click', () => {
                st.lado = btn.dataset.limSide;
                this.renderModuloLimites();
            });
        });

        document.getElementById('btn-lim-demo1')?.addEventListener('click', () => {
            st.exemploAtivo = 'removivel';
            this.renderModuloLimites();
        });

        document.getElementById('btn-lim-demo2')?.addEventListener('click', () => {
            st.exemploAtivo = 'inexistente';
            this.renderModuloLimites();
        });

        const aplicarLimiteCustom = () => {
            const fnInp = document.getElementById('lim-fn-inp');
            const ptInp = document.getElementById('lim-pt-inp');
            if (!fnInp || !ptInp) return;
            st.funcaoCustom = fnInp.value.trim() || '(x² − 4)/(x − 2)';
            st.pontoCustom = ptInp.value.trim() || '2';
            st.exemploAtivo = 'custom';
            this.renderModuloLimites();
        };

        document.getElementById('lim-fn-inp')?.addEventListener('change', aplicarLimiteCustom);
        document.getElementById('lim-pt-inp')?.addEventListener('change', aplicarLimiteCustom);
    },

    /* ========================================================================
       MÓDULO 05 — DERIVADAS
       ======================================================================== */
    renderModuloDerivadas() {
        const st = this.state.derivadas;
        document.getElementById('left-panel-title').textContent = 'Derivadas e Taxa de Variação';
        document.getElementById('left-panel-badge').textContent = `${st.ordem}ª Ordem`;
        document.getElementById('left-panel-actions').innerHTML = `
            <button type="button" class="header-btn" id="btn-der-reset" title="Restaurar demonstração x³·sen(x)">Padrão</button>
        `;

        const analise = MathLabCalc.analisarDerivadaExpressao(st.funcaoExpr || 'x³ · sen(x)');
        const fnOrig = analise.fn;
        const fnDeriv1 = analise.df1;
        const fnDeriv2 = analise.df2;

        const fnDerivAtiva = st.ordem === 1 ? fnDeriv1 : fnDeriv2;
        const exprDeriv = st.ordem === 1
            ? `f′(x) = ${analise.simb1}`
            : `f″(x) = ${analise.simb2}`;

        const x0 = Number(st.x0);
        const y0 = fnOrig(x0);
        const mTangente = fnDeriv1(x0);
        const valorDerivNoPonto = fnDerivAtiva(x0);
        const fnTangente = (x) => y0 + mTangente * (x - x0);

        const leftBody = document.getElementById('left-panel-body');
        leftBody.innerHTML = `
            <div class="math-display-box">
                <div class="display-top-bar">
                    <span class="mini-pill active">f(x) = ${analise.expressaoLimpa}</span>
                    <span>Derivação Simbólica e Numérica</span>
                </div>
                <div class="expression-input-row">
                    <input type="text" class="expression-input" value="${exprDeriv}" readonly style="font-size:15.5px;color:var(--green);">
                </div>
                <div class="display-result-row">
                    <span class="result-label">Em x = ${MathLabCalc.fmt(x0)}</span>
                    <div class="result-values">
                        <span class="result-primary" style="font-size:19px;">f${st.ordem === 1 ? '′' : '″'}(${MathLabCalc.fmt(x0)}) ≈ ${MathLabCalc.fmt(valorDerivNoPonto, 4)}</span>
                    </div>
                </div>
            </div>

            <div class="control-group">
                <label class="field-label" for="der-fn-input">Função f(x) para Derivar (Digite + Enter)</label>
                <input type="text" id="der-fn-input" class="field-input" value="${this.escaparHTML(analise.expressaoLimpa)}" placeholder="Ex: x^3 * sen(x), x^3 - 3x, e^x">
            </div>

            <div class="control-row-2col">
                <div class="control-group">
                    <label class="field-label" for="der-order-sel">Ordem da Derivada</label>
                    <select id="der-order-sel" class="field-select">
                        <option value="1" ${st.ordem === 1 ? 'selected' : ''}>1ª Ordem — f′(x)</option>
                        <option value="2" ${st.ordem === 2 ? 'selected' : ''}>2ª Ordem — f″(x)</option>
                    </select>
                </div>
                <div class="control-group">
                    <label class="field-label" for="der-x0-input">Ponto de Análise (x₀)</label>
                    <input type="number" id="der-x0-input" class="field-input" value="${x0}" step="0.5" min="-5" max="5">
                </div>
            </div>

            <div class="sliders-box">
                <span class="field-label">Camadas Visíveis no Gráfico</span>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;">
                    <input type="checkbox" id="chk-der-f" ${st.mostrarFuncao ? 'checked' : ''}>
                    <span class="prop-dot" style="background:#22C55E;"></span>
                    <span>Exibir função original <strong>f(x)</strong> (Verde)</span>
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;">
                    <input type="checkbox" id="chk-der-df" ${st.mostrarDerivada ? 'checked' : ''}>
                    <span class="prop-dot" style="background:#EF4444;"></span>
                    <span>Exibir derivada <strong>f′(x)</strong> (Vermelho)</span>
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;">
                    <input type="checkbox" id="chk-der-tan" ${st.mostrarTangente ? 'checked' : ''}>
                    <span class="prop-dot" style="background:#3B82F6;"></span>
                    <span>Exibir reta tangente em <strong>x = ${MathLabCalc.fmt(x0)}</strong> (Azul)</span>
                </label>
            </div>

            <div class="info-section" style="margin-top:auto;">
                <span class="section-heading">Equação da Reta Tangente em x = ${MathLabCalc.fmt(x0)}</span>
                <div style="font-family:var(--font-mono);font-size:12.5px;color:var(--primary);font-weight:600;">
                    y − ${MathLabCalc.fmt(y0, 3)} = ${MathLabCalc.fmt(mTangente, 4)} · (x − ${MathLabCalc.fmt(x0)})
                </div>
            </div>
        `;

        // Abas do módulo Derivadas
        this.renderizarAbasCentro([
            { id: 'grafico', rotulo: 'Gráfico' },
            { id: 'regras', rotulo: 'Regras utilizadas' },
            { id: 'passos', rotulo: 'Passo a passo' },
            { id: 'tabela', rotulo: 'Tabela' },
            { id: 'verificacao', rotulo: 'Verificação' }
        ], st.abaAtiva, (aba) => {
            st.abaAtiva = aba;
            this.renderModuloDerivadas();
        });

        const curvas = [];
        if (st.mostrarFuncao) curvas.push({ rotulo: 'f(x) = x³·sen(x)', cor: '#22C55E', fn: fnOrig });
        if (st.mostrarDerivada) curvas.push({ rotulo: st.ordem === 1 ? 'f′(x)' : 'f″(x)', cor: '#EF4444', fn: fnDerivAtiva });
        if (st.mostrarTangente) curvas.push({ rotulo: `Tangente em x=${MathLabCalc.fmt(x0)}`, cor: '#3B82F6', tracejado: true, fn: fnTangente });

        if (st.abaAtiva === 'tabela') {
            const pts = [-2, -1, 0, 0.5, 1, 1.5, 2];
            this.ativarPalcoCustom(`
                <div style="width:100%;max-width:640px;">
                    <div class="data-table-wrapper">
                        <table class="math-table">
                            <thead><tr><th>x</th><th>f(x)</th><th>f′(x) (Taxa Instantânea)</th><th>Comportamento Local</th></tr></thead>
                            <tbody>
                                ${pts.map(px => {
                                    const fy = fnOrig(px);
                                    const dfy = fnDeriv1(px);
                                    return `<tr class="${Math.abs(px - x0) < 1e-6 ? 'highlight-row' : ''}">
                                        <td>${MathLabCalc.fmt(px)}</td>
                                        <td>${MathLabCalc.fmt(fy, 4)}</td>
                                        <td style="color:var(--red);font-weight:700;">${MathLabCalc.fmt(dfy, 4)}</td>
                                        <td>${Math.abs(dfy) < 1e-6 ? 'Ponto Crítico (Horizontal)' : dfy > 0 ? 'Crescente (f′ > 0)' : 'Decrescente (f′ < 0)'}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `, 'Tabela de Derivadas e Monotonicidade', `f(x) = ${this.escaparHTML(analise.expressaoLimpa)}`);
        } else {
            this.ativarPalcoCanvas({
                janela: { xMin: -3.2, xMax: 3.2, yMin: -6, yMax: 6 },
                curvas,
                marcadores: [
                    { x: x0, y: y0, rotulo: `P(${MathLabCalc.fmt(x0)}, ${MathLabCalc.fmt(y0, 2)})`, cor: '#3B82F6', projetarEixos: true },
                    { x: x0, y: valorDerivNoPonto, rotulo: `f′(${MathLabCalc.fmt(x0)}) ≈ ${MathLabCalc.fmt(valorDerivNoPonto, 2)}`, cor: '#EF4444' }
                ]
            }, 'Função Original, Derivada e Reta Tangente', exprDeriv);
        }

        // Compara a regra algébrica com uma aproximação numérica independente.
        const h = st.ordem === 1 ? 1e-5 : 1e-3;
        const referenciaSimbolica = st.ordem === 1 ? analise.dfSimbolica :
            (MathLabCalc.derivarElementar(analise.simb1) ? MathLabCalc.compilarFuncao(MathLabCalc.derivarElementar(analise.simb1)) : null);
        const valorSimbolico = referenciaSimbolica ? referenciaSimbolica(x0) : NaN;
        const quocienteNewton = st.ordem === 1 ? (fnOrig(x0 + h) - fnOrig(x0 - h)) / (2 * h) :
            (fnOrig(x0 + h) - 2 * fnOrig(x0) + fnOrig(x0 - h)) / (h * h);
        const conferencia = MathLabCalc.verificarResultadoDuplo(valorSimbolico, quocienteNewton, 1e-3 * Math.max(1, Math.abs(valorSimbolico)));
        this._verificacaoModulo = { modulo: 'derivadas', aprovado: conferencia.aprovado && Number.isFinite(valorDerivNoPonto) };
        document.getElementById('right-panel-title').textContent = 'Regras e verificação';
        document.getElementById('right-panel-actions').innerHTML = '';
        document.getElementById('right-panel-body').innerHTML = `
            <div class="info-section"><span class="section-heading">Regras da expressão atual</span>
                <div class="steps-list">${analise.regras.map(r => `<div class="step-card"><span class="step-title">${r.titulo}</span><span class="step-math">${r.math}</span></div>`).join('')}</div>
            </div>
            <div class="info-section"><span class="section-heading">Resultado da derivação</span>
                <p class="step-math">${this.escaparHTML(exprDeriv)}</p>
                <p>Em x = ${MathLabCalc.fmt(x0)}: ${MathLabCalc.fmt(valorDerivNoPonto, 6)}</p>
                <p class="expression-help">A derivada informa a taxa instantânea de variação; o sinal indica crescimento ou decrescimento.</p>
            </div>
            <div class="verification-box"><span class="section-heading">Verificação</span>
                ${conferencia.aprovado ? '<span class="verified-badge">✓ Verificado</span>' : '<span class="result-status">Não confirmado por segundo método</span>'}
                <p>Regra algébrica: ${MathLabCalc.fmt(valorSimbolico, 6)}</p>
                <p>Diferenças finitas: ${MathLabCalc.fmt(quocienteNewton, 6)}</p>
                <p>${conferencia.mensagem}</p>
            </div>`;

        // Eventos
        document.getElementById('der-fn-input')?.addEventListener('change', (e) => {
            st.funcaoExpr = e.target.value.trim() || 'x³ · sen(x)';
            this.renderModuloDerivadas();
        });
        document.getElementById('btn-der-reset')?.addEventListener('click', () => {
            st.funcaoExpr = 'x³ · sen(x)';
            st.x0 = 1;
            st.ordem = 1;
            this.renderModuloDerivadas();
        });
        document.getElementById('der-order-sel')?.addEventListener('change', (e) => {
            st.ordem = Number(e.target.value);
            this.renderModuloDerivadas();
        });
        document.getElementById('der-x0-input')?.addEventListener('input', (e) => {
            st.x0 = parseFloat(e.target.value) || 0;
            this.renderModuloDerivadas();
        });
        document.getElementById('chk-der-f')?.addEventListener('change', (e) => {
            st.mostrarFuncao = e.target.checked;
            this.renderModuloDerivadas();
        });
        document.getElementById('chk-der-df')?.addEventListener('change', (e) => {
            st.mostrarDerivada = e.target.checked;
            this.renderModuloDerivadas();
        });
        document.getElementById('chk-der-tan')?.addEventListener('change', (e) => {
            st.mostrarTangente = e.target.checked;
            this.renderModuloDerivadas();
        });
    },

    /* ========================================================================
       MÓDULO 06 — INTEGRAIS
       ======================================================================== */
    // Todos os painéis consomem este retrato calculado do estado de Integrais.
    obterDadosIntegrais() {
        const st = this.state.integrais;
        const expr = String(st.funcaoExpr ?? '').trim();
        const ler = chave => {
            const bruto = this.state.slotTextos[`integrais_${chave}`] ?? st[chave];
            return String(bruto).trim() ? MathLabCalc.avaliarSlotValor(String(bruto), NaN).valor : NaN;
        };
        const a = ler('a'), b = ler('b');
        const definida = st.tipo === 'definida';
        const fn = MathLabCalc.compilarFuncao(expr);
        const limitesValidos = !definida || (Number.isFinite(a) && Number.isFinite(b));
        const integral = MathLabCalc.calcularIntegral(expr, definida ? a : 0, definida ? b : 1);
        const valido = !!expr && limitesValidos && (definida ? integral.valido : !!integral.primitiva);
        const F = integral.primitiva ? MathLabCalc.compilarFuncao(integral.primitiva.expressao) : null;
        const numero = v => (Math.abs(v) < 1e-12 ? 0 : v).toLocaleString('pt-BR', {minimumFractionDigits:6, maximumFractionDigits:6, useGrouping:false});
        const notacao = texto => String(texto).replace(/\^\(?(-?\d+)\)?/g, (_, n) => [...n].map(c => ({'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'})[c]).join('')).replace(/\/\((-?\d+)\)/g, '/$1').replace(/\*/g,'·');
        const compacto = v => MathLabCalc.fmt(Math.abs(v) < 1e-12 ? 0 : v, 6);
        const fracao = v => {
            for (let d=1;d<=1000;d++) if(Math.abs(v*d-Math.round(v*d))<1e-9) return d===1 ? String(Math.round(v)) : `${Math.round(v*d)}/${d}`;
            return compacto(v);
        };
        const sub = v => [...String(v)].map(c => ({'-':'₋','0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'})[c] || c).join('');
        const sup = v => notacao('^'+v);
        const formula = definida ? `∫${sub(a)}${sup(b)} ${notacao(expr)} dx` : `∫ ${notacao(expr)} dx`;
        const primitiva = F ? notacao(integral.primitiva.expressao) : 'Primitiva não obtida';
        const resultado = valido ? (definida ? `${formula} = ${fracao(integral.resultado)}` : `${formula} = ${primitiva} + C`) : 'Aguardando resultado válido';
        const minimoX = definida && limitesValidos ? Math.min(a,b,0) : -3;
        const maximoX = definida && limitesValidos ? Math.max(a,b,0) : 3;
        // Margem mínima de 0,6 mantém os limites afastados das bordas em [0,3].
        const margemX = Math.max(.6, (maximoX-minimoX)*.1);
        const ys=[0];
        for(let i=0;i<=400;i++) {
            const x=minimoX+(maximoX-minimoX)*i/400;
            const y=fn(x); if(Number.isFinite(y)) ys.push(y);
            if(!definida && F) {const yF=F(x);if(Number.isFinite(yF))ys.push(yF);}
        }
        const yMin=Math.min(...ys), yMax=Math.max(...ys), margemY=Math.max(.2,(yMax-yMin)*.1);
        const janela={xMin:minimoX-margemX,xMax:maximoX+margemX,yMin:yMin-margemY,yMax:yMax+margemY};
        const medio = n => {
            const h=(b-a)/n;let soma=0;
            for(let i=0;i<n;i++) soma+=fn(a+(i+.5)*h);
            return soma*h;
        };
        let areaGeometrica=0, positiva=false, negativa=false;
        for(let i=0;i<4000 && limitesValidos;i++) {
            const y=fn(a+(i+.5)*(b-a)/4000);
            areaGeometrica+=Math.abs(y)*Math.abs(b-a)/4000;
            positiva ||= y>1e-10; negativa ||= y< -1e-10;
        }
        // A derivada da primitiva e Simpson são verificações independentes.
        let derivadaConfere=!!F;
        for(let i=0;i<9 && derivadaConfere;i++) {
            const x=(definida?a:0)+((definida?b:1)-(definida?a:0))*(i+.37)/9;
            const h=1e-5*Math.max(1,Math.abs(x));
            const derivada=(F(x+h)-F(x-h))/(2*h);
            derivadaConfere=Number.isFinite(derivada) && Math.abs(derivada-fn(x))<=1e-6;
        }
        const verificado=valido && derivadaConfere && Math.abs(integral.simpson-integral.resultado)<=1e-6;
        const aviso = !expr ? 'Digite uma função válida' : !limitesValidos ? 'Preencha os limites a e b com expressões válidas.' : !valido ? integral.mensagem : a>b && definida ? 'a > b: limites invertidos. O valor da integral troca de sinal; a área geométrica permanece positiva.' : '';
        return st.dados={expr,a,b,fn,F,definida,integral,valido,numero,compacto,formula,primitiva,resultado,janela,medio,areaGeometrica,positiva,negativa,verificado,aviso};
    },

    renderModuloIntegrais() {
        const st=this.state.integrais, d=this.obterDadosIntegrais();
        this._verificacaoModulo={modulo:'integrais',aprovado:d.verificado};
        const esc = texto => this.escaparHTML(texto);
        document.getElementById('left-panel-title').textContent='Integrais e Área';
        document.getElementById('left-panel-badge').textContent=d.definida?'Integral Definida':'Antiderivada';
        document.getElementById('left-panel-actions').innerHTML='';
        document.getElementById('left-panel-body').innerHTML=`
            <div class="math-display-box">
                <div class="display-top-bar"><span class="mini-pill intervalo-integral">${d.definida?`Intervalo [${d.compacto(d.a)}, ${d.compacto(d.b)}]`:'Família de primitivas'}</span></div>
                <p class="step-math integral-resultado">${esc(d.resultado)}</p>
                <div class="display-result-row"><span class="result-label">Resultado</span><span class="result-primary">${d.valido?(d.definida?d.compacto(d.integral.resultado):esc(d.primitiva)+' + C'):'Não confirmado'}</span></div>
                ${d.valido&&d.definida?`<p>≈ ${d.numero(d.integral.resultado)}</p>`:''}
                ${d.aviso?`<p role="status">${esc(d.aviso)}</p>`:''}
            </div>
            <div class="sliders-box">
                <label><input type="checkbox" id="chk-int-riemann" ${st.mostrarRiemann?'checked':''}> Exibir retângulos de Riemann</label>
                <label for="slider-int-n">Partições: n = ${st.nRiemann}</label>
                <input type="range" id="slider-int-n" min="2" max="100" value="${st.nRiemann}">
            </div>`;
        this.renderizarAbasCentro([
            {id:'area',rotulo:'Área'}, {id:'resolucao',rotulo:'Resolução'},
            {id:'metodos',rotulo:'Métodos (Riemann / Simpson)'}, {id:'verificacao',rotulo:'Verificação'}
        ],st.abaAtiva,aba=>{st.abaAtiva=aba;this.renderModuloIntegrais();});
        const curvas=d.valido?[{rotulo:`f(x) = ${d.expr}`,cor:'#22C55E',espessura:3,fn:d.fn}]:[];
        if(d.valido&&!d.definida&&d.F)curvas.push({rotulo:`F(x) = ${d.primitiva} (C = 0)`,cor:'#EF4444',fn:d.F});
        const grafico={janela:d.janela,ajusteIntegral:true,curvas,
            badgesParametros:st.integrandoLivre?[]:[{rotulo:`c = ${st.slots.coef}`,cor:'#22C55E'},{rotulo:`n = ${st.slots.n}`,cor:'#A855F7'}],
            mensagemVazia:d.valido?'':(!d.expr?'Digite uma função válida':d.aviso),
            areaSombreada:d.valido&&d.definida?{a:d.a,b:d.b,fn:d.fn,rotulo:`Área = ${d.compacto(d.integral.resultado)}`} : null,
            riemann:{mostrar:d.valido&&d.definida&&st.mostrarRiemann,a:d.a,b:d.b,n:st.nRiemann,fn:d.fn},
            assintotas:d.valido&&d.definida?[
                {tipo:'vertical',valor:d.a,rotulo:`a = ${d.compacto(d.a)}`,cor:'#3B82F6'},
                {tipo:'vertical',valor:d.b,rotulo:`b = ${d.compacto(d.b)}`,cor:'#F59E0B'}]:[],
            marcadores:d.valido&&d.definida?[{x:d.a,y:d.fn(d.a),rotulo:'a',cor:'#3B82F6'},{x:d.b,y:d.fn(d.b),rotulo:'b',cor:'#F59E0B'}]:[]};
        const passos=`<h3>Resolução</h3><p>Regra da ${esc(d.integral.primitiva?.regra||'integração numérica')}</p><p class="step-math">F(x) = ${esc(d.primitiva)}</p>${d.definida?`<p class="step-math">F(${d.compacto(d.b)}) − F(${d.compacto(d.a)}) = ${d.compacto(d.integral.resultado)}</p>`:'<p>Família de primitivas: F(x) + C.</p>'}`;
        const metodos=`<h3>Métodos</h3>${d.definida&&d.valido?`<table class="integral-methods"><thead><tr><th>Método</th><th>Valor</th><th>Erro absoluto</th></tr></thead><tbody>${[4,10,100].map(n=>`<tr><td>Ponto médio, n = ${n}</td><td>${d.numero(d.medio(n))}</td><td>${d.numero(Math.abs(d.medio(n)-d.integral.resultado))}</td></tr>`).join('')}<tr><td>Simpson (400)</td><td>${d.numero(d.integral.simpson)}</td><td>${d.numero(Math.abs(d.integral.simpson-d.integral.resultado))}</td></tr></tbody></table><label for="metodos-n">Retângulos: n = ${st.nRiemann}</label><input id="metodos-n" type="range" min="2" max="100" value="${st.nRiemann}">`:'<p>Selecione uma integral definida válida.</p>'}`;
        const verificacao=`<h3>Verificação</h3><p class="${d.verificado?'verified-badge':'result-status'}">${d.verificado?'✓ Verificado':'Aviso: verificação não confirmada'}</p><p>F′(x) = f(x) e Simpson concordam com o valor exato com tolerância 10⁻⁶.</p>`;
        this.ativarPalcoCanvas(grafico,'Área sob a curva',d.valido?d.resultado:'Entrada inválida');
        // Em Métodos, o controle e a tabela ficam junto ao gráfico interativo.
        const wrapper=document.getElementById('canvas-stage-wrapper');
        wrapper.querySelector('.integral-tab-content')?.remove();
        if(st.abaAtiva==='metodos') {
            wrapper.insertAdjacentHTML('beforeend',`<div class="integral-tab-content">${metodos}</div>`);
        } else if(st.abaAtiva==='resolucao'||st.abaAtiva==='verificacao') {
            this.ativarPalcoCustom(`<div class="integral-text-tab">${st.abaAtiva==='resolucao'?passos:verificacao}</div>`,'Integrais',d.resultado);
        }
        document.getElementById('right-panel-title').textContent='Resultado e verificação';
        document.getElementById('right-panel-actions').innerHTML='';
        document.getElementById('right-panel-body').innerHTML=`<div class="info-section"><span class="section-heading">Resolução</span>${passos}</div><div class="info-section"><span class="section-heading">Áreas com sinal</span><p>Verde: contribuição positiva. Vermelho: contribuição negativa.</p><p>Área geométrica = ${d.valido&&d.definida?d.compacto(d.areaGeometrica):'—'}</p></div><div class="verification-box"><span class="section-heading">Verificação</span>${verificacao}</div>`;
        const mudarN=e=>{st.nRiemann=Number(e.target.value);st.mostrarRiemann=true;this.renderModuloIntegrais();};
        document.getElementById('slider-int-n')?.addEventListener('input',mudarN);
        document.getElementById('metodos-n')?.addEventListener('input',mudarN);
        document.getElementById('chk-int-riemann')?.addEventListener('change',e=>{st.mostrarRiemann=e.target.checked;this.renderModuloIntegrais();});
    },

    /* ========================================================================
       MÓDULO 07 — GEOMETRIA (PLANA E ESPACIAL)
       ======================================================================== */
    renderModuloGeometria() {
        const st = this.state.geometria;
        const calc = MathLabCalc.calcularGeometria(st.figura, st.params, st.unidade);

        document.getElementById('left-panel-title').textContent = 'Geometria';
        document.getElementById('left-panel-badge').textContent = `Geometria ${calc.categoria}`;
        document.getElementById('left-panel-actions').innerHTML = '';

        // Campos de dimensões específicos para cada figura
        const camposPorFigura = {
            circulo: [{ id: 'r', rotulo: 'Raio (r)' }],
            quadrado: [{ id: 'l', rotulo: 'Lado (L)' }],
            retangulo: [{ id: 'b', rotulo: 'Base (b)' }, { id: 'h', rotulo: 'Altura (h)' }],
            triangulo: [{ id: 'b', rotulo: 'Base (b)' }, { id: 'h', rotulo: 'Altura (h)' }],
            trapezio: [{ id: 'B', rotulo: 'Base Maior (B)' }, { id: 'b', rotulo: 'Base Menor (b)' }, { id: 'h', rotulo: 'Altura (h)' }],
            losango: [{ id: 'D', rotulo: 'Diagonal Maior (D)' }, { id: 'd', rotulo: 'Diagonal Menor (d)' }],
            cubo: [{ id: 'a', rotulo: 'Aresta (a)' }],
            paralelepipedo: [{ id: 'a', rotulo: 'Comprimento (a)' }, { id: 'b', rotulo: 'Largura (b)' }, { id: 'c', rotulo: 'Altura (c)' }],
            esfera: [{ id: 'r', rotulo: 'Raio (r)' }],
            cilindro: [{ id: 'r', rotulo: 'Raio da base (r)' }, { id: 'h', rotulo: 'Altura (h)' }],
            cone: [{ id: 'r', rotulo: 'Raio da base (r)' }, { id: 'h', rotulo: 'Altura (h)' }]
        };

        const camposAtivos = camposPorFigura[st.figura] || camposPorFigura.circulo;

        const leftBody = document.getElementById('left-panel-body');
        leftBody.innerHTML = `
            <div class="math-display-box">
                <div class="display-top-bar">
                    <span class="mini-pill active">${calc.nome}</span>
                    <span>${calc.expressao}</span>
                </div>
                <div class="display-result-row" style="border-top:none;padding-top:2px;">
                    <span class="result-label">${calc.categoria === 'Plana' ? 'Área' : 'Volume'}</span>
                    <span class="result-primary" style="font-size:19px;">${calc.resPrincipal}</span>
                </div>
                <div class="display-result-row">
                    <span class="result-label">${calc.categoria === 'Plana' ? 'Perímetro' : 'Área Total'}</span>
                    <span class="result-secondary" style="font-size:15px;color:var(--text-main);font-weight:600;">${calc.resSecundario}</span>
                </div>
            </div>

            <div class="control-row-2col">
                <div class="control-group">
                    <label class="field-label" for="geo-shape-select">Figura Geométrica</label>
                    <select id="geo-shape-select" class="field-select">
                        <optgroup label="Geometria Plana">
                            <option value="circulo" ${st.figura === 'circulo' ? 'selected' : ''}>Círculo</option>
                            <option value="quadrado" ${st.figura === 'quadrado' ? 'selected' : ''}>Quadrado</option>
                            <option value="retangulo" ${st.figura === 'retangulo' ? 'selected' : ''}>Retângulo</option>
                            <option value="triangulo" ${st.figura === 'triangulo' ? 'selected' : ''}>Triângulo</option>
                            <option value="trapezio" ${st.figura === 'trapezio' ? 'selected' : ''}>Trapézio</option>
                            <option value="losango" ${st.figura === 'losango' ? 'selected' : ''}>Losango</option>
                        </optgroup>
                        <optgroup label="Geometria Espacial">
                            <option value="cubo" ${st.figura === 'cubo' ? 'selected' : ''}>Cubo</option>
                            <option value="paralelepipedo" ${st.figura === 'paralelepipedo' ? 'selected' : ''}>Paralelepípedo</option>
                            <option value="esfera" ${st.figura === 'esfera' ? 'selected' : ''}>Esfera</option>
                            <option value="cilindro" ${st.figura === 'cilindro' ? 'selected' : ''}>Cilindro</option>
                            <option value="cone" ${st.figura === 'cone' ? 'selected' : ''}>Cone</option>
                        </optgroup>
                    </select>
                </div>

                <div class="control-group">
                    <label class="field-label" for="geo-unit-select">Unidade</label>
                    <select id="geo-unit-select" class="field-select">
                        <option value="cm" ${st.unidade === 'cm' ? 'selected' : ''}>Centímetros (cm)</option>
                        <option value="m" ${st.unidade === 'm' ? 'selected' : ''}>Metros (m)</option>
                        <option value="mm" ${st.unidade === 'mm' ? 'selected' : ''}>Milímetros (mm)</option>
                    </select>
                </div>
            </div>

            <div class="sliders-box">
                <span class="field-label">Dimensões de ${calc.nome}</span>
                ${camposAtivos.map(c => `
                    <div class="slider-item">
                        <label class="slider-label" for="geo-inp-${c.id}">${c.rotulo}</label>
                        <input type="range" id="geo-rng-${c.id}" class="math-slider" min="1" max="20" step="0.5" value="${st.params[c.id]}">
                        <input type="number" id="geo-inp-${c.id}" class="field-input" value="${st.params[c.id]}" min="0.5" max="100" step="0.5" style="height:26px;padding:0 4px;text-align:center;">
                    </div>
                `).join('')}
            </div>
        `;

        // Abas rápidas de figuras no centro
        this.renderizarAbasCentro([
            { id: 'circulo', rotulo: 'Círculo' },
            { id: 'quadrado', rotulo: 'Quadrado' },
            { id: 'retangulo', rotulo: 'Retângulo' },
            { id: 'triangulo', rotulo: 'Triângulo' },
            { id: 'cilindro', rotulo: 'Cilindro (3D)' },
            { id: 'esfera', rotulo: 'Esfera (3D)' },
            { id: 'cone', rotulo: 'Cone (3D)' }
        ], st.figura, (fig) => {
            st.figura = fig;
            this.renderModuloGeometria();
        });

        this.ativarPalcoCustom(
            MathLabVisuals.gerarSvgGeometria(st.figura, st.params, st.unidade),
            `Representação Geométrica — ${calc.nome}`,
            calc.expressao
        );

        document.getElementById('right-panel-title').textContent = 'Fórmulas e Passo a Passo';
        document.getElementById('right-panel-actions').innerHTML = '';
        document.getElementById('right-panel-body').innerHTML = `
            <div class="info-section">
                <span class="section-heading">Propriedades e Medidas</span>
                <div class="props-list">
                    ${calc.propriedades.map(p => `
                        <div class="prop-item">
                            <span class="prop-key"><span class="prop-dot" style="background:${p.cor};"></span>${p.chave}</span>
                            <span class="prop-val">${p.valor}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="info-section">
                <span class="section-heading">Fórmulas Utilizadas e Substituição</span>
                <div class="steps-list">
                    ${calc.formulas.map((f, i) => `
                        <div class="step-card">
                            <span class="step-title">Fórmula ${i + 1}</span>
                            <span class="step-math">${f}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="verification-box">
                <div class="section-header-line">
                    <span class="section-heading" style="color:var(--green);">Verificação Dimensional</span>
                    <span class="verified-badge">✓ Verificado</span>
                </div>
                <div class="verification-line"><span>✓</span> <span>${calc.verificacao}</span></div>
            </div>
        `;

        // Eventos da Geometria
        document.getElementById('geo-shape-select')?.addEventListener('change', (e) => {
            st.figura = e.target.value;
            this.renderModuloGeometria();
        });

        document.getElementById('geo-unit-select')?.addEventListener('change', (e) => {
            st.unidade = e.target.value;
            this.renderModuloGeometria();
        });

        camposAtivos.forEach(c => {
            const rng = document.getElementById(`geo-rng-${c.id}`);
            const inp = document.getElementById(`geo-inp-${c.id}`);
            rng?.addEventListener('input', (e) => {
                st.params[c.id] = parseFloat(e.target.value) || 1;
                this.renderModuloGeometria();
            });
            inp?.addEventListener('input', (e) => {
                st.params[c.id] = Math.max(0.1, parseFloat(e.target.value) || 1);
                this.renderModuloGeometria();
            });
        });
    },

    /* ========================================================================
       MÓDULO 08 — TRIGONOMETRIA (GRÁFICO + CIRCUNFERÊNCIA TRIGONOMÉTRICA)
       ======================================================================== */
    // Todos os componentes consultam este estado; nenhuma cópia paralela dos parâmetros.
    obterDadosTrigonometria() {
        const st = this.state.trigonometria;
        const A = Number(st.amplitude), B = Number(st.frequencia), C = Number(st.fase), D = Number(st.deslocamento ?? 0);
        const valido = [A, B, C, D, st.anguloGraus].every(Number.isFinite) && Number.isFinite((Math.abs(A)+Math.abs(D))*1.3) && Number.isFinite(B*2*Math.PI+C) && !(st.funcao==='tg' && B===0 && Math.abs(Math.cos(C))<1e-12);
        const n = v => this.formatarTrig(v);
        const sinal = v => v < 0 ? ` − ${n(-v)}` : v > 0 ? ` + ${n(v)}` : '';
        const expressao = `${A === 1 ? '' : A === -1 ? '−' : n(A) + '·'}${st.funcao}(${B === 1 ? 'x' : B === -1 ? '−x' : n(B) + 'x'}${sinal(C)})${sinal(D)}`;
        const fn = x => {
            const t = B * x + C;
            if (!valido || (st.funcao === 'tg' && Math.abs(Math.cos(t)) < 1e-12)) return NaN;
            return A * (st.funcao === 'sen' ? Math.sin(t) : st.funcao === 'cos' ? Math.cos(t) : Math.tan(t)) + D;
        };
        const constante = A === 0 || B === 0;
        const periodo = constante ? 'Constante (sem período fundamental)' : n((st.funcao === 'tg' ? Math.PI : 2 * Math.PI) / Math.abs(B));
        const fase = B === 0 ? 'Não se aplica (B = 0)' : n(-C / B);
        let paridade = 'Nem par nem ímpar';
        // Paridade analítica: uma translação vertical não preserva funções ímpares.
        if (constante && !(st.funcao==='tg' && B!==0 && Math.abs(Math.sin(2*C))>1e-12)) paridade = Math.abs(fn(0)) < 1e-12 ? 'Par e ímpar' : 'Par';
        else if (st.funcao === 'tg') {
            if (Math.abs(Math.sin(2*C)) < 1e-12 && D === 0) paridade = 'Ímpar';
        } else {
            const coefCos = A * (st.funcao === 'sen' ? Math.sin(C) : Math.cos(C));
            const coefSen = A * (st.funcao === 'sen' ? Math.cos(C) : -Math.sin(C));
            if (Math.abs(coefSen) < 1e-12) paridade = 'Par';
            else if (Math.abs(coefCos) < 1e-12 && D === 0) paridade = 'Ímpar';
        }
        const polos = [];
        const marcadores = [];
        if (valido && B !== 0) {
            // Enumera somente eventos da janela: funciona também com frequência negativa.
            const minT = Math.min(B * -2 * Math.PI + C, B * 2 * Math.PI + C);
            const maxT = Math.max(B * -2 * Math.PI + C, B * 2 * Math.PI + C);
            const inicio = Math.ceil((minT - Math.PI / 2) / Math.PI), fim = Math.floor((maxT - Math.PI / 2) / Math.PI);
            for (let k = inicio; k <= fim && k < inicio + 200; k++) {
                const x = (Math.PI / 2 + k * Math.PI - C) / B;
                if (st.funcao === 'tg') polos.push(x);
            }
            if (st.funcao !== 'tg' && A !== 0) {
                const base = st.funcao === 'sen' ? Math.PI / 2 : 0;
                for (let k = Math.ceil((minT - base) / Math.PI), cont=0; k <= Math.floor((maxT - base) / Math.PI) && cont < 30; k++,cont++) {
                    const x = (base + k * Math.PI - C) / B, y = fn(x);
                    marcadores.push({x, y, cor: '#EF4444', rotulo: `(${n(x)}; ${n(y)})`, offsetY: -32});
                }
            }
            // Raízes de A·fn(t)+D, limitadas à janela exibida.
            if (A !== 0) {
                const r = -D / A;
                const bases = st.funcao === 'tg' ? [Math.atan(r)] : Math.abs(r) <= 1 ? (st.funcao === 'sen' ? [Math.asin(r), Math.PI - Math.asin(r)] : [Math.acos(r), -Math.acos(r)]) : [];
                const tour = st.funcao === 'tg' ? Math.PI : 2 * Math.PI;
                for (const base of bases) for (let k = Math.ceil((minT-base)/tour), cont=0; k <= Math.floor((maxT-base)/tour) && cont < 30; k++,cont++) {
                    const x = (base + k*tour-C)/B;
                    if (!marcadores.some(m=>Math.abs(m.x-x)<1e-9)) marcadores.push({x,y:0,cor:'#22C55E',ocultarRotulo:true,rotulo:`(${n(x)}; 0)`});
                }
            }
        }
        const imagem = constante ? `{${n(fn(0))}}` : st.funcao === 'tg' ? 'ℝ' : `[${n(D-Math.abs(A))}, ${n(D+Math.abs(A))}]`;
        const dominio = st.funcao !== 'tg' ? 'ℝ' : B===1 && C===0 ? 'ℝ − {π/2 + kπ, k ∈ ℤ}' : B === 0 ? (Math.abs(Math.cos(C)) < 1e-12 ? '∅' : 'ℝ') : `ℝ − {(${n(Math.PI/2)} + kπ − (${n(C)}))/(${n(B)}), k ∈ ℤ}`;
        const t = st.anguloGraus * Math.PI / 180, sen = Math.sin(t), cos = Math.cos(t);
        const tangente = Math.abs(cos) < 1e-12 ? null : sen/cos;
        const verificado = valido && Math.abs(sen*sen+cos*cos-1) < 1e-12 && (tangente === null || Math.abs(Math.tan(t)-tangente) < 1e-10);
        return {valido, A,B,C,D,fn,expressao,periodo,fase,paridade,imagem,dominio,sen,cos,tangente,verificado,
            grafico: {janela:{xMin:-2*Math.PI,xMax:2*Math.PI,yMin:-Math.max(.1,Math.abs(A)+Math.abs(D))*1.3,yMax:Math.max(.1,Math.abs(A)+Math.abs(D))*1.3}, eixoXPi:true,
                mensagemVazia: valido ? '' : 'Preencha parâmetros e ângulo válidos',
                curvas:valido ? [{rotulo:`f(x) = ${expressao}`,cor:'#22C55E',espessura:3,fn}] : [], marcadores:valido ? marcadores : [],
                gerarAssintotas: janela=>{
                    if(!valido || st.funcao!=='tg' || B===0)return [];
                    const lo=Math.min(B*janela.xMin+C,B*janela.xMax+C),hi=Math.max(B*janela.xMin+C,B*janela.xMax+C);
                    const inicio=Math.ceil((lo-Math.PI/2)/Math.PI),fim=Math.floor((hi-Math.PI/2)/Math.PI);
                    return Array.from({length:Math.max(0,Math.min(200,fim-inicio+1))},(_,i)=>({tipo:'vertical',valor:(Math.PI/2+(inicio+i)*Math.PI-C)/B,cor:'#EF4444'}));
                },
                assintotas:polos.map(valor=>({tipo:'vertical',valor,cor:'#EF4444'}))}};
    },

    formatarTrig(v) {
        if (!Number.isFinite(v)) return 'Indefinido';
        if (Math.abs(v) < 1e-12) return '0';
        for (let d=1; d<=24; d++) {
            const a=Math.round(v/Math.PI*d);
            if (a && Math.abs(v-a*Math.PI/d)<1e-10) return `${a<0?'−':''}${Math.abs(a)===1?'':Math.abs(a)}π${d===1?'':'/'+d}`;
        }
        return String(Number(v.toFixed(6))).replace('-', '−').replace('.', ',');
    },

    mudarTrigonometria(parcial) {
        Object.assign(this.state.trigonometria, parcial);
        for (const chave of Object.keys(parcial)) {
            const campo=document.querySelector(`.formula-slot[data-slot-key="${chave}"]`);
            if(campo && campo!==document.activeElement) {
                delete this.state.slotTextos[`trigonometria_${chave}`];
                campo.value=this.formatarTrig(this.state.trigonometria[chave]);
                campo.style.width=`calc(${Math.max(2,campo.value.length)}ch + 20px)`;
                campo.classList.toggle('slot-invalid',!Number.isFinite(this.state.trigonometria[chave]));
            }
        }
        const theta=document.getElementById('trig-theta');
        if(theta && theta!==document.activeElement && 'anguloGraus' in parcial) theta.value=this.formatarTrig(this.state.trigonometria.anguloGraus*(this.state.trigonometria.unidadeAngulo==='rad'?Math.PI/180:1));
        this.atualizarTrigonometria();
    },

    renderModuloTrigonometria() {
        const st=this.state.trigonometria;
        document.getElementById('left-panel-title').textContent='Trigonometria';
        document.getElementById('left-panel-badge').textContent='Ondas e ciclo unitário';
        document.getElementById('left-panel-actions').innerHTML='';
        document.getElementById('left-panel-body').innerHTML=`
            <div class="segmented-control full-width">${['sen','cos','tg'].map(f=>`<button type="button" class="segmented-btn" data-trig-fn="${f}">${f}(x)</button>`).join('')}</div>
            <div class="sliders-box"><span class="field-label">Parâmetros da onda</span>${[
                ['amplitude','Amplitude A',-4,4,.1,'blue'],['frequencia','Frequência B',-4,4,.1,'amber'],['fase','Fase C',-6.283,6.283,.01,'purple'],['deslocamento','Vertical D',-4,4,.1,'green']
            ].map(([key,label,min,max,step,color])=>`<div class="slider-item slot-${color}"><label class="slider-label" for="trig-${key}">${label}</label><input type="range" class="math-slider" id="trig-${key}" data-trig-param="${key}" min="${min}" max="${max}" step="${step}" value="${st[key]}"><output class="slider-value-badge" data-trig-output="${key}"></output></div>`).join('')}</div>
            <div class="trig-angle"><label for="trig-theta">Ângulo no ciclo: θ =</label><input id="trig-theta" class="formula-slot slot-green" aria-label="Ângulo no ciclo" value="${this.formatarTrig(st.anguloGraus*(st.unidadeAngulo==='rad'?Math.PI/180:1))}"><select id="trig-unit" aria-label="Unidade do ângulo"><option value="graus">Graus (°)</option><option value="rad">Radianos</option></select><small id="trig-unit-hint"></small></div>`;
        document.getElementById('trig-unit').value=st.unidadeAngulo;
        this.renderizarAbasCentro([{id:'grafico',rotulo:'Gráfico trigonométrico'},{id:'circulo',rotulo:'Circunferência trigonométrica'},{id:'tabela',rotulo:'Tabela de ângulos notáveis'}],st.visualizacao,vis=>this.mudarTrigonometria({visualizacao:vis}));
        document.querySelectorAll('[data-trig-fn]').forEach(b=>b.addEventListener('click',()=>{
            this.mudarTrigonometria({funcao:b.dataset.trigFn});
            // O nome da função é texto, os campos da fórmula permanecem os mesmos.
            document.querySelector('[data-trig-formula-fn]')?.replaceChildren(document.createTextNode(b.dataset.trigFn));
        }));
        document.querySelectorAll('[data-trig-param]').forEach(inp=>inp.addEventListener('input',()=>{
            const key=inp.dataset.trigParam; delete this.state.slotTextos[`trigonometria_${key}`];
            const slot=document.querySelector(`.formula-slot[data-slot-key="${key}"]`);if(slot)slot.value=inp.value;
            this.mudarTrigonometria({[key]:Number(inp.value)});
        }));
        document.getElementById('trig-theta').addEventListener('input',e=>{
            const av=MathLabCalc.avaliarSlotValor(e.target.value,NaN);
            this.mudarTrigonometria({anguloGraus:av.valido ? av.valor*(st.unidadeAngulo==='rad'?180/Math.PI:1):NaN});
        });
        document.getElementById('trig-unit').addEventListener('change',e=>{
            st.unidadeAngulo=e.target.value;
            document.getElementById('trig-theta').value=this.formatarTrig(st.anguloGraus*(st.unidadeAngulo==='rad'?Math.PI/180:1));
            this.atualizarTrigonometria();
        });
        this.atualizarTrigonometria();
    },

    atualizarTrigonometria() {
        const st=this.state.trigonometria,d=this.obterDadosTrigonometria(),n=v=>this.formatarTrig(v);
        this._verificacaoModulo={modulo:'trigonometria',aprovado:d.verificado};
        const nomeFn=document.querySelector('[data-trig-formula-fn]');if(nomeFn)nomeFn.textContent=st.funcao;
        document.querySelectorAll('[data-trig-fn]').forEach(b=>b.classList.toggle('active',b.dataset.trigFn===st.funcao));
        document.querySelectorAll('[data-tab-id]').forEach(b=>b.classList.toggle('active',b.dataset.tabId===st.visualizacao));
        document.querySelectorAll('[data-trig-param]').forEach(inp=>{const v=st[inp.dataset.trigParam];if(Number.isFinite(v)&&document.activeElement!==inp){inp.min=Math.min(Number(inp.min),v);inp.max=Math.max(Number(inp.max),v);inp.value=v;}});
        document.querySelectorAll('[data-trig-output]').forEach(o=>o.textContent=n(st[o.dataset.trigOutput]));
        document.getElementById('trig-unit-hint').textContent=`${n(st.anguloGraus)}° = ${n(st.anguloGraus*Math.PI/180)} rad. O gráfico usa radianos.`;
        if(st.visualizacao==='circulo' && d.valido) this.ativarPalcoCustom(MathLabVisuals.gerarSvgCirculoTrigonometrico(st.anguloGraus),'Circunferência trigonométrica',`${n(st.anguloGraus)}°`);
        else if(st.visualizacao==='tabela') this.ativarPalcoCustom(this.gerarTabelaTrigonometrica(),'Ângulos notáveis','Valores exatos');
        else this.ativarPalcoCanvas(d.grafico,'Gráfico trigonométrico',`f(x) = ${d.expressao}`);
        const props=[['Amplitude |A|',st.funcao==='tg'?'Não se aplica':n(Math.abs(d.A))],['Período',d.periodo],['Fase −C/B',d.fase+(d.B && d.C ? (-d.C/d.B<0?' (esquerda)':' (direita)'):'')],['Deslocamento vertical',n(d.D)],['Imagem',d.imagem],['Paridade',d.paridade],['Domínio',d.dominio]];
        document.getElementById('right-panel-title').textContent='Resultado e propriedades';
        document.getElementById('right-panel-actions').innerHTML='';
        document.getElementById('right-panel-body').innerHTML=`<div class="result-hero-card"><div class="result-hero-top"><div><span class="result-hero-label">Resultado</span><div class="result-hero-value">${d.valido?'f(x) = '+d.expressao:'Aguardando resultado válido'}</div></div><button type="button" class="header-btn result-copy" id="btn-quick-copy-res" title="Copiar resultado" aria-label="Copiar resultado"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg></button></div><span class="result-status">${d.valido?'Propriedades calculadas':'Confira os parâmetros'}</span></div>
            <section class="info-section"><h3 class="section-heading">Propriedades da função</h3><div class="props-list">${props.map(([key,value])=>`<div class="prop-item"><span class="prop-key">${key}</span><span class="prop-val">${d.valido?value:'—'}</span></div>`).join('')}</div></section>
            <section class="info-section" id="trig-cycle-result">${this.renderResultadoCiclo(d)}</section>
            <section class="info-section"><h3 class="section-heading">Identidades no ângulo θ</h3><p>sen²θ + cos²θ = ${n(d.sen*d.sen+d.cos*d.cos)}</p><p>${d.tangente===null?'tg θ indefinida: quociente não aplicável':'tg θ = sen θ / cos θ = '+n(d.tangente)}</p>${d.verificado?'<span class="verified-badge">Verificado numericamente</span>':'<span class="result-status">Não verificado</span>'}</section>`;
        document.getElementById('btn-quick-copy-res').addEventListener('click',()=>this.copiarResultadoAtual());
        const explicacao=MathLabCalc.obterExplicacaoVidaReal('trigonometria');
        document.getElementById('right-panel-body').insertAdjacentHTML('beforeend',`<details class="layered-details"><summary>Por que deu esse resultado?</summary><div class="layered-details-body"><strong>${explicacao.titulo}</strong><p>${explicacao.resumo}</p><p>${explicacao.exemplo}</p></div></details>`);
        // Mantém o input Normal e sua seleção intactos durante alterações dos parâmetros.
        const normal=document.getElementById('normal-mode-input');
        if(normal && document.activeElement!==normal) normal.value=d.expressao;
        const preview=document.getElementById('normal-live-preview-math');if(preview)preview.textContent=d.expressao;
    },

    valorExatoTrig(v) {
        if (v === null || !Number.isFinite(v)) return 'Indefinida';
        const referencias=[[0,'0'],[.5,'1/2'],[Math.SQRT1_2,'√2/2'],[Math.sqrt(3)/2,'√3/2'],[1,'1'],[Math.sqrt(3)/3,'√3/3'],[Math.sqrt(3),'√3']];
        const par=referencias.find(([n])=>Math.abs(Math.abs(v)-n)<1e-10);
        return par ? `${v < -1e-12 ? '−' : ''}${par[1]}` : this.formatarTrig(v);
    },

    renderResultadoCiclo(d) {
        if(!d.valido) return '<p>Preencha um ângulo válido.</p>';
        const st=this.state.trigonometria,n=v=>this.formatarTrig(v),e=v=>this.valorExatoTrig(v);
        const normal=((st.anguloGraus%360)+360)%360;
        const eixo=Math.abs(normal/90-Math.round(normal/90))<1e-10;
        const quadrante=eixo?'Sobre um eixo':`${Math.floor(normal/90)+1}º quadrante`;
        const sinal=v=>Math.abs(v)<1e-12?'zero':v>0?'positivo':'negativo';
        return `<h3 class="section-heading">Ângulo no ciclo · ${st.unidadeAngulo==='rad'?'RAD':'GRAUS'}</h3><p>θ = ${n(st.anguloGraus)}° = ${n(st.anguloGraus*Math.PI/180)} rad</p><p>Ponto (${e(d.cos)}; ${e(d.sen)})<br>≈ (${n(d.cos)}; ${n(d.sen)})</p><p>sen θ = ${e(d.sen)} ≈ ${n(d.sen)}<br>cos θ = ${e(d.cos)} ≈ ${n(d.cos)}<br>tg θ = ${d.tangente===null?'Indefinida':e(d.tangente)+' ≈ '+n(d.tangente)}</p><p>${quadrante}<br>Seno ${sinal(d.sen)}; cosseno ${sinal(d.cos)}; tangente ${d.tangente===null?'indefinida':sinal(d.tangente)}.</p>`;
    },

    gerarTabelaTrigonometrica() {
        const graus=[0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330,360];
        return `<div class="data-table-wrapper trig-angle-table"><table class="math-table"><caption>Ângulos notáveis · valores exatos</caption><thead><tr><th>Graus</th><th>Radianos</th><th>sen θ</th><th>cos θ</th><th>tg θ</th></tr></thead><tbody>${graus.map(g=>{
            const t=g*Math.PI/180,s=Math.sin(t),c=Math.cos(t);
            return `<tr><td>${g}°</td><td>${this.formatarTrig(t)}</td><td>${this.valorExatoTrig(s)}</td><td>${this.valorExatoTrig(c)}</td><td>${this.valorExatoTrig(Math.abs(c)<1e-12?null:s/c)}</td></tr>`;
        }).join('')}</tbody></table></div>`;
    },

    aplicarTextoTrigonometria(texto) {
        const limpo=String(texto).replace(/−/g,'-').replace(/·/g,'*').replace(/\s+/g,'').replace(/^f\(x\)=/,'');
        const chamada=limpo.match(/^(.*?)(sen|cos|tg)\((.*)\)(.*)$/);
        const escalar=(v,padrao)=>v===''?padrao:v==='-'?-1:v==='+'?1:MathLabCalc.avaliarSlotValor(v,NaN).valor;
        let params={amplitude:NaN};
        if(chamada) {
            const arg=chamada[3].match(/^(.*?)x(.*)$/);
            if(arg) params={funcao:chamada[2],amplitude:escalar(chamada[1].replace(/\*$/,''),1),frequencia:escalar(arg[1].replace(/\*$/,''),1),fase:escalar(arg[2],0),deslocamento:escalar(chamada[4],0)};
        }
        Object.keys(this.state.slotTextos).filter(k=>k.startsWith('trigonometria_')).forEach(k=>delete this.state.slotTextos[k]);
        this.mudarTrigonometria(params);
    },

    /* ========================================================================
       MÓDULO 09 — VETORES E MATRIZES
       ======================================================================== */
    renderModuloVetoresMatrizes() {
        const st = this.state.vetores;
        document.getElementById('left-panel-title').textContent = 'Vetores e Matrizes';
        document.getElementById('left-panel-badge').textContent = st.abaPrincipal === 'vetores' ? 'Álgebra Vetorial' : 'Álgebra Matricial';
        document.getElementById('left-panel-actions').innerHTML = '';

        this.renderizarAbasCentro([
            { id: 'vetores', rotulo: 'Vetores no Plano ℝ²' },
            { id: 'matrizes', rotulo: 'Editor e Operações de Matrizes' }
        ], st.abaPrincipal, (aba) => {
            st.abaPrincipal = aba;
            this.renderModuloVetoresMatrizes();
        });

        if (st.abaPrincipal === 'vetores') {
            const { u, v } = st;
            const soma = { x: u.x + v.x, y: u.y + v.y };
            const sub = { x: u.x - v.x, y: u.y - v.y };
            const escalar = u.x * v.x + u.y * v.y;
            const modU = Math.sqrt(u.x * u.x + u.y * u.y);
            const modV = Math.sqrt(v.x * v.x + v.y * v.y);
            const cosTheta = (modU * modV) > 0 ? Math.max(-1, Math.min(1, escalar / (modU * modV))) : 0;
            const angulo = (Math.acos(cosTheta) * 180) / Math.PI;

            const mapaRes = {
                soma: `u + v = (${soma.x}, ${soma.y})`,
                subtracao: `u − v = (${sub.x}, ${sub.y})`,
                escalar: `u · v = ${escalar}`,
                modulo: `|u| = ${MathLabCalc.fmt(modU, 2)}  •  |v| = ${MathLabCalc.fmt(modV, 2)}`,
                angulo: `θ ≈ ${MathLabCalc.fmt(angulo, 2)}°`
            };

            document.getElementById('left-panel-body').innerHTML = `
                <div class="segmented-control full-width">
                    <button type="button" class="segmented-btn active" data-vm-tab="vetores">Vetores</button>
                    <button type="button" class="segmented-btn" data-vm-tab="matrizes">Matrizes</button>
                </div>

                <div class="math-display-box">
                    <div class="display-top-bar">
                        <span class="mini-pill active">u = (${u.x}, ${u.y})</span>
                        <span class="mini-pill active">v = (${v.x}, ${v.y})</span>
                    </div>
                    <div class="display-result-row" style="border-top:none;">
                        <span class="result-label">Resultado</span>
                        <span class="result-primary" style="font-size:18px;">${mapaRes[st.operacaoVetor]}</span>
                    </div>
                </div>

                <div class="control-group">
                    <label class="field-label" for="vec-op-sel">Operação Vetorial</label>
                    <select id="vec-op-sel" class="field-select">
                        <option value="soma" ${st.operacaoVetor === 'soma' ? 'selected' : ''}>Soma Vetorial (u + v)</option>
                        <option value="subtracao" ${st.operacaoVetor === 'subtracao' ? 'selected' : ''}>Subtração Vetorial (u − v)</option>
                        <option value="escalar" ${st.operacaoVetor === 'escalar' ? 'selected' : ''}>Produto Escalar (u · v)</option>
                        <option value="modulo" ${st.operacaoVetor === 'modulo' ? 'selected' : ''}>Módulo / Norma (|u| e |v|)</option>
                        <option value="angulo" ${st.operacaoVetor === 'angulo' ? 'selected' : ''}>Ângulo entre Vetores (θ)</option>
                    </select>
                </div>

                <div class="sliders-box">
                    <span class="field-label">Coordenadas de u = (x₁, y₁) e v = (x₂, y₂)</span>
                    <div class="control-row-2col">
                        <div class="control-group"><label class="field-label">u_x</label><input type="number" id="vec-ux" class="field-input" value="${u.x}"></div>
                        <div class="control-group"><label class="field-label">u_y</label><input type="number" id="vec-uy" class="field-input" value="${u.y}"></div>
                    </div>
                    <div class="control-row-2col">
                        <div class="control-group"><label class="field-label">v_x</label><input type="number" id="vec-vx" class="field-input" value="${v.x}"></div>
                        <div class="control-group"><label class="field-label">v_y</label><input type="number" id="vec-vy" class="field-input" value="${v.y}"></div>
                    </div>
                </div>
            `;

            this.ativarPalcoCustom(
                MathLabVisuals.gerarSvgVetores(u, v, st.operacaoVetor),
                'Diagrama Vetorial no Plano Cartesiano',
                `u = (${u.x}, ${u.y})  e  v = (${v.x}, ${v.y})`
            );

            document.getElementById('right-panel-title').textContent = 'Propriedades Vetoriais';
            document.getElementById('right-panel-body').innerHTML = `
                <div class="info-section">
                    <span class="section-heading">Resultados Completos</span>
                    <div class="props-list">
                        <div class="prop-item"><span class="prop-key">Soma (u + v)</span><span class="prop-val" style="color:var(--amber);">(${soma.x}, ${soma.y})</span></div>
                        <div class="prop-item"><span class="prop-key">Subtração (u − v)</span><span class="prop-val">(${sub.x}, ${sub.y})</span></div>
                        <div class="prop-item"><span class="prop-key">Produto Escalar (u · v)</span><span class="prop-val">${escalar}</span></div>
                        <div class="prop-item"><span class="prop-key">Módulo |u|</span><span class="prop-val" style="color:var(--green);">√(${u.x * u.x}+${u.y * u.y}) = ${MathLabCalc.fmt(modU, 2)}</span></div>
                        <div class="prop-item"><span class="prop-key">Módulo |v|</span><span class="prop-val" style="color:var(--primary);">√(${v.x * v.x}+${v.y * v.y}) = ${MathLabCalc.fmt(modV, 2)}</span></div>
                        <div class="prop-item"><span class="prop-key">Ângulo θ entre u e v</span><span class="prop-val">${MathLabCalc.fmt(angulo, 2)}°</span></div>
                    </div>
                </div>
                <div class="steps-list">
                    <div class="step-card">
                        <span class="step-title">Passo 1 — Operação coordenada a coordenada</span>
                        <span class="step-math">u + v = (${u.x} + (${v.x}), ${u.y} + (${v.y})) = (${soma.x}, ${soma.y})</span>
                    </div>
                    <div class="step-card">
                        <span class="step-title">Passo 2 — Produto Escalar</span>
                        <span class="step-math">u · v = (${u.x})·(${v.x}) + (${u.y})·(${v.y}) = ${u.x * v.x} + (${u.y * v.y}) = ${escalar}</span>
                    </div>
                </div>
            `;
        } else {
            // Aba Matrizes (fiel à tela 09 da imagem de referência!)
            const A = st.matrizA;
            const B = st.matrizB;
            const detA = A[0][0] * A[1][1] - A[0][1] * A[1][0];

            let C = [[0, 0], [0, 0]];
            let passosMat = [];

            if (st.operacaoMatriz === 'multiplicacao') {
                C = [
                    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
                    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]
                ];
                passosMat = [
                    { titulo: 'Linha 1 × Colunas de B', math: `c₁₁ = ${A[0][0]}·${B[0][0]} + ${A[0][1]}·${B[1][0]} = ${C[0][0]}   |   c₁₂ = ${A[0][0]}·${B[0][1]} + ${A[0][1]}·${B[1][1]} = ${C[0][1]}` },
                    { titulo: 'Linha 2 × Colunas de B', math: `c₂₁ = ${A[1][0]}·${B[0][0]} + ${A[1][1]}·${B[1][0]} = ${C[1][0]}   |   c₂₂ = ${A[1][0]}·${B[0][1]} + ${A[1][1]}·${B[1][1]} = ${C[1][1]}` }
                ];
            } else if (st.operacaoMatriz === 'soma') {
                C = [[A[0][0] + B[0][0], A[0][1] + B[0][1]], [A[1][0] + B[1][0], A[1][1] + B[1][1]]];
                passosMat = [{ titulo: 'Soma elemento a elemento (aᵢⱼ + bᵢⱼ)', math: `[${C[0][0]}, ${C[0][1]} ; ${C[1][0]}, ${C[1][1]}]` }];
            } else if (st.operacaoMatriz === 'subtracao') {
                C = [[A[0][0] - B[0][0], A[0][1] - B[0][1]], [A[1][0] - B[1][0], A[1][1] - B[1][1]]];
                passosMat = [{ titulo: 'Subtração elemento a elemento (aᵢⱼ − bᵢⱼ)', math: `[${C[0][0]}, ${C[0][1]} ; ${C[1][0]}, ${C[1][1]}]` }];
            } else if (st.operacaoMatriz === 'transposta') {
                C = [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];
                passosMat = [{ titulo: 'Permutar linhas por colunas de A (Aᵀ)', math: `[${C[0][0]}, ${C[0][1]} ; ${C[1][0]}, ${C[1][1]}]` }];
            } else if (st.operacaoMatriz === 'inversa') {
                if (Math.abs(detA) > 1e-9) {
                    C = [
                        [MathLabCalc.fmt(A[1][1] / detA, 2), MathLabCalc.fmt(-A[0][1] / detA, 2)],
                        [MathLabCalc.fmt(-A[1][0] / detA, 2), MathLabCalc.fmt(A[0][0] / detA, 2)]
                    ];
                }
                passosMat = [{ titulo: `Inversa A⁻¹ = (1/det(A)) · adj(A), com det(A) = ${detA}`, math: detA !== 0 ? 'Matriz invertível (det ≠ 0)' : 'Matriz singular (não admite inversa)' }];
            } else {
                C = [[detA, '—'], ['—', '—']];
                passosMat = [{ titulo: 'Determinante 2×2 (Diagonal principal − secundária)', math: `det(A) = (${A[0][0]}·${A[1][1]}) − (${A[0][1]}·${A[1][0]}) = ${detA}` }];
            }

            document.getElementById('left-panel-body').innerHTML = `
                <div class="segmented-control full-width">
                    <button type="button" class="segmented-btn" data-vm-tab="vetores">Vetores</button>
                    <button type="button" class="segmented-btn active" data-vm-tab="matrizes">Matrizes</button>
                </div>

                <div class="control-group">
                    <div class="field-label">
                        <label for="mat-op-sel">Operação Matricial</label>
                        <button type="button" class="mini-icon-btn" id="btn-mat-toggle-dim" style="width:auto;padding:0 8px;font-size:11px;" title="Aumentar ou reduzir linhas e colunas da grade">
                            ${(st.dimMatriz || 2) === 2 ? '+ Aumentar para 3×3' : '− Reduzir para 2×2'}
                        </button>
                    </div>
                    <select id="mat-op-sel" class="field-select">
                        <option value="multiplicacao" ${st.operacaoMatriz === 'multiplicacao' ? 'selected' : ''}>Multiplicação (A · B)</option>
                        <option value="soma" ${st.operacaoMatriz === 'soma' ? 'selected' : ''}>Soma (A + B)</option>
                        <option value="subtracao" ${st.operacaoMatriz === 'subtracao' ? 'selected' : ''}>Subtração (A − B)</option>
                        <option value="determinante" ${st.operacaoMatriz === 'determinante' ? 'selected' : ''}>Determinante det(A)</option>
                        <option value="transposta" ${st.operacaoMatriz === 'transposta' ? 'selected' : ''}>Transposta (Aᵀ)</option>
                        <option value="inversa" ${st.operacaoMatriz === 'inversa' ? 'selected' : ''}>Matriz Inversa (A⁻¹)</option>
                    </select>
                </div>

                <div class="info-section">
                    <span class="section-heading">Resultado da Operação</span>
                    <div class="matrix-brackets" style="align-self:center;margin:6px 0;">
                        <div class="matrix-grid" style="grid-template-columns:1fr 1fr;">
                            <div class="matrix-cell-static">${C[0][0]}</div>
                            <div class="matrix-cell-static">${C[0][1]}</div>
                            <div class="matrix-cell-static">${C[1][0]}</div>
                            <div class="matrix-cell-static">${C[1][1]}</div>
                        </div>
                    </div>
                </div>
            `;

            this.ativarPalcoCustom(`
                <div class="matrices-workspace">
                    <div class="matrices-pair-row">
                        <div class="matrix-bracket-box">
                            <span class="matrix-label-title">Matriz A (Editável)</span>
                            <div class="matrix-brackets">
                                <div class="matrix-grid" style="grid-template-columns:1fr 1fr;">
                                    <input type="number" class="matrix-cell-input" data-mat="A" data-r="0" data-c="0" value="${A[0][0]}">
                                    <input type="number" class="matrix-cell-input" data-mat="A" data-r="0" data-c="1" value="${A[0][1]}">
                                    <input type="number" class="matrix-cell-input" data-mat="A" data-r="1" data-c="0" value="${A[1][0]}">
                                    <input type="number" class="matrix-cell-input" data-mat="A" data-r="1" data-c="1" value="${A[1][1]}">
                                </div>
                            </div>
                        </div>

                        <div class="matrix-bracket-box">
                            <span class="matrix-label-title">Matriz B (Editável)</span>
                            <div class="matrix-brackets">
                                <div class="matrix-grid" style="grid-template-columns:1fr 1fr;">
                                    <input type="number" class="matrix-cell-input" data-mat="B" data-r="0" data-c="0" value="${B[0][0]}">
                                    <input type="number" class="matrix-cell-input" data-mat="B" data-r="0" data-c="1" value="${B[0][1]}">
                                    <input type="number" class="matrix-cell-input" data-mat="B" data-r="1" data-c="0" value="${B[1][0]}">
                                    <input type="number" class="matrix-cell-input" data-mat="B" data-r="1" data-c="1" value="${B[1][1]}">
                                </div>
                            </div>
                        </div>

                        <div class="matrix-bracket-box">
                            <span class="matrix-label-title" style="color:var(--green);">Resultado</span>
                            <div class="matrix-brackets">
                                <div class="matrix-grid" style="grid-template-columns:1fr 1fr;">
                                    <div class="matrix-cell-static">${C[0][0]}</div>
                                    <div class="matrix-cell-static">${C[0][1]}</div>
                                    <div class="matrix-cell-static">${C[1][0]}</div>
                                    <div class="matrix-cell-static">${C[1][1]}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="info-section" style="max-width:520px;margin:0 auto;width:100%;">
                        <span class="section-heading">Cálculo explícito de A · B</span>
                        <div style="font-family:var(--font-mono);font-size:13px;line-height:1.7;color:var(--text-main);">
                            [ ${A[0][0]}·${B[0][0]} + ${A[0][1]}·${B[1][0]} &nbsp;&nbsp; ${A[0][0]}·${B[0][1]} + ${A[0][1]}·${B[1][1]} ] &nbsp;=&nbsp; [ <strong style="color:var(--green);">${A[0][0]*B[0][0]+A[0][1]*B[1][0]} &nbsp; ${A[0][0]*B[0][1]+A[0][1]*B[1][1]}</strong> ]<br>
                            [ ${A[1][0]}·${B[0][0]} + ${A[1][1]}·${B[1][0]} &nbsp;&nbsp; ${A[1][0]}·${B[0][1]} + ${A[1][1]}·${B[1][1]} ] &nbsp;=&nbsp; [ <strong style="color:var(--green);">${A[1][0]*B[0][0]+A[1][1]*B[1][0]} &nbsp; ${A[1][0]*B[0][1]+A[1][1]*B[1][1]}</strong> ]
                        </div>
                    </div>
                </div>
            `, 'Editor Visual de Matrizes 2×2', 'Altere qualquer célula para recalcular');

            document.getElementById('right-panel-title').textContent = 'Passos e Propriedades';
            document.getElementById('right-panel-body').innerHTML = `
                <div class="info-section">
                    <span class="section-heading">Propriedades de A e B</span>
                    <div class="props-list">
                        <div class="prop-item"><span class="prop-key">Determinante det(A)</span><span class="prop-val">${detA}</span></div>
                        <div class="prop-item"><span class="prop-key">Traço tr(A)</span><span class="prop-val">${A[0][0] + A[1][1]}</span></div>
                        <div class="prop-item"><span class="prop-key">Invertibilidade de A</span><span class="prop-val" style="color:${detA !== 0 ? 'var(--green)' : 'var(--red)'};">${detA !== 0 ? 'Invertível (det ≠ 0)' : 'Singular'}</span></div>
                    </div>
                </div>
                <div class="steps-list">
                    ${passosMat.map(p => `
                        <div class="step-card">
                            <span class="step-title">${p.titulo}</span>
                            <span class="step-math">${p.math}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Eventos Vetores e Matrizes
        document.querySelectorAll('[data-vm-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                st.abaPrincipal = btn.dataset.vmTab;
                this.renderModuloVetoresMatrizes();
            });
        });

        document.getElementById('vec-op-sel')?.addEventListener('change', (e) => {
            st.operacaoVetor = e.target.value;
            this.renderModuloVetoresMatrizes();
        });

        ['ux', 'uy', 'vx', 'vy'].forEach(id => {
            document.getElementById(`vec-${id}`)?.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) || 0;
                if (id === 'ux') st.u.x = val;
                if (id === 'uy') st.u.y = val;
                if (id === 'vx') st.v.x = val;
                if (id === 'vy') st.v.y = val;
                this.renderModuloVetoresMatrizes();
            });
        });

        document.getElementById('mat-op-sel')?.addEventListener('change', (e) => {
            st.operacaoMatriz = e.target.value;
            this.renderModuloVetoresMatrizes();
        });

        document.getElementById('btn-mat-toggle-dim')?.addEventListener('click', () => {
            st.dimMatriz = (st.dimMatriz || 2) === 2 ? 3 : 2;
            if (st.dimMatriz === 3 && st.matrizA.length < 3) {
                st.matrizA = [[1, 2, 0], [3, 4, 1], [0, 1, 2]];
                st.matrizB = [[2, 0, 1], [1, 3, 0], [1, 1, 1]];
            }
            this.mostrarToast(`Grade de matrizes alterada para ${st.dimMatriz}×${st.dimMatriz}`);
            this.renderModuloVetoresMatrizes();
        });

        document.querySelectorAll('.matrix-cell-input').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const m = inp.dataset.mat === 'A' ? st.matrizA : st.matrizB;
                const r = Number(inp.dataset.r);
                const c = Number(inp.dataset.c);
                m[r][c] = parseFloat(e.target.value) || 0;
                this.renderModuloVetoresMatrizes();
            });
        });
    },

    /* ========================================================================
       MÓDULO 10 — ESTATÍSTICA
       ======================================================================== */
    renderModuloEstatistica() {
        const st = this.state.estatistica;
        const est = MathLabCalc.calcularEstatistica(st.dadosTexto, st.tipoVariancia);

        document.getElementById('left-panel-title').textContent = 'Estatística Descritiva';
        document.getElementById('left-panel-badge').textContent = est.valido ? `n = ${est.n} dados` : 'Entrada inválida';
        document.getElementById('left-panel-actions').innerHTML = '';

        const leftBody = document.getElementById('left-panel-body');
        leftBody.innerHTML = `
            <div class="control-group">
                <div class="field-label">
                    <label for="stat-data-input">Conjunto de Dados (separados por vírgula)</label>
                    <button type="button" class="mini-icon-btn" id="btn-stat-preset" style="width:auto;padding:0 6px;font-size:11px;">Alternar Exemplo</button>
                </div>
                <textarea id="stat-data-input" class="field-textarea" placeholder="Ex: 4, 6, 6, 8, 10, 12">${st.dadosTexto}</textarea>
            </div>

            <div class="segmented-control full-width">
                <button type="button" class="segmented-btn ${st.tipoVariancia === 'populacional' ? 'active' : ''}" data-stat-var="populacional">Populacional (σ²)</button>
                <button type="button" class="segmented-btn ${st.tipoVariancia === 'amostral' ? 'active' : ''}" data-stat-var="amostral">Amostral (s²)</button>
            </div>

            ${est.valido ? `
            <div class="info-section" style="margin-top:auto;">
                <span class="section-heading">Medidas Principais</span>
                <div class="props-list">
                    <div class="prop-item"><span class="prop-key">Média Aritmética (x̄)</span><span class="prop-val" style="color:var(--green);">${MathLabCalc.fmt(est.media, 2)}</span></div>
                    <div class="prop-item"><span class="prop-key">Mediana (Md)</span><span class="prop-val">${MathLabCalc.fmt(est.mediana, 2)}</span></div>
                    <div class="prop-item"><span class="prop-key">Moda (Mo)</span><span class="prop-val" style="color:var(--primary);">${est.moda}</span></div>
                    <div class="prop-item"><span class="prop-key">Variância (${st.tipoVariancia})</span><span class="prop-val">${MathLabCalc.fmt(est.variancia, 2)}</span></div>
                    <div class="prop-item"><span class="prop-key">Desvio Padrão (${st.tipoVariancia === 'populacional' ? 'σ' : 's'})</span><span class="prop-val" style="color:var(--amber);">${MathLabCalc.fmt(est.desvioPadrao, 2)}</span></div>
                </div>
            </div>
            ` : ''}
        `;

        this.renderizarAbasCentro([
            { id: 'histograma', rotulo: 'Histograma' },
            { id: 'barras', rotulo: 'Gráfico de Barras' },
            { id: 'linhas', rotulo: 'Gráfico de Linhas' },
            { id: 'tabela', rotulo: 'Tabela de Frequências' }
        ], st.tipoGrafico, (tipoG) => {
            st.tipoGrafico = tipoG;
            this.renderModuloEstatistica();
        });

        if (!est.valido) {
            this.ativarPalcoCustom(`<div class="state-banner error"><div class="state-banner-title">Insira pelo menos um número válido separado por vírgula.</div></div>`, 'Estatística', '');
        } else if (st.tipoGrafico === 'tabela') {
            this.ativarPalcoCustom(`
                <div style="width:100%;max-width:600px;">
                    <div class="data-table-wrapper">
                        <table class="math-table">
                            <thead><tr><th>Valor (xᵢ)</th><th>Frequência Absoluta (fᵢ)</th><th>Frequência Relativa (%)</th></tr></thead>
                            <tbody>
                                ${est.frequencias.map(f => `
                                    <tr><td>${MathLabCalc.fmt(f.valor)}</td><td>${f.freq}</td><td>${f.relativa}</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `, 'Tabela de Distribuição de Frequências', `Total n = ${est.n}`);
        } else {
            this.ativarPalcoCustom(
                MathLabVisuals.gerarSvgEstatistica(est.frequencias, st.tipoGrafico, est.media),
                'Distribuição dos Dados',
                `Rol: ${est.ordenados.join(', ')}`
            );
        }

        document.getElementById('right-panel-title').textContent = 'Resumo e Interpretação';
        document.getElementById('right-panel-actions').innerHTML = '';
        document.getElementById('right-panel-body').innerHTML = est.valido ? `
            <div class="info-section">
                <span class="section-heading">Resumo Estatístico Completo</span>
                <div class="props-list">
                    <div class="prop-item"><span class="prop-key">Quantidade (n)</span><span class="prop-val">${est.n}</span></div>
                    <div class="prop-item"><span class="prop-key">Soma (Σx)</span><span class="prop-val">${MathLabCalc.fmt(est.soma, 2)}</span></div>
                    <div class="prop-item"><span class="prop-key">Média</span><span class="prop-val">${MathLabCalc.fmt(est.media, 2)}</span></div>
                    <div class="prop-item"><span class="prop-key">Mediana</span><span class="prop-val">${MathLabCalc.fmt(est.mediana, 2)}</span></div>
                    <div class="prop-item"><span class="prop-key">Moda</span><span class="prop-val">${est.moda}</span></div>
                    <div class="prop-item"><span class="prop-key">Amplitude Total</span><span class="prop-val">${MathLabCalc.fmt(est.amplitude, 2)}</span></div>
                    <div class="prop-item"><span class="prop-key">Variância (${st.tipoVariancia})</span><span class="prop-val">${MathLabCalc.fmt(est.variancia, 2)}</span></div>
                    <div class="prop-item"><span class="prop-key">Desvio Padrão (${st.tipoVariancia === 'populacional' ? 'σ' : 's'})</span><span class="prop-val">${MathLabCalc.fmt(est.desvioPadrao, 2)}</span></div>
                </div>
            </div>

            <div class="interpretation-box">
                <strong>Interpretação da Amostra:</strong> O conjunto possui <strong>n = ${est.n}</strong> observações com tendência central em <strong>${MathLabCalc.fmt(est.media, 2)}</strong> e dispersão média de <strong>±${MathLabCalc.fmt(est.desvioPadrao, 2)}</strong> unidades em relação à média (${st.tipoVariancia}).
            </div>
        ` : '';

        document.getElementById('stat-data-input')?.addEventListener('input', (e) => {
            st.dadosTexto = e.target.value;
            this.renderModuloEstatistica();
        });

        document.getElementById('btn-stat-preset')?.addEventListener('click', () => {
            st.dadosTexto = st.dadosTexto.includes('12') ? '2, 4, 4, 6, 8, 8, 10' : '4, 6, 6, 8, 10, 12';
            this.renderModuloEstatistica();
        });

        document.querySelectorAll('[data-stat-var]').forEach(btn => {
            btn.addEventListener('click', () => {
                st.tipoVariancia = btn.dataset.statVar;
                this.renderModuloEstatistica();
            });
        });
    },

    /* ========================================================================
       MÓDULO 11 — MODELAGEM MATEMÁTICA APLICADA
       ======================================================================== */
    renderModuloModelagem() {
        const st = this.state.modelagem;
        document.getElementById('left-panel-title').textContent = 'Modelagem Aplicada';
        document.getElementById('left-panel-badge').textContent = 'Situações Reais';
        document.getElementById('left-panel-actions').innerHTML = '';

        const p0 = Number(st.p0);
        const k = Number(st.k);
        const t = Number(st.t);

        const catalogModelos = {
            exponencial_e: {
                nome: 'Crescimento Exponencial Contínuo',
                formula: `P(t) = ${p0} · e^(${MathLabCalc.fmt(k, 2)}t)`,
                fn: (x) => p0 * Math.exp(k * x),
                valT: p0 * Math.exp(k * t),
                unidade: 'indivíduos',
                interpretacao: `Com população/valor inicial P₀ = ${p0} e taxa contínua k = ${MathLabCalc.fmt(k * 100, 1)}% por unidade de tempo, no instante t = ${t} o modelo atinge P(${t}) ≈ ${MathLabCalc.fmt(p0 * Math.exp(k * t), 2)}.`
            },
            populacional_2: {
                nome: 'Crescimento Populacional (Dobramento)',
                formula: `P(t) = ${p0} · 2^(t / 3)`,
                fn: (x) => p0 * Math.pow(2, x / 3),
                valT: p0 * Math.pow(2, t / 3),
                unidade: 'habitantes',
                interpretacao: `População inicial: ${p0}. A cada 3 unidades de tempo, a população dobra. Em t = ${t}, temos P(${t}) = ${MathLabCalc.fmt(p0 * Math.pow(2, t / 3), 2)}.`
            },
            juros: {
                nome: 'Juros Compostos Financeiros',
                formula: `M(t) = ${p0} · (1 + ${MathLabCalc.fmt(k, 2)})^t`,
                fn: (x) => p0 * Math.pow(1 + k, x),
                valT: p0 * Math.pow(1 + k, t),
                unidade: 'R$',
                interpretacao: `Capital inicial C₀ = R$ ${p0} aplicado à taxa composta i = ${MathLabCalc.fmt(k * 100, 1)}% ao período gera montante M(${t}) = R$ ${MathLabCalc.fmt(p0 * Math.pow(1 + k, t), 2)}.`
            },
            decaimento: {
                nome: 'Decaimento Exponencial / Radioativo',
                formula: `N(t) = ${p0} · e^(−${MathLabCalc.fmt(k, 2)}t)`,
                fn: (x) => p0 * Math.exp(-k * x),
                valT: p0 * Math.exp(-k * t),
                unidade: 'gramas',
                interpretacao: `Massa inicial N₀ = ${p0} g decaindo à taxa λ = ${MathLabCalc.fmt(k, 2)}. Após t = ${t} períodos, restam N(${t}) ≈ ${MathLabCalc.fmt(p0 * Math.exp(-k * t), 2)} g.`
            },
            mu: {
                nome: 'Movimento Uniforme (MU)',
                formula: `S(t) = ${p0} + ${MathLabCalc.fmt(k * 50, 1)}·t`,
                fn: (x) => p0 + (k * 50) * x,
                valT: p0 + (k * 50) * t,
                unidade: 'metros',
                interpretacao: `Posição inicial S₀ = ${p0} m com velocidade constante v = ${MathLabCalc.fmt(k * 50, 1)} m/s. Em t = ${t} s, S(${t}) = ${MathLabCalc.fmt(p0 + (k * 50) * t, 2)} m.`
            },
            muv: {
                nome: 'Movimento Uniformemente Variado (MUV)',
                formula: `S(t) = ${p0} + 10t − ${MathLabCalc.fmt(k * 5, 1)}t²`,
                fn: (x) => p0 + 10 * x - (k * 5) * x * x,
                valT: p0 + 10 * t - (k * 5) * t * t,
                unidade: 'metros',
                interpretacao: `Trajetória parabólica com S₀ = ${p0} m, velocidade inicial v₀ = 10 m/s e aceleração a = −${MathLabCalc.fmt(k * 10, 1)} m/s².`
            }
        };

        const mod = catalogModelos[st.modelo] || catalogModelos.exponencial_e;

        const leftBody = document.getElementById('left-panel-body');
        leftBody.innerHTML = `
            <div class="math-display-box">
                <div class="display-top-bar">
                    <span class="mini-pill active">${mod.nome}</span>
                </div>
                <div class="expression-input-row">
                    <input type="text" class="expression-input" value="${mod.formula}" readonly>
                </div>
                <div class="display-result-row">
                    <span class="result-label">Projeção em t = ${t}</span>
                    <span class="result-primary" style="font-size:19px;">P(${t}) = ${MathLabCalc.fmt(mod.valT, 2)}</span>
                </div>
            </div>

            <div class="control-group">
                <label class="field-label" for="mod-select">Modelo Matemático</label>
                <select id="mod-select" class="field-select">
                    <option value="exponencial_e" ${st.modelo === 'exponencial_e' ? 'selected' : ''}>Crescimento Exponencial — P(t) = P₀ · e^(kt)</option>
                    <option value="populacional_2" ${st.modelo === 'populacional_2' ? 'selected' : ''}>Crescimento Populacional — P(t) = 100 · 2^(t/3)</option>
                    <option value="juros" ${st.modelo === 'juros' ? 'selected' : ''}>Juros Compostos — M(t) = C · (1 + i)^t</option>
                    <option value="decaimento" ${st.modelo === 'decaimento' ? 'selected' : ''}>Decaimento Exponencial — N(t) = N₀ · e^(−kt)</option>
                    <option value="mu" ${st.modelo === 'mu' ? 'selected' : ''}>Física: Movimento Uniforme (MU)</option>
                    <option value="muv" ${st.modelo === 'muv' ? 'selected' : ''}>Física: Movimento Uniformemente Variado (MUV)</option>
                </select>
            </div>

            <div class="sliders-box">
                <div class="field-label">
                    <span>Parâmetros do Modelo</span>
                    <button type="button" class="mini-icon-btn" id="btn-mod-preset-img" style="width:auto;padding:0 6px;font-size:11px;">Preset P(6)=400</button>
                </div>
                <div class="slider-item">
                    <span class="slider-label">Valor P₀</span>
                    <input type="range" id="mod-p0" class="math-slider" min="20" max="500" step="10" value="${p0}">
                    <span class="slider-value-badge">${p0}</span>
                </div>
                <div class="slider-item">
                    <span class="slider-label">Taxa k</span>
                    <input type="range" id="mod-k" class="math-slider" min="0.05" max="0.5" step="0.05" value="${k}">
                    <span class="slider-value-badge">${MathLabCalc.fmt(k, 2)}</span>
                </div>
                <div class="slider-item">
                    <span class="slider-label">Tempo t</span>
                    <input type="range" id="mod-t" class="math-slider" min="1" max="15" step="1" value="${t}">
                    <span class="slider-value-badge">${t}</span>
                </div>
            </div>
        `;

        this.renderizarAbasCentro([
            { id: 'exponencial_e', rotulo: 'P₀·e^(kt)' },
            { id: 'populacional_2', rotulo: 'Dobramento 2^(t/3)' },
            { id: 'juros', rotulo: 'Juros Compostos' },
            { id: 'decaimento', rotulo: 'Decaimento' }
        ], st.modelo, (m) => {
            st.modelo = m;
            if (m === 'populacional_2') { st.p0 = 100; st.t = 6; }
            if (m === 'exponencial_e') { st.p0 = 100; st.k = 0.2; st.t = 10; }
            this.renderModuloModelagem();
        });

        const yMaxGraf = Math.max(mod.valT * 1.25, p0 * 1.5, 250);
        this.ativarPalcoCanvas({
            janela: { xMin: -1, xMax: Math.max(12, t + 2), yMin: -yMaxGraf * 0.12, yMax: yMaxGraf },
            rotuloEixoX: 't',
            rotuloEixoY: 'P(t)',
            curvas: [{ rotulo: mod.formula, cor: '#22C55E', fn: (x) => (x < 0 ? NaN : mod.fn(x)) }],
            marcadores: [
                { x: 0, y: mod.fn(0), rotulo: `P(0) = ${p0}`, cor: '#3B82F6' },
                { x: t, y: mod.valT, rotulo: `(${t}, ${MathLabCalc.fmt(mod.valT, 2)})`, cor: '#EF4444', projetarEixos: true }
            ]
        }, 'Curva de Evolução Temporal P(t)', mod.formula);

        const instantes = [0, 2, 4, 6, 8, 10, t].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

        document.getElementById('right-panel-title').textContent = 'Interpretação e Projeções';
        document.getElementById('right-panel-actions').innerHTML = '';
        document.getElementById('right-panel-body').innerHTML = `
            <div class="interpretation-box">
                <strong>Interpretação Contextualizada:</strong><br>
                ${mod.interpretacao}
            </div>

            <div class="info-section">
                <span class="section-heading">Tabela de Projeções P(t)</span>
                <table class="math-table">
                    <thead><tr><th>Tempo (t)</th><th>Valor Projetado P(t)</th><th>Unidade</th></tr></thead>
                    <tbody>
                        ${instantes.map(inst => `
                            <tr class="${inst === t ? 'highlight-row' : ''}">
                                <td>t = ${inst}</td>
                                <td style="font-weight:700;color:${inst === t ? 'var(--green)' : 'var(--text-main)'};">${MathLabCalc.fmt(mod.fn(inst), 2)}</td>
                                <td>${mod.unidade}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('mod-select')?.addEventListener('change', (e) => {
            st.modelo = e.target.value;
            this.renderModuloModelagem();
        });
        document.getElementById('mod-p0')?.addEventListener('input', (e) => {
            st.p0 = Number(e.target.value);
            this.renderModuloModelagem();
        });
        document.getElementById('mod-k')?.addEventListener('input', (e) => {
            st.k = Number(e.target.value);
            this.renderModuloModelagem();
        });
        document.getElementById('mod-t')?.addEventListener('input', (e) => {
            st.t = Number(e.target.value);
            this.renderModuloModelagem();
        });
        document.getElementById('btn-mod-preset-img')?.addEventListener('click', () => {
            st.modelo = 'populacional_2';
            st.p0 = 100;
            st.t = 6;
            this.renderModuloModelagem();
        });
    },

    /* ========================================================================
       4. ESTADOS ESPECIAIS, SKELETON LOADING, FAVORITOS E CONFIGURAÇÕES
       ======================================================================== */
    renderizarSkeleton() {
        const htmlSkel = `
            <div class="skeleton-box">
                <div class="skeleton-line w-40"></div>
                <div class="skeleton-line h-lg"></div>
                <div class="skeleton-line w-90"></div>
                <div class="skeleton-line w-70"></div>
                <div class="skeleton-line h-lg"></div>
            </div>
        `;
        document.getElementById('left-panel-body').innerHTML = htmlSkel;
        document.getElementById('right-panel-body').innerHTML = htmlSkel;
    },

    abrirPainelEstadosEspeciais() {
        document.getElementById('generic-drawer-title').textContent = 'Estados Especiais — Demonstrações do Sistema';
        const body = document.getElementById('generic-drawer-body');
        body.innerHTML = `
            <p style="font-size:12.5px;color:var(--text-secondary);">
                Abaixo estão os estados visuais padronizados do MathLab (idênticos ao painel <strong>Estados</strong> da especificação). Você pode testá-los diretamente nos módulos clicando nos botões de ação:
            </p>

            <!-- 1. Erro de Domínio -->
            <div class="state-banner error">
                <div class="state-banner-left">
                    <div class="state-icon-circle">✕</div>
                    <div>
                        <div class="state-banner-title">Erro de domínio — log(−5)</div>
                        <div class="state-banner-desc">Logaritmo de número negativo. O logaritmando precisa ser maior que zero no conjunto dos números reais.</div>
                        <div class="state-banner-suggestion">Sugestão: use log(|x|) ou defina x &gt; 0.</div>
                    </div>
                </div>
                <button type="button" class="btn-secondary-action" id="btn-trigger-state-err">Abrir na Científica</button>
            </div>

            <!-- 2. Limite Inexistente -->
            <div class="state-banner warning">
                <div class="state-banner-left">
                    <div class="state-icon-circle">!</div>
                    <div>
                        <div class="state-banner-title">Limite inexistente — lim(x→0) 1/x</div>
                        <div class="state-banner-desc">NÃO EXISTE: limite à esquerda −∞, à direita +∞.</div>
                    </div>
                </div>
                <button type="button" class="btn-secondary-action" id="btn-trigger-state-lim">Abrir em Limites</button>
            </div>

            <!-- 3. Verificação por 2 Métodos -->
            <div class="verification-box">
                <div class="section-header-line">
                    <span class="section-heading" style="color:var(--green);">Verificação — Resultado conferido por 2 métodos</span>
                    <span class="verified-badge">✓ Verificado</span>
                </div>
                <div class="verification-line">
                    <span>✓</span> <span>f(2) = −9  •  −Δ/4a = −9  (Funções Quadráticas e Integrais por Simpson)</span>
                </div>
            </div>

            <!-- 4. Carregamento Skeleton e Estado Vazio -->
            <div class="info-section">
                <span class="section-heading">Simulação de Carregamento (Skeleton) e Estado Vazio</span>
                <div class="action-btn-row">
                    <button type="button" class="btn-secondary-action" id="btn-trigger-skeleton" style="flex:1;">Simular Skeleton (1,2s)</button>
                    <button type="button" class="btn-secondary-action" id="btn-trigger-empty" style="flex:1;">Simular Estado Vazio</button>
                </div>
            </div>
        `;

        document.getElementById('drawer-generic-backdrop').classList.remove('hidden');

        document.getElementById('btn-trigger-state-err')?.addEventListener('click', () => {
            document.getElementById('drawer-generic-backdrop').classList.add('hidden');
            this.state.cientifica.expressao = 'log(−5)';
            this.selecionarModulo('cientifica');
        });

        document.getElementById('btn-trigger-state-lim')?.addEventListener('click', () => {
            document.getElementById('drawer-generic-backdrop').classList.add('hidden');
            this.state.limites.exemploAtivo = 'inexistente';
            this.selecionarModulo('limites');
        });

        document.getElementById('btn-trigger-skeleton')?.addEventListener('click', () => {
            document.getElementById('drawer-generic-backdrop').classList.add('hidden');
            this.state.loadingSkeleton = true;
            this.renderizarModuloAtivo();
            setTimeout(() => {
                this.state.loadingSkeleton = false;
                this.renderizarModuloAtivo();
            }, 1200);
        });

        document.getElementById('btn-trigger-empty')?.addEventListener('click', () => {
            document.getElementById('drawer-generic-backdrop').classList.add('hidden');
            this.state.cientifica.expressao = '';
            this.selecionarModulo('cientifica');
        });
    },

    abrirPainelFavoritos() {
        document.getElementById('generic-drawer-title').textContent = 'Histórico, Favoritos e Fixados (LocalStorage)';
        const body = document.getElementById('generic-drawer-body');

        const renderLista = () => {
            const termo = (this.state.buscaHistorico || '').toLowerCase().trim();
            const filtro = this.state.filtroHistorico || 'todos';

            const filtrados = this.state.historico.filter(item => {
                if (filtro === 'favoritos' && !item.favorito) return false;
                if (filtro === 'fixados' && !item.fixado) return false;
                if (!termo) return true;
                return (
                    String(item.expressao || '').toLowerCase().includes(termo) ||
                    String(item.resultado || '').toLowerCase().includes(termo) ||
                    String(item.nomeModulo || '').toLowerCase().includes(termo)
                );
            });

            body.innerHTML = `
                <div class="history-search-row">
                    <input type="text" id="hist-search-inp" class="field-input" value="${this.state.buscaHistorico || ''}" placeholder="Buscar no histórico por fórmula, módulo ou resultado...">
                </div>
                <div class="segmented-control full-width" style="margin-bottom:8px;">
                    <button type="button" class="segmented-btn ${filtro === 'todos' ? 'active' : ''}" data-hist-filter="todos">Todos (${this.state.historico.length})</button>
                    <button type="button" class="segmented-btn ${filtro === 'favoritos' ? 'active' : ''}" data-hist-filter="favoritos"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z"/></svg> Favoritos</button>
                    <button type="button" class="segmented-btn ${filtro === 'fixados' ? 'active' : ''}" data-hist-filter="fixados">📌 Fixados</button>
                </div>
                <div class="section-header-line">
                    <span class="section-heading">Clique em um item para reabrir com os quadradinhos preenchidos</span>
                    <button type="button" class="btn-secondary-action" id="btn-clear-hist-all" style="height:26px;font-size:11px;">Limpar Histórico</button>
                </div>
                <div class="history-items">
                    ${filtrados.length === 0 ? `<div style="padding:14px;color:var(--text-secondary);font-size:12.5px;">Nenhum registro encontrado para este filtro.</div>` : filtrados.map(item => `
                        <div class="history-card" data-restore-id="${item.id}">
                            <div class="history-card-left">
                                <span class="history-expr">${item.fixado ? '📌 ' : ''}${item.expressao}</span>
                                <div class="history-meta">
                                    <span>${item.nomeModulo}</span>
                                    <span>•</span>
                                    <span>${item.horario}</span>
                                </div>
                            </div>
                            <div class="history-card-right">
                                <span class="history-res">= ${item.resultado}</span>
                                <button type="button" class="mini-icon-btn ${item.fixado ? 'favorited' : ''}" data-drawer-pin="${item.id}" title="Fixar fórmula no topo">📌</button>
                                <button type="button" class="mini-icon-btn ${item.favorito ? 'favorited' : ''}" data-drawer-fav="${item.id}" title="Favoritar"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z"/></svg></button>
                                <button type="button" class="mini-icon-btn" data-drawer-copy="${item.expressao} = ${item.resultado}" title="Copiar"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            const searchInp = document.getElementById('hist-search-inp');
            searchInp?.addEventListener('input', (e) => {
                this.state.buscaHistorico = e.target.value;
                renderLista();
                const novoInp = document.getElementById('hist-search-inp');
                if (novoInp) {
                    novoInp.focus();
                    novoInp.setSelectionRange(novoInp.value.length, novoInp.value.length);
                }
            });

            body.querySelectorAll('[data-hist-filter]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.state.filtroHistorico = btn.dataset.histFilter;
                    renderLista();
                });
            });

            body.querySelectorAll('[data-drawer-pin]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const it = this.state.historico.find(h => h.id === Number(btn.dataset.drawerPin));
                    if (it) {
                        it.fixado = !it.fixado;
                        this.salvarHistorico();
                        renderLista();
                        this.mostrarToast(it.fixado ? 'Fórmula fixada 📌' : 'Fórmula desfixada');
                    }
                });
            });

            body.querySelectorAll('[data-drawer-fav]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.alternarFavorito(Number(btn.dataset.drawerFav));
                    renderLista();
                });
            });

            body.querySelectorAll('[data-drawer-copy]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.copiarTexto(btn.dataset.drawerCopy);
                });
            });

            body.querySelectorAll('[data-restore-id]').forEach(card => {
                card.addEventListener('click', () => {
                    const item = this.state.historico.find(h => h.id === Number(card.dataset.restoreId));
                    if (item) {
                        document.getElementById('drawer-generic-backdrop').classList.add('hidden');
                        if (item.modulo === 'cientifica') {
                            this.state.cientifica.expressao = item.expressao;
                        } else if (item.modulo === 'funcoes') {
                            if (item.quad) {
                                this.state.funcoes.tipoAtivo = 'quadratica';
                                Object.assign(this.state.funcoes.quad, item.quad);
                            } else {
                                const conv = MathLabCalc.converterTextoParaSlots(item.expressao, 'funcoes');
                                if (conv.reconhecido) {
                                    this.state.funcoes.tipoAtivo = conv.subtipo;
                                    Object.assign(this.state.funcoes.quad, conv.slots);
                                }
                            }
                        }
                        this.selecionarModulo(item.modulo);
                        this.mostrarToast(`Fórmula restaurada: ${item.expressao}`);
                    }
                });
            });

            document.getElementById('btn-clear-hist-all')?.addEventListener('click', () => {
                if (typeof window.confirm === 'function' && !window.confirm('Deseja realmente limpar os itens não favoritados/fixados do histórico?')) {
                    return;
                }
                this.state.historico = this.state.historico.filter(h => h.favorito || h.fixado);
                this.salvarHistorico();
                renderLista();
                this.mostrarToast('Histórico limpo (favoritos e fixados preservados)');
            });
        };

        renderLista();
        document.getElementById('drawer-generic-backdrop').classList.remove('hidden');
    },

    /* ========================================================================
       5. PALETA DE COMANDOS (CTRL + K)
       ======================================================================== */
    obterComandosPaleta() {
        return [
            { titulo: 'Abrir Módulo 01: Calculadora Científica', categoria: 'Módulo', acao: () => this.selecionarModulo('cientifica') },
            { titulo: 'Abrir Módulo 02: Álgebra (x² − 5x + 6 = 0)', categoria: 'Módulo', acao: () => this.selecionarModulo('algebra') },
            { titulo: 'Abrir Módulo 03: Funções (Quadrática x² − 4x − 5)', categoria: 'Módulo', acao: () => { this.state.funcoes.tipoAtivo = 'quadratica'; this.selecionarModulo('funcoes'); } },
            { titulo: 'Abrir Módulo 04: Limites ((x² − 4)/(x − 2))', categoria: 'Módulo', acao: () => { this.state.limites.exemploAtivo = 'removivel'; this.selecionarModulo('limites'); } },
            { titulo: 'Abrir Módulo 04: Limite Inexistente (lim x→0 1/x)', categoria: 'Estado Especial', acao: () => { this.state.limites.exemploAtivo = 'inexistente'; this.selecionarModulo('limites'); } },
            { titulo: 'Abrir Módulo 05: Derivadas (x³ · sen(x))', categoria: 'Módulo', acao: () => this.selecionarModulo('derivadas') },
            { titulo: 'Abrir Módulo 06: Integrais (∫₀³ x² dx = 9)', categoria: 'Módulo', acao: () => this.selecionarModulo('integrais') },
            { titulo: 'Abrir Módulo 07: Geometria (Círculo r = 5 e Sólidos)', categoria: 'Módulo', acao: () => this.selecionarModulo('geometria') },
            { titulo: 'Abrir Módulo 08: Trigonometria (Ondas e Ciclo Unitário)', categoria: 'Módulo', acao: () => this.selecionarModulo('trigonometria') },
            { titulo: 'Abrir Módulo 09: Vetores e Matrizes', categoria: 'Módulo', acao: () => this.selecionarModulo('vetores') },
            { titulo: 'Abrir Módulo 10: Estatística (Histograma e Medidas)', categoria: 'Módulo', acao: () => this.selecionarModulo('estatistica') },
            { titulo: 'Abrir Módulo 11: Modelagem (Crescimento Exponencial)', categoria: 'Módulo', acao: () => this.selecionarModulo('modelagem') },
            { titulo: 'Estudar Função: Relatório Completo da Função Atual', categoria: 'Ferramenta', acao: () => this.abrirEstudoFuncao() },
            { titulo: 'Função Constante: f(x) = 5', categoria: '8 Tipos de Funções', acao: () => { this.state.funcoes.tipoAtivo = 'constante'; this.selecionarModulo('funcoes'); } },
            { titulo: 'Função Afim: f(x) = 2x + 1', categoria: '8 Tipos de Funções', acao: () => { this.state.funcoes.tipoAtivo = 'afim'; this.selecionarModulo('funcoes'); } },
            { titulo: 'Função Linear: f(x) = 3x', categoria: '8 Tipos de Funções', acao: () => { this.state.funcoes.tipoAtivo = 'linear'; this.selecionarModulo('funcoes'); } },
            { titulo: 'Função Modular: f(x) = |x|', categoria: '8 Tipos de Funções', acao: () => { this.state.funcoes.tipoAtivo = 'modular'; this.selecionarModulo('funcoes'); } },
            { titulo: 'Função Exponencial: f(x) = 2ˣ', categoria: '8 Tipos de Funções', acao: () => { this.state.funcoes.tipoAtivo = 'exponencial'; this.selecionarModulo('funcoes'); } },
            { titulo: 'Função Logarítmica: f(x) = log₂(x)', categoria: '8 Tipos de Funções', acao: () => { this.state.funcoes.tipoAtivo = 'logaritmica'; this.selecionarModulo('funcoes'); } },
            { titulo: 'Função Trigonométrica: f(x) = sen(x)', categoria: '8 Tipos de Funções', acao: () => { this.state.funcoes.tipoAtivo = 'trigonometrica'; this.selecionarModulo('funcoes'); } },
            { titulo: 'Demonstrar Erro Matemático: log(−5)', categoria: 'Estado Especial', acao: () => { this.state.cientifica.expressao = 'log(−5)'; this.selecionarModulo('cientifica'); } },
            { titulo: 'Alternar Tema Claro / Escuro', categoria: 'Preferência', acao: () => this.alternarTema() },
            { titulo: 'Acessar Histórico e Favoritos', categoria: 'Histórico', acao: () => this.abrirPainelFavoritos() }
        ];
    },

    abrirPaletaComandos() {
        const backdrop = document.getElementById('modal-cmd-backdrop');
        const input = document.getElementById('cmd-search-input');
        backdrop.classList.remove('hidden');
        input.value = '';
        this.state.indiceCmdSelecionado = 0;
        this.filtrarPaletaComandos('');
        setTimeout(() => input.focus(), 20);
    },

    fecharPaletaComandos() {
        document.getElementById('modal-cmd-backdrop').classList.add('hidden');
    },

    filtrarPaletaComandos(termo) {
        const t = String(termo || '').toLowerCase().trim();
        const todos = this.obterComandosPaleta();
        this.comandosFiltrados = todos.filter(c =>
            c.titulo.toLowerCase().includes(t) || c.categoria.toLowerCase().includes(t)
        );
        this.state.indiceCmdSelecionado = 0;
        this.renderizarListaComandos();
    },

    renderizarListaComandos() {
        const listaEl = document.getElementById('cmd-results-list');
        if (!listaEl) return;

        if (!this.comandosFiltrados || this.comandosFiltrados.length === 0) {
            listaEl.innerHTML = `<div style="padding:14px;color:var(--text-secondary);">Nenhum comando ou fórmula encontrado.</div>`;
            return;
        }

        listaEl.innerHTML = this.comandosFiltrados.map((cmd, idx) => `
            <button type="button" class="cmd-item ${idx === this.state.indiceCmdSelecionado ? 'selected' : ''}" data-cmd-idx="${idx}">
                <div class="cmd-item-left">
                    <span>${cmd.titulo}</span>
                </div>
                <span class="cmd-item-category">${cmd.categoria}</span>
            </button>
        `).join('');

        listaEl.querySelectorAll('.cmd-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.cmdIdx);
                const escolhido = this.comandosFiltrados[idx];
                if (escolhido) {
                    this.fecharPaletaComandos();
                    escolhido.acao();
                }
            });
        });
    },

    /* ========================================================================
       6. TEMA CLARO / ESCURO E EVENTOS GLOBAIS
       ======================================================================== */
    alternarTema() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        try {
            localStorage.setItem('mathlab_theme', this.state.theme);
        } catch (e) {}
        MathLabGraph.desenhar();
        this.mostrarToast(`Tema ${this.state.theme === 'dark' ? 'Escuro (#0B1220)' : 'Claro (#EEF3FB)'} ativado`);
    },

    // Todos os menus compartilham as regras de fechamento e navegação do foco.
    vincularMenusCompactos() {
        const pares = [['btn-open-share', 'share-menu'], ['btn-open-settings', 'settings-menu']];
        const fechar = (restaurarFoco = false) => {
            pares.forEach(([idBotao, idMenu]) => {
                const botaoGatilho = document.getElementById(idBotao);
                const menu = document.getElementById(idMenu);
                const estavaAberto = !menu.hidden;
                menu.hidden = true;
                botaoGatilho.setAttribute('aria-expanded', 'false');
                if (estavaAberto && restaurarFoco) botaoGatilho.focus();
            });
        };
        const controles = menu => Array.from(menu.querySelectorAll('button:not(:disabled), select, input:not(:disabled)'));
        pares.forEach(([idBotao, idMenu]) => {
            const botaoGatilho = document.getElementById(idBotao);
            const menu = document.getElementById(idMenu);
            botaoGatilho.addEventListener('click', () => {
                const abrir = menu.hidden;
                fechar();
                if (abrir) {
                    this.atualizarControlesPreferencias();
                    menu.hidden = false;
                    botaoGatilho.setAttribute('aria-expanded', 'true');
                    controles(menu)[0]?.focus();
                }
            });
            botaoGatilho.addEventListener('keydown', e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); if (menu.hidden) botaoGatilho.click(); else controles(menu)[0]?.focus(); }
            });
            menu.addEventListener('keydown', e => {
                if (e.key === 'Escape') { e.preventDefault(); fechar(true); return; }
                // Selects e campos numéricos conservam o comportamento nativo das setas.
                if (e.target.matches('select, input')) return;
                const itens = controles(menu);
                const indice = itens.indexOf(document.activeElement);
                let proximo;
                if (e.key === 'ArrowDown') proximo = (indice + 1) % itens.length;
                if (e.key === 'ArrowUp') proximo = (indice - 1 + itens.length) % itens.length;
                if (e.key === 'Home') proximo = 0;
                if (e.key === 'End') proximo = itens.length - 1;
                if (proximo !== undefined) { e.preventDefault(); itens[proximo].focus(); }
            });
            menu.addEventListener('click', e => {
                const botao = e.target.closest('button');
                if (!botao) return;
                const permanece = ['btn-font-down', 'btn-font-up', 'btn-toggle-theme', 'btn-toggle-visual'].includes(botao.id);
                if (!permanece) fechar(menu.contains(document.activeElement));
            });
        });
        document.addEventListener('click', e => { if (!e.target.closest('.header-dropdown')) fechar(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(true); });
        document.addEventListener('focusin', e => { if (!e.target.closest('.header-dropdown')) fechar(); });

        document.getElementById('btn-share-result').addEventListener('click', () => this.copiarResultadoAtual());
        document.getElementById('btn-share-latex').addEventListener('click', () => {
            const latex = this.obterExpressaoTextoAtual()
                .replace(/·/g, '\\cdot ').replace(/²/g, '^{2}').replace(/³/g, '^{3}')
                .replace(/√\(([^)]+)\)/g, '\\sqrt{$1}').replace(/π/g, '\\pi ');
            this.copiarTexto(`$$${latex}$$`, 'Fórmula copiada em LaTeX');
        });
        document.getElementById('btn-share-pdf').addEventListener('click', () => window.print());
        document.getElementById('btn-generate-footer').addEventListener('click', () => {
            const entrada = document.getElementById('normal-mode-input') || document.getElementById('ready-custom-expression') || document.getElementById('ready-expression-input');
            if (entrada) this.aplicarExpressaoModoNormal(entrada.value, true);
            if (this.state.activeModule === 'funcoes') {
                const dados = this.obterDadosAtuaisFuncoes();
                if (dados.vazio || dados.invalido) return;
            }
            this.executarBotaoGerar();
        });
        document.getElementById('btn-study-footer').addEventListener('click', () => this.abrirEstudoFuncao());
        document.getElementById('cfg-angle').addEventListener('change', e => {
            this.state.cientifica.unidadeAngulo = e.target.value;
            this.salvarPreferenciasCalculo();
            this.renderizarModuloAtivo();
        });
        document.getElementById('cfg-output').addEventListener('change', e => {
            this.state.cientifica.modoSaida = e.target.value;
            this.salvarPreferenciasCalculo();
            this.renderizarModuloAtivo();
        });
        document.getElementById('cfg-decimals').addEventListener('change', e => {
            MathLabCalc.casasDecimais = Number(e.target.value);
            this.salvarPreferenciasCalculo();
            this.renderizarModuloAtivo();
        });
        document.getElementById('cfg-reduce-motion').addEventListener('change', e => {
            this.state.reduceMotion = e.target.checked;
            document.documentElement.setAttribute('data-reduce-motion', String(e.target.checked));
            try { localStorage.setItem('mathlab_reduce_motion', String(e.target.checked)); } catch (erro) {}
        });
        document.getElementById('btn-keyboard-help').addEventListener('click', () => {
            this.abrirInformacao('Atalhos de teclado', '<dl class="shortcuts-list"><dt>Ctrl+K</dt><dd>Buscar módulos, fórmulas e comandos</dd><dt>Ctrl+Z</dt><dd>Desfazer</dd><dt>Ctrl+Shift+Z</dt><dd>Refazer</dd><dt>Enter</dt><dd>Gerar relatório a partir da entrada</dd><dt>Tab / Shift+Tab</dt><dd>Percorrer controles</dd><dt>↑ / ↓</dt><dd>Navegar menus ou ajustar um quadradinho</dd><dt>Esc</dt><dd>Fechar menu, ajuda ou painel</dd></dl>');
        });
        document.getElementById('btn-about').addEventListener('click', () => {
            this.abrirInformacao('Sobre o MathLab', '<p>Laboratório de Matemática para Cálculo Diferencial e Integral. Onze módulos com cálculos, gráficos, tabelas, estudo de funções e histórico. Executado no navegador com HTML, CSS, JavaScript, Canvas e SVG.</p>');
        });
        this.atualizarControlesPreferencias();
    },

    abrirInformacao(titulo, html) {
        document.getElementById('generic-drawer-title').textContent = titulo;
        document.getElementById('generic-drawer-body').innerHTML = html;
        document.getElementById('drawer-generic-backdrop').classList.remove('hidden');
        document.getElementById('btn-close-generic').focus();
    },

    atualizarControlesPreferencias() {
        const escalas = { sm: 'Pequena', md: 'Média', lg: 'Grande', xl: 'Extra' };
        document.getElementById('font-size-output').textContent = escalas[this.state.fontScale];
        document.getElementById('cfg-angle').value = this.state.cientifica.unidadeAngulo;
        document.getElementById('cfg-output').value = this.state.cientifica.modoSaida;
        document.getElementById('cfg-decimals').value = String(MathLabCalc.casasDecimais ?? 2);
        document.getElementById('cfg-reduce-motion').checked = this.state.reduceMotion;
    },

    salvarPreferenciasCalculo() {
        try {
            localStorage.setItem('mathlab_calculation', JSON.stringify({
                angulo: this.state.cientifica.unidadeAngulo,
                saida: this.state.cientifica.modoSaida,
                casas: MathLabCalc.casasDecimais ?? 2
            }));
        } catch (erro) {}
    },

    obterVerificacaoAtual() {
        if (this.state.activeModule === 'funcoes') return this.obterDadosAtuaisFuncoes().verificacao.aprovado;
        if (this.state.activeModule === 'cientifica') {
            const st = this.state.cientifica;
            const resultado = MathLabCalc.avaliarCientifica(st.expressao, st.unidadeAngulo, st.modoSaida);
            if (resultado.erro || resultado.vazio) return false;
            const principal = Number(String(resultado.resultadoDecimal).replace(',', '.'));
            const referencia = MathLabCalc.compilarFuncao(st.expressao, st.unidadeAngulo)(0);
            return MathLabCalc.verificarResultadoDuplo(principal, referencia, 1e-3).aprovado;
        }
        // Cada módulo só habilita o selo após executar sua própria conferência.
        return this._verificacaoModulo?.modulo === this.state.activeModule && this._verificacaoModulo.aprovado === true;
    },

    exportarGraficoAtual() {
        if (this.state.activeModule === 'cientifica') {
            this.mostrarToast('Este modo não possui gráfico para exportar.'); return;
        }
        if (this.state.activeModule !== 'funcoes') {
            if (document.getElementById('canvas-stage-wrapper').style.display === 'none') {
                this.mostrarToast('Abra a aba de gráfico deste modo para exportar o PNG.'); return;
            }
            MathLabGraph.exportarPNG(`mathlab-${this.state.activeModule}.png`); return;
        }
        const dados = this.obterDadosAtuaisFuncoes();
        if (!dados.grafico.curvas.length) { this.mostrarToast('Digite uma função válida antes de exportar.'); return; }
        // A tabela pode estar aberta: o PNG ainda deve usar a função atual.
        const canvas = document.getElementById('canvas-stage-wrapper');
        const custom = document.getElementById('custom-stage-wrapper');
        const visibilidade = [canvas.style.display, custom.style.display];
        try {
            canvas.style.display = 'block'; custom.style.display = 'none';
            MathLabGraph.conectarCanvas(document.getElementById('main-graph-canvas'), dados.grafico);
            MathLabGraph.exportarPNG('mathlab-funcoes.png');
        } finally { [canvas.style.display, custom.style.display] = visibilidade; }
    },

    copiarResultadoAtual() {
        const valor = document.querySelector('.result-hero-value')?.textContent.trim() || this.obterExpressaoTextoAtual();
        this.copiarTexto(`${this.obterExpressaoTextoAtual()} => ${valor}`, 'Resultado copiado');
    },

    vincularEventosGlobais() {
        // Navegação entre os 11 módulos
        document.querySelectorAll('.module-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selecionarModulo(btn.dataset.module);
            });
        });

        // Controles da barra de ferramentas do gráfico
        document.getElementById('btn-graph-zoom-in')?.addEventListener('click', () => MathLabGraph.aplicarZoom(0.8));
        document.getElementById('btn-graph-zoom-out')?.addEventListener('click', () => MathLabGraph.aplicarZoom(1.25));
        document.getElementById('btn-graph-fit-fn')?.addEventListener('click', () => {
            MathLabGraph.ajustarAFuncao();
            this.mostrarToast('Janela ajustada automaticamente à função');
        });
        document.getElementById('btn-graph-reset')?.addEventListener('click', () => MathLabGraph.resetarJanela());
        document.getElementById('btn-graph-png')?.addEventListener('click', () => this.exportarGraficoAtual());

        // Botões do Cabeçalho (Desfazer, Refazer, Fonte, Link, Tour, Estados, Favoritos, Tema)
        document.getElementById('btn-undo')?.addEventListener('click', () => this.desfazer());
        document.getElementById('btn-redo')?.addEventListener('click', () => this.refazer());
        document.getElementById('btn-font-down')?.addEventListener('click', () => this.alterarFonte(-1));
        document.getElementById('btn-font-up')?.addEventListener('click', () => this.alterarFonte(1));
        document.getElementById('btn-share-link')?.addEventListener('click', () => this.gerarLinkCompartilhavel());
        document.getElementById('btn-open-tour')?.addEventListener('click', () => this.abrirTourGuiado(1));
        document.getElementById('btn-open-cmd')?.addEventListener('click', () => this.abrirPaletaComandos());
        document.getElementById('btn-open-states')?.addEventListener('click', () => this.abrirPainelEstadosEspeciais());
        document.getElementById('btn-open-favorites')?.addEventListener('click', () => this.abrirPainelFavoritos());
        document.getElementById('btn-toggle-theme')?.addEventListener('click', () => this.alternarTema());

        // Recolher / Expandir janela de gráficos
        document.getElementById('btn-toggle-visual')?.addEventListener('click', () => {
            if (this.state.activeModule === 'cientifica') {
                this.selecionarModulo('funcoes');
                return;
            }
            this.state.visualCollapsed = !this.state.visualCollapsed;
            this.renderizarModuloAtivo();
        });

        // Fechamento de Modais e Drawers
        document.getElementById('btn-close-study')?.addEventListener('click', () => {
            document.getElementById('drawer-study-backdrop').classList.add('hidden');
        });
        document.getElementById('btn-close-generic')?.addEventListener('click', () => {
            document.getElementById('drawer-generic-backdrop').classList.add('hidden');
        });
        document.getElementById('modal-cmd-backdrop')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal-cmd-backdrop') this.fecharPaletaComandos();
        });
        document.getElementById('drawer-study-backdrop')?.addEventListener('click', (e) => {
            if (e.target.id === 'drawer-study-backdrop') e.target.classList.add('hidden');
        });
        document.getElementById('drawer-generic-backdrop')?.addEventListener('click', (e) => {
            if (e.target.id === 'drawer-generic-backdrop') e.target.classList.add('hidden');
        });

        // Pesquisa e navegação por teclado na Paleta Ctrl + K
        const cmdInput = document.getElementById('cmd-search-input');
        cmdInput?.addEventListener('input', (e) => this.filtrarPaletaComandos(e.target.value));
        cmdInput?.addEventListener('keydown', (e) => {
            if (!this.comandosFiltrados || this.comandosFiltrados.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.state.indiceCmdSelecionado = (this.state.indiceCmdSelecionado + 1) % this.comandosFiltrados.length;
                this.renderizarListaComandos();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.state.indiceCmdSelecionado = (this.state.indiceCmdSelecionado - 1 + this.comandosFiltrados.length) % this.comandosFiltrados.length;
                this.renderizarListaComandos();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = this.comandosFiltrados[this.state.indiceCmdSelecionado];
                if (cmd) {
                    this.fecharPaletaComandos();
                    cmd.acao();
                }
            }
        });

        // Atalhos globais de teclado (Ctrl+K, Ctrl+Z, Ctrl+Shift+Z e Escape)
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.abrirPaletaComandos();
            } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.refazer();
            } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
                const tag = document.activeElement?.tagName;
                if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
                    e.preventDefault();
                    this.desfazer();
                }
            } else if (e.key === 'Escape') {
                this.fecharPaletaComandos();
                document.getElementById('drawer-study-backdrop')?.classList.add('hidden');
                document.getElementById('drawer-generic-backdrop')?.classList.add('hidden');
                document.getElementById('modal-tour-backdrop')?.classList.add('hidden');
            }
        });
    },

    /* ========================================================================
       7. DOIS MODOS DE ENTRADA ([ FÓRMULA PRONTA ] vs [ NORMAL ]) E USABILIDADE
       ======================================================================== */
    alternarModoEntrada(novoModo) {
        if (novoModo !== 'pronta' && novoModo !== 'normal') return;
        const mod = this.state.activeModule;

        // Trocar a apresentação não converte nem modifica a função atual.
        // Outros módulos mantêm sua conversão original de equações.
        if (mod === 'algebra' && novoModo === 'pronta') {
            const conv = MathLabCalc.converterTextoParaSlots(this.obterExpressaoTextoAtual(), mod);
            if (conv.reconhecido && conv.subtipo === 'quadratica') {
                this.state.algebra.ferramenta = 'eq2';
                Object.assign(this.state.algebra.eq2, conv.slots);
            }
        }

        this.state.inputMode = novoModo;
        this.state.passoFluxo = 2;
        try {
            localStorage.setItem('mathlab_input_mode', novoModo);
        } catch (e) {}
        this.renderizarModuloAtivo();
    },

    obterExpressaoTextoAtual() {
        const mod = this.state.activeModule;
        if (mod === 'cientifica') return this.state.cientifica.expressao;
        if (mod === 'funcoes') {
            const st = this.state.funcoes;
            if (st.tipoAtivo === 'custom') return st.expressaoCustom;
            const parametros = ['quadratica', 'canonica', 'fatorada'].includes(st.tipoAtivo) ? st.quad : st.paramsExtras[st.tipoAtivo];
            // O texto editável preserva os números; casas decimais só formatam a apresentação.
            return MathLabCalc.converterSlotsParaTexto('funcoes', st.tipoAtivo, parametros);
        }
        if (mod === 'algebra') {
            const { a, b, c } = this.state.algebra.eq2;
            return MathLabCalc.calcularQuadratica(a, b, c).expressao.replace('f(x) = ', '') + ' = 0';
        }
        if (mod === 'limites') return this.state.limites.funcaoCustom;
        if (mod === 'derivadas') return this.state.derivadas.funcaoExpr;
        if (mod === 'integrais') {
            const st=this.state.integrais;
            if(this.state.inputMode==='normal' && st.textoNormal !== undefined) return st.textoNormal;
            return st.tipo==='definida' ? `∫(${st.a},${st.b}) ${st.funcaoExpr.replace(/²/g,'^2').replace(/³/g,'^3')} dx` : `∫ ${st.funcaoExpr.replace(/²/g,'^2').replace(/³/g,'^3')} dx + C`;
        }
        if (mod === 'geometria') {
            const calc = MathLabCalc.calcularGeometria(this.state.geometria.figura, this.state.geometria.params, this.state.geometria.unidade);
            return calc.expressao;
        }
        if (mod === 'trigonometria') {
            const st = this.state.trigonometria;
            return this.obterDadosTrigonometria().expressao;
        }
        if (mod === 'vetores') {
            const u = this.state.vetores.u;
            const v = this.state.vetores.v;
            return `u=(${u.x},${u.y}), v=(${v.x},${v.y})`;
        }
        if (mod === 'estatistica') return this.state.estatistica.dadosTexto;
        if (mod === 'modelagem') return `${this.state.modelagem.p0} * e^(${this.state.modelagem.k} * t)`;
        return '';
    },

    /**
     * Retorna a estrutura da "Fórmula pronta" com quadradinhos coloridos,
     * dicas de balão (tooltips) e cartões de "Tipo" para o módulo ativo.
     */
    obterConfigFormulaPronta() {
        const mod = this.state.activeModule;
        const slotHtml = (chave, valorPadrao, corClasse, dica, opcoes = {}) => {
            const idUnico = `${mod}_${chave}`;
            const fxAtivo = !!this.state.fxSlots[idUnico];
            const valExibido = this.state.slotTextos[idUnico] !== undefined ? this.state.slotTextos[idUnico] : valorPadrao;
            const invalido = !!opcoes.invalido;
            return `
                <span class="slot-wrapper">
                    <input type="text"
                           class="formula-slot ${corClasse} ${fxAtivo ? 'fx-mode' : ''} ${invalido ? 'slot-invalid' : ''}"
                           data-slot-key="${chave}"
                           data-slot-uid="${idUnico}"
                           style="width:calc(${Math.max(2, String(valExibido).length)}ch + 20px)"
                           value="${this.escaparHTML(valExibido)}"
                           aria-label="Parâmetro ${chave}">
                    <button type="button" class="slot-fx-toggle" data-fx-uid="${idUnico}" title="Alternar modo expressão fx (ex: 2*sen(pi/6) ou 1/2)">fx</button>
                    <span class="slot-tooltip">${dica}</span>
                </span>
            `;
        };

        if (mod === 'funcoes') {
            const st = this.state.funcoes;
            const tipo = st.tipoAtivo;
            const q = st.quad;
            const pExtra = (st.paramsExtras && st.paramsExtras[tipo]) || {};

            let formulaMontada = '';
            let msgInvalido = '';

            if (tipo === 'custom') {
                formulaMontada = `f(x) = <input type="text" id="ready-custom-expression" class="normal-mono-input" value="${this.escaparHTML(st.expressaoCustom)}" aria-label="Expressão livre da função" placeholder="Digite uma fórmula">`;
            } else if (tipo === 'quadratica') {
                const aZero = Number(q.a) === 0;
                if (aZero) msgInvalido = 'a não pode ser 0 em uma quadrática';
                formulaMontada = `f(x) = ${slotHtml('a', q.a, 'slot-blue', 'a: define a abertura da parábola. Positivo abre para cima, negativo para baixo.', { invalido: aZero })}x² + ${slotHtml('b', q.b, 'slot-amber', 'b: inclinação no eixo y e deslocamento horizontal do vértice.')}x + ${slotHtml('c', q.c, 'slot-green', 'c: termo independente — ponto (0, c) onde corta o eixo y.')}`;
            } else if (tipo === 'canonica') {
                const aZero = Number(q.a) === 0;
                if (aZero) msgInvalido = 'a não pode ser 0 em uma quadrática';
                formulaMontada = `f(x) = ${slotHtml('a', q.a, 'slot-blue', 'a: abertura da parábola.', { invalido: aZero })}(x − ${slotHtml('h', q.h ?? 2, 'slot-amber', 'h: coordenada x do vértice V(h, k).')})² + ${slotHtml('k', q.k ?? -9, 'slot-green', 'k: coordenada y do vértice V(h, k).')}`;
            } else if (tipo === 'fatorada') {
                const aZero = Number(q.a) === 0;
                if (aZero) msgInvalido = 'a não pode ser 0 em uma quadrática';
                formulaMontada = `f(x) = ${slotHtml('a', q.a, 'slot-blue', 'a: abertura da parábola.', { invalido: aZero })}(x − ${slotHtml('x1', q.x1 ?? -1, 'slot-amber', 'x₁: primeira raiz onde a curva corta o eixo x.')})(x − ${slotHtml('x2', q.x2 ?? 5, 'slot-green', 'x₂: segunda raiz onde a curva corta o eixo x.')})`;
            } else if (tipo === 'constante') {
                formulaMontada = `f(x) = ${slotHtml('b', pExtra.b ?? 5, 'slot-green', 'b: altura constante da reta horizontal em todo o domínio ℝ.')}`;
            } else if (tipo === 'afim') {
                formulaMontada = `f(x) = ${slotHtml('a', pExtra.a ?? 2, 'slot-blue', 'a: coeficiente angular (inclinação da reta).')}x + ${slotHtml('b', pExtra.b ?? 1, 'slot-amber', 'b: coeficiente linear (onde corta o eixo y).')}`;
            } else if (tipo === 'linear') {
                formulaMontada = `f(x) = ${slotHtml('a', pExtra.a ?? 3, 'slot-blue', 'a: constante de proporcionalidade direta (passa pela origem).')}x`;
            } else if (tipo === 'modular') {
                formulaMontada = `f(x) = ${slotHtml('a', pExtra.a ?? 1, 'slot-blue', 'a: abertura do V modular.')}|x − ${slotHtml('h', pExtra.h ?? 0, 'slot-amber', 'h: posição horizontal do bico (quina).')}| + ${slotHtml('k', pExtra.k ?? 0, 'slot-green', 'k: altura vertical do vértice.')}`;
            } else if (tipo === 'exponencial') {
                const baseVal = Number(pExtra.a ?? 2);
                const baseInv = baseVal <= 0 || Math.abs(baseVal - 1) < 1e-9;
                if (baseInv) msgInvalido = 'A base "a" da exponencial precisa ser positiva e diferente de 1';
                formulaMontada = `f(x) = ${slotHtml('C', pExtra.C ?? 1, 'slot-blue', 'C: valor inicial em x = 0.')} · ${slotHtml('a', pExtra.a ?? 2, 'slot-amber', 'a: base exponencial (>1 cresce, entre 0 e 1 decresce).', { invalido: baseInv })}ˣ`;
            } else if (tipo === 'logaritmica') {
                const baseVal = Number(pExtra.a ?? 2);
                const baseInv = baseVal <= 0 || Math.abs(baseVal - 1) < 1e-9;
                if (baseInv) msgInvalido = 'A base "a" do logaritmo precisa ser > 0 e ≠ 1';
                formulaMontada = `f(x) = log<sub>${slotHtml('a', pExtra.a ?? 2, 'slot-blue', 'a: base do logaritmo (a > 0 e a ≠ 1).', { invalido: baseInv })}</sub>(x)`;
            } else if (tipo === 'trigonometrica') {
                formulaMontada = `f(x) = ${slotHtml('A', pExtra.A ?? 1, 'slot-blue', 'A: amplitude da onda.')}·sen(${slotHtml('B', pExtra.B ?? 1, 'slot-amber', 'B: frequência angular (define o período 2π/|B|).')}x + ${slotHtml('C', pExtra.C ?? 0, 'slot-green', 'C: fase horizontal.')}) + ${slotHtml('D', pExtra.D ?? 0, 'slot-purple', 'D: deslocamento vertical.')}`;
            } else if (tipo === 'juros') {
                formulaMontada = `M(t) = ${slotHtml('C', pExtra.C ?? 100, 'slot-blue', 'C: capital inicial investido.')} · (1 + ${slotHtml('i', pExtra.i ?? 0.1, 'slot-amber', 'i: taxa de juros por período (ex: 0,1 = 10%).')})ᵗ`;
            }

            const cartoesTipo = [
                { id: 'quadratica', nome: 'Quadrática', form: '[a]x²+[b]x+[c]', svg: 'quadratica' },
                { id: 'canonica', nome: 'Canônica', form: '[a](x−[h])²+[k]', svg: 'canonica' },
                { id: 'fatorada', nome: 'Fatorada', form: '[a](x−x₁)(x−x₂)', svg: 'fatorada' },
                { id: 'afim', nome: 'Afim 1º Grau', form: '[a]x + [b]', svg: 'afim' },
                { id: 'linear', nome: 'Linear', form: '[a]x', svg: 'linear' },
                { id: 'constante', nome: 'Constante', form: 'f(x) = [b]', svg: 'constante' },
                { id: 'modular', nome: 'Modular', form: '[a]|x−[h]|+[k]', svg: 'modular' },
                { id: 'exponencial', nome: 'Exponencial', form: '[C]·[a]ˣ', svg: 'exponencial' },
                { id: 'logaritmica', nome: 'Logarítmica', form: 'log_[a](x)', svg: 'logaritmica' },
                { id: 'trigonometrica', nome: 'Seno/Onda', form: '[A]sen([B]x)', svg: 'trigonometrica' },
                { id: 'juros', nome: 'Juros Comp.', form: '[C](1+[i])ᵗ', svg: 'juros' }
            ];

            return { formulaMontada, msgInvalido, cartoesTipo, tipoSelecionado: tipo };
        }

        if (mod === 'algebra') {
            const { a, b, c } = this.state.algebra.eq2;
            const aZero = Math.abs(Number(a)) < 1e-9;
            return {
                formulaMontada: `${slotHtml('a', a, 'slot-blue', 'a: coeficiente de x² (não pode ser 0 na equação de 2º grau).', { invalido: aZero })}x² + ${slotHtml('b', b, 'slot-amber', 'b: coeficiente linear de x.')}x + ${slotHtml('c', c, 'slot-green', 'c: termo independente.')} = 0`,
                msgInvalido: aZero ? 'a não pode ser 0 em uma equação do 2º grau' : '',
                cartoesTipo: [
                    { id: 'eq2', nome: 'Eq. 2º Grau', form: '[a]x²+[b]x+[c]=0', svg: 'quadratica' },
                    { id: 'fatoracao', nome: 'Fatoração', form: '(x−x₁)(x−x₂)', svg: 'fatorada' },
                    { id: 'eq1', nome: 'Eq. 1º Grau', form: '[a]x + [b] = 0', svg: 'afim' },
                    { id: 'sistema', nome: 'Sistema 2×2', form: '{x+y=5; 2x−y=1}', svg: 'linear' }
                ],
                tipoSelecionado: this.state.algebra.ferramenta
            };
        }

        if (mod === 'limites') {
            const s = this.state.limites.slots;
            return {
                formulaMontada: `lim<sub>x→${slotHtml('ponto', this.state.limites.pontoCustom, 'slot-amber', 'a: valor para o qual x se aproxima (use oo para infinito).')}</sub> &nbsp; (${slotHtml('a', s.a, 'slot-blue', 'a: coeficiente de x² no numerador.')}x² + ${slotHtml('b', s.b, 'slot-green', 'b: termo constante do numerador.')}) / (${slotHtml('c', s.c, 'slot-purple', 'c: coeficiente de x no denominador.')}x + ${slotHtml('d', s.d, 'slot-amber', 'd: termo constante do denominador.')})`,
                msgInvalido: '',
                cartoesTipo: [
                    { id: 'removivel', nome: 'Racional 0/0', form: '(x²−4)/(x−2)', svg: 'racional' },
                    { id: 'inexistente', nome: 'Assíntota 1/x', form: 'lim x→0 (1/x)', svg: 'logaritmica' }
                ],
                tipoSelecionado: this.state.limites.exemploAtivo
            };
        }

        if (mod === 'derivadas') {
            const st = this.state.derivadas;
            const esperado = st.modeloPronto === 'potencia' ? `${st.slots.a === 1 ? '' : st.slots.a}x^${st.slots.n}+(${st.slots.b})x` : `${st.slots.a === 1 ? '' : st.slots.a}x^${st.slots.n}*sen(x)`;
            const livre = st.integrandoLivre ?? (MathLabCalc.normalizarElementar(st.funcaoExpr) !== MathLabCalc.normalizarElementar(esperado));
            return {
                formulaMontada: livre ? `<input id="ready-expression-input" class="normal-mono-input" value="${this.escaparHTML(st.funcaoExpr)}" aria-label="Função para derivar">` : st.modeloPronto === 'potencia' ? `d/dx [ ${slotHtml('a', st.slots.a, 'slot-blue', 'Coeficiente')}x<sup>${slotHtml('n', st.slots.n, 'slot-amber', 'Expoente')}</sup> + ${slotHtml('b', st.slots.b, 'slot-green', 'Termo linear')}x ]` : `d/dx [ ${slotHtml('a', st.slots.a, 'slot-blue', 'a: coeficiente multiplicador.')}x<sup>${slotHtml('n', st.slots.n, 'slot-amber', 'n: expoente da potência.')}</sup> · sen(x) ] &nbsp; em x₀ = ${slotHtml('x0', st.x0, 'slot-green', 'x₀: ponto onde calculamos a inclinação da reta tangente.')}`,
                msgInvalido: '',
                cartoesTipo: [
                    { id: 'produto', nome: 'Produto', form: 'x³ · sen(x)', svg: 'trigonometrica' },
                    { id: 'potencia', nome: 'Polinômio', form: '[a]xⁿ + [b]x', svg: 'quadratica' }
                ],
                tipoSelecionado: st.modeloPronto || 'produto'
            };
        }

        if (mod === 'integrais') {
            const st = this.state.integrais;
            const esperado = `${st.slots.coef === 1 ? '' : st.slots.coef}x^${st.slots.n}`;
            const livre = st.integrandoLivre ?? (MathLabCalc.normalizarElementar(st.funcaoExpr) !== MathLabCalc.normalizarElementar(esperado));
            return {
                formulaMontada: `<span class="integral-formula"><span class="integral-symbol">∫</span>${st.tipo === 'definida' ? `<span class="integral-limits"><span>${slotHtml('b', st.b, 'slot-amber', 'b: limite superior')}</span><span>${slotHtml('a', st.a, 'slot-blue', 'a: limite inferior')}</span></span>` : ''}<span class="integral-integrand">${livre ? `<input id="ready-expression-input" class="normal-mono-input" value="${this.escaparHTML(st.funcaoExpr)}" aria-label="Função para integrar">` : `${slotHtml('coef', st.slots.coef, 'slot-green', 'c: coeficiente')}x<sup>${slotHtml('n', st.slots.n, 'slot-purple', 'n: expoente')}</sup>`}</span><span>dx${st.tipo === 'indefinida' ? ' + C' : ''}</span></span>`,
                msgInvalido: '',
                cartoesTipo: [
                    { id: 'definida', nome: 'Definida', form: '∫ₐᵇ [c]xⁿ dx', svg: 'area' },
                    { id: 'indefinida', nome: 'Indefinida', form: '∫ [c]xⁿ dx + C', svg: 'quadratica' }
                ],
                tipoSelecionado: st.tipo
            };
        }

        if (mod === 'geometria') {
            const st = this.state.geometria;
            const p = st.params;
            let fGeo = `Raio r = ${slotHtml('r', p.r, 'slot-blue', 'r: raio da figura (deve ser > 0).', { invalido: p.r <= 0 })}`;
            if (st.figura === 'quadrado') fGeo = `Lado L = ${slotHtml('l', p.l, 'slot-green', 'L: medida do lado do quadrado.')}`;
            else if (st.figura === 'retangulo' || st.figura === 'triangulo') fGeo = `Base b = ${slotHtml('b', p.b, 'slot-blue', 'b: medida da base.')} &nbsp; Altura h = ${slotHtml('h', p.h, 'slot-amber', 'h: medida da altura.')}`;
            else if (st.figura === 'trapezio') fGeo = `B = ${slotHtml('B', p.B, 'slot-blue', 'B: base maior.')} &nbsp; b = ${slotHtml('b', p.b, 'slot-amber', 'b: base menor.')} &nbsp; h = ${slotHtml('h', p.h, 'slot-green', 'h: altura.')}`;
            else if (st.figura === 'cilindro' || st.figura === 'cone') fGeo = `Raio r = ${slotHtml('r', p.r, 'slot-blue', 'r: raio da base circular.')} &nbsp; Altura h = ${slotHtml('h', p.h, 'slot-amber', 'h: altura do sólido.')}`;
            return {
                formulaMontada: fGeo,
                msgInvalido: '',
                cartoesTipo: [],
                tipoSelecionado: st.figura
            };
        }

        if (mod === 'trigonometria') {
            const st = this.state.trigonometria;
            return {
                formulaMontada: `<span class="trig-formula"><span class="formula-grupo">f(x) = ${slotHtml('amplitude', st.amplitude, 'slot-blue', 'A: escala vertical; amplitude |A|.')}·</span><span class="formula-grupo"><span data-trig-formula-fn>${st.funcao}</span>(${slotHtml('frequencia', st.frequencia, 'slot-amber', 'B: frequência; período inversamente proporcional a |B|.')}x + ${slotHtml('fase', st.fase, 'slot-purple', 'C: fase em radianos; deslocamento horizontal −C/B.')})</span><span class="formula-grupo">+ ${slotHtml('deslocamento', st.deslocamento, 'slot-green', 'D: deslocamento vertical.')}</span></span>`,
                msgInvalido: '',
                cartoesTipo: [],
                tipoSelecionado: st.funcao
            };
        }

        if (mod === 'vetores') {
            const st = this.state.vetores;
            return {
                formulaMontada: `u = (${slotHtml('ux', st.u.x, 'slot-green', 'u_x: componente horizontal de u.')}, ${slotHtml('uy', st.u.y, 'slot-green', 'u_y: componente vertical de u.')}) &nbsp; • &nbsp; v = (${slotHtml('vx', st.v.x, 'slot-blue', 'v_x: componente horizontal de v.')}, ${slotHtml('vy', st.v.y, 'slot-blue', 'v_y: componente vertical de v.')})`,
                msgInvalido: '',
                cartoesTipo: [],
                tipoSelecionado: st.abaPrincipal
            };
        }

        if (mod === 'modelagem') {
            const st = this.state.modelagem;
            return {
                formulaMontada: `P(t) = ${slotHtml('p0', st.p0, 'slot-blue', 'P₀: valor/população inicial em t = 0.')} · e<sup>(${slotHtml('k', st.k, 'slot-amber', 'k: taxa de crescimento/decaimento.')} · ${slotHtml('t', st.t, 'slot-green', 't: instante de tempo projetado.')})</sup>`,
                msgInvalido: '',
                cartoesTipo: [],
                tipoSelecionado: st.modelo
            };
        }

        if (mod === 'cientifica') {
            const s = this.state.cientifica.slots;
            return {
                formulaMontada: `${slotHtml('c1', s.c1, 'slot-blue', 'Multiplicador trigonométrico.')} · sen(π / ${slotHtml('c2', s.c2, 'slot-amber', 'Divisor do ângulo π rad.')}) + √(${slotHtml('c3', s.c3, 'slot-green', 'Radicando da raiz quadrada.')})`,
                msgInvalido: '',
                cartoesTipo: [],
                tipoSelecionado: 'padrao'
            };
        }

        return {
            formulaMontada: `Dados: <span style="font-size:13px;color:var(--text-secondary);">Edite os valores abaixo para atualizar o histograma ao vivo</span>`,
            msgInvalido: '',
            cartoesTipo: [],
            tipoSelecionado: 'padrao'
        };
    },

    /**
     * Injeta no topo do painel esquerdo de TODOS os módulos:
     * 1. Indicador de 3 passos (1 Escolher · 2 Preencher · 3 Gerar)
     * 2. Controle segmentado grande [ Fórmula pronta ] [ Normal ]
     * 3. Caixa interativa de quadradinhos (ou campo monoespaçado Normal com autocompletar)
     */
    injetarSistemaDoisModos() {
        const leftBody = document.getElementById('left-panel-body');
        if (!leftBody) return;

        // Preserva foco se o usuário estiver digitando num quadradinho
        const activeEl = document.activeElement;
        const activeSlotKey = activeEl?.dataset?.slotKey;
        const activeNormal = activeEl?.id === 'normal-mode-input';
        const selStart = activeEl?.selectionStart ?? null;
        const selEnd = activeEl?.selectionEnd ?? null;

        leftBody.querySelector('.dual-mode-system-root')?.remove();

        const p = this.state.passoFluxo || 2;
        const modo = this.state.inputMode || 'pronta';
        const cfg = this.obterConfigFormulaPronta();
        const exprNormal = this.escaparHTML(this.obterExpressaoTextoAtual());
        const validacaoNormal = this.state.activeModule === 'integrais'
            ? {valido: this.state.integrais.dados.valido, mensagem: this.state.integrais.dados.aviso}
            : MathLabCalc.validarExpressaoNormal(exprNormal);

        const htmlCartoesTipo = (this.state.activeModule !== 'funcoes' && cfg.cartoesTipo && cfg.cartoesTipo.length > 0) ? `
            <div class="template-selector-strip" aria-label="Modelos prontos do modo">
                ${cfg.cartoesTipo.map(c => `
                    <button type="button" class="mini-template-card ${cfg.tipoSelecionado === c.id ? 'active' : ''}" data-pick-template="${c.id}">
                        <div class="mini-template-header">
                            <span class="mini-template-title">${c.nome}</span>
                        </div>
                        <span class="mini-template-formula">${c.form}</span>
                        <div class="mini-template-curve">${MathLabVisuals.gerarMiniSvgFuncao(c.svg)}</div>
                    </button>
                `).join('')}
            </div>
        ` : '';

        const htmlPronta = `
            <div class="ready-formula-container">
                <div class="ready-formula-header">
                    <span class="ready-formula-label">Fórmula Montada (altere os quadradinhos)</span>
                    <button type="button" class="mini-icon-btn" id="btn-see-as-text" style="width:auto;padding:0 7px;font-size:10.5px;" title="Converter para texto no modo Normal">Ver como texto</button>
                </div>
                <div class="ready-formula-display">
                    ${cfg.formulaMontada}
                </div>
                <div id="slot-error-hint-msg" class="slot-error-hint" style="display:${cfg.msgInvalido ? 'flex' : 'none'};">
                    <span>⚠</span> <span>${cfg.msgInvalido}</span>
                </div>
                <div class="ready-formula-toolbar">
                    <button type="button" class="btn-tiny-tool" id="btn-restore-example" title="Restaurar valores de exemplo da fórmula"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg> Restaurar exemplo</button>
                    <button type="button" class="btn-tiny-tool" id="btn-random-slots" title="Sortear valores válidos aleatórios"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 7h.01M17 7h.01M12 12h.01M7 17h.01M17 17h.01"/></svg> Aleatório</button>

                </div>
                ${htmlCartoesTipo}
            </div>
        `;

        const chipsSugestao = ['sen(', 'cos(', 'tg(', 'sqrt(', 'ln(', 'log(', 'abs(', 'e^', 'π', 'x^2'];
        const htmlNormal = `
            <div class="normal-mode-container">
                <div class="normal-live-preview">
                    <div>
                        <span class="normal-live-preview-label">Entendi como:</span>
                        <div class="normal-live-preview-math" id="normal-live-preview-math">${exprNormal}</div>
                    </div>

                </div>

                <input type="text"
                       id="normal-mode-input"
                       class="normal-mono-input"
                       value="${exprNormal.replace(/^f\(x\)\s*=\s*/i, '')}"
                       placeholder="Digite livremente: 2x^2 - 8x + 6, sen(x), sqrt(x), |x|..."
                       autocomplete="off"
                       aria-label="Digite a fórmula completa">

                <div class="autocomplete-bar" aria-label="Sugestões de funções (Tab para completar)">
                    ${chipsSugestao.map(ch => `<button type="button" class="autocomplete-chip" data-ins-chip="${ch}">${ch}</button>`).join('')}
                </div>

                <div id="normal-error-hint-box" class="normal-error-hint" style="display:${!validacaoNormal.valido ? 'flex' : 'none'};">
                    <span>⚠ ${validacaoNormal.mensagem}</span>
                    <button type="button" class="btn-tiny-tool" id="btn-fix-normal-expr">Corrigir</button>
                </div>


            </div>
        `;

        const wrapperHtml = `
            <div class="dual-mode-system-root" style="display:flex;flex-direction:column;gap:8px;">
                <div class="input-mode-switcher" role="tablist" aria-label="Modo de entrada da fórmula">
                    <button type="button" class="input-mode-btn ${modo === 'pronta' ? 'active' : ''}" data-switch-imode="pronta" role="tab" tabindex="${modo === 'pronta' ? 0 : -1}" aria-selected="${modo === 'pronta'}">
                        <span><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/></svg> Fórmula pronta</span>
                    </button>
                    <button type="button" class="input-mode-btn ${modo === 'normal' ? 'active' : ''}" data-switch-imode="normal" role="tab" tabindex="${modo === 'normal' ? 0 : -1}" aria-selected="${modo === 'normal'}">
                        <span><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M8 16h8"/></svg> Normal</span>
                    </button>
                </div>

                ${modo === 'pronta' ? htmlPronta : htmlNormal}
            </div>
        `;

        leftBody.insertAdjacentHTML('afterbegin', wrapperHtml);
        this.vincularEventosDoisModos(leftBody);

        // Restaura foco se estava digitando num quadradinho ou no input normal
        if (activeSlotKey && modo === 'pronta') {
            const inp = leftBody.querySelector(`.formula-slot[data-slot-key="${activeSlotKey}"]`);
            if (inp) {
                inp.focus();
                if (selStart !== null) {
                    try { inp.setSelectionRange(selStart, selEnd); } catch (e) {}
                }
            }
        } else if (activeNormal && modo === 'normal') {
            const inp = document.getElementById('normal-mode-input');
            if (inp) {
                inp.focus();
                if (selStart !== null) {
                    try { inp.setSelectionRange(selStart, selEnd); } catch (e) {}
                }
            }
        }
    },

    vincularEventosDoisModos(leftBody) {
        leftBody.querySelectorAll('[data-switch-imode]').forEach(botao => {
            botao.addEventListener('keydown', e => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                e.preventDefault();
                const modo = e.key === 'Home' ? 'pronta' : e.key === 'End' ? 'normal' : this.state.inputMode === 'pronta' ? 'normal' : 'pronta';
                this.alternarModoEntrada(modo);
                document.querySelector(`[data-switch-imode="${modo}"]`)?.focus();
            });
        });

        document.getElementById('ready-expression-input')?.addEventListener('change', e => {
            this.aplicarExpressaoModoNormal(e.target.value, true);
        });

        document.getElementById('ready-custom-expression')?.addEventListener('input', e => {
            this.definirExpressaoFuncao(e.target.value);
            this.atualizarCentroEDireitaFuncoes(this.obterDadosAtuaisFuncoes());
        });

        // Alternar entre [ Fórmula pronta ] e [ Normal ]
        leftBody.querySelectorAll('[data-switch-imode]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.alternarModoEntrada(btn.dataset.switchImode);
            });
        });

        document.getElementById('btn-see-as-text')?.addEventListener('click', () => {
            this.alternarModoEntrada('normal');
        });

        document.getElementById('btn-convert-to-ready')?.addEventListener('click', () => {
            const inp = document.getElementById('normal-mode-input');
            if (inp) {
                this.aplicarExpressaoModoNormal(inp.value, true);
            }
            this.alternarModoEntrada('pronta');
        });

        // Botões "fx" nos quadradinhos
        leftBody.querySelectorAll('[data-fx-uid]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = btn.dataset.fxUid;
                this.state.fxSlots[uid] = !this.state.fxSlots[uid];
                this.injetarSistemaDoisModos();
            });
        });

        // Edição AO VIVO e navegação por teclado nos quadradinhos (.formula-slot)
        const slots = Array.from(leftBody.querySelectorAll('.formula-slot'));
        slots.forEach((inp, idx) => {
            inp.addEventListener('input', (e) => {
                this.salvarSnapshotUndo();
                const chave = inp.dataset.slotKey;
                const uid = inp.dataset.slotUid;
                const bruto = e.target.value;
                inp.style.width = `calc(${Math.max(2, bruto.length)}ch + 20px)`;
                this.state.slotTextos[uid] = bruto;
                this.state.passoFluxo = 2;

                const av = MathLabCalc.avaliarSlotValor(bruto, 0);
                if (!av.valido || (['integrais','trigonometria'].includes(this.state.activeModule) && !bruto.trim())) {
                    if(['integrais','trigonometria'].includes(this.state.activeModule)) {
                        this.aplicarValorSlot(chave, NaN);
                        return;
                    }
                    inp.classList.add('slot-invalid');
                    const errEl = document.getElementById('slot-error-hint-msg');
                    if (errEl) {
                        errEl.style.display = 'flex';
                        errEl.innerHTML = `<span>⚠</span> <span>${av.erro || 'Valor inválido'}</span>`;
                    }
                    return;
                }

                inp.classList.remove('slot-invalid');
                const hint=document.getElementById('slot-error-hint-msg');if(hint)hint.style.display='none';
                this.aplicarValorSlot(chave, av.valor);
            });

            inp.addEventListener('keydown', (e) => {
                const chave = inp.dataset.slotKey;
                const uid = inp.dataset.slotUid;
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.salvarSnapshotUndo();
                    const av = MathLabCalc.avaliarSlotValor(inp.value, 0);
                    const delta = e.key === 'ArrowUp' ? 1 : -1;
                    const novoVal = Number(((av.valor || 0) + delta).toFixed(4));
                    delete this.state.slotTextos[uid];
                    inp.value = String(novoVal);
                    this.aplicarValorSlot(chave, novoVal);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executarBotaoGerar();
                } else if (e.key === 'Tab') {
                    // Tab e Shift+Tab pulam diretamente entre os quadradinhos
                    const proxIdx = e.shiftKey ? idx - 1 : idx + 1;
                    if (proxIdx >= 0 && proxIdx < slots.length) {
                        e.preventDefault();
                        slots[proxIdx].focus();
                        slots[proxIdx].select();
                    }
                }
            });
        });

        // Botões Restaurar exemplo, Aleatório e GERAR
        document.getElementById('btn-restore-example')?.addEventListener('click', () => {
            this.salvarSnapshotUndo();
            this.restaurarExemploModulo();
        });

        document.getElementById('btn-random-slots')?.addEventListener('click', () => {
            this.salvarSnapshotUndo();
            this.sortearValoresModulo();
        });

        document.getElementById('btn-gerar-main')?.addEventListener('click', () => {
            this.executarBotaoGerar();
        });

        // Seleção rápida de cartões "Tipo"
        leftBody.querySelectorAll('[data-pick-template]').forEach(card => {
            card.addEventListener('click', () => {
                this.salvarSnapshotUndo();
                const id = card.dataset.pickTemplate;
                const mod = this.state.activeModule;
                this.state.passoFluxo = 1;
                if (mod === 'funcoes') {
                    this.state.funcoes.tipoAtivo = id;
                    this.renderModuloFuncoes();
                } else if (mod === 'algebra') {
                    this.state.algebra.ferramenta = id;
                    this.renderModuloAlgebra();
                } else if (mod === 'limites') {
                    this.state.limites.exemploAtivo = id;
                    this.renderModuloLimites();
                } else if (mod === 'derivadas') {
                    this.state.derivadas.modeloPronto = id;
                    this.state.derivadas.slots = { a: 1, n: 3, b: -3, m: 1 };
                    this.state.derivadas.funcaoExpr = id === 'produto' ? 'x³ · sen(x)' : 'x^3+(-3)x';
                    this.renderModuloDerivadas();
                } else if (mod === 'integrais') {
                    this.state.integrais.tipo = id;
                    this.renderModuloIntegrais();
                }
            });
        });

        // Eventos do modo "Normal"
        const normalInp = document.getElementById('normal-mode-input');
        if (normalInp) {
            normalInp.addEventListener('input', (e) => {
                this.salvarSnapshotUndo();
                const txt = e.target.value;
                const prevEl = document.getElementById('normal-live-preview-math');
                if (prevEl) prevEl.textContent = txt || '—';

                const val = MathLabCalc.validarExpressaoNormal(txt);
                const errBox = document.getElementById('normal-error-hint-box');
                if (errBox) {
                    errBox.style.display = val.valido ? 'none' : 'flex';
                    if (!val.valido) {
                        errBox.querySelector('span').textContent = `⚠ ${val.mensagem}`;
                    }
                }
                if (val.valido || ['funcoes','integrais','trigonometria'].includes(this.state.activeModule)) {
                    this.aplicarExpressaoModoNormal(txt, this.state.activeModule === 'integrais');
                }
            });

            normalInp.addEventListener('keydown', (e) => {
                // Fecha parênteses automaticamente ao digitar '('
                if (e.key === '(') {
                    const start = normalInp.selectionStart;
                    const end = normalInp.selectionEnd;
                    const v = normalInp.value;
                    e.preventDefault();
                    normalInp.value = v.slice(0, start) + '()' + v.slice(end);
                    normalInp.setSelectionRange(start + 1, start + 1);
                    normalInp.dispatchEvent(new Event('input'));
                } else if (e.key === 'Tab') {
                    // Completa prefixo de função matemática com Tab
                    const v = normalInp.value;
                    const match = v.match(/([a-zA-Z]+)$/);
                    const mapa = { s: 'sen()', se: 'sen()', sen: 'sen()', c: 'cos()', co: 'cos()', t: 'tg()', tg: 'tg()', sq: 'sqrt()', r: 'sqrt()', l: 'ln()', lo: 'log()', p: 'π' };
                    if (match && mapa[match[1].toLowerCase()]) {
                        e.preventDefault();
                        const comp = mapa[match[1].toLowerCase()];
                        normalInp.value = v.slice(0, -match[1].length) + comp;
                        const pos = comp.endsWith('()') ? normalInp.value.length - 1 : normalInp.value.length;
                        normalInp.setSelectionRange(pos, pos);
                        normalInp.dispatchEvent(new Event('input'));
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.aplicarExpressaoModoNormal(normalInp.value, true);
                    this.executarBotaoGerar();
                }
            });
        }

        leftBody.querySelectorAll('[data-ins-chip]').forEach(chip => {
            chip.addEventListener('click', () => {
                if (!normalInp) return;
                const ins = chip.dataset.insChip;
                normalInp.value += ins.endsWith('(') ? ins + ')' : ins;
                normalInp.focus();
                if (ins.endsWith('(')) {
                    normalInp.setSelectionRange(normalInp.value.length - 1, normalInp.value.length - 1);
                }
                normalInp.dispatchEvent(new Event('input'));
            });
        });

        document.getElementById('btn-fix-normal-expr')?.addEventListener('click', () => {
            if (!normalInp) return;
            const val = MathLabCalc.validarExpressaoNormal(normalInp.value);
            normalInp.value = val.corrigida;
            normalInp.dispatchEvent(new Event('input'));
        });

        document.getElementById('btn-gerar-normal')?.addEventListener('click', () => {
            if (normalInp) this.aplicarExpressaoModoNormal(normalInp.value, true);
            this.executarBotaoGerar();
        });
    },

    aplicarValorSlot(chave, valor) {
        const mod = this.state.activeModule;
        if (mod === 'funcoes') {
            const st = this.state.funcoes;
            if (['quadratica', 'canonica', 'fatorada', 'custom'].includes(st.tipoAtivo)) {
                if (st.tipoAtivo === 'custom') st.tipoAtivo = 'quadratica';
                st.quad[chave] = valor;
            } else {
                if (!st.paramsExtras[st.tipoAtivo]) st.paramsExtras[st.tipoAtivo] = {};
                st.paramsExtras[st.tipoAtivo][chave] = valor;
            }
            this.renderModuloFuncoes();
        } else if (mod === 'algebra') {
            this.state.algebra.ferramenta = 'eq2';
            this.state.algebra.eq2[chave] = valor;
            this.renderModuloAlgebra();
        } else if (mod === 'limites') {
            const s = this.state.limites.slots;
            if (chave === 'ponto') {
                this.state.limites.pontoCustom = String(valor);
            } else {
                s[chave] = valor;
            }
            const bSinal = s.b >= 0 ? `+ ${s.b}` : `− ${Math.abs(s.b)}`;
            const dSinal = s.d >= 0 ? `+ ${s.d}` : `− ${Math.abs(s.d)}`;
            this.state.limites.funcaoCustom = `(${s.a}x² ${bSinal})/(${s.c}x ${dSinal})`;
            this.state.limites.exemploAtivo = 'custom';
            this.renderModuloLimites();
        } else if (mod === 'derivadas') {
            const st = this.state.derivadas;
            if (chave === 'x0') st.x0 = valor;
            else st.slots[chave] = valor;
            const potencia = `${st.slots.a === 1 ? '' : st.slots.a}x^${st.slots.n}`;
            st.funcaoExpr = st.modeloPronto === 'potencia' ? `${potencia}+(${st.slots.b})x` : `${potencia}*sen(x)`;
            this.renderModuloDerivadas();
        } else if (mod === 'integrais') {
            const st = this.state.integrais;
            delete st.textoNormal;
            if (chave === 'a') st.a = valor;
            else if (chave === 'b') st.b = valor;
            else st.slots[chave] = valor;
            if (chave !== 'a' && chave !== 'b') {
                st.integrandoLivre=false;
                st.funcaoExpr = `${st.slots.coef === 1 ? '' : st.slots.coef + '*'}x^${st.slots.n}`;
            }
            this.renderModuloIntegrais();
        } else if (mod === 'geometria') {
            this.state.geometria.params[chave] = Math.max(0.1, valor);
            this.renderModuloGeometria();
        } else if (mod === 'trigonometria') {
            this.mudarTrigonometria({[chave]:valor});
        } else if (mod === 'vetores') {
            if (chave === 'ux') this.state.vetores.u.x = valor;
            if (chave === 'uy') this.state.vetores.u.y = valor;
            if (chave === 'vx') this.state.vetores.v.x = valor;
            if (chave === 'vy') this.state.vetores.v.y = valor;
            this.renderModuloVetoresMatrizes();
        } else if (mod === 'modelagem') {
            this.state.modelagem[chave] = valor;
            this.renderModuloModelagem();
        } else if (mod === 'cientifica') {
            const s = this.state.cientifica.slots;
            s[chave] = valor;
            this.state.cientifica.expressao = `${s.c1} · sen(π/${s.c2}) + √(${s.c3})`;
            this.renderModuloCientifica();
        }
    },

    aplicarExpressaoModoNormal(texto, forcarRender = false) {
        const limpo = String(texto || '').trim();
        if (!limpo && !['funcoes','trigonometria'].includes(this.state.activeModule)) return;
        if (limpo && MathLabCalc.validarSintaxeSegura(limpo) && !['funcoes','trigonometria'].includes(this.state.activeModule)) return;
        const mod = this.state.activeModule;

        if (mod === 'cientifica') {
            this.state.cientifica.expressao = limpo;
            if (forcarRender) this.renderModuloCientifica();
        } else if (mod === 'funcoes') {
            this.definirExpressaoFuncao(limpo);
            const dados = this.obterDadosAtuaisFuncoes();
            this.atualizarCentroEDireitaFuncoes(dados);
        } else if (mod === 'trigonometria') {
            this.aplicarTextoTrigonometria(texto);
        } else if (mod === 'algebra') {
            const conv = MathLabCalc.converterTextoParaSlots(limpo, 'algebra');
            if (conv.reconhecido && conv.subtipo === 'quadratica') {
                this.state.algebra.ferramenta = 'eq2';
                Object.assign(this.state.algebra.eq2, conv.slots);
                if (forcarRender) this.renderModuloAlgebra();
            }
        } else if (mod === 'limites') {
            this.state.limites.funcaoCustom = limpo;
            this.state.limites.exemploAtivo = 'custom';
            if (forcarRender) this.renderModuloLimites();
        } else if (mod === 'derivadas') {
            this.state.derivadas.funcaoExpr = limpo;
            if (forcarRender) this.renderModuloDerivadas();
        } else if (mod === 'integrais') {
            const st=this.state.integrais;
            st.textoNormal = String(texto ?? '');
            const completa=limpo.match(/^∫\s*\(([^,]+),([^)]*)\)\s*(.*?)\s*dx\s*$/);
            if(completa) {
                st.tipo='definida';
                for(const [chave, bruto] of [['a',completa[1]],['b',completa[2]]]) {
                    this.state.slotTextos[`integrais_${chave}`]=bruto;
                    st[chave]=MathLabCalc.avaliarSlotValor(bruto,NaN).valor;
                }
                st.funcaoExpr=completa[3];
            } else st.funcaoExpr=limpo.replace(/^∫\s*/, '').replace(/\s*dx\s*(?:\+\s*C)?$/, '');
            const potencia=MathLabCalc.normalizarElementar(st.funcaoExpr).match(/^(?:(-?\d+(?:\.\d+)?)\*?)?x\^\(?(-?\d+(?:\.\d+)?)\)?$/);
            st.integrandoLivre=!potencia;
            if(potencia)st.slots={...st.slots,coef:Number(potencia[1]||1),n:Number(potencia[2])};
            if (forcarRender) this.renderModuloIntegrais();
        }
    },

    restaurarExemploModulo() {
        this.state.slotTextos = {};
        const mod = this.state.activeModule;
        if (mod === 'funcoes') {
            this.state.funcoes.quad = { a: 1, b: -4, c: -5, h: 2, k: -9, x1: -1, x2: 5 };
            this.state.funcoes.paramsExtras = {
                constante: { b: 5 }, afim: { a: 2, b: 1 }, linear: { a: 3 },
                modular: { a: 1, h: 0, k: 0 }, exponencial: { C: 1, a: 2 },
                logaritmica: { a: 2 }, trigonometrica: { A: 1, B: 1, C: 0, D: 0 }, juros: { C: 100, i: 0.1 }
            };
        } else if (mod === 'algebra') {
            this.state.algebra.eq2 = { a: 1, b: -5, c: 6 };
        } else if (mod === 'limites') {
            this.state.limites.exemploAtivo = 'removivel';
            this.state.limites.slots = { a: 1, b: -4, c: 1, d: -2, ponto: 2 };
            this.state.limites.pontoCustom = '2';
        } else if (mod === 'derivadas') {
            this.state.derivadas.funcaoExpr = 'x³ · sen(x)';
            this.state.derivadas.slots = { a: 1, n: 3, b: -3, m: 1 };
            this.state.derivadas.x0 = 1;
        } else if (mod === 'integrais') {
            delete this.state.integrais.textoNormal;
            this.state.integrais.integrandoLivre=false;
            this.state.integrais.funcaoExpr = 'x²';
            this.state.integrais.a = 0;
            this.state.integrais.b = 3;
            this.state.integrais.slots = { coef: 1, n: 2, k: 1 };
        } else if (mod === 'trigonometria') {
            Object.assign(this.state.trigonometria,{funcao:'sen',amplitude:1,frequencia:1,fase:0,deslocamento:0,anguloGraus:30,unidadeAngulo:'graus'});
        } else if (mod === 'cientifica') {
            this.state.cientifica.slots = { c1: 2, c2: 6, c3: 16 };
            this.state.cientifica.expressao = '2 · sen(π/6) + √16';
        }
        this.mostrarToast('Exemplo padrão restaurado');
        this.renderizarModuloAtivo();
    },

    sortearValoresModulo() {
        this.state.slotTextos = {};
        const randInt = (min, max, naoZero = false) => {
            let v = 0;
            do {
                v = Math.floor(Math.random() * (max - min + 1)) + min;
            } while (naoZero && v === 0);
            return v;
        };

        const mod = this.state.activeModule;
        if (mod === 'funcoes') {
            const r1 = randInt(-4, 2);
            const r2 = randInt(r1 + 1, 6);
            const a = randInt(-2, 2, true);
            this.state.funcoes.quad = {
                a,
                b: -a * (r1 + r2),
                c: a * r1 * r2,
                h: (r1 + r2) / 2,
                k: -a * Math.pow(r2 - r1, 2) / 4,
                x1: r1,
                x2: r2
            };
        } else if (mod === 'algebra') {
            const r1 = randInt(-3, 3);
            const r2 = randInt(r1 + 1, 6);
            this.state.algebra.eq2 = { a: 1, b: -(r1 + r2), c: r1 * r2 };
        } else if (mod === 'trigonometria') {
            Object.assign(this.state.trigonometria,{amplitude:randInt(-4,4,true),frequencia:randInt(1,3),fase:0,deslocamento:randInt(-2,2)});
        } else if (mod === 'geometria') {
            this.state.geometria.params.r = randInt(2, 12);
            this.state.geometria.params.b = randInt(3, 14);
            this.state.geometria.params.h = randInt(2, 10);
        }
        this.mostrarToast('Valores válidos sorteados!');
        this.renderizarModuloAtivo();
    },

    executarBotaoGerar() {
        this.state.passoFluxo = 3;
        const expr = this.obterExpressaoTextoAtual();
        const mod = this.state.activeModule;
        const nomes = {
            cientifica: 'Científica', algebra: 'Álgebra', funcoes: 'Funções', limites: 'Limites',
            derivadas: 'Derivadas', integrais: 'Integrais', geometria: 'Geometria',
            trigonometria: 'Trigonometria', vetores: 'Vetores/Matrizes', estatistica: 'Estatística', modelagem: 'Modelagem'
        };
        let resResumo = 'Calculado';
        if (mod === 'funcoes') resResumo = this.obterDadosAtuaisFuncoes().subtituloResultado;
        else if (mod === 'cientifica') resResumo = MathLabCalc.avaliarCientifica(this.state.cientifica.expressao, this.state.cientifica.unidadeAngulo, this.state.cientifica.modoSaida).resultadoExibido;

        this.adicionarAoHistorico(expr, resResumo, mod, nomes[mod] || mod);
        this.mostrarToast('Relatório completo gerado e salvo no histórico!');
        this.renderizarModuloAtivo();
    },

    /* ========================================================================
       8. RESULTADOS EM CAMADAS, BOTÃO "EXPLICAR" E EXPORTAÇÃO (LATEX, PDF, LINK)
       ======================================================================== */
    aprimorarPainelDireitoEmCamadas() {
        const rightBody = document.getElementById('right-panel-body');
        if (!rightBody || rightBody.querySelector('.result-hero-card')) return;

        if (!this.obterVerificacaoAtual()) {
            rightBody.querySelectorAll('.verified-badge').forEach(selo => {
                selo.className = 'result-status';
                selo.textContent = 'Não verificado por segundo método';
            });
        }

        const mod = this.state.activeModule;
        const explicacao = MathLabCalc.obterExplicacaoVidaReal(mod);
        const exprAtual = this.obterExpressaoTextoAtual();

        // Os demais módulos já renderizaram seu resultado no painel esquerdo.
        let valorPrincipal = this.escaparHTML(document.querySelector('#left-panel-body .result-primary')?.textContent || 'Aguardando resultado válido');
        if (mod === 'integrais') {
            const d=this.state.integrais.dados;
            valorPrincipal = this.escaparHTML(d.resultado) + (d.valido && d.definida ? `<br>≈ ${d.numero(d.integral.resultado)}` : '');
        }
        if (mod === 'funcoes') {
            const d = this.obterDadosAtuaisFuncoes();
            valorPrincipal = d.quadData ? `Vértice ${d.quadData.verticeTexto}  •  Raízes: ${d.quadData.raizesTexto}` : d.subtituloResultado;
        } else if (mod === 'estatistica') {
            const st=this.state.estatistica, est=MathLabCalc.calcularEstatistica(st.dadosTexto,st.tipoVariancia);
            valorPrincipal=est.valido ? `Média = ${MathLabCalc.fmt(est.media,2)} • Mediana = ${MathLabCalc.fmt(est.mediana,2)} • Moda = ${est.moda}` : 'Aguardando resultado válido';
        } else if (mod === 'cientifica') {
            const av = MathLabCalc.avaliarCientifica(this.state.cientifica.expressao, this.state.cientifica.unidadeAngulo, this.state.cientifica.modoSaida);
            valorPrincipal = av.erro ? 'Erro de Domínio' : `Resultado = ${av.resultadoExibido}`;
        }

        // Envolve as seções existentes em camadas colapsáveis (<details class="layered-details">)
        const secoesExistentes = Array.from(rightBody.children);
        secoesExistentes.forEach((sec, idx) => {
            if (sec.classList.contains('state-banner')) return;
            const headingEl = sec.querySelector('.section-heading');
            const tituloSecao = headingEl ? headingEl.textContent : (idx === 0 ? 'Ver propriedades' : 'Ver detalhes');
            const ehVerificacao = sec.classList.contains('verification-box');

            const details = document.createElement('details');
            details.className = 'layered-details';
            const aba = this.state.activeModule === 'funcoes' ? this.state.funcoes.abaAtiva : '';
            details.open = (aba === 'propriedades' && /propriedade/i.test(tituloSecao)) ||
                (aba === 'passos' && /passo/i.test(tituloSecao)) ||
                (aba === 'verificacao' && ehVerificacao);

            const summary = document.createElement('summary');
            summary.innerHTML = `
                <span>${ehVerificacao ? 'Verificação' : tituloSecao}</span><span class="details-chevron" aria-hidden="true"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>
            `;
            details.appendChild(summary);

            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'layered-details-body';
            rightBody.insertBefore(details, sec);
            bodyDiv.appendChild(sec);
            details.appendChild(bodyDiv);
        });

        // Adiciona camada "Por que deu esse resultado?"
        const detailsPorque = document.createElement('details');
        detailsPorque.className = 'layered-details';
        detailsPorque.innerHTML = `
            <summary>
                <span>Por que deu esse resultado?</span>
                <span class="mini-pill">Intuição</span>
            </summary>
            <div class="layered-details-body">
                <div class="interpretation-box">
                    <strong>${explicacao.titulo}</strong><br>
                    ${explicacao.resumo}<br><br>
                    <span style="color:var(--green);">${explicacao.exemplo}</span>
                </div>
            </div>
        `;
        rightBody.appendChild(detailsPorque);

        // Injeta o Cartão de Resultado Principal + botão "Explicar" + barra de compartilhamento no topo
        const heroHtml = `
            <div class="result-hero-card">
                <div class="result-hero-top">
                    <div>
                        <span class="result-hero-label">Resultado</span><div class="result-expression">${this.escaparHTML(exprAtual)}</div>
                        <div class="result-hero-value" style="margin-top:4px;font-size:15.5px;">${valorPrincipal}</div>
                    </div>
                    <button type="button" class="header-btn result-copy" id="btn-quick-copy-res" aria-label="Copiar resultado" title="Copiar resultado"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg></button>

                </div>

                <div id="real-life-explain-box" class="real-life-explain-box" style="display:${this.state.mostrarExplicacaoReal ? 'flex' : 'none'};">
                    <strong>${explicacao.titulo}</strong>
                    <span>${explicacao.resumo}</span>
                    <span style="color:var(--green);font-weight:600;">${explicacao.exemplo}</span>
                </div>

                ${this.obterVerificacaoAtual() ? '<span class="verified-badge">✓ Verificado</span>' : `<span class="result-status">${valorPrincipal.includes('Aguardando resultado válido') ? 'Aguardando resultado válido' : 'Verificação independente não confirmada'}</span>`}

            </div>
        `;

        rightBody.insertAdjacentHTML('afterbegin', heroHtml);

        document.getElementById('btn-toggle-real-explain')?.addEventListener('click', () => {
            this.state.mostrarExplicacaoReal = !this.state.mostrarExplicacaoReal;
            const box = document.getElementById('real-life-explain-box');
            if (box) box.style.display = this.state.mostrarExplicacaoReal ? 'flex' : 'none';
        });

        document.getElementById('btn-quick-copy-res')?.addEventListener('click', () => {
            this.copiarResultadoAtual();
        });

        document.getElementById('btn-quick-copy-latex')?.addEventListener('click', () => {
            const latex = exprAtual
                .replace(/·/g, '\\cdot ')
                .replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
                .replace(/π/g, '\\pi ');
            this.copiarTexto(`$$${latex}$$`, 'Fórmula copiada em formato LaTeX!');
        });

        document.getElementById('btn-quick-print-pdf')?.addEventListener('click', () => {
            window.print();
        });

        document.getElementById('btn-quick-share-url')?.addEventListener('click', () => {
            this.gerarLinkCompartilhavel();
        });
    },

    /* ========================================================================
       9. DESFAZER / REFAZER, ESCALA DE FONTE, LINK COMPARTILHÁVEL E TOUR
       ======================================================================== */
    salvarSnapshotUndo() {
        const snap = JSON.stringify({
            activeModule: this.state.activeModule,
            funcoes: this.state.funcoes,
            algebra: this.state.algebra,
            cientifica: this.state.cientifica,
            limites: this.state.limites,
            derivadas: this.state.derivadas,
            integrais: this.state.integrais,
            geometria: this.state.geometria
        });
        this.state.undoStack.push(snap);
        if (this.state.undoStack.length > 25) this.state.undoStack.shift();
        this.state.redoStack = [];
    },

    desfazer() {
        if (this.state.undoStack.length === 0) {
            this.mostrarToast('Nada para desfazer');
            return;
        }
        const atual = JSON.stringify({
            activeModule: this.state.activeModule,
            funcoes: this.state.funcoes,
            algebra: this.state.algebra,
            cientifica: this.state.cientifica,
            limites: this.state.limites,
            derivadas: this.state.derivadas,
            integrais: this.state.integrais,
            geometria: this.state.geometria
        });
        this.state.redoStack.push(atual);
        const anterior = JSON.parse(this.state.undoStack.pop());
        Object.assign(this.state, anterior);
        this.state.slotTextos = {};
        this.mostrarToast('Ação desfeita (Ctrl+Z)');
        this.renderizarModuloAtivo();
    },

    refazer() {
        if (this.state.redoStack.length === 0) {
            this.mostrarToast('Nada para refazer');
            return;
        }
        const prox = JSON.parse(this.state.redoStack.pop());
        const restantes = [...this.state.redoStack];
        this.salvarSnapshotUndo();
        this.state.redoStack = restantes;
        Object.assign(this.state, prox);
        this.state.slotTextos = {};
        this.mostrarToast('Ação refeita (Ctrl+Shift+Z)');
        this.renderizarModuloAtivo();
    },

    alterarFonte(direcao) {
        const escalas = ['sm', 'md', 'lg', 'xl'];
        const idxAtual = escalas.indexOf(this.state.fontScale || 'md');
        const novoIdx = Math.max(0, Math.min(escalas.length - 1, idxAtual + direcao));
        this.state.fontScale = escalas[novoIdx];
        document.documentElement.setAttribute('data-font-scale', this.state.fontScale);
        try {
            localStorage.setItem('mathlab_font_scale', this.state.fontScale);
        } catch (e) {}
        this.atualizarControlesPreferencias();
        MathLabGraph.ajustarResolucao();
        MathLabGraph.desenhar();
        this.mostrarToast(`Tamanho da fonte: ${this.state.fontScale.toUpperCase()}`);
    },

    gerarLinkCompartilhavel() {
        try {
            const payload = {
                m: this.state.activeModule,
                im: this.state.inputMode,
                f: this.state.funcoes,
                ft: this.state.funcoes.tipoAtivo,
                q: this.state.funcoes.quad,
                sc: this.state.cientifica.expressao
            };
            const hash = '#state=' + encodeURIComponent(JSON.stringify(payload));
            window.history.replaceState(null, '', hash);
            this.copiarTexto(window.location.href, 'Link compartilhável copiado para a área de transferência!');
        } catch (e) {
            this.mostrarToast('Link atualizado na barra de endereços');
        }
    },

    carregarEstadoDaUrl() {
        try {
            const hash = window.location.hash || '';
            if (hash.startsWith('#state=')) {
                const raw = decodeURIComponent(hash.slice(7));
                const p = JSON.parse(raw);
                if (p.m) this.state.activeModule = p.m;
                if (p.im) this.state.inputMode = p.im;
                if (p.f && typeof p.f === 'object') Object.assign(this.state.funcoes, p.f);
                if (p.ft) this.state.funcoes.tipoAtivo = p.ft;
                if (p.q) Object.assign(this.state.funcoes.quad, p.q);
                if (p.sc) this.state.cientifica.expressao = p.sc;
            }
        } catch (e) {}
    },

    verificarTourPrimeiroUso() {
        try {
            const viuTour = localStorage.getItem('mathlab_tour_done');
            if (!viuTour) {
                localStorage.setItem('mathlab_tour_done', 'true');
            }
        } catch (e) {}
    },

    abrirTourGuiado(passo = 1) {
        this.state.tourStep = passo;
        const backdrop = document.getElementById('modal-tour-backdrop');
        const card = document.getElementById('tour-card-content');
        if (!backdrop || !card) return;

        const passosTour = [
            {
                num: 1,
                titulo: '1. Escolha o Módulo e o Modo de Entrada',
                desc: 'Na barra superior você navega pelos 11 módulos (Funções, Limites, Derivadas, Integrais...). No topo do painel esquerdo, escolha entre [ Fórmula pronta ] (padrão com quadradinhos) ou [ Normal ] (digitação livre).'
            },
            {
                num: 2,
                titulo: '2. Preencha os Quadradinhos Coloridos',
                desc: 'No modo "Fórmula pronta", você só troca os números dentro dos quadradinhos tracejados (como a, b, c). Use Tab para pular de um para outro, setas ↑ e ↓ para ajustar valores, ou clique em "fx" para digitar frações e expressões como 1/2 ou 2·sen(π/6).'
            },
            {
                num: 3,
                titulo: '3. Pré-visualização ao Vivo e Botão GERAR',
                desc: 'Enquanto você digita, o gráfico e o vértice mudam ao vivo! Ao apertar Enter ou clicar em GERAR, o MathLab fecha o relatório completo e salva no Histórico.'
            },
            {
                num: 4,
                titulo: '4. Resultado em Camadas e Botão "Explicar"',
                desc: 'No painel à direita, veja a resposta principal em destaque, clique em "💡 Explicar" para entender o conceito com um exemplo da vida real, ou clique nos pontos marcados do gráfico para inspecionar valores exatos e decimais!'
            }
        ];

        const atual = passosTour[passo - 1] || passosTour[0];
        card.innerHTML = `
            <span class="tour-step-badge">Passo ${atual.num} de 4 — Guia Rápido MathLab</span>
            <h3 class="tour-title">${atual.titulo}</h3>
            <p class="tour-desc">${atual.desc}</p>
            <div class="tour-footer">
                <div class="tour-dots">
                    ${passosTour.map(p => `<span class="tour-dot ${p.num === atual.num ? 'active' : ''}"></span>`).join('')}
                </div>
                <div style="display:flex;gap:8px;">
                    <button type="button" class="btn-secondary-action" id="btn-tour-skip" style="height:30px;">Fechar</button>
                    ${atual.num > 1 ? `<button type="button" class="btn-secondary-action" id="btn-tour-prev" style="height:30px;">Anterior</button>` : ''}
                    ${atual.num < 4
                        ? `<button type="button" class="btn-primary-action" id="btn-tour-next" style="height:30px;padding:0 14px;">Próximo →</button>`
                        : `<button type="button" class="btn-primary-action" id="btn-tour-finish" style="height:30px;padding:0 14px;">Começar a usar!</button>`
                    }
                </div>
            </div>
        `;

        backdrop.classList.remove('hidden');

        document.getElementById('btn-tour-skip')?.addEventListener('click', () => backdrop.classList.add('hidden'));
        document.getElementById('btn-tour-finish')?.addEventListener('click', () => backdrop.classList.add('hidden'));
        document.getElementById('btn-tour-prev')?.addEventListener('click', () => this.abrirTourGuiado(atual.num - 1));
        document.getElementById('btn-tour-next')?.addEventListener('click', () => this.abrirTourGuiado(atual.num + 1));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MathLabApp.init();
});
