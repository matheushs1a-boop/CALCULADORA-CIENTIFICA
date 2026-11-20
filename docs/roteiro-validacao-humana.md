# Roteiro de Validação Manual e Homologação Humana

Este documento consolida o roteiro de inspeção visual, testes de usabilidade e checklist de validação humana para apresentação e entrega acadêmica do **CalcLab (CDI — AP2)**.

---

## 1. Execução da Suíte Automatizada

Antes da inspeção manual, execute a bateria de testes matemáticos e de estado no terminal:

```bash
npm test
# ou diretamente:
node tests/executar-testes.js
```

Para validação visual automatizada em navegador real (quando Playwright e Chromium/Brave estiverem disponíveis no ambiente):

```bash
npm run test:ui
npm run test:ui-integrais
```

---

## 2. Roteiro Passo a Passo de Inspeção Visual

1. **Módulo de Funções (1366×768 e 1920×1080):**
   - Abrir em **Fórmula pronta** com $f(x) = x^2 - 4x - 5$.
   - Confirmar discriminante $\Delta = 36$, raízes $-1$ e $5$, vértice $V(2, -9)$ pelas 4 formas equivalentes e gráfico com parábola verde e marcadores destacados.
   - Alternar para **Modo Normal**, digitar `2x + 1` e retornar para **Fórmula pronta**, verificando que os parâmetros e a curva permanecem sincronizados.

2. **Módulo de Integrais (Definidas e Indefinidas):**
   - Confirmar eixos graduados, grade, curva verde completa, limites azul/âmbar em $a=0$ e $b=3$, área sombreada e resultado $\int_0^3 x^2\,dx = 9$ ($\approx 9,000000$).
   - Alterar $b = 5$ e verificar atualização imediata para $125/3 \approx 41,666667$ sem perda de foco do campo.
   - Na aba **Métodos**, comparar Soma de Riemann (Ponto Médio para $n = 4, 10, 100$) e Regra de Simpson.
   - Testar integrais com troca de sinal como $\int_0^{2\pi} \operatorname{sen}(x)\,dx$ (integral líquida $0$ e área geométrica $4$, com regiões positivas em verde e negativas em vermelho).
   - Alternar para **Indefinida** em $x^2$ e verificar a primitiva $x^3/3 + C$ sem área sombreada.

3. **Demais Ambientes Especializados:**
   - **Científica:** Testar `2 · sen(π/6) + √16 = 5` em radianos e alternar entre Graus e Radianos.
   - **Limites:** Testar $\lim_{x\to 2} \frac{x^2-4}{x-2} = 4$ (buraco vazado em $(2,4)$) e $\lim_{x\to 0} \frac{1}{x}$ (inexistente, laterais $-\infty$ e $+\infty$).
   - **Derivadas:** Testar as 6 regras (constante, potência, soma, produto, quociente e cadeia) e a reta tangente no ponto.
   - **Álgebra, Geometria, Trigonometria, Vetores/Matrizes, Estatística e Modelagem:** Verificar exemplos padrão, desenhos geométricos e consistência entre o painel esquerdo e o cartão principal de resultado.

---

## 3. Tabela de Registro da Validação Humana

> **Nota:** Preencher os campos abaixo após realizar a conferência manual e visual no navegador.

| Responsável e Data | Cenário / Módulo | Resultado Previsto à Mão | Resultado Observado | Status / Evidência |
| :--- | :--- | :--- | :--- | :--- |
| Pendente | Quadrática $x^2-4x-5$ nos dois modos | Raízes $-1$ e $5$; $V(2,-9)$ | A registrar | Pendente |
| Pendente | Casos especiais $a=0$ e $\Delta < 0$ | Degeneração afim / sem raízes reais | A registrar | Pendente |
| Pendente | Limite $1/x$ em $x \to 0$ | Laterais $-\infty$/$+\infty$; inexistente | A registrar | Pendente |
| Pendente | 6 Regras de Derivadas e 6 de Integrais | Conferência por 2 métodos independentes | A registrar | Pendente |
| Pendente | Acessibilidade (`Esc`, `Tab`, `Ctrl+K`) | Navegação por teclado e foco visível | A registrar | Pendente |
| Pendente | Resoluções 1366×768, 1536×864, 1920×1080 | Sem cortes ou rolagem horizontal | A registrar | Pendente |
| Pendente | Exportação (Copiar, LaTeX, PNG, PDF, Link) | Dados correspondentes ao estado ativo | A registrar | Pendente |


