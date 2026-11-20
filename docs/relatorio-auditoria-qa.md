# Revisão acadêmica e técnica do CalcLab

Data da revisão: 11/11/2026. Escopo principal: Funções, sincronização GERAR e cálculos de CDI; inclui a refatoração compacta solicitada anteriormente. Revisão e alterações feitas por IA; não equivale a validação humana.

## 1. Resumo em cinco linhas

1. O motor JavaScript, o controlador de estado e os comandos do desenho executaram em Node; seis suítes foram aprovadas.
2. Passaram 800 funções aleatórias, 4.000 comparações de valores, 13 testes de estado e 20 regressões específicas, além da suíte original e exemplos de Cálculo.
3. Foram encontrados erros de gravidade alta em propriedades fixas, sincronização, interpretação de expressões, limites e selos de verificação; as reproduções listadas como corrigidas ganharam testes.
4. A interface foi refatorada no código, mas sua execução visual, acessibilidade e exportações reais estão **NÃO TESTADAS**, por bloqueio de sockets/navegador.
5. SymPy/Python está **NÃO TESTADO** funcionalmente; limites gerais, precisão extrema, alguns módulos secundários e validação humana permanecem limitações relevantes.

## 2. Evidências e reprodução

Estrutura organizada: `index.html`, `src/css/estilos.css`, `src/js/app.js`, `src/js/motor-matematico.js`, `src/js/motor-grafico.js`, `src/python/motor_simbolico.py`, `README.md`, `docs/guia-defesa-projeto.md`, `tests/modulos-gerais.test.js`. A suíte `sincronizacao-estado.test.js` foi criada na etapa de sincronização, antes da revisão acadêmica adicional.

- Antes das alterações: `node tests/modulos-gerais.test.js` → **15/15 aprovados**.
- Após as correções: `node tests/executar-testes.js` → **8 suítes aprovadas**, saída em [evidencias/log-execucao-testes.txt](evidencias/log-execucao-testes.txt).
- Sintaxe de JavaScript: `node --check` executado nos arquivos da aplicação; sintaxe Python conferida com `ast.parse`, sem importar SymPy.
- Servidor tentado: `python3 -m http.server 8000 --bind 127.0.0.1` → `PermissionError: [Errno 1] Operation not permitted` na abertura do socket.
- Navegador: Brave disponível, Playwright encontrado no ambiente; inicialização interrompida por `setsockopt: Operation not permitted` / SIGTRAP. `interface-navegador.test.js` encerrou com código **2: NÃO TESTADO**.
- `npm install --prefix /tmp/mathlab-tools playwright` falhou com `ENOTFOUND registry.npmjs.org`. Foi encontrado um Playwright já instalado, mas ele não contornou a restrição do navegador.
- `python3 -m pip install --target /tmp/mathlab-python sympy` falhou na resolução/conexão de rede. Não foi alegada conferência com SymPy.

## 3. Tabela de bugs

“Obtida” descreve a reprodução antes da correção correspondente, não a saída atual. Problemas identificados somente por leitura estão indicados. Gravidade considera o risco de apresentar um resultado incorreto como matematicamente confirmado.

