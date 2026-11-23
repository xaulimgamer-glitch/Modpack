# Auditoria do modpack — 19/11/2026

## Escopo e limite da conclusão

Auditoria estática da instalação local Forge 1.20.1. Foram examinados os JARs,
metadados embutidos, dependências declaradas, inventários, formatos de configs,
scripts e estrutura do módulo Awakening Compat. Não foi executada uma sessão
Minecraft nem um servidor dedicado. Ausência de conflito nos metadados não
prova ausência de conflito entre mixins, geração de mundo ou regras de gameplay.

## Corrigido

| Componente | Evidência e correção |
| --- | --- |
| ModernFix | Arquivo real `modernfix-forge-5.28.0-mc1.20.1.jar`; versão interna `5.28.0+mc1.20.1`. Atualizado o inventário que registrava 5.27.83. |
| Icarus | O JAR instalado declara **2.14.1**, não 2.14.0. Contrato do addon limitado a `[2.14.1]`; dependência Gradle alinhada ao arquivo CurseForge **8753894**, identificado em `minecraftinstance.json`. |
| Origins | O JAR declara **1.20.1-1.10.0.9**. Contrato do addon limitado a `[1.20.1-1.10.0.9]`. |
| Versão do próprio addon | O manifesto não tinha `Implementation-Version`, embora `mods.toml` usasse `${file.jarVersion}`. Build e JAR instalado agora incluem **0.1.0**, com verificação na CI. |
| Inventários | Regenerados `modlist.txt` e `mods-instalados.txt`. O primeiro usa CSV com escaping adequado; o inventário antigo continha uma linha malformada por vírgula não escapada. |
| Tags de armas | Dez entradas em seis tags exigiam itens do mod removido `alexsmobsdelight`. Convertidas para `{ "id": "...", "required": false }`, preservando a integração se o conteúdo voltar e evitando falha das tags por esses itens ausentes. |
| Lifecycle | A fila de seleção de Origins é removida no logout e limpa no encerramento do servidor. O mapa de expiração de sopros também é limpo no encerramento, evitando estado estático residual entre servidores integrados. |
| CI | Adicionada verificação do manifesto, contratos, paridade de recursos e empacotamento dos mixins. Publicação automática do JAR restrita ao branch `development`, inclusive em disparos manuais. |

As alterações anteriores do usuário em mods, configs e scripts foram preservadas.
Nenhum mod foi removido por presumida redundância. Não foram feitos commits,
pushes nem execução remota do workflow.

## Inventário: origem, divergências e bibliotecas

O código instalado do Iron's Spellbooks contém
`io.redspace.ironsspellbooks.command.GenerateModList`, que registra `/modlist` e
escreve `modlist.txt`. Portanto, o arquivo era um **snapshot exportado por comando**,
não um inventário atualizado automaticamente a cada alteração em `mods/`.
Uma nova execução desse comando pode substituir nosso CSV por outro snapshot.

Resultado da leitura de arquivos:

- **288 JARs externos**, todos legíveis e sem erro de CRC na varredura.
- **479 arquivos JAR examinados**, somando os externos e os embutidos descobertos
  por metadados Forge/Fabric e pelo manifesto específico do Connector.
- **391 declarações candidatas de módulos**. Esse número não equivale a 391 mods
  resolvidos no runtime: inclui alternativas embutidas que os loaders deduplicam.
- **Nenhum mod ID duplicado entre JARs externos**.
- Inventário original: 260 linhas, 50 versões divergentes e 67 nomes sem
  correspondência direta no conjunto de arquivos externos/embutidos descobertos.
  Essa última contagem inclui entradas de plataforma como Forge/Minecraft e
  uma linha CSV malformada; não significa 67 mods faltantes.
- O inventário estático de módulos inclui caminhos `pai.jar!/caminho/filho.jar`.
  `jars-installed.csv` cobre separadamente **todos os 288 arquivos físicos**,
  inclusive bibliotecas sem mod ID, como KotlinForForge.

Arquivos de evidência em `docs/audit/`:

- `mods-audit-before-refresh.json`: diferenças do inventário original.
- `inventory-missing-before-refresh.csv`: nomes antigos para revisão histórica.
- `mods-audit.json`: metadados e comparação da instalação atual.
- `mods-installed.csv`: declarações de módulos e suas origens.
- `jars-installed.csv`: arquivos físicos, tamanhos e SHA-256.
- `dependencies.json`: avaliação das faixas de dependência Forge.
- `configs-audit.json`: triagem de sintaxe e namespaces.

