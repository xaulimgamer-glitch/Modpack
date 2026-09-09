// Awakening early-game progression core
// Forge 1.20.1 / KubeJS 6
//
// Design authority:
// Twigs forage -> Overgeared knapping -> Stone -> Copper -> Reinforced Handle -> Iron+
// Runtime verification is still required before this is considered LIVE-VERIFIED.

const AWAKENING_SIMPLE_TIER_HANDLE_TAG = 'awakening:handles/simple_tier'
const AWAKENING_SIMPLE_HANDLE = 'spartanweaponry:simple_handle'
const AWAKENING_REINFORCED_HANDLE = 'spartanweaponry:handle'

const AWAKENING_BOOTSTRAP_PLANTS = [
  'minecraft:grass',
  'minecraft:tall_grass',
  'minecraft:fern',
  'minecraft:large_fern'
]

function awakeningIngredientJson(idOrTag) {
  if (idOrTag.startsWith('#')) {
    return { tag: idOrTag.substring(1) }
  }

  return { item: idOrTag }
}

function awakeningAddOvergearedAssembly(event, recipeId, output, component, handleIngredient) {
  event.custom({
    type: 'overgeared:crafting_shapeless',
    category: 'equipment',
    ingredients: [
      { item: component },
      awakeningIngredientJson(handleIngredient)
    ],
    result: {
      item: output
    }
  }).id(`awakening:${recipeId}`)
}

ServerEvents.tags('item', event => {
  // A reinforced handle is intentionally backwards-compatible with Stone/Copper.
  // The simple handle is NOT accepted by Iron/Steel recipes below.
  event.add(AWAKENING_SIMPLE_TIER_HANDLE_TAG, [
    AWAKENING_SIMPLE_HANDLE,
    AWAKENING_REINFORCED_HANDLE
  ])
})

