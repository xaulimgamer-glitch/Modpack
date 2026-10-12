// RPG Races — scope plain Orbs of Origin to race + lineage only.
//
// Origins Forge 1.10.0.9 clears every active origin layer when a plain Orb has
// no Targets NBT. In this pack that would also clear rpgclasses:class. Before
// vanilla handles a plain Orb, add explicit empty targets for only the two
// layers that belong to the race lifecycle. Custom targeted Orbs are untouched.

const $RpgOrbCompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag')
const $RpgOrbListTag = Java.loadClass('net.minecraft.nbt.ListTag')
const $RpgOrbTag = Java.loadClass('net.minecraft.nbt.Tag')

function rpgOrbTarget(layerId) {
  var target = new $RpgOrbCompoundTag()
  target.putString('Layer', layerId)
  target.putString('Origin', 'origins:empty')
  return target
}

ItemEvents.rightClicked('origins:orb_of_origin', event => {
  if (!event.player || event.player.isFake()) {
    return
  }

  var stack = event.item
  var tag = stack.getOrCreateTag()
  var existingTargets = tag.getList(
    'Targets',
    $RpgOrbTag.TAG_COMPOUND
  )

  // Preserve intentionally targeted Orbs created by commands/datapacks.
  if (!existingTargets.isEmpty()) {
    return
  }

  var targets = new $RpgOrbListTag()
  targets.add(rpgOrbTarget('rpgraces:races'))
  targets.add(rpgOrbTarget('rpgraces:lineage'))
  tag.put('Targets', targets)
})
