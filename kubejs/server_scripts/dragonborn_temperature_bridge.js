// Dragonborn / Cold Sweat temperature bridge
// Reads Cold Sweat BODY temperature and tracks cold / neutral / hot with hysteresis.
//
// Public thermal interface:
//   rpgraces_db_temp
//
// State encoding:
//   -1 = COLD
//    0 = NEUTRAL
//    1 = HOT
//
// HOT/COLD entity tags remain temporarily only for migration diagnostics.

(() => {
  const SAMPLE_INTERVAL_TICKS = 20

  // --------------------------------------------------
  // Thermal thresholds
  // --------------------------------------------------

  const HOT_ENTER = 30.0
  const HOT_EXIT = 20.0

  const COLD_ENTER = -30.0
  const COLD_EXIT = -20.0

  // --------------------------------------------------
  // Dragonborn lineage tags
  // --------------------------------------------------

  const FIRE_TAG = 'rpgraces_dragonborn_fire'
  const ICE_TAG = 'rpgraces_dragonborn_ice'

  // --------------------------------------------------
  // Temporary thermal tags
  // Diagnostic only — remove after scoreboard PASS
  // --------------------------------------------------

  const HOT_STATE_TAG =
    'rpgraces_dragonborn_temp_hot'

  const COLD_STATE_TAG =
    'rpgraces_dragonborn_temp_cold'

  // --------------------------------------------------
  // Public thermal scoreboard
  // --------------------------------------------------

  const SCORE_OBJECTIVE =
    'rpgraces_db_temp'

  const SCORE_COLD = -1
  const SCORE_NEUTRAL = 0
  const SCORE_HOT = 1

  // --------------------------------------------------
  // Internal KubeJS persistent state
  // --------------------------------------------------

  const STATE_KEY =
    'rpgraces_dragonborn_temperature_state'

  const BODY_TEMP_KEY =
    'rpgraces_dragonborn_body_temperature'

  const TICK_KEY =
    'rpgraces_dragonborn_temperature_tick'

  // Runtime-only flag.
  // /kubejs reload resets this variable.
  // The actual scoreboard objective persists in the world.
  let objectiveReady = false

  // --------------------------------------------------
  // Cold Sweat API
  // --------------------------------------------------

  const $Temperature = Java.loadClass(
    'com.momosoftworks.coldsweat.api.util.Temperature'
  )

  const $TemperatureTrait = Java.loadClass(
    'com.momosoftworks.coldsweat.api.util.Temperature$Trait'
  )

  // --------------------------------------------------
  // Thermal state resolver with hysteresis
  // --------------------------------------------------

  function resolveState(previous, bodyTemperature) {
    // Already HOT
    if (previous === 'hot') {
      // Direct extreme transition to COLD
      if (bodyTemperature <= COLD_ENTER) {
        return 'cold'
      }

      // Exit HOT only when <= +20
      if (bodyTemperature <= HOT_EXIT) {
        return 'neutral'
      }

      return 'hot'
    }

    // Already COLD
    if (previous === 'cold') {
      // Direct extreme transition to HOT
      if (bodyTemperature >= HOT_ENTER) {
        return 'hot'
      }

      // Exit COLD only when >= -20
      if (bodyTemperature >= COLD_EXIT) {
        return 'neutral'
      }

      return 'cold'
    }

    // Currently NEUTRAL
    if (bodyTemperature >= HOT_ENTER) {
      return 'hot'
    }

    if (bodyTemperature <= COLD_ENTER) {
      return 'cold'
    }

    return 'neutral'
  }

  // --------------------------------------------------
  // Convert thermal state to scoreboard integer
  // --------------------------------------------------

  function stateToScore(state) {
    if (state === 'hot') {
      return SCORE_HOT
    }

    if (state === 'cold') {
      return SCORE_COLD
    }

    return SCORE_NEUTRAL
  }

  // --------------------------------------------------
  // Temporary diagnostic tags
  // --------------------------------------------------

  function clearStateTags(player) {
    player.removeTag(HOT_STATE_TAG)
    player.removeTag(COLD_STATE_TAG)
  }

  function syncStateTags(player, state) {
    clearStateTags(player)

    if (state === 'hot') {
      player.addTag(HOT_STATE_TAG)
    } else if (state === 'cold') {
      player.addTag(COLD_STATE_TAG)
    }

    // neutral = neither tag
  }

  // --------------------------------------------------
  // Scoreboard command adapter
  // --------------------------------------------------

  function ensureThermalObjective(server) {
    if (objectiveReady) {
      return
    }

    /*
     * If the objective does not exist:
     *   -> it is created.
     *
     * If it already exists:
     *   -> the command fails silently.
     *
     * Both cases are fine.
     */
    server.runCommandSilent(
      `scoreboard objectives add ${SCORE_OBJECTIVE} dummy`
    )

    objectiveReady = true
  }

  function setThermalScore(server, player, value) {
    ensureThermalObjective(server)

    const playerName =
      player.name.getString()

    server.runCommandSilent(
      `scoreboard players set ${playerName} ${SCORE_OBJECTIVE} ${value}`
    )
  }

  // --------------------------------------------------
  // Full server/world load
  // --------------------------------------------------

  ServerEvents.loaded(event => {
    ensureThermalObjective(
      event.server
    )
  })

  // --------------------------------------------------
  // Main player thermal bridge
  // --------------------------------------------------

  PlayerEvents.tick(event => {
    const player =
      event.player

    const tags =
      player.getTags()

    const isFireDragonborn =
      tags.contains(FIRE_TAG)

    const isIceDragonborn =
      tags.contains(ICE_TAG)

    const data =
      player.getPersistentData()

    // ------------------------------------------------
    // Nonthermal lineage cleanup
    // ------------------------------------------------

    if (
      !isFireDragonborn &&
      !isIceDragonborn
    ) {
      const hadThermalState =
        data.contains(STATE_KEY) ||
        data.contains(BODY_TEMP_KEY) ||
        data.contains(TICK_KEY)

      /*
       * Only reset the public state if this player
       * had previously been managed by the thermal bridge.
       */
      if (hadThermalState) {
        setThermalScore(
          event.server,
          player,
          SCORE_NEUTRAL
        )
      }

      // Temporary diagnostic tag cleanup.
      clearStateTags(player)

      if (data.contains(STATE_KEY)) {
        data.remove(STATE_KEY)
      }

      if (data.contains(BODY_TEMP_KEY)) {
        data.remove(BODY_TEMP_KEY)
      }

      if (data.contains(TICK_KEY)) {
        data.remove(TICK_KEY)
      }

      return
    }

    // ------------------------------------------------
    // Fire/Ice Dragonborn:
    // guarantee objective exists immediately
    // ------------------------------------------------

    ensureThermalObjective(
      event.server
    )

    // ------------------------------------------------
    // BODY sampling timer
    // ------------------------------------------------

    const temperatureTick =
      data.getInt(TICK_KEY) + 1

    if (
      temperatureTick <
      SAMPLE_INTERVAL_TICKS
    ) {
      data.putInt(
        TICK_KEY,
        temperatureTick
      )

      return
    }

    data.putInt(
      TICK_KEY,
      0
    )

    // ------------------------------------------------
    // Cold Sweat temperature read
    // ------------------------------------------------

    try {
      const bodyTemperature =
        Number(
          $Temperature.get(
            player,
            $TemperatureTrait.BODY
          )
        )

      const previous =
        data.contains(STATE_KEY)
          ? data.getString(STATE_KEY)
          : 'neutral'

      const next =
        resolveState(
          previous,
          bodyTemperature
        )

      // ----------------------------------------------
      // Internal bridge state
      // ----------------------------------------------

      data.putDouble(
        BODY_TEMP_KEY,
        bodyTemperature
      )

      data.putString(
        STATE_KEY,
        next
      )

      // ----------------------------------------------
      // PUBLIC THERMAL INTERFACE
      // ----------------------------------------------

      setThermalScore(
        event.server,
        player,
        stateToScore(next)
      )

      // ----------------------------------------------
      // TEMPORARY DIAGNOSTIC TAGS
      // ----------------------------------------------

      syncStateTags(
        player,
        next
      )

      // ----------------------------------------------
      // Transition log
      // ----------------------------------------------

      if (next !== previous) {
        const lineage =
          isFireDragonborn
            ? 'Fire'
            : 'Ice'

        console.info(
          `[RPG Races/Dragonborn] ${player.name.getString()} (${lineage}) BODY=${bodyTemperature.toFixed(2)}: ${previous} -> ${next}`
        )
      }
    } catch (error) {
      console.error(
        `[RPG Races/Dragonborn] Cold Sweat temperature bridge failed for ${player.name.getString()}: ${error}`
      )
    }
  })
})()