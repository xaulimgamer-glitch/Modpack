package dev.xaulim.awakeningcompat.shell;

import dev.xaulim.awakeningcompat.network.AwakeningNetwork;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.enchantment.EnchantmentHelper;
import net.minecraft.world.item.enchantment.Enchantments;

/**
 * Owns the lifecycle of the Tortle racial shell.
 *
 * The shell is racial state, not loot: while the player owns the Tortle shell
 * power exactly one managed shell must exist in the chest slot. When the race
 * is lost or the player dies, the physical stack is removed instead of being
 * transferred to inventories, drops or corpse storage.
 */
public final class TortleShellLifecycle {

    private static final String OWNER_TAG = "AwakeningCompatTortleShellOwner";
    private static final int CHEST_INVENTORY_INDEX = 38;

    private TortleShellLifecycle() {}

    public static boolean isOwner(ServerPlayer player) {
        return player.getPersistentData().getBoolean(OWNER_TAG);
    }

    public static boolean isShell(ItemStack stack) {
        return stack.is(TortleShellRegistries.TORTLE_SHELL_ITEM.get());
    }

    public static void copyOwnership(ServerPlayer original, ServerPlayer clone) {
        setOwner(clone, isOwner(original));
    }

    /**
     * A genuine acquisition initializes an absent reserve to full. Keeping an
     * already-initialized value avoids accidental refills if a callback is
     * replayed by a datapack/power reload.
     */
    public static void gainShell(ServerPlayer player) {
        setOwner(player, true);
        player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
        TortleShellAction.initializeShellGuard(player);
        TortleShellAction.updateShellRecharge(player);
        AwakeningNetwork.syncTortleShellGuard(player, TortleShellAction.getShellGuard(player));
        ensureShellEquipped(player);
    }

    /**
     * Re-applies lifecycle invariants without treating a reload/login as a new
     * racial acquisition.
     */
    public static void syncShell(ServerPlayer player) {
        restoreExistingShellState(player);
    }

    /**
     * Re-equips the racial shell after clone/respawn while preserving the copied
     * guard amount and recharge window.
     */
    public static void respawnShell(ServerPlayer player) {
        restoreExistingShellState(player);
    }

    private static void restoreExistingShellState(ServerPlayer player) {
        setOwner(player, true);
        player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
        TortleShellAction.initializeShellGuard(player);
        TortleShellAction.updateShellRecharge(player);
        AwakeningNetwork.syncTortleShellGuard(player, TortleShellAction.getShellGuard(player));
        ensureShellEquipped(player);
    }

    public static void loseShell(ServerPlayer player) {
        setOwner(player, false);
        player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
        TortleShellAction.clearShellGuardState(player);
        AwakeningNetwork.syncTortleShellGuard(player, 0.0F);
        if (removeAllShellItems(player)) {
            syncInventory(player);
        }
    }

    /**
     * Called before death-inventory systems such as Corpse snapshot the player.
     * Ownership and Shell Guard are retained for respawn, but the physical stack
     * is removed from the dying player's inventory so it cannot be copied into
     * the corpse.
     */
    public static void prepareForDeath(ServerPlayer player) {
        boolean wasShelled = player.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
        player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());

        TortleShellAction.initializeShellGuard(player);
        if (wasShelled) {
            TortleShellAction.startShellRecharge(player);
        } else {
            TortleShellAction.ensureShellRechargeStarted(player);
        }
        AwakeningNetwork.syncTortleShellGuard(player, TortleShellAction.getShellGuard(player));

        if (removeAllShellItems(player)) {
            syncInventory(player);
        }
    }

    /**
     * Repairs the invariant and cleans legacy duplicates from older versions.
     */
    public static void sanitize(ServerPlayer player) {
        if (!isOwner(player)) {
            boolean wasShelled = player.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
            player.removeEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
            TortleShellAction.clearShellGuardState(player);
            if (wasShelled) {
                AwakeningNetwork.syncTortleShellGuard(player, 0.0F);
            }
            if (removeAllShellItems(player)) {
                syncInventory(player);
            }
            return;
        }

        ensureShellEquipped(player);
    }

    private static void ensureShellEquipped(ServerPlayer player) {
        ItemStack chest = player.getItemBySlot(EquipmentSlot.CHEST);
        boolean changed = false;

        if (!isShell(chest)) {
            if (!chest.isEmpty()) {
                ItemStack displaced = chest.copy();
                player.setItemSlot(EquipmentSlot.CHEST, ItemStack.EMPTY);
                if (!player.getInventory().add(displaced) && !displaced.isEmpty()) {
                    player.drop(displaced, false);
                }
            }
            player.setItemSlot(EquipmentSlot.CHEST, createNaturalShell());
            changed = true;
        } else if (!isManagedShell(chest)) {
            player.setItemSlot(EquipmentSlot.CHEST, createNaturalShell());
            changed = true;
        } else if (chest.getCount() != 1) {
            chest.setCount(1);
            changed = true;
        }

        Inventory inventory = player.getInventory();
        for (int i = 0; i < inventory.getContainerSize(); i++) {
            if (i == CHEST_INVENTORY_INDEX) continue;
            if (isShell(inventory.getItem(i))) {
                inventory.setItem(i, ItemStack.EMPTY);
                changed = true;
            }
        }

        if (isShell(player.containerMenu.getCarried())) {
            player.containerMenu.setCarried(ItemStack.EMPTY);
            changed = true;
        }

        if (changed) {
            syncInventory(player);
        }
    }

    private static ItemStack createNaturalShell() {
        ItemStack shell = new ItemStack(TortleShellRegistries.TORTLE_SHELL_ITEM.get());
        CompoundTag tag = shell.getOrCreateTag();
        tag.putBoolean("Unbreakable", true);
        tag.putInt("HideFlags", 5);
        shell.enchant(Enchantments.BINDING_CURSE, 1);
        return shell;
    }

    private static boolean isManagedShell(ItemStack stack) {
        if (!isShell(stack) || !stack.hasTag()) return false;
        CompoundTag tag = stack.getTag();
        return tag != null
                && tag.getBoolean("Unbreakable")
                && EnchantmentHelper.getItemEnchantmentLevel(Enchantments.BINDING_CURSE, stack) > 0;
    }

    private static boolean removeAllShellItems(ServerPlayer player) {
        Inventory inventory = player.getInventory();
        boolean changed = false;
        for (int i = 0; i < inventory.getContainerSize(); i++) {
            if (isShell(inventory.getItem(i))) {
                inventory.setItem(i, ItemStack.EMPTY);
                changed = true;
            }
        }
        if (isShell(player.containerMenu.getCarried())) {
            player.containerMenu.setCarried(ItemStack.EMPTY);
            changed = true;
        }
        return changed;
    }

    private static void setOwner(ServerPlayer player, boolean owner) {
        if (owner) {
            player.getPersistentData().putBoolean(OWNER_TAG, true);
        } else {
            player.getPersistentData().remove(OWNER_TAG);
        }
    }

    private static void syncInventory(ServerPlayer player) {
        player.getInventory().setChanged();
        player.inventoryMenu.broadcastChanges();
        player.containerMenu.broadcastChanges();
    }
}
