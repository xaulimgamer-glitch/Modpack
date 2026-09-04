package dev.xaulim.awakeningcompat.shell;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import dev.xaulim.awakeningcompat.shell.client.TortleShellArmorModel;
import net.minecraft.client.Minecraft;
import net.minecraft.client.model.HumanoidModel;
import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.item.ArmorItem;
import net.minecraft.world.item.ArmorMaterial;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.crafting.Ingredient;
import net.minecraftforge.client.extensions.common.IClientItemExtensions;

import java.util.function.Consumer;

public final class TortleShellItem extends ArmorItem {

    private static final String ARMOR_TEXTURE =
            AwakeningCompat.MOD_ID + ":textures/models/armor/shell_armor_crack_none.png";

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
     * The racial shell keeps Curse of Binding for its gameplay purpose, but it
     * should never display Minecraft's enchantment glint.
     */
    @Override
    public boolean isFoil(ItemStack stack) {
        return false;
    }

    @Override
    public String getArmorTexture(ItemStack stack, Entity entity, EquipmentSlot slot, String type) {
        return ARMOR_TEXTURE;
    }

    @Override
    public void initializeClient(Consumer<IClientItemExtensions> consumer) {
        consumer.accept(new IClientItemExtensions() {
            private TortleShellArmorModel armorModel;

            @Override
            public HumanoidModel<?> getHumanoidArmorModel(
                    LivingEntity livingEntity,
                    ItemStack itemStack,
                    EquipmentSlot equipmentSlot,
                    HumanoidModel<?> original
            ) {
                if (armorModel == null) {
                    armorModel = new TortleShellArmorModel(
                            Minecraft.getInstance().getEntityModels().bakeLayer(TortleShellArmorModel.LAYER_LOCATION)
                    );
                }
                return armorModel;
            }
        });
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
