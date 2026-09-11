(function () {
  // Awakening conventional tool parts.
  // Heating and smithing-fragment production stay owned by awakening_weapon_parts.js.
  // This script consumes the same heated material inputs and existing fragments,
  // avoiding duplicate heating/fragment recipes while extending the Overgeared flow
  // to swords, pickaxes, axes, shovels and hoes.

  const AWAKENING_TOOL_PARTS_MANIFEST = 'kubejs/awakening/tool_parts.json'
  const AWAKENING_TOOL_PARTS_HEATED_METALS = 'kubejs/awakening/heated_metals.json'

  function awakeningToolPartsLoadData() {
    const data = JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_MANIFEST))
    if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
      throw new Error('[Awakening/ToolParts] Invalid manifest: ' + AWAKENING_TOOL_PARTS_MANIFEST)
    }
    return data
  }

  function awakeningToolPartsLoadHeatedMetals() {
    const data = JsonIO.read(AWAKENING_TOOL_PARTS_HEATED_METALS)
    const byId = {}
    if (!data || !Array.isArray(data.metals)) return byId
    data.metals.forEach(metal => {
      if (metal && metal.id && metal.heated) byId[metal.id] = metal
    })
    return byId
  }

  function awakeningToolPartId(material, template) {
    return 'awakening:' + material.id + '_' + template.suffix
  }

  function awakeningToolPartsTemplatesForMaterial(data, material) {
    if (!Array.isArray(material.tool_types)) return { valid: true, templates: data.templates, reason: '' }
    const selected = data.templates.filter(template => material.tool_types.indexOf(template.type) !== -1)
    if (selected.length !== material.tool_types.length) {
      return { valid: false, templates: [], reason: 'invalid tool_types selection' }
    }
    return { valid: true, templates: selected, reason: '' }
  }

  function awakeningToolPartsIngredientExists(ingredient) {
    try {
      return Ingredient.of(ingredient).itemIds.size() > 0
    } catch (error) {
      return false
    }
  }

  ServerEvents.tags('item', event => {
    const data = awakeningToolPartsLoadData()
    data.materials.forEach(material => {
      const selection = awakeningToolPartsTemplatesForMaterial(data, material)
      if (!selection.valid) {
        console.warn('[Awakening/ToolParts] Skipping tags for ' + material.id + ': ' + selection.reason)
        return
      }
      selection.templates.forEach(template => {
        const part = awakeningToolPartId(material, template)
        event.add('awakening:tool_parts', part)
        event.add('overgeared:tool_parts', part)
      })
    })
  })

  ServerEvents.recipes(event => {
    const data = awakeningToolPartsLoadData()
    const heatedMetals = awakeningToolPartsLoadHeatedMetals()
    const pending = []
    const outputs = []
    let skipped = 0

    data.materials.forEach(material => {
      const reasons = []
      const selection = awakeningToolPartsTemplatesForMaterial(data, material)
      const heatedMetal = heatedMetals[material.id]
      const forgingIngredient = heatedMetal
        ? { item: heatedMetal.heated }
        : { tag: material.ingredient_tag, requires_heated: true }
      const validationIngredient = heatedMetal
        ? { item: heatedMetal.heated }
        : { tag: material.ingredient_tag }

      if (!selection.valid) reasons.push(selection.reason)
      if (!awakeningToolPartsIngredientExists(validationIngredient)) reasons.push('missing forging material ' + JSON.stringify(validationIngredient))
      if (!awakeningToolPartsIngredientExists({ item: material.fragment })) reasons.push('missing fragment ' + material.fragment)
      if (!awakeningToolPartsIngredientExists({ item: material.handle })) reasons.push('missing handle ' + material.handle)
      if (!awakeningToolPartsIngredientExists({ tag: 'overgeared:smithing_hammers' })) reasons.push('missing overgeared:smithing_hammers')

      selection.templates.forEach(template => {
        const part = awakeningToolPartId(material, template)
        const output = material.outputs ? material.outputs[template.type] : null
        if (!output) {
          reasons.push('missing output for ' + template.type)
          return
        }
        if (!awakeningToolPartsIngredientExists({ item: part })) reasons.push('missing part ' + part)
        if (!awakeningToolPartsIngredientExists({ item: output })) reasons.push('missing output item ' + output)
      })

      if (reasons.length > 0) {
        skipped++
        console.warn('[Awakening/ToolParts] Skipping material ' + material.id + ': ' + reasons.join('; '))
        return
      }

      const materialPending = []
      const materialOutputs = []

      selection.templates.forEach(template => {
        const part = awakeningToolPartId(material, template)
        const output = material.outputs[template.type]

        materialPending.push({
          id: 'awakening:tool_parts/' + material.id + '/forge/' + template.type,
          json: {
            type: 'overgeared:forging',
            blueprint: [template.tooltype],
            category: 'misc',
            hammering: 3,
            has_polishing: true,
            has_quality: true,
            key: { X: forgingIngredient },
            minimumQuality: 'poor',
            need_quenching: true,
            needs_minigame: false,
            pattern: template.pattern,
            quality_difficulty: 'none',
            requires_blueprint: false,
            result: { item: part },
            show_notification: true,
            tier: 'stone'
          }
        })

        materialPending.push({
          id: 'awakening:tool_parts/' + material.id + '/tooltype/' + template.type,
          json: {
            type: 'overgeared:item_to_tooltype',
            item: [{ item: part }],
            tooltype: template.tooltype
          }
        })

        materialPending.push({
          id: 'awakening:tool_parts/' + material.id + '/assemble/' + template.type,
          json: {
            type: 'overgeared:crafting_shapeless',
            category: 'equipment',
            ingredients: [{ item: part }, { item: material.handle }],
            result: { item: output }
          }
        })

        materialOutputs.push(output)
      })

      materialPending.forEach(recipe => pending.push(recipe))
      materialOutputs.forEach(output => outputs.push(output))
    })

    outputs.forEach(output => event.remove({ output: output }))
    pending.forEach(recipe => event.custom(recipe.json).id(recipe.id))

    console.info('[Awakening/ToolParts] Installed ' + outputs.length + ' tool assemblies; ' + pending.length + ' recipes; skipped ' + skipped + ' materials. Live verification pending.')
  })
})()
