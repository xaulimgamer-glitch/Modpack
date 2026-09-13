// Awakening Spartan Weaponry pole recipe override
// Preserve Spartan Weaponry's original pole recipe layout while replacing String with Leather Strip.

ServerEvents.recipes(event => {
  event.remove({ id: 'spartanweaponry:pole_from_string' })

  event.custom({
    type: 'minecraft:crafting_shaped',
    category: 'equipment',
    group: 'spartanweaponry:pole',
    key: {
      '#': {
        item: 'betterend:leather_stripe'
      },
      '|': {
        tag: 'forge:rods/wooden'
      }
    },
    pattern: [
      '| ',
      '|#',
      '| '
    ],
    result: {
      item: 'spartanweaponry:pole'
    },
    show_notification: true
  }).id('spartanweaponry:pole_from_string')
})
