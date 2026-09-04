// Wings are currently racial traits, not obtainable equipment.
//
// Faerie and Ravenfolk receive their wings through Origins powers using
// icarae_origin:wings, so the wing items/types must remain registered.
// We only suppress the normal crafting routes from Icarus and Icarus: Re-Winged.
ServerEvents.recipes(event => {
  event.remove({ mod: 'icarus' })
  event.remove({ mod: 'icarusrewinged' })
})
