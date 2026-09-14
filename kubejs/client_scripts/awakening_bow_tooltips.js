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
    var arrowSpeed = Number(bow.rjs$getArrowSpeedScale())
    var insertAt = Math.min(2, text.size())

    text.add(insertAt++, Text.aqua('Ammo Type: ').append(Text.gray('Arrows')))
    text.add(insertAt++, Text.aqua('Draw Time: ').append(Text.gray(formatNumber(drawTicks / 20) + 's')))
    text.add(insertAt, Text.aqua('Arrow Speed: ').append(Text.gray('x' + formatNumber(arrowSpeed))))
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
