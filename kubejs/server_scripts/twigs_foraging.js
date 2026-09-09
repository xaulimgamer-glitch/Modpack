// Awakening - Twigs foraging fallback
// Forge 1.20.1 / KubeJS 6
//
// Approved behavior:
// Breaking leaves by hand has a 20% chance to drop one Twigs twig.
// This supplements Twigs' native environmental worldgen; it does not replace it.

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
