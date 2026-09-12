// Awakening content removals
// Items remain registered for world/save compatibility, but are removed from progression.

ServerEvents.recipes(event => {
  // Alex's Caves Nuclear Furnace is assembled from this craftable component.
  // Removing every recipe that outputs the component makes the multiblock unobtainable in survival.
  event.remove({ output: 'alexscaves:nuclear_furnace_component' })

  // Defensive removal for datapack/compat recipes. Alex's Caves can also create submarines directly.
  event.remove({ output: 'alexscaves:submarine' })
})

// Submarines are spawned directly by Abyssal Ruins and by the Enigmatic Engine,
// so recipe removal alone cannot remove them from progression.
// KubeJS' spawned event also fires when an existing entity is loaded from a save;
// cancelling it therefore makes the removal apply to both newly created and legacy submarine entities.
EntityEvents.spawned('alexscaves:submarine', event => {
  event.cancel()
})