Após a atualização e a última reconstrução do addon, a comparação final teve
zero arquivo de módulo sem correspondência, zero versão divergente e zero
mod ID novo/ausente. Os 288 JARs físicos estão contabilizados no CSV próprio;
nenhuma versão permaneceu como variável não resolvida.

Há oito grupos de candidatos de biblioteca repetidos, principalmente embutidos:
Architectury, Mezz Config, MixinExtras, MixinSquared, PlayerAnimatorAPI,
TRansition, TRender e Zigy's Multiloader Utils. Isso **não é, por si, duplicação
fatal**. Não extrair nem apagar bibliotecas de dentro dos JARs. Em particular,
Shield Overhaul inclui uma variante Fabric de PlayerAnimatorAPI, enquanto há
uma variante Forge externa: a seleção feita pelo Connector precisa de teste.
O inventário registra ambas sem fingir ter resolvido essa seleção.

`rubidium` é uma declaração de compatibilidade dentro do Embeddium; não foi
encontrado um segundo JAR externo de Rubidium. O stub `sereneseasons` pertence
à ponte de Ecliptic Seasons e não comprova que dois sistemas de estações completos
estejam instalados. O nome 1.20.4 do ImmediatelyFast foi mantido: a checagem de
faixas declaradas não acusou incompatibilidade com Minecraft 1.20.1.

## Dependências e versões de Minecraft

Foram cruzadas **978 declarações de dependência Forge**, usando o comparador de
versões Maven, contra os candidatos presentes e Forge 47.4.22/Minecraft 1.20.1.
Não houve dependência obrigatória ausente nem faixa incompatível nessa avaliação.
Ela considera ambos os lados e candidatos embutidos; não substitui a resolução
real de JarJar nem avalia toda a semântica das dependências Fabric/Connector.

Origins exige no seu `mods.toml`:

| Dependência | Faixa exigida por Origins | Versão embutida |
| --- | --- | --- |
| Calio | `[1.20.1-1.11,)` | `1.20.1-1.11.0.5` |
| Apoli | `[1.20.1-2.9,)` | `1.20.1-2.9.0.8` |

As duas bibliotecas estão no JarJar do Origins instalado. `compileOnly` continua
correto no addon: oferece a API na compilação sem empacotar outra cópia. A
dependência obrigatória de Origins garante essas dependências transitivas no
runtime atual. Não foi acrescentada uma exigência redundante ao nosso TOML.

## Configs, datapacks e scripts

Triagem de `config/`, `defaultconfigs/`, `datapacks/`,
`moonlight-global-datapacks/`, `data/` e `kubejs/`:

- 769 JSONs e 171 TOMLs examinados sintaticamente.
- Cinco `.json` usam comentários: CaveOre, Cupboard, Lithostitched,
  Loot Integrations e Structure Essentials. Foram aceitos pelo parser leniente
  do Gson; não foram tratados como arquivos quebrados.
- 41 scripts compilados pelo parser do **Rhino instalado**, sem executar eventos.
- 14 JSON5, nove SNBT e sete mcfunctions foram inventariados, mas sua validação
  completa de formato/schema/execução permanece pendente.
- A triagem de namespaces gera candidatos, não erros automáticos: configs de
  compatibilidade, exemplos e tags opcionais podem mencionar mods ausentes.
- Logs KubeJS existentes mostram fallback de receitas de Valhelsia Furniture
  com `valhelsia_core:platform_dependent`. Isso requer testar receitas/JEI com
  Connector; o próprio log informa fallback para vanilla, não perda comprovada.

### Problema confirmado ainda sem correção de balanceamento

`config/paxi/datapacks/rpg_races/data/rpgraces/powers/myconid/compact_mechanics.json`
contém `"attribute": "oorigins:modify_jump"`. Esse ID não é um atributo válido
do conjunto instalado. Mesmo remover o `o` extra não basta: `origins:modify_jump`
é um tipo de poder, não um atributo. O nome do modificador fala em ataque,
enquanto o ID sugere salto. A correção exige decidir a intenção; não foi
inventado um bônus de ataque ou salto durante a auditoria.

