// Awakening leather processing integration
// Forge 1.20.1 / KubeJS 6
// Status: IMPLEMENTED / STATIC-OBSERVED. Minecraft/JEI verification is pending.

ServerEvents.tags('item', event => {
  // Prefer common Forge tool tags so knives/shears from compatible mods work
  // automatically. Butchery skinning knives are included explicitly through
  // the pack tag because they are not assumed to register as generic knives.
  event.add('turipis:leather_cutting_tools', [
    '#forge:tools/knives',
    '#forge:tools/shears',
    '#turipis:skinning_knives'
  ])
})

ServerEvents.recipes(event => {
  // BetterEnd leather stripe is the canonical leather strip used by Awakening.
  // Remove every direct output recipe first so JEI cannot expose a bypass.
  event.remove({ output: 'betterend:leather_stripe' })

  // One leather is cut into three stripes. The cutting tool is retained and
  // loses one durability instead of being consumed by the craft.
  event.custom({
    type: 'overgeared:crafting_shapeless',
    category: 'misc',
    ingredients: [
      { item: 'minecraft:leather' },
      {
        tag: 'turipis:leather_cutting_tools',
        remainder: true,
        durability_decrease: 1
      }
    ],
    result: {
      item: 'betterend:leather_stripe',
      count: 3
    }
  }).id('awakening:leather_stripe_from_cutting')
})
