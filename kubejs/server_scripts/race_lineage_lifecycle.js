// RPG Races — race/lineage lifecycle reconciler
//
// Source of truth:
//   rpgraces:races   -> parent layer
//   rpgraces:lineage -> dependent layer
//   rpgclasses:class -> independent; this script never mutates it
//
// The Origins 1.10.0.9 Forge container does not invalidate an origin already
// stored in one layer when another layer changes. This reconciler validates
// the stored lineage against the conditions defined by rpgraces:lineage and
// clears only incompatible lineage state.

const RPG_LINEAGE_LIFECYCLE = {
  sampleIntervalTicks: 10,
  lineageLayer: 'rpgraces:lineage',
  emptyOrigin: 'origins:empty',
  logRepairs: true,
  logErrors: true
}

var RPG_LINEAGE_LIFECYCLE_TICKS = 0
var RPG_LINEAGE_LIFECYCLE_ERROR_REPORTED = false

var $RpgIOriginContainer = Java.loadClass(
  'io.github.edwinmindcraft.origins.api.capabilities.IOriginContainer'
)

var $RpgOriginsAPI = Java.loadClass(
  'io.github.edwinmindcraft.origins.api.OriginsAPI'
)

var $RpgOriginRegisters = Java.loadClass(
  'io.github.edwinmindcraft.origins.common.registry.OriginRegisters'
)

var $RpgResourceLocation = Java.loadClass(
  'net.minecraft.resources.ResourceLocation'
)

var RPG_LINEAGE_LAYER_ID = new $RpgResourceLocation(
  RPG_LINEAGE_LIFECYCLE.lineageLayer
)

function rpgLineageLifecycleReconcile(player) {
  try {
    var optional = $RpgIOriginContainer
      .get(player)
      .resolve()

    if (!optional.isPresent()) {
      return false
    }

    var container = optional.get()
    var iterator = container
      .getOrigins()
      .entrySet()
      .iterator()

    while (iterator.hasNext()) {
      var entry = iterator.next()
      var layerId = entry
        .getKey()
        .location()
        .toString()

      if (layerId !== RPG_LINEAGE_LIFECYCLE.lineageLayer) {
        continue
      }

      var lineageKey = entry.getValue()
      var lineageId = lineageKey
        .location()
        .toString()

      if (lineageId === RPG_LINEAGE_LIFECYCLE.emptyOrigin) {
        RPG_LINEAGE_LIFECYCLE_ERROR_REPORTED = false
        return false
      }

      var lineageLayer = $RpgOriginsAPI
        .getLayersRegistry()
        .get(RPG_LINEAGE_LAYER_ID)

      if (lineageLayer == null) {
        throw new Error(
          'Missing origin layer ' +
          RPG_LINEAGE_LIFECYCLE.lineageLayer
        )
      }

      // OriginLayer.contains(origin, player) evaluates the conditions declared
      // in lineage.json against the player's CURRENT race.
      if (lineageLayer.contains(lineageKey.location(), player)) {
        RPG_LINEAGE_LIFECYCLE_ERROR_REPORTED = false
        return false
      }

      container.setOrigin(
        entry.getKey(),
        $RpgOriginRegisters.EMPTY.getKey()
      )

      RPG_LINEAGE_LIFECYCLE_ERROR_REPORTED = false

      if (RPG_LINEAGE_LIFECYCLE.logRepairs) {
        console.info(
          '[RPG Races/Lifecycle] Cleared incompatible lineage ' +
          lineageId +
          ' from ' +
          player.name.string
        )
      }

      return true
    }

    RPG_LINEAGE_LIFECYCLE_ERROR_REPORTED = false
    return false
  }
  catch (error) {
    if (
      RPG_LINEAGE_LIFECYCLE.logErrors &&
      !RPG_LINEAGE_LIFECYCLE_ERROR_REPORTED
    ) {
      RPG_LINEAGE_LIFECYCLE_ERROR_REPORTED = true

      console.error(
        '[RPG Races/Lifecycle] Reconciliation failed: ' +
        error
      )
    }

    return false
  }
}

// Repair inconsistent persisted saves as soon as a player joins.
PlayerEvents.loggedIn(event => {
  rpgLineageLifecycleReconcile(event.player)
})

// Keep the invariant true after any runtime race mutation, regardless of which
// command, UI or future system performed the change.
ServerEvents.tick(event => {
  RPG_LINEAGE_LIFECYCLE_TICKS++

  if (
    RPG_LINEAGE_LIFECYCLE_TICKS %
    RPG_LINEAGE_LIFECYCLE.sampleIntervalTicks !==
    0
  ) {
    return
  }

  event.server.players.forEach(player => {
    rpgLineageLifecycleReconcile(player)
  })
})
