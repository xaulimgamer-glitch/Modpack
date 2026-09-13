// Awakening content removals

StartupEvents.modifyCreativeTab('alexscaves:toxic_caves', event => {
  event.remove('alexscaves:nuclear_furnace_component')
})

StartupEvents.modifyCreativeTab('alexscaves:abyssal_chasm', event => {
  event.remove('alexscaves:submarine')
})
