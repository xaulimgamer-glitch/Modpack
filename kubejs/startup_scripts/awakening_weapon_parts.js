// Forge 1.20.1 / KubeJS 2001.6.5. Restart the client AND server after changes.
// Basic intermediate items only: original mod weapons are never registered here.
StartupEvents.registry('item', event => {
  const data = JSON.parse(JsonIO.readString('kubejs/awakening/weapon_parts.json'))
  const twilight = JSON.parse(JsonIO.readString('kubejs/awakening/twilight_weapon_parts.json'))
  const cataclysm = JSON.parse(JsonIO.readString('kubejs/awakening/cataclysm_weapon_parts.json'))
  if (data.schema !== 1 || twilight.schema !== 1 || cataclysm.schema !== 1) {
    throw new Error('[Awakening/Parts] Unsupported manifest')
  }

  function registerMaterial(material, weaponTypes) {
    const color = parseInt(material.color, 16)
    weaponTypes.forEach(type => {
      const template = data.templates[type]
      if (!template) throw new Error('[Awakening/Parts] Missing template: ' + type)
      const part = 'awakening:' + material.id + '_' + template.suffix
      const label = template.suffix.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.substring(1)
      ).join(' ')

      // KubeJS generates minecraft:item/generated models with the real mod's
      // layer0 texture. Item tint recolors the existing pixels without redrawing.
      event.create(part)
        .displayName(material.name + ' ' + label)
        .texture(template.texture)
        .color(0, color)
    })

    event.create(material.fragment)
      .displayName(material.name + ' Smithing Fragment')
      .texture('minecraft:item/iron_nugget')
      .color(0, color)
      .tooltip('1/9 ingot. Heat in a blast furnace before forging.')
  }

  data.materials.forEach(material => {
    registerMaterial(material, material.weapons.map(weapon => weapon.type))
  })

  // Steeleaf and Knightmetal are generated from the same Overgeared part
  // templates as the existing Twilight materials. Only intermediate items are
  // registered here; final weapons stay spartantwilight:*.
  twilight.materials.forEach(material => registerMaterial(material, twilight.weapon_types))

  // Black Steel follows the Ancient Metal weapon set. Cursium and Ignitium are
  // intentionally excluded: their existing smithing-table weapon upgrades stay intact.
  const cataclysmPrototype = data.materials.find(material => material.id === cataclysm.prototype)
  if (!cataclysmPrototype) throw new Error('[Awakening/Parts] Cataclysm prototype missing: ' + cataclysm.prototype)
  const cataclysmWeaponTypes = cataclysmPrototype.weapons.map(weapon => weapon.type)
  cataclysm.materials.forEach(material => registerMaterial(material, cataclysmWeaponTypes))
})
