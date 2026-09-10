// Forge 1.20.1 / KubeJS 2001.6.5. Restart the client AND server after changes.
// Basic intermediate items only: original mod weapons are never registered here.
StartupEvents.registry('item', event => {
  const data = JSON.parse(JsonIO.readString('kubejs/awakening/weapon_parts.json'))
  if (data.schema !== 1) throw new Error('[Awakening/Parts] Unsupported manifest')

  data.materials.forEach(material => {
    const color = parseInt(material.color, 16)
    material.weapons.forEach(weapon => {
      const template = data.templates[weapon.type]
      const label = template.suffix.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.substring(1)
      ).join(' ')

      // KubeJS generates minecraft:item/generated models with the real mod's
      // layer0 texture. Item tint recolors the existing pixels without redrawing.
      event.create(weapon.part)
        .displayName(material.name + ' ' + label)
        .texture(template.texture)
        .color(0, color)
    })

    event.create(material.fragment)
      .displayName(material.name + ' Smithing Fragment')
      .texture('minecraft:item/iron_nugget')
      .color(0, color)
      .tooltip('1/9 ingot. Heat in a blast furnace before forging.')
  })
})
