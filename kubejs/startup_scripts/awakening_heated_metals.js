const heatedMetalsConfig = JsonIO.read('kubejs/awakening/heated_metals.json')

if (!heatedMetalsConfig || !Array.isArray(heatedMetalsConfig.metals)) {
  console.error('[Awakening] Could not load kubejs/awakening/heated_metals.json')
} else {
  StartupEvents.registry('item', event => {
    heatedMetalsConfig.metals.forEach(metal => {
      const nativeConfig = metal.native || {}
      if (nativeConfig.item === true) return

      // Witherite deliberately reuses Overgeared's Heated Crude Steel pixels.
      // The tint keeps the exact heated silhouette/pattern while adapting it to
      // the established Awakening Witherite palette without a copied PNG asset.
      const isWitherite = metal.id === 'witherite'
      const heatedItem = event.create(metal.heated)
        .displayName(`Heated ${metal.name} Ingot`)
        .texture(isWitherite ? 'overgeared:item/heated_crude_steel' : (metal.texture || 'overgeared:item/heated_iron_ingot'))

      if (isWitherite) heatedItem.color(0, 0x77728B)
    })
  })
}
