# MathLab — Calculadora Científica e Laboratório de Matemática (CDI • AP2)

Projeto acadêmico do 1º período de **Engenharia de Software** — **UNICATÓLICA RN**.

- **Disciplina:** Cálculo Diferencial e Integral (CDI — AP2)
- **Integrantes:** *(preencher nomes e matrículas)*
- **Professora:** *(preencher nome)*

---

## 1. Problema e Objetivos

Uma resposta numérica isolada não explica o comportamento analítico e geométrico de uma função. O **MathLab** integra entrada parametrizada e livre, motor de cálculo, visualização gráfica interativa em Canvas/SVG, tabelas de valores, resolução passo a passo e verificação cruzada por métodos independentes.

O objetivo é relacionar expressões algébricas às suas propriedades analíticas (domínio, imagem, raízes, vértices, limites laterais, derivadas e integrais), mantendo rigor matemático e tratamento explícito de casos especiais e restrições de domínio.

---

## 2. Estrutura do Projeto

O repositório está organizado segundo padrões modernos de Engenharia de Software, separando código-fonte (`src/`), testes automatizados (`tests/`) e documentação técnica (`docs/`):

```text
CALCULADORA 2.0/
├── index.html                              # Entrada principal da aplicação web (abre direto no navegador)
├── package.json                            # Manifesto do projeto e scripts de automação (npm test, npm start)
├── requirements.txt                        # Dependências opcionais do motor simbólico em Python (SymPy)
├── README.md                               # Documentação principal do projeto
├── .gitignore                              # Regras de exclusão do controle de versão
│
├── src/                                    # Código-fonte da aplicação
│   ├── css/
│   │   └── estilos.css                     # Sistema de design, temas (Escuro/Claro) e layout responsivo
│   ├── js/
│   │   ├── app.js                          # Controlador principal de interface, estado reativo e eventos
│   │   ├── motor-matematico.js             # Motor de cálculo analítico e numérico (MathLabCalc)
│   │   └── motor-grafico.js                # Motor de renderização em HTML5 Canvas 2D e SVG (MathLabGraph)
│   └── python/
│       └── motor_simbolico.py              # Motor simbólico complementar em Python + SymPy
│
├── tests/                                  # Suíte de testes automatizados e auditoria QA (Node.js)
│   ├── executar-testes.js                  # Orquestrador central das 9 suítes de testes
│   ├── modulos-gerais.test.js              # Validação dos módulos (Científica, Funções, Geometria, Estatística)
│   ├── sincronizacao-estado.test.js        # Sincronização entre Fórmula Pronta, Modo Normal e Histórico
│   ├── funcoes-auditoria.test.js           # Auditoria estocástica (800 funções aleatórias + 4.000 comparações)
│   ├── regressoes-matematicas.test.js      # Casos de borda, segurança do parser e estabilidade numérica
│   ├── calculo-regras.test.js              # Validação das 6 regras de Derivadas e 6 de Integrais
│   ├── integrais-modulo.test.js            # Estado, somas de Riemann, Regra de Simpson e áreas com sinal
│   ├── graficos-renderizacao.test.js       # Geometria de curvas, assíntotas e áreas sombreadas no Canvas
│   ├── trigonometria-modulo.test.js          # Propriedades, exatos e 243 combinações trigonométricas
│   ├── interface-firefox.py                 # Aceitação real no Firefox via WebDriver
│   ├── graficos-layout.test.js             # Regressão de cascata CSS e posicionamento de legendas
│   ├── interface-navegador.test.js         # Teste integrado E2E dos 11 módulos (Playwright)
│   └── interface-integrais.test.js         # Teste visual de aceitação do módulo de Integrais (Playwright)
│
└── docs/                                   # Documentação acadêmica, guias e relatórios técnicos
    ├── guia-defesa-projeto.md              # Guia de explicação do código e 10 perguntas da apresentação
    ├── relatorio-auditoria-qa.md           # Relatório técnico de auditoria matemática e QA
    ├── relatorio-revisao-integrais.md      # Relatório técnico de revisão do módulo de Integrais
    ├── comparativo-evolucao-ui.md          # Comparativo descritivo da evolução da interface (Antes/Depois)
    ├── roteiro-validacao-humana.md         # Roteiro de inspeção manual e checklist de validação humana
    └── evidencias/                         # Registros de execução e capturas de tela
        ├── captura-sobreposicao-antes.png  # Evidência visual do diagnóstico de legenda corrigido
        └── log-execucao-testes.txt         # Log consolidado da aprovação das 9 suítes de testes
```

---

## 3. Como Executar

