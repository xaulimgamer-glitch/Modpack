// Wings are racial traits in Awakening, not obtainable equipment.
//
// Faerie and Ravenfolk still depend on Icarus' registered wing types through
// Origins powers, so the items themselves must remain registered.
// The canonical #icarus:wings tag includes both Icarus and Icarus: Re-Winged.
ServerEvents.recipes(event => {
  // Remove every recipe that produces a wing, including compatibility recipes
  // added outside the two Icarus namespaces.
  event.remove({ output: '#icarus:wings' })
})
