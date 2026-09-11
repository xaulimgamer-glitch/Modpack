// Awakening armor plate registry.
// Materials are added one at a time through the armor manifest.

const AWAKENING_ARMOR_MANIFEST = 'kubejs/awakening/armor_forging.json'

StartupEvents.registry('item', event => {
  const data = JSON.parse(JsonIO.readString(AWAKENING_ARMOR_MANIFEST))

  if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/Armor] Invalid manifest: ' + AWAKENING_ARMOR_MANIFEST)
  }

  data.materials.forEach(material => {
    event.create(material.plate).displayName(material.name + ' Plate')
  })
})
