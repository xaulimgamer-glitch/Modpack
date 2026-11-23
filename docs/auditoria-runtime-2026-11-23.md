# Auditoria atualizada — 23/11/2026

Esta rodada usa o `latest.log` encerrado em 23/11 às 12:20, os scripts atuais,
os JARs presentes e o dump de 15.298 itens daquela sessão. Foram encontradas
falhas reais de dados que a passagem anterior por sintaxe/dependências não
detectava. Os testes fora do jogo e as correções abaixo não equivalem a uma
nova sessão Minecraft aprovada.

## Versões: atenção à diferença entre log e instalação

A pasta contém 288 JARs externos, 478 contando os arquivos embutidos examinados
e 390 declarações candidatas de módulos. Não há mod ID duplicado entre arquivos
externos. A nova avaliação de 976 dependências Forge não encontrou ausência
obrigatória ou versão fora da faixa declarada.

O inventário anterior divergia em 11 declarações de versão, principalmente
Artifacts, Burnt, Collective, EntityCulling, Fancy World Animations, GeckoLib,
Iron's Spellbooks, JEI, Mezz Config, MultiMine e Particle Rain. Foram atualizados
os inventários físico e de módulos. Não foram instaladas ou removidas versões
durante esta auditoria.

O log usa Iron's Spellbooks **3.16.3**, enquanto a pasta já tem **3.16.4**;
também houve mudanças em JEI e outras dependências. Logo, um erro desse log
não comprova que a versão nova ainda o apresenta. Os erros de recursos foram
cruzados com os arquivos dos JARs atuais quando disponíveis. Uma nova execução
é necessária para distinguir o que uma atualização já corrigiu.

## Corrigido nesta rodada

| Problema | Evidência | Patch |
| --- | --- | --- |
| Tooltip dos arcos falha no JEI | `awakening_bow_tooltips.js#15: Unsupported manifest`; o script aceitava apenas schema 2, mas o manifesto atual é 3 | Aceita schemas 2 e 3, mantendo o formato dos campos utilizados. Teste reproduziu a rejeição anterior e registrou os 76 tooltips de itens existentes com a correção. |
| Quatro receitas vanilla contêm recursos vazios | Cultural Delights inclui JSONs de zero bytes para sopas/ensopados; log acusa EOF | Overrides válidos com condição `forge:false`, mantendo-as desativadas sem inventar receitas novas. |
| Tag de trilocaris cozido | Referência a `alexscaves:cooked_trilocaris`, ausente no registro | Substituída por `alexscaves:cooked_trilocaris_tail`, existente. |
| Tags de carne de dinossauro | IDs `dinosaur_chop_raw` e `dinosaur_chop_cooked` não existem | Usam `alexscaves:dinosaur_chop` e `alexscaves:cooked_dinosaur_chop`. |
| Chapa de prata | Tag exige `overgeared:silver_plate`, mas o registro contém `overgeared_iaf:silver_plate` | Namespace corrigido. |
| Duas tags CTOV/Wares | Exigem itens de Wares, que não estão presentes | Referências tornadas opcionais. |
| Fruta/proteína do Vintage Delight | Tags-pai referenciam filhos inexistentes em `fruits/gearo_berry` e `protein/peanut` | Adicionados aliases para as tags `forge:gearo_berry` e `forge:peanut`, existentes no JAR e compostas de itens presentes no dump. |
| Loot da tartaruga do Naturalist | Usa `minecraft:turtle_scute`, inexistente no conjunto 1.20.1 | Corrigido para `minecraft:scute`, mantendo quantidades e funções. |
| Loot do templo da selva | TWM substitui a tabela e inclui o item inexistente `twm:teste`, invalidando-a | Apenas essa entrada foi convertida em `minecraft:empty`, preservando seu peso e todas as demais entradas/pools. |

São 14 recursos de dados, mais `pack.mcmeta`, no datapack
`config/paxi/datapacks/awakening_runtime_fixes`. Nenhum JAR foi editado nesta
rodada. O script dos tooltips é uma alteração separada de uma linha.

As seis tags substituídas com `replace:true` tinham somente um fornecedor nos
JARs examinados; foram preservados seus demais valores. Isso evita simplesmente
acrescentar um ID válido enquanto o ID inválido continuaria quebrando a tag.
Se forem instalados outros fornecedores dessas mesmas tags, rever as substituições.

O RecipeManager do Forge instalado verifica o campo `conditions` antes de
exigir `type`, ingredientes e resultado, sustentando o formato dos quatro
overrides de receitas desativadas. Eles preservam o comportamento observado
de receita indisponível; não se assume que os arquivos vazios fossem intencionais.

## Falhas importantes ainda abertas

### 1. Colisão de dados da cabra convertida — prioridade alta

JEI/JER tenta criar uma `ConvertedGoatEntity` do Vampirism e recebe
`IllegalArgumentException: Duplicate id value for 28!`. A pilha envolve
`ICurableConvertedCreature.registerConvertingData` e `ConvertedGoatEntity`;
imediatamente antes aparece registro de dados de Goat pelo Windswept.

A falha ao construir essa entidade no caminho do JEI é confirmada. O envolvimento
dos registros do Windswept é uma pista forte, mas ainda precisa de isolamento.
Não foi demonstrado um crash ao converter uma cabra no mundo; há risco de o
mesmo construtor falhar nesse caso. Não remover mods ou desativar conversões
globalmente sem um teste controlado de Vampirism + Windswept + JER.

### 2. Quinze tabelas de loot foram rejeitadas no log

Duas receberam os patches acima. Entre as restantes:

- Cultural Delights: itens de blocos inexistentes e entradas `minecraft:alternative`
  que não são reconhecidas naquele contexto.
