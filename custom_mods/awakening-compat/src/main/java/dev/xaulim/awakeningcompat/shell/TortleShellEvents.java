package dev.xaulim.awakeningcompat.shell;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import io.redspace.ironsspellbooks.api.events.SpellPreCastEvent;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.phys.Vec3;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.event.entity.living.LivingAttackEvent;
import net.minecraftforge.event.entity.living.LivingEntityUseItemEvent;
import net.minecraftforge.event.entity.living.LivingEvent;
import net.minecraftforge.event.entity.player.AttackEntityEvent;
import net.minecraftforge.event.entity.player.PlayerEvent;
import net.minecraftforge.event.entity.player.PlayerInteractEvent;
import net.minecraftforge.event.level.BlockEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID)
public final class TortleShellEvents {

    private TortleShellEvents() {}

    private static boolean isShelled(LivingEntity entity) {
        return entity.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }

    private static boolean hasNaturalShell(Player player) {
        return player.getItemBySlot(EquipmentSlot.CHEST).is(TortleShellRegistries.TORTLE_SHELL_ITEM.get());
    }

    @SubscribeEvent
    public static void onOutgoingDamage(LivingAttackEvent event) {
        if (event.getSource().getEntity() instanceof Player attacker
                && event.getSource().getDirectEntity() == attacker
                && isShelled(attacker)) {
            event.setCanceled(true);
        }
    }

    @SubscribeEvent
    public static void onAttackEntity(AttackEntityEvent event) {
        if (isShelled(event.getEntity())) event.setCanceled(true);
    }

    @SubscribeEvent public static void onUseItem(PlayerInteractEvent.RightClickItem event) { cancelInteraction(event); }
    @SubscribeEvent public static void onUseBlock(PlayerInteractEvent.RightClickBlock event) { cancelInteraction(event); }
    @SubscribeEvent public static void onUseEntity(PlayerInteractEvent.EntityInteract event) { cancelInteraction(event); }
    @SubscribeEvent public static void onUseEntitySpecific(PlayerInteractEvent.EntityInteractSpecific event) { cancelInteraction(event); }

    @SubscribeEvent
    public static void onLeftClickBlock(PlayerInteractEvent.LeftClickBlock event) {
        if (isShelled(event.getEntity())) event.setCanceled(true);
    }

    private static void cancelInteraction(PlayerInteractEvent event) {
        if (isShelled(event.getEntity())) {
            event.setCancellationResult(InteractionResult.FAIL);
            event.setCanceled(true);
        }
    }

    @SubscribeEvent
    public static void onBreakBlock(BlockEvent.BreakEvent event) {
        if (isShelled(event.getPlayer())) event.setCanceled(true);
    }

    @SubscribeEvent
    public static void onStartUsingItem(LivingEntityUseItemEvent.Start event) {
        if (event.getEntity() instanceof Player player && isShelled(player)) event.setCanceled(true);
    }

    @SubscribeEvent
    public static void onSpellPreCast(SpellPreCastEvent event) {
        if (isShelled(event.getEntity())) event.setCanceled(true);
    }

    @SubscribeEvent
    public static void onPlayerTick(TickEvent.PlayerTickEvent event) {
        if (event.phase != TickEvent.Phase.END || !isShelled(event.player)) return;

        Player player = event.player;
        if (!hasNaturalShell(player)) {
            player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
            return;
        }

        Vec3 motion = player.getDeltaMovement();
        player.setDeltaMovement(0.0D, Math.min(motion.y, 0.0D), 0.0D);
        player.setSprinting(false);
        if (player.isUsingItem()) player.stopUsingItem();
    }

    @SubscribeEvent
    public static void onJump(LivingEvent.LivingJumpEvent event) {
        if (!(event.getEntity() instanceof Player player) || !isShelled(player)) return;
        Vec3 motion = player.getDeltaMovement();
        player.setDeltaMovement(0.0D, Math.min(motion.y, 0.0D), 0.0D);
    }

    @SubscribeEvent
    public static void onClone(PlayerEvent.Clone event) {
        event.getEntity().removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }

    @SubscribeEvent
    public static void onLogin(PlayerEvent.PlayerLoggedInEvent event) {
        event.getEntity().removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }

    @SubscribeEvent
    public static void onLogout(PlayerEvent.PlayerLoggedOutEvent event) {
        event.getEntity().removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }
}
