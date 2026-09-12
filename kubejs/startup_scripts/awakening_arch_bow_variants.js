(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 2 || !data.bow_types || !data.assembly || !Array.isArray(data.materials)) throw new Error('[Awakening/ArchBows] Unsupported manifest')
    return data
  }

  function model(typeId) {
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
      var hasDedicatedLimbs = !material.existing_outputs && Array.isArray(material.limb_candidates) && material.limb_candidates.length > 0

      if (hasDedicatedLimbs) {
        Object.keys(data.bow_types).forEach(function (typeId) {
          var type = data.bow_types[typeId]
          var limb = event.create('awakening:' + material.id + '_' + limbSuffix(typeId))
            .displayName(material.name + ' ' + type.name + ' Limb')
            .texture('overgearedspartan:item/iron_longbow_limb')

          if (material.color) limb.color(0, parseInt(material.color, 16))
        })
      }

      if (material.existing_outputs) return

      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var item = event.create('awakening:' + material.id + '_' + type.suffix, 'bow')
          .displayName(material.name + ' ' + type.name)
          .maxDamage(type.max_damage)
          .modelJson(model(typeId))

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
