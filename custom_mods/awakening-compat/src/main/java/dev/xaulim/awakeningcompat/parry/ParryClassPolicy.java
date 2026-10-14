package dev.xaulim.awakeningcompat.parry;

import io.github.edwinmindcraft.origins.api.capabilities.IOriginContainer;
import io.github.edwinmindcraft.origins.api.origin.Origin;
import io.github.edwinmindcraft.origins.api.origin.OriginLayer;
import io.github.edwinmindcraft.origins.api.registry.OriginsDynamicRegistries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.player.Player;

import java.util.Set;

/**
 * Class-level access policy for the Awakening parry mechanic.
 *
 * <p>This is intentionally separate from weapon eligibility. A player must
 * satisfy both policies before Block Parry Dodge is allowed to activate or
 * resolve a parry.</p>
 */
public final class ParryClassPolicy {
    public static final ResourceKey<OriginLayer> CLASS_LAYER = ResourceKey.create(
            OriginsDynamicRegistries.LAYERS_REGISTRY,
            new ResourceLocation("rpgclasses", "class")
    );

    public static final ResourceKey<Origin> WARRIOR = ResourceKey.create(
            OriginsDynamicRegistries.ORIGINS_REGISTRY,
            new ResourceLocation("rpgclasses", "warrior")
    );

    /**
     * Central allow-list. Keep class access decisions here instead of
     * scattering class checks across the Block Parry Dodge mixins.
     */
    private static final Set<ResourceKey<Origin>> ALLOWED_CLASSES = Set.of(
            WARRIOR
    );

    private ParryClassPolicy() {}

    /**
     * Fail-closed class check. Missing Origins capability, an unselected class,
     * an unknown class, or any class not present in {@link #ALLOWED_CLASSES}
     * is denied.
     */
    public static boolean isAllowed(Player player) {
        if (player == null) return false;

        return IOriginContainer.get(player)
                .resolve()
                .filter(container -> container.hasOrigin(CLASS_LAYER))
                .map(container -> ALLOWED_CLASSES.contains(container.getOrigin(CLASS_LAYER)))
                .orElse(false);
    }
}
