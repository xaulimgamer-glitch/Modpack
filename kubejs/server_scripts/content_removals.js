// Awakening content removals
// Items remain registered for world/save compatibility, but are removed from progression.

ServerEvents.recipes(event => {
  // Alex's Caves Nuclear Furnace is assembled from this craftable component.
  // Removing every recipe that outputs the component makes the multiblock unobtainable in survival.
  event.remove({ output: 'alexscaves:nuclear_furnace_component' })
})
