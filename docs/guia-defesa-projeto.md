# Guia de Defesa e Explicação da Arquitetura — MathLab (CDI • AP2)

Este documento resume a organização do código-fonte e responde às principais perguntas técnicas e matemáticas que podem ser feitas durante a apresentação do projeto.

---

## 1. Visão Geral da Arquitetura em Camadas

O projeto foi organizado seguindo boas práticas de Engenharia de Software, separando estrutura, estilo, controle de estado, motor matemático, renderização gráfica e testes automatizados:

- **`index.html`**: Estrutura semântica da interface em três painéis (Entrada, Laboratório Gráfico e Propriedades/Análise), modais e barras de ferramentas.
- **`src/css/estilos.css`**: Sistema de design (Design Tokens em variáveis CSS), temas escuro (`#0B1220`) e claro, tipografia (`Inter` e `JetBrains Mono`) e responsividade desktop.
- **`src/js/app.js` (`MathLabApp`)**: Controlador principal que gerencia o estado reativo (`state`), sincronização entre os modos **Fórmula pronta** e **Normal**, histórico/favoritos (`localStorage`), atalhos de teclado e eventos de UI.
- **`src/js/motor-matematico.js` (`MathLabCalc`)**: Motor de cálculo puro e independente da interface. Implementa o compilador seguro de expressões, estudo analítico de 8 tipos de funções, limites laterais/bilaterais, derivação simbólica recursiva e numérica, integração analítica e numérica (Riemann e Simpson), álgebra, geometria, trigonometria, vetores/matrizes e estatística.
- **`src/js/motor-grafico.js` (`MathLabGraph`)**: Motor de visualização em HTML5 Canvas 2D e SVG com suporte a alto DPI (`devicePixelRatio`), redimensionamento automático (`ResizeObserver`), zoom/pan, detecção de assíntotas verticais, buracos de descontinuidade e sombreamento de integrais por sinal.
- **`src/python/motor_simbolico.py`**: Motor simbólico complementar escrito em Python com `SymPy` para validação algébrica de referência.

---

## 2. Dez Perguntas e Respostas para a Defesa

### 1. Como o código está dividido e organizado?
O arquivo `index.html` na raiz declara a estrutura visual; `src/css/estilos.css` define a identidade visual e o layout; `src/js/app.js` gerencia o estado da aplicação e os eventos do usuário; `src/js/motor-matematico.js` concentra toda a lógica matemática e validações; e `src/js/motor-grafico.js` desenha as curvas, áreas e figuras geométricas no Canvas e em SVG. A pasta `tests/` contém 8 suítes unitárias/analíticas e 2 suítes de interface.

### 2. Por que o modo "Normal" e a "Fórmula pronta" mostram sempre a mesma função?
Ambos consomem e atualizam a mesma fonte de verdade (`MathLabApp.state.funcoes` ou o estado específico do módulo ativo). O tipo da função e seus parâmetros numéricos determinam simultaneamente a expressão textual, a lista de propriedades analíticas e a curva do gráfico. Alternar entre os modos apenas muda a forma de visualização e edição, sem perda de precisão decimal nos coeficientes.

### 3. Como o sistema encontra e valida o vértice da função quadrática?
Em `calcularQuadratica(a, b, c)`, calculamos $x_v = -\frac{b}{2a}$ e conferimos $y_v$ por até **quatro métodos independentes**:
1. Fórmula direta do discriminante: $y_v = -\frac{\Delta}{4a}$, onde $\Delta = b^2 - 4ac$.
2. Substituição funcional na lei da função: $y_v = f(x_v) = a(x_v)^2 + b(x_v) + c$.
3. Forma canônica (completamento de quadrados): $y_v = c - \frac{b^2}{4a}$.
4. Forma fatorada (quando $\Delta \ge 0$): $y_v = -\frac{a(r_2 - r_1)^2}{4}$.

Por exemplo, em $f(x) = x^2 - 4x - 5$, temos $\Delta = 36$, raízes $-1$ e $5$, e vértice $V(2, -9)$ confirmado pelas quatro vias.

