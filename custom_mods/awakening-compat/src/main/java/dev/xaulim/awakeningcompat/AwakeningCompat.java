package dev.xaulim.awakeningcompat;

import dev.xaulim.awakeningcompat.network.AwakeningNetwork;
import dev.xaulim.awakeningcompat.shell.TortleShellRegistries;
import dev.xaulim.awakeningironscompat.action.ModActions;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;

@Mod(AwakeningCompat.MOD_ID)
public final class AwakeningCompat {

    public static final String MOD_ID = "awakening_compat";

    public AwakeningCompat() {
        IEventBus modEventBus =
                FMLJavaModLoadingContext.get().getModEventBus();

        AwakeningNetwork.register();
        ModActions.register(modEventBus);
        TortleShellRegistries.register(modEventBus);
    }
}
