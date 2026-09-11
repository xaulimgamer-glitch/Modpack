// Awakening tool parts registry.
// The manifest is intentionally expanded one material at a time so each material
// can be reviewed and committed independently.

const AWAKENING_TOOL_PARTS_MANIFEST = 'kubejs/awakening/tool_parts.json'

StartupEvents.registry('item', event => {
  const data = JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_MANIFEST))

  if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/ToolParts] Invalid manifest: ' + AWAKENING_TOOL_PARTS_MANIFEST)
  }

  data.materials.forEach(material => {
    data.templates.forEach(template => {
      const id = 'awakening:' + material.id + '_' + template.suffix
      const displayName = material.name + ' ' + template.display
      event.create(id).displayName(displayName)
    })
  })
})
