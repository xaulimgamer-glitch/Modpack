package dev.xaulim.awakeningcompat.network;

import dev.xaulim.awakeningcompat.client.AwakeningClientScreens;
import net.minecraft.network.FriendlyByteBuf;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.fml.DistExecutor;
import net.minecraftforge.network.NetworkEvent;

import java.util.function.Supplier;

public final class CloseQuestBookPacket {

    public static void encode(CloseQuestBookPacket packet, FriendlyByteBuf buffer) {
        // No payload is required.
    }

    public static CloseQuestBookPacket decode(FriendlyByteBuf buffer) {
        return new CloseQuestBookPacket();
    }

    public static void handle(
            CloseQuestBookPacket packet,
            Supplier<NetworkEvent.Context> contextSupplier
    ) {
        NetworkEvent.Context context = contextSupplier.get();

        // AwakeningNetwork registers this packet with consumerMainThread(), so the
        // handler is already running on the client main thread. Enqueueing another
        // task here delayed setScreen(null) long enough for Origins to open its GUI
        // first, after which this packet immediately closed that new screen.
        DistExecutor.unsafeRunWhenOn(
                Dist.CLIENT,
                () -> AwakeningClientScreens::closeQuestBook
        );

        context.setPacketHandled(true);
    }
}
