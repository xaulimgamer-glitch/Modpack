(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  function fail(message) {
    throw new Error('[Awakening/Bows] ' + message)
  }

  function isPositiveFiniteNumber(value) {
    return typeof value === 'number' && isFinite(value) && value > 0
  }

  function isPositiveInteger(value) {
    return isPositiveFiniteNumber(value) && Math.floor(value) === value
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0
  }

  function isResourceLocation(value) {
    return isNonEmptyString(value) && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value)
  }

  function materialKey(material) {
    return material.id === 'wood' ? 'wooden' : material.id
  }

  function materialName(material) {
    return material.id === 'wood' ? 'Wooden' : material.name
  }

  function outputId(material, typeId, type) {
    if (material.existing_outputs && material.existing_outputs[typeId]) return material.existing_outputs[typeId]
    return 'awakening:' + materialKey(material) + '_' + type.suffix
  }

  function finalStats(data, type, material) {
    var draw = Math.max(data.balance.minimum_draw_time, Math.round(type.draw_time * material.draw_scale))
    var velocity = type.velocity * material.velocity_scale
    var damage = type.base_damage * material.damage_scale

    if (!isPositiveInteger(draw)) fail('Calculated draw time is invalid for ' + material.id + '/' + type.suffix + ': ' + draw)
    if (!isPositiveFiniteNumber(velocity)) fail('Calculated projectile velocity is invalid for ' + material.id + '/' + type.suffix + ': ' + velocity)
    if (!isPositiveFiniteNumber(damage)) fail('Calculated base damage is invalid for ' + material.id + '/' + type.suffix + ': ' + damage)

    return { draw_time: draw, velocity: velocity, base_damage: damage }
  }

  function validateData(data) {
    if (!data || data.schema !== 3) fail('Unsupported manifest schema; expected schema 3')
    if (!data.bow_types || typeof data.bow_types !== 'object') fail('bow_types is missing or invalid')
    if (!data.assembly || typeof data.assembly !== 'object') fail('assembly is missing or invalid')
    if (!Array.isArray(data.materials) || data.materials.length === 0) fail('materials is missing or empty')
    if (!data.balance || typeof data.balance !== 'object') fail('balance is missing or invalid')
    if (data.balance.draw_rounding !== 'round') fail('Unsupported draw_rounding; expected "round"')
    if (!isPositiveInteger(data.balance.minimum_draw_time)) fail('minimum_draw_time must be a positive integer')
    if (!isNonEmptyString(data.assembly.rod)) fail('assembly.rod is missing or invalid')

    var typeIds = Object.keys(data.bow_types)
    if (typeIds.length === 0) fail('bow_types is empty')

    typeIds.forEach(function (typeId) {
      var type = data.bow_types[typeId]
      if (!type || typeof type !== 'object') fail('Bow type ' + typeId + ' is invalid')
      if (!isNonEmptyString(type.suffix)) fail('Bow type ' + typeId + ' has no valid suffix')
      if (!isNonEmptyString(type.name)) fail('Bow type ' + typeId + ' has no valid name')
      if (!isPositiveInteger(type.draw_time)) fail('Bow type ' + typeId + ' has invalid draw_time')
      if (!isPositiveFiniteNumber(type.velocity)) fail('Bow type ' + typeId + ' has invalid velocity')
      if (!isPositiveFiniteNumber(type.base_damage)) fail('Bow type ' + typeId + ' has invalid base_damage')
      if (!isPositiveInteger(type.max_damage)) fail('Bow type ' + typeId + ' has invalid max_damage')
      if (!isNonEmptyString(type.handle)) fail('Bow type ' + typeId + ' has invalid handle')
      if (!isNonEmptyString(type.string)) fail('Bow type ' + typeId + ' has invalid string')
    })

    var materialIds = {}
    var outputIds = {}

    data.materials.forEach(function (material, index) {
      if (!material || typeof material !== 'object') fail('Material at index ' + index + ' is invalid')
      if (!isNonEmptyString(material.id)) fail('Material at index ' + index + ' has no id')
      if (materialIds[material.id]) fail('Duplicate material id: ' + material.id)
      materialIds[material.id] = true

      if (!isNonEmptyString(material.name)) fail('Material ' + material.id + ' has no valid name')
      if (!isPositiveFiniteNumber(material.damage_scale)) fail('Material ' + material.id + ' has invalid damage_scale')
      if (!isPositiveFiniteNumber(material.velocity_scale)) fail('Material ' + material.id + ' has invalid velocity_scale')
      if (!isPositiveFiniteNumber(material.draw_scale)) fail('Material ' + material.id + ' has invalid draw_scale')
      if (!isResourceLocation(material.source_longbow)) fail('Material ' + material.id + ' has invalid source_longbow: ' + material.source_longbow)

      if (material.id !== 'wood' && !isNonEmptyString(material.crafting_material)) {
        fail('Material ' + material.id + ' has no crafting_material')
      }
      if (material.color && !/^[0-9A-Fa-f]{6}$/.test(material.color)) {
        fail('Material ' + material.id + ' has invalid color: ' + material.color)
      }

      typeIds.forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var output = outputId(material, typeId, type)
        if (!isResourceLocation(output)) fail('Invalid output id for ' + material.id + '/' + typeId + ': ' + output)
        if (outputIds[output]) fail('Duplicate bow output id: ' + output)
        outputIds[output] = true
        finalStats(data, type, material)
      })
    })

    if (!materialIds.wood) fail('Wood material definition is missing')
    return data
  }

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    return validateData(data)
  }

  function model(typeId, material) {
    if (material.id === 'wood') {
      var base = 'awakening:item/bows/wooden_' + typeId
      var pulling = base + '_pulling_'
      var parent = typeId === 'recurve_bow'
        ? 'awakening:item/bows/wooden_recurve_bow_base'
        : typeId === 'flat_bow'
          ? 'awakening:item/bows/wooden_flat_bow_base'
          : 'awakening:item/bows/wooden_bow_base'
      return {
        parent: parent,
        textures: { layer0: base },
        overrides: [
          { predicate: { pulling: 1 }, model: pulling + '0' },
          { predicate: { pulling: 1, pull: 0.65 }, model: pulling + '1' },
          { predicate: { pulling: 1, pull: 0.9 }, model: pulling + '2' }
        ]
      }
    }

    var base = 'awakening:item/bows/' + typeId
    var pulling = base + '_pulling_'
    return {
      parent: base,
      overrides: [
        { predicate: { pulling: 1 }, model: pulling + '0' },
        { predicate: { pulling: 1, pull: 0.65 }, model: pulling + '1' },
        { predicate: { pulling: 1, pull: 0.9 }, model: pulling + '2' }
      ]
    }
  }

  StartupEvents.registry('item', function (event) {
    var data = loadData()

    data.materials.forEach(function (material) {
      if (material.existing_outputs && material.id !== 'wood') return

      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var stats = finalStats(data, type, material)
        var item = event.create(outputId(material, typeId, type), 'bow')
          .displayName(materialName(material) + ' ' + type.name)
          .maxDamage(type.max_damage)
          .modelJson(model(typeId, material))

        if (material.color) item.color(0, parseInt(material.color, 16))
        item.bow(function (bow) {
          bow.modifyBow(function (attributes) {
            attributes.fullChargeTick(stats.draw_time).arrowSpeed(stats.velocity).baseDamage(stats.base_damage)
          })
        })
      })
    })
  })
})()
