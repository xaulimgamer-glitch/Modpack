package dev.xaulim.awakeningironscompat.action;

import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import dev.xaulim.awakeningironscompat.BreathLifetimeTracker;
import io.github.edwinmindcraft.apoli.api.IDynamicFeatureConfiguration;
import io.github.edwinmindcraft.apoli.api.power.factory.EntityAction;
import io.redspace.ironsspellbooks.entity.spells.AbstractConeProjectile;
import io.redspace.ironsspellbooks.entity.spells.cone_of_cold.ConeOfColdProjectile;
import io.redspace.ironsspellbooks.entity.spells.electrocute.ElectrocuteProjectile;
import io.redspace.ironsspellbooks.entity.spells.fire_breath.FireBreathProjectile;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.level.Level;

import java.util.Locale;

/**
 * Minimal Dragonborn -> Iron's bridge.
 *
 * This intentionally does not enter Iron's normal spell-casting pipeline:
 * Origins owns activation/cooldown, and this action only creates one native
 * cone projectile. The projectile's first server tick provides one native
 * damage pulse; it remains alive briefly for native particles/aim tracking.
 */
public final class DragonBreathAction extends EntityAction<DragonBreathAction.Configuration> {
    private static final Codec<String> ELEMENT_CODEC = Codec.STRING.comapFlatMap(
            value -> {
                String normalized = value.toLowerCase(Locale.ROOT);
                return switch (normalized) {
                    case "fire", "ice", "lightning" -> DataResult.success(normalized);
                    default -> DataResult.error(() -> "Unknown Dragonborn breath element: " + value);
                };
            },
            value -> value
    );

    public DragonBreathAction() {
        super(Configuration.CODEC);
    }

    @Override
    public void execute(Configuration configuration, Entity entity) {
        if (!(entity instanceof LivingEntity livingEntity)) {
            return;
        }

        Level level = livingEntity.level();
        if (level.isClientSide) {
            return;
        }

        AbstractConeProjectile cone = switch (configuration.element()) {
            case "fire" -> new FireBreathProjectile(level, livingEntity);
            case "ice" -> new ConeOfColdProjectile(level, livingEntity);
            case "lightning" -> new ElectrocuteProjectile(level, livingEntity);
            default -> null; // Codec rejects this before execution.
        };

        if (cone == null) {
            return;
        }

        cone.setPos(livingEntity.position().add(0.0D, livingEntity.getEyeHeight() * 0.7D, 0.0D));
        cone.setDamage(configuration.damage());
        level.addFreshEntity(cone);

        // Do not call setDealDamageActive() again in P0: spawning begins with
        // dealDamageActive=true, giving one native pulse only.
        BreathLifetimeTracker.track(cone, configuration.duration());
    }

    public record Configuration(String element, float damage, int duration)
            implements IDynamicFeatureConfiguration {
        public static final Codec<Configuration> CODEC = RecordCodecBuilder.create(instance -> instance.group(
                ELEMENT_CODEC.fieldOf("element").forGetter(Configuration::element),
                Codec.FLOAT.optionalFieldOf("damage", 6.0F).forGetter(Configuration::damage),
                Codec.intRange(1, 40).optionalFieldOf("duration_ticks", 10).forGetter(Configuration::duration)
        ).apply(instance, Configuration::new));
    }
}
