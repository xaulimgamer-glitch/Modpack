package dev.xaulim.awakeningcompat.network;

import dev.xaulim.awakeningcompat.client.AwakeningClientScreens;
import net.minecraft.network.FriendlyByteBuf;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.fml.DistExecutor;
import net.minecraftforge.network.NetworkEvent;

import java.util.function.Supplier;

public final class PrepareOriginsSelectionPacket {

    public static void encode(PrepareOriginsSelectionPacket packet, FriendlyByteBuf buffer) {
        // No payload is required.
    }

    public static PrepareOriginsSelectionPacket decode(FriendlyByteBuf buffer) {
        return new PrepareOriginsSelectionPacket();
    }

    public static void handle(
            PrepareOriginsSelectionPacket packet,
            Supplier<NetworkEvent.Context> contextSupplier
    ) {
        NetworkEvent.Context context = contextSupplier.get();

        DistExecutor.unsafeRunWhenOn(
                Dist.CLIENT,
                () -> () -> {
                    AwakeningClientScreens.closeQuestBook();
                    AwakeningNetwork.signalOriginsSelectionReady();
                }
        );

        context.setPacketHandled(true);
    }
}
