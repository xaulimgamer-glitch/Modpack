package dev.xaulim.awakeningcompat.network;

import net.minecraft.network.FriendlyByteBuf;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.network.NetworkEvent;

import java.util.function.Supplier;

public final class OriginsSelectionReadyPacket {

    public static void encode(OriginsSelectionReadyPacket packet, FriendlyByteBuf buffer) {
        // No payload is required.
    }

    public static OriginsSelectionReadyPacket decode(FriendlyByteBuf buffer) {
        return new OriginsSelectionReadyPacket();
    }

    public static void handle(
            OriginsSelectionReadyPacket packet,
            Supplier<NetworkEvent.Context> contextSupplier
    ) {
        NetworkEvent.Context context = contextSupplier.get();
        ServerPlayer sender = context.getSender();

        if (sender != null) {
            AwakeningNetwork.completeOriginsSelection(sender);
        }

        context.setPacketHandled(true);
    }
}
