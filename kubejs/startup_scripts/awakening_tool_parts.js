// Awakening tool parts registry.
// The manifest is intentionally expanded one material at a time so each material
// can be reviewed and committed independently.

const AWAKENING_TOOL_PARTS_MANIFEST = 'kubejs/awakening/tool_parts.json'
const AWAKENING_TOOL_PARTS_WEAPON_MANIFEST = 'kubejs/awakening/weapon_parts.json'
const AWAKENING_TOOL_PARTS_TWILIGHT_MANIFEST = 'kubejs/awakening/twilight_weapon_parts.json'
const AWAKENING_TOOL_PARTS_CATACLYSM_MANIFEST = 'kubejs/awakening/cataclysm_weapon_parts.json'

function awakeningToolPartsTemplatesForMaterial(data, material) {
  if (!Array.isArray(material.tool_types)) return data.templates

  const selected = data.templates.filter(template => material.tool_types.indexOf(template.type) !== -1)
  if (selected.length !== material.tool_types.length) {
    throw new Error('[Awakening/ToolParts] Invalid tool_types for material: ' + material.id)
  }
  return selected
}

function awakeningToolPartsLoadColors() {
  const colors = {}
  const manifests = [
    JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_WEAPON_MANIFEST)),
    JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_TWILIGHT_MANIFEST)),
    JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_CATACLYSM_MANIFEST))
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
  const data = JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_MANIFEST))
  const colors = awakeningToolPartsLoadColors()

  if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/ToolParts] Invalid manifest: ' + AWAKENING_TOOL_PARTS_MANIFEST)
  }

  data.materials.forEach(material => {
    const color = colors[material.id]
    if (color === undefined) {
      throw new Error('[Awakening/ToolParts] Missing visual color for material: ' + material.id)
    }

    awakeningToolPartsTemplatesForMaterial(data, material).forEach(template => {
      const id = 'awakening:' + material.id + '_' + template.suffix
      const displayName = material.name + ' ' + template.display

      // Reuse Overgeared's iron part pixels and tint them exactly like the
      // already-registered Awakening weapon parts. No custom PNG is required.
      event.create(id)
        .displayName(displayName)
        .texture('overgeared:item/iron_' + template.suffix)
        .color(0, color)
    })
  })
})
