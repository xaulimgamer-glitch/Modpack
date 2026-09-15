package dev.xaulim.awakeningcompat.network;

import dev.xaulim.awakeningcompat.shell.client.TortleShellClientEvents;
import net.minecraft.network.FriendlyByteBuf;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.fml.DistExecutor;
import net.minecraftforge.network.NetworkEvent;

import java.util.function.Supplier;

public record SyncTortleShellGuardPacket(float shellGuard) {

    public static void encode(SyncTortleShellGuardPacket packet, FriendlyByteBuf buffer) {
        buffer.writeFloat(packet.shellGuard());
    }

    public static SyncTortleShellGuardPacket decode(FriendlyByteBuf buffer) {
        return new SyncTortleShellGuardPacket(buffer.readFloat());
    }

    public static void handle(
            SyncTortleShellGuardPacket packet,
            Supplier<NetworkEvent.Context> contextSupplier
    ) {
        NetworkEvent.Context context = contextSupplier.get();

        DistExecutor.unsafeRunWhenOn(
                Dist.CLIENT,
                () -> () -> TortleShellClientEvents.setShellGuard(packet.shellGuard())
        );

        context.setPacketHandled(true);
    }
}
