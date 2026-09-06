package dev.xaulim.awakeningcompat.network;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.network.NetworkDirection;
import net.minecraftforge.network.NetworkRegistry;
import net.minecraftforge.network.PacketDistributor;
import net.minecraftforge.network.simple.SimpleChannel;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID)
public final class AwakeningNetwork {

    private static final String PROTOCOL_VERSION = "2";
    private static final int ORIGINS_GUI_DELAY_TICKS = 20;

    private static final SimpleChannel CHANNEL = NetworkRegistry.ChannelBuilder
            .named(new ResourceLocation(AwakeningCompat.MOD_ID, "main"))
            .networkProtocolVersion(() -> PROTOCOL_VERSION)
            .clientAcceptedVersions(PROTOCOL_VERSION::equals)
            .serverAcceptedVersions(PROTOCOL_VERSION::equals)
            .simpleChannel();

    private static final Map<UUID, PendingOriginsSelection> PENDING_ORIGINS_SELECTIONS =
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

    private record PendingOriginsSelection(
            OriginsSelectionTarget target,
            int executeAtTick
    ) {}

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

    public static void beginOriginsSelection(
            ServerPlayer player,
            OriginsSelectionTarget target
    ) {
        MinecraftServer server = player.getServer();
        if (server == null) return;

        // First dismiss the FTB Quests GUI on the client. Opening Origins in the
        // same server tick proved unreliable because both mods update the active
        // screen asynchronously. A full second gives the client enough time to
        // finish closing the quest book before Origins is asked to open its GUI.
        closeQuestBook(player);

        PENDING_ORIGINS_SELECTIONS.put(
                player.getUUID(),
                new PendingOriginsSelection(
                        target,
                        server.getTickCount() + ORIGINS_GUI_DELAY_TICKS
                )
        );
    }

    @SubscribeEvent
    public static void onServerTick(TickEvent.ServerTickEvent event) {
        if (event.phase != TickEvent.Phase.END) return;

        MinecraftServer server = event.getServer();
        int currentTick = server.getTickCount();

        Iterator<Map.Entry<UUID, PendingOriginsSelection>> iterator =
                PENDING_ORIGINS_SELECTIONS.entrySet().iterator();

        while (iterator.hasNext()) {
            Map.Entry<UUID, PendingOriginsSelection> entry = iterator.next();
            PendingOriginsSelection pending = entry.getValue();

            if (currentTick < pending.executeAtTick()) continue;

            iterator.remove();

            ServerPlayer player = server.getPlayerList().getPlayer(entry.getKey());
            if (player == null) continue;

            openOriginsSelection(player, pending.target());
        }
    }

    private static void openOriginsSelection(
            ServerPlayer player,
            OriginsSelectionTarget target
    ) {
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
