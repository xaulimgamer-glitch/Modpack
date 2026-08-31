// RPG Races — Dragonborn Thermal State Bridge
// v1.1
//
// Minecraft 1.20.1
// Forge
// KubeJS 2001.6.5
// Cold Sweat 2.4.2
//
// Cold Sweat BODY
//      ↓
// HOT / NEUTRAL / COLD
//      ↓
// AFFINITY / STRAIN
//
// Este script NÃO aplica buffs.
// Origins continuará responsável pelos efeitos.

// ============================================================
// CONFIG
// ============================================================

const RPG_THERMAL = {

  sampleIntervalTicks: 20,

  hotEnter: 30,
  hotExit: 20,

  coldEnter: -30,
  coldExit: -20,

  logTransitions: true,
  logErrors: true,

  lineage: {
    fire: 'rpgraces_dragonborn_fire',
    ice: 'rpgraces_dragonborn_ice'
  },

  state: {
    hot: 'rpgraces_thermal_hot',
    neutral: 'rpgraces_thermal_neutral',
    cold: 'rpgraces_thermal_cold'
  },

  relation: {
    affinity: 'rpgraces_thermal_affinity',
    strain: 'rpgraces_thermal_strain'
  }
}


const RPG_THERMAL_MANAGED_TAGS = [

  RPG_THERMAL.state.hot,
  RPG_THERMAL.state.neutral,
  RPG_THERMAL.state.cold,

  RPG_THERMAL.relation.affinity,
  RPG_THERMAL.relation.strain

]


var RPG_THERMAL_SERVER_TICKS = 0

var RPG_THERMAL_API_ERROR_REPORTED = false

var $IOriginContainer = Java.loadClass(
  'io.github.edwinmindcraft.origins.api.capabilities.IOriginContainer'
)

var RPG_ORIGINS_API_ERROR_REPORTED = false


console.info(
  '[RPG Races/Thermal] Dragonborn Thermal Bridge v1.1 loaded'
)


// ============================================================
// TAG HELPERS
// ============================================================

function rpgThermalHasTag(player, tag) {

  return player
    .getTags()
    .contains(tag)

}


function rpgThermalSetTag(player, tag, enabled) {

  var currentlyHas =
    rpgThermalHasTag(player, tag)

  if (enabled && !currentlyHas) {

    player.addTag(tag)

  }
  else if (!enabled && currentlyHas) {

    player.removeTag(tag)

  }

}


function rpgThermalClearManagedTags(player) {

  for (
    var i = 0;
    i < RPG_THERMAL_MANAGED_TAGS.length;
    i++
  ) {

    rpgThermalSetTag(
      player,
      RPG_THERMAL_MANAGED_TAGS[i],
      false
    )

  }

}


function rpgThermalHasManagedTags(player) {

  for (
    var i = 0;
    i < RPG_THERMAL_MANAGED_TAGS.length;
    i++
  ) {

    if (
      rpgThermalHasTag(
        player,
        RPG_THERMAL_MANAGED_TAGS[i]
      )
    ) {

      return true

    }

  }

  return false

}


// ============================================================
// LINEAGE
// ============================================================

function rpgThermalGetLineage(player) {

  try {

    var optional =
      $IOriginContainer
        .get(player)
        .resolve()


    if (!optional.isPresent()) {

      return 'none'

    }


    var container =
      optional.get()


    var origins =
      container.getOrigins()


    var iterator =
      origins
        .entrySet()
        .iterator()


    while (iterator.hasNext()) {

      var entry =
        iterator.next()


      var layerId =
        entry
          .getKey()
          .location()
          .toString()


      // Só nos interessa nossa layer de linhagem.
      if (layerId !== 'rpgraces:lineage') {

        continue

      }


      var originId =
        entry
          .getValue()
          .location()
          .toString()


      if (
        originId ===
        'rpgraces:lineage/dragonborn/fire'
      ) {

        RPG_ORIGINS_API_ERROR_REPORTED = false

        return 'fire'

      }


      if (
        originId ===
        'rpgraces:lineage/dragonborn/ice'
      ) {

        RPG_ORIGINS_API_ERROR_REPORTED = false

        return 'ice'

      }


      // Existe uma linhagem, mas não é Fire/Ice.
      RPG_ORIGINS_API_ERROR_REPORTED = false

      return 'none'

    }


    RPG_ORIGINS_API_ERROR_REPORTED = false

    return 'none'

  }
  catch (error) {

    if (
      RPG_THERMAL.logErrors &&
      !RPG_ORIGINS_API_ERROR_REPORTED
    ) {

      RPG_ORIGINS_API_ERROR_REPORTED = true

      console.error(
        '[RPG Races/Thermal] ' +
        'Failed to read Origins lineage: ' +
        error
      )

    }


    return 'error'

  }

}