### 3.1. Aplicação Web (HTML / CSS / JS)

A aplicação não exige etapa de build nem dependências externas obrigatórias. Basta abrir o arquivo [`index.html`](index.html) diretamente em qualquer navegador moderno, ou iniciar um servidor HTTP local:

```bash
npm start
# Ou diretamente com Python:
python3 -m http.server 8000
# Acesse http://localhost:8000
```

### 3.2. Suíte de Testes Automatizados

Para executar todas as 9 suítes de validação matemática, estado e layout no Node.js:

```bash
npm test
# Ou diretamente:
node tests/executar-testes.js
```

A saída integral da execução validada está registrada em [`docs/evidencias/log-execucao-testes.txt`](docs/evidencias/log-execucao-testes.txt).

### 3.3. Testes Visuais em Navegador Real (Opcional — Playwright)

Em um ambiente que permita inicialização de sockets/navegador headless:

```bash
npm run test:ui
npm run test:ui-integrais
```

### 3.3.1. Aceitação em Firefox

Com o MathLab servido na porta 5500 e o geckodriver instalado, execute em terminais separados:

```bash
geckodriver --port 4444 --allow-system-access
npm run test:firefox
```

O teste usa apenas a biblioteca padrão do Python e o Firefox, em perfil temporário. `MATHLAB_URL` e `MATHLAB_WEBDRIVER` permitem alterar a URL e o controlador. Inclui T1–T6, os 11 modos em três resoluções e zoom nativo de 90% a 125%, alinhamento dos controles, propriedades e o seletor de Álgebra. Consulte o [relatório com antes e depois](docs/relatorio-trigonometria-interface.md), o [log Node atual](docs/evidencias/log-testes-trigonometria.txt) e o [log Firefox](docs/evidencias/log-firefox-trigonometria.txt).

### 3.4. Motor Simbólico Complementar em Python

O arquivo [`src/python/motor_simbolico.py`](src/python/motor_simbolico.py) implementa um motor simbólico de referência utilizando `SymPy`:

```bash
python3 -m pip install -r requirements.txt
```

---

## 4. Arquitetura e Fluxo de Usabilidade

- **Cabeçalho enxuto:** Reúne identificação da marca, busca global (`Ctrl+K`), **Favoritos**, menu **Compartilhar** (Copiar resultado, LaTeX, PNG, PDF e Link) e menu **Configurações** (tema escuro/claro, escala tipográfica, painel visual, unidade de ângulo e casas decimais).
- **Dois Modos de Entrada (`Fórmula pronta` e `Normal`):**
  - **Fórmula pronta (padrão):** Exibe a estrutura matemática montada com campos editáveis coloridos (slots), dicas contextuais ao focar, navegação por `Tab`/setas e atualização em tempo real.
  - **Modo Normal:** Campo em fonte monoespaçada para digitação livre (`x^2 - 4x - 5`, `2*sen(pi/6)`, `sqrt(x)`), sincronizado com a mesma fonte de estado (`MathLabApp.state`).

---

## 5. Módulos e Justificativas Matemáticas

### 5.1. Estudo Completo de Funções (8 Tipos)

| Tipo e Exemplo | Propriedades Analisadas e Interpretação |
| :--- | :--- |
| **Constante** `f(x) = 5` | Domínio $\mathbb{R}$, imagem $\{5\}$, taxa de variação nula, função par. |
| **Afim** `f(x) = 2x + 1` | Domínio e imagem $\mathbb{R}$, raiz $x = -1/2$, intercepto $(0,1)$, estritamente crescente ($a > 0$). |
| **Linear** `f(x) = 3x` | Caso particular da função afim com $b = 0$; passa pela origem $(0,0)$ e é função ímpar. |
| **Quadrática** `f(x) = x^2 - 4x - 5` | $\Delta = 36$, raízes $-1$ e $5$, vértice $V(2, -9)$ validado pelas 4 formas, imagem $[-9, +\infty)$. |
| **Modular** `f(x) = \|x\|` | Imagem $[0, +\infty)$, função par, decrescente em $(-\infty, 0]$ e crescente em $[0, +\infty)$, ponto anguloso em $x = 0$. |
| **Exponencial** `f(x) = C · a^x` | Exige base $a > 0$ e $a \neq 1$; intercepto $(0, C)$ e assíntota horizontal $y = 0$. |
| **Logarítmica** `f(x) = log_a(x)` | Domínio $(0, +\infty)$, imagem $\mathbb{R}$, raiz $x = 1$, assíntota vertical $x = 0$, inversa da exponencial. |
| **Trigonométrica** `A·sen(Bx + C) + D` | Imagem $[D - \|A\|, D + \|A\|]$, amplitude $\|A\|$, período $2\pi/\|B\|$ e deslocamento de fase $-C/B$. |