| Nº | Módulo | Entrada / ação | Saída obtida | Saída esperada | Causa | Gravidade | Status |
|---|---|---|---|---|---|---|---|
| 1 | Funções | Normal `2x+1` → pronta; alterar a para 7 | Modelo antigo / coeficiente em objeto incorreto; catálogo continuava em 2x+1 | f(2)=15, mesma função nos dois modos | Conversão afim escrevia em `quad`; catálogo fixo | Alta | Corrigido |
| 2 | Funções | Limpar Normal | Última curva permanecia | Entrada e gráfico vazios | Retorno antecipado sem atualizar estado | Alta | Corrigido |
| 3 | Funções | Afim a=0, b=3 / b=0 | Tipo “Afim” mesmo degenerado | Constante / linear | Classificação não derivada dos coeficientes | Média | Corrigido |
| 4 | Exponencial | Base a=1 | Função aceita como exponencial | Recusa clara da base | Validação incompleta | Alta | Corrigido |
| 5 | Modelos | Modular deslocada; seno com A/B/C/D alterados | Estudo genérico, sem intervalos/período/fase atuais | Propriedades dos parâmetros atuais | Reutilização de análise genérica / catálogo | Alta | Corrigido |
| 6 | Quadrática | a=b=c=0 | “Sem raiz” | Todo x∈ℝ é raiz | Constantes zero e não zero tratadas igualmente | Alta | Corrigido |
| 7 | Quadrática | Δ<0 | `verificado4Formas=true` | Método fatorado real não aplicável | Uma suposta referência copiava yv | Alta | Corrigido |
| 8 | Quadrática | a=10⁻¹⁰ | Tratada como a=0 | Ainda é quadrática | Tolerância usada como definição de grau | Alta | Corrigido |
| 9 | Quadrática | x²+10⁹x+1 | Raiz pequena sofria cancelamento | Aproximadamente −10⁻⁹ | Subtração de números próximos em Bhaskara | Alta | Corrigido |
| 10 | Verificação | `NaN` versus `NaN`; erro forçado no segundo método | Aprovação / selos estáticos | Reprovação sem resultado confirmado | Igualdade de indefinições e flags fixas | Alta | Corrigido |
| 11 | Expressão livre | `x*(x^2-4)+1` | “Função Par” | Não é par; classificação exige análise | Um único par de amostras usado como prova | Alta | Corrigido: remove afirmação não demonstrada |
| 12 | Científica | Exemplo com seno em graus | Resposta fixa 5 | ≈4,0183 | Exemplo especial ignorava unidade | Alta | Corrigido |
| 13 | Parser | `cos(π)` e outras expressões com π | Erro de sintaxe | −1 em radianos | π → Math.PI → Math.Math.PI | Alta | Corrigido |
| 14 | Parser | `sen(x)^2+cos(x)^2`, `2^3^2`, `1e100` | NaN, associação incorreta ou notação dividida | 1, 512 e 10¹⁰⁰ | Regex de potência / multiplicação implícita | Alta | Corrigido |
| 15 | Parser | Texto JavaScript / expressão muito longa | Avaliação dinâmica sem validação suficiente, identificada no código | Rejeição antes de avaliar | Falta de lista de nomes e limites de entrada | Alta | Corrigido no caminho de avaliação revisado |
| 16 | Limites | `sqrt(x)` pela esquerda de 0 | −∞ | Sem domínio real nesse lado | NaN confundido com explosão negativa | Alta | Corrigido |
| 17 | Limites | Ponto `abc`; buraco removível | Ponto substituído por zero; curva recebia valor artificial junto ao buraco | Mensagem de ponto inválido; manter indefinição em 2 | `Number(...) || 0`; remendo no avaliador da curva | Alta | Corrigido |
| 18 | Derivadas | Trocar expressão por outra regra | Painel ainda mostrava passos de x³sen(x) | Regra e resultado da expressão atual | HTML didático fixo | Alta | Corrigido |
| 19 | Integrais | Indefinida de `sen(x)` | Apenas `∫sen(x)dx+C` | −cos(x)+C, com conferência | Só x² tinha primitiva efetiva | Alta | Corrigido nos seis casos documentados |
| 20 | GERAR | Coeficiente 1/3 → Normal → gerar | Coeficiente podia virar 0,33 | Preservar precisão dos parâmetros | Texto formatado reutilizado como fonte | Alta | Corrigido |
| 21 | Estado/PNG | PNG com tabela aberta; dois refazeres | Risco de curva anterior; segundo redo perdido | Exportar estado atual; restaurar ambas as ações | Canvas não atualizado; undo apagava redo | Média | Corrigido; exportação física NÃO TESTADA |
| 22 | Científica | `171!` | Retornava 170! | Erro de faixa numérica, sem truncar n | `Math.min(n,170)` no laço | Alta | Corrigido |
| 23 | Limites gerais | Oscilações, infinito ou casos fora dos exemplos | Heurísticas podem falhar | Análise com justificativa algébrica completa | Amostragem finita não é prova | Alta | Pendente como limitação geral; mensagens melhoradas |
| 24 | UX/exportação | Abrir app em três resoluções; copiar/PNG/PDF | Não foi possível observar | Fluxo completo sem cortes e exportações corretas | Ambiente bloqueia navegador/sockets | Média | Pendente — NÃO TESTADO |
| 25 | Python/GitHub | Executar SymPy e publicar histórico | Dependência/servidor indisponíveis; sem remoto | Execução validada e histórico no remoto | Rede bloqueada; `.git` sem histórico utilizável | Média | Pendente; bundle local entregue |

