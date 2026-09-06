package dev.xaulim.awakeningcompat.command;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.context.CommandContext;
import dev.xaulim.awakeningcompat.AwakeningCompat;
import dev.xaulim.awakeningcompat.network.AwakeningNetwork;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.commands.arguments.EntityArgument;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.event.RegisterCommandsEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

import java.util.Collection;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID)
public final class AwakeningCommands {

    private static final String RACE_LAYER = "rpgraces:races";
    private static final String CLASS_LAYER = "rpgclasses:class";

    private AwakeningCommands() {}

    @SubscribeEvent
    public static void onRegisterCommands(RegisterCommandsEvent event) {
        register(event.getDispatcher());
    }

    private static void register(CommandDispatcher<CommandSourceStack> dispatcher) {
        dispatcher.register(
                Commands.literal("awakening")
                        .requires(source -> source.hasPermission(2))
                        .then(Commands.literal("close_quest_book")
                                .then(Commands.argument("players", EntityArgument.players())
                                        .executes(context -> closeQuestBooks(
                                                EntityArgument.getPlayers(context, "players")
                                        ))))
                        .then(Commands.literal("choose_race")
                                .then(Commands.argument("players", EntityArgument.players())
                                        .executes(context -> openOriginsSelection(
                                                context,
                                                EntityArgument.getPlayers(context, "players"),
                                                RACE_LAYER
                                        ))))
                        .then(Commands.literal("choose_class")
                                .then(Commands.argument("players", EntityArgument.players())
                                        .executes(context -> openOriginsSelection(
                                                context,
                                                EntityArgument.getPlayers(context, "players"),
                                                CLASS_LAYER
                                        ))))
                        .then(Commands.literal("finish")
                                .then(Commands.argument("players", EntityArgument.players())
                                        .executes(context -> finishAwakening(
                                                context,
                                                EntityArgument.getPlayers(context, "players")
                                        ))))
        );
    }

    private static int closeQuestBooks(Collection<ServerPlayer> players) {
        for (ServerPlayer player : players) {
            AwakeningNetwork.closeQuestBook(player);
        }
        return players.size();
    }

    private static int openOriginsSelection(
            CommandContext<CommandSourceStack> context,
            Collection<ServerPlayer> players,
            String layer
    ) {
        int successes = 0;

        for (ServerPlayer player : players) {
            AwakeningNetwork.closeQuestBook(player);

            String playerName = player.getGameProfile().getName();
            int result = context.getSource()
                    .getServer()
                    .getCommands()
                    .performPrefixedCommand(
                            player.createCommandSourceStack()
                                    .withPermission(2)
                                    .withSuppressedOutput(),
                            "origin gui " + playerName + " " + layer
                    );

            if (result > 0) successes++;
        }

        return successes;
    }

    private static int finishAwakening(
            CommandContext<CommandSourceStack> context,
            Collection<ServerPlayer> players
    ) {
        int successes = 0;

        for (ServerPlayer player : players) {
            String playerName = player.getGameProfile().getName();
            int result = context.getSource()
                    .getServer()
                    .getCommands()
                    .performPrefixedCommand(
                            player.createCommandSourceStack()
                                    .withPermission(2)
                                    .withSuppressedOutput(),
                            "ftbranks add " + playerName + " team_access"
                    );

            AwakeningNetwork.closeQuestBook(player);
            if (result > 0) successes++;
        }

        return successes;
    }
}
