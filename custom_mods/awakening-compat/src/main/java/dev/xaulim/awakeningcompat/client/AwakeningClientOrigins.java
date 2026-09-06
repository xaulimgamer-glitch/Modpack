package dev.xaulim.awakeningcompat.client;

import io.github.apace100.origins.screen.ChooseOriginScreen;
import io.github.edwinmindcraft.origins.api.OriginsAPI;
import io.github.edwinmindcraft.origins.api.origin.OriginLayer;
import io.github.edwinmindcraft.origins.api.registry.OriginsDynamicRegistries;
import net.minecraft.client.Minecraft;
import net.minecraft.core.Holder;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;

import java.util.List;

public final class AwakeningClientOrigins {

    private AwakeningClientOrigins() {}

    public static void openSelection(ResourceLocation layerId) {
        Minecraft minecraft = Minecraft.getInstance();
        if (minecraft.player == null) return;

        ResourceKey<OriginLayer> layerKey = ResourceKey.create(
                OriginsDynamicRegistries.LAYERS_REGISTRY,
                layerId
        );

        OriginsAPI.getLayersRegistry()
                .getHolder(layerKey)
                .filter(Holder.Reference::isBound)
                .ifPresent(layer -> minecraft.setScreen(
                        new ChooseOriginScreen(
                                List.<Holder<OriginLayer>>of(layer),
                                0,
                                false
                        )
                ));
    }
}
