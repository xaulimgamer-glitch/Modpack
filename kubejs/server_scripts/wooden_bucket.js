// Awakening early-game wooden bucket rebalance
// Windswept's default recipe costs three full logs; keep the same V shape
// but use planks so the bucket remains an early pre-Iron water container.

ServerEvents.recipes(event => {
  event.remove({ id: 'windswept:wooden_bucket' })

  event.shaped('windswept:wooden_bucket', [
    'P P',
    ' P '
  ], {
    P: '#minecraft:planks'
  }).id('windswept:wooden_bucket')
})
