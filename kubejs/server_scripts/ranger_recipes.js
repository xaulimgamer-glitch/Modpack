// Early-game fallback for Rangers.
// Vanilla arrows remain more efficient (4 arrows with a feather).
// This improvised recipe removes the feather requirement at half the yield.
ServerEvents.recipes(event => {
  const SIMPLE_HANDLE = 'spartanweaponry:simple_handle'
  const WOODEN_ROD = '#forge:rods/wooden'
  const STRING = '#forge:string'
  const PLANKS = '#minecraft:planks'

  event.shaped('2x minecraft:arrow', [
    'F',
    'S'
  ], {
    F: 'minecraft:flint',
    S: 'minecraft:stick'
  }).id('kubejs:improvised_arrows')

  event.remove({ output: 'kubejs:crude_short_bow' })
  event.remove({ output: 'awakening:wood_short_bow' })
  event.remove({ output: 'awakening:wood_recurve_bow' })
  event.remove({ output: 'awakening:wood_flat_bow' })

  // Tier 0: the Crude Short Bow remains the primitive starter bow.
  // Sticks keep it craftable before normal plank processing, but it still
  // participates in Awakening's handle progression.
  event.shaped('kubejs:crude_short_bow', [
    ' RS',
    'H S'
  ], {
    R: 'minecraft:stick',
    H: SIMPLE_HANDLE,
    S: STRING
  }).id('awakening:ranger/crude_short_bow')

  // Wood bows use the same ingredient family as Spartan Weaponry's Wooden
  // Longbow, but substitute its reinforced handle for Awakening's Simple Handle.
  event.shaped('awakening:wood_short_bow', [
    'PHR',
    'RSS'
  ], {
    P: PLANKS,
    H: SIMPLE_HANDLE,
    R: WOODEN_ROD,
    S: STRING
  }).id('awakening:ranger/wood_short_bow')

  event.shaped('awakening:wood_recurve_bow', [
    'RHP',
    'R S',
    'RSS'
  ], {
    P: PLANKS,
    H: SIMPLE_HANDLE,
    R: WOODEN_ROD,
    S: STRING
  }).id('awakening:ranger/wood_recurve_bow')

  event.shaped('awakening:wood_flat_bow', [
    'PHR',
    'P S',
    'RSS'
  ], {
    P: PLANKS,
    H: SIMPLE_HANDLE,
    R: WOODEN_ROD,
    S: STRING
  }).id('awakening:ranger/wood_flat_bow')
})
