StartupEvents.registry('item', event => {
  event.create('crude_long_sword', 'sword')
    .displayName('Crude Long Sword')
    .tier('wood')
    .maxDamage(64)

  event.create('crude_dagger', 'sword')
    .displayName('Crude Dagger')
    .tier('wood')
    .maxDamage(64)

  event.create('crude_flanged_mace', 'sword')
    .displayName('Crude Flanged Mace')
    .tier('wood')
    .maxDamage(64)

  event.create('crude_battleaxe', 'axe')
    .displayName('Crude Battleaxe')
    .tier('wood')
    .maxDamage(64)

  event.create('crude_sword', 'sword')
    .displayName('Crude Sword')
    .tier('wood')
    .maxDamage(64)
    .texture('minecraft:item/stone_sword')

  event.create('crude_graybeard_staff', 'sword')
    .displayName('Crude Graybeard Staff')
    .tier('wood')
    .maxDamage(64)
})
