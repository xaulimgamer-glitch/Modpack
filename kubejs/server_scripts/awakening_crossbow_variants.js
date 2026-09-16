(function () {
  var MANIFEST = 'kubejs/awakening/crossbow_variants.json'

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 3 || !data.families || !Array.isArray(data.materials)) {
      throw new Error('[Awakening/Crossbows] Unsupported manifest')
    }
    return data
  }

  function ingredientExists(value) {
    try { return Ingredient.of(value).itemIds.size() > 0 } catch (error) { return false }
  }

  function materialKey(material) {
    return material.id === 'wood' ? 'wooden' : material.id
  }

  function output(material, familyId, family) {
    if (familyId === 'heavy_crossbow') return material.heavy_output
    return 'awakening:' + materialKey(material) + '_' + family.suffix
  }

  function woodenRecipe(familyId) {
    if (familyId === 'pistol_crossbow') {
      return {
        pattern: ['RSR', ' TH'],
        key: {
          R: '#forge:rods/wooden',
          S: 'minecraft:string',
          T: 'minecraft:tripwire_hook',
          H: 'spartanweaponry:simple_handle'
        }
      }
    }

    if (familyId === 'heavy_crossbow') {
      return {
        pattern: ['RSR', 'STS', 'PHP'],
        key: {
          R: '#forge:rods/wooden',
          S: 'minecraft:string',
          T: 'minecraft:tripwire_hook',
          P: '#minecraft:planks',
          H: 'spartanweaponry:handle'
        }
      }
    }

    return {
      pattern: ['RPR', 'STS', 'PHP'],
      key: {
        R: '#forge:rods/wooden',
        S: 'minecraft:string',
        T: 'minecraft:tripwire_hook',
        P: '#minecraft:planks',
        H: 'spartanweaponry:handle'
      }
    }
  }

  function keyToIngredients(recipe) {
    return Object.keys(recipe.key).map(function (key) { return recipe.key[key] })
  }

  ServerEvents.recipes(function (event) {
    var data = loadData()
    var wooden = data.materials.find(function (material) { return material.id === 'wood' })
    var familyIds = ['pistol_crossbow', 'heavy_crossbow', 'arbalest']
    var installed = 0
    var skipped = 0

    if (!wooden) throw new Error('[Awakening/Crossbows] Wooden material definition is missing')

    familyIds.forEach(function (familyId) {
      var family = data.families[familyId]
      var woodenOutput = output(wooden, familyId, family)
      var baseRecipe = woodenRecipe(familyId)

      if (!ingredientExists(woodenOutput)) {
        console.warn('[Awakening/Crossbows] Skipping Wooden ' + family.name + ': output is not registered (' + woodenOutput + ')')
        skipped++
        return
      }

      var missingBaseIngredient = keyToIngredients(baseRecipe).find(function (ingredient) {
        return !ingredientExists(ingredient)
      })
      if (missingBaseIngredient) {
        throw new Error('[Awakening/Crossbows] Missing Wooden ' + family.name + ' ingredient: ' + missingBaseIngredient)
      }

      event.remove({ output: woodenOutput })
      event.shaped(woodenOutput, baseRecipe.pattern, baseRecipe.key)
        .id('awakening:crossbows/wood/' + family.suffix)
      installed++

      data.materials.forEach(function (material) {
        if (material.id === 'wood') return

        var materialOutput = output(material, familyId, family)
        var materialIngredient = material.crafting_material

        event.remove({ output: materialOutput })

        if (!materialIngredient || !ingredientExists(materialIngredient)) {
          console.warn('[Awakening/Crossbows] Skipping ' + material.id + ' ' + familyId + ': normal crafting material is missing (' + materialIngredient + ')')
          skipped++
          return
        }
        if (!ingredientExists(woodenOutput)) {
          console.warn('[Awakening/Crossbows] Skipping ' + material.id + ' ' + familyId + ': Wooden base is missing (' + woodenOutput + ')')
          skipped++
          return
        }
        if (!ingredientExists(materialOutput)) {
          console.warn('[Awakening/Crossbows] Skipping ' + material.id + ' ' + familyId + ': output is not registered (' + materialOutput + ')')
          skipped++
          return
        }

        event.shaped(materialOutput, ['M', 'B', 'M'], {
          M: materialIngredient,
          B: woodenOutput
        }).id('awakening:crossbows/' + material.id + '/' + family.suffix)
        installed++
      })
    })

    console.info('[Awakening/Crossbows] Installed ' + installed + ' Wooden/material crossbow recipes; skipped ' + skipped + '. Limbs and heated materials are not used.')
  })
})()
