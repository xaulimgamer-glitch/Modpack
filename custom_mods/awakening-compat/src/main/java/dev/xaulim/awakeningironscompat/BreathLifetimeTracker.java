package dev.xaulim.awakeningironscompat;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import io.redspace.ironsspellbooks.entity.spells.AbstractConeProjectile;
import net.minecraft.resources.ResourceKey;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.level.Level;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;

/**
 * Iron's cone projectiles have a long failsafe lifetime because their normal
 * spell pipeline removes them when casting ends. Our Origins action bypasses
 * that pipeline, so P0 explicitly discards its cone after a short duration.
 */
@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID, bus = Mod.EventBusSubscriber.Bus.FORGE)
public final class BreathLifetimeTracker {
    private static final Map<ResourceKey<Level>, Map<UUID, Long>> EXPIRY_BY_LEVEL = new HashMap<>();

    private BreathLifetimeTracker() {
    }

    public static void track(AbstractConeProjectile cone, int durationTicks) {
        if (!(cone.level() instanceof ServerLevel serverLevel)) {
            return;
        }

        long expiryTick = serverLevel.getGameTime() + durationTicks;
        EXPIRY_BY_LEVEL
                .computeIfAbsent(serverLevel.dimension(), ignored -> new HashMap<>())
                .put(cone.getUUID(), expiryTick);
    }

    @SubscribeEvent
    public static void onLevelTick(TickEvent.LevelTickEvent event) {
        if (event.phase != TickEvent.Phase.END || !(event.level instanceof ServerLevel serverLevel)) {
            return;
        }

        Map<UUID, Long> expiry = EXPIRY_BY_LEVEL.get(serverLevel.dimension());
        if (expiry == null || expiry.isEmpty()) {
            return;
        }

        long now = serverLevel.getGameTime();
        Iterator<Map.Entry<UUID, Long>> iterator = expiry.entrySet().iterator();

        while (iterator.hasNext()) {
            Map.Entry<UUID, Long> entry = iterator.next();
            Entity cone = serverLevel.getEntity(entry.getKey());

            if (cone == null || cone.isRemoved()) {
                iterator.remove();
                continue;
            }

            if (now >= entry.getValue()) {
                cone.discard();
                iterator.remove();
            }
        }

        if (expiry.isEmpty()) {
            EXPIRY_BY_LEVEL.remove(serverLevel.dimension());
        }
    }
}
