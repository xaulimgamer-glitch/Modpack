// Canonical silver: Ice and Fire Community Edition.
// Werewolves silver registry entries remain available for commands/creative,
// but are removed from normal recipe/tag progression.

const silverItemTags = [
  ['forge:ingots/silver', ['iceandfire:silver_ingot'], ['werewolves:silver_ingot']],
  ['forge:nuggets/silver', ['iceandfire:silver_nugget'], ['werewolves:silver_nugget']],
  ['forge:raw_materials/silver', ['iceandfire:raw_silver'], ['werewolves:raw_silver']],
  ['forge:ores/silver', ['iceandfire:silver_ore', 'iceandfire:deepslate_silver_ore'], ['werewolves:silver_ore', 'werewolves:deepslate_silver_ore']],
  ['forge:storage_blocks/silver', ['iceandfire:silver_block'], ['werewolves:silver_block']],
  ['forge:storage_blocks/raw_silver', ['iceandfire:raw_silver_block'], ['werewolves:raw_silver_block']]
]

const silverBlockTags = [
  ['forge:ores/silver', ['iceandfire:silver_ore', 'iceandfire:deepslate_silver_ore'], ['werewolves:silver_ore', 'werewolves:deepslate_silver_ore']],
  ['forge:storage_blocks/silver', ['iceandfire:silver_block'], ['werewolves:silver_block']],
  ['forge:storage_blocks/raw_silver', ['iceandfire:raw_silver_block'], ['werewolves:raw_silver_block']]
]

function canonicalizeSilverTags(event, definitions) {
  definitions.forEach(definition => {
    const tag = definition[0]
    const canonical = definition[1]
    const deprecated = definition[2]

    canonical.forEach(item => event.add(tag, item))
    deprecated.forEach(item => event.remove(tag, item))
  })
}

ServerEvents.tags('item', event => {
  canonicalizeSilverTags(event, silverItemTags)
})

ServerEvents.tags('block', event => {
  canonicalizeSilverTags(event, silverBlockTags)
})

ServerEvents.recipes(event => {
  const werewolvesSilverOutputs = [
    'werewolves:silver_ingot',
    'werewolves:silver_nugget',
    'werewolves:raw_silver',
    'werewolves:silver_ore',
    'werewolves:deepslate_silver_ore',
    'werewolves:silver_block',
    'werewolves:raw_silver_block'
  ]

  // Remove every data-driven recipe route that creates Werewolves silver.
  // Consumer recipes are intentionally kept: they can use the canonical Forge tags above.
  werewolvesSilverOutputs.forEach(item => event.remove({ output: item }))

  // Overgeared ships three cooling recipes that turn the same heated silver
  // into different mods' silver ingots. Replace them with one canonical result.
  ;[
    'overgeared:silver_ingot_from_cooling',
    'overgeared:silver_ingot_from_cooling_2',
    'overgeared:silver_ingot_from_cooling_3'
  ].forEach(id => event.remove({ id: id }))

  event.custom({
    type: 'overgeared:cooling',
    input: {
      item: 'overgeared:heated_silver_ingot'
    },
    output: {
      item: 'iceandfire:silver_ingot'
    }
  }).id('overgeared:silver_ingot_from_cooling')
})