ServerEvents.recipes(event => {
  // ---------------------------------------------------------------------------
  // Tier 0: Twigs -> Overgeared knappable rocks
  // ---------------------------------------------------------------------------

  // Remove Twigs' 2x2 pebble -> cobblestone shortcut. Cobblestone belongs after
  // the Stone Pickaxe milestone.
  event.remove({ id: 'twigs:cobblestone_from_pebble' })

  // Initial playtest ratio. This is deliberately easy to tune after runtime tests.
  event.shapeless('overgeared:knappable_rock', [
    'twigs:pebble'
  ]).id('awakening:pebble_to_knappable_rock')

  // Later recycling route: once stone/cobblestone is available, the player no
  // longer has to depend on environmental pebbles for every knapping operation.
  event.shapeless('4x overgeared:knappable_rock', [
    '#quark:stone_tool_materials',
    'spelunkery:flint_hammer_and_chisel'
  ])
    .damageIngredient('spelunkery:flint_hammer_and_chisel')
    .id('awakening:stone_material_to_knappable_rocks')

  // ---------------------------------------------------------------------------
  // Handles
  // ---------------------------------------------------------------------------

  // Spartan Weaponry's original recipes are removed so they cannot bypass the
  // material progression defined by Awakening.
  event.remove({ output: AWAKENING_SIMPLE_HANDLE })
  event.remove({ output: AWAKENING_REINFORCED_HANDLE })

  // Repeatable primitive route after the first Farmer's Delight knife exists.
  event.shapeless(AWAKENING_SIMPLE_HANDLE, [
    'minecraft:stick',
    'farmersdelight:straw'
  ]).id('awakening:simple_handle_from_straw')

  // Approved Iron+ handle gate.
  event.shapeless(AWAKENING_REINFORCED_HANDLE, [
    'minecraft:stick',
    'magistuarmory:leather_strip'
  ]).id('awakening:reinforced_handle_from_leather_strip')

  // Farmer's Delight already supplies its primitive flint knife as flint + stick,
  // so no replacement recipe is needed here.

  // ---------------------------------------------------------------------------
  // Remove wooden tools from normal crafting progression
  // ---------------------------------------------------------------------------

  [
    'minecraft:wooden_axe',
    'minecraft:wooden_pickaxe',
    'minecraft:wooden_shovel',
    'minecraft:wooden_hoe',
    'minecraft:wooden_sword'
  ].forEach(output => event.remove({ output: output }))

  // ---------------------------------------------------------------------------
  // Tool assembly
  // Keep Overgeared's custom crafting recipe type so head quality/data can be
  // propagated to the finished item.
  // ---------------------------------------------------------------------------

  const simpleTierTools = [
    // Stone
    ['stone_axe', 'minecraft:stone_axe', 'overgeared:stone_axe_head'],
    ['stone_pickaxe', 'minecraft:stone_pickaxe', 'overgeared:stone_pickaxe_head'],
    ['stone_shovel', 'minecraft:stone_shovel', 'overgeared:stone_shovel_head'],
    ['stone_hoe', 'minecraft:stone_hoe', 'overgeared:stone_hoe_head'],
    ['stone_sword', 'minecraft:stone_sword', 'overgeared:stone_sword_blade'],

    // Copper
    ['copper_axe', 'overgeared:copper_axe', 'overgeared:copper_axe_head'],
    ['copper_pickaxe', 'overgeared:copper_pickaxe', 'overgeared:copper_pickaxe_head'],
    ['copper_shovel', 'overgeared:copper_shovel', 'overgeared:copper_shovel_head'],
    ['copper_hoe', 'overgeared:copper_hoe', 'overgeared:copper_hoe_head'],
    ['copper_sword', 'overgeared:copper_sword', 'overgeared:copper_sword_blade']
  ]

  simpleTierTools.forEach(([recipeId, output, component]) => {
    event.remove({ output: output })
    awakeningAddOvergearedAssembly(
      event,
      recipeId,
      output,
      component,
      `#${AWAKENING_SIMPLE_TIER_HANDLE_TAG}`
    )
  })

  const reinforcedTierTools = [
    // Iron
    ['iron_axe', 'minecraft:iron_axe', 'overgeared:iron_axe_head'],
    ['iron_pickaxe', 'minecraft:iron_pickaxe', 'overgeared:iron_pickaxe_head'],
    ['iron_shovel', 'minecraft:iron_shovel', 'overgeared:iron_shovel_head'],
    ['iron_hoe', 'minecraft:iron_hoe', 'overgeared:iron_hoe_head'],
    ['iron_sword', 'minecraft:iron_sword', 'overgeared:iron_sword_blade'],

    // Steel
    ['steel_axe', 'overgeared:steel_axe', 'overgeared:steel_axe_head'],
    ['steel_pickaxe', 'overgeared:steel_pickaxe', 'overgeared:steel_pickaxe_head'],
    ['steel_shovel', 'overgeared:steel_shovel', 'overgeared:steel_shovel_head'],
    ['steel_hoe', 'overgeared:steel_hoe', 'overgeared:steel_hoe_head'],
    ['steel_sword', 'overgeared:steel_sword', 'overgeared:steel_sword_blade']
  ]

  reinforcedTierTools.forEach(([recipeId, output, component]) => {
    event.remove({ output: output })
    awakeningAddOvergearedAssembly(
      event,
      recipeId,
      output,
      component,
      AWAKENING_REINFORCED_HANDLE
    )
  })

  // Smithing hammers follow the same handle quality rule as their material tier.
  event.remove({ output: 'overgeared:copper_smithing_hammer' })
  awakeningAddOvergearedAssembly(
    event,
    'copper_smithing_hammer',
    'overgeared:copper_smithing_hammer',
    'overgeared:copper_hammer_head',
    `#${AWAKENING_SIMPLE_TIER_HANDLE_TAG}`
  )

  event.remove({ output: 'overgeared:smithing_hammer' })
  awakeningAddOvergearedAssembly(
    event,
    'steel_smithing_hammer',
    'overgeared:smithing_hammer',
    'overgeared:steel_hammer_head',
    AWAKENING_REINFORCED_HANDLE
  )
})

// -----------------------------------------------------------------------------
// First Simple Handle bootstrap
// -----------------------------------------------------------------------------
// Before the player owns a knife, one stick can be bound using common vegetation.
// Grass blocks are intentionally excluded; only the plant blocks below count.
BlockEvents.rightClicked(event => {
  if (event.hand != 'MAIN_HAND') return
  if (!event.player || event.player.isFake()) return
  if (!AWAKENING_BOOTSTRAP_PLANTS.includes(event.block.id)) return
  if (event.player.mainHandItem.id != 'minecraft:stick') return

  event.block.set('minecraft:air')

  if (!event.player.isCreative()) {
    event.player.mainHandItem.count--
  }

  event.player.give(AWAKENING_SIMPLE_HANDLE)
  event.cancel()
})

// -----------------------------------------------------------------------------
// Wood gate
// -----------------------------------------------------------------------------
// Survival players cannot harvest logs without an axe. This makes the first
// Stone Axe the real wood-access milestone and blocks vanilla tree punching.
BlockEvents.broken(event => {
  if (!event.player || event.player.isCreative()) return
  if (!event.block.hasTag('minecraft:logs')) return
  if (event.player.mainHandItem.hasTag('minecraft:axes')) return

  event.cancel()
})
