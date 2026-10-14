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

    private ParryEligibility() {
    }

    public static boolean canParry(Player player) {
        if (player == null) {
            return false;
        }

        ItemStack stack = player.getMainHandItem();
        return !stack.isEmpty() && stack.is(PARRY_ELIGIBLE);
    }
}