### 5.2. Limites e Continuidade

- **Descontinuidade removível:** $\lim_{x \to 2} \frac{x^2 - 4}{x - 2} = 4$, com fatoração $(x-2)(x+2)/(x-2) = x+2$ para $x \neq 2$ e representação de ponto vazado (buraco) em $(2, 4)$.
- **Limite bilateral inexistente:** $\lim_{x \to 0} \frac{1}{x}$ apresenta limites laterais divergentes ($-\infty$ à esquerda e $+\infty$ à direita), caracterizando descontinuidade infinita e assíntota vertical em $x = 0$.

### 5.3. Derivadas (6 Regras Executáveis)

Validado em [`tests/calculo-regras.test.js`](tests/calculo-regras.test.js) por derivação simbólica recursiva, fórmula algébrica independente e quociente incremental:
1. **Constante:** $\frac{d}{dx}[7] = 0$
2. **Potência:** $\frac{d}{dx}[x^4] = 4x^3$
3. **Soma / Subtração:** $\frac{d}{dx}[x^3 - 3x] = 3x^2 - 3$
4. **Produto:** $\frac{d}{dx}[x^3 \operatorname{sen}(x)] = 3x^2\operatorname{sen}(x) + x^3\cos(x)$
5. **Quociente:** $\frac{d}{dx}\left[\frac{x^2+1}{x+2}\right] = \frac{2x(x+2) - (x^2+1)}{(x+2)^2}$
6. **Cadeia:** $\frac{d}{dx}[\operatorname{sen}(2x+1)] = 2\cos(2x+1)$

### 5.4. Integrais Definidas e Indefinidas (6 Regras Executáveis)

Validado em [`tests/calculo-regras.test.js`](tests/calculo-regras.test.js) e [`tests/integrais-modulo.test.js`](tests/integrais-modulo.test.js) derivando a primitiva $F(x)$ e comparando $\int_a^b f(x)\,dx = F(b) - F(a)$ com a Regra de Simpson e Soma de Ponto Médio ($n = 4, 10, 100$):
1. **Constante:** $\int 3\,dx = 3x + C$
2. **Potência:** $\int_0^3 x^2\,dx = \left[\frac{x^3}{3}\right]_0^3 = 9$
3. **Soma / Subtração:** $\int (x^2 + 2x - 1)\,dx = \frac{x^3}{3} + x^2 - x + C$
4. **Exponencial:** $\int e^{2x}\,dx = \frac{e^{2x}}{2} + C$
5. **Trigonométrica:** $\int \operatorname{sen}(x)\,dx = -\cos(x) + C$
6. **Substituição:** $\int 2x\cos(x^2)\,dx = \operatorname{sen}(x^2) + C$

### 5.5. Ambientes Complementares

- **Científica:** Expressões trigonométricas, fatoriais, raízes, logaritmos e suporte a Graus/Radianos (`2 · sen(π/6) + √16 = 5`).
- **Álgebra:** Equações de 1º e 2º grau com Bhaskara detalhado, sistemas lineares, fatoração e produtos notáveis.
- **Geometria Plana e Espacial:** 11 figuras (círculo, quadrado, retângulo, triângulo, trapézio, losango, cubo, paralelepípedo, esfera, cilindro e cone) com fórmulas dimensionais e desenho proporcional em SVG.
- **Trigonometria:** Ciclo trigonométrico interativo, conversão grau $\leftrightarrow$ radiano e identidades fundamentais.
- **Vetores e Matrizes:** Soma vetorial, produto escalar, determinante e operações matriciais passo a passo.
- **Estatística e Modelagem:** Média, mediana, moda, variância, desvio padrão, histograma e modelos exponenciais/quadráticos aplicados.

---

## 6. Documentação Complementar

- [**Guia de Defesa e Perguntas da Apresentação**](docs/guia-defesa-projeto.md)
- [**Relatório de Auditoria Matemática e QA**](docs/relatorio-auditoria-qa.md)
- [**Relatório Técnico da Revisão de Integrais**](docs/relatorio-revisao-integrais.md)
- [**Comparativo de Evolução da Interface (Antes / Depois)**](docs/comparativo-evolucao-ui.md)
- [**Roteiro de Validação Manual e Homologação Humana**](docs/roteiro-validacao-humana.md)

- [Revisão de Trigonometria e alinhamento: causas, capturas e testes](docs/relatorio-trigonometria-interface.md)
# CALCULADORA-CIENTIFICA
