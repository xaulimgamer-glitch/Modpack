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
| Vanilla — alternar perspectiva | `F5` | Restaurado; Shoulder Surfing intercepta o binding vanilla para o ciclo de perspectiva. |
| Shoulder Surfing — trocar ombro | `U` | Default upstream restaurado; compartilha fisicamente com JEI Show Uses, mas em contexto distinto. |
| FirstPerson — toggle | `F6` | Mantido. |
| Sit | `X` | Mantido. O antigo `dragon_down` foi removido por estar órfão. |
| Vampirism — menu | `P` | Default upstream restaurado; `P` estava livre no esquema distribuído. |
| Vampirism — Action Menu | `Alt+R` | Preserva a letra upstream e evita conflito direto com Combat Roll/Small Ships. |
| Vampirism — Suck Blood | `Alt+V` | Preserva a letra upstream e evita o cast simples do Iron's Spellbooks. |
| Vampirism — Vampire Vision | `Alt+N` | Preserva a letra upstream e evita o Frost Walk do SWEM. |
| Vampirism — Select Ammo | `Alt+C` | Preserva a letra upstream e evita Crawl do ParCool. |
| Vampirism — ação 1 | `Alt+1` | Default upstream restaurado; Forge prioriza o mapping com modifier sobre `1` simples. |
| Vampirism — ação 2 | `Alt+2` | Default upstream restaurado; Forge prioriza o mapping com modifier sobre `2` simples. |
| Vampirism — ação 3 | `Alt+3` | Default upstream restaurado; Forge prioriza o mapping com modifier sobre `3` simples. |
| Werewolves — Bite | `Alt+V` | Compartilha intencionalmente com Vampirism Suck Blood; vampire e werewolf são tratados como estados mutuamente exclusivos no design do pack. |
| Werewolves — Leap | sem tecla | Mantido sem tecla porque `Left Ctrl` é Sneak e não foi encontrada alternativa P1 ergonômica e segura. |
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

## Shoulder Surfing

Shoulder Surfing Reloaded `1.20.1-5.0.11` usa o binding vanilla de perspectiva como parte do ciclo da câmera. O pack volta a distribuir `F5` em `key.togglePerspective` e deixa o binding alternativo `toggle_first_person` sem tecla, que é o default upstream.

`Swap Shoulder` foi restaurado em `U`, também default upstream. O `U` do JEI é `Show Uses` e atua em interface/recipe lookup, enquanto a troca de ombro atua na câmera em gameplay; o compartilhamento é tratado como contextual.

`Free Look` permanece sem tecla no pack apesar do default upstream `Left Alt`, porque `Left Alt` é o modificador de seleção da barra de magias do Iron's Spellbooks. Os demais toggles/entradas diretas de perspectiva continuam sem tecla conforme upstream ou por baixa prioridade.

## ParCool

Na linha 1.20.1 auditada, ParCool registra `Ctrl+P` para Enable/Disable, `Alt+P` para abrir configurações, `C` para Crawl e Hide In Block, `R` para Breakfall/Dodge/Horizontal Wall Run e `Left Ctrl` para Fast Run.

O pack aplica:

- `Ctrl+P` — Enable/Disable ParCool, restaurado;
- `Alt+P` — abrir configurações, restaurado;
- `C` — Crawl e Hide In Block, compartilhamento upstream restaurado;
- `Left Shift` — Fast Run, mantido como adaptação do pack porque `Left Ctrl` é Sneak;
- Breakfall, Dodge e Horizontal Wall Run — sem tecla, porque restaurar `R` disputaria uma ação P1 com Combat Roll;
- Quick Turn e Flipping — sem tecla, seguindo o upstream;
- ações contextuais em `Mouse Right` e Wall Jump em `Space` — mantidas.

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
- `U`: Shoulder Surfing Swap Shoulder e JEI Show Uses. Câmera em gameplay versus consulta em GUI.
- `W`: movimento e Ponder. O Ponder usa contexto de interface/bloco.
- `A`: movimento e bookmark do JEI. O binding do JEI é usado em GUI.
- `C`: ParCool Crawl e Hide In Block. Compartilhamento definido pelo próprio upstream e dependente do estado da ação.
- `Space`: pulo, Wall Jump do ParCool e subida em voo do SWEM. São ações contextuais de movimento.
- `Left Shift`: sprint, Fast Run, detalhes do Jade, pesquisa do Relics, Equipment Compare e descida em voo do SWEM. A sobreposição é predominantemente contextual/modificadora.
- `Mouse Right`: uso vanilla e várias ações do ParCool. São intencionalmente sensíveis ao estado do movimento/ambiente.
- `,`: Create Tool Menu e Toolbelt. Upstream também compartilha uma única tecla entre as duas ações; os handlers dependem de contexto de schematic/toolbox, portanto o compartilhamento é intencional.
- `Alt+V`: Vampirism Suck Blood e Werewolves Bite. O compartilhamento é intencional no design do pack porque vampire e werewolf não devem coexistir no mesmo jogador; se alguma integração permitir esse estado híbrido, isso será tratado como defeito separado.

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

