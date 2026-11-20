# Auditoria do teclado do MathLab

## Causa e execução

Em `7f290c5`, o botão `1/x` era um botão de inserção literal com `data-key-ins="1/("` em `src/js/app.js:539`. O tratador de `src/js/app.js:773–777` concatenava o literal ao fim da expressão e chamava a renderização completa. O valor `4` virava `41/(`, a avaliação falhava e a substituição do campo descartava foco, cursor e seleção.

O `npm test` passou com 9 suítes na versão original e a cada etapa da correção. Os quatro logs têm o mesmo SHA-256 `e9caa9135fb59689db62d200adeb61994eb4df82f5af3cf2886e6a19237964ac`. A regressão de interface foi executada no Firefox real com WebDriver. Os casos abaixo usam cliques WebDriver e Enter. O caso de navegação usa Tab real e o caso de repetição usa três ações consecutivas de ponteiro.

## Regressão do inverso

| Campo e ação | Antes | Depois |
| --- | --- | --- |
| `4`, inverso e `=` | Falhou · `41/(`, Erro | Passou · `1/(4)` → `1/4` (0,25) |
| `0,5`, inverso e `=` | Falhou · `0,51/(`, Erro | Passou · `1/(0,5)` → `2` |
| `2/3`, inverso e `=` | Falhou · `2/31/(`, Erro | Passou · `1/(2/3)` → `3/2` (1,5) |
| `2+3`, inverso e `=` | Falhou · `2+31/(`, Erro | Passou · `1/(2+3)` → `1/5` (0,2) |
| `−2`, inverso e `=` | Falhou · `−21/(`, Erro | Passou · `1/(−2)` → `−1/2` (−0,5) |
| `0`, inverso e `=` | Falhou · `01/(`, Erro | Passou · `1/(0)` e “Não existe inverso de zero: divisão por zero” |
| Vazio na Científica, inverso | Falhou · `1/(`, campo sem foco e cursor 0 | Passou · `1/(`, campo focado e cursor 3 |
| Vazio em Funções, inverso | NÃO TESTADO · tecla ausente | Passou · `1/x`, assíntotas x = 0 e y = 0, curva interrompida no polo |
| `x²+1` em Funções, inverso | NÃO TESTADO · tecla ausente | Passou · `1/(x²+1)`, domínio ℝ, máximo 1 em x = 0 |
| Resultado `8`, inverso | Falhou · `4+41/(`, Erro | Passou · `1/(8)` → `1/8` (0,125) |
| `1/(4)`, inverso e `=` | Falhou · `1/(4)1/(`, Erro | Passou · `1/(1/(4))` → `4` |
| `3+4` com `4` selecionado, inverso | Falhou · `3+41/(` | Passou · `3+1/(4)`, cursor 7 |
| Mouse em `1/x` com `4` | Falhou · botão sem anel após o clique, campo sem foco | Passou · botão sem anel após o clique, campo focado |
| Tab até `1/x`, Enter com `4` | Falhou · Tab mostrou o anel, Enter gerou `41/(` e perdeu o foco | Passou · Tab mostrou o anel, Enter gerou `1/(4)` e devolveu o foco |
| `0,25`, inverso e `=` | Falhou · `0,251/(`, Erro | Passou · `1/(0,25)` → `4` |
| `1,5`, inverso e `=` | Falhou · `1,51/(`, Erro | Passou · `1/(1,5)` → `2/3` (0,6667) |
| Campo vazio em Limites, Derivadas e Integrais, inverso | NÃO TESTADO · tecla ausente nos três | Passou · `1/x`, campo focado e cursor 3 nos três |
| Ctrl+Z após aplicar a `4` | NÃO TESTADO | Passou · campo voltou a `4` |
| Três cliques consecutivos na tecla 7 | NÃO TESTADO | Passou · `777`, cursor 3 e campo focado |

O teste conferiu a curva em x = −2, 0 e 2 e inspecionou o traçado do Canvas para verificar a interrupção em x = 0. Para `1/(x²+1)`, verificou os valores 0,2, 1 e 0,2 nos mesmos pontos.

## Revisão do teclado inteiro

Foram executadas 390 ações no teclado original (39 teclas × cinco cenários × mouse e Enter). Todas perderam o foco do campo. Os quatro modos de função estavam sem esse teclado.

Na versão corrigida foram executadas 860 ações na Científica e em Funções (43 teclas × cinco cenários × duas formas de ativação × dois modos), mais três cliques de inverso em Limites, Derivadas e Integrais. As 863 ações devolveram ou mantiveram o foco no campo. O anel foi verificado separadamente antes da ativação por teclado.

Os cenários usam campo vazio, `2+3` inteiro, `4+4` após gerar, `3+4` com seleção de `4` e `34` com cursor entre os dígitos. A coluna anterior registra a Científica. A coluna posterior mostra campo e cursor em ambos os modos e inclui o valor do visor na Científica. `Erro` é a saída observada do avaliador para uma entrada incompleta ou inválida. Um intervalo como `2–3` indica seleção mantida. Na tabela, uma saída única por modo significa que mouse e Enter deram a mesma saída.