## 4. Aceitação manual de Trigonometria e dos ajustes visuais

A execução automatizada está no [relatório da revisão](relatorio-trigonometria-interface.md). Os passos abaixo ainda devem ser realizados por uma pessoa; não marque como validação humana apenas porque a automação passou.

1. Abrir `http://127.0.0.1:5500/index.html` no Firefox e selecionar **Trigonometria**. Confirmar onda verde inteira, eixos em π/2, extremos vermelhos, raízes e painel direito com `sen(x)`, amplitude 1, período 2π, imagem [−1, 1] e paridade ímpar.
2. Digitar A=2 e B=3: conferir máximo 2 em π/6 e período 2π/3. Selecionar cos, A=3, B=2, C=0, D=1: conferir imagem [−2, 4] e período π.
3. Voltar ao seno com A=B=1 e D=0; digitar C=`π/2`. Conferir a equivalência com cos(x) e o deslocamento para a esquerda. Digitar `−0,5` e `π/6` tecla por tecla, sem mudança de foco ou cursor. Apagar um parâmetro: o gráfico deve explicar o estado inválido.
4. Conferir θ=30°: ponto (√3/2; 1/2), sen=1/2, cos=√3/2 e tg=√3/3, com decimais. Trocar para radianos: o campo deve passar a π/6 mantendo o ponto. Em θ=90°, conferir tangente indefinida.
5. Abrir ciclo e tabela: conferir as projeções, quadrante/sinais e os 17 ângulos pedidos. Em tg(x), conferir assíntotas tracejadas em π/2+kπ, sem segmentos unindo ramos.
6. Arrastar, ampliar, clicar na onda e usar **Ajustar à função**. Alternar aba e tema; conferir gráfico e valores. Alternar Normal/Fórmula pronta e confirmar que os parâmetros continuam coerentes.
7. Conferir os 11 modos em 1366×768, 1536×864 e 1920×1080, com zoom do Firefox em 90%, 100%, 110% e 125%. O painel direito, cabeçalho e rodapé devem caber; conteúdos extensos podem rolar dentro do painel.
8. Em todos os modos, confirmar que o rótulo **Gerar relatório completo** está centralizado na largura do botão, com Enter separado. Conferir ícones, alturas, foco visível, chips e controles fx sem sobreposição.
9. Em Funções, expandir as propriedades: conferir margens internas, valores alinhados à direita e pontos coloridos alinhados aos rótulos. Conferir as formas fatorada/canônica sem corte.
10. Em Álgebra, abrir **Ferramenta Algébrica**: conferir lista azul com sete ferramentas, opção selecionada e descrições. Testar setas, Home, End, Enter, Escape, Tab e clique fora. Selecionar cada ferramenta e conferir que o resultado muda. Confirmar que a lista abre para cima quando não há espaço abaixo.
11. Abrir Compartilhar, Configurações, Favoritos, Atalhos, Sobre, Estados, Tour, Busca e Estudo da função. Conferir textos, alinhamento e navegação por teclado. Registrar responsável, data e evidências na tabela de validação humana.

12. Abrir e fechar **Por que deu esse resultado?** nos 11 modos: o selo **Intuição** deve continuar na posição normal. Conferir que apenas as setas giram, que os selos de verificação não ocupam a linha inteira e que a troca de modo limpa coordenadas da curva anterior. Em tg(x), arrastar para x entre 10 e 20 e conferir que as novas assíntotas aparecem.

## Abertura e identidade CalcLab

1. Em janela anônima, abra o endereço sem fragmento. Confirme o modo Científica, visor `0`, histórico vazio, ausência de login ou modal e calcule `2+3×4 = 14`.
2. Use os quatro botões **Exemplo 1** e confira o gráfico, o cálculo e a tabela de cada caso. Use a marca e `Alt+H`, depois volte no navegador e confirme que o trabalho ainda está no modo anterior.
3. Favorite um cálculo e mude tema, ângulos e casas decimais. Recarregue de outro modo e confira que a Científica zerou, com o favorito e as preferências preservados.
4. Use **Limpar tudo** e, dentro de oito segundos, **Desfazer**. Confira também C/AC, `1/x`, porcentagem, cópia e Esc.
5. Confira foco da marca via Tab, ícone da aba e símbolo no cabeçalho em tela estreita. Com a conexão externa desligada e um servidor local disponível, abra o app novamente e confirme que a marca aparece.
