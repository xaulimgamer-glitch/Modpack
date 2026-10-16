package dev.xaulim.awakeningcompat.parry;

import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.TagKey;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraftforge.common.ToolActions;
import net.minecraftforge.fml.ModList;

public final class ParryEligibility {
    public static final TagKey<Item> PARRY_ELIGIBLE = TagKey.create(
            Registries.ITEM,
            new ResourceLocation("awakening", "combat/parry_eligible")
    );

    private static final String SHIELD_OVERHAUL_MOD_ID = "shield_overhaul";
    private static final String SHIELD_OVERHAUL_PARRY_WINDOW = "parry_window";

    private ParryEligibility() {}

    /**
     * Weapon-only portion of the parry policy. This remains data-driven by the
     * canonical Awakening item tag and deliberately knows nothing about class.
     */
    public static boolean isWeaponEligible(ItemStack stack) {
        return stack != null && !stack.isEmpty() && stack.is(PARRY_ELIGIBLE);
    }

    /**
     * Shield defense owns an incoming hit while a shield is actively being used.
     * When Shield Overhaul is installed, its perfect-parry window also owns the
     * hit after the use button is released. This keeps weapon parry and shield
     * block/parry as separate mechanics instead of allowing BPD's early
     * LivingAttackEvent cancellation to preempt shield processing.
     */
    public static boolean isShieldDefenseActive(Player player) {
        if (player == null) return false;

        if (player.isUsingItem() && isShieldBlockingStack(player.getUseItem())) {
            return true;
        }

        if (!ModList.get().isLoaded(SHIELD_OVERHAUL_MOD_ID)) {
            return false;
        }

        long gameTime = player.level().getGameTime();
        return hasShieldOverhaulParryWindow(player.getMainHandItem(), gameTime)
                || hasShieldOverhaulParryWindow(player.getOffhandItem(), gameTime);
    }

    private static boolean isShieldBlockingStack(ItemStack stack) {
        return stack != null
                && !stack.isEmpty()
                && stack.canPerformAction(ToolActions.SHIELD_BLOCK);
    }

    private static boolean hasShieldOverhaulParryWindow(ItemStack stack, long gameTime) {
        return isShieldBlockingStack(stack)
                && stack.hasTag()
                && stack.getTag().getLong(SHIELD_OVERHAUL_PARRY_WINDOW) > gameTime;
    }

    /**
     * Final parry gate: the main-hand weapon and the player's class must both
     * explicitly allow the mechanic. Shield defense takes precedence so a hit
     * cannot be consumed by weapon parry before shield block/perfect-parry logic.
     * Every missing/unknown state fails closed.
     */
    public static boolean canParry(Player player) {
        if (player == null) return false;

        return isWeaponEligible(player.getMainHandItem())
                && ParryClassPolicy.isAllowed(player)
                && !isShieldDefenseActive(player);
    }
}
