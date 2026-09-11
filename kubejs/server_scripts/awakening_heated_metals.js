const heatedMetalsConfig = JsonIO.read('kubejs/awakening/heated_metals.json')

if (!heatedMetalsConfig || !Array.isArray(heatedMetalsConfig.metals)) {
  console.error('[Awakening] Could not load kubejs/awakening/heated_metals.json')
} else {
  const ingredient = value => value.startsWith('#')
    ? { tag: value.substring(1) }
    : { item: value }

  ServerEvents.tags('item', event => {
    heatedMetalsConfig.metals.forEach(metal => {
      const nativeConfig = metal.native || {}
      if (nativeConfig.heatedTag !== true) {
        event.add('overgeared:heated_metals', metal.heated)
      }
    })
  })

  ServerEvents.recipes(event => {
    heatedMetalsConfig.metals.forEach(metal => {
      const nativeConfig = metal.native || {}
      const heating = metal.heating || {}
      const sources = Array.isArray(heating.sources) ? heating.sources : []

      ;['smelting', 'blasting'].forEach(process => {
        const processConfig = heating[process]
        if (!processConfig || processConfig.enabled !== true) return

        sources.forEach(source => {
          event.remove({
            type: `minecraft:${process}`,
            input: source,
            output: metal.cooled
          })

          if (processConfig.native === true) return

          const sourcePath = source.replace('#', 'tag_').replace(':', '/')
          event.custom({
            type: `minecraft:${process}`,
            category: 'misc',
            cookingtime: processConfig.cookingTime,
            experience: processConfig.experience,
            ingredient: ingredient(source),
            result: metal.heated
          }).id(`awakening:heated_metals/${metal.id}/${process}/${sourcePath}`)
        })
      })

      if (nativeConfig.cooling !== true) {
        event.custom({
          type: 'overgeared:cooling',
          input: { item: metal.heated },
          output: { item: metal.cooled }
        }).id(`awakening:heated_metals/${metal.id}/cooling`)
      }

      const forging = metal.forging || {}
      const overrides = Array.isArray(forging.overrides) ? forging.overrides : []

      overrides.forEach(recipe => {
        event.remove({ id: recipe.id })

        event.custom({
          type: 'overgeared:forging',
          category: recipe.category || 'misc',
          group: '',
          pattern: recipe.pattern,
          tier: recipe.tier || 'stone',
          hammering: recipe.hammering || 1,
          has_quality: recipe.hasQuality !== false,
          quality_difficulty: 'none',
          needs_minigame: recipe.needsMinigame === true,
          need_quenching: recipe.needQuenching !== false,
          key: {
            '#': { item: metal.heated }
          },
          result: { item: recipe.result },
          show_notification: true
        }).id(recipe.id)
      })
    })
  })
}
