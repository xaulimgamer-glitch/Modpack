package dev.xaulim.awakeningcompat.shell;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import dev.xaulim.awakeningcompat.network.AwakeningNetwork;
import io.redspace.ironsspellbooks.api.events.SpellPreCastEvent;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.tags.DamageTypeTags;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.phys.Vec3;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.event.entity.living.LivingAttackEvent;
import net.minecraftforge.event.entity.living.LivingDeathEvent;
import net.minecraftforge.event.entity.living.LivingEntityUseItemEvent;
import net.minecraftforge.event.entity.living.LivingEquipmentChangeEvent;
import net.minecraftforge.event.entity.living.LivingEvent;
import net.minecraftforge.event.entity.living.LivingHurtEvent;
import net.minecraftforge.event.entity.living.LivingKnockBackEvent;
import net.minecraftforge.event.entity.player.AttackEntityEvent;
import net.minecraftforge.event.entity.player.PlayerEvent;
import net.minecraftforge.event.entity.player.PlayerInteractEvent;
import net.minecraftforge.event.level.BlockEvent;
import net.minecraftforge.eventbus.api.EventPriority;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID)
public final class TortleShellEvents {

    private static final int SANITIZE_INTERVAL_TICKS = 100;

    private TortleShellEvents() {}

    private static boolean isShelled(LivingEntity entity) {
        return entity.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }

    private static boolean hasNaturalShell(Player player) {
        return player.getItemBySlot(EquipmentSlot.CHEST).is(TortleShellRegistries.TORTLE_SHELL_ITEM.get());
    }

    /**
     * A withdrawn Tortle absorbs ordinary incoming damage with a finite,
     * persistent guard. Damage tagged BYPASSES_INVULNERABILITY is deliberately
     * untouched and does not consume the guard. Any damage that exceeds the
     * remaining guard breaks the shell and the overflow continues through the
     * normal damage pipeline.
     */
    @SubscribeEvent(priority = EventPriority.HIGHEST)
    public static void onIncomingHurt(LivingHurtEvent event) {
        if (!(event.getEntity() instanceof ServerPlayer player)
                || !isShelled(player)
                || event.getSource().is(DamageTypeTags.BYPASSES_INVULNERABILITY)) {
            return;
        }

        float incoming = event.getAmount();
        if (incoming <= 0.0F) return;

        float remaining = TortleShellAction.getShellGuard(player);
        if (remaining <= 0.0F) {
            TortleShellAction.exitShell(player);
            return;
        }

        float absorbed = Math.min(incoming, remaining);
        float overflow = incoming - absorbed;
        float newRemaining = remaining - absorbed;

        if (newRemaining > 0.0F) {
            TortleShellAction.setShellGuard(player, newRemaining);
            AwakeningNetwork.syncTortleShellGuard(player, newRemaining);
        } else {
            TortleShellAction.setShellGuard(player, 0.0F);
            TortleShellAction.exitShell(player);
        }

        if (overflow <= 0.0F) {
            event.setCanceled(true);
        } else {
            event.setAmount(overflow);
        }
    }

    /**
     * Damage absorption is handled only at LivingHurtEvent so one hit cannot be
     * counted twice. LivingAttackEvent remains reserved for blocking attacks made
     * by a player who is currently withdrawn.
     */
    @SubscribeEvent
    public static void onOutgoingDamage(LivingAttackEvent event) {
        if (event.getSource().getEntity() instanceof Player attacker
                && event.getSource().getDirectEntity() == attacker
                && isShelled(attacker)) {
            event.setCanceled(true);
        }
    }