## 4. Conferência por métodos independentes

| Família | Método principal | Referência independente / segunda conferência |
|---|---|---|
| Constante/afim/linear | Modelo parametrizado | Avaliação direta de referência; diferença de valores e substituição da raiz |
| Quadrática | Δ, raiz estável e vértice | Completamento do quadrado; substituição; Viète; fatoração quando real |
| Modular | Módulo | Fórmula por partes e inclinações laterais |
| Exponencial | Potência de base | Exp(x·ln(a)); razão e lei dos expoentes |
| Logarítmica | Ln(x)/ln(a) | Log10(x)/log10(a); inversa exponencial |
| Trigonométrica | Seno parametrizado | Cosseno complementar, periodicidade e extremos |
| Limites de controle | Tabela lateral | Fatoração no removível; sinais e desigualdades de 1/x |
| Derivadas | Regras simbólicas recursivas | Fórmula algébrica independente e limite numérico do quociente incremental |
| Integrais | Primitiva e F(b)−F(a) | Derivar a primitiva; Simpson independente; ponto médio |
| Desenho | Comandos reais do Canvas | Marcadores versus f(x); área algébrica do polígono; separação de ramos |

As referências dos testes são implementações separadas das funções testadas, mas compartilham a aritmética IEEE-754 e funções elementares do JavaScript. Não são dois sistemas simbólicos externos. Não se infere uma prova global a partir de pontos finitos. Para divergências reproduzidas, as identidades usadas estão nos testes: por exemplo, completar o quadrado resolve a imagem da quadrática e a diferença de sinais resolve a inexistência em 1/x.

## 5. Cobertura das propriedades de Funções

D=domínio, I=imagem, R=raízes, Y=intercepto, M=monotonicidade, P=paridade, A=assíntotas. “Conferido” significa testes de referência e casos documentados, não exaustão de todos os reais.

| Tipo | Conferido | Limite da cobertura |
|---|---|---|
| Constante | D/I/R/Y/M/P/A; zero e valor não zero | Valores parametrizados e amostras finitas |
| Afim | D/I/R/Y/M/P/A; classificação com a=0 ou b=0 | Aproximação decimal da raiz; precisão extrema não garantida |
| Linear | D/I/R/Y/M/P/A; origem e sinal da inclinação | Mesmas limitações numéricas da afim |
| Quadrática | Δ e sinais, R/Y, vértice por 3 ou 4 formas, eixo, I, Viète, simetria, formas | Textos das formas são representações numéricas; não há prova exata de equivalência em todo coeficiente real |
| Modular | D/I, raízes algébricas, Y, intervalos de M, P, ausência de assíntotas; quina | Não é um analisador geral de expressões com vários módulos |
| Exponencial | D/I/R/Y/M/P/A; base e escala; bases inválidas | Testes não cobrem todos os regimes de overflow/underflow |
| Logarítmica | D/I/R/Y/M/P/A; mudança de base, inversa, bases inválidas | Precisão perto da base 1 é limitada |
| Trigonométrica | D/I, raízes por fórmula, Y/M/P/A, amplitude, período e fase; identidade e tg nos polos | Valores notáveis só nos casos disponíveis; representação simbólica exata geral não implementada |
| Expressão livre | Valores amostrados, raízes por busca, estado vazio e texto preservado | D/I/P/assíntotas globais não provados; selo automático removido |

A bateria aleatória cobre 100 funções por cada um dos oito tipos principais. A presença de um texto de propriedade não basta: há regressões analíticas específicas, referências de valores, identidades e verificações de marcadores. Ainda não há teste aleatório completo de cada texto algébrico produzido para toda combinação de parâmetros.