### 4. O que acontece nos casos especiais $a = 0$ ou $\Delta < 0$ na quadrática?
- Quando $a = 0$, a equação deixa de ser do 2º grau (degenera em função afim $bx + c$ ou constante $c$). O sistema emite um aviso explícito e analisa a reta/constante resultante sem dividir por zero. Se $a = b = c = 0$, informa que todo $x \in \mathbb{R}$ é raiz.
- Quando $\Delta < 0$, não existem raízes reais; o sistema exibe a mensagem correspondente, mantém o gráfico completo acima (se $a > 0$) ou abaixo (se $a < 0$) do eixo $x$ e valida o vértice pelas 3 formas reais aplicáveis.

### 5. Por que as funções exponencial e logarítmica possuem restrições na base?
Pela definição matemática, a base $a$ deve satisfazer $a > 0$ e $a \neq 1$. Além disso, no logaritmo $\log_a(x)$, o logaritmando exige domínio $x > 0$. O cálculo utiliza a mudança de base $\log_a(x) = \frac{\ln(x)}{\ln(a)}$. Na exponencial generalizada $f(x) = C \cdot a^x$, o intercepto vertical ocorre em $(0, C)$.

### 6. Como explicar os dois exemplos clássicos do módulo de Limites?
- **Descontinuidade removível:** Em $\lim_{x \to 2} \frac{x^2 - 4}{x - 2}$, substituir $x = 2$ gera a indeterminação $\frac{0}{0}$. Fatorando o numerador como $(x - 2)(x + 2)$, para $x \neq 2$ a função equivale a $x + 2$, cujo limite lateral à esquerda e à direita converge para $4$, gerando um ponto vazado (buraco) em $(2, 4)$.
- **Limite inexistente:** Em $\lim_{x \to 0} \frac{1}{x}$, o limite lateral à esquerda diverge para $-\infty$ e à direita para $+\infty$. Como os limites laterais não coincidem em um valor finito, o limite bilateral **não existe** e há uma assíntota vertical em $x = 0$.

### 7. Quais regras de derivação o motor aplica e como elas são conferidas?
O motor implementa 6 regras de derivação simbólica recursiva: **constante**, **potência**, **soma/subtração**, **produto**, **quociente** e **regra da cadeia**. O resultado simbólico $f'(x)$ é conferido numericamente contra o quociente incremental central $\frac{f(x+h) - f(x-h)}{2h}$. Também detecta pontos angulosos (quinas) onde a derivada não existe, como em $f(x) = |x|$ em $x = 0$ (derivadas laterais $-1$ e $+1$).

### 8. Como a integral definida é calculada, desenhada e verificada?
Quando o integrador identifica a regra analítica (constante, potência, soma, exponencial, trigonométrica ou substituição), obtém a primitiva $F(x)$ e aplica o Teorema Fundamental do Cálculo: $\int_a^b f(x)\,dx = F(b) - F(a)$. A verificação exige duas confirmações independentes:
1. A derivada numérica da primitiva $F'(x)$ deve coincidir com o integrando $f(x)$ no intervalo.
2. O valor analítico deve concordar com a **Regra de Simpson** com erro inferior a $10^{-6}$.
No gráfico, regiões acima do eixo $x$ são sombreadas em verde (contribuição positiva) e abaixo do eixo em vermelho (contribuição negativa), diferenciando **integral líquida** de **área geométrica total**.

### 9. O selo "Verificado" significa uma prova formal absoluta?
Não. O selo "Verificado" indica que **dois métodos independentes de cálculo** convergiram dentro de uma tolerância rigorosa nos pontos de controle, rejeitando `NaN`, infinitos ou simples comparação textual. Em expressões livres onde não há segundo método analítico independente, o selo não é emitido automaticamente.

### 10. Como os testes automatizados garantem a confiabilidade do projeto?
O comando `npm test` (`node tests/executar-testes.js`) executa **8 suítes automatizadas**, incluindo:
- Testes de todos os módulos principais (`modulos-gerais.test.js`);
- 800 funções geradas aleatoriamente com verificação de 4.000 avaliações contra identidades algébricas como relações de Girard/Viète, simetria e mudança de base (`funcoes-auditoria.test.js`);
- Sincronização de estado entre modos de entrada e histórico (`sincronizacao-estado.test.js`);
- 20 testes de regressão numérica e segurança do parser (`regressoes-matematicas.test.js`);
- Validação das 6 regras de derivação e 6 de integração (`calculo-regras.test.js` e `integrais-modulo.test.js`);
- Validação de geometria de Canvas e cascata CSS (`graficos-renderizacao.test.js` e `graficos-layout.test.js`).
