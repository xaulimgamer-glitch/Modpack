(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 2 || !data.bow_types || !data.assembly || !Array.isArray(data.materials)) {
      throw new Error('[Awakening/Bows] Unsupported manifest')
    }
    return data
  }

  function ingredientExists(value) {
    try { return Ingredient.of(value).itemIds.size() > 0 } catch (error) { return false }
  }

  function materialKey(material) {
    return material.id === 'wood' ? 'wooden' : material.id
  }

  function output(material, typeId, type) {
    if (material.id === 'wood') return 'awakening:wooden_' + type.suffix
    if (material.existing_outputs && material.existing_outputs[typeId]) return material.existing_outputs[typeId]
    return 'awakening:' + materialKey(material) + '_' + type.suffix
  }

  function woodenPattern(typeId) {
    if (typeId === 'short_bow') return ['MHR', 'RSS']
    if (typeId === 'recurve_bow') return ['RHM', 'R S', 'RSS']
    return ['MHR', 'M S', 'RSS']
  }

  function legacyLimbSuffix(typeId) {
    return typeId.replace('_bow', 'bow') + '_limb'
  }

  function removeLegacyVariantLimbs(event, data) {
    data.materials.forEach(function (material) {
      var keys = [material.id, materialKey(material)]
      Object.keys(data.bow_types).forEach(function (typeId) {
        keys.forEach(function (key) {
          event.remove({ output: 'awakening:' + key + '_' + legacyLimbSuffix(typeId) })
        })
      })
    })
  }

  ServerEvents.tags('item', function (event) {
    var data = loadData()
    data.materials.forEach(function (material) {
      Object.keys(data.bow_types).forEach(function (typeId) {
        event.add('forge:tools/bows', output(material, typeId, data.bow_types[typeId]))
      })
    })
  })

  ServerEvents.recipes(function (event) {
    var data = loadData()
    var wooden = data.materials.find(function (material) { return material.id === 'wood' })
    var installed = 0
    var skipped = 0

    if (!wooden) throw new Error('[Awakening/Bows] Wooden material definition is missing')

    removeLegacyVariantLimbs(event, data)

    Object.keys(data.bow_types).forEach(function (typeId) {
      var type = data.bow_types[typeId]
      var woodenOutput = output(wooden, typeId, type)

      event.remove({ output: woodenOutput })
      event.shaped(woodenOutput, woodenPattern(typeId), {
        M: '#minecraft:planks',
        H: type.handle,
        R: data.assembly.rod,
        S: type.string
      }).id('awakening:ranged_bows/wood/' + type.suffix)
      installed++

      data.materials.forEach(function (material) {
        if (material.id === 'wood') return

        var bowOutput = output(material, typeId, type)
        var materialIngredient = material.crafting_material

        event.remove({ output: bowOutput })

        if (!materialIngredient || !ingredientExists(materialIngredient)) {
          console.warn('[Awakening/Bows] Skipping ' + material.id + ' ' + typeId + ': normal crafting material is missing (' + materialIngredient + ')')
          skipped++
          return
        }
        if (!ingredientExists(woodenOutput)) {
          console.warn('[Awakening/Bows] Skipping ' + material.id + ' ' + typeId + ': wooden base bow is missing (' + woodenOutput + ')')
          skipped++
          return
        }
        if (!ingredientExists(bowOutput)) {
          console.warn('[Awakening/Bows] Skipping ' + material.id + ' ' + typeId + ': output bow is not registered (' + bowOutput + ')')
          skipped++
          return
        }

        event.shaped(bowOutput, ['M', 'B', 'M'], {
          M: materialIngredient,
          B: woodenOutput
        }).id('awakening:ranged_bows/' + material.id + '/' + type.suffix)
        installed++
      })
    })

    console.info('[Awakening/Bows] Installed ' + installed + ' crafting-table Short/Recurve/Flat bow recipes; skipped ' + skipped + '. Material limbs are disabled.')
  })
})()
