# Keybinds

Este documento registra os atalhos padrão distribuídos pelo modpack, os conflitos intencionalmente mantidos e as decisões tomadas na auditoria de input.

## Política de distribuição

Os atalhos padrão são distribuídos por `config/defaultoptions/keybindings.txt` através do Default Options.

A intenção é definir o padrão para instalações novas sem substituir remapeamentos que o jogador já tenha feito em `options.txt`.

O arquivo `defaultoptions.journal.json` é estado local de execução do Default Options e não deve ser distribuído pelo modpack.

## Atalhos centrais

| Ação | Tecla padrão | Observação |
| --- | --- | --- |
| Origins — poder primário | `G` | Mantido como binding central do sistema de raças/linhagens. |
| Origins — poder secundário | `H` | Mantido como binding central. Atualmente usado pelo Myconid entre as origens customizadas auditadas. |
| Origins — visualizar origem | `O` | `Ctrl+O` continua reservado ao overlay do JEI, portanto não há colisão física idêntica. |
| Puffish Skills — abrir habilidades | `K` | Mantido. O binding de saddlebag/bedroll do SWEM foi movido. |
| Iron's Spellbooks — roda de magias | `Z` | Mantido. O binding antigo do AstikorCarts foi removido por estar órfão no inventário atual. |
| Iron's Spellbooks — conjurar | `V` | Mantido. |
| Iron's Spellbooks — modificador da barra | `Left Alt` | Mantido. O seletor de habilidades do Relics foi movido para evitar disputa de scroll. |
| Combat Roll — rolar | `R` | Mantido. O handler do mod não executa roll enquanto o jogador está em um veículo. |
| Small Ships — vela | `R` | Mantido por ser contextual a embarcações e não competir funcionalmente com Combat Roll durante condução. |
| Sit | `X` | Mantido. O antigo `dragon_down` foi removido por estar órfão. |
| Vampirism — menu | `P` | Default upstream restaurado; `P` estava livre no esquema distribuído. |
| Deeper and Darker — Soul Elytra Boost | `B` | Default upstream restaurado; `B` estava livre após a remoção dos bindings do Map Atlases. |
| Deeper and Darker — Sculk Transmitter | `.` | Upstream usa `V`, mas `V` é o cast do Iron's Spellbooks; o handler só atua com Sculk Transmitter no inventário. |
| Alex's Caves — Special Ability | `M` | Upstream usa `G`, mas `G` é Primary Active do Origins; `M` é a alternativa do pack. |
| Create — Tool Menu | `,` | Upstream usa `Left Alt`; movido por conflito com Iron's Spellbooks. Compartilha `,` com Toolbelt por contexto. |
| Create — Toolbelt | `,` | Upstream usa `Left Alt`; movido por conflito com Iron's Spellbooks. Compartilha `,` com Tool Menu por contexto. |

## SWEM

Os controles auxiliares do SWEM foram afastados dos bindings centrais do jogador:

| Ação | Antes | Agora | Motivo |
| --- | --- | --- | --- |
| Aumentar velocidade/marcha | `H` | `]` | `H` é Secondary Active do Origins. |
| Reduzir velocidade/marcha | `G` | `[` | `G` é Primary Active do Origins. |
| Saddlebag / bedroll | `K` | `I` | `K` abre Puffish Skills. |
| Frost Walk | `Middle Mouse` | `N` | Evita disputar Pick Block e ações contextuais do JEI. |
| Toggle flight | `J` | `J` | Sem conflito funcional identificado. |
| Descer em voo | `Left Shift` | `Left Shift` | Contextual ao voo do cavalo; compartilhamento mantido. |
| Subir em voo | `Space` | `Space` | Contextual ao voo do cavalo; compartilhamento mantido. |

## Relics

| Ação | Antes | Agora | Motivo |
| --- | --- | --- | --- |
| Lista/seletor de habilidades | `Left Alt` | `Y` | Relics e Iron's Spellbooks utilizam modificador + scroll; usar a mesma tecla produz conflito funcional. |
| Pesquisar relíquia | `Left Shift` | `Left Shift` | Contextual; compartilhamento mantido. |

## Origins customizados

No conjunto atual de raças/linhagens/classes, os poderes ativos auditados usam os inputs do Origins, e não key mappings próprios das classes.

`Primary Active (G)` é usado por:

- Dragonborn — Fire Breath
- Dragonborn — Frost Breath
- Dragonborn — Storm Breath
- Frogfolk — Super Jump
- Tortle — Shell Defense
- Giantborn — Change Size
- Myconid — Grow
- Wood Woad — Verdant Touch

`Secondary Active (H)` é usado por:

- Myconid — Shrink

Considerando 18 estados finais de raça/linhagem e 7 classes selecionáveis, existem 126 combinações válidas. Destas, 56 usam `Primary Active` e 7 usam `Secondary Active` com as definições atuais.

