// Status: IMPLEMENTED / STATIC-OBSERVED. Minecraft/JEI verification is pending.
// Every external weapon ID and material tag comes from the pinned manifest.
// No part -> ingot, weapon -> part, or fragment -> ingot conversion is added.

function awakeningPartsCopy(value) {
  return JSON.parse(JSON.stringify(value))
}

function awakeningSteeleafResult(type, item) {
  const thrown = ['throwing_knife', 'tomahawk', 'javelin', 'boomerang']
  if (type === 'longbow') return { item: item }
  if (type === 'heavy_crossbow') {
    return {
      type: 'minecraft:item_nbt',
      item: item,
      nbt: '{Enchantments:[{id:"minecraft:quick_charge",lvl:2s}]}'
    }
  }
  if (type === 'battleaxe') {
    return {
      type: 'minecraft:item_nbt',
      item: item,
      nbt: '{Enchantments:[{id:"minecraft:efficiency",lvl:2s},{id:"minecraft:looting",lvl:2s}]}'
    }
  }
  if (thrown.indexOf(type) >= 0) {
    return {
      type: 'minecraft:item_nbt',
      item: item,
      nbt: '{Enchantments:[{id:"spartanweaponry:lucky_throw",lvl:2s}]}'
    }
  }
  return {
    type: 'minecraft:item_nbt',
    item: item,
    nbt: '{Enchantments:[{id:"minecraft:looting",lvl:2s}]}'
  }
}

function awakeningPartsLoadData() {
  const data = JSON.parse(JsonIO.readString('kubejs/awakening/weapon_parts.json'))
  const twilight = JSON.parse(JsonIO.readString('kubejs/awakening/twilight_weapon_parts.json'))
  if (data.schema !== 1 || twilight.schema !== 1) throw new Error('[Awakening/Parts] Unsupported manifest')

  const ironwood = data.materials.find(material => material.id === 'ironwood')
  if (!ironwood) throw new Error('[Awakening/Parts] Ironwood prototype missing')

  twilight.materials.forEach(material => {
    const generated = awakeningPartsCopy(material)
    generated.weapons = twilight.weapon_types.map(type => {
      const prototype = ironwood.weapons.find(weapon => weapon.type === type)
      const template = data.templates[type]
      if (!prototype || !template) throw new Error('[Awakening/Parts] Missing Twilight prototype/template: ' + type)

      const weapon = awakeningPartsCopy(prototype)
      weapon.part = 'awakening:' + material.id + '_' + template.suffix
      weapon.source_recipe = 'spartantwilight:' + material.id + '_' + type
      weapon.original.key[weapon.material_key] = { tag: material.ingredient_tag }

      const output = 'spartantwilight:' + material.id + '_' + type
      if (material.id === 'steeleaf') {
        weapon.original.result = awakeningSteeleafResult(type, output)
      } else {
        weapon.original.result = { item: output }
      }
      return weapon
    })
    data.materials.push(generated)
  })

  return data
}

function awakeningPartsAssembly(weapon, template) {
  const original = weapon.original
  const recipe = awakeningPartsCopy(template.assembly)
  recipe.result = awakeningPartsCopy(original.result) // Includes Twilight NBT where required.
  recipe.conditions = awakeningPartsCopy(original.conditions || [])
  recipe.group = original.group || ''

  if (recipe.ingredients) {
    // Preserve ALL non-metal components of the original melee recipe. In
    // particular, a pike keeps two poles and Fiery keeps its blaze components.
    recipe.ingredients = [{ item: weapon.part }]
    original.pattern.join('').split('').forEach(symbol => {
      if (symbol !== ' ' && symbol !== weapon.material_key) {
        recipe.ingredients.push(awakeningPartsCopy(original.key[symbol]))
      }
    })
  } else {
    // Ranged and boomerang retain Overgeared Spartan's assembly layout.
    Object.keys(recipe.key).forEach(symbol => {
      const value = recipe.key[symbol]
      if (value.item === template.forging.result.item) {
        recipe.key[symbol] = { item: weapon.part }
      }
    })

    // Preserve the original bow grip (ordinary, blaze, or witherbone) in place
    // of one stick. The rest of the limb/string/hook/plank layout stays intact.
    if (weapon.type === 'longbow' || weapon.type === 'heavy_crossbow') {
      let grip = original.key['|']
      if (!grip) throw new Error('[Awakening/Parts] Missing bow grip: ' + weapon.source_recipe)
      recipe.key.h = awakeningPartsCopy(grip)
      let placed = false
      recipe.pattern = recipe.pattern.map(row => {
        if (placed || row.indexOf('l') < 0) return row
        placed = true
        return row.replace('l', 'h')
      })
      if (!placed) throw new Error('[Awakening/Parts] Missing stick slot')
    }
  }
  return recipe
}

