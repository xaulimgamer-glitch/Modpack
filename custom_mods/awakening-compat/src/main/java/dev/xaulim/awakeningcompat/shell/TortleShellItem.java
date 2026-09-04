package dev.xaulim.awakeningcompat.shell;

import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.item.ArmorItem;
import net.minecraft.world.item.ArmorMaterial;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.crafting.Ingredient;

public final class TortleShellItem extends ArmorItem {

    public TortleShellItem() {
        super(
                ShellMaterial.INSTANCE,
                ArmorItem.Type.CHESTPLATE,
                new Item.Properties().fireResistant()
        );
    }

    @Override
    public boolean isValidRepairItem(ItemStack toRepair, ItemStack repair) {
        return false;
    }

    /**
     * The racial armor value is intentionally kept outside the item for now.
     * rpgraces:tortle/shellarmor remains the authority until shell progression
     * is implemented.
     */
    private enum ShellMaterial implements ArmorMaterial {
        INSTANCE;

        @Override
        public int getDurabilityForType(ArmorItem.Type type) {
            return 4096;
        }

        @Override
        public int getDefenseForType(ArmorItem.Type type) {
            return 0;
        }

        @Override
        public int getEnchantmentValue() {
            return 0;
        }

        @Override
        public SoundEvent getEquipSound() {
            return SoundEvents.ARMOR_EQUIP_TURTLE;
        }

        @Override
        public Ingredient getRepairIngredient() {
            return Ingredient.EMPTY;
        }

        @Override
        public String getName() {
            return "awakening_compat:tortle_shell";
        }

        @Override
        public float getToughness() {
            return 0.0F;
        }

        @Override
        public float getKnockbackResistance() {
            return 0.0F;
        }
    }
}
