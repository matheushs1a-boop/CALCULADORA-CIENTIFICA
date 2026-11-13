# Comparação descritiva antes/depois

Não há capturas válidas desta revisão: a tentativa de abrir o navegador terminou com `setsockopt: Operation not permitted` / SIGTRAP. Não foram fabricadas imagens. A comparação abaixo descreve o código anterior e o código entregue; o resultado visual precisa ser inspecionado em navegador permitido.

| Área | Antes | Depois implementado |
|---|---|---|
| Topo | Desfazer, refazer, fonte −/+, estados, favoritos, link, exportar, ajuda, tema e configurações competiam por espaço | Cinco grupos: marca, busca central, favoritos, compartilhar e configurações |
| Ações | Cópia, LaTeX, PDF, link e PNG espalhados por três áreas | Compartilhar reúne as cinco ações; o resultado conserva só o ícone de cópia |
| Configurações | Drawer com tema e recolher painel | Menu com aparência, cálculo, atalhos, ajuda, estados e informações |
| Modos | Painel Visual na linha de módulos | Pílulas com rolagem própria; Painel Visual em Aparência |
| Gráfico | Título, badge e barra de ferramentas com botões largos e PNG | Barra com abas; zoom/ajuste/padrão flutuam no canto; legenda discreta |
| Entrada | Visor, cartão, seletor, cartões de modelo e botão de conversão repetiam informações | Um seletor de tipo em Funções, um segmento de entrada, dica curta e rodapé fora da rolagem |
| Resultado | Compartilhamento duplicado e várias seções abertas | Resultado e estado de verificação sempre visíveis; detalhes recolhidos |
| Estado | Conversão afim escrevia em coeficientes de quadrática; catálogo ignorava alterações | Modelos e campo livre derivam de `state.funcoes`; testes exercitam troca e geração |
| Precisão | Texto formatado podia voltar como entrada e arredondar a função | Expressão editável preserva os números dos parâmetros |

A implementação conserva o fundo azul, a curva principal verde e usa vermelho nos marcadores dos modelos parametrizados e na derivada. A validação visual entre 1366×768 e 1920×1080 permanece NÃO TESTADA, com roteiro automatizado em `tests/interface-navegador.test.js`.
