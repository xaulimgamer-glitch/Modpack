(function () {
  var MANIFEST = 'kubejs/awakening/crossbow_variants.json'
  var $ArrowItem = Java.loadClass('net.minecraft.world.item.ArrowItem')

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 3 || !data.families || !Array.isArray(data.materials)) {
      throw new Error('[Awakening/Crossbows] Unsupported manifest')
    }
    return data
  }

  function materialKey(material) {
    return material.id === 'wood' ? 'wooden' : material.id
  }

  function materialName(material) {
    return material.id === 'wood' ? 'Wooden' : material.name
  }

  function isArrow(stack) {
    return stack != null && stack.getItem() instanceof $ArrowItem
  }

  function model(familyId, material) {
    var texture = material.id === 'wood'
      ? familyId
      : material.id === 'iron'
        ? 'iron_' + familyId
        : 'iron_' + familyId
    var base = 'awakening:item/crossbows/' + familyId

    return {
      parent: 'awakening:item/crossbows/crossbow_base',
      textures: { layer0: 'awakening:item/crossbows/' + texture },
      overrides: [
        { predicate: { pulling: 1 }, model: base + '_pulling_0' },
        { predicate: { pulling: 1, pull: 0.58 }, model: base + '_pulling_1' },
        { predicate: { pulling: 1, pull: 1.0 }, model: base + '_pulling_2' },
        { predicate: { charged: 1 }, model: base + '_arrow' }
      ]
    }
  }

  StartupEvents.registry('item', function (event) {
    var data = loadData()
    var customFamilies = ['pistol_crossbow', 'arbalest']

    data.materials.forEach(function (material) {
      customFamilies.forEach(function (familyId) {
        var family = data.families[familyId]
        var id = 'awakening:' + materialKey(material) + '_' + family.suffix
        var item = event.create(id, 'crossbow')
          .displayName(materialName(material) + ' ' + family.name)
          .maxDamage(material.durability)
          .modelJson(model(familyId, material))

        item.crossbow(function (crossbow) {
          crossbow.modifyCrossbow(function (attributes) {
            attributes
              .fullChargeTick(family.charge_ticks)
              .arrowDamage(family.projectile_damage)
              .arrowSpeed(family.projectile_velocity)
              .ammo(isArrow)
              .ammoHeld(isArrow)
            attributes.enchantmentValue(material.enchantability)
          })
        })
      })
    })
  })
})()
