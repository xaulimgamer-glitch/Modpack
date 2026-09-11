// Awakening armor forging integration.
// Armor follows Overgeared's plate -> armor anvil progression while preserving
// each source mod's native final armor items.

const AWAKENING_ARMOR_MANIFEST = 'kubejs/awakening/armor_forging.json'
const AWAKENING_ARMOR_HEATED_METALS = 'kubejs/awakening/heated_metals.json'

function awakeningArmorLoadData() {
  const data = JSON.parse(JsonIO.readString(AWAKENING_ARMOR_MANIFEST))
  if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/Armor] Invalid manifest: ' + AWAKENING_ARMOR_MANIFEST)
  }
  return data
}

function awakeningArmorLoadHeatedMetals() {
  const data = JsonIO.read(AWAKENING_ARMOR_HEATED_METALS)
  const byId = {}

  if (!data || !Array.isArray(data.metals)) return byId
  data.metals.forEach(metal => {
    if (metal && metal.id && metal.heated) byId[metal.id] = metal
  })

  return byId
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
  const heatedMetals = awakeningArmorLoadHeatedMetals()
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
    const heatedMetal = heatedMetals[material.id]
    const plateIngredient = heatedMetal
      ? { item: heatedMetal.heated }
      : { tag: material.ingredient_tag }

    requireIngredient(plateIngredient, material.id + '/plate-material')
    requireIngredient({ item: material.plate }, material.id + '/plate')

    // Mirrors Overgeared's iron/copper plate forging: one heated metal -> one plate,
    // no quality roll and no quenching. Materials not yet migrated keep their
    // legacy ingredient tag until they are added to heated_metals.json.
    queue(material.id + '/plate', {
      type: 'overgeared:forging',
      category: 'misc',
      hammering: 3,
      has_quality: false,
      key: {
        X: plateIngredient
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
