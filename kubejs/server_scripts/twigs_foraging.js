// Awakening - Twigs foraging integration
// Forge 1.20.1 / KubeJS 6
//
// Approved behavior:
// - Breaking leaves by hand has a 20% chance to drop one Twigs twig.
// - Environmental Twigs pebbles drop Overgeared's knappable rock directly.
//
// Twigs' native worldgen remains authoritative for environmental placement.

const AWAKENING_TWIG_FORAGING_CHANCE = 0.20

BlockEvents.broken(event => {
  if (!event.player || event.player.isFake()) return
  if (event.player.isCreative()) return
  if (!event.block.hasTag('minecraft:leaves')) return

  // Bare-hand foraging only. Tools and held items do not trigger this fallback.
  if (event.player.mainHandItem.id != 'minecraft:air') return

  if (Math.random() >= AWAKENING_TWIG_FORAGING_CHANCE) return

  event.block.popItem('twigs:twig')
})

// Twigs' pebble block normally drops twigs:pebble. Overgeared's stone knapping
// recipes require overgeared:knappable_rock specifically, so the environmental
// pebble becomes the pack's natural source of that rock instead of adding an
// extra inventory conversion step.
ServerEvents.blockLootTables(event => {
  event.modifyBlock('twigs:pebble', table => {
    table.clearPools()
    table.addPool(pool => {
      pool.addItem('overgeared:knappable_rock')
      pool.survivesExplosion()
    })
  })
})