Permanecem configurações residuais de mods removidos, como TreeChop,
Alex's Mobs Delight e Small Ships. Um arquivo residual não prova execução de
uma regra; não foi apagado. `smallships-common.toml` também contém
`alexmobs:cachalot_whale`, diferente de `alexsmobs:cachalot_whale`, mas Small
Ships não está entre os módulos atuais. Rever antes de reinstalá-lo.

## Sobreposições: mantido e teste necessário

| Área | Conjunto real | Avaliação e teste |
| --- | --- | --- |
| Performance/memória | ModernFix, FerriteCore, ImmediatelyFast, Embeddium, EntityCulling | Não removidos como equivalentes. Atuam em caminhos distintos; medir heap, frame time e carregamento. ModernFix está sem overrides explícitos; recursos experimentais não foram ativados. |
| Renderização | Oculus, EMF, ETF, EMF Compat Core, Embeddium | Há relatos oficiais de problemas visuais nessa família de integrações, sem prova para esta combinação exata. Testar resource packs, entidades, F3+T e shaders. `shaderPack` está vazio no config atual. |
| Texturas conectadas | CTM, Continuity, Polytone | Sobreposição potencial de recursos de packs; testar o pack efetivamente usado. Presença conjunta não prova duplicação funcional. |
| Câmera/animação | Real Camera, HoldMyItems, NotEnoughAnimations, Shoulder Surfing e bridges RAC/RAM/RAR | Testar primeira/terceira pessoa, arco, escudo, voo e reload. Bridges indicam integração intencional, não garantia de todos os casos. |
| Movimento/defesa | ParCool, Combat Roll, Stealth, Shield Overhaul, Block Parry Dodge e bridges | Testar teclas, estados, detecção por ruído/visão, bloqueio, parry e rolamento separadamente. |
| Cura | Harder Natural Healing, Healing Campfire, efeitos raciais | Config atual: atraso natural de 200 ticks, mas Healing Campfire aplica regeneração e tem atraso pós-dano igual a zero. A cura por efeito pode contornar a intenção do atraso natural; requer decisão de design. |
| Terreno/estruturas | Tectonic, Regions Unexplored, StreamsReflowing, Dungeons Arise/Enhanced, YUNG, Dungeons and Taverns, Structory, SparseStructures | Testar mundo novo, fronteiras, colisões e tempo por chunk. SparseStructures usa `spreadFactor: 2`; não aumentar densidade sem medir. |
| IA/dificuldade | Better Mob Combat, BMC Fix, MobPlayerAnimator, Stealth, Wither Reincarnated e regras raciais | Testar aquisição/perda de alvo, animações e dano; metadados não modelam a ordem dos eventos. O arquivo MobControl contém exemplos; não tratar todo exemplo como regra ativa relevante. |
| Villagers/raids | CTOV, Villages&Pillages, VMinus, Raids Enhanced, It Takes a Pillage e filtragem de trades do addon | Testar ofertas de Fletcher, aldeias e invasões. A remoção de arcos vanilla do addon é intencional e deve continuar funcionando com alterações de trades. |

Relatos e documentação consultados, usados como pistas de teste:

- https://github.com/embeddedt/ModernFix
- https://github.com/embeddedt/ModernFix/wiki/Dynamic-Resources-FAQ
- https://github.com/Asek3/Oculus/issues/830
- https://github.com/Asek3/Oculus/issues/852
- https://github.com/Sinytra/Connector

Mods visuais presentes são apropriados para esta instância cliente. Isso não
transforma a pasta inteira em um server pack validado; um pacote dedicado
precisa de uma lista de instalação própria e de teste de inicialização.

## Awakening Compat: verificações e riscos

Os seis mixins e nove seletores de injeção foram conferidos contra o bytecode
dos JARs instalados, incluindo nomes SRG do refmap e contagem das chamadas dos
redirects. Icarus e Origins agora têm contratos exatos. Spartan Weaponry e
Icarus Re-Winged já tinham restrições de versão.

- `defaultRequire: 1` foi mantido para não esconder falhas de injeção.
- Jupiter continua com quatro callbacks estáticos explícitos e contagem exata.
- Os targets opcionais de Jupiter/Re-Winged usam strings e `@Pseudo`; o modelo
  Re-Winged está na lista `client`. Isso dá suporte estrutural à ausência dos
  mods, mas a inicialização sem eles ainda precisa ser executada.
