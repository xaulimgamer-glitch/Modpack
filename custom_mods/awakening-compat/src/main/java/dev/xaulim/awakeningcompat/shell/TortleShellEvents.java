package dev.xaulim.awakeningcompat.shell;

import dev.xaulim.awakeningcompat.AwakeningCompat;
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

    private TortleShellEvents() {}

    private static boolean isShelled(LivingEntity entity) {
        return entity.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }

    private static boolean hasNaturalShell(Player player) {
        return player.getItemBySlot(EquipmentSlot.CHEST).is(TortleShellRegistries.TORTLE_SHELL_ITEM.get());
    }

    /**
     * A fully withdrawn Tortle trades all agency for near-total protection.
     * Vanilla's BYPASSES_INVULNERABILITY tag is deliberately respected so the
     * void and administrative kill damage can still terminate the player.
     */
    @SubscribeEvent(priority = EventPriority.HIGHEST)
    public static void onIncomingDamage(LivingAttackEvent event) {
        if (isShelled(event.getEntity())
                && !event.getSource().is(DamageTypeTags.BYPASSES_INVULNERABILITY)) {
            event.setCanceled(true);
        }
    }

    /**
     * Secondary guard for damage paths from mods that reach LivingHurtEvent.
     */
    @SubscribeEvent(priority = EventPriority.HIGHEST)
    public static void onIncomingHurt(LivingHurtEvent event) {
        if (isShelled(event.getEntity())
                && !event.getSource().is(DamageTypeTags.BYPASSES_INVULNERABILITY)) {
            event.setCanceled(true);
        }
    }

    /**
     * Damage immunity alone is not enough: explosions, melee hits and several
     * modded attacks may still attempt to move the player. A withdrawn Tortle
     * behaves as an anchored shell and ignores living-entity knockback entirely.
     */
    @SubscribeEvent(priority = EventPriority.HIGHEST)
    public static void onKnockBack(LivingKnockBackEvent event) {
        if (isShelled(event.getEntity())) {
            event.setCanceled(true);
        }
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

    @SubscribeEvent
    public static void onPlayerTick(TickEvent.PlayerTickEvent event) {
        if (event.phase != TickEvent.Phase.END) return;

        Player player = event.player;
        if (!player.level().isClientSide && player instanceof ServerPlayer serverPlayer) {
            // Continuous invariant repair also deletes shells recovered from
            // legacy corpses or inventories created by older builds.
            TortleShellLifecycle.sanitize(serverPlayer);
        }

        if (!isShelled(player)) return;

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

        if (event.getOriginal() instanceof ServerPlayer original
                && event.getEntity() instanceof ServerPlayer clone) {
            TortleShellLifecycle.copyOwnership(original, clone);
            if (TortleShellLifecycle.isOwner(clone)) {
                TortleShellLifecycle.gainShell(clone);
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
        }
    }

    @SubscribeEvent
    public static void onLogout(PlayerEvent.PlayerLoggedOutEvent event) {
        event.getEntity().removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }
}
