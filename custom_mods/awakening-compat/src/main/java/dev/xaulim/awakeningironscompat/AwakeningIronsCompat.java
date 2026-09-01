package dev.xaulim.awakeningironscompat;

import dev.xaulim.awakeningironscompat.action.ModActions;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;

@Mod(AwakeningIronsCompat.MOD_ID)
public final class AwakeningIronsCompat {
    public static final String MOD_ID = "awakening_irons_compat";

    public AwakeningIronsCompat() {
        IEventBus modEventBus = FMLJavaModLoadingContext.get().getModEventBus();
        ModActions.register(modEventBus);
    }
}
