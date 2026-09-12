// Awakening content removals

JEIEvents.hideItems(event => {
  event.hide('alexscaves:nuclear_furnace_component')
  event.hide('alexscaves:submarine')
})

JEIEvents.removeCategories(event => {
  event.remove('alexscaves:nuclear_furnace')
})