function rpgThermalSyncLineageCache(
  player,
  lineage
) {

  rpgThermalSetTag(
    player,
    RPG_THERMAL.lineage.fire,
    lineage === 'fire'
  )


  rpgThermalSetTag(
    player,
    RPG_THERMAL.lineage.ice,
    lineage === 'ice'
  )

}

// ============================================================
// CURRENT STATE
// ============================================================

function rpgThermalGetCurrentState(player) {

  var hot =
    rpgThermalHasTag(
      player,
      RPG_THERMAL.state.hot
    )

  var neutral =
    rpgThermalHasTag(
      player,
      RPG_THERMAL.state.neutral
    )

  var cold =
    rpgThermalHasTag(
      player,
      RPG_THERMAL.state.cold
    )


  var count =
    (hot ? 1 : 0) +
    (neutral ? 1 : 0) +
    (cold ? 1 : 0)


  // Nenhum estado ou vários estados simultâneos.
  if (count !== 1) {

    return 'unknown'

  }


  if (hot) {

    return 'hot'

  }


  if (cold) {

    return 'cold'

  }


  return 'neutral'

}


// ============================================================
// HYSTERESIS
// ============================================================

function rpgThermalClassify(body, currentState) {


  // ----------------------------------------------------------
  // CURRENT = HOT
  // ----------------------------------------------------------

  if (currentState === 'hot') {


    // Mudança extrema direta HOT -> COLD
    if (body <= RPG_THERMAL.coldEnter) {

      return 'cold'

    }


    // Sai de HOT somente em +20 ou menos.
    if (body <= RPG_THERMAL.hotExit) {

      return 'neutral'

    }


    return 'hot'

  }


  // ----------------------------------------------------------
  // CURRENT = COLD
  // ----------------------------------------------------------

  if (currentState === 'cold') {


    // Mudança extrema direta COLD -> HOT
    if (body >= RPG_THERMAL.hotEnter) {

      return 'hot'

    }


    // Sai de COLD somente em -20 ou mais.
    if (body >= RPG_THERMAL.coldExit) {

      return 'neutral'

    }


    return 'cold'

  }


  // ----------------------------------------------------------
  // CURRENT = NEUTRAL / UNKNOWN
  // ----------------------------------------------------------

  if (body >= RPG_THERMAL.hotEnter) {

    return 'hot'

  }


  if (body <= RPG_THERMAL.coldEnter) {

    return 'cold'

  }


  return 'neutral'

}


// ============================================================
// RACIAL RELATION
// ============================================================

function rpgThermalGetRelation(lineage, state) {


  if (state === 'neutral') {

    return 'neutral'

  }


  // Fire
  if (lineage === 'fire') {


    if (state === 'hot') {

      return 'affinity'

    }


    return 'strain'

  }


  // Ice
  if (lineage === 'ice') {


    if (state === 'cold') {

      return 'affinity'

    }


    return 'strain'

  }


  return 'neutral'

}


// ============================================================
// WRITE STATE
// ============================================================

function rpgThermalSyncTags(
  player,
  state,
  relation
) {


  // Physical state

  rpgThermalSetTag(
    player,
    RPG_THERMAL.state.hot,
    state === 'hot'
  )


  rpgThermalSetTag(
    player,
    RPG_THERMAL.state.neutral,
    state === 'neutral'
  )


  rpgThermalSetTag(
    player,
    RPG_THERMAL.state.cold,
    state === 'cold'
  )


  // Racial relation

  rpgThermalSetTag(
    player,
    RPG_THERMAL.relation.affinity,
    relation === 'affinity'
  )


  rpgThermalSetTag(
    player,
    RPG_THERMAL.relation.strain,
    relation === 'strain'
  )

}


// ============================================================
// COLD SWEAT
// ============================================================

