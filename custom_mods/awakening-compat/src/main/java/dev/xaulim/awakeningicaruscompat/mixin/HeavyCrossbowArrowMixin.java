package dev.xaulim.awakeningicaruscompat.mixin;

import com.oblivioussp.spartanweaponry.api.WeaponMaterial;
import com.oblivioussp.spartanweaponry.api.trait.WeaponTrait;
import com.oblivioussp.spartanweaponry.item.HeavyCrossbowItem;
import com.oblivioussp.spartanweaponry.util.Defaults;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.stats.Stats;
import net.minecraft.util.Mth;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.entity.projectile.AbstractArrow;
import net.minecraft.world.item.ArrowItem;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.enchantment.Enchantments;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;
import org.joml.Quaternionf;
import org.joml.Vector3f;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

import java.util.List;
import java.util.function.Predicate;

/**
 * Replaces Spartan Weaponry's bolt-only Heavy Crossbow projectile path with arrows while preserving
 * its load/aim timing, enchantment behavior, material traits and durability handling.
 *
 * The target class is pinned by build.gradle to Spartan Weaponry 1.20.1-3.2.1.
 */
@Mixin(value = HeavyCrossbowItem.class, remap = false)
public abstract class HeavyCrossbowArrowMixin {
    private static final Predicate<ItemStack> AWAKENING_ARROWS = stack -> stack.getItem() instanceof ArrowItem;
    private static final float HEAVY_MAX_INACCURACY = 12.0F;
    private static final float HEAVY_PROJECTILE_VELOCITY = 4.5F;

    @Shadow protected WeaponMaterial material;
    @Shadow protected List<WeaponTrait> rangedTraits;

    @Inject(method = "getAllSupportedProjectiles", at = @At("HEAD"), cancellable = true)
    private void awakening$allSupportedProjectiles(CallbackInfoReturnable<Predicate<ItemStack>> cir) {
        cir.setReturnValue(AWAKENING_ARROWS);
    }

    @Inject(method = "getSupportedHeldProjectiles", at = @At("HEAD"), cancellable = true)
    private void awakening$heldProjectiles(CallbackInfoReturnable<Predicate<ItemStack>> cir) {
        cir.setReturnValue(AWAKENING_ARROWS);
    }

    @Inject(method = "releaseUsing", at = @At("HEAD"), cancellable = true)
    private void awakening$releaseUsing(ItemStack crossbow, Level level, LivingEntity living, int timeLeft, CallbackInfo ci) {
        ci.cancel();
        if (!(living instanceof Player player)) return;

        HeavyCrossbowItem self = (HeavyCrossbowItem) (Object) this;
        boolean creativeOrInfinite = player.getAbilities().instabuild
                || crossbow.getEnchantmentLevel(Enchantments.INFINITY_ARROWS) > 0;

        if (self.getLoadProgress(crossbow, living) == 1.0F) {
            crossbow.getOrCreateTag().putBoolean(HeavyCrossbowItem.NBT_CHARGED, true);

            int projectileCount = crossbow.getEnchantmentLevel(Enchantments.MULTISHOT) > 0 ? 3 : 1;
            ItemStack arrow = living.getProjectile(crossbow);
            if (arrow.isEmpty() || !AWAKENING_ARROWS.test(arrow)) {
                arrow = new ItemStack(Items.ARROW);
            }

            ItemStack storedArrow = arrow.copy();
            storedArrow.setCount(projectileCount);
            CompoundTag storedTag = new CompoundTag();
            storedArrow.save(storedTag);
            crossbow.getOrCreateTag().put(HeavyCrossbowItem.NBT_PROJECTILE, storedTag);

            if (!player.getAbilities().instabuild) {
                arrow.shrink(1);
                if (arrow.isEmpty()) player.getInventory().removeItem(arrow);
            }

            level.playSound(null, player.getX(), player.getY(), player.getZ(),
                    SoundEvents.CROSSBOW_LOADING_END, SoundSource.PLAYERS, 1.0F,
                    1.0F / (level.random.nextFloat() * 0.5F + 1.0F) + 0.2F);
            return;
        }

        CompoundTag projectileTag = crossbow.getOrCreateTag().getCompound(HeavyCrossbowItem.NBT_PROJECTILE);
        ItemStack storedArrow = projectileTag.isEmpty() ? ItemStack.EMPTY : ItemStack.of(projectileTag);
        int usedTicks = self.getUseDuration(crossbow) - timeLeft;

        if (usedTicks < 0 || !crossbow.getOrCreateTag().getBoolean(HeavyCrossbowItem.NBT_CHARGED)) return;
        if (storedArrow.isEmpty() && !creativeOrInfinite) return;
        if (storedArrow.isEmpty()) storedArrow = new ItemStack(Items.ARROW);

        if (!level.isClientSide) {
            int aimTicks = self.getAimTicks(crossbow);
            int remainingInaccuracyTicks = Mth.clamp(aimTicks - usedTicks, 0, aimTicks);
            float inaccuracy = remainingInaccuracyTicks == 0 || aimTicks == 0
                    ? 0.0F
                    : HEAVY_MAX_INACCURACY * ((float) remainingInaccuracyTicks / (float) aimTicks);

            int count = Math.max(1, storedArrow.getCount());
            spawnArrow(crossbow, storedArrow, level, player, creativeOrInfinite, inaccuracy, 0.0F);
            if (count > 1) {
                spawnArrow(crossbow, storedArrow, level, player, creativeOrInfinite, inaccuracy, -10.0F);
                spawnArrow(crossbow, storedArrow, level, player, creativeOrInfinite, inaccuracy, 10.0F);
            }

            int durabilityDamage = count > 1 ? 3 : 1;
            crossbow.hurtAndBreak(durabilityDamage, player,
                    entity -> entity.broadcastBreakEvent(player.getUsedItemHand()));
            crossbow.getOrCreateTag().putBoolean(HeavyCrossbowItem.NBT_CHARGED, false);
            crossbow.getOrCreateTag().put(HeavyCrossbowItem.NBT_PROJECTILE, new CompoundTag());
        }

        level.playSound(null, player.getX(), player.getY(), player.getZ(),
                SoundEvents.CROSSBOW_SHOOT, SoundSource.NEUTRAL, 1.0F,
                1.0F / (level.random.nextFloat() * 0.4F + 1.2F) + 0.75F);
        player.awardStat(Stats.ITEM_USED.get(self));
    }

