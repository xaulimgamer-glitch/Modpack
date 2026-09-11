const heatedMetalsConfig = JsonIO.read('kubejs/awakening/heated_metals.json')

if (!heatedMetalsConfig || !Array.isArray(heatedMetalsConfig.metals)) {
  console.error('[Awakening] Could not load kubejs/awakening/heated_metals.json')
} else {
  StartupEvents.registry('item', event => {
    heatedMetalsConfig.metals.forEach(metal => {
      const nativeConfig = metal.native || {}
      if (nativeConfig.item === true) return

      event.create(metal.heated)
        .displayName(`Heated ${metal.name} Ingot`)
        .texture(metal.texture || 'overgeared:item/heated_iron_ingot')
    })
  })
}
