package dev.xaulim.awakeningcompat.network;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.network.NetworkDirection;
import net.minecraftforge.network.NetworkRegistry;
import net.minecraftforge.network.PacketDistributor;
import net.minecraftforge.network.simple.SimpleChannel;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public final class AwakeningNetwork {

    private static final String PROTOCOL_VERSION = "2";

    private static final SimpleChannel CHANNEL = NetworkRegistry.ChannelBuilder
            .named(new ResourceLocation(AwakeningCompat.MOD_ID, "main"))
            .networkProtocolVersion(() -> PROTOCOL_VERSION)
            .clientAcceptedVersions(PROTOCOL_VERSION::equals)
            .serverAcceptedVersions(PROTOCOL_VERSION::equals)
            .simpleChannel();

    private static final Map<UUID, OriginsSelectionTarget> PENDING_ORIGINS_SELECTIONS =
            new HashMap<>();

    private static int nextMessageId = 0;
    private static boolean registered;

    private AwakeningNetwork() {}

    public enum OriginsSelectionTarget {
        RACE("rpgraces:races"),
        CLASS("rpgclasses:class");

        private final String layer;

        OriginsSelectionTarget(String layer) {
            this.layer = layer;
        }

        private String layer() {
            return layer;
        }
    }

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

        CHANNEL.messageBuilder(
                        PrepareOriginsSelectionPacket.class,
                        nextMessageId++,
                        NetworkDirection.PLAY_TO_CLIENT
                )
                .encoder(PrepareOriginsSelectionPacket::encode)
                .decoder(PrepareOriginsSelectionPacket::decode)
                .consumerMainThread(PrepareOriginsSelectionPacket::handle)
                .add();

        CHANNEL.messageBuilder(
                        OriginsSelectionReadyPacket.class,
                        nextMessageId++,
                        NetworkDirection.PLAY_TO_SERVER
                )
                .encoder(OriginsSelectionReadyPacket::encode)
                .decoder(OriginsSelectionReadyPacket::decode)
                .consumerMainThread(OriginsSelectionReadyPacket::handle)
                .add();
    }

    public static void closeQuestBook(ServerPlayer player) {
        CHANNEL.send(
                PacketDistributor.PLAYER.with(() -> player),
                new CloseQuestBookPacket()
        );
    }

    public static void beginOriginsSelection(
            ServerPlayer player,
            OriginsSelectionTarget target
    ) {
        PENDING_ORIGINS_SELECTIONS.put(player.getUUID(), target);

        CHANNEL.send(
                PacketDistributor.PLAYER.with(() -> player),
                new PrepareOriginsSelectionPacket()
        );
    }

    static void signalOriginsSelectionReady() {
        CHANNEL.sendToServer(new OriginsSelectionReadyPacket());
    }

    static void completeOriginsSelection(ServerPlayer player) {
        OriginsSelectionTarget target =
                PENDING_ORIGINS_SELECTIONS.remove(player.getUUID());

        if (target == null) return;

        MinecraftServer server = player.getServer();
        if (server == null) return;

        String playerName = player.getGameProfile().getName();
        server.getCommands().performPrefixedCommand(
                player.createCommandSourceStack()
                        .withPermission(2)
                        .withSuppressedOutput(),
                "origin gui " + playerName + " " + target.layer()
        );
    }
}
