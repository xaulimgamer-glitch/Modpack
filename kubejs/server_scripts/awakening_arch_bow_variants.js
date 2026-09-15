(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 2 || !data.bow_types || !data.assembly || !Array.isArray(data.materials)) throw new Error('[Awakening/Bows] Unsupported manifest')
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

  function installBaseBowRecipeFromSource(event, data, material, typeId, type) {
    if (!material.source_longbow) return false

    var installed = false
    event.forEachRecipe({ output: material.source_longbow }, function (recipe) {
      if (installed) return

      var raw = String(recipe.json)
      var hasBaseBow = false

      data.materials.forEach(function (candidate) {
        if (!candidate.source_longbow || candidate.source_longbow === material.source_longbow) return
        if (raw.indexOf('"' + candidate.source_longbow + '"') >= 0) hasBaseBow = true
      })

      if (!hasBaseBow) return

      var transformed = raw
      data.materials.forEach(function (candidate) {
        if (!candidate.source_longbow) return
        transformed = transformed.split('"' + candidate.source_longbow + '"').join('"' + output(candidate, typeId, type) + '"')
      })

      event.custom(JSON.parse(transformed)).id('awakening:bows/' + material.id + '/' + type.suffix)
      installed = true
    })

    return installed
  }

  function addition(upgrade) {
    if (upgrade.addition_item) return { item: upgrade.addition_item }
    if (upgrade.addition_tag) return { tag: upgrade.addition_tag.charAt(0) === '#' ? upgrade.addition_tag.substring(1) : upgrade.addition_tag }
    throw new Error('[Awakening/Bows] Smithing upgrade has no addition')
  }

  function leatherPattern(typeId) {
    if (typeId === 'short_bow') return ['MHR', 'RSS']
    if (typeId === 'recurve_bow') return ['RHM', 'R S', 'RSS']
    return ['MHR', 'M S', 'RSS']
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
    var installedBows = 0
    var skipped = 0

    data.materials.forEach(function (material) {
      if (material.id !== 'wood' && material.source_longbow && !ingredientExists(material.source_longbow)) {
        console.warn('[Awakening/Bows] Skipping ' + material.id + ': source Longbow is not registered (' + material.source_longbow + ')')
        skipped++
        return
      }

      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var bowOutput = output(material, typeId, type)

        if (material.id === 'wood') return

        if (material.id === 'leather') {
          event.shaped(bowOutput, leatherPattern(typeId), {
            M: '#forge:leather',
            H: type.handle,
            R: data.assembly.rod,
            S: '#forge:string'
          }).id('awakening:bows/leather/' + type.suffix)
          installedBows++
          return
        }

        if (material.upgrade) {
          var baseMaterial = data.materials.find(function (entry) { return entry.id === material.upgrade.from })
          if (!baseMaterial) {
            console.warn('[Awakening/Bows] Missing smithing base material for ' + material.id)
            skipped++
            return
          }

          var baseOutput = output(baseMaterial, typeId, type)
          if (!ingredientExists(baseOutput)) {
            console.warn('[Awakening/Bows] Missing smithing base bow ' + baseOutput + ' for ' + material.id)
            skipped++
            return
          }

          event.custom({
            type: 'minecraft:smithing_transform',
            template: { item: material.upgrade.template_item },
            base: { item: baseOutput },
            addition: addition(material.upgrade),
            result: { item: bowOutput }
          }).id('awakening:bows/' + material.id + '/' + type.suffix)
          installedBows++
          return
        }

        if (installBaseBowRecipeFromSource(event, data, material, typeId, type)) {
          installedBows++
        } else {
          console.warn('[Awakening/Bows] Skipping ' + material.id + ' ' + typeId + ': no source Longbow recipe using a base bow was found')
          skipped++
        }
      })
    })

    console.info('[Awakening/Bows] Installed ' + installedBows + ' bow recipes; skipped ' + skipped + '.')
  })
})()