    private void spawnArrow(ItemStack crossbow, ItemStack arrowStack, Level level, Player player,
                            boolean creativeOrInfinite, float inaccuracy, float projectileAngle) {
        ArrowItem arrowItem = arrowStack.getItem() instanceof ArrowItem
                ? (ArrowItem) arrowStack.getItem()
                : (ArrowItem) Items.ARROW;
        AbstractArrow arrow = arrowItem.createArrow(level, arrowStack, player);

        arrow.setBaseDamage(Defaults.BaseDamageBolt);
        arrow.setCritArrow(true);
        arrow.setSoundEvent(SoundEvents.CROSSBOW_HIT);
        arrow.setShotFromCrossbow(true);

        int piercing = crossbow.getEnchantmentLevel(Enchantments.PIERCING);
        if (piercing > 0) arrow.setPierceLevel((byte) piercing);

        Vec3 up = player.getUpVector(1.0F);
        Quaternionf rotation = new Quaternionf().setAngleAxis(projectileAngle * (Mth.PI / 180.0F), up.x, up.y, up.z);
        Vector3f direction = player.getViewVector(1.0F).toVector3f().rotate(rotation);
        arrow.shoot(direction.x, direction.y, direction.z, HEAVY_PROJECTILE_VELOCITY, inaccuracy);

        if (rangedTraits != null) {
            for (WeaponTrait trait : rangedTraits) {
                trait.getRangedCallback().ifPresent(callback -> callback.onProjectileSpawn(material, arrow));
            }
        }

        int power = crossbow.getEnchantmentLevel(Enchantments.POWER_ARROWS);
        if (power > 0) arrow.setBaseDamage(arrow.getBaseDamage() + power * 0.5D + 0.5D);

        int punch = crossbow.getEnchantmentLevel(Enchantments.PUNCH_ARROWS);
        if (punch > 0) arrow.setKnockback(punch);

        if (crossbow.getEnchantmentLevel(Enchantments.FLAMING_ARROWS) > 0) {
            arrow.setSecondsOnFire(100);
        }

        if (creativeOrInfinite || projectileAngle != 0.0F) {
            arrow.pickup = AbstractArrow.Pickup.CREATIVE_ONLY;
        }

        level.addFreshEntity(arrow);
    }
}