| Tecla | Cenário | Antes | Depois |
| --- | --- | --- | --- |
| `MC` | vazio | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `MC` | texto | `2+3` → `5` (cursor 0) | Científica `2+3` → `5` (cursor 3) · Funções `2+3` (cursor 3) |
| `MC` | resultado | `4+4` → `8` (cursor 0) | Científica `4+4` → `8` (cursor 3) · Funções `4+4` (cursor 3) |
| `MC` | seleção | `3+4` → `7` (cursor 0) | Científica `3+4` → `7` (cursor 2–3) · Funções `3+4` (cursor 2–3) |
| `MC` | meio | `34` → `34` (cursor 0) | Científica `34` → `34` (cursor 1) · Funções `34` (cursor 1) |
| `MR` | vazio | `0` → `0` (cursor 0) | Científica `0` → `0` (cursor 1) · Funções `0` (cursor 1) |
| `MR` | texto | `2+30` → `32` (cursor 0) | Científica `2+30` → `32` (cursor 4) · Funções `2+30` (cursor 4) |
| `MR` | resultado | `4+40` → `44` (cursor 0) | Científica `4+40` → `44` (cursor 4) · Funções `4+40` (cursor 4) |
| `MR` | seleção | `3+40` → `43` (cursor 0) | Científica `3+0` → `3` (cursor 3) · Funções `3+0` (cursor 3) |
| `MR` | meio | `340` → `340` (cursor 0) | Científica `304` → `304` (cursor 2) · Funções `304` (cursor 2) |
| `M+` | vazio | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `M+` | texto | `2+3` → `5` (cursor 0) | Científica `2+3` → `5` (cursor 3) · Funções `2+3` (cursor 3) |
| `M+` | resultado | `4+4` → `8` (cursor 0) | Científica `4+4` → `8` (cursor 3) · Funções `4+4` (cursor 3) |
| `M+` | seleção | `3+4` → `7` (cursor 0) | Científica `3+4` → `7` (cursor 2–3) · Funções `3+4` (cursor 2–3) |
| `M+` | meio | `34` → `34` (cursor 0) | Científica `34` → `34` (cursor 1) · Funções `34` (cursor 1) |
| `M−` | vazio | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `M−` | texto | `2+3` → `5` (cursor 0) | Científica `2+3` → `5` (cursor 3) · Funções `2+3` (cursor 3) |
| `M−` | resultado | `4+4` → `8` (cursor 0) | Científica `4+4` → `8` (cursor 3) · Funções `4+4` (cursor 3) |
| `M−` | seleção | `3+4` → `7` (cursor 0) | Científica `3+4` → `7` (cursor 2–3) · Funções `3+4` (cursor 2–3) |
| `M−` | meio | `34` → `34` (cursor 0) | Científica `34` → `34` (cursor 1) · Funções `34` (cursor 1) |
| `C` | vazio | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `C` | texto | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `C` | resultado | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `C` | seleção | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `C` | meio | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `⌫` | vazio | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `⌫` | texto | `2+` → `Erro` (cursor 0) | Científica `2+` → `Erro` (cursor 2) · Funções `2+` (cursor 2) |
| `⌫` | resultado | `4+` → `Erro` (cursor 0) | Científica `4+` → `Erro` (cursor 2) · Funções `4+` (cursor 2) |
| `⌫` | seleção | `3+` → `Erro` (cursor 0) | Científica `3+` → `Erro` (cursor 2) · Funções `3+` (cursor 2) |
| `⌫` | meio | `3` → `3` (cursor 0) | Científica `4` → `4` (cursor 0) · Funções `4` (cursor 0) |
| `sen` | vazio | `sen(` → `Erro` (cursor 0) | Científica `sen()` → `Erro` (cursor 4) · Funções `sen()` (cursor 4) |
| `sen` | texto | `2+3sen(` → `Erro` (cursor 0) | Científica `2+3sen()` → `Erro` (cursor 7) · Funções `2+3sen()` (cursor 7) |
| `sen` | resultado | `4+4sen(` → `Erro` (cursor 0) | Científica `sen(8)` → `0,9894` (cursor 6) · Funções `4+4sen()` (cursor 7) |
| `sen` | seleção | `3+4sen(` → `Erro` (cursor 0) | Científica `3+sen(4)` → `2,2432` (cursor 8) · Funções `3+sen(4)` (cursor 8) |
| `sen` | meio | `34sen(` → `Erro` (cursor 0) | Científica `3sen()4` → `Erro` (cursor 5) · Funções `3sen()4` (cursor 5) |
| `cos` | vazio | `cos(` → `Erro` (cursor 0) | Científica `cos()` → `Erro` (cursor 4) · Funções `cos()` (cursor 4) |
| `cos` | texto | `2+3cos(` → `Erro` (cursor 0) | Científica `2+3cos()` → `Erro` (cursor 7) · Funções `2+3cos()` (cursor 7) |
| `cos` | resultado | `4+4cos(` → `Erro` (cursor 0) | Científica `cos(8)` → `-0,1455` (cursor 6) · Funções `4+4cos()` (cursor 7) |
| `cos` | seleção | `3+4cos(` → `Erro` (cursor 0) | Científica `3+cos(4)` → `2,3464` (cursor 8) · Funções `3+cos(4)` (cursor 8) |
| `cos` | meio | `34cos(` → `Erro` (cursor 0) | Científica `3cos()4` → `Erro` (cursor 5) · Funções `3cos()4` (cursor 5) |
| `tg` | vazio | `tg(` → `Erro` (cursor 0) | Científica `tg()` → `Erro` (cursor 3) · Funções `tg()` (cursor 3) |
| `tg` | texto | `2+3tg(` → `Erro` (cursor 0) | Científica `2+3tg()` → `Erro` (cursor 6) · Funções `2+3tg()` (cursor 6) |
| `tg` | resultado | `4+4tg(` → `Erro` (cursor 0) | Científica `tg(8)` → `-6,7997` (cursor 5) · Funções `4+4tg()` (cursor 6) |
| `tg` | seleção | `3+4tg(` → `Erro` (cursor 0) | Científica `3+tg(4)` → `4,1578` (cursor 7) · Funções `3+tg(4)` (cursor 7) |
| `tg` | meio | `34tg(` → `Erro` (cursor 0) | Científica `3tg()4` → `Erro` (cursor 4) · Funções `3tg()4` (cursor 4) |
| `log` | vazio | `log(` → `Erro` (cursor 0) | Científica `log()` → `Erro` (cursor 4) · Funções `log()` (cursor 4) |
| `log` | texto | `2+3log(` → `Erro` (cursor 0) | Científica `2+3log()` → `Erro` (cursor 7) · Funções `2+3log()` (cursor 7) |
| `log` | resultado | `4+4log(` → `Erro` (cursor 0) | Científica `log(8)` → `Erro` (cursor 6) · Funções `4+4log()` (cursor 7) |
| `log` | seleção | `3+4log(` → `Erro` (cursor 0) | Científica `3+log(4)` → `Erro` (cursor 8) · Funções `3+log(4)` (cursor 8) |
| `log` | meio | `34log(` → `Erro` (cursor 0) | Científica `3log()4` → `Erro` (cursor 5) · Funções `3log()4` (cursor 5) |
| `ln` | vazio | `ln(` → `Erro` (cursor 0) | Científica `ln()` → `Erro` (cursor 3) · Funções `ln()` (cursor 3) |
| `ln` | texto | `2+3ln(` → `Erro` (cursor 0) | Científica `2+3ln()` → `Erro` (cursor 6) · Funções `2+3ln()` (cursor 6) |
| `ln` | resultado | `4+4ln(` → `Erro` (cursor 0) | Científica `ln(8)` → `2,0794` (cursor 5) · Funções `4+4ln()` (cursor 6) |
| `ln` | seleção | `3+4ln(` → `Erro` (cursor 0) | Científica `3+ln(4)` → `4,3863` (cursor 7) · Funções `3+ln(4)` (cursor 7) |
| `ln` | meio | `34ln(` → `Erro` (cursor 0) | Científica `3ln()4` → `Erro` (cursor 4) · Funções `3ln()4` (cursor 4) |
| `x²` | vazio | `^2` → `Erro` (cursor 0) | Científica `^2` → `Erro` (cursor 2) · Funções `^2` (cursor 2) |
| `x²` | texto | `2+3^2` → `11` (cursor 0) | Científica `(2+3)^2` → `25` (cursor 7) · Funções `(2+3)^2` (cursor 7) |
| `x²` | resultado | `4+4^2` → `20` (cursor 0) | Científica `8^2` → `64` (cursor 3) · Funções `(4+4)^2` (cursor 7) |
| `x²` | seleção | `3+4^2` → `19` (cursor 0) | Científica `3+4^2` → `19` (cursor 5) · Funções `3+4^2` (cursor 5) |
| `x²` | meio | `34^2` → `1156` (cursor 0) | Científica `3^24` → `282429536481` (cursor 3) · Funções `3^24` (cursor 3) |
| `xʸ` | vazio | `^` → `Erro` (cursor 0) | Científica `^` → `Erro` (cursor 1) · Funções `^` (cursor 1) |
| `xʸ` | texto | `2+3^` → `Erro` (cursor 0) | Científica `(2+3)^` → `Erro` (cursor 6) · Funções `(2+3)^` (cursor 6) |
| `xʸ` | resultado | `4+4^` → `Erro` (cursor 0) | Científica `8^` → `Erro` (cursor 2) · Funções `(4+4)^` (cursor 6) |
| `xʸ` | seleção | `3+4^` → `Erro` (cursor 0) | Científica `3+4^` → `Erro` (cursor 4) · Funções `3+4^` (cursor 4) |
| `xʸ` | meio | `34^` → `Erro` (cursor 0) | Científica `3^4` → `81` (cursor 2) · Funções `3^4` (cursor 2) |
| `√x` | vazio | `√(` → `Erro` (cursor 0) | Científica `sqrt()` → `Erro` (cursor 5) · Funções `sqrt()` (cursor 5) |
| `√x` | texto | `2+3√(` → `Erro` (cursor 0) | Científica `2+3sqrt()` → `Erro` (cursor 8) · Funções `2+3sqrt()` (cursor 8) |
| `√x` | resultado | `4+4√(` → `Erro` (cursor 0) | Científica `sqrt(8)` → `2,8284` (cursor 7) · Funções `4+4sqrt()` (cursor 8) |
| `√x` | seleção | `3+4√(` → `Erro` (cursor 0) | Científica `3+sqrt(4)` → `5` (cursor 9) · Funções `3+sqrt(4)` (cursor 9) |
| `√x` | meio | `34√(` → `Erro` (cursor 0) | Científica `3sqrt()4` → `Erro` (cursor 6) · Funções `3sqrt()4` (cursor 6) |
| `\|x\|` | vazio | `\|` → `Erro` (cursor 0) | Científica `abs()` → `Erro` (cursor 4) · Funções `abs()` (cursor 4) |
| `\|x\|` | texto | `2+3\|` → `Erro` (cursor 0) | Científica `2+3abs()` → `Erro` (cursor 7) · Funções `2+3abs()` (cursor 7) |
| `\|x\|` | resultado | `4+4\|` → `Erro` (cursor 0) | Científica `abs(8)` → `8` (cursor 6) · Funções `4+4abs()` (cursor 7) |
| `\|x\|` | seleção | `3+4\|` → `Erro` (cursor 0) | Científica `3+abs(4)` → `7` (cursor 8) · Funções `3+abs(4)` (cursor 8) |
| `\|x\|` | meio | `34\|` → `Erro` (cursor 0) | Científica `3abs()4` → `Erro` (cursor 5) · Funções `3abs()4` (cursor 5) |
| `1/x` | vazio | `1/(` → `Erro` (cursor 0) | Científica `1/(` → `Erro` (cursor 3) · Funções `1/x` (cursor 3) |
| `1/x` | texto | `2+31/(` → `Erro` (cursor 0) | Científica `1/(2+3)` → `1/5` (cursor 7) · Funções `1/(2+3)` (cursor 7) |
| `1/x` | resultado | `4+41/(` → `Erro` (cursor 0) | Científica `1/(8)` → `1/8` (cursor 5) · Funções `1/(4+4)` (cursor 7) |
| `1/x` | seleção | `3+41/(` → `Erro` (cursor 0) | Científica `3+1/(4)` → `13/4` (cursor 7) · Funções `3+1/(4)` (cursor 7) |
| `1/x` | meio | `341/(` → `Erro` (cursor 0) | Científica `1/(34)` → `1/34` (cursor 6) · Funções `1/(34)` (cursor 6) |
| `π` | vazio | `π` → `3,1416` (cursor 0) | Científica `π` → `3,1416` (cursor 1) · Funções `π` (cursor 1) |
| `π` | texto | `2+3π` → `11,4248` (cursor 0) | Científica `2+3π` → `11,4248` (cursor 4) · Funções `2+3π` (cursor 4) |
| `π` | resultado | `4+4π` → `16,5664` (cursor 0) | Científica `4+4π` → `16,5664` (cursor 4) · Funções `4+4π` (cursor 4) |
| `π` | seleção | `3+4π` → `15,5664` (cursor 0) | Científica `3+π` → `6,1416` (cursor 3) · Funções `3+π` (cursor 3) |
| `π` | meio | `34π` → `106,8142` (cursor 0) | Científica `3π·4` → `37,6991` (cursor 3) · Funções `3π·4` (cursor 3) |
| `e` | vazio | `e` → `2,7183` (cursor 0) | Científica `e` → `2,7183` (cursor 1) · Funções `e` (cursor 1) |
| `e` | texto | `2+3e` → `Erro` (cursor 0) | Científica `2+3·e` → `10,1548` (cursor 5) · Funções `2+3·e` (cursor 5) |
| `e` | resultado | `4+4e` → `Erro` (cursor 0) | Científica `4+4·e` → `14,8731` (cursor 5) · Funções `4+4·e` (cursor 5) |
| `e` | seleção | `3+4e` → `Erro` (cursor 0) | Científica `3+e` → `5,7183` (cursor 3) · Funções `3+e` (cursor 3) |
| `e` | meio | `34e` → `Erro` (cursor 0) | Científica `3·e·4` → `32,6194` (cursor 4) · Funções `3·e·4` (cursor 4) |
| `eˣ` | vazio | `e^` → `Erro` (cursor 0) | Científica `e^()` → `Erro` (cursor 3) · Funções `e^()` (cursor 3) |
| `eˣ` | texto | `2+3e^` → `Erro` (cursor 0) | Científica `2+3e^()` → `Erro` (cursor 6) · Funções `2+3e^()` (cursor 6) |
| `eˣ` | resultado | `4+4e^` → `Erro` (cursor 0) | Científica `e^(8)` → `2980,958` (cursor 5) · Funções `4+4e^()` (cursor 6) |
| `eˣ` | seleção | `3+4e^` → `Erro` (cursor 0) | Científica `3+e^(4)` → `57,5982` (cursor 7) · Funções `3+e^(4)` (cursor 7) |
| `eˣ` | meio | `34e^` → `Erro` (cursor 0) | Científica `3e^()4` → `Erro` (cursor 4) · Funções `3e^()4` (cursor 4) |
| `n!` | vazio | `!` → `Erro` (cursor 0) | Científica `!` → `Erro` (cursor 1) · Funções `!` (cursor 1) |
| `n!` | texto | `2+3!` → `8` (cursor 0) | Científica `2+3!` → `8` (cursor 4) · Funções `2+3!` (cursor 4) |
| `n!` | resultado | `4+4!` → `28` (cursor 0) | Científica `4+4!` → `28` (cursor 4) · Funções `4+4!` (cursor 4) |
| `n!` | seleção | `3+4!` → `27` (cursor 0) | Científica `3+!` → `Erro` (cursor 3) · Funções `3+!` (cursor 3) |
| `n!` | meio | `34!` → `2.9523279904e+38` (cursor 0) | Científica `3!4` → `64` (cursor 2) · Funções `3!4` (cursor 2) |
| `%` | vazio | `%` → `Erro` (cursor 0) | Científica `%` → `Erro` (cursor 1) · Funções `%` (cursor 1) |
| `%` | texto | `2+3%` → `203/100` (cursor 0) | Científica `2+3%` → `103/50` (cursor 4) · Funções `(2) + (2) · (3/100)` (cursor 19) |
| `%` | resultado | `4+4%` → `101/25` (cursor 0) | Científica `8%` → `2/25` (cursor 2) · Funções `(4) + (4) · (4/100)` (cursor 19) |
| `%` | seleção | `3+4%` → `76/25` (cursor 0) | Científica `3+4%` → `78/25` (cursor 4) · Funções `(3) + (3) · (4/100)` (cursor 19) |
| `%` | meio | `34%` → `17/50` (cursor 0) | Científica `3%4` → `Erro` (cursor 2) · Funções `(3/100)4` (cursor 7) |
| `7` | vazio | `7` → `7` (cursor 0) | Científica `7` → `7` (cursor 1) · Funções `7` (cursor 1) |
| `7` | texto | `2+37` → `39` (cursor 0) | Científica `2+37` → `39` (cursor 4) · Funções `2+37` (cursor 4) |
| `7` | resultado | `4+47` → `51` (cursor 0) | Científica `4+47` → `51` (cursor 4) · Funções `4+47` (cursor 4) |
| `7` | seleção | `3+47` → `50` (cursor 0) | Científica `3+7` → `10` (cursor 3) · Funções `3+7` (cursor 3) |
| `7` | meio | `347` → `347` (cursor 0) | Científica `374` → `374` (cursor 2) · Funções `374` (cursor 2) |
| `8` | vazio | `8` → `8` (cursor 0) | Científica `8` → `8` (cursor 1) · Funções `8` (cursor 1) |
| `8` | texto | `2+38` → `40` (cursor 0) | Científica `2+38` → `40` (cursor 4) · Funções `2+38` (cursor 4) |
| `8` | resultado | `4+48` → `52` (cursor 0) | Científica `4+48` → `52` (cursor 4) · Funções `4+48` (cursor 4) |
| `8` | seleção | `3+48` → `51` (cursor 0) | Científica `3+8` → `11` (cursor 3) · Funções `3+8` (cursor 3) |
| `8` | meio | `348` → `348` (cursor 0) | Científica `384` → `384` (cursor 2) · Funções `384` (cursor 2) |
| `9` | vazio | `9` → `9` (cursor 0) | Científica `9` → `9` (cursor 1) · Funções `9` (cursor 1) |
| `9` | texto | `2+39` → `41` (cursor 0) | Científica `2+39` → `41` (cursor 4) · Funções `2+39` (cursor 4) |
| `9` | resultado | `4+49` → `53` (cursor 0) | Científica `4+49` → `53` (cursor 4) · Funções `4+49` (cursor 4) |
| `9` | seleção | `3+49` → `52` (cursor 0) | Científica `3+9` → `12` (cursor 3) · Funções `3+9` (cursor 3) |
| `9` | meio | `349` → `349` (cursor 0) | Científica `394` → `394` (cursor 2) · Funções `394` (cursor 2) |
| `(` | vazio | `(` → `Erro` (cursor 0) | Científica `(` → `Erro` (cursor 1) · Funções `(` (cursor 1) |
| `(` | texto | `2+3(` → `Erro` (cursor 0) | Científica `2+3(` → `Erro` (cursor 4) · Funções `2+3(` (cursor 4) |
| `(` | resultado | `4+4(` → `Erro` (cursor 0) | Científica `4+4(` → `Erro` (cursor 4) · Funções `4+4(` (cursor 4) |
| `(` | seleção | `3+4(` → `Erro` (cursor 0) | Científica `3+(` → `Erro` (cursor 3) · Funções `3+(` (cursor 3) |
| `(` | meio | `34(` → `Erro` (cursor 0) | Científica `3(4` → `Erro` (cursor 2) · Funções `3(4` (cursor 2) |
| `)` | vazio | `)` → `Erro` (cursor 0) | Científica `)` → `Erro` (cursor 1) · Funções `)` (cursor 1) |
| `)` | texto | `2+3)` → `Erro` (cursor 0) | Científica `2+3)` → `Erro` (cursor 4) · Funções `2+3)` (cursor 4) |
| `)` | resultado | `4+4)` → `Erro` (cursor 0) | Científica `4+4)` → `Erro` (cursor 4) · Funções `4+4)` (cursor 4) |
| `)` | seleção | `3+4)` → `Erro` (cursor 0) | Científica `3+)` → `Erro` (cursor 3) · Funções `3+)` (cursor 3) |
| `)` | meio | `34)` → `Erro` (cursor 0) | Científica `3)4` → `Erro` (cursor 2) · Funções `3)4` (cursor 2) |
| `4` | vazio | `4` → `4` (cursor 0) | Científica `4` → `4` (cursor 1) · Funções `4` (cursor 1) |
| `4` | texto | `2+34` → `36` (cursor 0) | Científica `2+34` → `36` (cursor 4) · Funções `2+34` (cursor 4) |
| `4` | resultado | `4+44` → `48` (cursor 0) | Científica `4+44` → `48` (cursor 4) · Funções `4+44` (cursor 4) |
| `4` | seleção | `3+44` → `47` (cursor 0) | Científica `3+4` → `7` (cursor 3) · Funções `3+4` (cursor 3) |
| `4` | meio | `344` → `344` (cursor 0) | Científica `344` → `344` (cursor 2) · Funções `344` (cursor 2) |
| `5` | vazio | `5` → `5` (cursor 0) | Científica `5` → `5` (cursor 1) · Funções `5` (cursor 1) |
| `5` | texto | `2+35` → `37` (cursor 0) | Científica `2+35` → `37` (cursor 4) · Funções `2+35` (cursor 4) |
| `5` | resultado | `4+45` → `49` (cursor 0) | Científica `4+45` → `49` (cursor 4) · Funções `4+45` (cursor 4) |
| `5` | seleção | `3+45` → `48` (cursor 0) | Científica `3+5` → `8` (cursor 3) · Funções `3+5` (cursor 3) |
| `5` | meio | `345` → `345` (cursor 0) | Científica `354` → `354` (cursor 2) · Funções `354` (cursor 2) |
| `6` | vazio | `6` → `6` (cursor 0) | Científica `6` → `6` (cursor 1) · Funções `6` (cursor 1) |
| `6` | texto | `2+36` → `38` (cursor 0) | Científica `2+36` → `38` (cursor 4) · Funções `2+36` (cursor 4) |
| `6` | resultado | `4+46` → `50` (cursor 0) | Científica `4+46` → `50` (cursor 4) · Funções `4+46` (cursor 4) |
| `6` | seleção | `3+46` → `49` (cursor 0) | Científica `3+6` → `9` (cursor 3) · Funções `3+6` (cursor 3) |
| `6` | meio | `346` → `346` (cursor 0) | Científica `364` → `364` (cursor 2) · Funções `364` (cursor 2) |
| `×` | vazio | ` · ` → `Erro` (cursor 0) | Científica ` · ` → `Erro` (cursor 3) · Funções ` · ` (cursor 3) |
| `×` | texto | `2+3 · ` → `Erro` (cursor 0) | Científica `2+3 · ` → `Erro` (cursor 6) · Funções `2+3 · ` (cursor 6) |
| `×` | resultado | `4+4 · ` → `Erro` (cursor 0) | Científica `4+4 · ` → `Erro` (cursor 6) · Funções `4+4 · ` (cursor 6) |
| `×` | seleção | `3+4 · ` → `Erro` (cursor 0) | Científica `3+ · ` → `Erro` (cursor 5) · Funções `3+ · ` (cursor 5) |
| `×` | meio | `34 · ` → `Erro` (cursor 0) | Científica `3 · 4` → `12` (cursor 4) · Funções `3 · 4` (cursor 4) |
| `÷` | vazio | ` / ` → `Erro` (cursor 0) | Científica ` / ` → `Erro` (cursor 3) · Funções ` / ` (cursor 3) |
| `÷` | texto | `2+3 / ` → `Erro` (cursor 0) | Científica `2+3 / ` → `Erro` (cursor 6) · Funções `2+3 / ` (cursor 6) |
| `÷` | resultado | `4+4 / ` → `Erro` (cursor 0) | Científica `4+4 / ` → `Erro` (cursor 6) · Funções `4+4 / ` (cursor 6) |
| `÷` | seleção | `3+4 / ` → `Erro` (cursor 0) | Científica `3+ / ` → `Erro` (cursor 5) · Funções `3+ / ` (cursor 5) |
| `÷` | meio | `34 / ` → `Erro` (cursor 0) | Científica `3 / 4` → `3/4` (cursor 4) · Funções `3 / 4` (cursor 4) |
| `1` | vazio | `1` → `1` (cursor 0) | Científica `1` → `1` (cursor 1) · Funções `1` (cursor 1) |
| `1` | texto | `2+31` → `33` (cursor 0) | Científica `2+31` → `33` (cursor 4) · Funções `2+31` (cursor 4) |
| `1` | resultado | `4+41` → `45` (cursor 0) | Científica `4+41` → `45` (cursor 4) · Funções `4+41` (cursor 4) |
| `1` | seleção | `3+41` → `44` (cursor 0) | Científica `3+1` → `4` (cursor 3) · Funções `3+1` (cursor 3) |
| `1` | meio | `341` → `341` (cursor 0) | Científica `314` → `314` (cursor 2) · Funções `314` (cursor 2) |
| `2` | vazio | `2` → `2` (cursor 0) | Científica `2` → `2` (cursor 1) · Funções `2` (cursor 1) |
| `2` | texto | `2+32` → `34` (cursor 0) | Científica `2+32` → `34` (cursor 4) · Funções `2+32` (cursor 4) |
| `2` | resultado | `4+42` → `46` (cursor 0) | Científica `4+42` → `46` (cursor 4) · Funções `4+42` (cursor 4) |
| `2` | seleção | `3+42` → `45` (cursor 0) | Científica `3+2` → `5` (cursor 3) · Funções `3+2` (cursor 3) |
| `2` | meio | `342` → `342` (cursor 0) | Científica `324` → `324` (cursor 2) · Funções `324` (cursor 2) |
| `3` | vazio | `3` → `3` (cursor 0) | Científica `3` → `3` (cursor 1) · Funções `3` (cursor 1) |
| `3` | texto | `2+33` → `35` (cursor 0) | Científica `2+33` → `35` (cursor 4) · Funções `2+33` (cursor 4) |
| `3` | resultado | `4+43` → `47` (cursor 0) | Científica `4+43` → `47` (cursor 4) · Funções `4+43` (cursor 4) |
| `3` | seleção | `3+43` → `46` (cursor 0) | Científica `3+3` → `6` (cursor 3) · Funções `3+3` (cursor 3) |
| `3` | meio | `343` → `343` (cursor 0) | Científica `334` → `334` (cursor 2) · Funções `334` (cursor 2) |
| `+` | vazio | ` + ` → `Erro` (cursor 0) | Científica ` + ` → `Erro` (cursor 3) · Funções ` + ` (cursor 3) |
| `+` | texto | `2+3 + ` → `Erro` (cursor 0) | Científica `2+3 + ` → `Erro` (cursor 6) · Funções `2+3 + ` (cursor 6) |
| `+` | resultado | `4+4 + ` → `Erro` (cursor 0) | Científica `4+4 + ` → `Erro` (cursor 6) · Funções `4+4 + ` (cursor 6) |
| `+` | seleção | `3+4 + ` → `Erro` (cursor 0) | Científica `3+ + ` → `Erro` (cursor 5) · Funções `3+ + ` (cursor 5) |
| `+` | meio | `34 + ` → `Erro` (cursor 0) | Científica `3 + 4` → `7` (cursor 4) · Funções `3 + 4` (cursor 4) |
| `−` | vazio | ` − ` → `Erro` (cursor 0) | Científica ` − ` → `Erro` (cursor 3) · Funções ` − ` (cursor 3) |
| `−` | texto | `2+3 − ` → `Erro` (cursor 0) | Científica `2+3 − ` → `Erro` (cursor 6) · Funções `2+3 − ` (cursor 6) |
| `−` | resultado | `4+4 − ` → `Erro` (cursor 0) | Científica `4+4 − ` → `Erro` (cursor 6) · Funções `4+4 − ` (cursor 6) |
| `−` | seleção | `3+4 − ` → `Erro` (cursor 0) | Científica `3+ − ` → `Erro` (cursor 5) · Funções `3+ − ` (cursor 5) |
| `−` | meio | `34 − ` → `Erro` (cursor 0) | Científica `3 − 4` → `-1` (cursor 4) · Funções `3 − 4` (cursor 4) |
| `0` | vazio | `0` → `0` (cursor 0) | Científica `0` → `0` (cursor 1) · Funções `0` (cursor 1) |
| `0` | texto | `2+30` → `32` (cursor 0) | Científica `2+30` → `32` (cursor 4) · Funções `2+30` (cursor 4) |
| `0` | resultado | `4+40` → `44` (cursor 0) | Científica `4+40` → `44` (cursor 4) · Funções `4+40` (cursor 4) |
| `0` | seleção | `3+40` → `43` (cursor 0) | Científica `3+0` → `3` (cursor 3) · Funções `3+0` (cursor 3) |
| `0` | meio | `340` → `340` (cursor 0) | Científica `304` → `304` (cursor 2) · Funções `304` (cursor 2) |
| `,` | vazio | `,` → `Erro` (cursor 0) | Científica `,` → `Erro` (cursor 1) · Funções `,` (cursor 1) |
| `,` | texto | `2+3,` → `5` (cursor 0) | Científica `2+3,` → `5` (cursor 4) · Funções `2+3,` (cursor 4) |
| `,` | resultado | `4+4,` → `8` (cursor 0) | Científica `4+4,` → `8` (cursor 4) · Funções `4+4,` (cursor 4) |
| `,` | seleção | `3+4,` → `7` (cursor 0) | Científica `3+,` → `Erro` (cursor 3) · Funções `3+,` (cursor 3) |
| `,` | meio | `34,` → `34` (cursor 0) | Científica `3,4` → `17/5` (cursor 2) · Funções `3,4` (cursor 2) |
| `=` | vazio | vazio → `undefined` (cursor 0) | Científica vazio → `0` (cursor 0) · Funções vazio (cursor 0) |
| `=` | texto | `2+3` → `5` (cursor 0) | Científica `2+3` → `5` (cursor 3) · Funções `2+3` (cursor 3) |
| `=` | resultado | `4+4` → `8` (cursor 0) | Científica `4+4` → `8` (cursor 3) · Funções `4+4` (cursor 3) |
| `=` | seleção | `3+4` → `7` (cursor 0) | Científica `3+4` → `7` (cursor 2–3) · Funções `3+4` (cursor 2–3) |
| `=` | meio | `34` → `34` (cursor 0) | Científica `34` → `34` (cursor 1) · Funções `34` (cursor 1) |
| `±` | vazio | NÃO TESTADO · tecla ausente | Científica `−` → `Erro` (cursor 1) · Funções `−` (cursor 1) |
| `±` | texto | NÃO TESTADO · tecla ausente | Científica `−(2+3)` → `-5` (cursor 6) · Funções `−(2+3)` (cursor 6) |
| `±` | resultado | NÃO TESTADO · tecla ausente | Científica `−8` → `-8` (cursor 2) · Funções `−(4+4)` (cursor 6) |
| `±` | seleção | NÃO TESTADO · tecla ausente | Científica `3+−4` → `-1` (cursor 4) · Funções `3+−4` (cursor 4) |
| `±` | meio | NÃO TESTADO · tecla ausente | Científica `3−4` → `-1` (cursor 2) · Funções `3−4` (cursor 2) |
| `Ans` | vazio | NÃO TESTADO · tecla ausente | Científica `8` → `8` (cursor 1) · Funções `8` (cursor 1) |
| `Ans` | texto | NÃO TESTADO · tecla ausente | Científica `2+38` → `40` (cursor 4) · Funções `2+38` (cursor 4) |
| `Ans` | resultado | NÃO TESTADO · tecla ausente | Científica `4+48` → `52` (cursor 4) · Funções `4+48` (cursor 4) |
| `Ans` | seleção | NÃO TESTADO · tecla ausente | Científica `3+8` → `11` (cursor 3) · Funções `3+8` (cursor 3) |
| `Ans` | meio | NÃO TESTADO · tecla ausente | Científica `384` → `384` (cursor 2) · Funções `384` (cursor 2) |
| `x` | vazio | NÃO TESTADO · tecla ausente | Científica `x` → `Erro` (cursor 1) · Funções `x` (cursor 1) |
| `x` | texto | NÃO TESTADO · tecla ausente | Científica `2+3x` → `Erro` (cursor 4) · Funções `2+3x` (cursor 4) |
| `x` | resultado | NÃO TESTADO · tecla ausente | Científica `4+4x` → `Erro` (cursor 4) · Funções `4+4x` (cursor 4) |
| `x` | seleção | NÃO TESTADO · tecla ausente | Científica `3+x` → `Erro` (cursor 3) · Funções `3+x` (cursor 3) |
| `x` | meio | NÃO TESTADO · tecla ausente | Científica `3x4` → `Erro` (cursor 2) · Funções `3x4` (cursor 2) |
| `∞` | vazio | NÃO TESTADO · tecla ausente | Científica `∞` → `Erro` (cursor 1) · Funções `∞` (cursor 1) |
| `∞` | texto | NÃO TESTADO · tecla ausente | Científica `2+3∞` → `Erro` (cursor 4) · Funções `2+3∞` (cursor 4) |
| `∞` | resultado | NÃO TESTADO · tecla ausente | Científica `4+4∞` → `Erro` (cursor 4) · Funções `4+4∞` (cursor 4) |
| `∞` | seleção | NÃO TESTADO · tecla ausente | Científica `3+∞` → `Erro` (cursor 3) · Funções `3+∞` (cursor 3) |
| `∞` | meio | NÃO TESTADO · tecla ausente | Científica `3∞4` → `Erro` (cursor 2) · Funções `3∞4` (cursor 2) |

## Convenções verificadas

- `200*15%` resultou em 30, `50%` em `1/2` (0,5), `200+10%` em 220 e `200−10%` em 180. A resolução da Científica mostra “Entendi como” junto da expressão interpretada.
- `±` troca o sinal da expressão inteira quando o cursor está no fim. O teste com `2+3` produziu `−(2+3)` e o visor mostrou −5.
- `0^0` exibiu a mensagem de indeterminação já fornecida pelo avaliador científico. A tecla `∞` insere o símbolo, que o avaliador científico rejeita em uma expressão real. A tecla `x` insere a variável para os modos de função.
- Na Científica, `=` registrou `4+4` no histórico e deixou a expressão no campo. Em Funções, `=` registrou `2+3` e preservou a seleção. M+, M−, MR e MC foram exercitados com memória de `1/8`.
