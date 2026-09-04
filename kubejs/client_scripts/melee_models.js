// Maps each custom melee item to an existing item model.
// Use a full model resource location, for example:
// 'spartanweaponry:item/stone_battleaxe'
//
// Leave a value as null to keep KubeJS from generating an override for that item.
const MELEE_MODELS = {
  'kubejs:crude_battleaxe': 'spartanweaponry:item/stone_battleaxe',
  'kubejs:crude_long_sword': null,
  'kubejs:crude_dagger': null,
  'kubejs:crude_flanged_mace': null,
  'kubejs:crude_sword': null,
  'kubejs:crude_graybeard_staff': null
}

ClientEvents.highPriorityAssets(event => {
  Object.keys(MELEE_MODELS).forEach(itemId => {
    const parentModel = MELEE_MODELS[itemId]
    if (!parentModel) return

    const separator = itemId.indexOf(':')
    if (separator <= 0 || separator === itemId.length - 1) {
      console.error(`[Melee Models] Invalid item id: ${itemId}`)
      return
    }

    const namespace = itemId.substring(0, separator)
    const path = itemId.substring(separator + 1)

    event.add(`${namespace}:models/item/${path}`, {
      parent: parentModel
    })
  })
})
