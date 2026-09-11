// Awakening plate unification.
// Keep one obtainable plate per material while preserving tag compatibility
// with Create and Overgeared recipes.

const AWAKENING_PLATE_UNIFICATION = [
  {
    id: 'iron',
    ingotTag: 'forge:ingots/iron',
    canonical: 'overgeared:iron_plate',
    deprecated: ['create:iron_sheet'],
    tags: ['forge:plates/iron', 'overgeared:iron_plates']
  },
  {
    id: 'copper',
    ingotTag: 'forge:ingots/copper',
    canonical: 'overgeared:copper_plate',
    deprecated: ['create:copper_sheet'],
    tags: ['forge:plates/copper', 'overgeared:copper_plates']
  }
]

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
    // Remove normal production paths for duplicate Create sheets.
    material.deprecated.forEach(item => event.remove({ output: item }))

    // Keep Create's mechanical press useful, but make it produce the
    // canonical Overgeared plate instead of a second equivalent item.
    event.custom({
      type: 'create:pressing',
      ingredients: [
        { tag: material.ingotTag }
      ],
      results: [
        { item: material.canonical }
      ]
    }).id('awakening:plate_unification/create/' + material.id)
  })
})
