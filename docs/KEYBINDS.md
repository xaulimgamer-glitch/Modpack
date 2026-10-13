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

Essas duplicidades devem ser reavaliadas apenas se um teste de gameplay demonstrar acionamento simultâneo indesejado.

## Bindings órfãos removidos

Foram removidas do arquivo de defaults entradas pertencentes a mods que não constam no inventário atual do modpack:

- `key.dragon_fireAttack`
- `key.dragon_strike`
- `key.dragon_down`
- `key.dragon_change_view`
- `key.astikorcartsredux.action`
- `key.astikorcartsredux.slow`

As quatro entradas `dragon_*` pertencem ao Ice and Fire. O AstikorCarts Redux também não está presente no inventário versionado atual.

Se qualquer um desses mods voltar ao modpack, seus bindings devem ser auditados novamente antes de serem reintroduzidos no arquivo do Default Options.

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
- input customizado de `awakening-compat` revisado.

Ainda requer validação dentro do cliente Minecraft:

1. instalação limpa, confirmando que os novos defaults são aplicados;
2. perfil já existente com teclas personalizadas, confirmando que o Default Options não as sobrescreve;
3. Origins `G/H` montado em cavalo SWEM, confirmando ausência de acionamento duplo após o remapeamento;
4. Iron's Spellbooks + Relics, confirmando seleção independente por scroll;
5. SWEM Frost Walk em `N` e saddlebag/bedroll em `I`;
6. controles com layout de teclado usado pelo público-alvo, especialmente `[` e `]`.
