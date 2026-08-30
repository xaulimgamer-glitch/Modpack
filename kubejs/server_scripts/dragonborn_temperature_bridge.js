// Dragonborn / Cold Sweat temperature bridge prototype
// Reads Cold Sweat BODY temperature and tracks cold / neutral / hot with hysteresis.
// Prototype only: no buffs, debuffs, resistances, or breath effects are applied here.

(() => {
  const SAMPLE_INTERVAL_TICKS = 20
  const HOT_ENTER = 30.0
  const HOT_EXIT = 20.0
  const COLD_ENTER = -30.0
  const COLD_EXIT = -20.0

  const FIRE_TAG = 'rpgraces_dragonborn_fire'
  const ICE_TAG = 'rpgraces_dragonborn_ice'

  const STATE_KEY = 'rpgraces_dragonborn_temperature_state'
  const BODY_TEMP_KEY = 'rpgraces_dragonborn_body_temperature'

  const $Temperature = Java.loadClass(
    'com.momosoftworks.coldsweat.api.util.Temperature'
  )
  const $TemperatureTrait = Java.loadClass(
    'com.momosoftworks.coldsweat.api.util.Temperature$Trait'
  )

  function resolveState(previous, bodyTemperature) {
    if (previous === 'hot') {
      if (bodyTemperature <= COLD_ENTER) return 'cold'
      if (bodyTemperature <= HOT_EXIT) return 'neutral'
      return 'hot'
    }

    if (previous === 'cold') {
      if (bodyTemperature >= HOT_ENTER) return 'hot'
      if (bodyTemperature >= COLD_EXIT) return 'neutral'
      return 'cold'
    }

    if (bodyTemperature >= HOT_ENTER) return 'hot'
    if (bodyTemperature <= COLD_ENTER) return 'cold'
    return 'neutral'
  }

  PlayerEvents.tick(event => {
    const player = event.player

    if (player.tickCount % SAMPLE_INTERVAL_TICKS !== 0) return

    const tags = player.getTags()
    const isFireDragonborn = tags.contains(FIRE_TAG)
    const isIceDragonborn = tags.contains(ICE_TAG)
    const data = player.getPersistentData()

    if (!isFireDragonborn && !isIceDragonborn) {
      if (data.contains(STATE_KEY)) data.remove(STATE_KEY)
      if (data.contains(BODY_TEMP_KEY)) data.remove(BODY_TEMP_KEY)
      return
    }

    try {
      const bodyTemperature = Number(
        $Temperature.get(player, $TemperatureTrait.BODY)
      )

      const previous = data.contains(STATE_KEY)
        ? data.getString(STATE_KEY)
        : 'neutral'
      const next = resolveState(previous, bodyTemperature)

      data.putDouble(BODY_TEMP_KEY, bodyTemperature)
      data.putString(STATE_KEY, next)

      if (next !== previous) {
        const lineage = isFireDragonborn ? 'Fire' : 'Ice'
        console.info(
          `[RPG Races/Dragonborn] ${player.name.string} (${lineage}) BODY=${bodyTemperature.toFixed(2)}: ${previous} -> ${next}`
        )
      }
    } catch (error) {
      console.error(
        `[RPG Races/Dragonborn] Cold Sweat temperature bridge failed for ${player.name.string}: ${error}`
      )
    }
  })
})()
