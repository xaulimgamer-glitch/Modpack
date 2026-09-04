package dev.xaulim.awakeningcompat.shell;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import io.github.edwinmindcraft.apoli.api.power.factory.EntityAction;
import io.github.edwinmindcraft.apoli.api.registry.ApoliRegistries;
import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectCategory;
import net.minecraft.world.item.Item;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public final class TortleShellRegistries {
    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, AwakeningCompat.MOD_ID);
    public static final DeferredRegister<MobEffect> MOB_EFFECTS = DeferredRegister.create(ForgeRegistries.MOB_EFFECTS, AwakeningCompat.MOD_ID);
    public static final DeferredRegister<EntityAction<?>> ENTITY_ACTIONS = DeferredRegister.create(ApoliRegistries.ENTITY_ACTION_KEY, AwakeningCompat.MOD_ID);

    public static final RegistryObject<TortleShellItem> TORTLE_SHELL_ITEM =
            ITEMS.register("tortle_shell", TortleShellItem::new);
    public static final RegistryObject<MobEffect> TORTLE_SHELL_EFFECT =
            MOB_EFFECTS.register("tortle_shell", TortleShellEffect::new);
    public static final RegistryObject<TortleShellAction> TORTLE_SHELL_ACTION =
            ENTITY_ACTIONS.register("tortle_shell", TortleShellAction::new);
    public static final RegistryObject<TortleShellLifecycleAction> TORTLE_SHELL_LIFECYCLE_ACTION =
            ENTITY_ACTIONS.register("tortle_shell_lifecycle", TortleShellLifecycleAction::new);

    private TortleShellRegistries() {}

    public static void register(IEventBus eventBus) {
        ITEMS.register(eventBus);
        MOB_EFFECTS.register(eventBus);
        ENTITY_ACTIONS.register(eventBus);
    }

    private static final class TortleShellEffect extends MobEffect {
        private TortleShellEffect() {
            super(MobEffectCategory.NEUTRAL, 0x5F6E4A);
        }
    }
}
