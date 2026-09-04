package dev.xaulim.awakeningironscompat;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import io.github.edwinmindcraft.origins.api.capabilities.IOriginContainer;
import io.github.edwinmindcraft.origins.api.origin.Origin;
import io.github.edwinmindcraft.origins.api.origin.OriginLayer;
import io.github.edwinmindcraft.origins.api.registry.OriginsDynamicRegistries;
import io.redspace.ironsspellbooks.api.events.SpellPreCastEvent;
import io.redspace.ironsspellbooks.api.registry.SchoolRegistry;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.player.Player;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

import java.util.Set;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID, bus = Mod.EventBusSubscriber.Bus.FORGE)
public final class SpellCastRestrictionHandler {

    private static final ResourceKey<OriginLayer> CLASS_LAYER = ResourceKey.create(
            OriginsDynamicRegistries.LAYERS_REGISTRY,
            new ResourceLocation("rpgclasses", "class")
    );

    private static final ResourceLocation WIZARD = new ResourceLocation("rpgclasses", "wizard");
    private static final ResourceLocation CLERIC = new ResourceLocation("rpgclasses", "cleric");

    private static final Set<ResourceLocation> BLOCKED_CLASSES = Set.of(
            new ResourceLocation("rpgclasses", "paladin"),
            new ResourceLocation("rpgclasses", "ranger"),
            new ResourceLocation("rpgclasses", "warrior"),
            new ResourceLocation("rpgclasses", "barbarian"),
            new ResourceLocation("rpgclasses", "rogue"),
            new ResourceLocation("rpgclasses", "untrained")
    );

    private static final Set<ResourceLocation> WIZARD_SCHOOLS = Set.of(
            SchoolRegistry.FIRE_RESOURCE,
            SchoolRegistry.ICE_RESOURCE,
            SchoolRegistry.LIGHTNING_RESOURCE,
            SchoolRegistry.ENDER_RESOURCE,
            SchoolRegistry.EVOCATION_RESOURCE,
            SchoolRegistry.NATURE_RESOURCE,
            SchoolRegistry.ELDRITCH_RESOURCE
    );

    private static final Set<ResourceLocation> CLERIC_SCHOOLS = Set.of(
            SchoolRegistry.HOLY_RESOURCE,
            SchoolRegistry.BLOOD_RESOURCE
    );

    private SpellCastRestrictionHandler() {
    }

    @SubscribeEvent
    public static void onSpellPreCast(SpellPreCastEvent event) {
        if (event.getSpellLevel() < 1) {
            return;
        }

        ResourceLocation classId = getClassId(event.getEntity());
        ResourceLocation schoolId = event.getSchoolType() == null
                ? null
                : event.getSchoolType().getId();

        if (!isAllowed(classId, schoolId)) {
            event.setCanceled(true);
        }
    }

    private static boolean isAllowed(ResourceLocation classId, ResourceLocation schoolId) {
        if (classId == null || schoolId == null) {
            return false;
        }

        if (WIZARD.equals(classId)) {
            return WIZARD_SCHOOLS.contains(schoolId);
        }

        if (CLERIC.equals(classId)) {
            return CLERIC_SCHOOLS.contains(schoolId);
        }

        if (BLOCKED_CLASSES.contains(classId)) {
            return false;
        }

        // Unknown classes and addon/unknown schools are denied by default.
        return false;
    }

    private static ResourceLocation getClassId(Player player) {
        IOriginContainer container = IOriginContainer.get(player).orElse(null);
        if (container == null || !container.hasOrigin(CLASS_LAYER)) {
            return null;
        }

        ResourceKey<Origin> origin = container.getOrigin(CLASS_LAYER);
        return origin == null ? null : origin.location();
    }
}
