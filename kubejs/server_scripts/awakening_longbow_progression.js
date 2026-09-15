(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 2 || !Array.isArray(data.materials)) {
      throw new Error('[Awakening/Longbows] Unsupported bow manifest')
    }
    return data
  }

  function ingredientExists(value) {
    try { return Ingredient.of(value).itemIds.size() > 0 } catch (error) { return false }
  }

  function materialKey(material) {
    return material.id === 'wood' ? 'wooden' : material.id
  }

  function removeLegacyLongbowLimbs(event, data) {
    event.remove({ output: 'overgearedspartan:iron_longbow_limb' })

    data.materials.forEach(function (material) {
      event.remove({ output: 'awakening:' + material.id + '_longbow_limb' })
      event.remove({ output: 'awakening:' + materialKey(material) + '_longbow_limb' })
    })
  }

  ServerEvents.recipes(function (event) {
    var data = loadData()
    var wooden = data.materials.find(function (material) { return material.id === 'wood' })
    var installed = 0
    var skipped = 0

    if (!wooden || !wooden.source_longbow) {
      throw new Error('[Awakening/Longbows] Wooden Longbow definition is missing')
    }

    removeLegacyLongbowLimbs(event, data)

    data.materials.forEach(function (material) {
      if (material.id === 'wood') return
      if (!material.source_longbow) {
        console.warn('[Awakening/Longbows] Skipping ' + material.id + ': source Longbow id is missing')
        skipped++
        return
      }

      event.remove({ output: material.source_longbow })

      if (!ingredientExists(wooden.source_longbow)) {
        console.warn('[Awakening/Longbows] Skipping ' + material.id + ': wooden Longbow is not registered (' + wooden.source_longbow + ')')
        skipped++
        return
      }
      if (!ingredientExists(material.source_longbow)) {
        console.warn('[Awakening/Longbows] Skipping ' + material.id + ': output Longbow is not registered (' + material.source_longbow + ')')
        skipped++
        return
      }
      if (!material.crafting_material || !ingredientExists(material.crafting_material)) {
        console.warn('[Awakening/Longbows] Skipping ' + material.id + ': normal crafting material is missing (' + material.crafting_material + ')')
        skipped++
        return
      }

      event.shaped(material.source_longbow, ['M', 'B', 'M'], {
        M: material.crafting_material,
        B: wooden.source_longbow
      }).id('awakening:ranged_bows/' + material.id + '/longbow')
      installed++
    })

    console.info('[Awakening/Longbows] Installed ' + installed + ' crafting-table Longbow recipes; skipped ' + skipped + '. Heated forging and Longbow limbs are disabled.')
  })
})()
