package dev.xaulim.awakeningcompat.network;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.network.NetworkDirection;
import net.minecraftforge.network.NetworkRegistry;
import net.minecraftforge.network.PacketDistributor;
import net.minecraftforge.network.simple.SimpleChannel;

public final class AwakeningNetwork {

    private static final String PROTOCOL_VERSION = "1";

    private static final SimpleChannel CHANNEL = NetworkRegistry.ChannelBuilder
            .named(new ResourceLocation(AwakeningCompat.MOD_ID, "main"))
            .networkProtocolVersion(() -> PROTOCOL_VERSION)
            .clientAcceptedVersions(PROTOCOL_VERSION::equals)
            .serverAcceptedVersions(PROTOCOL_VERSION::equals)
            .simpleChannel();

    private static int nextMessageId = 0;
    private static boolean registered;

    private AwakeningNetwork() {}

    public static void register() {
        if (registered) return;
        registered = true;

        CHANNEL.messageBuilder(
                        CloseQuestBookPacket.class,
                        nextMessageId++,
                        NetworkDirection.PLAY_TO_CLIENT
                )
                .encoder(CloseQuestBookPacket::encode)
                .decoder(CloseQuestBookPacket::decode)
                .consumerMainThread(CloseQuestBookPacket::handle)
                .add();
    }

    public static void closeQuestBook(ServerPlayer player) {
        CHANNEL.send(
                PacketDistributor.PLAYER.with(() -> player),
                new CloseQuestBookPacket()
        );
    }
}
