package dev.xaulim.awakeningcompat.shell.client;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.EntityRenderersEvent;
import net.minecraftforge.client.event.RegisterGuiOverlaysEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(
        modid = AwakeningCompat.MOD_ID,
        bus = Mod.EventBusSubscriber.Bus.MOD,
        value = Dist.CLIENT
)
public final class TortleShellClientModEvents {

    private TortleShellClientModEvents() {
    }

    @SubscribeEvent
    public static void registerLayerDefinitions(EntityRenderersEvent.RegisterLayerDefinitions event) {
        event.registerLayerDefinition(
                TortleShellModel.LAYER_LOCATION,
                TortleShellModel::createBodyLayer
        );
        event.registerLayerDefinition(
                TortleShellArmorModel.LAYER_LOCATION,
                TortleShellArmorModel::createBodyLayer
        );
    }

    @SubscribeEvent
    public static void registerGuiOverlays(RegisterGuiOverlaysEvent event) {
        event.registerAboveAll(
                "tortle_shell_vision",
                (gui, graphics, partialTick, screenWidth, screenHeight) ->
                        TortleShellClientEvents.renderShellVision(graphics, screenWidth, screenHeight)
        );
    }
}
