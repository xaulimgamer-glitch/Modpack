package dev.xaulim.awakeningcompat;

import com.mojang.serialization.MapCodec;
import dev.xaulim.awakeningcompat.loot.RemoveVanillaRangedLootModifier;
import dev.xaulim.awakeningcompat.network.AwakeningNetwork;
import dev.xaulim.awakeningcompat.shell.TortleShellRegistries;
import dev.xaulim.awakeningironscompat.action.ModActions;
import net.minecraftforge.common.loot.IGlobalLootModifier;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;

@Mod(AwakeningCompat.MOD_ID)
public final class AwakeningCompat {

    public static final String MOD_ID = "awakening_compat";

    private static final DeferredRegister<MapCodec<? extends IGlobalLootModifier>> GLOBAL_LOOT_MODIFIER_SERIALIZERS =
            DeferredRegister.create(ForgeRegistries.Keys.GLOBAL_LOOT_MODIFIER_SERIALIZERS, MOD_ID);

    static {
        GLOBAL_LOOT_MODIFIER_SERIALIZERS.register(
                "remove_vanilla_ranged_weapons",
                () -> RemoveVanillaRangedLootModifier.CODEC
        );
    }

    public AwakeningCompat() {
        IEventBus modEventBus =
                FMLJavaModLoadingContext.get().getModEventBus();

        AwakeningNetwork.register();
        ModActions.register(modEventBus);
        TortleShellRegistries.register(modEventBus);
        GLOBAL_LOOT_MODIFIER_SERIALIZERS.register(modEventBus);
    }
}
