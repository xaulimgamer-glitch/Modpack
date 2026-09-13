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

function awakeningToolPartsColor(colors, material) {
  if (material.color) return parseInt(material.color, 16)
  return colors[material.id]
}

ItemEvents.toolTierRegistry(event => {
  const data = JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_MANIFEST))
  if (!data || data.schema !== 1 || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/ToolParts] Invalid manifest: ' + AWAKENING_TOOL_PARTS_MANIFEST)
  }

  data.materials.forEach(material => {
    const tier = material.machete_tier
    if (!tier) return

    event.add('awakening_' + material.id + '_machete', customTier => {
      customTier.uses = tier.uses
      customTier.speed = tier.speed
      customTier.attackDamageBonus = tier.attack_damage_bonus
      customTier.level = tier.level
      customTier.enchantmentValue = tier.enchantment_value
      customTier.repairIngredient = tier.repair_ingredient
    })
  })
})

StartupEvents.registry('item', event => {
  const data = JSON.parse(JsonIO.readString(AWAKENING_TOOL_PARTS_MANIFEST))
  const colors = awakeningToolPartsLoadColors()

  if (!data || data.schema !== 1 || !Array.isArray(data.templates) || !Array.isArray(data.materials)) {
    throw new Error('[Awakening/ToolParts] Invalid manifest: ' + AWAKENING_TOOL_PARTS_MANIFEST)
  }

  data.materials.forEach(material => {
    const color = awakeningToolPartsColor(colors, material)
    if (color === undefined || Number.isNaN(color)) {
      throw new Error('[Awakening/ToolParts] Missing visual color for material: ' + material.id)
    }

    awakeningToolPartsTemplatesForMaterial(data, material).forEach(template => {
      const id = 'awakening:' + material.id + '_' + template.suffix
      const displayName = material.name + ' ' + template.display
      const texture = template.texture || ('overgeared:item/iron_' + template.suffix)

      // Reuse existing Overgeared/Overgeared Spartan part pixels and tint them.
      // Machete blades are dedicated Awakening items; only the temporary visual
      // base is shared with the curved saber blade until bespoke pixels exist.
      event.create(id)
        .displayName(displayName)
        .texture(texture)
        .color(0, color)
    })

    if (material.register_fragment) {
      event.create(material.fragment)
        .displayName(material.name + ' Smithing Fragment')
        .texture('minecraft:item/iron_nugget')
        .color(0, color)
        .tooltip('1/9 material. Heat in a blast furnace before forging.')
    }

    if (material.machete_tier && material.outputs && material.outputs.machete) {
      // Nether's Delight MacheteItem is a SwordItem with baseline damage 2 and
      // attack speed -2.6. The custom tier supplies the material properties.
      event.create(material.outputs.machete, 'sword')
        .displayName(material.name + ' Machete')
        .tier('awakening_' + material.id + '_machete')
        .attackDamageBaseline(2)
        .speedBaseline(-2.6)
        .texture('nethersdelight:item/iron_machete')
        .color(0, color)
    }
  })
})
