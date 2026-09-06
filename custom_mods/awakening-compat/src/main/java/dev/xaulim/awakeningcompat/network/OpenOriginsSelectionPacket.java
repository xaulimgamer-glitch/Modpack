package dev.xaulim.awakeningcompat.network;

import dev.xaulim.awakeningcompat.client.AwakeningClientOrigins;
import net.minecraft.network.FriendlyByteBuf;
import net.minecraft.resources.ResourceLocation;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.fml.DistExecutor;
import net.minecraftforge.network.NetworkEvent;

import java.util.function.Supplier;

public record OpenOriginsSelectionPacket(ResourceLocation layer) {

    public static void encode(OpenOriginsSelectionPacket packet, FriendlyByteBuf buffer) {
        buffer.writeResourceLocation(packet.layer());
    }

    public static OpenOriginsSelectionPacket decode(FriendlyByteBuf buffer) {
        return new OpenOriginsSelectionPacket(buffer.readResourceLocation());
    }

    public static void handle(
            OpenOriginsSelectionPacket packet,
            Supplier<NetworkEvent.Context> contextSupplier
    ) {
        NetworkEvent.Context context = contextSupplier.get();

        DistExecutor.unsafeRunWhenOn(
                Dist.CLIENT,
                () -> () -> AwakeningClientOrigins.openSelection(packet.layer())
        );

        context.setPacketHandled(true);
    }
}
