// Awakening content removals
// Items remain registered for world/save compatibility, but are removed from progression.

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

const ARTIFACTS_PROGRESSION_LOOT_TAGS = [
  'artifacts:artifacts_worn_by_mimics',
  'artifacts:campsite_artifacts',
  'artifacts:drinking_hats',
  'artifacts:entity_artifacts',
  'artifacts:fishing_artifacts',
  'artifacts:generic_artifacts',
  'artifacts:item_rewards',
  'artifacts:mimic_only_artifacts',
  'artifacts:rare_artifacts',
  'artifacts:wearable_artifacts',
  'artifacts:wearable_in_campsites',
  'artifacts:wearable_loot',
  'artifacts:wearable_mimic_artifacts'
]

const VANILLA_RANGED_WEAPONS_REMOVED_FROM_PROGRESSION = [
  'minecraft:bow',
  'minecraft:crossbow'
]

// Native OvergearedSpartan Longbow limbs that are obsolete after the bow progression migration.
// Wooden and Leather are intentionally retained until a safe non-limb Longbow path is verified.
const OVERGEAREDSPARTAN_OBSOLETE_LONGBOW_LIMBS = [
  'overgearedspartan:copper_longbow_limb',
  'overgearedspartan:iron_longbow_limb',
  'overgearedspartan:gold_longbow_limb',
  'overgearedspartan:golden_longbow_limb',
  'overgearedspartan:diamond_longbow_limb',
  'overgearedspartan:netherite_longbow_limb',
  'overgearedspartan:steel_longbow_limb',
  'overgearedspartan:silver_longbow_limb'
]

// Heavy Crossbow limbs are no longer a progression concept. Match the actual registered
// OvergearedSpartan namespace instead of maintaining a guessed material list.
const OVERGEAREDSPARTAN_HEAVY_CROSSBOW_LIMB_PATTERN = /^overgearedspartan:.*_heavy_crossbow_limb$/

// Keep the external Spartan Weaponry registry entries for save compatibility, while retiring
// every bolt currently exposed by the installed 3.2.1 #spartanweaponry:bolts tag.
const SPARTANWEAPONRY_BOLTS_REMOVED_FROM_PROGRESSION = [
  'spartanweaponry:bolt',
  'spartanweaponry:tipped_bolt',
  'spartanweaponry:spectral_bolt',
  'spartanweaponry:copper_bolt',
  'spartanweaponry:tipped_copper_bolt',
  'spartanweaponry:diamond_bolt',
  'spartanweaponry:tipped_diamond_bolt',
  'spartanweaponry:netherite_bolt',
  'spartanweaponry:tipped_netherite_bolt'
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

  // The selected Artifacts remain registered for save compatibility, but no recipe or compat recipe
  // may reintroduce them as a progression route.
  ARTIFACTS_REMOVED_FROM_PROGRESSION.forEach(item => event.remove({ output: item }))

  // Vanilla bow and crossbow remain registered for compatibility/commands/Creative, but recipes from
  // vanilla, mods, datapacks, or KubeJS must not make them obtainable through normal progression.
  VANILLA_RANGED_WEAPONS_REMOVED_FROM_PROGRESSION.forEach(item => event.remove({ output: item }))

  // Keep native registry entries for save compatibility while removing both ways to create the
  // obsolete Longbow parts and recipes/tooltype conversions that still consume them.
  OVERGEAREDSPARTAN_OBSOLETE_LONGBOW_LIMBS.forEach(item => {
    event.remove({ output: item })
    event.remove({ input: item })
  })

  // Heavy Crossbow limbs are matched by registered namespace/path, so optional material integrations
  // cannot silently re-enter progression when the installed OvergearedSpartan set changes.
  const heavyCrossbowLimbs = Ingredient.of(OVERGEAREDSPARTAN_HEAVY_CROSSBOW_LIMB_PATTERN)
  event.remove({ output: heavyCrossbowLimbs })
  event.remove({ input: heavyCrossbowLimbs })

  // Bolts remain registered but have no crafting, upgrading, recycling or compat recipe route.
  SPARTANWEAPONRY_BOLTS_REMOVED_FROM_PROGRESSION.forEach(item => {
    event.remove({ output: item })
    event.remove({ input: item })
  })
})

// Artifacts uses item tags to choose candidates for several native progression routes (mimics,
// campsites, fishing, entity rewards and wearable loot). Remove only the seven disabled items from
// those acquisition tags while leaving their registry entries and unrelated Artifacts untouched.
ServerEvents.tags('item', event => {
  ARTIFACTS_PROGRESSION_LOOT_TAGS.forEach(tag => {
    ARTIFACTS_REMOVED_FROM_PROGRESSION.forEach(item => event.remove(tag, item))
  })

  OVERGEAREDSPARTAN_OBSOLETE_LONGBOW_LIMBS.forEach(item => {
    event.remove('overgeared:tool_parts', item)
  })

  // Filter the resolved tool-parts tag rather than guessing which optional metal limbs exist.
  event.get('overgeared:tool_parts').getObjectIds().forEach(item => {
    const id = String(item)
    if (OVERGEAREDSPARTAN_HEAVY_CROSSBOW_LIMB_PATTERN.test(id)) {
      event.remove('overgeared:tool_parts', id)
    }
  })

  // Heavy Crossbows now use arrows, so the legacy bolt tag is emptied without unregistering items.
  SPARTANWEAPONRY_BOLTS_REMOVED_FROM_PROGRESSION.forEach(item => {
    event.remove('spartanweaponry:bolts', item)
  })
})

// Artifacts also injects rewards through Forge loot modifiers (including Everlasting Beef).
// LootJS filters the final generated loot, after Forge modifiers, so no loot-table path can
// reintroduce one of the disabled items without unregistering it or affecting other Artifacts.
LootJS.modifiers(event => {
  const allLootTables = event.addLootTableModifier(/.*/)
  ARTIFACTS_REMOVED_FROM_PROGRESSION.forEach(item => allLootTables.removeLoot(item))
  SPARTANWEAPONRY_BOLTS_REMOVED_FROM_PROGRESSION.forEach(item => allLootTables.removeLoot(item))
})

// Submarines are spawned directly by Abyssal Ruins and by the Enigmatic Engine,
// so recipe removal alone cannot remove them from progression.
// KubeJS' spawned event also fires when an existing entity is loaded from a save;
// cancelling it therefore makes the removal apply to both newly created and legacy submarine entities.
EntityEvents.spawned('alexscaves:submarine', event => {
  event.cancel()
})
