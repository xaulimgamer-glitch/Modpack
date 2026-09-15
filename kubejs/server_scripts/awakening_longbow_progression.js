(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'
  var HEATED_METALS = 'kubejs/awakening/heated_metals.json'

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 2 || !Array.isArray(data.materials)) throw new Error('[Awakening/Longbows] Unsupported bow manifest')
    return data
  }

  function loadHeatedMetals() {
    var data = JsonIO.read(HEATED_METALS)
    var byId = {}
    if (!data || !Array.isArray(data.metals)) return byId
    data.metals.forEach(function (metal) {
      if (metal && metal.id && metal.heated) byId[metal.id] = metal
    })
    return byId
  }

  function ingredientExists(value) {
    try { return Ingredient.of(value).itemIds.size() > 0 } catch (error) { return false }
  }

  function isCustomDirectLongbow(material) {
    if (!material || material.id === 'wood' || material.id === 'leather' || material.upgrade || !material.source_longbow) return false
    return material.source_longbow.indexOf('spartanweaponry:') !== 0
  }

  function findReferenceRecipe(event, data, heatedMetals) {
    var wooden = data.materials.find(function (material) { return material.id === 'wood' })
    if (!wooden || !wooden.source_longbow) return null

    var preferred = ['copper', 'iron', 'gold', 'steel', 'silver']
    for (var i = 0; i < preferred.length; i++) {
      var material = data.materials.find(function (entry) { return entry.id === preferred[i] })
      var heated = material ? heatedMetals[material.id] : null
      if (!material || !material.source_longbow || !heated || !heated.heated) continue

      var reference = null
      event.forEachRecipe({ output: material.source_longbow }, function (recipe) {
        if (reference) return
        var raw = String(recipe.json)
        if (raw.indexOf('"' + wooden.source_longbow + '"') < 0) return
        if (raw.indexOf('"' + heated.heated + '"') < 0) return
        reference = {
          raw: raw,
          output: material.source_longbow,
          heated: heated.heated,
          base: wooden.source_longbow
        }
      })

      if (reference) return reference
    }

    return null
  }

  ServerEvents.recipes(function (event) {
    var data = loadData()
    var heatedMetals = loadHeatedMetals()
    var reference = findReferenceRecipe(event, data, heatedMetals)
    var installed = 0
    var skipped = 0

    if (!reference) {
      console.warn('[Awakening/Longbows] No loaded Longbow recipe using a wooden Longbow base and heated material was found; custom Longbow migration skipped.')
      return
    }

    data.materials.forEach(function (material) {
      if (!isCustomDirectLongbow(material)) return

      if (!ingredientExists(material.source_longbow)) {
        console.warn('[Awakening/Longbows] Skipping ' + material.id + ': source Longbow is not registered (' + material.source_longbow + ')')
        skipped++
        return
      }

      var heated = heatedMetals[material.id]
      if (!heated || !heated.heated || !ingredientExists(heated.heated)) {
        console.warn('[Awakening/Longbows] Skipping ' + material.id + ': heated material is not registered')
        skipped++
        return
      }

      var transformed = reference.raw
        .split('"' + reference.output + '"').join('"' + material.source_longbow + '"')
        .split('"' + reference.heated + '"').join('"' + heated.heated + '"')

      event.remove({ output: material.source_longbow })
      event.custom(JSON.parse(transformed)).id('awakening:bows/' + material.id + '/longbow')
      installed++
    })

    console.info('[Awakening/Longbows] Installed ' + installed + ' base-bow Longbow recipes from the loaded ' + reference.output + ' recipe; skipped ' + skipped + '.')
  })
})()
