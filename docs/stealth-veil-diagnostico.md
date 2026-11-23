# Shadow Veil e Forest Veil: diagnostico

Estado: causa ainda nao reproduzida no jogo. Nenhuma condicao, valor de atributo
ou poder racial foi alterado nesta investigacao.

## Revisao do commit a52d766843c628e38fcee7bf4902740425193198

O commit moveu a invisibilidade para um filho de `origins:multiple` e adicionou
um filho `origins:conditioned_attribute` nos dois veus. As condicoes da
invisibilidade e `render_armor` continuam iguais ao estado anterior ao commit.
Isso identifica a mudanca estrutural, mas nao demonstra uma falha do wrapper.

Conferido no bytecode do Apoli 2.9.0.8 extraido do Origins instalado:

- `MultiplePower.lambda$new$1` transforma a chave `camouflage` em `_camouflage`.
- `PowerLoader.create` e `MultiplePower.complete` concatenam o caminho do pai
  com essa chave; o namespace e preservado. Exemplo:
  `rpgraces:elf/drow/shadow_veil_camouflage`.
- Metadados (`type`, `name`, `description`, `hidden`, `loading_priority`,
  `condition`, `conditions`, condicoes de carregamento), campos adicionais
  registrados e chaves iniciadas em `$` nao sao tratados como filhos.
- `MultipleMapCodec` acumula erros de decodificacao e fornece o mapa dos filhos
  que puderam ser lidos como resultado parcial. `PowerLoader` usa
  `resultOrPartial` e emite `will only be partially loaded` quando o parcial
  existe; descarta o poder quando nao ha resultado recuperavel. Portanto, um
  filho invalido nao derruba automaticamente o irmao valido. Erros fatais,
  excecoes e falhas posteriores de registro/validacao continuam sendo casos distintos.
- `ConditionedAttributeConfiguration` aceita `tick_rate` (padrao 20) e
  `AttributeConfiguration.MAP_CODEC`, que aceita `modifier` ou `modifiers`.
  O modificador aceita `attribute`, `operation`, `value` e `name`.
  O uso atual dos dois veus corresponde a esse esquema.
- `ConditionedAttributePower.tick` adiciona os modificadores quando o filho
  esta ativo e os remove quando esta inativo; a aplicacao ocorre no servidor.

Teste executado: `tools/VerifyApoliMultiple.java` usa o `MultipleMapCodec`
real do artefato Apoli Forge 2.9.0.8 remapeado do cache, com um codec filho
inteiro independente de registros. Confirmou dois filhos validos, erro em
um filho preservando o outro e mapa parcial vazio quando todos falham.
Isso testa o container, nao a resolucao do atributo Stealth no servidor.

Nao foi confirmada uma falha do `multiple` nem do esquema do filho. Por isso,
nao foi aplicado o split dos poderes como se fosse uma correcao comprovada.

## Exclusivos do Drow

`NightVisionPower` le um float chamado `strength` (padrao 1.0) e retorna esse
valor. `INightVisionPower.getNightVisionStrength` filtra poderes ativos e usa
a maior intensidade. O mixin vanilla da lightmap usa o maior valor entre o
efeito calculado e a visao noturna de poderes. O `superior.json` atual usa
`strength: 0.60` e `brightness <= 0.61904764`: esquema valido. Isso nao garante
que um pipeline de shaders externo reproduza a mesma aparencia.

`sun_sensitivity.json` gera exatamente
`rpgraces:elf/drow/sun_sensitivity_dark_adaptation`. Esse e o ID referenciado
pelas acoes e pelo Java do overlay, inclusive na classe do JAR instalado.
Nao foi encontrada evidencia de erro de nome que justifique altera-lo.

## Validacao e patch desta revisao

- `VerifyVeilPowers.java`: 149 JSONs validos, 145 referencias locais de origens
  resolvidas, ausencia de colisoes entre IDs de arquivos e filhos gerados,
  condicoes dos veus equivalentes ao estado anterior ao commit e ID do overlay consistente.
- O diagnostico agora inclui os pais dos veus, Superior Darkvision,
  Sun Sensitivity e o recurso de adaptacao, com valor quando disponivel.
