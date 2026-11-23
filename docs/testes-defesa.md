# Testes de defesa

## Resultados informados em 23/11/2026

| Caso | Resultado antes do patch desta rodada |
| --- | --- |
| Botao direito com espada e escudo | Bug: bloqueio e parry de espada simultaneos, com conflito de animacoes |
| Parry sem escudo | Funcionando |
| Rolamento | Funcionando, sem invulnerabilidade |
| Bloqueio com escudo | Funcionando |
| Ataque com escudo | Funcionando |

## Correcao aplicada

O callback de tecla do Block Parry Dodge chama `ParryKeyMessage.pressAction`
localmente e envia a mesma acao ao servidor. O mixin existente ja intercepta
esse ponto antes da ativacao, mas a politica verificava apenas escudo em uso
ou a janela ativa do Shield Overhaul. Antes de o uso vanilla comecar, essa
checagem podia permitir a ativacao do parry da espada.

`ParryEligibility.canParry` agora nega parry de arma quando qualquer mao
segura um item com a acao Forge `SHIELD_BLOCK`. A verificacao ocorre antes
das demais condicoes e usa a politica compartilhada por ativacao e resolucao
do parry. Nenhum input de bloqueio ou ataque do escudo foi cancelado.

Regra escolhida: o escudo equipado tem prioridade, inclusive enquanto estiver
em cooldown. Para usar parry de espada, retirar o escudo das maos.

Nao foram alteradas teclas, a janela do parry, classes elegiveis, ataque do
escudo, configuracoes do Combat Roll ou invulnerabilidade.

## Revalidacao necessaria apos reiniciar o jogo

1. Espada + escudo, botao direito repetido e mantido: apenas defesa de escudo,
   sem animacao ou ativacao de parry da espada.
2. Repetir com escudo modificado e com escudo em cooldown: parry da espada
   continua bloqueado enquanto o escudo estiver equipado.
3. Retirar o escudo: parry de espada continua funcionando.
4. Repetir ataque com escudo e rolamento para confirmar ausencia de regressao.

Os cinco resultados da primeira tabela sao observacoes do usuario anteriores
ao patch. Nao sao uma confirmacao de gameplay da correcao nova.
