(function () {
  var AWAKENING_ARCH_BOW_MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  function awakeningArchBowLoadData() {
    var data = JSON.parse(JsonIO.readString(AWAKENING_ARCH_BOW_MANIFEST))
    if (!data || data.schema !== 1 || !data.bow_types || !Array.isArray(data.materials)) {
      throw new Error('[Awakening/ArchBows] Unsupported manifest')
    }
    return data
  }

  function awakeningArchBowIngredientExists(value) {
    try {
      return Ingredient.of(value).itemIds.size() > 0
    } catch (error) {
      return false
    }
  }

  function awakeningArchBowOutput(material, typeId, type) {
    if (material.existing_outputs && material.existing_outputs[typeId]) return material.existing_outputs[typeId]
    return 'awakening:' + material.id + '_' + type.suffix
  }

  function awakeningArchBowFindLimb(material) {
    var candidates = material.limb_candidates || []
    for (var i = 0; i < candidates.length; i++) {
      if (awakeningArchBowIngredientExists(candidates[i])) return candidates[i]
    }
    return null
  }

  ServerEvents.tags('item', function (event) {
    var data = awakeningArchBowLoadData()
    data.materials.forEach(function (material) {
      Object.keys(data.bow_types).forEach(function (typeId) {
        event.add('forge:tools/bows', awakeningArchBowOutput(material, typeId, data.bow_types[typeId]))
      })
    })
  })

  ServerEvents.recipes(function (event) {
    var data = awakeningArchBowLoadData()

    data.materials.forEach(function (material) {
      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var output = awakeningArchBowOutput(material, typeId, type)

        if (material.id === 'wood') return

        if (material.upgrade) {
          var baseMaterial = data.materials.find(function (entry) { return entry.id === material.upgrade.from })
          if (!baseMaterial) {
            console.warn('[Awakening/ArchBows] Missing smithing base material for ' + material.id)
            return
          }
          event.custom({
            type: 'minecraft:smithing_transform',
            template: { item: material.upgrade.template },
            base: { item: awakeningArchBowOutput(baseMaterial, typeId, type) },
            addition: { tag: material.upgrade.addition.substring(1) },
            result: { item: output }
          }).id('awakening:arch_bows/' + material.id + '/' + type.suffix)
          return
        }

        var limb = awakeningArchBowFindLimb(material)
        var ingredients = []
        if (limb) {
          ingredients.push(limb)
        } else {
          for (var i = 0; i < type.material_count; i++) ingredients.push(material.ingredient)
        }
        ingredients.push(type.handle)
        ingredients.push(type.string)

        event.shapeless(output, ingredients).id('awakening:arch_bows/' + material.id + '/' + type.suffix)
      })
    })
  })
})()