- Comando recompilado para Java 17 e remapeado para os nomes SRG de execucao.
- Corrigido o empacotamento do JAR de diagnostico anterior: a atualizacao via
  ZIP do .NET produzia entradas rejeitadas pelo leitor Java. O JAR foi recriado
  a partir do backup valido com a ferramenta `jar` do JDK.
- `VerifyCompatJar.java` verifica leitura pelo Java, CRCs e preservacao de todos
  os arquivos do backup; somente a classe de diagnostico e acrescentada.
  O ajuste anterior do Jupiter e o overlay permanecem preservados.
- A inicializacao do jogo, o registro real dos poderes/atributos e o efeito
  visual ainda precisam de teste no cliente/servidor. Nao confundir esses
  testes estaticos e de codec com uma reproducao de gameplay.

## Conferencia do codigo instalado

- Origins Forge 1.10.0.9 inclui Apoli Forge 2.9.0.8.
- `brightness` usa `Entity.getLightLevelDependentMagicValue()`. No Minecraft
  1.20.1, essa consulta usa a posicao dos olhos e a luminosidade do mundo.
- A luminosidade vanilla equivale a `lerp(ambientLight, f / (4 - 3*f), 1)`,
  com `f = maxLocalRawBrightness / 15`. A luz ambiente da dimensao e o
  escurecimento do ceu fazem parte da avaliacao. Nao substituir por `light_level <= 6`.
- Os dois subpoderes do Shadow Veil exigem agachar e `brightness <= 0.15`.
- O camouflage usa `conditioned_attribute`, adicao de 1.0, a cada tick.
- O Forest Veil depende de vegetacao na tag `rpgraces:wood_elf_cover`, nao de escuridao.
- A nota de correcao de brightness com poderes de shader do Apoli Fabric 2.9.1
  nao comprova um defeito na implementacao Forge instalada:
  https://github.com/apace100/apoli/releases/tag/2.9.1%2Bmc.1.20.1

## Diagnostico no servidor

Reiniciar o cliente/servidor depois de atualizar o Awakening Compat. Com permissao
de operador (nivel 2), executar:

```mcfunction
/awakening_stealth_debug
```

Opcionalmente, `/awakening_stealth_debug <jogador>` permite consultar outro jogador
ou executar pelo console. O comando somente consulta; nao muda atributos nem poderes.
Mostra luminosidade consultada pela entidade e pelo mundo, posicao dos olhos,
luz ambiente, agachamento, presenca/ativacao dos quatro subpoderes e valores base,
totais e modificadores de camouflage e muffling.

Executar como Drow, sem equipamentos ou outros efeitos que modifiquem camouflage,
esperando pelo menos um tick de servidor apos cada mudanca:

| Situacao | Subpoderes do Drow ativos | Camouflage esperado |
| --- | --- | --- |
| Agachado, brightness <= 0.15 | Ambos | 1.0 |
| Em pe, brightness <= 0.15 | Nenhum | 0.0 |
| Agachado, brightness > 0.15 | Nenhum | 0.0 |
| Voltar a agachar no escuro | Ambos | 1.0, sem acumular modificadores |

Repetir em Overworld, Nether e End usando o brightness mostrado, nao a aparencia
da tela: visao noturna e shaders nao sao uma medida da luminosidade mecanica.
Verificar o Wood Elf perto e longe da vegetacao configurada; sua logica permanece intacta.

O comando vanilla continua sendo a verificacao independente do valor final:

```mcfunction
/attribute @s stealth:camouflage get
```

## Como localizar a falha

- `missing` no subpoder esperado: investigar carregamento/grant da raca e erros do datapack.
- Agachado, brightness <= 0.15 e subpoder inativo: investigar a avaliacao das condicoes.
- Subpoder de camouflage ativo, sem modificador apos o tick: investigar `conditioned_attribute`.
- Modificador presente, total diferente: verificar valor base e outros modificadores.
- Total 1.0 e deteccao persistente: separar visao de ruido e perseguicao ja iniciada.
  Repetir com um mob que ainda nao tenha adquirido o jogador como alvo.

Compilacao e remapeamento do comando podem ser verificados fora do jogo;
ativacao real e deteccao dos mobs precisam de observacoes em execucao.
