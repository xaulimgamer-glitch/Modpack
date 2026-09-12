(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'
  var HEATED_METALS = 'kubejs/awakening/heated_metals.json'
  var WEAPON_PARTS = 'kubejs/awakening/weapon_parts.json'
  var TWILIGHT_PARTS = 'kubejs/awakening/twilight_weapon_parts.json'
  var CATACLYSM_PARTS = 'kubejs/awakening/cataclysm_weapon_parts.json'
  var LIMB_PATTERNS = {
    short_bow: ['XxX', ' x ', ' X '],
    recurve_bow: ['xXX', ' X ', 'x  '],
    flat_bow: ['XXX', 'x x']
  }
  var FULL_ONLY_LIMB_PATTERNS = {
    short_bow: ['XXX', ' X ', ' X '],
    recurve_bow: [' XX', 'XX ', 'X  '],
    flat_bow: ['XXX', 'X X']
  }

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 2 || !data.bow_types || !data.assembly || !Array.isArray(data.materials)) throw new Error('[Awakening/Bows] Unsupported manifest')
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

  function loadCustomPartMaterials() {
    var byId = {}
    var manifests = [
      JSON.parse(JsonIO.readString(WEAPON_PARTS)),
      JSON.parse(JsonIO.readString(TWILIGHT_PARTS)),
      JSON.parse(JsonIO.readString(CATACLYSM_PARTS))
    ]

    manifests.forEach(function (data) {
      if (!data || !Array.isArray(data.materials)) return
      data.materials.forEach(function (material) {
        if (material && material.id && material.ingredient_tag && material.fragment) byId[material.id] = material
      })
    })
    return byId
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

  function findSourceLimb(material) {
    var candidates = material.limb_candidates || []
    for (var i = 0; i < candidates.length; i++) {
      if (ingredientExists(candidates[i])) return candidates[i]
    }
    return null
  }

  function limbSuffix(typeId) {
    return typeId.replace('_bow', 'bow') + '_limb'
  }

  function limb(material, typeId) {
    return 'awakening:' + materialKey(material) + '_' + limbSuffix(typeId)
  }

  function limbPattern(typeId, fullOnly) {
    var patterns = fullOnly ? FULL_ONLY_LIMB_PATTERNS : LIMB_PATTERNS
    var pattern = patterns[typeId]
    if (!pattern) throw new Error('[Awakening/Bows] Missing limb forging pattern for ' + typeId)
    return pattern
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

        var hasDedicatedLimb = material.id !== 'leather' &&
          !material.existing_outputs &&
          Array.isArray(material.limb_candidates) &&
          material.limb_candidates.length > 0

        if (hasDedicatedLimb) {
          var part = limb(material, typeId)
          event.add('awakening:bow_limbs', part)
          event.add('awakening:weapon_parts', part)
          event.add('overgeared:tool_parts', part)
        }
      })
    })
  })

  ServerEvents.recipes(function (event) {
    var data = loadData()
    var heatedMetals = loadHeatedMetals()
    var customPartMaterials = loadCustomPartMaterials()
    var installedBows = 0
    var installedLimbs = 0
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

        if (!Array.isArray(material.limb_candidates) || material.limb_candidates.length === 0) return

        var bowLimb = limb(material, typeId)
        if (!ingredientExists(bowLimb)) {
          console.warn('[Awakening/Bows] Missing registered limb ' + bowLimb)
          skipped++
          return
        }

        var forgeInstalled = false
        var customMaterial = customPartMaterials[material.id]
        var heated = heatedMetals[material.id]

        if (customMaterial) {
          var fullMaterial = heated
            ? { item: heated.heated }
            : { tag: customMaterial.ingredient_tag, requires_heated: true }

          event.custom({
            type: 'overgeared:forging',
            category: 'misc',
            hammering: 3,
            has_quality: false,
            key: {
              X: fullMaterial,
              x: { item: customMaterial.fragment, requires_heated: true }
            },
            need_quenching: false,
            needs_minigame: false,
            pattern: limbPattern(typeId, false),
            quality_difficulty: 'none',
            result: { item: bowLimb },
            show_notification: true,
            tier: 'stone'
          }).id('awakening:bows/' + material.id + '/forge/' + limbSuffix(typeId))
          forgeInstalled = true
        } else {
          var sourceLimb = findSourceLimb(material)
          if (sourceLimb) {
            event.forEachRecipe({ type: 'overgeared:forging', output: sourceLimb }, function (recipe) {
              if (forgeInstalled) return
              var forging = JSON.parse(recipe.json)
              forging.pattern = limbPattern(typeId, !(forging.key && forging.key.x))
              forging.result = { item: bowLimb }
              event.custom(forging).id('awakening:bows/' + material.id + '/forge/' + limbSuffix(typeId))
              forgeInstalled = true
            })
          }

          if (!forgeInstalled && heated) {
            event.custom({
              type: 'overgeared:forging',
              category: 'misc',
              hammering: 3,
              has_quality: false,
              key: { X: { item: heated.heated } },
              need_quenching: false,
              needs_minigame: false,
              pattern: limbPattern(typeId, true),
              quality_difficulty: 'none',
              result: { item: bowLimb },
              show_notification: true,
              tier: 'stone'
            }).id('awakening:bows/' + material.id + '/forge/' + limbSuffix(typeId))
            forgeInstalled = true
          }
        }

        if (!forgeInstalled) {
          console.warn('[Awakening/Bows] Skipping ' + material.id + ' ' + typeId + ': no heated-metal Longbow Limb forging recipe was found')
          skipped++
          return
        }

        installedLimbs++
        event.shaped(bowOutput, data.assembly.pattern, {
          x: bowLimb,
          h: type.handle,
          l: data.assembly.rod,
          s: '#forge:string'
        }).id('awakening:bows/' + material.id + '/' + type.suffix)
        installedBows++
      })
    })

    console.info('[Awakening/Bows] Installed ' + installedLimbs + ' forged bow-limb recipes and ' + installedBows + ' bow recipes; skipped ' + skipped + '.')
  })
})()
