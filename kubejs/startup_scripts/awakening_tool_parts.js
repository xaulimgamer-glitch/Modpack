// Awakening tool parts registry.
// The manifest is intentionally expanded one material at a time so each material
// can be reviewed and committed independently.

const AWAKENING_TOOL_PARTS_MANIFEST = 'kubejs/awakening/tool_parts.json'

function awakeningToolPartsTemplatesForMaterial(data, material) {
  if (!Array.isArray(material.tool_types)) return data.templates

  const selected = data.templates.filter(template => material.tool_types.indexOf(template.type) !== -1)
  if (selected.length !== material.tool_types.length) {
    throw new Error('[Awakening/ToolParts] Invalid tool_types for material: ' + material.id)
  }
  return selected
}

StartupEvents.registry('item', event => {
  const data = JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_MANIFEST))

  if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/ToolParts] Invalid manifest: ' + AWAKENING_TOOL_PARTS_MANIFEST)
  }

  data.materials.forEach(material => {
    awakeningToolPartsTemplatesForMaterial(data, material).forEach(template => {
      const id = 'awakening:' + material.id + '_' + template.suffix
      const displayName = material.name + ' ' + template.display
      event.create(id).displayName(displayName)
    })
  })
})