As classes Barbarian, Wizard, Cleric, Warrior, Rogue, Paladin e Ranger não registram diretamente um `primary_active` ou `secondary_active` adicional nas definições auditadas.

## Duplicidades mantidas por contexto

Nem toda duplicidade física exibida na tela de controles é um conflito funcional.

- `R`: Combat Roll, Small Ships e JEI Show Recipe. JEI opera em GUI; Combat Roll aborta quando o jogador está em veículo; Small Ships é contextual à embarcação.
- `W`: movimento e Ponder. O Ponder usa contexto de interface/bloco.
- `A`: movimento e bookmark do JEI. O binding do JEI é usado em GUI.
- `Space`: pulo, Wall Jump do ParCool e subida em voo do SWEM. São ações contextuais de movimento.
- `Left Shift`: sprint, Fast Run, detalhes do Jade, pesquisa do Relics, Equipment Compare e descida em voo do SWEM. A sobreposição é predominantemente contextual/modificadora.
- `Mouse Right`: uso vanilla e várias ações do ParCool. São intencionalmente sensíveis ao estado do movimento/ambiente.
- `,`: Create Tool Menu e Toolbelt. Upstream também compartilha uma única tecla entre as duas ações; os handlers dependem de contexto de schematic/toolbox, portanto o compartilhamento é intencional.

Essas duplicidades devem ser reavaliadas apenas se um teste de gameplay demonstrar acionamento simultâneo indesejado.

## Bindings órfãos removidos

Foram removidas do arquivo de defaults entradas pertencentes a mods que não constam no inventário atual do modpack.

Removidos na primeira passagem:

- `key.dragon_fireAttack`
- `key.dragon_strike`
- `key.dragon_down`
- `key.dragon_change_view`
- `key.astikorcartsredux.action`
- `key.astikorcartsredux.slow`

As quatro entradas `dragon_*` pertencem ao Ice and Fire. O AstikorCarts Redux também não está presente no inventário versionado atual.

Removidos na segunda passagem:

- Butchery: `evokermaskpress`, `pillagernosepress`, `vindicatornosepress`
- The Aether: `open_accessories`, `gravitite_jump_ability`, `invisibility_toggle`
- Placebo: `toggleTrails`, `toggleWings`
- Cataclysm: `ability`, `helmet_ability`, `chestplate_ability`, `boots_ability`
- Map Atlases: `open_minimap`, `zoom_out_minimap`, `zoom_in_minimap`, `place_pin`, `increase_slice`, `decrease_slice`

Se qualquer um desses mods voltar ao modpack, seus bindings devem ser auditados novamente antes de serem reintroduzidos no arquivo do Default Options.

## Mods instalados com defaults suprimidos

`key.keyboard.unknown` não significa necessariamente que a ação é opcional no mod original. A auditoria encontrou vários casos em que o Default Options do pack anulava ou ainda anula uma tecla que upstream fornece por padrão.

### Vampirism

Na linha 1.20 usada como referência pelo mod instalado, os defaults upstream são:

| Ação | Upstream | Pack atual | Situação |
| --- | --- | --- | --- |
| Action menu | `R` | sem tecla | `R` conflita com Combat Roll/Small Ships. |
| Suck Blood | `V` | sem tecla | `V` conflita com Iron's Spellbooks cast. |
| Vampirism menu | `P` | `P` | Default upstream restaurado; não há outro binding físico `P` nos defaults distribuídos. |
| Vampire Vision | `N` | sem tecla | `N` foi atribuído ao Frost Walk do SWEM. |
| Action 1 | `Alt+1` | sem tecla | upstream usa modificador; requer teste com hotbar. |
| Action 2 | `Alt+2` | sem tecla | upstream usa modificador; requer teste com hotbar. |
| Action 3 | `Alt+3` | sem tecla | upstream usa modificador; requer teste com hotbar. |
| Actions 4–9 | sem tecla | sem tecla | Mantém o comportamento upstream. |
| Minion task | sem tecla | sem tecla | Mantém o comportamento upstream. |
| Select ammo | `C` | sem tecla | `C` conflita com Crawl do ParCool. |

Não restaurar os defaults conflitantes literalmente; isso apenas recriaria colisões funcionais. O menu em `P` foi restaurado por não apresentar colisão estática, mas as demais ações relevantes ainda precisam de esquema alternativo ou validação contextual.

### Werewolves

Upstream registra `Leap` em `Left Ctrl` e `Bite` em `V`, ambos com contexto `IN_GAME`.

`Leap` só executa quando `Jump` também está pressionado, o jogador é werewolf, está transformado e a ação não está em cooldown. `Bite` usa `consumeClick()` e só executa para um werewolf mirando uma entidade válida para mordida.

