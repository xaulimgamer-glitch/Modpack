// Awakening armor plate registry.
// Materials are added one at a time through the armor manifest.

const AWAKENING_ARMOR_MANIFEST = 'kubejs/awakening/armor_forging.json'
const AWAKENING_ARMOR_WEAPON_MANIFEST = 'kubejs/awakening/weapon_parts.json'
const AWAKENING_ARMOR_TWILIGHT_MANIFEST = 'kubejs/awakening/twilight_weapon_parts.json'
const AWAKENING_ARMOR_CATACLYSM_MANIFEST = 'kubejs/awakening/cataclysm_weapon_parts.json'

function awakeningArmorLoadColors() {
  const colors = {
    // Utherium has no Spartan weapon-part entry to inherit a tint from.
    // Keep its existing warm red Utherium palette while using the iron plate pixels.
    utherium: 0xBF6D5C
  }
  const manifests = [
    JSON.parse(JsonIO.readString(AWAKENING_ARMOR_WEAPON_MANIFEST)),
    JSON.parse(JsonIO.readString(AWAKENING_ARMOR_TWILIGHT_MANIFEST)),
    JSON.parse(JsonIO.readString(AWAKENING_ARMOR_CATACLYSM_MANIFEST))
  ]

  manifests.forEach(data => {
    if (!data || !Array.isArray(data.materials)) return
    data.materials.forEach(material => {
      if (material && material.id && material.color) colors[material.id] = parseInt(material.color, 16)
    })
  })

  return colors
}

StartupEvents.registry('item', event => {
  const data = JSON.parse(JsonIO.readString(AWAKENING_ARMOR_MANIFEST))
  const colors = awakeningArmorLoadColors()

  if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/Armor] Invalid manifest: ' + AWAKENING_ARMOR_MANIFEST)
  }

  data.materials.forEach(material => {
    const color = colors[material.id]
    if (color === undefined) {
      throw new Error('[Awakening/Armor] Missing visual color for material: ' + material.id)
    }

    // Same strategy as Awakening weapon parts: use the real Overgeared iron
    // plate texture as layer0, then tint the existing pixels for the material.
    event.create(material.plate)
      .displayName(material.name + ' Plate')
      .texture('overgeared:item/iron_plate')
      .color(0, color)
  })
})
