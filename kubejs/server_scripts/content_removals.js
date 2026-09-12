// Awakening content removals
// Items remain registered for world/save compatibility, but are removed from progression.

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

ServerEvents.recipes(event => {
  // Alex's Caves Nuclear Furnace is assembled from this craftable component.
  // Removing every recipe that outputs the component makes the multiblock unobtainable in survival.
  event.remove({ output: 'alexscaves:nuclear_furnace_component' })

  // Defensive removal for datapack/compat recipes. Alex's Caves can also create submarines directly.
  event.remove({ output: 'alexscaves:submarine' })

  // Remove SWEM combat/player equipment without touching horse armor or tack.
  // Output-based removal also catches compat recipes that produce the same registered items.
  SWEM_REMOVED_PLAYER_GEAR.forEach(item => event.remove({ output: item }))
})

// Submarines are spawned directly by Abyssal Ruins and by the Enigmatic Engine,
// so recipe removal alone cannot remove them from progression.
// KubeJS' spawned event also fires when an existing entity is loaded from a save;
// cancelling it therefore makes the removal apply to both newly created and legacy submarine entities.
EntityEvents.spawned('alexscaves:submarine', event => {
  event.cancel()
})
