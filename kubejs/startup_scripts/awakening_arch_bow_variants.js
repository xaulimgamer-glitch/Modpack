(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 2 || !data.bow_types || !data.assembly || !Array.isArray(data.materials)) throw new Error('[Awakening/Bows] Unsupported manifest')
    return data
  }

  function materialKey(material) {
    return material.id === 'wood' ? 'wooden' : material.id
  }

  function materialName(material) {
    return material.id === 'wood' ? 'Wooden' : material.name
  }

  function model(typeId, material) {
    if (material.id === 'wood') {
      var base = 'awakening:item/bows/wooden_' + typeId
      var pulling = base + '_pulling_'
      return {
        parent: 'minecraft:item/generated',
        textures: { layer0: base },
        overrides: [
          { predicate: { pulling: 1 }, model: pulling + '0' },
          { predicate: { pulling: 1, pull: 0.65 }, model: pulling + '1' },
          { predicate: { pulling: 1, pull: 0.9 }, model: pulling + '2' }
        ]
      }
    }

    var child = 'awakening:item/bows/' + typeId + '_pulling_'
    return {
      parent: child + '0',
      overrides: [
        { predicate: { pulling: 1 }, model: child + '0' },
        { predicate: { pulling: 1, pull: 0.65 }, model: child + '1' },
        { predicate: { pulling: 1, pull: 0.9 }, model: child + '2' }
      ]
    }
  }

  function limbSuffix(typeId) {
    return typeId.replace('_bow', 'bow') + '_limb'
  }

  StartupEvents.registry('item', function (event) {
    var data = loadData()

    data.materials.forEach(function (material) {
      var hasDedicatedLimbs = material.id !== 'leather' &&
        !material.existing_outputs &&
        Array.isArray(material.limb_candidates) &&
        material.limb_candidates.length > 0

      if (hasDedicatedLimbs) {
        Object.keys(data.bow_types).forEach(function (typeId) {
          var type = data.bow_types[typeId]
          var limb = event.create('awakening:' + materialKey(material) + '_' + limbSuffix(typeId))
            .displayName(materialName(material) + ' ' + type.name + ' Limb')
            .texture('overgearedspartan:item/iron_longbow_limb')

          if (material.color) limb.color(0, parseInt(material.color, 16))
        })
      }

      if (material.existing_outputs && material.id !== 'wood') return

      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var item = event.create('awakening:' + materialKey(material) + '_' + type.suffix, 'bow')
          .displayName(materialName(material) + ' ' + type.name)
          .maxDamage(type.max_damage)
          .modelJson(model(typeId, material))

        if (material.color) item.color(0, parseInt(material.color, 16))
        item.bow(function (bow) {
          bow.modifyBow(function (attributes) {
            attributes.fullChargeTick(type.draw_time).arrowSpeed(type.velocity).baseDamage(type.base_damage)
          })
        })
      })
    })
  })
})()