## 6. Estimativa por critério da rubrica

Estimativa conservadora baseada no código e nos testes; não substitui a avaliação da professora. Os máximos informados somam **6,01**, provavelmente por arredondamento.

| Critério | Estimativa / máximo | Evidência e desconto |
|---|---|---|
| Funções | 0,90 / 1,00 | Oito tipos, propriedades parametrizadas, 800 casos; desconto por expressão livre e visual não executado |
| Limites | 0,60 / 1,00 | Exemplos verificáveis, laterais e buraco; heurística geral continua limitada |
| Derivadas | 0,85 / 1,00 | Seis regras efetivas e testes por definição; subconjunto simbólico e precisão numérica limitados |
| Integrais | 0,80 / 1,00 | Seis exemplos de regras, derivada da primitiva e Simpson; substituição específica e integrais impróprias não gerais |
| Funcionamento/validação | 0,45 / 0,67 | Seis suítes reais; app visual e Python NÃO TESTADOS |
| GitHub/documentação | 0,45 / 0,67 | README, evidências e commits reais no bundle; remoto, integrantes e validação humana pendentes |
| Clareza/organização | 0,45 / 0,67 | Interface compactada e comentários em português; controlador extenso e inspeção humana pendente |
| **Total** | **4,50 / 6,01** | Aproximadamente **4,49 / 6**, normalizando apenas o arredondamento dos máximos |

As regras mínimas de cinco derivadas e cinco integrais são atingidas pelos **exemplos executáveis testados**, dentro do subconjunto descrito. Não se afirma que todo exemplo arbitrário de cada regra seja suportado.

## 7. Correções, organização e arquivos

Estrutura padronizada:
- Raiz: `index.html`, `package.json`, `requirements.txt`, `.gitignore`, `README.md`.
- Código-fonte (`src/`): `src/css/estilos.css`, `src/js/app.js`, `src/js/motor-matematico.js`, `src/js/motor-grafico.js`, `src/python/motor_simbolico.py`.
- Testes (`tests/`): `executar-testes.js`, `modulos-gerais.test.js`, `sincronizacao-estado.test.js`, `funcoes-auditoria.test.js`, `regressoes-matematicas.test.js`, `calculo-regras.test.js`, `graficos-renderizacao.test.js`, `integrais-modulo.test.js`, `graficos-layout.test.js`, `interface-navegador.test.js` e `interface-integrais.test.js`.
- Documentação (`docs/`): `guia-defesa-projeto.md`, `relatorio-auditoria-qa.md`, `relatorio-revisao-integrais.md`, `comparativo-evolucao-ui.md`, `roteiro-validacao-humana.md` e `evidencias/`.

## 8. Pendências honestas

- Executar o app e `tests/interface-navegador.test.js` num navegador permitido; obter capturas reais antes/depois, validar PDF/PNG, área de transferência, link e impressão de seções fechadas.
- Conferir contraste e leitor de tela manualmente, inclusive foco após todos os diálogos e ampliação de fonte.
- Instalar SymPy e revisar o motor Python separadamente; ele não valida o app por estar apenas presente no diretório.
- Fazer a validação humana, preencher integrantes e registrar as contas e capturas efetivamente realizadas.
- Publicar o histórico no GitHub somente após definir um remoto; exportar os prompts integrais se a professora os exigir.
- Limites gerais e classificação global de expressões livres continuam limitados. Não há suporte geral a integrais impróprias, substituição arbitrária ou primitivas elementares de qualquer função.
- Fazer auditoria completa dos módulos secundários. Os testes antigos não demonstram correção universal de álgebra, geometria, estatística ou modelagem.
- Números extremos e funções muito mal condicionadas ainda exigem análise humana; nenhuma bateria finita garante que o aplicativo nunca falhará em qualquer entrada.

**Confiança nos resultados de Funções: média**, sustentada pelos testes dos modelos parametrizados e identidades independentes, limitada pela aritmética numérica, expressões livres e ausência de execução visual nesta revisão.