## Pendências antigas que não pertencem ao inventário atual

As referências do handoff a JourneyMap, Xaero, MineMenu e Sinytra não correspondem ao `modlist.txt` nem aos mappings distribuídos no estado atual do branch. Elas não serão recriadas apenas para eliminar pendências históricas. Se algum desses mods voltar à distribuição, deve entrar como uma nova auditoria de input.

## Mods instalados com defaults suprimidos

`key.keyboard.unknown` não significa necessariamente que a ação é opcional no mod original. A auditoria encontrou vários casos em que o Default Options do pack anulava ou ainda anula uma tecla que upstream fornece por padrão.

### Better Combat

Better Combat `1.9.0+1.20.1` registra `Feint` e `Toggle Mine With Weapons` com `InputConstants.UNKNOWN` por padrão. Os dois `unknown` atuais são, portanto, defaults upstream intencionais e permanecem sem tecla.

### Spartan Shields

Spartan Shields `3.1.1` registra `Alt Shield Bash` com código `-1`, isto é, sem tecla dedicada. Quando o mapping continua unbound, o próprio mod usa o botão de ataque como fallback para a ação/tooltip. O pack mantém esse `unknown` e não reserva uma tecla adicional.

### Vampirism

O mod instalado é Vampirism `1.10.16`. O repositório oficial não expõe uma tag `1.10.16`; a referência de código oficial mais próxima encontrada para Minecraft 1.20.1 é `v1.10.15-1.20.1`. Nessa linha, os defaults relevantes são:

| Ação | Upstream | Pack atual | Situação |
| --- | --- | --- | --- |
| Action menu | `R` | `Alt+R` | Letra upstream preservada sob modifier para não disputar `R` com Combat Roll/Small Ships. |
| Suck Blood | `V` | `Alt+V` | Letra upstream preservada sob modifier para não disputar `V` com Iron's Spellbooks cast. |
| Vampirism menu | `P` | `P` | Default upstream restaurado; não há outro binding físico `P` nos defaults distribuídos. |
| Vampire Vision | `N` | `Alt+N` | Letra upstream preservada sob modifier para não disputar `N` com Frost Walk do SWEM. |
| Action 1 | `Alt+1` | `Alt+1` | Default upstream restaurado. O mapping é `IN_GAME` e usa `KeyModifier.ALT`. |
| Action 2 | `Alt+2` | `Alt+2` | Default upstream restaurado. O mapping é `IN_GAME` e usa `KeyModifier.ALT`. |
| Action 3 | `Alt+3` | `Alt+3` | Default upstream restaurado. O mapping é `IN_GAME` e usa `KeyModifier.ALT`. |
| Actions 4–9 | sem tecla | sem tecla | Mantém o comportamento upstream. |
| Minion task | sem tecla | sem tecla | Mantém o comportamento upstream. |
| Select ammo | `C` | `Alt+C` | Letra upstream preservada sob modifier para não disputar `C` com Crawl do ParCool. |

Forge 47 agrupa `KeyMapping`s por modifier e tecla física. Quando um modifier ativo possui um mapping correspondente, esse grupo é consultado antes do mapping `NONE` da mesma tecla. Por isso, os atalhos `Alt+R/V/N/C` e `Alt+1/2/3` são estruturalmente diferentes dos bindings simples das mesmas teclas. Essa conclusão ainda precisa de confirmação prática no cliente do pack.

