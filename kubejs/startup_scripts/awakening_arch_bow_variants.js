(function () {
  var AWAKENING_ARCH_BOW_MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  function awakeningArchBowLoadData() {
    var data = JSON.parse(JsonIO.readString(AWAKENING_ARCH_BOW_MANIFEST))
    if (!data || data.schema !== 1 || !data.bow_types || !Array.isArray(data.materials)) {
      throw new Error('[Awakening/ArchBows] Unsupported manifest')
    }
    return data
  }

  function awakeningArchBowModel(type) {
    return {
      parent: 'item/generated',
      textures: { layer0: type.model.texture },
      display: {
        thirdperson_righthand: { rotation: [-80, 260, -40], translation: [-1, -2, 2.5], scale: [0.9, 0.9, 0.9] },
        thirdperson_lefthand: { rotation: [-80, -280, 40], translation: [-1, -2, 2.5], scale: [0.9, 0.9, 0.9] },
        firstperson_righthand: { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: [0.68, 0.68, 0.68] },
        firstperson_lefthand: { rotation: [0, 90, -25], translation: [1.13, 3.2, 1.13], scale: [0.68, 0.68, 0.68] }
      },
      overrides: [
        { predicate: { pulling: 1 }, model: type.model.pulling[0] },
        { predicate: { pulling: 1, pull: 0.65 }, model: type.model.pulling[1] },
        { predicate: { pulling: 1, pull: 0.9 }, model: type.model.pulling[2] }
      ]
    }
  }

  StartupEvents.registry('item', function (event) {
    var data = awakeningArchBowLoadData()

    data.materials.forEach(function (material) {
      if (material.existing_outputs) return

      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var itemId = 'awakening:' + material.id + '_' + type.suffix

        event.create(itemId, 'bow')
          .displayName(material.name + ' ' + type.name)
          .maxDamage(type.max_damage)
          .modelJson(awakeningArchBowModel(type))
          .bow(function (bow) {
            bow.modifyBow(function (attributes) {
              attributes
                .fullChargeTick(type.draw_time)
                .arrowSpeed(type.velocity)
                .baseDamage(type.base_damage)
            })
          })
      })
    })
  })
})()
