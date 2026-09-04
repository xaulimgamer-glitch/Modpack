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
})
