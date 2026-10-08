package dev.xaulim.awakeningcompat.shell;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import dev.xaulim.awakeningcompat.network.AwakeningNetwork;
import io.github.edwinmindcraft.apoli.api.IDynamicFeatureConfiguration;
import io.github.edwinmindcraft.apoli.api.power.factory.EntityAction;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.nbt.Tag;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EquipmentSlot;

public final class TortleShellAction extends EntityAction<TortleShellAction.Configuration> {

    public static final float MAX_SHELL_GUARD = 32.0F;
    public static final long SHELL_RECHARGE_TICKS = 20L * 20L;

    private static final String SHELL_GUARD_TAG = "AwakeningCompatTortleShellGuard";
    private static final String SHELL_RECHARGE_START_TAG = "AwakeningCompatTortleShellRechargeStart";

    public TortleShellAction() {
        super(Configuration.CODEC);
    }

    @Override
    public void execute(Configuration configuration, Entity entity) {
        if (!(entity instanceof ServerPlayer player) || !configuration.enabled()) {
            return;
        }

        if (!player.getItemBySlot(EquipmentSlot.CHEST).is(TortleShellRegistries.TORTLE_SHELL_ITEM.get())) {
            player.displayClientMessage(Component.literal("Your natural shell is not in place."), true);
            return;
        }

        if (player.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get())) {
            exitShell(player);
            return;
        }

        updateShellRecharge(player);
        float shellGuard = getShellGuard(player);
        if (shellGuard <= 0.0F) {
            AwakeningNetwork.syncTortleShellGuard(player, 0.0F);
            player.displayClientMessage(Component.literal("Your shell guard has not recovered yet."), true);
            return;
        }

