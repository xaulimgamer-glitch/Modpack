package dev.xaulim.awakeningcompat.shell;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import io.github.edwinmindcraft.apoli.api.IDynamicFeatureConfiguration;
import io.github.edwinmindcraft.apoli.api.power.factory.EntityAction;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EquipmentSlot;

public final class TortleShellAction extends EntityAction<TortleShellAction.Configuration> {

    public static final float MAX_SHELL_GUARD = 32.0F;
    private static final String SHELL_GUARD_TAG = "AwakeningCompatTortleShellGuard";

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
        resetShellGuard(player);
        player.level().playSound(null, player.blockPosition(), SoundEvents.ARMOR_EQUIP_TURTLE, SoundSource.PLAYERS, 0.85F, 0.75F);
    }

    public static float getShellGuard(ServerPlayer player) {
        CompoundTag data = player.getPersistentData();
        if (!data.contains(SHELL_GUARD_TAG)) {
            data.putFloat(SHELL_GUARD_TAG, MAX_SHELL_GUARD);
            return MAX_SHELL_GUARD;
        }
        return Math.max(0.0F, Math.min(MAX_SHELL_GUARD, data.getFloat(SHELL_GUARD_TAG)));
    }

    public static void setShellGuard(ServerPlayer player, float amount) {
        float clamped = Math.max(0.0F, Math.min(MAX_SHELL_GUARD, amount));
        if (clamped <= 0.0F) {
            clearShellGuard(player);
        } else {
            player.getPersistentData().putFloat(SHELL_GUARD_TAG, clamped);
        }
    }

    public static void resetShellGuard(ServerPlayer player) {
        player.getPersistentData().putFloat(SHELL_GUARD_TAG, MAX_SHELL_GUARD);
    }

    public static void clearShellGuard(ServerPlayer player) {
        player.getPersistentData().remove(SHELL_GUARD_TAG);
    }

    public static void exitShell(ServerPlayer player) {
        boolean wasShelled = player.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
        player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
        clearShellGuard(player);
        if (wasShelled) {
            player.level().playSound(null, player.blockPosition(), SoundEvents.ARMOR_EQUIP_TURTLE, SoundSource.PLAYERS, 0.7F, 1.15F);
        }
    }

    public record Configuration(boolean enabled) implements IDynamicFeatureConfiguration {
        public static final Codec<Configuration> CODEC = RecordCodecBuilder.create(instance -> instance.group(
                Codec.BOOL.optionalFieldOf("enabled", true).forGetter(Configuration::enabled)
        ).apply(instance, Configuration::new));
    }
}
