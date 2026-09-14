// Awakening content removals

const SWEM_REMOVED_PLAYER_GEAR = [
  'swem:scythe_leather',
  'swem:scythe_copper',
  'swem:scythe_iron',
  'swem:scythe_gold',
  'swem:scythe_diamond',
  'swem:scythe_netherite',
  'swem:scythe_amethyst',
  'swem:pickaxe_leather',
  'swem:pickaxe_copper',
  'swem:pickaxe_iron',
  'swem:pickaxe_gold',
  'swem:pickaxe_diamond',
  'swem:pickaxe_netherite',
  'swem:pickaxe_amethyst',
  'swem:axe_leather',
  'swem:axe_copper',
  'swem:axe_iron',
  'swem:axe_gold',
  'swem:axe_diamond',
  'swem:axe_netherite',
  'swem:axe_amethyst',
  'swem:shovel_leather',
  'swem:shovel_copper',
  'swem:shovel_iron',
  'swem:shovel_gold',
  'swem:shovel_diamond',
  'swem:shovel_netherite',
  'swem:shovel_amethyst',
  'swem:sword_leather',
  'swem:sword_copper',
  'swem:sword_iron',
  'swem:sword_gold',
  'swem:sword_diamond',
  'swem:sword_netherite',
  'swem:sword_amethyst',
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
  'swem:shield_leather',
  'swem:shield_copper',
  'swem:shield_iron',
  'swem:shield_gold',
  'swem:shield_diamond',
  'swem:shield_netherite',
  'swem:shield_amethyst',
  'swem:boots_riding_leather',
  'swem:boots_riding_glow',
  'swem:boots_riding_copper',
  'swem:boots_riding_iron',
  'swem:boots_riding_gold',
  'swem:boots_riding_diamond',
  'swem:boots_riding_netherite',
  'swem:boots_riding_amethyst',
  'swem:helmet_riding',
  'swem:hat_cowboy'
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
