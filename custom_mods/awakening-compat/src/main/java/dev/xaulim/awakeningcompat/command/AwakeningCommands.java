package dev.xaulim.awakeningcompat.command;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.context.CommandContext;
import dev.xaulim.awakeningcompat.AwakeningCompat;
import dev.xaulim.awakeningcompat.network.AwakeningNetwork;
import dev.xaulim.awakeningcompat.network.AwakeningNetwork.OriginsSelectionTarget;
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
                                                EntityArgument.getPlayers(context, "players"),
                                                OriginsSelectionTarget.RACE
                                        ))))
                        .then(Commands.literal("choose_class")
                                .then(Commands.argument("players", EntityArgument.players())
                                        .executes(context -> openOriginsSelection(
                                                EntityArgument.getPlayers(context, "players"),
                                                OriginsSelectionTarget.CLASS
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
            Collection<ServerPlayer> players,
            OriginsSelectionTarget target
    ) {
        for (ServerPlayer player : players) {
            AwakeningNetwork.beginOriginsSelection(player, target);
        }

        return players.size();
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
