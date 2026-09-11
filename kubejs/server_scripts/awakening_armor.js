(function () {
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

  function awakeningArmorIngredientExists(ingredient) {
    try {
      return Ingredient.of(ingredient).itemIds.size() > 0
    } catch (error) {
      return false
    }
  }

  function awakeningArmorValidateMaterial(data, heatedMetals, material) {
    const reasons = []
    const id = material && material.id ? material.id : '<unknown>'
    const heatedMetal = material && material.id ? heatedMetals[material.id] : null
    const plateIngredient = heatedMetal
      ? { item: heatedMetal.heated }
      : { tag: material && material.ingredient_tag ? material.ingredient_tag : '' }

    if (!material || !material.id) reasons.push('missing material id')
    if (!material || !material.plate) reasons.push('missing plate item id')
    if (!material || !material.plate_tag) reasons.push('missing plate tag')
    if (!material || !material.tier) reasons.push('missing forging tier')
    if (!material || !material.outputs || typeof material.outputs !== 'object') reasons.push('missing outputs map')

    if (!awakeningArmorIngredientExists(plateIngredient)) {
      reasons.push('missing plate material ' + JSON.stringify(plateIngredient))
    }
    if (material && material.plate && !awakeningArmorIngredientExists({ item: material.plate })) {
      reasons.push('missing plate item ' + material.plate)
    }

    data.templates.forEach(template => {
      if (!template || !template.type) {
        reasons.push('invalid armor template')
        return
      }
      const output = material && material.outputs ? material.outputs[template.type] : null
      if (!output) {
        reasons.push('missing output for ' + template.type)
      } else if (!awakeningArmorIngredientExists({ item: output })) {
        reasons.push('missing output item ' + output)
      }
    })

    return {
      valid: reasons.length === 0,
      id: id,
      reasons: reasons,
      plateIngredient: plateIngredient
    }
  }

  ServerEvents.tags('item', event => {
    const data = awakeningArmorLoadData()

    data.materials.forEach(material => {
      if (!material || !material.plate || !material.plate_tag) {
        console.warn('[Awakening/Armor] Skipping malformed tag entry: ' + JSON.stringify(material))
        return
      }
      event.add(material.plate_tag, material.plate)
      event.add('awakening:armor_plates', material.plate)
    })
  })

  ServerEvents.recipes(event => {
    const data = awakeningArmorLoadData()
    const heatedMetals = awakeningArmorLoadHeatedMetals()
    const pending = []
    const outputs = []
    let skipped = 0

    data.materials.forEach(material => {
      const validation = awakeningArmorValidateMaterial(data, heatedMetals, material)
      if (!validation.valid) {
        skipped++
        console.warn('[Awakening/Armor] Skipping material ' + validation.id + ': ' + validation.reasons.join('; '))
        return
      }

      const materialPending = []
      const materialOutputs = []

      try {
        materialPending.push({
          id: 'awakening:armor/' + material.id + '/plate',
          json: {
            type: 'overgeared:forging',
            category: 'misc',
            hammering: 3,
            has_quality: false,
            key: { X: validation.plateIngredient },
            need_quenching: false,
            needs_minigame: false,
            pattern: ['X'],
            quality_difficulty: 'none',
            result: { item: material.plate },
            show_notification: true,
            tier: material.tier
          }
        })

        data.templates.forEach(template => {
          const output = material.outputs[template.type]
          materialPending.push({
            id: 'awakening:armor/' + material.id + '/forge/' + template.type,
            json: {
              type: 'overgeared:forging',
              category: 'armors',
              hammering: template.hammering,
              has_polishing: false,
              has_quality: true,
              key: { X: { tag: material.plate_tag } },
              minimum_quality: 'poor',
              need_quenching: false,
              needs_minigame: false,
              pattern: template.pattern,
              quality_difficulty: 'none',
              requires_blueprint: false,
              result: { item: output },
              show_notification: true,
              tier: material.tier
            }
          })
          materialOutputs.push(output)
        })
      } catch (error) {
        skipped++
        console.warn('[Awakening/Armor] Skipping material ' + material.id + ' after preflight: ' + error)
        return
      }

      materialPending.forEach(recipe => pending.push(recipe))
      materialOutputs.forEach(output => outputs.push(output))
    })

    outputs.forEach(output => event.remove({ output: output }))
    pending.forEach(recipe => event.custom(recipe.json).id(recipe.id))

    console.info('[Awakening/Armor] Installed ' + outputs.length + ' armor recipes; ' + pending.length + ' forging recipes; skipped ' + skipped + ' materials. Live verification pending.')
  })
})()
