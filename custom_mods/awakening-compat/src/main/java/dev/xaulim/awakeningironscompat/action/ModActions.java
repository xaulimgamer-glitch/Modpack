package dev.xaulim.awakeningironscompat.action;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import io.github.edwinmindcraft.apoli.api.power.factory.EntityAction;
import io.github.edwinmindcraft.apoli.api.registry.ApoliRegistries;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

public final class ModActions {

    public static final DeferredRegister<EntityAction<?>> ENTITY_ACTIONS =
            DeferredRegister.create(
                    ApoliRegistries.ENTITY_ACTION_KEY,
                    AwakeningCompat.MOD_ID
            );

    public static final RegistryObject<DragonBreathAction> DRAGON_BREATH =
            ENTITY_ACTIONS.register(
                    "dragon_breath",
                    DragonBreathAction::new
            );

    private ModActions() {
    }

    public static void register(IEventBus eventBus) {
        ENTITY_ACTIONS.register(eventBus);
    }
}