ServerEvents.tags('item', event => {
  const data = awakeningPartsLoadData()
  data.materials.forEach(material => {
    material.weapons.forEach(weapon => {
      event.add('awakening:weapon_parts', weapon.part)
      // Tag-based Overgeared integration; no custom Java Item subclass needed.
      event.add('overgeared:tool_parts', weapon.part)
    })
  })
})

ServerEvents.recipes(event => {
  const data = awakeningPartsLoadData()
  const pending = []
  const outputs = []
  const heating = {}

  function requireIngredient(ingredient, context) {
    if (Ingredient.of(ingredient).itemIds.size() === 0) {
      throw new Error('[Awakening/Parts] Missing ingredient in ' + context + ': ' + JSON.stringify(ingredient))
    }
  }

  function queue(id, json) {
    pending.push({ id: 'awakening:weapon_parts/' + id, json: json })
  }

  function queueHeating(item) {
    if (heating[item]) return
    heating[item] = true
    // Native Overgeared serializer adds Heated NBT to the SAME item, 1 -> 1.
    // No XP farming and no guessed heated registry IDs. Its forge serializer
    // reads requires_heated and rejects ordinary cold stacks.
    queue('heat/' + item.replace(':', '/'), {
      type: 'overgeared:nbt_add_blasting',
      category: 'misc',
      ingredient: { item: item },
      result: { item: item, count: 1 },
      nbt: { Heated: true },
      experience: 0,
      cookingtime: 100
    })
  }

  // Preflight the entire manifest before removing any weapon recipes.
  data.materials.forEach(material => {
    requireIngredient({ tag: material.ingredient_tag }, material.id)
    requireIngredient({ item: material.fragment }, material.id)
    requireIngredient({ tag: 'overgeared:smithing_hammers' }, material.id)
    Ingredient.of('#' + material.ingredient_tag).itemIds.forEach(id => queueHeating(String(id)))
    queueHeating(material.fragment)

    queue(material.id + '/fragments', {
      type: 'overgeared:crafting_shapeless',
      category: 'misc',
      ingredients: [
        { tag: material.ingredient_tag },
        { tag: 'overgeared:smithing_hammers', remainder: true, durability_decrease: 1 }
      ],
      result: { item: material.fragment, count: 9 }
    })

    material.weapons.forEach(weapon => {
      const template = data.templates[weapon.type]
      requireIngredient({ item: weapon.part }, weapon.part)
      requireIngredient({ item: weapon.original.result.item }, weapon.source_recipe)

      const forging = awakeningPartsCopy(template.forging)
      forging.key = {
        X: { tag: material.ingredient_tag, requires_heated: true },
        x: { item: material.fragment, requires_heated: true }
      }
      // Some patterns use only X. Keep only symbols actually present.
      if (forging.pattern.join('').indexOf('x') < 0) delete forging.key.x
      forging.result = { item: weapon.part }
      forging.conditions = awakeningPartsCopy(weapon.original.conditions || [])
      // Use the serializer's actual spelling (the reference uses minimum_quality).
      if (forging.minimum_quality) {
        forging.minimumQuality = forging.minimum_quality
        delete forging.minimum_quality
      }
      queue(material.id + '/forge/' + weapon.type, forging)

      const assembly = awakeningPartsAssembly(weapon, template)
      const ingredients = assembly.ingredients || Object.keys(assembly.key).map(k => assembly.key[k])
      ingredients.forEach(ingredient => requireIngredient(ingredient, weapon.source_recipe))
      queue(material.id + '/assemble/' + weapon.type, assembly)
      outputs.push(weapon.original.result.item)

      if (template.forging.blueprint) {
        queue(material.id + '/tooltype/' + weapon.type, {
          type: 'overgeared:item_to_tooltype',
          item: [{ item: weapon.part }],
          tooltype: template.forging.blueprint[0]
        })
      }
    })
  })

  // Remove by output, including alternate Fiery vial crafts, so direct crafts
  // cannot remain in JEI under a different recipe ID. Add replacements afterwards.
  outputs.forEach(output => event.remove({ output: output }))
  pending.forEach(recipe => event.custom(recipe.json).id(recipe.id))
  console.info('[Awakening/Parts] Installed ' + outputs.length + ' original-weapon assemblies; ' + pending.length + ' recipes. Live verification pending.')
})
