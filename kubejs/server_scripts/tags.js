ServerEvents.tags('item', event => {
  event.add('turipis:cleavers', [
    'butchery:bone_cleaver',
    'butchery:copper_cleaver',
    'butchery:iron_cleaver',
    'butchery:gold_cleaver',
    'butchery:diamond_cleaver',
    'butchery:netherite_cleaver'
  ])
})
ServerEvents.tags('item', event => {
  event.add('turipis:skinning_knives', [
    'butchery:bone_skinning_knife',
    'butchery:copper_skinning_knife',
    'butchery:iron_skinning_knife',
    'butchery:gold_skinning_knife',
    'butchery:diamond_skinning_knife',
    'butchery:netherite_skinning_knife'
  ])
})
ServerEvents.tags('item', event => {
  event.add('turipis:copper_tools', [
    'overgeared:copper_pickaxe',
    'overgeared:copper_axe',
    'overgeared:copper_shovel',
    'overgeared:copper_hoe',
    'overgeared:copper_sword'
  ])
})
ServerEvents.tags('item', event => {
  event.add('turipis:proper_meals', [
    '#farmersdelight:meals',
    '#farmersdelight:snacks'
  ])
})