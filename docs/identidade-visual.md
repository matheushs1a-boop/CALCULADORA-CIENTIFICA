# Identidade visual CalcLab

O símbolo combina dois eixos cartesianos com uma linha de dois picos. A marca FIEL usa traços sem brilho, com “Calc” em azul-marinho no tema claro e branco-gelo no escuro. O nome e o subtítulo usam contornos das fontes Lato Black e Heavy, distribuídas sob a OFL 1.1. [Licença da fonte](../assets/logo/LICENCA-FONTE.txt)

| Elemento | Claro | Escuro |
|---|---|---|
| Eixos | `#0C1E38` | `#E6ECF5` |
| Calc | `#071C36` | `#E6ECF5` |
| Lab | `#0157E5` | `#4F89FE` |
| Traço azul e picos | `#0061FD` e `#018AFE` | `#0061FD` e `#018AFE` |
| Traço verde e vale | `#087C15` e `#138721` | `#06E708` e `#1EF130` |
| Subtítulo | `#4E565A` | `#B9C6D9` |

O verde amostrado no pixel (541, 328) do [PNG original](../assets/logo/original/calclab-logo-original.png) é `#06E708`. O vale no pixel (425, 507) é `#1EF130`. Na versão de fundo claro, os dois tons foram escurecidos para preservar a leitura do símbolo sobre branco. A [proposta FIEL de referência](identidade/propostas/index.html) conserva os verdes amostrados. Na versão aplicada, o menor contraste medido foi de 6,01:1 para texto e 3,46:1 para o símbolo sobre branco. Sobre o fundo escuro, foi de 5,20:1 e 3,38:1, respectivamente.

Use a versão horizontal com a cor do fundo correspondente. O cabeçalho usa 28 px de altura, 24 px em telas menores e o símbolo quadrado em telas estreitas. Nas versões vertical, monocromática e branca, mantenha a proporção do SVG. O favicon simplifica o símbolo para os dois picos e três pontos.

## Regenerar os PNGs

Na raiz, com ImageMagick instalado, rasterize o favicon original para os quatro tamanhos. O script usa o executável `convert` do ImageMagick 6.

```sh
for item in '32 favicon-32' '180 apple-touch-icon' '192 icone-192' '512 icone-512'; do
  set -- $item
  convert -background none -density 1152 assets/logo/favicon.svg \
    -resize "${1}x${1}" -strip "assets/logo/$2.png"
done
```

Para recompor a prévia social, use o SVG horizontal escuro rasterizado a 680 px de largura. Posicione-o em (85, 125) sobre `#111B2E` a 1280 × 640. Use Lato Bold a 44 px, em `#E6ECF5`, para “Calcule. Visualize. Confira.” no ponto (162, 461).

## Capturas

| Tema | Cabeçalho antes | Cabeçalho depois | Abertura antes | Abertura depois |
|---|---|---|---|---|
| Escuro | [PNG](assets/capturas/antes/cabecalho-escuro.png) | [PNG](assets/capturas/depois/cabecalho-escuro.png) | [PNG](assets/capturas/antes/abertura-escuro.png) | [PNG](assets/capturas/depois/abertura-escuro.png) |
| Claro | [PNG](assets/capturas/antes/cabecalho-claro.png) | [PNG](assets/capturas/depois/cabecalho-claro.png) | [PNG](assets/capturas/antes/abertura-claro.png) | [PNG](assets/capturas/depois/abertura-claro.png) |

A busca pelo nome anterior preserva identificadores internos como `MathLabApp` e `MathLabCalc`, chaves de armazenamento e variáveis de teste para compatibilidade. Os comandos e logs históricos preservam o texto capturado na época.
