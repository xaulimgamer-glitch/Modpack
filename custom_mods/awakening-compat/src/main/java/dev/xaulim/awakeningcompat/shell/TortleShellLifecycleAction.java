package dev.xaulim.awakeningcompat.shell;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import io.github.edwinmindcraft.apoli.api.IDynamicFeatureConfiguration;
import io.github.edwinmindcraft.apoli.api.power.factory.EntityAction;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.Entity;

/**
 * Origins callback bridge for the Tortle racial shell lifecycle.
 */
public final class TortleShellLifecycleAction extends EntityAction<TortleShellLifecycleAction.Configuration> {

    public TortleShellLifecycleAction() {
        super(Configuration.CODEC);
    }

    @Override
    public void execute(Configuration configuration, Entity entity) {
        if (!(entity instanceof ServerPlayer player)) return;

        switch (configuration.operation()) {
            case "gain", "respawn", "sync" -> TortleShellLifecycle.gainShell(player);
            case "lose" -> TortleShellLifecycle.loseShell(player);
            default -> throw new IllegalArgumentException(
                    "Unknown Tortle shell lifecycle operation: " + configuration.operation()
            );
        }
    }

    public record Configuration(String operation) implements IDynamicFeatureConfiguration {
        public static final Codec<Configuration> CODEC = RecordCodecBuilder.create(instance -> instance.group(
                Codec.STRING.optionalFieldOf("operation", "sync").forGetter(Configuration::operation)
        ).apply(instance, Configuration::new));
    }
}
