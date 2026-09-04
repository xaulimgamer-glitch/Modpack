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
import net.minecraft.world.entity.EquipmentSlot;

public final class TortleShellAction extends EntityAction<TortleShellAction.Configuration> {

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
            player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
            player.level().playSound(null, player.blockPosition(), SoundEvents.ARMOR_EQUIP_TURTLE, SoundSource.PLAYERS, 0.7F, 1.15F);
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
        player.level().playSound(null, player.blockPosition(), SoundEvents.ARMOR_EQUIP_TURTLE, SoundSource.PLAYERS, 0.85F, 0.75F);
    }

    public record Configuration(boolean enabled) implements IDynamicFeatureConfiguration {
        public static final Codec<Configuration> CODEC = RecordCodecBuilder.create(instance -> instance.group(
                Codec.BOOL.optionalFieldOf("enabled", true).forGetter(Configuration::enabled)
        ).apply(instance, Configuration::new));
    }
}
