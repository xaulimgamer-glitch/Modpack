// Early-game fallback for Rangers.
// Vanilla arrows remain more efficient (4 arrows with a feather).
// This improvised recipe removes the feather requirement at half the yield.
ServerEvents.recipes(event => {
  event.shaped('2x minecraft:arrow', [
    'F',
    'S'
  ], {
    F: 'minecraft:flint',
    S: 'minecraft:stick'
  }).id('kubejs:improvised_arrows')

  // Arch Bows progression now uses Spartan Weaponry handles.
  // The Arch Bows longbow is intentionally left without a crafting recipe;
  // Spartan Weaponry owns the longbow progression in Awakening.
  event.remove({ output: 'archbows:shortbow' })
  event.remove({ output: 'archbows:recurve' })
  event.remove({ output: 'archbows:flatbow' })
  event.remove({ output: 'archbows:longbow' })

  event.shaped('archbows:shortbow', [
    ' /S',
    '| S'
  ], {
    '/': '#forge:rods/wooden',
    '|': 'spartanweaponry:simple_handle',
    S: '#forge:string'
  }).id('awakening:archbows/shortbow')

  event.shaped('archbows:recurve', [
    ' /S',
    '| S',
    ' /S'
  ], {
    '/': '#forge:rods/wooden',
    '|': 'spartanweaponry:simple_handle',
    S: 'archbows:flax_string'
  }).id('awakening:archbows/recurve')

  event.shaped('archbows:flatbow', [
    '|/#',
    '/ S',
    '#SS'
  ], {
    '#': '#minecraft:planks',
    '/': '#forge:rods/wooden',
    '|': 'spartanweaponry:handle',
    S: 'archbows:linen_string'
  }).id('awakening:archbows/flatbow')
})
