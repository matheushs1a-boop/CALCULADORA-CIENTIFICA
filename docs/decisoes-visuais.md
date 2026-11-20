# Decisões visuais do CalcLab

## Abertura animada

O símbolo oficial foi reproduzido em SVG inline para animar eixos, traços e pontos. O nome e o lema usam a fonte da interface. A camada acompanha os tokens de fundo, texto e destaque do app. No tema claro, o verde vem do SVG oficial e o azul usa o tom de destaque mais escuro que já existe na interface.

A camada é fixa e decorativa, com `aria-hidden` e sem elementos focáveis. Os eventos de teclado e ponteiro continuam chegando ao app. A animação normal inclui o desaparecimento nos dois segundos totais. Tanto a preferência de movimento reduzido do sistema quanto a configuração do app mostram a marca parada por cerca de 600 ms.

O app preserva a navegação e a montagem da Científica. A saída da abertura deixa o visor, o foco e as dimensões dos painéis como estavam imediatamente antes da saída. A exibição depende somente de CSS e JavaScript locais.

## Capturas de aceitação

| Tema | 0,3 s | 0,9 s | 1,5 s | 2,2 s |
|---|---|---|---|---|
| Escuro | [Eixos](assets/capturas/abertura/dark-300ms.png) | [Traços](assets/capturas/abertura/dark-900ms.png) | [Marca](assets/capturas/abertura/dark-1500ms.png) | [Científica](assets/capturas/abertura/dark-2200ms.png) |
| Claro | [Eixos](assets/capturas/abertura/light-300ms.png) | [Traços](assets/capturas/abertura/light-900ms.png) | [Marca](assets/capturas/abertura/light-1500ms.png) | [Científica](assets/capturas/abertura/light-2200ms.png) |

Use `npm run test:abertura` com Playwright instalado no ambiente. Defina `CALCLAB_CAPTURAS_ABERTURA` com uma pasta para salvar os quadros. O teste registra o tempo entre a navegação e o foco na Científica. Também mede os deslocamentos durante o desaparecimento da camada e nos primeiros 100 ms após sua remoção.

Na execução local em Brave, a camada saiu após 2.000,3 ms, ou 600,4 ms com movimento reduzido. O CLS na saída foi 0. Na montagem inicial, o mesmo deslocamento de 0,226 ocorreu nas duas variantes. A mediana de navegação até o foco foi 60,2 ms com a abertura e 56,0 ms com `?sem-abertura`, em 10 navegações por variante. Essas medições são do ambiente local de teste.

[Guia de uso](guia-de-uso.md)
