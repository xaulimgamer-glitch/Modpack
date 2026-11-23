package dev.xaulim.awakeningcompat.command;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import io.github.edwinmindcraft.apoli.api.component.IPowerContainer;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.commands.arguments.EntityArgument;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.level.LightLayer;
import net.minecraftforge.event.RegisterCommandsEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.registries.ForgeRegistries;

import java.util.Locale;

/** Read-only server observations; never grants powers or changes attributes. */
@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID)
public final class StealthDiagnosticCommand {
    private StealthDiagnosticCommand() {}

    @SubscribeEvent
    public static void register(RegisterCommandsEvent event) {
        event.getDispatcher().register(Commands.literal("awakening_stealth_debug")
                .requires(source -> source.hasPermission(2))
                .executes(context -> inspect(context.getSource(), context.getSource().getPlayerOrException()))
                .then(Commands.argument("player", EntityArgument.player())
                        .executes(context -> inspect(context.getSource(), EntityArgument.getPlayer(context, "player")))));
    }

    @SuppressWarnings("deprecation")
    private static int inspect(CommandSourceStack source, ServerPlayer player) {
        var level = player.level();
        var eye = BlockPos.containing(player.getX(), player.getEyeY(), player.getZ());
        float entityBrightness = player.getLightLevelDependentMagicValue();
        float worldBrightness = level.getLightLevelDependentMagicValue(eye);
        send(source, String.format(Locale.ROOT,
                "%s | dim=%s | eyes=%s | sneaking=%s | loaded=%s",
                player.getGameProfile().getName(), level.dimension().location(), eye.toShortString(),
                player.isShiftKeyDown(), level.hasChunkAt(eye)));
        send(source, String.format(Locale.ROOT,
                "brightness(entity)=%.8f | brightness(world)=%.8f | <=0.15=%s | raw=%d | block=%d | sky=%d | skyDarken=%d | ambient=%.4f",
                entityBrightness, worldBrightness, entityBrightness <= 0.15F,
                level.getMaxLocalRawBrightness(eye), level.getBrightness(LightLayer.BLOCK, eye),
                level.getBrightness(LightLayer.SKY, eye), level.getSkyDarken(), level.dimensionType().ambientLight()));

        var container = IPowerContainer.get(player).resolve();
        if (container.isEmpty()) {
            send(source, "Origins power container: missing");
        } else {
            for (String id : new String[] {
                    "rpgraces:elf/drow/shadow_veil",
                    "rpgraces:elf/drow/shadow_veil_invisibility",
                    "rpgraces:elf/drow/shadow_veil_camouflage",
                    "rpgraces:elf/wood_elf/forest_veil",
                    "rpgraces:elf/wood_elf/forest_veil_invisibility",
                    "rpgraces:elf/wood_elf/forest_veil_camouflage",
                    "rpgraces:generic/dark_vision/superior",
                    "rpgraces:elf/drow/sun_sensitivity",
                    "rpgraces:elf/drow/sun_sensitivity_dark_adaptation"}) {
                var power = container.get().getPowers().stream()
                        .filter(holder -> holder.unwrapKey()
                                .map(key -> key.location().toString().equals(id)).orElse(false))
                        .findFirst();
                send(source, id + " | " + power.map(holder -> "active=" + holder.value().isActive(player)
                                + " | value=" + holder.value().getValue(player))
                        .orElse("missing"));
            }
        }

        for (String name : new String[] {"camouflage", "muffling"}) {
            var attribute = ForgeRegistries.ATTRIBUTES.getValue(new ResourceLocation("stealth", name));
            var instance = attribute == null ? null : player.getAttribute(attribute);
            if (instance == null) {
                send(source, "stealth:" + name + " | attribute missing");
                continue;
            }
            send(source, "stealth:" + name + " | base=" + instance.getBaseValue() + " | total=" + instance.getValue());
            for (var modifier : instance.getModifiers()) {
                send(source, "  " + modifier.getName() + " | " + modifier.getId()
                        + " | " + modifier.getOperation() + " | " + modifier.getAmount());
            }
        }
        send(source, "Snapshot only: wait at least one server tick after changing stance or light, then repeat.");
        return 1;
    }

    private static void send(CommandSourceStack source, String message) {
        source.sendSuccess(() -> Component.literal(message), false);
    }
}
