(function () {
  // Cataclysm special weapons that combine Black Steel with Cursium/Ignitium
  // are converted from direct crafting into smithing upgrades.
  // This keeps Black Steel on the Awakening forged-part path while preserving
  // the native Netherite-like progression of Cursium and Ignitium.

  ServerEvents.recipes(function (event) {
    var upgrades = [
      {
        id: 'cursed_bow',
        output: 'cataclysm:cursed_bow',
        template: 'cataclysm:cursium_upgrade_smithing_template',
        base: 'spartancataclysm:black_steel_longbow',
        addition: 'cataclysm:cursium_ingot'
      },
      {
        id: 'the_annihilator',
        output: 'cataclysm:the_annihilator',
        template: 'cataclysm:cursium_upgrade_smithing_template',
        base: 'spartancataclysm:black_steel_battle_hammer',
        addition: 'cataclysm:cursium_ingot'
      },
      {
        id: 'soul_render',
        output: 'cataclysm:soul_render',
        template: 'cataclysm:cursium_upgrade_smithing_template',
        base: 'spartancataclysm:black_steel_halberd',
        addition: 'cataclysm:cursium_ingot'
      },
      {
        id: 'bulwark_of_the_flame',
        output: 'cataclysm:bulwark_of_the_flame',
        template: 'cataclysm:ignitium_upgrade_smithing_template',
        base: 'cataclysm:black_steel_targe',
        addition: 'cataclysm:ignitium_ingot'
      }
    ]

    upgrades.forEach(function (upgrade) {
      event.remove({ output: upgrade.output })
      event.custom({
        type: 'minecraft:smithing_transform',
        template: { item: upgrade.template },
        base: { item: upgrade.base },
        addition: { item: upgrade.addition },
        result: { item: upgrade.output }
      }).id('awakening:cataclysm_specials/' + upgrade.id)
    })
  })
})()
