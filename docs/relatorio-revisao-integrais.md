# Revisão de Integrais — 12/11/2026

## Correção após a captura enviada pelo usuário

A captura `evidencias/captura-sobreposicao-antes.png` mostra a legenda ocupando quase todo o gráfico, com curva e eixos visíveis nas bordas. A causa da sobreposição foi identificada na cascata CSS: `.graph-legend-floating` recebia `top:12px; right:12px` da regra original e `bottom:12px; left:12px` da revisão de layout. Com quatro âncoras e tamanho automático, o elemento absoluto esticava nas duas direções; seu fundo opaco cobria o canvas. Isso afeta todos os modos que usam a legenda flutuante e explica o sintoma compartilhado em Funções e Integrais. A correção anterior do canvas não eliminava essa causa.

Correção: cancelar explicitamente `top` e `right` com `auto`, mantendo apenas `bottom` e `left`. O novo teste da cascata (`tests/graficos-layout.test.js`) valida que a legenda permanece ancorada apenas em `bottom` e `left`. O teste Playwright (`tests/interface-integrais.test.js`) agora também verifica `elementFromPoint` no centro do gráfico e o tamanho da legenda, pois contar pixels do canvas não detecta elementos HTML sobrepostos. As oito suítes locais passaram. O navegador continua bloqueado na inicialização, portanto a captura posterior ainda está pendente. A imagem inicial foi fornecida pelo usuário, não gerada pelo agente.

Os registros abaixo descrevem a primeira entrega; a causa confirmada pela captura e pela cascata é a sobreposição detalhada acima.

## Execução e limites da evidência

A suíte original foi executada antes de qualquer alteração: seis suítes aprovadas. Depois: oito suítes aprovadas, incluindo `integrais-modulo.test.js` e `graficos-layout.test.js`. Não houve troca de stack nem instalação de dependências no projeto.

A tentativa inicial de abrir http://127.0.0.1:5500/index.html com Playwright e Brave falhou antes da navegação: o navegador recebeu SIGTRAP após `setsockopt: Operation not permitted`. A tentativa posterior teve o mesmo resultado (`navegador.txt`). Portanto **não existem capturas antes/depois nem aprovação visual**. Os testes de navegador estão preparados, mas não foram executados com sucesso. Não se afirma que o site foi inspecionado visualmente ou que D6 está concluído.

## Antes e depois por defeito

| Item | Antes / causa identificada no código | Depois / evidência e pendências |
|---|---|---|
| D1 | Não havia ResizeObserver; tamanho dependia do fluxo do canvas e de um piso artificial de 320×240; y dependia somente de f(b). O canvas com height:100% participava do cálculo de altura do contêiner flexível. | Canvas absoluto, contêiner flexível sem altura percentual, ResizeObserver, resolução por DPR, janela amostrada contendo zero, ajuste restaurando a janela integral. Curva de 3 px, áreas por sinal, limites coloridos e mensagem de entrada inválida. **A causa real do sintoma visual original continua sem confirmação no navegador**; os fatores acima são problemas efetivos do código, não uma medição da tela original. |
| D2 | O cartão genérico iniciava `valorPrincipal = exprAtual`, tratando o integrando como resultado. O renderizador de Integrais calculava seus dados isoladamente. | `state.integrais.dados`, produzido por `obterDadosIntegrais`, alimenta resultados, gráfico, métodos e verificação. Testes confirmam `∫₀³ x² dx = 9`, `9,000000` e `125/3`. |
| D3 | sub/sup eram itens independentes de um flex centralizado, sem empilhamento de limites; a indefinida também exibiria os limites. | Grupo de limites empilhados; expoente em grupo próprio; coeficiente e expoente conservam suas cores; fx somente com foco. Conversão `∫(0,3) x^2 dx` nos dois sentidos testada; expressões como π/2 são avaliadas. Posição visual ainda precisa da captura. |
| D4 | Integrando, tipo e limites eram controles duplicados. Campos filhos flexíveis podiam encolher; havia seta separada no botão. | Um seletor por cartões e um integrando por modo; limites somente na fórmula. Rodapé fora da área rolável, dica Enter; conteúdo não encolhe, intervalo sem quebra. Geometria nas duas resoluções ainda depende do navegador. |
| D5 | As quatro abas chamavam o mesmo renderizador e desenhavam o mesmo gráfico, sem tabela específica. Verificação não exigia derivar a primitiva. | Resolução e Verificação têm conteúdo próprio. Métodos mostra pontos médios n=4/10/100, Simpson e erros, com controle de n junto ao gráfico. Selo exige derivada numérica da primitiva e concordância absoluta com Simpson ≤1e-6. Testes matemáticos passaram. |
| D6 | O cartão genérico repetia a expressão em Álgebra, Limites, Derivadas, Geometria, Trigonometria, Vetores e Modelagem. Estatística também não fornecia seu resumo ao cartão. Derivadas/polinômio tinha expoente textual. Controles e canvas compartilhavam as mesmas regras de layout. | Cartão reaproveita o resultado calculado à esquerda; Estatística mostra média, mediana e moda. Expoente de Derivadas corrigido; CSS de sup/sub e prevenção de encolhimento compartilhados. Funções e Científica mantêm seus consumidores específicos. **Revisão de código realizada; abertura visual dos 11 módulos pendente.** |

## Valores verificados

- x² em [0,3]: 9; ponto médio: 8,859375 / 8,977500 / 8,999775; Simpson: 9,000000.
- x² em [0,5]: 125/3 ≈ 41,666667.
- sen(x) em [0,π]: 2; em [0,2π]: integral 0, área geométrica ≈4, presença dos dois sinais.
- x³ em [-1,1]: 0, com ambos os sinais.
- Indefinida de x²: x³/3 + C; curva adicional de F para C=0, sem sombreamento.
- Limites invertidos conservados: resultado troca de sinal e aviso explica a convenção.
- Campo vazio conservado: não convertido em zero; função vazia não volta silenciosamente a x².
- Simpson adulterado ou primitiva incorreta: selo recusado.

A verificação de F′ é numérica em nove pontos; é uma conferência independente, não uma prova simbólica global. A janela e a área geométrica usam amostragem e não garantem detecção de extremos muito estreitos ou de toda singularidade de funções arbitrárias. O integrador simbólico existente continua limitado ao subconjunto já suportado.

## Arquivos alterados

- `src/js/motor-grafico.js`: observação de tamanho, DPR, estado vazio, áreas por sinal e ajuste.
- `src/js/app.js`: modelo de Integrais, renderizadores, fórmula, conversão, foco e cartões dos demais módulos.
- `src/css/estilos.css`: canvas, notação, controles roláveis e conteúdo das abas.
- `index.html`: rodapé com dica Enter.
- `tests/executar-testes.js`: inclui as suítes matemáticas e de layout.
- `tests/integrais-modulo.test.js`: regressões do estado e cálculo.
- `tests/graficos-layout.test.js`: regressão de cascata CSS da legenda flutuante.
- `tests/interface-integrais.test.js`: dez cenários de aceitação e passagem pelos 11 módulos; capturas automáticas.
- `docs/relatorio-revisao-integrais.md` e `docs/roteiro-validacao-humana.md`: relatório e roteiro de validação.

## Pendências

Executar os testes de navegador em ambiente que permita iniciar Chromium/Brave; obter capturas antes/depois; confirmar a causa visual de D1 e inspecionar os 11 módulos nos dois temas e resoluções. Nenhuma captura foi fabricada para substituir esses passos.
