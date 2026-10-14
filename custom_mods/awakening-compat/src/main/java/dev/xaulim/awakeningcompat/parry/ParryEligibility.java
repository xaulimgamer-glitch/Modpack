package dev.xaulim.awakeningcompat.parry;

import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.TagKey;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;

public final class ParryEligibility {
    public static final TagKey<Item> PARRY_ELIGIBLE = TagKey.create(
            Registries.ITEM,
            new ResourceLocation("awakening", "combat/parry_eligible")
    );

    private ParryEligibility() {}

    /**
     * Weapon-only portion of the parry policy. This remains data-driven by the
     * canonical Awakening item tag and deliberately knows nothing about class.
     */
    public static boolean isWeaponEligible(ItemStack stack) {
        return stack != null && !stack.isEmpty() && stack.is(PARRY_ELIGIBLE);
    }

    /**
     * Final parry gate: the main-hand weapon and the player's class must both
     * explicitly allow the mechanic. Every missing/unknown state fails closed.
     */
    public static boolean canParry(Player player) {
        if (player == null) return false;

        return isWeaponEligible(player.getMainHandItem())
                && ParryClassPolicy.isAllowed(player);
    }
}