- Haunted Harvest: tabelas de lanternas referenciam variantes sem item registrado.
- Iron's Spellbooks: `minecraft:set_written_book_pages` desconhecido e uma
  entrada de crypt loot sem `name`. Retestar especialmente com a atualização 3.16.4.
- BetterEnd: subpredicado `minecraft:slime` desconhecido na tabela de end slime.
- ParCool: tabela do guia referencia `patchouli:guide_book`, ausente.

Não foram substituídas em massa por tabelas vazias: isso esconderia os erros e
poderia apagar recompensas. O registro completo e os JSONs originais estão em
`docs/audit/runtime-evidence.json`.

### 3. As duas tags amplas de carne ainda apresentam erro no log

`forge:meat` e `origins:meat` recebem `alexscavesdelight:cooked_sea_pig`, ausente.
Não foram sobrescritas com `replace:true`: isso exigiria preservar a união de
todos os contribuidores das tags amplas. Resolver a entrada inválida sem apagar
contribuições de outros mods é o próximo patch de tags.

### 4. Receita de lança de cobre malformada

KubeJS registra uma receita `spartanweaponry:copper_spear` com
`"h": {"rag": "spartanweaponry:poles"}` e informa que um ingrediente precisa
de `item` ou `tag`. Isso é defeito de dados, não uma otimização.
A origem exata da versão transformada ainda não foi localizada nos JSONs dos
dois JARs relacionados nem nos scripts locais. Não foi inventada uma receita
alternativa que pudesse contornar a progressão de fabricação.

### 5. Myconid — erro confirmado em execução

O log confirma carregamento **parcial** de `rpgraces:myconid/compact_mechanics`
porque `oorigins:modify_jump` não existe no registro de atributos.
Não significa que todo o poder foi perdido. Corrigir o namespace isoladamente
também não basta: `origins:modify_jump` é um tipo de poder, não um atributo.
O nome do modificador indica ataque e o ID indica salto; falta definir a intenção.

### 6. Configs e integrações residuais

- Cold Sweat registra 39 biomas únicos ausentes, incluindo Terralith. Não é
  evidência de 39 crashes: são regras que não podem ser aplicadas. Rever a lista
  com o conjunto atual de biomas, sem apagar temperaturas de biomas válidos.
- Vampirism registra erro de leitura de `minionTaskOrder` três vezes.
- Relações de mobs referenciam Guard Villagers/Recruits, cujas entidades não
  estão resolvidas. Os textos genéricos de erro não tornam os IDs sintaticamente inválidos.
- Há fallbacks de receitas de compatibilidade Overgeared/Valhelsia; fallback
  informado pelo KubeJS não comprova que a receita desapareceu. Testar a receita
  real e sua exibição no JEI antes de substituir todos esses recursos.

## Otimizações: o que os dados permitem concluir

- O registro de receitas do JEI levou **1,239 minutos** nessa sessão. É um
  gargalo real de entrada/reload. Não foi atribuída toda essa duração a um mod
  específico; os erros do JER e o volume de receitas são caminhos a perfilar.
- O dump de itens percorre 15.298 entradas, cria stacks, consulta classes/tags,
  ordena e grava o JSON em todo `ServerEvents.loaded`. É trabalho de diagnóstico
  que convém tornar opt-in numa distribuição final. Não roda em todo tick.
- Todas as tags exportadas estão vazias, inclusive para ferro vanilla. Portanto,
  esse dump é útil para IDs de itens, mas não para comprovar presença/ausência
  de tags. As exceções suprimidas pelo exportador dificultam o diagnóstico;
  ainda é preciso corrigir a consulta ou o momento da exportação.
- Houve dois avisos de atraso do servidor: 73 e 40 ticks. São sinais para medir
  com Spark, não prova de um vazamento ou de TPS permanentemente baixo.
- Render distance 16, simulation distance 8 e partículas completas são ajustes
  de custo, não erros por si. Não foram reduzidos sem uma medição em gameplay.
- ModernFix, FerriteCore, Embeddium, ImmediatelyFast e EntityCulling não foram
  removidos como duplicatas. Metadados não demonstram equivalência dos patches.
- O ParCool está limitado pelo cliente; os dois serverconfigs encontrados não
  impõem limitações. Se as manobras desativadas forem regra do multiplayer,
  configurar enforcement no servidor em vez de depender apenas do cliente.

## Validação executada e próximo teste

- Inventário atual lido e atualizado; zero mod ID externo duplicado.
- 976 dependências Forge cruzadas, sem conflito declarado detectado.
- Teste do script de tooltip no Rhino instalado: guarda antiga reproduz o erro;
  guarda nova registra 76 IDs existentes, sem duplicações.
- Os 14 JSONs do patch foram parseados; itens de tags/loot conferidos com o dump,
  exceto referências explicitamente opcionais. Aliases conferidos no JAR original.
- A busca por campos locais `item` ausentes, nos datapacks/Paxi/KubeJS, encontrou
  zero contra o dump daquela sessão. Isso não valida IDs de funções, atributos,
  condições, itens removidos depois do dump ou schemas de recipes/loot tables.

Ainda não executado: iniciar o conjunto atualizado e confirmar o carregamento
do novo datapack, F3+T para os tooltips, `/reload`, loot efetivo e ausência dos
erros reparados no log novo. Os JARs já mudaram desde a sessão analisada.
Não marcar todas as falhas históricas como problemas persistentes nem as
correções estáticas como aprovadas no jogo sem essa rodada.

Os logs e patches desta rodada não substituem o relatório estrutural anterior
em `docs/auditoria-modpack.md`; eles acrescentam evidência de execução e
identificam explicitamente o que permanece aberto.
