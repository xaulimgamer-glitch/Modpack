(function () {
  var MANIFEST = 'kubejs/awakening/arch_bow_variants.json'

  var $MobType = Java.loadClass('net.minecraft.world.entity.MobType')
  var $ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
  var $LivingEntity = Java.loadClass('net.minecraft.world.entity.LivingEntity')
  var $Player = Java.loadClass('net.minecraft.world.entity.player.Player')
  var $EntityType = Java.loadClass('net.minecraft.world.entity.EntityType')
  var $MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
  var $MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
  var $Attributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
  var $UGEntityTags = Java.loadClass('quek.undergarden.registry.UGTags$Entities')
  var $ForgeEntityTags = Java.loadClass('net.minecraftforge.common.Tags$EntityTypes')
  var $ForgeRegistries = Java.loadClass('net.minecraftforge.registries.ForgeRegistries')

  var $EntityDataProvider = Java.loadClass('com.github.alexthe666.iceandfire.entity.props.EntityDataProvider')
  var $IafServerEvents = Java.loadClass('com.github.alexthe666.iceandfire.event.ServerEvents')

  var $SCConfig = Java.loadClass('dev.cephelo.spartancataclysm.Config')
  var $SCEffects = Java.loadClass('dev.cephelo.spartancataclysm.effects.SCEffects')
  var $CataclysmEffects = Java.loadClass('com.github.L_Ender.cataclysm.init.ModEffect')

  var SUPPORTED_TRAITS = {
    'spartantwilight:armored_damage_bonus': true,
    'spartantwilight:blazing': true,
    'spartancataclysm:accursed_rage': true,
    'spartancataclysm:blazing_brand': true,
    'spartancataclysm:mecha_smite': true,
    'spartancataclysm:mecha_pulse': true,
    'spartanfire:flamed_2': true,
    'spartanfire:iced_2': true,
    'spartanfire:shocked': true
  }

  function fail(message) {
    throw new Error('[Awakening/Bows] ' + message)
  }

  function isPositiveFiniteNumber(value) {
    return typeof value === 'number' && isFinite(value) && value > 0
  }

  function isPositiveInteger(value) {
    return isPositiveFiniteNumber(value) && Math.floor(value) === value
  }

  function isNonNegativeInteger(value) {
    return typeof value === 'number' && isFinite(value) && value >= 0 && Math.floor(value) === value
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0
  }

  function isResourceLocation(value) {
    return isNonEmptyString(value) && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value)
  }

  function materialKey(material) {
    return material.id === 'wood' ? 'wooden' : material.id
  }

  function materialName(material) {
    return material.id === 'wood' ? 'Wooden' : material.name
  }

  function outputId(material, typeId, type) {
    if (material.existing_outputs && material.existing_outputs[typeId]) return material.existing_outputs[typeId]
    return 'awakening:' + materialKey(material) + '_' + type.suffix
  }

  function finalStats(data, type, material) {
    var draw = Math.max(data.balance.minimum_draw_time, Math.round(type.draw_time * material.draw_scale))
    var velocity = type.velocity * material.velocity_scale
    var damage = type.base_damage * material.damage_scale

    if (!isPositiveInteger(draw)) fail('Calculated draw time is invalid for ' + material.id + '/' + type.suffix + ': ' + draw)
    if (!isPositiveFiniteNumber(velocity)) fail('Calculated projectile velocity is invalid for ' + material.id + '/' + type.suffix + ': ' + velocity)
    if (!isPositiveFiniteNumber(damage)) fail('Calculated base damage is invalid for ' + material.id + '/' + type.suffix + ': ' + damage)

    return { draw_time: draw, velocity: velocity, base_damage: damage }
  }

  function validateDamageTrait(material) {
    var trait = material.damage_trait
    if (!trait) return

    if (!isPositiveFiniteNumber(trait.multiplier)) {
      fail('Material ' + material.id + ' has invalid damage_trait multiplier')
    }

    if (trait.kind === 'mob_type') {
      if (trait.value !== 'UNDEAD') fail('Material ' + material.id + ' has unsupported mob_type damage_trait: ' + trait.value)
      return
    }

    if (trait.kind === 'entity_tag') {
      if (trait.value !== 'undergarden:rotspawn') fail('Material ' + material.id + ' has unsupported entity_tag damage_trait: ' + trait.value)
      return
    }

    if (trait.kind === 'namespace_non_boss') {
      if (!isNonEmptyString(trait.value) || !/^[a-z0-9_.-]+$/.test(trait.value)) {
        fail('Material ' + material.id + ' has invalid namespace_non_boss damage_trait')
      }
      return
    }

    fail('Material ' + material.id + ' has unsupported damage_trait kind: ' + trait.kind)
  }

  function validatePostHitEffect(material) {
    var effect = material.post_hit_effect
    if (!effect) return

    if (!isResourceLocation(effect.id)) fail('Material ' + material.id + ' has invalid post_hit_effect id: ' + effect.id)
    if (!isPositiveInteger(effect.duration)) fail('Material ' + material.id + ' has invalid post_hit_effect duration')
    if (!isNonNegativeInteger(effect.amplifier)) fail('Material ' + material.id + ' has invalid post_hit_effect amplifier')
  }

  function validateSpecialTraits(material) {
    if (material.special_traits === undefined) return
    if (!Array.isArray(material.special_traits)) fail('Material ' + material.id + ' has invalid special_traits')

    var seen = {}
    material.special_traits.forEach(function (trait) {
      if (!SUPPORTED_TRAITS[trait]) fail('Material ' + material.id + ' has unsupported special trait: ' + trait)
      if (seen[trait]) fail('Material ' + material.id + ' has duplicate special trait: ' + trait)
      seen[trait] = true
    })
  }

  function validateData(data) {
    if (!data || data.schema !== 3) fail('Unsupported manifest schema; expected schema 3')
    if (!data.bow_types || typeof data.bow_types !== 'object') fail('bow_types is missing or invalid')
    if (!data.assembly || typeof data.assembly !== 'object') fail('assembly is missing or invalid')
    if (!Array.isArray(data.materials) || data.materials.length === 0) fail('materials is missing or empty')
    if (!data.balance || typeof data.balance !== 'object') fail('balance is missing or invalid')
    if (data.balance.draw_rounding !== 'round') fail('Unsupported draw_rounding; expected "round"')
    if (!isPositiveInteger(data.balance.minimum_draw_time)) fail('minimum_draw_time must be a positive integer')
    if (!isNonEmptyString(data.assembly.rod)) fail('assembly.rod is missing or invalid')

    var typeIds = Object.keys(data.bow_types)
    if (typeIds.length === 0) fail('bow_types is empty')

    typeIds.forEach(function (typeId) {
      var type = data.bow_types[typeId]
      if (!type || typeof type !== 'object') fail('Bow type ' + typeId + ' is invalid')
      if (!isNonEmptyString(type.suffix)) fail('Bow type ' + typeId + ' has no valid suffix')
      if (!isNonEmptyString(type.name)) fail('Bow type ' + typeId + ' has no valid name')
      if (!isPositiveInteger(type.draw_time)) fail('Bow type ' + typeId + ' has invalid draw_time')
      if (!isPositiveFiniteNumber(type.velocity)) fail('Bow type ' + typeId + ' has invalid velocity')
      if (!isPositiveFiniteNumber(type.base_damage)) fail('Bow type ' + typeId + ' has invalid base_damage')
      if (!isPositiveInteger(type.max_damage)) fail('Bow type ' + typeId + ' has invalid max_damage')
      if (!isNonEmptyString(type.handle)) fail('Bow type ' + typeId + ' has invalid handle')
      if (!isNonEmptyString(type.string)) fail('Bow type ' + typeId + ' has invalid string')
    })

    var materialIds = {}
    var outputIds = {}

    data.materials.forEach(function (material, index) {
      if (!material || typeof material !== 'object') fail('Material at index ' + index + ' is invalid')
      if (!isNonEmptyString(material.id)) fail('Material at index ' + index + ' has no id')
      if (materialIds[material.id]) fail('Duplicate material id: ' + material.id)
      materialIds[material.id] = true

      if (!isNonEmptyString(material.name)) fail('Material ' + material.id + ' has no valid name')
      if (!isPositiveFiniteNumber(material.damage_scale)) fail('Material ' + material.id + ' has invalid damage_scale')
      if (!isPositiveFiniteNumber(material.velocity_scale)) fail('Material ' + material.id + ' has invalid velocity_scale')
      if (!isPositiveFiniteNumber(material.draw_scale)) fail('Material ' + material.id + ' has invalid draw_scale')
      if (!isNonNegativeInteger(material.enchantability)) fail('Material ' + material.id + ' has invalid enchantability')
      if (!isResourceLocation(material.source_longbow)) fail('Material ' + material.id + ' has invalid source_longbow: ' + material.source_longbow)

      if (material.id !== 'wood' && !isNonEmptyString(material.crafting_material)) {
        fail('Material ' + material.id + ' has no crafting_material')
      }
      if (material.color && !/^[0-9A-Fa-f]{6}$/.test(material.color)) {
        fail('Material ' + material.id + ' has invalid color: ' + material.color)
      }
      if (material.fire_resistant !== undefined && typeof material.fire_resistant !== 'boolean') {
        fail('Material ' + material.id + ' has invalid fire_resistant flag')
      }

      validateDamageTrait(material)
      validatePostHitEffect(material)
      validateSpecialTraits(material)

      typeIds.forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var output = outputId(material, typeId, type)
        if (!isResourceLocation(output)) fail('Invalid output id for ' + material.id + '/' + typeId + ': ' + output)
        if (outputIds[output]) fail('Duplicate bow output id: ' + output)
        outputIds[output] = true
        finalStats(data, type, material)
      })
    })

    if (!materialIds.wood) fail('Wood material definition is missing')
    return data
  }

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    return validateData(data)
  }

  function model(typeId, material) {
    if (material.id === 'wood') {
      var base = 'awakening:item/bows/wooden_' + typeId
      var pulling = base + '_pulling_'
      var parent = typeId === 'recurve_bow'
        ? 'awakening:item/bows/wooden_recurve_bow_base'
        : typeId === 'flat_bow'
          ? 'awakening:item/bows/wooden_flat_bow_base'
          : 'awakening:item/bows/wooden_bow_base'
      return {
        parent: parent,
        textures: { layer0: base },
        overrides: [
          { predicate: { pulling: 1 }, model: pulling + '0' },
          { predicate: { pulling: 1, pull: 0.65 }, model: pulling + '1' },
          { predicate: { pulling: 1, pull: 0.9 }, model: pulling + '2' }
        ]
      }
    }

    var base = 'awakening:item/bows/' + typeId
    var pulling = base + '_pulling_'
    return {
      parent: base,
      overrides: [
        { predicate: { pulling: 1 }, model: pulling + '0' },
        { predicate: { pulling: 1, pull: 0.65 }, model: pulling + '1' },
        { predicate: { pulling: 1, pull: 0.9 }, model: pulling + '2' }
      ]
    }
  }

  function hasTrait(material, trait) {
    return Array.isArray(material.special_traits) && material.special_traits.indexOf(trait) >= 0
  }

  function ownerOf(projectile) {
    return projectile == null ? null : projectile.getOwner()
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function damageTraitMatches(target, trait) {
    if (!target || !trait) return false

    if (trait.kind === 'mob_type') {
      return trait.value === 'UNDEAD' && target.getMobType().equals($MobType.UNDEAD)
    }

    if (trait.kind === 'entity_tag') {
      return trait.value === 'undergarden:rotspawn' && target.getType().is($UGEntityTags.ROTSPAWN)
    }

    if (trait.kind === 'namespace_non_boss') {
      var key = $ForgeRegistries.ENTITY_TYPES.getKey(target.getType())
      return key != null && key.getNamespace() === trait.value && !target.getType().is($ForgeEntityTags.BOSSES)
    }

    return false
  }

  function applyCataclysmPreHit(material, hit, target, owner) {
    if (owner == null) return

    if (hasTrait(material, 'spartancataclysm:accursed_rage')) {
      var rageEffect = $SCEffects.ACCURSED_RAGE.get()
      var oldRage = owner.getEffect(rageEffect)
      var rageLevel = oldRage == null ? 0 : Math.min($SCConfig.accursedRageMaximum, oldRage.getAmplifier() + 1)

      if (Math.random() <= $SCConfig.accursedRageChance) {
        owner.addEffect(new $MobEffectInstance(rageEffect, $SCConfig.accursedRageDuration, rageLevel))
      }

      var newRage = owner.getEffect(rageEffect)
      if (newRage != null) {
        hit.setDamage(hit.getDamage() + (newRage.getAmplifier() + 1) * $SCConfig.accursedRageExtraDamage)
      }
    }

    if (hasTrait(material, 'spartancataclysm:blazing_brand') && Math.random() <= $SCConfig.blazingBrandChance) {
      var brandEffect = $SCEffects.BLAZING_BRAND_CUSTOM.get()
      var oldBrand = target.getEffect(brandEffect)
      var brandLevel = oldBrand == null ? 0 : Math.min($SCConfig.blazingBrandMaximum, oldBrand.getAmplifier() + 1)
      target.addEffect(new $MobEffectInstance(brandEffect, $SCConfig.blazingBrandDuration, brandLevel))

      var factor = $SCConfig.lifestealMultiplier
      if (factor > 0 && owner instanceof $Player) {
        factor = factor / clamp(owner.getAttributeValue($Attributes.ATTACK_SPEED), 0.5, 2.0)
      }
      if (factor > 0 && Math.random() <= $SCConfig.blazingBrandLifestealChance) {
        owner.heal(factor * (brandLevel + 1))
      }
    }

    if (hasTrait(material, 'spartancataclysm:mecha_pulse')) {
      var cooldownEffect = $SCEffects.PULSE_COOLDOWN.get()
      if (owner.getEffect(cooldownEffect) != null) return

      var chargeEffect = $SCEffects.PULSE_CHARGE.get()
      var oldCharge = owner.getEffect(chargeEffect)
      var chargeLevel = oldCharge == null ? 0 : Math.min($SCConfig.mechaPulseStunThreshold, oldCharge.getAmplifier() + 1)
      var reachedMax = oldCharge != null && chargeLevel >= $SCConfig.mechaPulseStunThreshold && oldCharge.getAmplifier() === chargeLevel - 1

      if (Math.random() <= $SCConfig.mechaPulseChargeChance) {
        owner.addEffect(new $MobEffectInstance(chargeEffect, $SCConfig.mechaPulseEffectDuration, chargeLevel))
        if (reachedMax) {
          owner.removeEffect(chargeEffect)
          owner.addEffect(new $MobEffectInstance(cooldownEffect, $SCConfig.mechaPulseCooldown, 0, false, false, true))
          target.addEffect(new $MobEffectInstance($CataclysmEffects.EFFECTSTUN.get(), $SCConfig.mechaPulseStunDuration, 0))
          hit.setDamage(hit.getDamage() + $SCConfig.mechaPulseExtraDamage)
        }
      }
    }
  }

  function applyPreHitTraits(material, hit) {
    var target = hit.getEntity()
    if (!(target instanceof $LivingEntity)) return

    if (material.damage_trait && damageTraitMatches(target, material.damage_trait)) {
      hit.setDamage(hit.getDamage() * material.damage_trait.multiplier)
    }

    if (hasTrait(material, 'spartantwilight:armored_damage_bonus') && target.getArmorValue() > 0) {
      var coverage = target.getArmorCoverPercentage()
      hit.setDamage(hit.getDamage() + (coverage > 0 ? Math.floor(2 * coverage) : 2))
    }

    applyCataclysmPreHit(material, hit, target, ownerOf(hit.getProjectile()))
  }

  function applyFireTraits(material, target, owner) {
    if (hasTrait(material, 'spartantwilight:blazing')) {
      if (!target.fireImmune()) target.setSecondsOnFire(15)
    }

    if (hasTrait(material, 'spartanfire:flamed_2')) {
      target.setSecondsOnFire(15)
      if (owner != null) target.knockback(1.0, owner.getX() - target.getX(), owner.getZ() - target.getZ())
    }
  }

  function applyIcedTrait(material, target) {
    if (!hasTrait(material, 'spartanfire:iced_2')) return

    var ticks = 300
    $EntityDataProvider.getCapability(target).ifPresent(function (data) {
      data.frozenData.setFrozen(target, ticks)
    })
    target.addEffect(new $MobEffectInstance($MobEffects.MOVEMENT_SLOWDOWN, ticks, 2))
  }

  function applyShockedTrait(material, target, owner) {
    if (!hasTrait(material, 'spartanfire:shocked') || owner == null) return

    target.knockback(1.0, owner.getX() - target.getX(), owner.getZ() - target.getZ())

    var allowed = true
    if (owner instanceof $Player && owner.attackAnim > 0.2) allowed = false
    if (owner.level().isClientSide || !allowed) return

    var lightning = $EntityType.LIGHTNING_BOLT.create(target.level())
    if (lightning == null) return
    lightning.getTags().add($IafServerEvents.BOLT_DONT_DESTROY_LOOT)
    lightning.getTags().add(owner.getStringUUID())
    lightning.moveTo(target.position())
    target.level().addFreshEntity(lightning)
  }

  function applyMechaSmite(material, target, owner) {
    if (!hasTrait(material, 'spartancataclysm:mecha_smite') || owner == null) return

    if (Math.random() <= $SCConfig.mechaSmiteChance) {
      if ($SCConfig.mechaSmiteWitherDuration > 0) {
        target.addEffect(new $MobEffectInstance($MobEffects.WITHER, $SCConfig.mechaSmiteWitherDuration, $SCConfig.mechaSmiteWitherAmplifier))
      }
      if ($SCConfig.mechaSmiteFireDuration > 0) target.setSecondsOnFire($SCConfig.mechaSmiteFireDuration)
    }

    var threshold = $SCConfig.mechaSmiteRegenThresholdType
      ? owner.getMaxHealth() * $SCConfig.mechaSmiteRegenThresholdPercent
      : $SCConfig.mechaSmiteRegenThreshold

    if (Math.random() <= $SCConfig.mechaSmiteRegenChance && owner.getHealth() < threshold) {
      owner.addEffect(new $MobEffectInstance($MobEffects.REGENERATION, $SCConfig.mechaSmiteRegenDuration, $SCConfig.mechaSmiteRegenAmplifier))
    }
  }

  function applyPostHitTraits(material, target, arrow) {
    var owner = ownerOf(arrow)

    if (material.post_hit_effect) {
      target.addEffect(new $MobEffectInstance(
        $ForgeRegistries.MOB_EFFECTS.getValue(new $ResourceLocation(material.post_hit_effect.id)),
        material.post_hit_effect.duration,
        material.post_hit_effect.amplifier
      ))
    }

    applyFireTraits(material, target, owner)
    applyIcedTrait(material, target)
    applyShockedTrait(material, target, owner)
    applyMechaSmite(material, target, owner)
  }

  function configureHitTraits(bow, material) {
    var hasExistingTrait = material.damage_trait || material.post_hit_effect
    var hasAddonTraits = Array.isArray(material.special_traits) && material.special_traits.length > 0
    if (!hasExistingTrait && !hasAddonTraits) return

    bow.onArrowHit(function (arrow) {
      arrow.hitEntity(function (hit) {
        applyPreHitTraits(material, hit)
      })
      arrow.postHurtEffect(function (target, projectile) {
        applyPostHitTraits(material, target, projectile)
      })
    })
  }

  StartupEvents.registry('item', function (event) {
    var data = loadData()

    data.materials.forEach(function (material) {
      if (material.existing_outputs && material.id !== 'wood') return

      Object.keys(data.bow_types).forEach(function (typeId) {
        var type = data.bow_types[typeId]
        var stats = finalStats(data, type, material)
        var item = event.create(outputId(material, typeId, type), 'bow')
          .displayName(materialName(material) + ' ' + type.name)
          .maxDamage(type.max_damage)
          .modelJson(model(typeId, material))

        if (material.color) item.color(0, parseInt(material.color, 16))
        if (material.fire_resistant) item.fireResistant(true)

        item.bow(function (bow) {
          bow.modifyBow(function (attributes) {
            attributes.fullChargeTick(stats.draw_time).arrowSpeed(stats.velocity).baseDamage(stats.base_damage)
            attributes.enchantmentValue(material.enchantability)
          })

          configureHitTraits(bow, material)
        })
      })
    })
  })
})()
