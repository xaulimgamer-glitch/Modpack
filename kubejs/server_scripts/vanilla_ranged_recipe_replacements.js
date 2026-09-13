// Retarget recipes that still consume vanilla ranged weapons after those weapons
// were removed from normal Awakening progression. Outputs and every other
// ingredient remain unchanged.

const AWAKENING_RECIPE_BOW_REPLACEMENT = 'awakening:wooden_recurve_bow'
const AWAKENING_RECIPE_CROSSBOW_REPLACEMENT = 'spartanweaponry:wooden_heavy_crossbow'

ServerEvents.recipes(event => {
  // A dispenser needs a trigger/release mechanism, not an entire replacement bow.
  // Apply these targeted rewrites first so the generic Bow replacement below does
  // not make Dispensers consume an Awakening bow.
  [
    'minecraft:dispenser',
    'quark:tweaks/crafting/utility/misc/dispenser_bow'
  ].forEach(recipeId => {
    event.replaceInput(
      { id: recipeId },
      'minecraft:bow',
      'minecraft:tripwire_hook'
    )
  })

  // For remaining recipes, preserve the original semantic role: a complete Bow
  // becomes Awakening's closest wooden equivalent, while a vanilla Crossbow
  // becomes the pack's wooden Heavy Crossbow.
  event.replaceInput(
    {},
    'minecraft:bow',
    AWAKENING_RECIPE_BOW_REPLACEMENT
  )

  event.replaceInput(
    {},
    'minecraft:crossbow',
    AWAKENING_RECIPE_CROSSBOW_REPLACEMENT
  )
})
