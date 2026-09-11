(function () {
  // Awakening plate unification.
  // Keep one obtainable plate per material while preserving tag compatibility
  // with Create and Overgeared recipes.

  const AWAKENING_PLATE_UNIFICATION = [
    {
      id: 'iron',
      pressIngredient: { item: 'overgeared:heated_iron_ingot' },
      canonical: 'overgeared:iron_plate',
      deprecated: ['create:iron_sheet'],
      tags: ['forge:plates/iron', 'overgeared:iron_plates']
    },
    {
      id: 'copper',
      pressIngredient: { item: 'overgeared:heated_copper_ingot' },
      canonical: 'overgeared:copper_plate',
      deprecated: ['create:copper_sheet'],
      tags: ['forge:plates/copper', 'overgeared:copper_plates']
    }
  ]

  // Armor materials gain a Create press route as soon as they are migrated to
  // heated_metals.json. Their plate tag is already managed by awakening_armor.js.
  const awakeningPlateHeatedMetals = JsonIO.read('kubejs/awakening/heated_metals.json')
  const awakeningPlateArmor = JSON.parse(JsonIO.readString('kubejs/awakening/armor_forging.json'))

  if (awakeningPlateHeatedMetals && Array.isArray(awakeningPlateHeatedMetals.metals) &&
      awakeningPlateArmor && Array.isArray(awakeningPlateArmor.materials)) {
    const heatedById = {}
    awakeningPlateHeatedMetals.metals.forEach(metal => {
      if (metal && metal.id && metal.heated) heatedById[metal.id] = metal
    })

    awakeningPlateArmor.materials.forEach(material => {
      const heatedMetal = heatedById[material.id]
      if (!heatedMetal) return

      AWAKENING_PLATE_UNIFICATION.push({
        id: material.id,
        pressIngredient: { item: heatedMetal.heated },
        canonical: material.plate,
        deprecated: [],
        tags: []
      })
    })
  }

  ServerEvents.tags('item', event => {
    AWAKENING_PLATE_UNIFICATION.forEach(material => {
      material.tags.forEach(tag => {
        event.add(tag, material.canonical)
        material.deprecated.forEach(item => event.remove(tag, item))
      })
    })
  })

  ServerEvents.recipes(event => {
    AWAKENING_PLATE_UNIFICATION.forEach(material => {
      const hasInput = Ingredient.of(material.pressIngredient).itemIds.size() > 0
      const hasOutput = Ingredient.of({ item: material.canonical }).itemIds.size() > 0

      if (!hasInput || !hasOutput) {
        const reasons = []
        if (!hasInput) reasons.push('missing press ingredient ' + JSON.stringify(material.pressIngredient))
        if (!hasOutput) reasons.push('missing canonical plate ' + material.canonical)
        console.warn('[Awakening/PlateUnification] Skipping ' + material.id + ': ' + reasons.join('; '))
        return
      }

      // Remove normal production paths for duplicate Create sheets only after
      // the canonical replacement has passed validation.
      material.deprecated.forEach(item => event.remove({ output: item }))

      // Keep Create's mechanical press useful, but make it produce the
      // canonical plate from the same heated input used by anvil forging.
      event.custom({
        type: 'create:pressing',
        ingredients: [material.pressIngredient],
        results: [{ item: material.canonical }]
      }).id('awakening:plate_unification/create/' + material.id)
    })
  })
})()
