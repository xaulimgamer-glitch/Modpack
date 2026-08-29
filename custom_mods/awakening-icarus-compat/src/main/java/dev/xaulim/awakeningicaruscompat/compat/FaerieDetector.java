package dev.xaulim.awakeningicaruscompat.compat;

import io.github.edwinmindcraft.origins.api.capabilities.IOriginContainer;
import io.github.edwinmindcraft.origins.api.origin.Origin;
import io.github.edwinmindcraft.origins.api.origin.OriginLayer;
import io.github.edwinmindcraft.origins.api.registry.OriginsDynamicRegistries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;

public final class FaerieDetector {

    private static final ResourceKey<OriginLayer> RACES_LAYER =
            ResourceKey.create(
                    OriginsDynamicRegistries.LAYERS_REGISTRY,
                    new ResourceLocation("rpgraces", "races")
            );

    private static final ResourceKey<Origin> FAERIE_ORIGIN =
            ResourceKey.create(
                    OriginsDynamicRegistries.ORIGINS_REGISTRY,
                    new ResourceLocation("rpgraces", "faerie")
            );

    private FaerieDetector() {
    }

    public static boolean isFaerie(LivingEntity entity) {

        if (!(entity instanceof Player player)) {
            return false;
        }

        return IOriginContainer.get(player)
                .map(container ->
                        FAERIE_ORIGIN.equals(
                                container.getOrigin(RACES_LAYER)
                        )
                )
                .orElse(false);
    }
}