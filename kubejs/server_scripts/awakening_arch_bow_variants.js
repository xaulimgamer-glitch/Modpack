(function () {
  var AWAKENING_ARCH_BOW_MANIFEST_V2 = 'kubejs/awakening/arch_bow_variants.json'

  function awakeningArchBowV2LoadData() {
    var data = JSON.parse(JsonIO.readString(AWAKENING_ARCH_BOW_MANIFEST_V2))
    if (!data || data.schema !== 2 || !data.bow_types || !data.assembly || !Array.isArray(data.materials)) throw new Error('[Awakening/ArchBows] Unsupported manifest')
    return data
  }
  function awakeningArchBowV2IngredientExists(value) {
    try { return Ingredient.of(value).itemIds.size() > 0 } catch (error) { return false }
  }
  function awakeningArchBowV2Output(material, typeId, type) {
    if (material.existing_outputs && material.existing_outputs[typeId]) return material.existing_outputs[typeId]
    return 'awakening:' + material.id + '_' + type.suffix
  }
  function awakeningArchBowV2FindLimb(material) {
    var candidates = material.limb_candidates || []
    for (var i = 0; i < candidates.length; i++) if (awakeningArchBowV2IngredientExists(candidates[i])) return candidates[i]
    return null
  }
  function awakeningArchBowV2Addition(upgrade) {
    if (upgrade.addition_item) return { item: upgrade.addition_item }
    if (upgrade.addition_tag) return { tag: upgrade.addition_tag.charAt(0) === '#' ? upgrade.addition_tag.substring(1) : upgrade.addition_tag }
    throw new Error('[Awakening/ArchBows] Smithing upgrade has no addition')
  }

  ServerEvents.tags('item', function (event) {
    var data = awakeningArchBowV2LoadData()
    data.materials.forEach(function (material) {
      Object.keys(data.bow_types).forEach(function (typeId) { event.add('forge:tools/bows', awakeningArchBowV2Output(material, typeId, data.bow_types[typeId])) })
    })
  })

  ServerEvents.recipes(function (event) {
    var data = awakeningArchBowV2LoadData()
    var installed = 0
    var skipped = 0
    data.materials.forEach(function (material) {
      if (material.id !== 'wood' && material.source_longbow && !awakeningArchBowV2IngredientExists(material.source_longbow)) {
        console.warn('[Awakening/ArchBows] Skipping ' + material.id + ': source Longbow is not registered (' + material.source_longbow + ')')
        skipped++
        return
      }
      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var output = awakeningArchBowV2Output(material, typeId, type)
        if (material.id === 'wood') return
        if (material.upgrade) {
          var baseMaterial = data.materials.find(function (entry) { return entry.id === material.upgrade.from })
          if (!baseMaterial) { console.warn('[Awakening/ArchBows] Missing smithing base material for ' + material.id); skipped++; return }
          var baseOutput = awakeningArchBowV2Output(baseMaterial, typeId, type)
          if (!awakeningArchBowV2IngredientExists(baseOutput)) { console.warn('[Awakening/ArchBows] Missing smithing base bow ' + baseOutput + ' for ' + material.id); skipped++; return }
          event.custom({ type: 'minecraft:smithing_transform', template: { item: material.upgrade.template_item }, base: { item: baseOutput }, addition: awakeningArchBowV2Addition(material.upgrade), result: { item: output } }).id('awakening:arch_bows/' + material.id + '/' + type.suffix)
          installed++
          return
        }
        var limb = awakeningArchBowV2FindLimb(material)
        if (!limb) { console.warn('[Awakening/ArchBows] Skipping ' + material.id + ' ' + typeId + ': no registered Longbow limb from ' + JSON.stringify(material.limb_candidates || [])); skipped++; return }
        event.shaped(output, data.assembly.pattern, { x: limb, h: type.handle, l: data.assembly.rod, s: type.string }).id('awakening:arch_bows/' + material.id + '/' + type.suffix)
        installed++
      })
    })
    console.info('[Awakening/ArchBows] Installed ' + installed + ' material bow recipes; skipped ' + skipped + '. Full client restart required for registry changes.')
  })
})()
