// Wings are racial traits in Awakening, not normal obtainable equipment.
// Keep the registered items intact for Origins/racial integrations, but remove
// their normal creative-tab entries.

StartupEvents.modifyCreativeTab('icarus:icarus', event => {
  event.remove('@icarus')
})

StartupEvents.modifyCreativeTab('icarusrewinged:rewinged_tab', event => {
  event.remove('@icarusrewinged')
})
