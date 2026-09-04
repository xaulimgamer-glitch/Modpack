package dev.xaulim.awakeningcompat.shell;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import io.github.edwinmindcraft.apoli.api.IDynamicFeatureConfiguration;
import io.github.edwinmindcraft.apoli.api.power.factory.EntityAction;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.Entity;

public final class TortleShellAction extends EntityAction<TortleShellAction.Configuration> {

    public static final int ACTIVE_TICKS = 120;
    public static final int COOLDOWN_TICKS = 1200;
    public static final String COOLDOWN_TAG = "AwakeningTortleShellCooldownUntil";

    public TortleShellAction() {
        super(Configuration.CODEC);
    }

    @Override
    public void execute(Configuration configuration, Entity entity) {
        if (!(entity instanceof ServerPlayer player) || !configuration.enabled()) {
            return;
        }

        if (player.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get())) {
            player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
            player.level().playSound(null, player.blockPosition(), SoundEvents.ARMOR_EQUIP_TURTLE, SoundSource.PLAYERS, 0.7F, 1.15F);
            return;
        }

        long now = player.level().getGameTime();
        long cooldownUntil = player.getPersistentData().getLong(COOLDOWN_TAG);
        if (cooldownUntil > now) {
            long remainingSeconds = (cooldownUntil - now + 19L) / 20L;
            player.displayClientMessage(Component.literal("Shell Defense: " + remainingSeconds + "s cooldown remaining"), true);
            return;
        }

        player.getPersistentData().putLong(COOLDOWN_TAG, now + COOLDOWN_TICKS);
        player.stopUsingItem();
        player.setSprinting(false);
        player.addEffect(new MobEffectInstance(
                TortleShellRegistries.TORTLE_SHELL_EFFECT.get(),
                ACTIVE_TICKS,
                0,
                false,
                false,
                false
        ));
        player.level().playSound(null, player.blockPosition(), SoundEvents.ARMOR_EQUIP_TURTLE, SoundSource.PLAYERS, 0.85F, 0.75F);
    }

    public record Configuration(boolean enabled) implements IDynamicFeatureConfiguration {
        public static final Codec<Configuration> CODEC = RecordCodecBuilder.create(instance -> instance.group(
                Codec.BOOL.optionalFieldOf("enabled", true).forGetter(Configuration::enabled)
        ).apply(instance, Configuration::new));
    }
}
