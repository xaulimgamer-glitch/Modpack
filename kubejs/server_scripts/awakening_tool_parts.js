// Awakening conventional tool parts.
// Heating and smithing-fragment production stay owned by awakening_weapon_parts.js.
// This script consumes the same heated material inputs and existing fragments,
// avoiding duplicate heating/fragment recipes while extending the Overgeared flow
// to swords, pickaxes, axes, shovels and hoes.

const AWAKENING_TOOL_PARTS_MANIFEST = 'kubejs/awakening/tool_parts.json'

function awakeningToolPartsLoadData() {
  const data = JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_MANIFEST))
  if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/ToolParts] Invalid manifest: ' + AWAKENING_TOOL_PARTS_MANIFEST)
  }
  return data
}

function awakeningToolPartId(material, template) {
  return 'awakening:' + material.id + '_' + template.suffix
}

function awakeningToolPartsTemplatesForMaterial(data, material) {
  if (!Array.isArray(material.tool_types)) return data.templates

  const selected = data.templates.filter(template => material.tool_types.indexOf(template.type) !== -1)
  if (selected.length !== material.tool_types.length) {
    throw new Error('[Awakening/ToolParts] Invalid tool_types for material: ' + material.id)
  }
  return selected
}

ServerEvents.tags('item', event => {
  const data = awakeningToolPartsLoadData()

  data.materials.forEach(material => {
    awakeningToolPartsTemplatesForMaterial(data, material).forEach(template => {
      const part = awakeningToolPartId(material, template)
      event.add('awakening:tool_parts', part)
      event.add('overgeared:tool_parts', part)
    })
  })
})

ServerEvents.recipes(event => {
  const data = awakeningToolPartsLoadData()
  const pending = []
  const outputs = []

  function requireIngredient(ingredient, context) {
    if (Ingredient.of(ingredient).itemIds.size() === 0) {
      throw new Error('[Awakening/ToolParts] Missing ingredient in ' + context + ': ' + JSON.stringify(ingredient))
    }
  }

  function queue(id, json) {
    pending.push({ id: 'awakening:tool_parts/' + id, json: json })
  }

  data.materials.forEach(material => {
    requireIngredient({ tag: material.ingredient_tag }, material.id)
    requireIngredient({ item: material.fragment }, material.id)
    requireIngredient({ item: material.handle }, material.id)
    requireIngredient({ tag: 'overgeared:smithing_hammers' }, material.id)

    awakeningToolPartsTemplatesForMaterial(data, material).forEach(template => {
      const part = awakeningToolPartId(material, template)
      const output = material.outputs[template.type]

      if (!output) {
        throw new Error('[Awakening/ToolParts] Missing output for ' + material.id + '/' + template.type)
      }

      requireIngredient({ item: part }, part)
      requireIngredient({ item: output }, material.id + '/' + template.type)

      queue(material.id + '/forge/' + template.type, {
        type: 'overgeared:forging',
        blueprint: [template.tooltype],
        category: 'misc',
        hammering: 3,
        has_polishing: true,
        has_quality: true,
        key: {
          X: { tag: material.ingredient_tag, requires_heated: true }
        },
        minimumQuality: 'poor',
        need_quenching: true,
        needs_minigame: false,
        pattern: template.pattern,
        quality_difficulty: 'none',
        requires_blueprint: false,
        result: { item: part },
        show_notification: true,
        tier: 'stone'
      })

      queue(material.id + '/tooltype/' + template.type, {
        type: 'overgeared:item_to_tooltype',
        item: [{ item: part }],
        tooltype: template.tooltype
      })

      queue(material.id + '/assemble/' + template.type, {
        type: 'overgeared:crafting_shapeless',
        category: 'equipment',
        ingredients: [
          { item: part },
          { item: material.handle }
        ],
        result: { item: output }
      })

      outputs.push(output)
    })
  })

  outputs.forEach(output => event.remove({ output: output }))
  pending.forEach(recipe => event.custom(recipe.json).id(recipe.id))

  console.info('[Awakening/ToolParts] Installed ' + outputs.length + ' tool assemblies; ' + pending.length + ' recipes. Live verification pending.')
})
