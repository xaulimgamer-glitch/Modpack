(function () {
  var MANIFEST = 'kubejs/awakening/crossbow_variants.json'

  var $ArrowItem = Java.loadClass('net.minecraft.world.item.ArrowItem')
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

  var $EntityFireDragon = Java.loadClass('com.github.alexthe666.iceandfire.entity.EntityFireDragon')
  var $EntityIceDragon = Java.loadClass('com.github.alexthe666.iceandfire.entity.EntityIceDragon')
  var $EntityDeathWorm = Java.loadClass('com.github.alexthe666.iceandfire.entity.EntityDeathWorm')
  var $EntityDataProvider = Java.loadClass('com.github.alexthe666.iceandfire.entity.props.EntityDataProvider')
  var $IafServerEvents = Java.loadClass('com.github.alexthe666.iceandfire.event.ServerEvents')

  var $SCConfig = Java.loadClass('dev.cephelo.spartancataclysm.Config')
  var $SCEffects = Java.loadClass('dev.cephelo.spartancataclysm.effects.SCEffects')
  var $CataclysmEffects = Java.loadClass('com.github.L_Ender.cataclysm.init.ModEffect')

  function loadData() {
    var data = JSON.parse(JsonIO.readString(MANIFEST))
    if (!data || data.schema !== 5 || !data.families || !Array.isArray(data.materials)) {
      throw new Error('[Awakening/Crossbows] Unsupported manifest')
    }
    return data
  }

  function materialKey(material) {
    return material.id === 'wood' ? 'wooden' : material.id
  }

  function materialName(material) {
    return material.id === 'wood' ? 'Wooden' : material.name
  }

  function isArrow(stack) {
    return stack != null && stack.getItem() instanceof $ArrowItem
  }

  function chargeTicks(family, material) {
    return Math.floor(family.charge_ticks * (material.charge_scale || 1.0))
  }

  function model(familyId, material) {
    var texture = material.id === 'wood' ? familyId : 'iron_' + familyId
    var base = 'awakening:item/crossbows/' + familyId

    return {
      parent: 'awakening:item/crossbows/crossbow_base',
      textures: { layer0: 'awakening:item/crossbows/' + texture },
      overrides: [
        { predicate: { pulling: 1 }, model: base + '_pulling_0' },
        { predicate: { pulling: 1, pull: 0.58 }, model: base + '_pulling_1' },
        { predicate: { pulling: 1, pull: 1.0 }, model: base + '_pulling_2' },
        { predicate: { charged: 1 }, model: base + '_arrow' }
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

  function applyDragonBonus(material, target, owner) {
    if (owner == null) return

    if (target instanceof $EntityIceDragon) {
      if (hasTrait(material, 'spartanfire:ice_dragon_damage_bonus_2')) {
        target.hurt(owner.level().damageSources().inFire(), 13.5)
      } else if (hasTrait(material, 'spartanfire:ice_dragon_damage_bonus_1')) {
        target.hurt(owner.level().damageSources().inFire(), 9.5)
      }
    }

    if (target instanceof $EntityFireDragon) {
      if (hasTrait(material, 'spartanfire:fire_dragon_damage_bonus_2')) {
        target.hurt(owner.level().damageSources().drown(), 13.5)
      } else if (hasTrait(material, 'spartanfire:fire_dragon_damage_bonus_1')) {
        target.hurt(owner.level().damageSources().drown(), 9.5)
      }
    }
  }

  function applyMyrmexBonus(material, target, owner) {
    if (!hasTrait(material, 'spartanfire:non-arthropod_damage_bonus') || owner == null) return

    var allowed = true
    if (owner instanceof $Player && owner.attackAnim > 0.2) allowed = false
    if (!allowed) return

    if (!target.getMobType().equals($MobType.ARTHROPOD)) {
      target.hurt(owner.level().damageSources().generic(), 5.0)
    }
    if (target instanceof $EntityDeathWorm) {
      target.hurt(owner.level().damageSources().generic(), 5.0)
    }
  }

  function applyFireTraits(material, target, owner) {
    if (hasTrait(material, 'spartantwilight:blazing')) {
      if (!target.fireImmune()) target.setSecondsOnFire(15)
    }

    var flamedSeconds = 0
    if (hasTrait(material, 'spartanfire:flamed_2')) flamedSeconds = 15
    else if (hasTrait(material, 'spartanfire:flamed_1')) flamedSeconds = 5

    if (flamedSeconds > 0) {
      target.setSecondsOnFire(flamedSeconds)
      if (owner != null) target.knockback(1.0, owner.getX() - target.getX(), owner.getZ() - target.getZ())
    }
  }

  function applyIcedTraits(material, target) {
    var level = 0
    if (hasTrait(material, 'spartanfire:iced_2')) level = 2
    else if (hasTrait(material, 'spartanfire:iced_1')) level = 1
    if (level === 0) return

    var ticks = 100 + level * 100
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
    applyIcedTraits(material, target)
    applyShockedTrait(material, target, owner)
    applyDragonBonus(material, target, owner)
    applyMyrmexBonus(material, target, owner)

    if (hasTrait(material, 'spartanfire:poisoned')) {
      target.addEffect(new $MobEffectInstance($MobEffects.POISON, 200, 2))
    }

    applyMechaSmite(material, target, owner)
  }

  function configureHitTraits(crossbow, material) {
    var hasExistingTrait = material.damage_trait || material.post_hit_effect
    var hasAddonTraits = Array.isArray(material.special_traits) && material.special_traits.length > 0
    if (!hasExistingTrait && !hasAddonTraits) return

    crossbow.onArrowHit(function (arrow) {
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
    var customFamilies = ['pistol_crossbow', 'arbalest']
    var registered = 0

    data.materials.forEach(function (material) {
      customFamilies.forEach(function (familyId) {
        var family = data.families[familyId]
        var id = 'awakening:' + materialKey(material) + '_' + family.suffix
        var item = event.create(id, 'crossbow')
          .displayName(materialName(material) + ' ' + family.name)
          .modelJson(model(familyId, material))

        if (material.color) item.color(0, '#' + material.color)

        if (!material.unbreakable) {
          if (typeof material.durability !== 'number' || material.durability <= 0) {
            throw new Error('[Awakening/Crossbows] Invalid durability for ' + material.id)
          }
          item.maxDamage(material.durability)
        } else {
          item.unstackable()
        }

        if (material.fire_resistant) item.fireResistant(true)

        item.crossbow(function (crossbow) {
          crossbow.modifyCrossbow(function (attributes) {
            attributes
              .fullChargeTick(chargeTicks(family, material))
              .arrowDamage(family.projectile_damage)
              .arrowSpeed(family.projectile_velocity)
              .ammo(isArrow)
              .ammoHeld(isArrow)
            attributes.enchantmentValue(material.enchantability)
          })

          configureHitTraits(crossbow, material)
        })

        registered++
      })
    })

    console.info('[Awakening/Crossbows] Registered ' + registered + ' custom crossbows from ' + data.materials.length + ' audited Heavy Crossbow materials.')
    console.info('[Awakening/Crossbows] Addon gameplay traits are mapped from the audited Spartan material assignments; addon-only particles and hit sounds are intentionally not duplicated.')
  })
})()
