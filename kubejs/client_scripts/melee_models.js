// Generates client-side models for custom melee items.
//
// Do not inherit directly from Spartan Weaponry material models such as
// 'spartanweaponry:item/stone_battleaxe'. Those models use Spartan Weaponry's
// custom item loader and can render a non-Spartan item as invisible.
//
// Instead, inherit from the Spartan Weaponry base model and provide the texture
// explicitly. This preserves the weapon transforms without invoking its loader.
const MELEE_MODELS = {
  'kubejs:crude_battleaxe': {
    parent: 'spartanweaponry:item/base/battleaxe',
    textures: {
      layer0: 'spartanweaponry:item/stone_battleaxe'
    }
  },
  'kubejs:crude_sword': {
    parent: 'minecraft:item/handheld',
    textures: {
      layer0: 'minecraft:item/stone_sword'
    }
  },
  'kubejs:crude_dagger': null,
  'kubejs:crude_graybeard_staff': null,
  'kubejs:crude_long_sword': null,
  'kubejs:crude_flanged_mace': null
}

ClientEvents.highPriorityAssets(event => {
  Object.keys(MELEE_MODELS).forEach(itemId => {
    const model = MELEE_MODELS[itemId]
    if (!model) return

    const separator = itemId.indexOf(':')
    if (separator <= 0 || separator === itemId.length - 1) {
      console.error(`[Melee Models] Invalid item id: ${itemId}`)
      return
    }

    const namespace = itemId.substring(0, separator)
    const path = itemId.substring(separator + 1)

    event.add(`${namespace}:models/item/${path}`, model)
  })
})