        cancelShellRecharge(player);
        player.stopUsingItem();
        player.setSprinting(false);
        player.addEffect(new MobEffectInstance(
                TortleShellRegistries.TORTLE_SHELL_EFFECT.get(),
                Integer.MAX_VALUE,
                0,
                false,
                false,
                false
        ));
        AwakeningNetwork.syncTortleShellGuard(player, shellGuard);
        player.level().playSound(null, player.blockPosition(), SoundEvents.ARMOR_EQUIP_TURTLE, SoundSource.PLAYERS, 0.85F, 0.75F);
    }

    public static float getShellGuard(ServerPlayer player) {
        if (!TortleShellLifecycle.isOwner(player)) {
            return 0.0F;
        }

        CompoundTag data = player.getPersistentData();
        if (!data.contains(SHELL_GUARD_TAG, Tag.TAG_ANY_NUMERIC)) {
            return initializeShellGuard(player);
        }

        float stored = data.getFloat(SHELL_GUARD_TAG);
        float normalized = normalizeGuard(stored);
        if (Float.compare(stored, normalized) != 0) {
            data.putFloat(SHELL_GUARD_TAG, normalized);
        }
        return normalized;
    }

    /**
     * Initializes legacy/new Tortle state exactly once. After initialization the
     * guard tag remains present even when the reserve reaches zero.
     */
    public static float initializeShellGuard(ServerPlayer player) {
        if (!TortleShellLifecycle.isOwner(player)) {
            return 0.0F;
        }

        CompoundTag data = player.getPersistentData();
        if (!data.contains(SHELL_GUARD_TAG, Tag.TAG_ANY_NUMERIC)) {
            data.putFloat(SHELL_GUARD_TAG, MAX_SHELL_GUARD);
            data.remove(SHELL_RECHARGE_START_TAG);
            return MAX_SHELL_GUARD;
        }
        return getShellGuard(player);
    }

    public static void setShellGuard(ServerPlayer player, float amount) {
        if (!TortleShellLifecycle.isOwner(player)) {
            return;
        }

        float clamped = normalizeGuard(amount);
        player.getPersistentData().putFloat(SHELL_GUARD_TAG, clamped);
        if (clamped >= MAX_SHELL_GUARD) {
            cancelShellRecharge(player);
        }
    }

    public static void fullyRechargeShellGuard(ServerPlayer player) {
        if (!TortleShellLifecycle.isOwner(player)) {
            return;
        }

        player.getPersistentData().putFloat(SHELL_GUARD_TAG, MAX_SHELL_GUARD);
        cancelShellRecharge(player);
    }

    /**
     * Removes all reserve state because the player is no longer a Tortle.
     * This must not be used for ordinary shell exit, logout or death.
     */
    public static void clearShellGuardState(ServerPlayer player) {
        CompoundTag data = player.getPersistentData();
        data.remove(SHELL_GUARD_TAG);
        data.remove(SHELL_RECHARGE_START_TAG);
    }

    public static void copyShellGuardState(ServerPlayer original, ServerPlayer clone) {
        CompoundTag source = original.getPersistentData();
        CompoundTag target = clone.getPersistentData();

        target.remove(SHELL_GUARD_TAG);
        target.remove(SHELL_RECHARGE_START_TAG);

        if (!TortleShellLifecycle.isOwner(original)
                || !source.contains(SHELL_GUARD_TAG, Tag.TAG_ANY_NUMERIC)) {
            return;
        }

        float guard = normalizeGuard(source.getFloat(SHELL_GUARD_TAG));
        target.putFloat(SHELL_GUARD_TAG, guard);

        if (guard < MAX_SHELL_GUARD
                && source.contains(SHELL_RECHARGE_START_TAG, Tag.TAG_ANY_NUMERIC)) {
            target.putLong(SHELL_RECHARGE_START_TAG, source.getLong(SHELL_RECHARGE_START_TAG));
        }
    }

    /**
     * Starts a new 20-second continuous-outside-shell recovery window.
     */
    public static void startShellRecharge(ServerPlayer player) {
        if (!TortleShellLifecycle.isOwner(player)) {
            return;
        }

        if (getShellGuard(player) >= MAX_SHELL_GUARD) {
            cancelShellRecharge(player);
            return;
        }

        player.getPersistentData().putLong(SHELL_RECHARGE_START_TAG, player.level().getGameTime());
    }

    /**
     * Ensures a recovery window exists without resetting an already-running one.
     */
    public static void ensureShellRechargeStarted(ServerPlayer player) {
        if (!TortleShellLifecycle.isOwner(player)) {
            return;
        }

        float guard = getShellGuard(player);
        CompoundTag data = player.getPersistentData();
        if (guard >= MAX_SHELL_GUARD) {
            cancelShellRecharge(player);
            return;
        }

        if (!data.contains(SHELL_RECHARGE_START_TAG, Tag.TAG_ANY_NUMERIC)) {
            data.putLong(SHELL_RECHARGE_START_TAG, player.level().getGameTime());
        }
    }

    public static void cancelShellRecharge(ServerPlayer player) {
        player.getPersistentData().remove(SHELL_RECHARGE_START_TAG);
    }

    /**
     * Applies a completed recharge while the player is outside the shell.
     *
     * @return true only when this call changed a partial/empty guard to full.
     */
    public static boolean updateShellRecharge(ServerPlayer player) {
        if (!TortleShellLifecycle.isOwner(player)
                || player.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get())) {
            return false;
        }

        float guard = getShellGuard(player);
        if (guard >= MAX_SHELL_GUARD) {
            cancelShellRecharge(player);
            return false;
        }

        CompoundTag data = player.getPersistentData();
        long currentGameTime = player.level().getGameTime();
        if (!data.contains(SHELL_RECHARGE_START_TAG, Tag.TAG_ANY_NUMERIC)) {
            data.putLong(SHELL_RECHARGE_START_TAG, currentGameTime);
            return false;
        }

        long rechargeStart = data.getLong(SHELL_RECHARGE_START_TAG);
        if (currentGameTime < rechargeStart) {
            data.putLong(SHELL_RECHARGE_START_TAG, currentGameTime);
            return false;
        }

        if (currentGameTime - rechargeStart < SHELL_RECHARGE_TICKS) {
            return false;
        }

        fullyRechargeShellGuard(player);
        return true;
    }

    public static void exitShell(ServerPlayer player) {
        boolean wasShelled = player.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
        player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());

        float shellGuard = getShellGuard(player);
        if (wasShelled && TortleShellLifecycle.isOwner(player)) {
            startShellRecharge(player);
        }

        AwakeningNetwork.syncTortleShellGuard(player, shellGuard);
        if (wasShelled) {
            player.level().playSound(null, player.blockPosition(), SoundEvents.ARMOR_EQUIP_TURTLE, SoundSource.PLAYERS, 0.7F, 1.15F);
        }
    }

    private static float normalizeGuard(float amount) {
        if (!Float.isFinite(amount)) {
            return 0.0F;
        }
        return Math.max(0.0F, Math.min(MAX_SHELL_GUARD, amount));
    }

    public record Configuration(boolean enabled) implements IDynamicFeatureConfiguration {
        public static final Codec<Configuration> CODEC = RecordCodecBuilder.create(instance -> instance.group(
                Codec.BOOL.optionalFieldOf("enabled", true).forGetter(Configuration::enabled)
        ).apply(instance, Configuration::new));
    }
}