function rpgThermalReadBody(player) {


  if (typeof coldsweat === 'undefined') {

    throw new Error(
      'Cold Sweat KubeJS binding "coldsweat" is unavailable'
    )

  }


  var body =
    Number(
      coldsweat.getTemperature(
        player,
        'body'
      )
    )


  if (!isFinite(body)) {

    throw new Error(
      'Invalid BODY temperature: ' +
      body
    )

  }


  return body

}


// ============================================================
// UPDATE PLAYER
// ============================================================

function rpgThermalUpdatePlayer(player) {


  var lineage =
    rpgThermalGetLineage(player)

    // Se não conseguimos ler Origins,
// falha de forma segura e não confia nas tags antigas.
if (lineage === 'error') {

  rpgThermalClearManagedTags(player)

  return

}


// As tags Fire/Ice agora são apenas cache.
// A Origin real é a fonte de verdade.
rpgThermalSyncLineageCache(
  player,
  lineage
)


  // ----------------------------------------------------------
  // NOT FIRE / ICE
  // ----------------------------------------------------------

  if (lineage === 'none') {


    if (
      rpgThermalHasManagedTags(player)
    ) {

      rpgThermalClearManagedTags(player)

    }


    return

  }


  // ----------------------------------------------------------
  // INVALID LINEAGE
  // ----------------------------------------------------------

  if (lineage === 'conflict') {


    // Fail closed.
    rpgThermalClearManagedTags(player)


    if (RPG_THERMAL.logErrors) {

      console.error(
        '[RPG Races/Thermal] ' +
        player.name.string +
        ' has both Fire and Ice lineage tags. ' +
        'Thermal state cleared.'
      )

    }


    return

  }


  // ----------------------------------------------------------
  // READ BODY
  // ----------------------------------------------------------

  var body


  try {


    body =
      rpgThermalReadBody(player)


    RPG_THERMAL_API_ERROR_REPORTED =
      false


  }
  catch (error) {


    // Nunca manter buff antigo se a API falhar.
    rpgThermalClearManagedTags(player)


    if (
      RPG_THERMAL.logErrors &&
      !RPG_THERMAL_API_ERROR_REPORTED
    ) {


      RPG_THERMAL_API_ERROR_REPORTED =
        true


      console.error(
        '[RPG Races/Thermal] ' +
        'BODY read failed: ' +
        error
      )

    }


    return

  }


  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  var oldState =
    rpgThermalGetCurrentState(player)


  var newState =
    rpgThermalClassify(
      body,
      oldState
    )


  var newRelation =
    rpgThermalGetRelation(
      lineage,
      newState
    )


  var oldAffinity =
    rpgThermalHasTag(
      player,
      RPG_THERMAL.relation.affinity
    )


  var oldStrain =
    rpgThermalHasTag(
      player,
      RPG_THERMAL.relation.strain
    )


  var stateChanged =
    oldState !== newState


  var relationChanged =

    (
      newRelation === 'affinity' &&
      !oldAffinity
    )

    ||

    (
      newRelation === 'strain' &&
      !oldStrain
    )

    ||

    (
      newRelation === 'neutral' &&
      (oldAffinity || oldStrain)
    )


  // ----------------------------------------------------------
  // SYNC
  // ----------------------------------------------------------

  if (
    stateChanged ||
    relationChanged ||
    oldState === 'unknown'
  ) {


    rpgThermalSyncTags(
      player,
      newState,
      newRelation
    )


    if (RPG_THERMAL.logTransitions) {


      console.info(
        '[RPG Races/Thermal] ' +
        player.name.string +
        ' lineage=' +
        lineage.toUpperCase() +
        ' BODY=' +
        body.toFixed(2) +
        ' state=' +
        newState.toUpperCase() +
        ' relation=' +
        newRelation.toUpperCase()
      )

    }

  }

}


// ============================================================
// SERVER SCHEDULER
// ============================================================

ServerEvents.tick(event => {


  RPG_THERMAL_SERVER_TICKS++


  // Executa uma vez a cada 20 server ticks.
  if (
    RPG_THERMAL_SERVER_TICKS %
    RPG_THERMAL.sampleIntervalTicks !==
    0
  ) {

    return

  }


  var players =
    event.server.players


  players.forEach(player => {

    rpgThermalUpdatePlayer(player)

  })

})