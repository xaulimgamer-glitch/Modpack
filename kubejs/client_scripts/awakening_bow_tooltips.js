(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 2 || !data.bow_types || !Array.isArray(data.materials)) {
      throw new Error('[Awakening/Bow Tooltips] Unsupported manifest')
    }
    return data
  }

  function materialKey(material) {
    return material.id === 'wood' ? 'wooden' : material.id
  }

  function formatNumber(value) {
    return Number(value).toFixed(2)
  }

  function addBowStats(stack, advanced, text) {
    var bow = stack.getItem()
    var drawTicks = Number(bow.rjs$getFullChargeTick())
    var projectileSpeed = Number(bow.rjs$getArrowSpeedScale())
    var baseDamage = Number(bow.rjs$getBaseDamage())
    var maxDurability = Number(stack.getMaxDamage())

    text.add('Draw Time: ' + drawTicks + ' ticks (' + formatNumber(drawTicks / 20) + ' s)')
    text.add('Projectile Speed: ' + formatNumber(projectileSpeed))
    text.add('Base Arrow Damage: ' + formatNumber(baseDamage))
    text.add('Max Durability: ' + maxDurability)
  }

  ItemEvents.tooltip(function (event) {
    var data = loadData()

    data.materials.forEach(function (material) {
      if (material.existing_outputs && material.id !== 'wood') return

      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        event.addAdvanced('awakening:' + materialKey(material) + '_' + type.suffix, addBowStats)
      })
    })

    event.addAdvanced('kubejs:crude_short_bow', addBowStats)
  })
})()
