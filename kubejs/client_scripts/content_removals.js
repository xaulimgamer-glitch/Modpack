// Awakening content removals

const SWEM_REMOVED_PLAYER_GEAR = [
  'swem:helmet_leather',
  'swem:helmet_copper',
  'swem:helmet_iron',
  'swem:helmet_gold',
  'swem:helmet_diamond',
  'swem:helmet_netherite',
  'swem:helmet_amethyst',
  'swem:chestplate_leather',
  'swem:chestplate_copper',
  'swem:chestplate_iron',
  'swem:chestplate_gold',
  'swem:chestplate_diamond',
  'swem:chestplate_netherite',
  'swem:chestplate_amethyst',
  'swem:leggings_leather',
  'swem:leggings_copper',
  'swem:leggings_iron',
  'swem:leggings_gold',
  'swem:leggings_diamond',
  'swem:leggings_netherite',
  'swem:leggings_amethyst',
  'swem:bow_leather',
  'swem:bow_copper',
  'swem:bow_iron',
  'swem:bow_gold',
  'swem:bow_diamond',
  'swem:bow_netherite',
  'swem:bow_amethyst',
  'swem:boots_riding_leather',
  'swem:boots_riding_copper',
  'swem:boots_riding_iron',
  'swem:boots_riding_gold',
  'swem:boots_riding_diamond',
  'swem:boots_riding_netherite',
  'swem:boots_riding_amethyst',
  'swem:helmet_riding'
]

const ARTIFACTS_REMOVED_FROM_PROGRESSION = [
  'artifacts:plastic_drinking_hat',
  'artifacts:novelty_drinking_hat',
  'artifacts:night_vision_goggles',
  'artifacts:snorkel',
  'artifacts:whoopee_cushion',
  'artifacts:umbrella',
  'artifacts:everlasting_beef'
]

JEIEvents.hideItems(event => {
  event.hide('alexscaves:nuclear_furnace_component')
  event.hide('alexscaves:submarine')

  SWEM_REMOVED_PLAYER_GEAR.forEach(item => event.hide(item))
  ARTIFACTS_REMOVED_FROM_PROGRESSION.forEach(item => event.hide(item))
})

JEIEvents.removeCategories(event => {
  event.remove('alexscaves:nuclear_furnace')
})
