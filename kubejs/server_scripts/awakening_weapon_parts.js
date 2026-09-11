(function () {
  // Status: IMPLEMENTED / STATIC-OBSERVED. Minecraft/JEI verification is pending.
  // Every external weapon ID and material tag comes from pinned manifests.
  // No part -> ingot, weapon -> part, or fragment -> ingot conversion is added.
  // Rhino/KubeJS 1.20.1 compatibility: closure locals use function-scoped var
  // instead of block-scoped const/let to avoid lexical redeclaration leaks.

  var AWAKENING_WEAPON_HEATED_METALS = 'kubejs/awakening/heated_metals.json'

  function awakeningPartsCopy(value) {
    return JSON.parse(JSON.stringify(value))
  }

  function awakeningPartsLoadHeatedMetals() {
    var data = JsonIO.read(AWAKENING_WEAPON_HEATED_METALS)
    var byId = {}
    if (!data || !Array.isArray(data.metals)) return byId
    data.metals.forEach(function (metal) {
      if (metal && metal.id && metal.heated) byId[metal.id] = metal
    })
    return byId
  }

  function awakeningSteeleafResult(type, item) {
    var thrown = ['throwing_knife', 'tomahawk', 'javelin', 'boomerang']
    if (type === 'longbow') return { item: item }
    if (type === 'heavy_crossbow') {
      return { type: 'minecraft:item_nbt', item: item, nbt: '{Enchantments:[{id:"minecraft:quick_charge",lvl:2s}]}' }
    }
    if (type === 'battleaxe') {
      return { type: 'minecraft:item_nbt', item: item, nbt: '{Enchantments:[{id:"minecraft:efficiency",lvl:2s},{id:"minecraft:looting",lvl:2s}]}' }
    }
    if (thrown.indexOf(type) >= 0) {
      return { type: 'minecraft:item_nbt', item: item, nbt: '{Enchantments:[{id:"spartanweaponry:lucky_throw",lvl:2s}]}' }
    }
    return { type: 'minecraft:item_nbt', item: item, nbt: '{Enchantments:[{id:"minecraft:looting",lvl:2s}]}' }
  }

  function awakeningRetargetTagCondition(value, oldTag, newTag) {
    if (!value || typeof value !== 'object') return
    if (value.tag === oldTag) value.tag = newTag
    Object.keys(value).forEach(function (key) {
      awakeningRetargetTagCondition(value[key], oldTag, newTag)
    })
  }

  function awakeningPartsLoadData() {
    var data = JSON.parse(JsonIO.readString('kubejs/awakening/weapon_parts.json'))
    var twilight = JSON.parse(JsonIO.readString('kubejs/awakening/twilight_weapon_parts.json'))
    var cataclysm = JSON.parse(JsonIO.readString('kubejs/awakening/cataclysm_weapon_parts.json'))
    if (!data || !twilight || !cataclysm || data.schema !== 1 || twilight.schema !== 1 || cataclysm.schema !== 1) {
      throw new Error('[Awakening/Parts] Unsupported manifest')
    }

    var ironwood = data.materials.find(function (material) { return material.id === 'ironwood' })
    if (!ironwood) {
      console.warn('[Awakening/Parts] Ironwood prototype missing; Twilight generated materials will be skipped.')
    } else {
      twilight.materials.forEach(function (material) {
        var generated = awakeningPartsCopy(material)
        var generatedWeapons = []
        var reasons = []

        twilight.weapon_types.forEach(function (type) {
          var prototype = ironwood.weapons.find(function (weapon) { return weapon.type === type })
          var template = data.templates[type]
          if (!prototype || !template) {
            reasons.push('missing Twilight prototype/template ' + type)
            return
          }
          var weapon = awakeningPartsCopy(prototype)
          weapon.part = 'awakening:' + material.id + '_' + template.suffix
          weapon.source_recipe = 'spartantwilight:' + material.id + '_' + type
          weapon.original.key[weapon.material_key] = { tag: material.ingredient_tag }
          var output = 'spartantwilight:' + material.id + '_' + type
          weapon.original.result = material.id === 'steeleaf'
            ? awakeningSteeleafResult(type, output)
            : { item: output }
          generatedWeapons.push(weapon)
        })

        if (reasons.length > 0) {
          console.warn('[Awakening/Parts] Skipping generated Twilight material ' + material.id + ': ' + reasons.join('; '))
          return
        }
        generated.weapons = generatedWeapons
        data.materials.push(generated)
      })
    }

    var cataclysmPrototype = data.materials.find(function (material) { return material.id === cataclysm.prototype })
    if (!cataclysmPrototype) {
      console.warn('[Awakening/Parts] Cataclysm prototype missing: ' + cataclysm.prototype + '; generated Cataclysm materials will be skipped.')
    } else {
      cataclysm.materials.forEach(function (material) {
        var generated = awakeningPartsCopy(material)
        var generatedWeapons = []
        var reasons = []

        cataclysmPrototype.weapons.forEach(function (prototype) {
          var template = data.templates[prototype.type]
          if (!template) {
            reasons.push('missing Cataclysm template ' + prototype.type)
            return
          }
          var weapon = awakeningPartsCopy(prototype)
          weapon.part = 'awakening:' + material.id + '_' + template.suffix
          weapon.source_recipe = 'spartancataclysm:' + material.id + '_' + prototype.type
          weapon.original.key[weapon.material_key] = { tag: material.ingredient_tag }
          awakeningRetargetTagCondition(weapon.original.conditions, cataclysmPrototype.ingredient_tag, material.ingredient_tag)
          weapon.original.result = { item: 'spartancataclysm:' + material.id + '_' + prototype.type }
          generatedWeapons.push(weapon)
        })

        if (reasons.length > 0) {
          console.warn('[Awakening/Parts] Skipping generated Cataclysm material ' + material.id + ': ' + reasons.join('; '))
          return
        }
        generated.weapons = generatedWeapons
        data.materials.push(generated)
      })
    }

    return data
  }

  function awakeningPartsAssembly(weapon, template) {
    var original = weapon.original
    var recipe = awakeningPartsCopy(template.assembly)
    recipe.result = awakeningPartsCopy(original.result)
    recipe.conditions = awakeningPartsCopy(original.conditions || [])
    recipe.group = original.group || ''

    if (recipe.ingredients) {
      recipe.ingredients = [{ item: weapon.part }]
      original.pattern.join('').split('').forEach(function (symbol) {
        if (symbol !== ' ' && symbol !== weapon.material_key) {
          recipe.ingredients.push(awakeningPartsCopy(original.key[symbol]))
        }
      })
    } else {
      Object.keys(recipe.key).forEach(function (symbol) {
        var value = recipe.key[symbol]
        if (value.item === template.forging.result.item) recipe.key[symbol] = { item: weapon.part }
      })

      if (weapon.type === 'longbow' || weapon.type === 'heavy_crossbow') {
        var grip = original.key['|']
        if (!grip) throw new Error('missing bow grip: ' + weapon.source_recipe)
        recipe.key.h = awakeningPartsCopy(grip)
        var placed = false
        recipe.pattern = recipe.pattern.map(function (row) {
          if (placed || row.indexOf('l') < 0) return row
          placed = true
          return row.replace('l', 'h')
        })
        if (!placed) throw new Error('missing stick slot: ' + weapon.source_recipe)
        if (weapon.type === 'longbow' && original.key['/']) recipe.key.l = awakeningPartsCopy(original.key['/'])
      }
    }
    return recipe
  }

  function awakeningPartsIngredientExists(ingredient) {
    try {
      return Ingredient.of(ingredient).itemIds.size() > 0
    } catch (error) {
      return false
    }
  }

  ServerEvents.tags('item', function (event) {
    var data = awakeningPartsLoadData()
    data.materials.forEach(function (material) {
      if (!material || !Array.isArray(material.weapons)) {
        console.warn('[Awakening/Parts] Skipping malformed weapon-part tag material: ' + JSON.stringify(material))
        return
      }
      material.weapons.forEach(function (weapon) {
        if (!weapon || !weapon.part) return
        event.add('awakening:weapon_parts', weapon.part)
        event.add('overgeared:tool_parts', weapon.part)
      })
    })
  })

  ServerEvents.recipes(function (event) {
    var data = awakeningPartsLoadData()
    var heatedMetals = awakeningPartsLoadHeatedMetals()
    var pending = []
    var outputs = []
    var heating = {}
    var skipped = 0

    function queue(id, json) {
      pending.push({ id: 'awakening:weapon_parts/' + id, json: json })
    }

    function queueHeating(item) {
      if (heating[item]) return
      heating[item] = true
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

    data.materials.forEach(function (material) {
      var reasons = []
      var materialPending = []
      var materialOutputs = []
      var materialHeating = []
      var heatedMetal = material && material.id ? heatedMetals[material.id] : null
      var forgingMaterial = heatedMetal
        ? { item: heatedMetal.heated }
        : { tag: material.ingredient_tag, requires_heated: true }
      var forgingValidation = heatedMetal
        ? { item: heatedMetal.heated }
        : { tag: material.ingredient_tag }

      if (!material || !material.id) reasons.push('missing material id')
      if (!material || !material.ingredient_tag) reasons.push('missing ingredient tag')
      if (!material || !material.fragment) reasons.push('missing fragment item id')
      if (!material || !Array.isArray(material.weapons)) reasons.push('missing weapons list')
      if (material && material.ingredient_tag && !awakeningPartsIngredientExists(forgingValidation)) reasons.push('missing forging material ' + JSON.stringify(forgingValidation))
      if (material && material.fragment && !awakeningPartsIngredientExists({ item: material.fragment })) reasons.push('missing fragment ' + material.fragment)
      if (!awakeningPartsIngredientExists({ tag: 'overgeared:smithing_hammers' })) reasons.push('missing overgeared:smithing_hammers')

      if (reasons.length === 0 && !heatedMetal) {
        Ingredient.of('#' + material.ingredient_tag).itemIds.forEach(function (id) { materialHeating.push(String(id)) })
      }
      if (reasons.length === 0) materialHeating.push(material.fragment)

      if (reasons.length === 0) {
        materialPending.push({
          id: material.id + '/fragments',
          json: {
            type: 'overgeared:crafting_shapeless',
            category: 'misc',
            ingredients: [
              { tag: material.ingredient_tag },
              { tag: 'overgeared:smithing_hammers', remainder: true, durability_decrease: 1 }
            ],
            result: { item: material.fragment, count: 9 }
          }
        })
      }

      if (reasons.length === 0) {
        try {
          material.weapons.forEach(function (weapon) {
            var template = data.templates[weapon.type]
            if (!template) {
              reasons.push('missing template for ' + weapon.type)
              return
            }
            if (!weapon.part || !awakeningPartsIngredientExists({ item: weapon.part })) {
              reasons.push('missing part ' + (weapon.part || '<undefined>'))
              return
            }
            var outputItem = weapon.original && weapon.original.result ? weapon.original.result.item : null
            if (!outputItem || !awakeningPartsIngredientExists({ item: outputItem })) {
              reasons.push('missing output item for ' + (weapon.source_recipe || weapon.type))
              return
            }

            var forging = awakeningPartsCopy(template.forging)
            forging.key = {
              X: forgingMaterial,
              x: { item: material.fragment, requires_heated: true }
            }
            if (forging.pattern.join('').indexOf('x') < 0) delete forging.key.x
            forging.result = { item: weapon.part }
            forging.conditions = awakeningPartsCopy(weapon.original.conditions || [])
            if (forging.minimum_quality) {
              forging.minimumQuality = forging.minimum_quality
              delete forging.minimum_quality
            }

            var assembly = awakeningPartsAssembly(weapon, template)
            var ingredients = assembly.ingredients || Object.keys(assembly.key).map(function (key) { return assembly.key[key] })
            ingredients.forEach(function (ingredient) {
              if (!awakeningPartsIngredientExists(ingredient)) {
                reasons.push('missing assembly ingredient in ' + weapon.source_recipe + ': ' + JSON.stringify(ingredient))
              }
            })
            if (reasons.length > 0) return

            materialPending.push({ id: material.id + '/forge/' + weapon.type, json: forging })
            materialPending.push({ id: material.id + '/assemble/' + weapon.type, json: assembly })
            materialOutputs.push(outputItem)

            if (template.forging.blueprint) {
              materialPending.push({
                id: material.id + '/tooltype/' + weapon.type,
                json: {
                  type: 'overgeared:item_to_tooltype',
                  item: [{ item: weapon.part }],
                  tooltype: template.forging.blueprint[0]
                }
              })
            }
          })
        } catch (error) {
          reasons.push(String(error))
        }
      }

      if (reasons.length > 0) {
        skipped++
        console.warn('[Awakening/Parts] Skipping material ' + (material && material.id ? material.id : '<unknown>') + ': ' + reasons.join('; '))
        return
      }

      materialHeating.forEach(function (item) { queueHeating(item) })
      materialPending.forEach(function (recipe) { queue(recipe.id, recipe.json) })
      materialOutputs.forEach(function (output) { outputs.push(output) })
    })

    outputs.forEach(function (output) { event.remove({ output: output }) })
    pending.forEach(function (recipe) { event.custom(recipe.json).id(recipe.id) })
    console.info('[Awakening/Parts] Installed ' + outputs.length + ' original-weapon assemblies; ' + pending.length + ' recipes; skipped ' + skipped + ' materials. Live verification pending.')
  })
})()
