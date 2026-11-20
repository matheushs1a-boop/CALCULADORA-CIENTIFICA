# Guia de uso do CalcLab

## Abertura e Científica

No primeiro acesso da sessão, a marca aparece por cerca de dois segundos enquanto a Científica é montada. Clique, toque ou pressione uma tecla para fechar antes. Em desktop, o campo já recebe a digitação. Por exemplo, pressionar `7` fecha a abertura e digita `7`.

O endereço com `?sem-abertura` abre direto no aplicativo. Para repetir a animação, abra **Configurações → Ajuda e tour → Rever abertura**. A página recarrega e volta à Científica zerada. Preferências e favoritos persistem.

Com **Reduzir animações** no app ou **Movimento reduzido** no sistema, a marca aparece parada por cerca de 0,6 s. No celular, toque no campo quando quiser digitar.

## Digitação direta na Científica

Digite pelo teclado físico ou use o teclado na tela. Pressione **Enter** ou **=** para confirmar. Os botões de desfazer e refazer ficam logo acima da entrada. O menu **Exemplos** começa fechado. Escolher um exemplo só preenche o campo. O exemplo `log₂(8)` insere `ln(8)/ln(2)`, a forma aceita pela Científica.

**Fórmula pronta** e **Normal** continuam nos módulos de função e nas ferramentas que trabalham com parâmetros. A escolha continua valendo ao trocar de módulo e após recarregar.

Para demonstrar erros, veja **Configurações → Estados de exemplo**. O painel reúne logaritmo negativo, limite inexistente, divisão por zero e as demonstrações que ficavam soltas na Científica, em Limites, Derivadas, Estatística e Modelagem. **Voltar à entrada anterior** restaura o estado da sessão após abrir uma demonstração.

| Tema | Antes | Depois |
|---|---|---|
| Escuro | [Científica](assets/capturas/cientifica/antes-dark.png) | [Científica](assets/capturas/cientifica/depois-dark.png) |
| Claro | [Científica](assets/capturas/cientifica/antes-light.png) | [Científica](assets/capturas/cientifica/depois-light.png) |

A [captura móvel](assets/capturas/cientifica/depois-celular-390.png) foi feita em emulação de 390 × 844. A suíte `npm run test:cientifica` verifica entrada direta, exemplos, demonstrações, preferência de edição, emulação móvel e funcionamento offline.
