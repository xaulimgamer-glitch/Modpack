(function () {
  var Screen = Java.loadClass('net.minecraft.client.gui.screens.Screen')
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  var DESCRIPTIONS = {
    short_bow: 'A compact bow with a quick draw and lower arrow speed.',
    recurve_bow: 'A balanced bow with a moderate draw time and greater arrow speed.',
    flat_bow: 'A long bow built for powerful, high-speed shots with a slow draw.',
    crude_short_bow: 'A crude compact bow assembled from basic materials.'
  }

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

  function descriptionHeader(showingDetails) {
    if (showingDetails) {
      return Text.gold('Description: ')
        .append(Text.darkGray('[Showing details]'))
    }

    return Text.gold('Description: ')
      .append(Text.darkGray('[Press '))
      .append(Text.aqua('SHIFT'))
      .append(Text.darkGray(' to show details]'))
  }

  function addBowStats(description) {
    return function (stack, advanced, text) {
      var bow = stack.getItem()
      var drawTicks = Number(bow.rjs$getFullChargeTick())
      var arrowSpeed = Number(bow.rjs$getArrowSpeedScale())
      var showingDetails = Screen.hasShiftDown()
      var insertAt = Math.min(2, text.size())

      text.add(insertAt++, descriptionHeader(showingDetails))
      if (showingDetails && description) {
        text.add(insertAt++, Text.gray(description).italic())
      }

      text.add(insertAt++, Text.of(''))
      text.add(insertAt++, Text.darkAqua('Ammo Type: ').append(Text.gray('Arrows')))
      text.add(insertAt++, Text.darkAqua('Draw Time: ').append(Text.gray(formatNumber(drawTicks / 20) + 's')))
      text.add(insertAt++, Text.darkAqua('Arrow Speed: ').append(Text.gray('x' + formatNumber(arrowSpeed))))
      text.add(insertAt, Text.of(''))
    }
  }

  ItemEvents.tooltip(function (event) {
    var data = loadData()

    data.materials.forEach(function (material) {
      if (material.existing_outputs && material.id !== 'wood') return

      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        event.addAdvanced(
          'awakening:' + materialKey(material) + '_' + type.suffix,
          addBowStats(DESCRIPTIONS[typeId])
        )
      })
    })

    event.addAdvanced('kubejs:crude_short_bow', addBowStats(DESCRIPTIONS.crude_short_bow))
  })
})()
