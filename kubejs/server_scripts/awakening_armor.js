// Awakening armor forging integration.
// Armor follows Overgeared's plate -> armor anvil progression while preserving
// each source mod's native final armor items.

const AWAKENING_ARMOR_MANIFEST = 'kubejs/awakening/armor_forging.json'

function awakeningArmorLoadData() {
  const data = JSON.parse(JsonIO.readString(AWAKENING_ARMOR_MANIFEST))
  if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/Armor] Invalid manifest: ' + AWAKENING_ARMOR_MANIFEST)
  }
  return data
}

ServerEvents.tags('item', event => {
  const data = awakeningArmorLoadData()

  data.materials.forEach(material => {
    event.add(material.plate_tag, material.plate)
    event.add('awakening:armor_plates', material.plate)
  })
})

ServerEvents.recipes(event => {
  const data = awakeningArmorLoadData()
  const pending = []
  const outputs = []

  function requireIngredient(ingredient, context) {
    if (Ingredient.of(ingredient).itemIds.size() === 0) {
      throw new Error('[Awakening/Armor] Missing ingredient in ' + context + ': ' + JSON.stringify(ingredient))
    }
  }

  function queue(id, json) {
    pending.push({ id: 'awakening:armor/' + id, json: json })
  }

  data.materials.forEach(material => {
    requireIngredient({ tag: material.ingredient_tag }, material.id)
    requireIngredient({ item: material.plate }, material.id + '/plate')

    // Mirrors Overgeared's iron/copper plate forging: one ingot -> one plate,
    // no quality roll and no quenching.
    queue(material.id + '/plate', {
      type: 'overgeared:forging',
      category: 'misc',
      hammering: 3,
      has_quality: false,
      key: {
        X: { tag: material.ingredient_tag }
      },
      need_quenching: false,
      needs_minigame: false,
      pattern: ['X'],
      quality_difficulty: 'none',
      result: { item: material.plate },
      show_notification: true,
      tier: material.tier
    })

    data.templates.forEach(template => {
      const output = material.outputs[template.type]
      if (!output) {
        throw new Error('[Awakening/Armor] Missing output for ' + material.id + '/' + template.type)
      }

      requireIngredient({ item: output }, material.id + '/' + template.type)

      queue(material.id + '/forge/' + template.type, {
        type: 'overgeared:forging',
        category: 'armors',
        hammering: template.hammering,
        has_polishing: false,
        has_quality: true,
        key: {
          X: { tag: material.plate_tag }
        },
        minimum_quality: 'poor',
        need_quenching: false,
        needs_minigame: false,
        pattern: template.pattern,
        quality_difficulty: 'none',
        requires_blueprint: false,
        result: { item: output },
        show_notification: true,
        tier: material.tier
      })

      outputs.push(output)
    })
  })

  // Replace the source mods' direct ingot crafting with plate-based forging.
  outputs.forEach(output => event.remove({ output: output }))
  pending.forEach(recipe => event.custom(recipe.json).id(recipe.id))

  console.info('[Awakening/Armor] Installed ' + outputs.length + ' armor recipes; ' + pending.length + ' forging recipes. Live verification pending.')
})