- Pacotes de rede são direcionados a `PLAY_TO_CLIENT`, usam processamento na
  thread principal e guardas de lado cliente. O registro possui guarda contra
  duplicação. Handlers de tick relevantes filtram `END`.
- Absorção do Tortle ocorre em `LivingHurtEvent`, evitando descontar também em
  `LivingAttackEvent`. Contudo, a prioridade HIGHEST pode interagir com um mod
  que cancele/reduza dano depois; testar guard consumido versus dano efetivo.
- O inicializador visual da armadura segue o ponto de extensão de cliente do
  Forge. Um teste dedicado continua necessário para fechar sidedness.
- Permanecem targets internos sensíveis a mudanças de Block Parry Dodge e
  Jupiter. Alterar seus JARs exige repetir `VerifyMixinTargets`; nomes/versões
  genéricos de projetos MCreator nem sempre identificam revisões de bytecode.
- A revisão estrutural e os alvos foram cobertos; isso não certifica todos os
  caminhos semânticos das 37 classes, morte/clone/corpse e chunk unload.

## Build, CI e validação integrada

As 37 fontes Java foram compiladas para Java 17 e remapeadas integralmente
para SRG usando as dependências e mappings locais. Os recursos atualizados e
classes recompiladas foram empacotados no JAR instalado com a ferramenta do
JDK. O refmap existente foi preservado e seus alvos verificados separadamente;
esse fallback não executa novamente o annotation processor do Mixin.

O Gradle convencional não pôde iniciar neste ambiente: falha de carregamento de
`native-platform.dll`; o wrapper padrão também encontrou restrição de escrita
no cache externo. Portanto, **não afirmar `clean build` Gradle nem CI verde**.
O workflow foi alterado localmente, mas ainda precisa rodar no GitHub depois
que as alterações forem enviadas pelo fluxo normal do projeto.

Os seis commits automáticos mais recentes que tocaram o addon
(`32f446c`, `4ea07d5`, `246ed0f`, `e280d5b`, `f4006c9`, `523f9de`)
alteraram somente `mods/awakening-compat-0.1.0.jar`. Isso confirma o escopo de
arquivos desses commits, não substitui testar os binários históricos.

Testes executados nesta revisão:

| Verificação | Resultado |
| --- | --- |
| Arquivos JAR e metadados | 288 externos; 479 com embutidos; zero erro de leitura/CRC |
| Dependências Forge | 978 declarações; zero conflito declarado detectado |
| Fontes do addon | 37 classes compiladas e remapeadas |
| Contratos/recursos do JAR | Faixas exatas, manifesto 0.1.0, mixins, overlay, diagnóstico e refmap conferidos |
| Mixins | Seis targets e nove seletores conferidos; redirects com contagem válida |
| Scripts | 41 analisados pelo Rhino instalado, sem executar gameplay |
| Configs | JSON/TOML triados; cinco JSONs comentados aceitos pelo Gson |
| Tags removidas | Dez referências opcionais em seis arquivos |

Avisos de versões antigas de Actions/Node e depreciações do Gradle continuam
fora das correções de runtime desta rodada. `checkout@v4` e `setup-java@v4`
não foram trocados sem uma rodada própria de validação do workflow.

## Ainda precisa de teste no jogo

1. Inicializar o cliente com o novo JAR e executar `/reload` e F3+T.
2. Inicializar servidor dedicado; repetir sem Re-Winged e sem Jupiter.
3. Confirmar a seleção JarJar/Connector, especialmente PlayerAnimatorAPI e libs Fabric.
4. Reproduzir Shadow Veil/Forest Veil, Darkvision e Sun Glare com o diagnóstico.
5. Testar defesa, voo, armas, seleções de Origins e troca entre mundos integrados.
6. Testar Tortle: dano, morte, clone, corpse, logout, retorno e troca de dimensão.
7. Gerar chunks novos, verificar estruturas/aldeias e medir TPS/frame time.
8. Testar cura após dano perto e longe de fogueiras e conferir ofertas de villagers.
9. Fechar a intenção do modificador inválido de Myconid e então aplicar o patch.

Não há conclusão de que todas as incompatibilidades possíveis foram eliminadas.
As prioridades de inventário/contrato foram corrigidas; os limites acima são
parte do resultado da auditoria, não testes considerados aprovados.