    /**
     * Explosions, melee hits and several modded attacks may still attempt to move
     * the player. A withdrawn Tortle behaves as an anchored shell and ignores
     * living-entity knockback entirely while the shell remains active.
     */
    @SubscribeEvent(priority = EventPriority.HIGHEST)
    public static void onKnockBack(LivingKnockBackEvent event) {
        if (isShelled(event.getEntity())) {
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

    /**
     * Corpse snapshots the player's death inventory. Removing the racial shell
     * at HIGHEST priority keeps it out of that snapshot entirely.
     */
    @SubscribeEvent(priority = EventPriority.HIGHEST)
    public static void onDeath(LivingDeathEvent event) {
        if (event.getEntity() instanceof ServerPlayer player
                && TortleShellLifecycle.isOwner(player)) {
            TortleShellLifecycle.prepareForDeath(player);
        }
    }

    /**
     * Chest-slot changes are the common path for an invariant violation. Repair
     * Tortles immediately, and non-Tortles only when the changed stack itself is
     * a racial shell. The periodic sanitizer remains as a backstop for commands,
     * other mods and legacy inventory state that can bypass equipment events.
     */
    @SubscribeEvent
    public static void onEquipmentChange(LivingEquipmentChangeEvent event) {
        if (!(event.getEntity() instanceof ServerPlayer player)
                || event.getSlot() != EquipmentSlot.CHEST) {
            return;
        }

        if (TortleShellLifecycle.isOwner(player)
                || TortleShellLifecycle.isShell(event.getFrom())
                || TortleShellLifecycle.isShell(event.getTo())) {
            TortleShellLifecycle.sanitize(player);
        }
    }

    @SubscribeEvent
    public static void onPlayerTick(TickEvent.PlayerTickEvent event) {
        if (event.phase != TickEvent.Phase.END) return;

        Player player = event.player;
        if (!player.level().isClientSide && player instanceof ServerPlayer serverPlayer) {
            // Lifecycle/equipment events handle normal changes immediately. This
            // staggered fallback catches mutations that bypass those paths without
            // scanning every player's entire inventory on every server tick.
            if (Math.floorMod(serverPlayer.tickCount + serverPlayer.getId(), SANITIZE_INTERVAL_TICKS) == 0) {
                TortleShellLifecycle.sanitize(serverPlayer);
            }

            // Recharge checks are intentionally spaced and server-authoritative.
            if (TortleShellLifecycle.isOwner(serverPlayer)
                    && !isShelled(serverPlayer)
                    && serverPlayer.tickCount % 20 == 0
                    && TortleShellAction.updateShellRecharge(serverPlayer)) {
                AwakeningNetwork.syncTortleShellGuard(serverPlayer, TortleShellAction.MAX_SHELL_GUARD);
            }
        }

        if (!isShelled(player)) return;

        if (!hasNaturalShell(player)) {
            if (player instanceof ServerPlayer serverPlayer) {
                TortleShellAction.exitShell(serverPlayer);
            } else {
                player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
            }
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

        if (event.getOriginal() instanceof ServerPlayer original
                && event.getEntity() instanceof ServerPlayer clone) {
            TortleShellLifecycle.copyOwnership(original, clone);
            TortleShellAction.copyShellGuardState(original, clone);

            if (TortleShellLifecycle.isOwner(clone)) {
                TortleShellLifecycle.respawnShell(clone);
            } else {
                TortleShellLifecycle.loseShell(clone);
            }
        }
    }

    @SubscribeEvent
    public static void onLogin(PlayerEvent.PlayerLoggedInEvent event) {
        event.getEntity().removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
        if (event.getEntity() instanceof ServerPlayer player) {
            TortleShellLifecycle.sanitize(player);
            if (TortleShellLifecycle.isOwner(player)) {
                TortleShellAction.initializeShellGuard(player);
                TortleShellAction.updateShellRecharge(player);
                AwakeningNetwork.syncTortleShellGuard(player, TortleShellAction.getShellGuard(player));
            } else {
                AwakeningNetwork.syncTortleShellGuard(player, 0.0F);
            }
        }
    }

    @SubscribeEvent
    public static void onLogout(PlayerEvent.PlayerLoggedOutEvent event) {
        // Leaving the server never clears or refills the persistent reserve.
        // If the player disconnected while withdrawn, recharge starts on login.
        event.getEntity().removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }

    @SubscribeEvent
    public static void onChangedDimension(PlayerEvent.PlayerChangedDimensionEvent event) {
        if (event.getEntity() instanceof ServerPlayer player
                && TortleShellLifecycle.isOwner(player)) {
            TortleShellAction.updateShellRecharge(player);
            AwakeningNetwork.syncTortleShellGuard(player, TortleShellAction.getShellGuard(player));
        }
    }
}
