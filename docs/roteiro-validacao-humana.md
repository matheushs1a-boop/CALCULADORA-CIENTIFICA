# Roteiro de Validação Manual e Homologação Humana

Este documento consolida o roteiro de inspeção visual, testes de usabilidade e checklist de validação humana para apresentação e entrega acadêmica do **MathLab (CDI — AP2)**.

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
| Pendente | Resoluções 1366×768, 1600×900, 1920×1080 | Sem cortes ou rolagem horizontal | A registrar | Pendente |
| Pendente | Exportação (Copiar, LaTeX, PNG, PDF, Link) | Dados correspondentes ao estado ativo | A registrar | Pendente |