### Werewolves

Upstream registra `Leap` em `Left Ctrl` e `Bite` em `V`, ambos com contexto `IN_GAME`.

`Leap` só executa quando `Jump` também está pressionado, o jogador é werewolf, está transformado e a ação não está em cooldown. `Bite` usa `consumeClick()` e só executa para um werewolf mirando uma entidade válida para mordida.

No pack, `Bite` foi definido como `Alt+V`, compartilhando intencionalmente o mesmo chord de Vampirism Suck Blood. A decisão assume o modelo de gameplay do pack em que vampire e werewolf são estados mutuamente exclusivos; se alguma integração permitir os dois simultaneamente, isso deve ser corrigido como problema de compatibilidade/facção, não por sacrificar ergonomia dos keybinds.

`Leap` permanece sem tecla. O default upstream `Left Ctrl` conflita com Sneak, `Space` simples seria inadequado porque a ação depende de Jump estar pressionado, e não foi identificada uma alternativa P1 central que seja simultaneamente ergonômica e livre de conflito.

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
- Better Combat `Feint`/`Toggle Mine With Weapons` confirmados como unbound upstream;
- Spartan Shields `Alt Shield Bash` confirmado como unbound upstream com fallback no Attack;
- Shoulder Surfing `F5` vanilla e `U` Swap Shoulder restaurados; Free Look mantido sem tecla por conflito com Iron's Spellbooks;
- ParCool `Ctrl+P`, `Alt+P` e `C` compartilhado restaurados; ações em `R` mantidas unbound por conflito com Combat Roll;
- pendências históricas de JourneyMap, Xaero, MineMenu e Sinytra descartadas por ausência no inventário atual;
- input customizado de `awakening-compat` revisado;
- `P` restaurado para o menu do Vampirism, `B` restaurado para Soul Elytra Boost e `M` definido como alternativa do pack para Alex's Caves Special Ability;
- Create Tool Menu/Toolbelt movidos juntos para `,` e Sculk Transmitter movido para `.`;
- Vampirism Action 1–3 restaurados em `Alt+1/2/3` após verificação da semântica de modifiers do Forge 47;
- Vampirism Action Menu, Suck Blood, Vampire Vision e Select Ammo definidos em `Alt+R`, `Alt+V`, `Alt+N` e `Alt+C`;
- Werewolves Bite definido em `Alt+V` como compartilhamento intencional com Vampirism Suck Blood;
- Werewolves Leap mantido sem tecla por ausência de alternativa P1 ergonômica e segura.

Ainda requer validação dentro do cliente Minecraft:

1. instalação limpa, confirmando que os novos defaults são aplicados;
2. perfil já existente com teclas personalizadas, confirmando que o Default Options não as sobrescreve;
3. `F5` com Shoulder Surfing e `U` compartilhado com JEI Show Uses;
4. ParCool `Ctrl+P`, `Alt+P`, Crawl/Hide In Block em `C` e Fast Run em `Left Shift`;
5. Origins `G/H` montado em cavalo SWEM, confirmando ausência de acionamento duplo após o remapeamento;
6. Iron's Spellbooks + Relics, confirmando seleção independente por scroll;
7. SWEM Frost Walk em `N` e saddlebag/bedroll em `I`;
8. controles com layout de teclado usado pelo público-alvo, especialmente `[`, `]`, `,` e `.`;
9. Vampirism em `P`, `Alt+R/V/N/C` e `Alt+1/2/3`, Werewolves Bite em `Alt+V`, Deeper and Darker Soul Elytra Boost em `B`, Sculk Transmitter em `.`, Alex's Caves Special Ability em `M` e Create Tool Menu/Toolbelt em `,`;
10. confirmar que os chords `Alt+...` não disparam simultaneamente os bindings simples correspondentes no cliente real;
11. confirmar que `Alt+V` não produz efeito duplo fora do estado de facção esperado;
12. Werewolves Leap continuará sem tecla até surgir alternativa melhor ou necessidade prática comprovada.
