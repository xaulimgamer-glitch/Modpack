// Wings are racial traits in Awakening, not normal obtainable equipment.

JEIEvents.hideItems(event => {
  // Icarus: Re-Winged contributes its variants to the same canonical tag.
  event.hide('#icarus:wings')
})
