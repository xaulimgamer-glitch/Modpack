// Maps each custom melee item to an existing item model.
// Fill the values with full model resource locations, for example:
// 'spartanweaponry:item/iron_long_sword'
//
// Leave a value as null to keep KubeJS from generating an override for that item.
const MELEE_MODELS = {
  'kubejs:crude_battleaxe': 'spartanweaponry:stone_battleaxe',
  'kubejs:crude_sword': 'spartanweaponry:',
  'kubejs:crude_dagger': 'spartanweaponry:',
  'kubejs:crude_staff': null,
  'kubejs:crude_long_sword': 'spartanweaponry:',
  'kubejs:crude_mace': 'spartanweaponry':
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
