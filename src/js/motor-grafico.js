/* ============================================================================
   MATHLAB — MOTOR GRÁFICO E DE VISUALIZAÇÃO MATEMÁTICA (CANVAS + SVG)
   Arquivo: src/js/motor-grafico.js
   Descrição: Renderizador de gráficos cartesianos interativos (zoom, pan,
              coordenadas, áreas de integral, retângulos de Riemann, buracos de
              descontinuidade), figuras geométricas planas/espaciais em SVG,
              circunferência trigonométrica, plano vetorial e gráficos
              estatísticos. Funciona 100% offline sem bibliotecas externas.
   ============================================================================ */

const MathLabGraph = {
    canvas: null,
    ctx: null,
    config: null,
    janela: { xMin: -6, xMax: 8, yMin: -11, yMax: 7 },
    janelaPadrao: { xMin: -6, xMax: 8, yMin: -11, yMax: 7 },
    arrastando: false,
    ultimoMouse: { x: 0, y: 0 },
    pontoHover: null,
    curvasOcultas: {},
    listenersRegistrados: false,

    /**
     * Inicializa e vincula o motor ao elemento <canvas> ativo na tela.
     */
    conectarCanvas(canvasEl, config) {
        this.canvas = canvasEl;
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.config = config || {};
        this.curvasOcultas = {};

        if (config && config.janela) {
            this.janela = { ...config.janela };
            this.janelaPadrao = { ...config.janela };
        } else {
            this.janela = { xMin: -6, xMax: 8, yMin: -10, yMax: 8 };
            this.janelaPadrao = { ...this.janela };
        }

        // O observador acompanha inclusive mudanças de aba e do painel lateral.
        if (typeof ResizeObserver !== 'undefined') {
            this.observadorTamanho?.disconnect();
            this.observadorTamanho = new ResizeObserver(() => {
                this.ajustarResolucao();
                this.desenhar();
            });
            this.observadorTamanho.observe(this.canvas.parentElement);
        }
        this.ajustarResolucao();
        this.registrarEventos();
        this.desenhar();
    },

    /**
     * Garante nitidez em telas Retina / Full HD (devicePixelRatio).
     */
    ajustarResolucao() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.largura = w;
        this.altura = h;
    },

    /* Conversões entre coordenadas matemáticas (x, y) e pixels (px, py) */
    xParaPx(x) {
        const { xMin, xMax } = this.janela;
        return ((x - xMin) / (xMax - xMin)) * this.largura;
    },

    yParaPy(y) {
        const { yMin, yMax } = this.janela;
        return this.altura - ((y - yMin) / (yMax - yMin)) * this.altura;
    },

    pxParaX(px) {
        const { xMin, xMax } = this.janela;
        return xMin + (px / this.largura) * (xMax - xMin);
    },

    pyParaY(py) {
        const { yMin, yMax } = this.janela;
        return yMax - (py / this.altura) * (yMax - yMin);
    },

    /**
     * Calcula o espaçamento ideal da grade conforme o nível de zoom.
     */
    calcularPassoGrade(intervalo) {
        const bruto = intervalo / 8;
        const pot10 = Math.pow(10, Math.floor(Math.log10(bruto)));
        const norm = bruto / pot10;
        if (norm < 1.5) return 1 * pot10;
        if (norm < 3.5) return 2 * pot10;
        if (norm < 7.5) return 5 * pot10;
        return 10 * pot10;
    },

    /**
     * Renderiza todo o plano cartesiano, curvas, áreas, retângulos e marcadores.
     */
    desenhar() {
        if (!this.canvas || !this.ctx || !this.config) return;
        const ctx = this.ctx;
        const w = this.largura;
        const h = this.altura;
        const estilos = getComputedStyle(document.documentElement);

        const corFundo = estilos.getPropertyValue('--graph-bg').trim() || '#09101D';
        const corGrade = estilos.getPropertyValue('--graph-grid').trim() || '#162338';
        const corEixo = estilos.getPropertyValue('--graph-axis').trim() || '#3B5275';
        const corTexto = estilos.getPropertyValue('--graph-text').trim() || '#8CA2C0';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = corFundo;
        ctx.fillRect(0, 0, w, h);

        if (this.config.mensagemVazia) {
            ctx.fillStyle = corTexto;
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.config.mensagemVazia, w / 2, h / 2);
            return;
        }
        const { xMin, xMax, yMin, yMax } = this.janela;
        const passoX = this.calcularPassoGrade(xMax - xMin);
        const passoY = this.calcularPassoGrade(yMax - yMin);

        // 1. Grade cartesiana discreta
        ctx.lineWidth = 1;
        ctx.strokeStyle = corGrade;
        ctx.beginPath();

        const primeiroX = Math.ceil(xMin / passoX) * passoX;
        for (let xv = primeiroX; xv <= xMax; xv += passoX) {
            const px = this.xParaPx(xv);
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
        }

        const primeiroY = Math.ceil(yMin / passoY) * passoY;
        for (let yv = primeiroY; yv <= yMax; yv += passoY) {
            const py = this.yParaPy(yv);
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
        }
        ctx.stroke();

        // 2. Eixos principais X e Y com setas e graduação
        const eixoY_px = this.xParaPx(0);
        const eixoX_py = this.yParaPy(0);

        ctx.strokeStyle = corEixo;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        if (eixoY_px >= 0 && eixoY_px <= w) {
            ctx.moveTo(eixoY_px, 0);
            ctx.lineTo(eixoY_px, h);
        }
        if (eixoX_py >= 0 && eixoX_py <= h) {
            ctx.moveTo(0, eixoX_py);
            ctx.lineTo(w, eixoX_py);
        }
        ctx.stroke();

        // Rótulos numéricos dos eixos
        ctx.fillStyle = corTexto;
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const posRotuloX = Math.min(Math.max(eixoX_py + 5, 6), h - 18);
        for (let xv = primeiroX; xv <= xMax; xv += passoX) {
            if (Math.abs(xv) < 1e-9) continue;
            const px = this.xParaPx(xv);
            if (px < 22 || px > w - 22) continue;
            const txt = this.config.eixoXPi ? this.formatarMultiploPi(xv) : this.formatarCurto(xv);
            ctx.fillText(txt, px, posRotuloX);
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const posRotuloY = Math.min(Math.max(eixoY_px - 6, 30), w - 8);
        for (let yv = primeiroY; yv <= yMax; yv += passoY) {
            if (Math.abs(yv) < 1e-9) continue;
            const py = this.yParaPy(yv);
            if (py < 14 || py > h - 14) continue;
            ctx.fillText(this.formatarCurto(yv), posRotuloY, py);
        }

        // Rótulos 'x' e 'y' nas extremidades dos eixos
        ctx.fillStyle = corTexto;
        ctx.font = '700 12px "JetBrains Mono", monospace';
        if (eixoX_py >= 0 && eixoX_py <= h) {
            ctx.textAlign = 'right';
            ctx.fillText(this.config.rotuloEixoX || 'x', w - 8, Math.max(14, eixoX_py - 12));
        }
        if (eixoY_px >= 0 && eixoY_px <= w) {
            ctx.textAlign = 'left';
            ctx.fillText(this.config.rotuloEixoY || 'y', Math.min(w - 24, eixoY_px + 8), 12);
        }

        // 3. Área sombreada de Integral (se configurada)
        if (this.config.areaSombreada) {
            this.desenharAreaIntegral(ctx, this.config.areaSombreada);
        }

        // 4. Retângulos da Soma de Riemann (se ativos)
        if (this.config.riemann && this.config.riemann.mostrar) {
            this.desenharRetangulosRiemann(ctx, this.config.riemann);
        }

        // 5. Assíntotas e Eixos de Simetria Tracejados
        if (Array.isArray(this.config.assintotas)) {
            this.config.assintotas.forEach((as) => {
                ctx.save();
                ctx.strokeStyle = as.cor || '#3B82F6';
                ctx.lineWidth = 1.4;
                ctx.setLineDash([6, 5]);
                ctx.beginPath();
                if (as.tipo === 'vertical') {
                    const px = this.xParaPx(as.valor);
                    ctx.moveTo(px, 0);
                    ctx.lineTo(px, h);
                    ctx.stroke();
                    if (as.rotulo) {
                        ctx.setLineDash([]);
                        ctx.fillStyle = as.cor || '#3B82F6';
                        ctx.font = '600 11px "JetBrains Mono", monospace';
                        ctx.textAlign = 'left';
                        ctx.fillText(as.rotulo, px + 6, 22);
                    }
                } else if (as.tipo === 'horizontal') {
                    const py = this.yParaPy(as.valor);
                    ctx.moveTo(0, py);
                    ctx.lineTo(w, py);
                    ctx.stroke();
                    if (as.rotulo) {
                        ctx.setLineDash([]);
                        ctx.fillStyle = as.cor || '#3B82F6';
                        ctx.font = '600 11px "JetBrains Mono", monospace';
                        ctx.textAlign = 'left';
                        ctx.fillText(as.rotulo, 12, py - 8);
                    }
                }
                ctx.restore();
            });
        }

        // 6. Curvas das Funções
        if (Array.isArray(this.config.curvas)) {
            this.config.curvas.forEach((curva, idx) => {
                if (this.curvasOcultas[idx]) return;
                this.desenharCurva(ctx, curva);
            });
        }

        // 7. Marcadores de Pontos Importantes (Raízes, Vértice, Tangência, Buracos)
        if (Array.isArray(this.config.marcadores)) {
            this.desenharMarcadores(ctx, this.config.marcadores, corFundo);
        }

        // 7.5. Badges de Parâmetros Coloridos (Sincronizados com os Quadradinhos a, b, c)
        if (Array.isArray(this.config.badgesParametros) && this.config.badgesParametros.length > 0) {
            ctx.save();
            let bx = 12;
            const by = 12;
            ctx.font = '700 11px "JetBrains Mono", monospace';
            this.config.badgesParametros.forEach(bp => {
                const txt = bp.rotulo || (bp.simbolo !== undefined ? `${bp.simbolo} = ${bp.valor}` : String(bp.valor || ''));
                const larg = ctx.measureText(txt).width + 16;
                ctx.fillStyle = 'rgba(11, 18, 32, 0.88)';
                ctx.strokeStyle = bp.cor || '#3B82F6';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(bx, by, larg, 22, 5);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = bp.cor || '#3B82F6';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(txt, bx + larg / 2, by + 11);
                bx += larg + 6;
            });
            ctx.restore();
        }

        // 8. Ponto interativo sob o cursor do mouse
        if (this.pontoHover) {
            ctx.save();
            const px = this.xParaPx(this.pontoHover.x);
            const py = this.yParaPy(this.pontoHover.y);
            ctx.strokeStyle = 'rgba(230, 237, 247, 0.35)';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.fillStyle = this.pontoHover.cor || '#22C55E';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
    },

    desenharCurva(ctx, curva) {
        const w = this.largura;
        const h = this.altura;
        ctx.save();
        ctx.strokeStyle = curva.cor || '#22C55E';
        ctx.lineWidth = curva.espessura || 2.5;
        if (curva.tracejado) {
            ctx.setLineDash([6, 4]);
        }

        ctx.beginPath();
        let canetaAbaixada = false;
        let pyAnterior = null;

        const passos = Math.max(500, w);
        for (let i = 0; i <= passos; i++) {
            const px = (i / passos) * w;
            const xv = this.pxParaX(px);

            // Se a curva tiver domínio restrito explícito (ex: log(x) para x > 0)
            if (curva.xMinDominio !== undefined && xv <= curva.xMinDominio) {
                canetaAbaixada = false;
                pyAnterior = null;
                continue;
            }

            let yv;
            try {
                yv = curva.fn(xv);
            } catch (e) {
                yv = NaN;
            }

            if (yv === null || yv === undefined || Number.isNaN(yv) || !Number.isFinite(yv)) {
                canetaAbaixada = false;
                pyAnterior = null;
                continue;
            }

            const py = this.yParaPy(yv);

            // Evita linhas verticais falsas em assíntotas verticais (ex: 1/x ou tg(x))
            if (pyAnterior !== null && Math.abs(py - pyAnterior) > h * 1.4) {
                canetaAbaixada = false;
            }

            if (py < -h * 2 || py > h * 3) {
                canetaAbaixada = false;
                pyAnterior = py;
                continue;
            }

            if (!canetaAbaixada) {
                ctx.moveTo(px, py);
                canetaAbaixada = true;
            } else {
                ctx.lineTo(px, py);
            }
            pyAnterior = py;
        }
        ctx.stroke();
        ctx.restore();
    },

    desenharAreaIntegral(ctx, area) {
        const { a, b, fn, cor, rotulo } = area;
        const pxA = this.xParaPx(a);
        const pxB = this.xParaPx(b);
        const pyZero = this.yParaPy(0);
        const nPassos = 140;

        ctx.save();
        ctx.fillStyle = cor || 'rgba(34, 197, 94, 0.25)';
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.65)';
        ctx.lineWidth = 1.2;

        // Cada faixa conserva o sinal, inclusive quando os limites são invertidos.
        for (let i = 0; i < nPassos; i++) {
            const x1 = a + i / nPassos * (b - a);
            const x2 = a + (i + 1) / nPassos * (b - a);
            const y1 = fn(x1), y2 = fn(x2);
            if (!Number.isFinite(y1) || !Number.isFinite(y2)) continue;
            const pintar = (u, v, fu, fv) => {
                ctx.fillStyle = (fu + fv) < 0 ? 'rgba(239,68,68,0.28)' : (cor || 'rgba(34,197,94,0.26)');
                ctx.beginPath();
                ctx.moveTo(this.xParaPx(u), pyZero);
                ctx.lineTo(this.xParaPx(u), this.yParaPy(fu));
                ctx.lineTo(this.xParaPx(v), this.yParaPy(fv));
                ctx.lineTo(this.xParaPx(v), pyZero);
                ctx.closePath(); ctx.fill();
            };
            if (y1 * y2 < 0) {
                const raiz = x1 + (x2 - x1) * Math.abs(y1) / (Math.abs(y1) + Math.abs(y2));
                pintar(x1, raiz, y1, 0); pintar(raiz, x2, 0, y2);
            } else pintar(x1, x2, y1, y2);
        }

        if (rotulo) {
            const xMeio = a + (b - a) * 0.62;
            const yMeio = fn(xMeio) * 0.38;
            const pxM = this.xParaPx(xMeio);
            const pyM = this.yParaPy(yMeio);

            ctx.font = '700 12px "JetBrains Mono", monospace';
            const largTxt = ctx.measureText(rotulo).width + 14;
            ctx.fillStyle = 'rgba(11, 18, 32, 0.88)';
            ctx.strokeStyle = '#22C55E';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(pxM - largTxt / 2, pyM - 12, largTxt, 24, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#22C55E';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rotulo, pxM, pyM);
        }
        ctx.restore();
    },

    desenharRetangulosRiemann(ctx, riemann) {
        const { a, b, n, fn } = riemann;
        const num = Math.max(2, Math.min(1000, n || 6));
        const dx = (b - a) / num;
        const pyZero = this.yParaPy(0);

        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.20)';
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.75)';
        ctx.lineWidth = 1.1;

        for (let i = 0; i < num; i++) {
            const xEsq = a + i * dx;
            const xDir = xEsq + dx;
            const xMeio = (xEsq + xDir) / 2;
            const yAlt = fn(xMeio);
            if (!Number.isFinite(yAlt)) continue;

            const px1 = this.xParaPx(xEsq);
            const px2 = this.xParaPx(xDir);
            const pyTopo = this.yParaPy(yAlt);
            ctx.fillRect(px1, Math.min(pyTopo, pyZero), px2 - px1, Math.abs(pyZero - pyTopo));
            ctx.strokeRect(px1, Math.min(pyTopo, pyZero), px2 - px1, Math.abs(pyZero - pyTopo));
        }
        ctx.restore();
    },

    desenharMarcadores(ctx, marcadores, corFundo) {
        const caixasUsadas = [];

        marcadores.forEach((m) => {
            const px = this.xParaPx(m.x);
            const py = this.yParaPy(m.y);
            if (px < -20 || px > this.largura + 20 || py < -20 || py > this.altura + 20) return;

            ctx.save();
            // Linha pontilhada de projeção se solicitado
            if (m.projetarEixos) {
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px, this.yParaPy(0));
                ctx.moveTo(px, py);
                ctx.lineTo(this.xParaPx(0), py);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Círculo do marcador (cheio ou vazado para descontinuidade removível)
            ctx.beginPath();
            ctx.arc(px, py, m.raio || 5.5, 0, Math.PI * 2);
            if (m.vazado) {
                ctx.fillStyle = corFundo;
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = m.cor || '#EF4444';
                ctx.stroke();
            } else {
                ctx.fillStyle = m.cor || '#EF4444';
                ctx.fill();
                ctx.lineWidth = 1.6;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();
            }

            // Rótulo tipo pílula sem sobreposição
            if (m.rotulo) {
                ctx.font = '600 11.5px "JetBrains Mono", monospace';
                const largTexto = ctx.measureText(m.rotulo).width;
                const wCaixa = largTexto + 12;
                const hCaixa = 21;

                let xCaixa = px + (m.offsetX !== undefined ? m.offsetX : -wCaixa / 2);
                let yCaixa = py + (m.offsetY !== undefined ? m.offsetY : -29);

                // Evita colisão com outros rótulos
                for (const c of caixasUsadas) {
                    if (
                        xCaixa < c.x + c.w + 4 &&
                        xCaixa + wCaixa + 4 > c.x &&
                        yCaixa < c.y + c.h + 4 &&
                        yCaixa + hCaixa + 4 > c.y
                    ) {
                        yCaixa = py + 11;
                    }
                }

                // Mantém dentro do canvas
                xCaixa = Math.max(6, Math.min(this.largura - wCaixa - 6, xCaixa));
                yCaixa = Math.max(6, Math.min(this.altura - hCaixa - 6, yCaixa));
                caixasUsadas.push({ x: xCaixa, y: yCaixa, w: wCaixa, h: hCaixa });

                ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
                ctx.strokeStyle = m.cor || '#EF4444';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect(xCaixa, yCaixa, wCaixa, hCaixa, 5);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#F8FAFC';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(m.rotulo, xCaixa + wCaixa / 2, yCaixa + hCaixa / 2);
            }
            ctx.restore();
        });
    },

    formatarCurto(num) {
        if (Math.abs(num - Math.round(num)) < 1e-6) return String(Math.round(num));
        return Number(num.toFixed(2)).toString().replace('.', ',');
    },

    formatarMultiploPi(xv) {
        const razao = xv / Math.PI;
        if (Math.abs(razao - Math.round(razao)) < 0.08) {
            const k = Math.round(razao);
            if (k === 0) return '0';
            if (k === 1) return 'π';
            if (k === -1) return '-π';
            return `${k}π`;
        }
        const meio = razao * 2;
        if (Math.abs(meio - Math.round(meio)) < 0.08) {
            const k = Math.round(meio);
            if (k === 1) return 'π/2';
            if (k === -1) return '-π/2';
            return `${k}π/2`;
        }
        return this.formatarCurto(xv);
    },

    /* Controles de Zoom, Ajuste e Exportação */
    aplicarZoom(fator) {
        const { xMin, xMax, yMin, yMax } = this.janela;
        const cx = (xMin + xMax) / 2;
        const cy = (yMin + yMax) / 2;
        const rx = ((xMax - xMin) / 2) * fator;
        const ry = ((yMax - yMin) / 2) * fator;
        if (rx < 0.25 || rx > 500) return;
        this.janela = { xMin: cx - rx, xMax: cx + rx, yMin: cy - ry, yMax: cy + ry };
        this.desenhar();
    },

    resetarJanela() {
        this.fecharPopoverMarcador();
        this.janela = { ...this.janelaPadrao };
        this.desenhar();
    },

    /**
     * Centraliza automaticamente todos os pontos importantes marcados (raízes, vértice, interceptos).
     */
    ajustarAFuncao() {
        this.fecharPopoverMarcador();
        if (this.config?.ajusteIntegral) { this.resetarJanela(); return; }
        if (!this.config || !Array.isArray(this.config.marcadores) || this.config.marcadores.length === 0) {
            this.resetarJanela();
            return;
        }
        const xs = this.config.marcadores.map(m => m.x).filter(v => Number.isFinite(v));
        const ys = this.config.marcadores.map(m => m.y).filter(v => Number.isFinite(v));
        xs.push(0);
        ys.push(0);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const padX = Math.max(3.5, (maxX - minX) * 0.45);
        const padY = Math.max(4.0, (maxY - minY) * 0.45);

        this.janela = {
            xMin: minX - padX,
            xMax: maxX + padX,
            yMin: minY - padY,
            yMax: maxY + padY
        };
        this.desenhar();
    },

    fecharPopoverMarcador() {
        const pop = document.getElementById('graph-marker-popover');
        if (pop) pop.remove();
    },

    mostrarPopoverMarcador(m, px, py) {
        this.fecharPopoverMarcador();
        if (!this.canvas || !this.canvas.parentElement) return;

        const pop = document.createElement('div');
        pop.id = 'graph-marker-popover';
        pop.className = 'graph-marker-popover';

        const leftPos = Math.max(12, Math.min(this.largura - 230, px - 105));
        const topPos = Math.max(12, Math.min(this.altura - 115, py + 12));
        pop.style.left = `${leftPos}px`;
        pop.style.top = `${topPos}px`;
        pop.style.borderColor = m.cor || '#3B82F6';

        const xDec = Number(m.x).toFixed(4).replace('.', ',');
        const yDec = Number(m.y).toFixed(4).replace('.', ',');
        const tipoPonto = m.rotulo.includes('V(') ? 'Vértice (Extremo da Parábola)'
            : m.y === 0 ? 'Raiz / Zero da Função (f(x) = 0)'
            : m.x === 0 ? 'Intercepto no Eixo Y (x = 0)'
            : m.vazado ? 'Descontinuidade Removível (Ponto Aberto)'
            : 'Ponto Destacado na Curva';

        pop.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <strong style="color:${m.cor || '#3B82F6'};font-size:11.5px;">${tipoPonto}</strong>
                <button type="button" id="btn-close-marker-pop" style="color:var(--text-muted);font-weight:700;">✕</button>
            </div>
            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-main);">
                Exato: ${m.rotulo}
            </div>
            <div style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-secondary);">
                Decimal: x = ${xDec}  |  y = ${yDec}
            </div>
        `;

        this.canvas.parentElement.appendChild(pop);
        pop.querySelector('#btn-close-marker-pop')?.addEventListener('click', () => pop.remove());
    },

    alternarCurva(indice) {
        this.curvasOcultas[indice] = !this.curvasOcultas[indice];
        this.desenhar();
        return !this.curvasOcultas[indice];
    },

    exportarPNG(nomeArquivo = 'mathlab-grafico.png') {
        if (!this.canvas) return;
        const link = document.createElement('a');
        link.download = nomeArquivo;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    },

    registrarEventos() {
        if (!this.canvas) return;

        this.canvas.onmousedown = (e) => {
            this.arrastando = true;
            this.ultimoMouse = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        };

        window.onmouseup = () => {
            if (this.arrastando) {
                this.arrastando = false;
                if (this.canvas) this.canvas.style.cursor = 'crosshair';
            }
        };

        this.canvas.onmousemove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            if (this.arrastando) {
                const dxPx = e.clientX - this.ultimoMouse.x;
                const dyPx = e.clientY - this.ultimoMouse.y;
                this.ultimoMouse = { x: e.clientX, y: e.clientY };

                const { xMin, xMax, yMin, yMax } = this.janela;
                const dxMat = (dxPx / this.largura) * (xMax - xMin);
                const dyMat = (dyPx / this.altura) * (yMax - yMin);

                this.janela.xMin -= dxMat;
                this.janela.xMax -= dxMat;
                this.janela.yMin += dyMat;
                this.janela.yMax += dyMat;
                this.desenhar();
                return;
            }

            // Calcula coordenada na curva principal mais próxima
            const xv = this.pxParaX(mx);
            const yMouse = this.pyParaY(my);
            let melhorPonto = null;

            if (this.config && Array.isArray(this.config.curvas)) {
                this.config.curvas.forEach((c, idx) => {
                    if (this.curvasOcultas[idx]) return;
                    try {
                        const yCurva = c.fn(xv);
                        if (Number.isFinite(yCurva)) {
                            const distPx = Math.abs(this.yParaPy(yCurva) - my);
                            if (distPx < 36 && (!melhorPonto || distPx < melhorPonto.dist)) {
                                melhorPonto = { x: xv, y: yCurva, cor: c.cor, rotulo: c.rotulo, dist: distPx };
                            }
                        }
                    } catch (err) {}
                });
            }

            this.pontoHover = melhorPonto;
            const pill = document.getElementById('graph-coords-pill');
            if (pill) {
                if (melhorPonto) {
                    pill.textContent = `${melhorPonto.rotulo || 'Curva'}: x = ${melhorPonto.x.toFixed(2).replace('.', ',')} | y = ${melhorPonto.y.toFixed(2).replace('.', ',')}`;
                } else {
                    pill.textContent = `x = ${xv.toFixed(2).replace('.', ',')} | y = ${yMouse.toFixed(2).replace('.', ',')}`;
                }
            }
            this.desenhar();
        };

        this.canvas.onmouseleave = () => {
            this.pontoHover = null;
            this.desenhar();
        };

        this.canvas.onwheel = (e) => {
            e.preventDefault();
            const fator = e.deltaY < 0 ? 0.86 : 1.16;
            this.aplicarZoom(fator);
        };

        this.canvas.ondblclick = () => {
            this.resetarJanela();
        };

        this.canvas.onclick = (e) => {
            if (!this.config || !Array.isArray(this.config.marcadores)) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            let clicado = null;
            for (const m of this.config.marcadores) {
                const px = this.xParaPx(m.x);
                const py = this.yParaPy(m.y);
                const dist = Math.hypot(mx - px, my - py);
                if (dist <= 16) {
                    clicado = { m, px, py };
                    break;
                }
            }

            if (clicado) {
                this.mostrarPopoverMarcador(clicado.m, clicado.px, clicado.py);
            } else {
                this.fecharPopoverMarcador();
            }
        };

        if (!this.listenersRegistrados) {
            window.addEventListener('resize', () => {
                if (this.canvas && document.body.contains(this.canvas)) {
                    this.ajustarResolucao();
                    this.desenhar();
                }
            });
            this.listenersRegistrados = true;
        }
    }
};


/* ============================================================================
   GERADORES SVG PARA GEOMETRIA, TRIGONOMETRIA, VETORES, ESTATÍSTICA E FUNÇÕES
   ============================================================================ */

const MathLabVisuals = {
    /**
     * Gera minigráficos SVG para os 8 cartões de Tipos de Funções.
     */
    gerarMiniSvgFuncao(tipo) {
        const caminhos = {
            constante: `<line x1="10" y1="32" x2="150" y2="32" stroke="#22C55E" stroke-width="2.5"/>`,
            afim: `<line x1="15" y1="68" x2="145" y2="14" stroke="#22C55E" stroke-width="2.5"/><circle cx="62" cy="48" r="3.5" fill="#EF4444"/>`,
            linear: `<line x1="20" y1="72" x2="140" y2="12" stroke="#22C55E" stroke-width="2.5"/><circle cx="80" cy="42" r="3.5" fill="#3B82F6"/>`,
            quadratica: `<path d="M 28 12 Q 80 96 132 12" fill="none" stroke="#22C55E" stroke-width="2.5"/><circle cx="48" cy="42" r="3.5" fill="#EF4444"/><circle cx="112" cy="42" r="3.5" fill="#EF4444"/><circle cx="80" cy="54" r="3.5" fill="#3B82F6"/>`,
            canonica: `<path d="M 38 14 Q 96 90 148 14" fill="none" stroke="#3B82F6" stroke-width="2.5"/><circle cx="93" cy="52" r="4" fill="#F59E0B"/>`,
            fatorada: `<path d="M 28 12 Q 80 96 132 12" fill="none" stroke="#22C55E" stroke-width="2.5"/><circle cx="48" cy="42" r="4" fill="#EF4444"/><circle cx="112" cy="42" r="4" fill="#EF4444"/>`,
            modular: `<polyline points="20,12 80,62 140,12" fill="none" stroke="#22C55E" stroke-width="2.5"/><circle cx="80" cy="62" r="3.5" fill="#3B82F6"/>`,
            exponencial: `<path d="M 14 58 Q 82 56 136 10" fill="none" stroke="#22C55E" stroke-width="2.5"/><circle cx="80" cy="44" r="3.5" fill="#3B82F6"/>`,
            juros: `<path d="M 18 64 Q 88 58 144 12" fill="none" stroke="#F59E0B" stroke-width="2.5"/><circle cx="144" cy="12" r="3.5" fill="#22C55E"/>`,
            logaritmica: `<path d="M 84 74 Q 90 32 146 16" fill="none" stroke="#22C55E" stroke-width="2.5"/><circle cx="96" cy="42" r="3.5" fill="#EF4444"/>`,
            trigonometrica: `<path d="M 10 42 C 35 8, 55 8, 80 42 C 105 76, 125 76, 150 42" fill="none" stroke="#22C55E" stroke-width="2.5"/>`,
            racional: `<line x1="18" y1="68" x2="142" y2="16" stroke="#22C55E" stroke-width="2.5"/><circle cx="98" cy="34" r="4.5" fill="#0B1220" stroke="#EF4444" stroke-width="2.2"/>`,
            area: `<path d="M 30 64 Q 85 55 130 14 L 130 64 Z" fill="rgba(34,197,94,0.25)" stroke="#22C55E" stroke-width="2"/>`
        };

        return `
        <svg viewBox="0 0 160 84" width="100%" height="100%">
            <line x1="0" y1="42" x2="160" y2="42" stroke="#253650" stroke-width="1"/>
            <line x1="80" y1="0" x2="80" y2="84" stroke="#253650" stroke-width="1"/>
            ${caminhos[tipo] || caminhos.quadratica}
        </svg>`;
    },

    /**
     * Desenha figuras geométricas planas e espaciais em SVG com cotas dinâmicas.
     */
    gerarSvgGeometria(figura, params, unidade = 'cm') {
        const u = unidade;
        const gradeBg = `
            <defs>
                <pattern id="geo-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                    <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(59, 82, 117, 0.2)" stroke-width="1"/>
                </pattern>
            </defs>
            <rect width="480" height="340" fill="url(#geo-grid)" />
            <line x1="0" y1="170" x2="480" y2="170" stroke="rgba(59, 82, 117, 0.45)" stroke-width="1.2"/>
            <line x1="240" y1="0" x2="240" y2="340" stroke="rgba(59, 82, 117, 0.45)" stroke-width="1.2"/>
        `;

        let conteudo = '';

        switch (figura) {
            case 'circulo': {
                const r = params.r || 5;
                conteudo = `
                    <circle cx="240" cy="170" r="108" fill="rgba(34, 197, 94, 0.10)" stroke="#22C55E" stroke-width="3"/>
                    <line x1="240" y1="170" x2="334" y2="116" stroke="#3B82F6" stroke-width="2.5"/>
                    <circle cx="240" cy="170" r="4.5" fill="#3B82F6"/>
                    <circle cx="334" cy="116" r="4.5" fill="#3B82F6"/>
                    <rect x="272" y="132" width="64" height="22" rx="4" fill="#0B1220" stroke="#3B82F6"/>
                    <text x="304" y="147" fill="#E6EDF7" font-family="JetBrains Mono" font-size="12" font-weight="700" text-anchor="middle">r = ${r} ${u}</text>
                `;
                break;
            }
            case 'quadrado': {
                const l = params.l || 6;
                conteudo = `
                    <rect x="145" y="75" width="190" height="190" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="3"/>
                    <line x1="145" y1="75" x2="335" y2="265" stroke="#3B82F6" stroke-width="1.8" stroke-dasharray="5,5"/>
                    <text x="240" y="288" fill="#22C55E" font-family="JetBrains Mono" font-size="13" font-weight="700" text-anchor="middle">L = ${l} ${u}</text>
                    <text x="350" y="175" fill="#22C55E" font-family="JetBrains Mono" font-size="13" font-weight="700">L = ${l} ${u}</text>
                    <text x="235" y="160" fill="#3B82F6" font-family="JetBrains Mono" font-size="12" font-weight="600">d = ${(l * Math.SQRT2).toFixed(2).replace('.', ',')} ${u}</text>
                `;
                break;
            }
            case 'retangulo': {
                const b = params.b || 8;
                const h = params.h || 5;
                conteudo = `
                    <rect x="115" y="90" width="250" height="160" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="3"/>
                    <line x1="115" y1="90" x2="365" y2="250" stroke="#3B82F6" stroke-width="1.8" stroke-dasharray="5,5"/>
                    <text x="240" y="274" fill="#22C55E" font-family="JetBrains Mono" font-size="13" font-weight="700" text-anchor="middle">b = ${b} ${u}</text>
                    <text x="378" y="175" fill="#3B82F6" font-family="JetBrains Mono" font-size="13" font-weight="700">h = ${h} ${u}</text>
                `;
                break;
            }
            case 'triangulo': {
                const b = params.b || 6;
                const h = params.h || 4;
                conteudo = `
                    <polygon points="115,255 365,255 240,75" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="3"/>
                    <line x1="240" y1="75" x2="240" y2="255" stroke="#3B82F6" stroke-width="2" stroke-dasharray="5,4"/>
                    <rect x="240" y="241" width="14" height="14" fill="none" stroke="#3B82F6" stroke-width="1.5"/>
                    <text x="240" y="280" fill="#22C55E" font-family="JetBrains Mono" font-size="13" font-weight="700" text-anchor="middle">b = ${b} ${u}</text>
                    <text x="252" y="175" fill="#3B82F6" font-family="JetBrains Mono" font-size="13" font-weight="700">h = ${h} ${u}</text>
                `;
                break;
            }
            case 'trapezio': {
                const B = params.B || 10;
                const b = params.b || 6;
                const h = params.h || 4;
                conteudo = `
                    <polygon points="100,250 380,250 320,95 160,95" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="3"/>
                    <line x1="160" y1="95" x2="160" y2="250" stroke="#3B82F6" stroke-width="2" stroke-dasharray="5,4"/>
                    <text x="240" y="82" fill="#F59E0B" font-family="JetBrains Mono" font-size="13" font-weight="700" text-anchor="middle">b = ${b} ${u}</text>
                    <text x="240" y="275" fill="#22C55E" font-family="JetBrains Mono" font-size="13" font-weight="700" text-anchor="middle">B = ${B} ${u}</text>
                    <text x="172" y="180" fill="#3B82F6" font-family="JetBrains Mono" font-size="13" font-weight="700">h = ${h} ${u}</text>
                `;
                break;
            }
            case 'losango': {
                const D = params.D || 8;
                const d = params.d || 6;
                conteudo = `
                    <polygon points="240,65 365,170 240,275 115,170" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="3"/>
                    <line x1="240" y1="65" x2="240" y2="275" stroke="#3B82F6" stroke-width="2" stroke-dasharray="5,4"/>
                    <line x1="115" y1="170" x2="365" y2="170" stroke="#F59E0B" stroke-width="2" stroke-dasharray="5,4"/>
                    <text x="252" y="115" fill="#3B82F6" font-family="JetBrains Mono" font-size="12.5" font-weight="700">D = ${D} ${u}</text>
                    <text x="305" y="162" fill="#F59E0B" font-family="JetBrains Mono" font-size="12.5" font-weight="700">d = ${d} ${u}</text>
                `;
                break;
            }
            case 'cubo': {
                const a = params.a || 4;
                conteudo = `
                    <polygon points="150,120 290,120 290,260 150,260" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="2.5"/>
                    <polygon points="195,75 335,75 335,215 195,215" fill="rgba(59, 130, 246, 0.08)" stroke="#3B82F6" stroke-width="2" stroke-dasharray="5,4"/>
                    <line x1="150" y1="120" x2="195" y2="75" stroke="#22C55E" stroke-width="2.2"/>
                    <line x1="290" y1="120" x2="335" y2="75" stroke="#22C55E" stroke-width="2.2"/>
                    <line x1="290" y1="260" x2="335" y2="215" stroke="#22C55E" stroke-width="2.2"/>
                    <line x1="150" y1="260" x2="195" y2="215" stroke="#3B82F6" stroke-width="1.8" stroke-dasharray="5,4"/>
                    <text x="220" y="284" fill="#22C55E" font-family="JetBrains Mono" font-size="13" font-weight="700" text-anchor="middle">a = ${a} ${u}</text>
                `;
                break;
            }
            case 'paralelepipedo': {
                const a = params.a || 6;
                const b = params.b || 4;
                const c = params.c || 3;
                conteudo = `
                    <polygon points="120,135 300,135 300,255 120,255" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="2.5"/>
                    <polygon points="175,85 355,85 355,205 175,205" fill="rgba(59, 130, 246, 0.08)" stroke="#3B82F6" stroke-width="2" stroke-dasharray="5,4"/>
                    <line x1="120" y1="135" x2="175" y2="85" stroke="#22C55E" stroke-width="2.2"/>
                    <line x1="300" y1="135" x2="355" y2="85" stroke="#22C55E" stroke-width="2.2"/>
                    <line x1="300" y1="255" x2="355" y2="205" stroke="#22C55E" stroke-width="2.2"/>
                    <line x1="120" y1="255" x2="175" y2="205" stroke="#3B82F6" stroke-width="1.8" stroke-dasharray="5,4"/>
                    <text x="210" y="278" fill="#22C55E" font-family="JetBrains Mono" font-size="12.5" font-weight="700" text-anchor="middle">a = ${a} ${u}</text>
                    <text x="342" y="242" fill="#F59E0B" font-family="JetBrains Mono" font-size="12.5" font-weight="700">b = ${b} ${u}</text>
                    <text x="366" y="150" fill="#3B82F6" font-family="JetBrains Mono" font-size="12.5" font-weight="700">c = ${c} ${u}</text>
                `;
                break;
            }
            case 'esfera': {
                const r = params.r || 5;
                conteudo = `
                    <circle cx="240" cy="170" r="105" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="3"/>
                    <ellipse cx="240" cy="170" rx="105" ry="34" fill="none" stroke="#3B82F6" stroke-width="2" stroke-dasharray="6,4"/>
                    <line x1="240" y1="170" x2="345" y2="170" stroke="#F59E0B" stroke-width="2.5"/>
                    <circle cx="240" cy="170" r="4" fill="#F59E0B"/>
                    <text x="292" y="158" fill="#F59E0B" font-family="JetBrains Mono" font-size="13" font-weight="700" text-anchor="middle">r = ${r} ${u}</text>
                `;
                break;
            }
            case 'cilindro': {
                const r = params.r || 4;
                const h = params.h || 8;
                conteudo = `
                    <path d="M 160,95 L 160,245 A 80,26 0 0,0 320,245 L 320,95" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="2.5"/>
                    <ellipse cx="240" cy="95" rx="80" ry="26" fill="rgba(34, 197, 94, 0.18)" stroke="#22C55E" stroke-width="2.5"/>
                    <ellipse cx="240" cy="245" rx="80" ry="26" fill="none" stroke="#3B82F6" stroke-width="1.8" stroke-dasharray="5,4"/>
                    <line x1="240" y1="95" x2="240" y2="245" stroke="#3B82F6" stroke-width="2" stroke-dasharray="5,4"/>
                    <line x1="240" y1="245" x2="320" y2="245" stroke="#F59E0B" stroke-width="2.5"/>
                    <text x="280" y="238" fill="#F59E0B" font-family="JetBrains Mono" font-size="12.5" font-weight="700" text-anchor="middle">r = ${r} ${u}</text>
                    <text x="336" y="175" fill="#3B82F6" font-family="JetBrains Mono" font-size="12.5" font-weight="700">h = ${h} ${u}</text>
                `;
                break;
            }
            case 'cone': {
                const r = params.r || 3;
                const h = params.h || 4;
                const g = Math.sqrt(r * r + h * h).toFixed(2).replace('.', ',');
                conteudo = `
                    <polygon points="240,68 155,245 325,245" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" stroke-width="2.5"/>
                    <ellipse cx="240" cy="245" rx="85" ry="26" fill="rgba(34, 197, 94, 0.15)" stroke="#22C55E" stroke-width="2.2"/>
                    <line x1="240" y1="68" x2="240" y2="245" stroke="#3B82F6" stroke-width="2" stroke-dasharray="5,4"/>
                    <line x1="240" y1="245" x2="325" y2="245" stroke="#F59E0B" stroke-width="2.5"/>
                    <text x="282" y="238" fill="#F59E0B" font-family="JetBrains Mono" font-size="12" font-weight="700" text-anchor="middle">r = ${r} ${u}</text>
                    <text x="228" y="165" fill="#3B82F6" font-family="JetBrains Mono" font-size="12" font-weight="700" text-anchor="end">h = ${h} ${u}</text>
                    <text x="300" y="152" fill="#22C55E" font-family="JetBrains Mono" font-size="12" font-weight="700">g = ${g} ${u}</text>
                `;
                break;
            }
        }

        return `
        <svg viewBox="0 0 480 340" width="100%" height="100%" style="max-height: 380px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--graph-bg);">
            ${gradeBg}
            ${conteudo}
        </svg>`;
    },

    /**
     * Desenha a Circunferência Trigonométrica Interativa em SVG.
     */
    gerarSvgCirculoTrigonometrico(anguloGraus = 30) {
        const rad = (anguloGraus * Math.PI) / 180;
        const cx = 240;
        const cy = 175;
        const R = 118;

        const cosVal = Math.cos(rad);
        const senVal = Math.sin(rad);
        const px = cx + R * cosVal;
        const py = cy - R * senVal;

        return `
        <svg viewBox="0 0 480 350" width="100%" height="100%" style="max-height: 390px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--graph-bg);">
            <defs>
                <pattern id="trig-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(59, 82, 117, 0.18)" stroke-width="1"/>
                </pattern>
            </defs>
            <rect width="480" height="350" fill="url(#trig-grid)"/>

            <!-- Eixos -->
            <line x1="40" y1="${cy}" x2="440" y2="${cy}" stroke="#3B5275" stroke-width="1.6"/>
            <line x1="${cx}" y1="20" x2="${cx}" y2="330" stroke="#3B5275" stroke-width="1.6"/>
            <text x="428" y="${cy - 8}" fill="#8CA2C0" font-family="JetBrains Mono" font-size="11">cos θ</text>
            <text x="${cx + 8}" y="32" fill="#8CA2C0" font-family="JetBrains Mono" font-size="11">sen θ</text>

            <!-- Círculo Unitário R = 1 -->
            <circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(59, 130, 246, 0.05)" stroke="#3B82F6" stroke-width="2.2"/>

            <!-- Projeção Cosseno (Azul) -->
            <line x1="${cx}" y1="${cy}" x2="${px}" y2="${cy}" stroke="#3B82F6" stroke-width="4"/>
            <line x1="${px}" y1="${py}" x2="${px}" y2="${cy}" stroke="#94A3B8" stroke-width="1.4" stroke-dasharray="4,4"/>

            <!-- Projeção Seno (Verde/Vermelho) -->
            <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${py}" stroke="#22C55E" stroke-width="4"/>
            <line x1="${px}" y1="${py}" x2="${cx}" y2="${py}" stroke="#94A3B8" stroke-width="1.4" stroke-dasharray="4,4"/>

            <!-- Raio Vetor e Ponto P(cos θ, sen θ) -->
            <line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="#F59E0B" stroke-width="2.5"/>
            <circle cx="${px}" cy="${py}" r="6" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.8"/>

            <!-- Rótulos dos Ângulos dos Eixos -->
            <text x="${cx + R + 8}" y="${cy + 14}" fill="#8CA2C0" font-family="JetBrains Mono" font-size="11">0° / 2π</text>
            <text x="${cx - 18}" y="${cy - R - 8}" fill="#8CA2C0" font-family="JetBrains Mono" font-size="11">90° (π/2)</text>
            <text x="${cx - R - 48}" y="${cy + 14}" fill="#8CA2C0" font-family="JetBrains Mono" font-size="11">180° (π)</text>
            <text x="${cx - 22}" y="${cy + R + 18}" fill="#8CA2C0" font-family="JetBrains Mono" font-size="11">270° (3π/2)</text>

            <!-- Etiqueta do Ponto P -->
            <rect x="14" y="14" width="215" height="68" rx="6" fill="rgba(17, 27, 46, 0.92)" stroke="#253650"/>
            <text x="24" y="34" fill="#F59E0B" font-family="JetBrains Mono" font-size="12" font-weight="700">θ = ${anguloGraus}° (${(rad / Math.PI).toFixed(2).replace('.', ',')}π rad)</text>
            <text x="24" y="52" fill="#3B82F6" font-family="JetBrains Mono" font-size="11.5" font-weight="600">cos(${anguloGraus}°) = ${cosVal.toFixed(4).replace('.', ',')}</text>
            <text x="24" y="70" fill="#22C55E" font-family="JetBrains Mono" font-size="11.5" font-weight="600">sen(${anguloGraus}°) = ${senVal.toFixed(4).replace('.', ',')}</text>
        </svg>`;
    },

    /**
     * Desenha o Plano Cartesiano Vetorial com setas para u, v e resultante.
     */
    gerarSvgVetores(u, v, operacao = 'soma') {
        const cx = 240;
        const cy = 185;
        const esc = 24;

        const uPx = { x: cx + u.x * esc, y: cy - u.y * esc };
        const vPx = { x: cx + v.x * esc, y: cy - v.y * esc };

        let res = null;
        let rotuloRes = '';
        if (operacao === 'soma') {
            res = { x: u.x + v.x, y: u.y + v.y };
            rotuloRes = `u + v = (${res.x}, ${res.y})`;
        } else if (operacao === 'subtracao') {
            res = { x: u.x - v.x, y: u.y - v.y };
            rotuloRes = `u - v = (${res.x}, ${res.y})`;
        }

        const resPx = res ? { x: cx + res.x * esc, y: cy - res.y * esc } : null;

        return `
        <svg viewBox="0 0 480 350" width="100%" height="100%" style="max-height: 390px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--graph-bg);">
            <defs>
                <pattern id="vec-grid" width="${esc}" height="${esc}" patternUnits="userSpaceOnUse">
                    <path d="M ${esc} 0 L 0 0 0 ${esc}" fill="none" stroke="rgba(59, 82, 117, 0.22)" stroke-width="1"/>
                </pattern>
                <marker id="arrow-u" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#22C55E"/>
                </marker>
                <marker id="arrow-v" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6"/>
                </marker>
                <marker id="arrow-res" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B"/>
                </marker>
            </defs>
            <rect width="480" height="350" fill="url(#vec-grid)"/>

            <!-- Eixos -->
            <line x1="0" y1="${cy}" x2="480" y2="${cy}" stroke="#3B5275" stroke-width="1.8"/>
            <line x1="${cx}" y1="0" x2="${cx}" y2="350" stroke="#3B5275" stroke-width="1.8"/>

            ${resPx && operacao === 'soma' ? `
                <!-- Regra do Paralelogramo -->
                <line x1="${uPx.x}" y1="${uPx.y}" x2="${resPx.x}" y2="${resPx.y}" stroke="rgba(148,163,184,0.4)" stroke-width="1.5" stroke-dasharray="4,4"/>
                <line x1="${vPx.x}" y1="${vPx.y}" x2="${resPx.x}" y2="${resPx.y}" stroke="rgba(148,163,184,0.4)" stroke-width="1.5" stroke-dasharray="4,4"/>
            ` : ''}

            <!-- Vetor u (Verde) -->
            <line x1="${cx}" y1="${cy}" x2="${uPx.x}" y2="${uPx.y}" stroke="#22C55E" stroke-width="3" marker-end="url(#arrow-u)"/>
            <text x="${uPx.x + 6}" y="${uPx.y - 6}" fill="#22C55E" font-family="JetBrains Mono" font-size="12" font-weight="700">u(${u.x}, ${u.y})</text>

            <!-- Vetor v (Azul) -->
            <line x1="${cx}" y1="${cy}" x2="${vPx.x}" y2="${vPx.y}" stroke="#3B82F6" stroke-width="3" marker-end="url(#arrow-v)"/>
            <text x="${vPx.x + 6}" y="${vPx.y + 14}" fill="#3B82F6" font-family="JetBrains Mono" font-size="12" font-weight="700">v(${v.x}, ${v.y})</text>

            <!-- Vetor Resultante (Âmbar) -->
            ${resPx ? `
                <line x1="${cx}" y1="${cy}" x2="${resPx.x}" y2="${resPx.y}" stroke="#F59E0B" stroke-width="3" marker-end="url(#arrow-res)"/>
                <text x="${resPx.x + 8}" y="${resPx.y - 4}" fill="#F59E0B" font-family="JetBrains Mono" font-size="12.5" font-weight="700">${rotuloRes}</text>
            ` : ''}
        </svg>`;
    },

    /**
     * Gera gráficos estatísticos (Histograma, Barras ou Linhas) em SVG.
     */
    gerarSvgEstatistica(frequencias, tipoGrafico = 'histograma', media = 0) {
        const itens = frequencias || [];
        if (itens.length === 0) return `<div style="padding:20px;color:var(--text-secondary);">Insira números válidos para gerar o gráfico.</div>`;

        const maxFreq = Math.max(...itens.map(i => i.freq), 3);
        const w = 480;
        const h = 330;
        const padEsq = 48;
        const padDir = 28;
        const padTopo = 34;
        const padBase = 44;
        const areaW = w - padEsq - padDir;
        const areaH = h - padTopo - padBase;

        let linhasGrade = '';
        for (let f = 0; f <= maxFreq; f++) {
            const py = padTopo + areaH - (f / maxFreq) * areaH;
            linhasGrade += `
                <line x1="${padEsq}" y1="${py}" x2="${w - padDir}" y2="${py}" stroke="#1C2C46" stroke-width="1"/>
                <text x="${padEsq - 10}" y="${py + 4}" fill="#8CA2C0" font-family="JetBrains Mono" font-size="11" text-anchor="end">${f}</text>
            `;
        }

        const n = itens.length;
        const gap = tipoGrafico === 'histograma' ? 4 : 16;
        const largBarra = Math.min(68, (areaW - gap * (n + 1)) / n);
        const offsetInicial = padEsq + (areaW - (largBarra * n + gap * (n - 1))) / 2;

        let elementos = '';
        const pontosLinha = [];

        itens.forEach((item, idx) => {
            const xBarra = offsetInicial + idx * (largBarra + gap);
            const altBarra = (item.freq / maxFreq) * areaH;
            const yBarra = padTopo + areaH - altBarra;
            const xCentro = xBarra + largBarra / 2;
            pontosLinha.push({ x: xCentro, y: yBarra, val: item.valor, freq: item.freq });

            if (tipoGrafico !== 'linhas') {
                elementos += `
                    <rect x="${xBarra}" y="${yBarra}" width="${largBarra}" height="${altBarra}" rx="3"
                          fill="rgba(59, 130, 246, 0.72)" stroke="#60A5FA" stroke-width="1.5"/>
                    <text x="${xCentro}" y="${yBarra - 7}" fill="#E6EDF7" font-family="JetBrains Mono" font-size="11.5" font-weight="700" text-anchor="middle">${item.freq}</text>
                `;
            }

            elementos += `
                <text x="${xCentro}" y="${h - 18}" fill="#E6EDF7" font-family="JetBrains Mono" font-size="12" font-weight="600" text-anchor="middle">${item.valor}</text>
            `;
        });

        if (tipoGrafico === 'linhas' && pontosLinha.length > 0) {
            const polyPts = pontosLinha.map(p => `${p.x},${p.y}`).join(' ');
            elementos += `<polyline points="${polyPts}" fill="none" stroke="#22C55E" stroke-width="3"/>`;
            pontosLinha.forEach(p => {
                elementos += `
                    <circle cx="${p.x}" cy="${p.y}" r="5" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1.5"/>
                    <text x="${p.x}" y="${p.y - 10}" fill="#22C55E" font-family="JetBrains Mono" font-size="11.5" font-weight="700" text-anchor="middle">${p.freq}</text>
                `;
            });
        }

        return `
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" style="max-height: 380px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--graph-bg);">
            <text x="${w / 2}" y="22" fill="#E6EDF7" font-family="Inter, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
                Distribuição dos dados (${tipoGrafico === 'histograma' ? 'Histograma de Frequências' : tipoGrafico === 'barras' ? 'Gráfico de Barras' : 'Polígono de Frequências'}) — Média = ${media.toFixed(2).replace('.', ',')}
            </text>
            ${linhasGrade}
            <line x1="${padEsq}" y1="${padTopo}" x2="${padEsq}" y2="${padTopo + areaH}" stroke="#3B5275" stroke-width="1.8"/>
            <line x1="${padEsq}" y1="${padTopo + areaH}" x2="${w - padDir}" y2="${padTopo + areaH}" stroke="#3B5275" stroke-width="1.8"/>
            ${elementos}
        </svg>`;
    }
};
