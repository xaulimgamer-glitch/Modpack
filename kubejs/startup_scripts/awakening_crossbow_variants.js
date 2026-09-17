(function () {
  var MANIFEST = 'kubejs/awakening/crossbow_variants.json'
  var $ArrowItem = Java.loadClass('net.minecraft.world.item.ArrowItem')
  var $MobType = Java.loadClass('net.minecraft.world.entity.MobType')
  var $UGEntityTags = Java.loadClass('quek.undergarden.registry.UGTags$Entities')
  var $ForgeEntityTags = Java.loadClass('net.minecraftforge.common.Tags$EntityTypes')
  var $ForgeRegistries = Java.loadClass('net.minecraftforge.registries.ForgeRegistries')

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 5 || !data.families || !Array.isArray(data.materials)) throw new Error('[Awakening/Crossbows] Unsupported manifest')
    return data
  }
  function materialKey(material) { return material.id === 'wood' ? 'wooden' : material.id }
  function materialName(material) { return material.id === 'wood' ? 'Wooden' : material.name }
  function isArrow(stack) { return stack != null && stack.getItem() instanceof $ArrowItem }
  function chargeTicks(family, material) { return Math.floor(family.charge_ticks * (material.charge_scale || 1.0)) }
  function model(familyId, material) {
    var texture = material.id === 'wood' ? familyId : 'iron_' + familyId
    var base = 'awakening:item/crossbows/' + familyId
    return { parent: 'awakening:item/crossbows/crossbow_base', textures: { layer0: 'awakening:item/crossbows/' + texture }, overrides: [
      { predicate: { pulling: 1 }, model: base + '_pulling_0' },
      { predicate: { pulling: 1, pull: 0.58 }, model: base + '_pulling_1' },
      { predicate: { pulling: 1, pull: 1.0 }, model: base + '_pulling_2' },
      { predicate: { charged: 1 }, model: base + '_arrow' }
    ] }
  }
  function damageTraitMatches(target, trait) {
    if (!target || !trait) return false
    if (trait.kind === 'mob_type') return trait.value === 'UNDEAD' && target.getMobType().equals($MobType.UNDEAD)
    if (trait.kind === 'entity_tag') return trait.value === 'undergarden:rotspawn' && target.getType().is($UGEntityTags.ROTSPAWN)
    if (trait.kind === 'namespace_non_boss') {
      var key = $ForgeRegistries.ENTITY_TYPES.getKey(target.getType())
      return key != null && key.getNamespace() === trait.value && !target.getType().is($ForgeEntityTags.BOSSES)
    }
    return false
  }
  function configureHitTraits(crossbow, material) {
    if (!material.damage_trait && !material.post_hit_effect) return
    crossbow.onArrowHit(function (arrow) {
      if (material.damage_trait) arrow.hitEntity(function (event) {
        var target = event.getEntity()
        if (damageTraitMatches(target, material.damage_trait)) event.setDamage(event.getDamage() * material.damage_trait.multiplier)
      })
      if (material.post_hit_effect) arrow.postHurtEffect(function (target) {
        target.potionEffects.add(material.post_hit_effect.id, material.post_hit_effect.duration, material.post_hit_effect.amplifier)
      })
    })
  }
  StartupEvents.registry('item', function (event) {
    var data = loadData()
    var customFamilies = ['pistol_crossbow', 'arbalest']
    var registered = 0
    var deferredTraits = 0
    data.materials.forEach(function (material) {
      customFamilies.forEach(function (familyId) {
        var family = data.families[familyId]
        var id = 'awakening:' + materialKey(material) + '_' + family.suffix
        var item = event.create(id, 'crossbow').displayName(materialName(material) + ' ' + family.name).modelJson(model(familyId, material))
        if (!material.unbreakable) {
          if (typeof material.durability !== 'number' || material.durability <= 0) throw new Error('[Awakening/Crossbows] Invalid durability for ' + material.id)
          item.maxDamage(material.durability)
        }
        if (material.fire_resistant) item.fireResistant(true)
        item.crossbow(function (crossbow) {
          crossbow.modifyCrossbow(function (attributes) {
            attributes.fullChargeTick(chargeTicks(family, material)).arrowDamage(family.projectile_damage).arrowSpeed(family.projectile_velocity).ammo(isArrow).ammoHeld(isArrow)
            attributes.enchantmentValue(material.enchantability)
          })
          configureHitTraits(crossbow, material)
        })
        registered++
        if (material.special_traits && material.special_traits.length > 0) deferredTraits += material.special_traits.length
      })
    })
    console.info('[Awakening/Crossbows] Registered ' + registered + ' custom crossbows from ' + data.materials.length + ' audited Heavy Crossbow materials.')
    if (deferredTraits > 0) console.info('[Awakening/Crossbows] ' + deferredTraits + ' audited addon trait assignments are recorded in the manifest; only traits with verified RangedJS mappings are active.')
  })
})()
