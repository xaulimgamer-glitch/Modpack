const heatedMetalsConfig = JsonIO.read('kubejs/awakening/heated_metals.json')

if (!heatedMetalsConfig || !Array.isArray(heatedMetalsConfig.metals)) {
  console.error('[Awakening] Could not load kubejs/awakening/heated_metals.json')
} else {
  StartupEvents.registry('item', event => {
    heatedMetalsConfig.metals.forEach(metal => {
      const nativeConfig = metal.native || {}
      if (nativeConfig.item === true) return

      // Witherite deliberately reuses Overgeared's Heated Crude Steel pixels
      // without tinting, so it matches the forging heated-material reference.
      const isWitherite = metal.id === 'witherite'
      event.create(metal.heated)
        .displayName(`Heated ${metal.name} Ingot`)
        .texture(isWitherite ? 'overgeared:item/heated_crude_steel' : (metal.texture || 'overgeared:item/heated_iron_ingot'))
    })
  })
}