Mesmo assim, o pack mantém ambos sem tecla nesta etapa: `Left Ctrl` é Sneak e `V` é cast do Iron's Spellbooks. Como são ações de combate/movimento P1, não serão deslocadas para uma tecla periférica sem teste de gameplay ou decisão de esquema.

### Create

Create registra `Tool Menu` e `Toolbelt` upstream na mesma tecla, `Left Alt`, enquanto `Rotate Menu` já vem sem tecla.

`Left Alt` está reservado ao modificador da barra de magias do Iron's Spellbooks. O pack move `Tool Menu` e `Toolbelt` juntos para `,`, preservando o compartilhamento intencional entre as duas ações e evitando a disputa com magia. `Rotate Menu` permanece sem tecla, seguindo o upstream.

### Alex's Caves

`Special Ability` é `G` upstream. Como `G` é o Primary Active do Origins, o pack distribui essa ação em `M`.

`M` não possui outro binding físico nos defaults versionados atuais. A ação deixa de ficar inacessível por padrão, mas ainda precisa ser validada no cliente com os equipamentos/montarias que realmente consomem `Special Ability`.

### Deeper and Darker

Upstream registra:

- Soul Elytra Boost: `B`
- Sculk Transmitter: `V`

O pack restaura Soul Elytra Boost em `B`. Sculk Transmitter é movido para `.` porque `V` é usado pelo cast do Iron's Spellbooks. O handler do Transmitter só processa a ação quando existe um `SculkTransmitterItem` no inventário, portanto `.` fica reservado a uma ação utilitária contextual e evita colisão com combate/magia.

### Quivers

Supplementaries e Spartan Weaponry possuem ações de acesso rápido a quiver que estão sem tecla no pack. Isso evita colisões com bindings já ocupados (`V` e `I`, respectivamente, nos defaults mais comuns/upstream). Essas ações são de prioridade menor porque existem rotas de interação/inventário alternativas e não devem tomar uma tecla central sem necessidade.

## Bindings genéricos ainda sob identificação

- `Inspect Key` em `Mouse 4`
- `Sit` em `X`

Eles foram mantidos porque ainda não há evidência suficiente para classificá-los como órfãos.

`key.special_ability` já foi identificado como Alex's Caves e, portanto, não é órfão.

## Souls Combat HUD

O Souls Combat HUD foi observado em uma instância/tela de controles durante a auditoria, mas não aparece no `modlist.txt` nem na árvore versionada do `development` usada como fonte de verdade nesta revisão.

Por isso, seus bindings não foram adicionados nem alterados no arquivo de defaults do repositório. Se o mod fizer parte da distribuição final, o inventário precisa ser atualizado e os seis key mappings do mod devem entrar nesta auditoria.

## Interceptores de input customizados

`awakening-compat` não registra um key mapping global próprio para Tortle Shell. Quando o Tortle está recolhido no casco, o mod bloqueia movimento e cancela ataque/uso de forma contextual. Esse comportamento é intencional e faz parte da mecânica da habilidade, não de um conflito de teclas.

## Validação

Validação estática concluída:

- mapeamentos do Default Options revisados;
- conflitos de Origins cruzados com as combinações que podem coexistir;
- handlers relevantes de Combat Roll, Relics, SWEM e AstikorCarts analisados;
- bindings órfãos cruzados com o inventário versionado;
- segunda passagem de namespaces órfãos concluída;
- defaults upstream de Vampirism, Werewolves, Create, Alex's Caves e Deeper and Darker comparados ao pack;
- input customizado de `awakening-compat` revisado;
- `P` restaurado para o menu do Vampirism, `B` restaurado para Soul Elytra Boost e `M` definido como alternativa do pack para Alex's Caves Special Ability;
- Create Tool Menu/Toolbelt movidos juntos para `,` e Sculk Transmitter movido para `.`.

Ainda requer validação dentro do cliente Minecraft:

1. instalação limpa, confirmando que os novos defaults são aplicados;
2. perfil já existente com teclas personalizadas, confirmando que o Default Options não as sobrescreve;
3. Origins `G/H` montado em cavalo SWEM, confirmando ausência de acionamento duplo após o remapeamento;
4. Iron's Spellbooks + Relics, confirmando seleção independente por scroll;
5. SWEM Frost Walk em `N` e saddlebag/bedroll em `I`;
6. controles com layout de teclado usado pelo público-alvo, especialmente `[`, `]`, `,` e `.`;
7. Vampirism menu em `P`, Deeper and Darker Soul Elytra Boost em `B`, Sculk Transmitter em `.`, Alex's Caves Special Ability em `M` e Create Tool Menu/Toolbelt em `,`;
8. qualquer novo binding alternativo escolhido para as ações restantes de Vampirism/Werewolves.
