package dev.xaulim.awakeningcompat.loot;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import it.unimi.dsi.fastutil.objects.ObjectArrayList;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.storage.loot.LootContext;
import net.minecraft.world.level.storage.loot.predicates.LootItemCondition;
import net.minecraftforge.common.loot.IGlobalLootModifier;
import net.minecraftforge.common.loot.LootModifier;
import org.jetbrains.annotations.NotNull;

public final class RemoveVanillaRangedLootModifier extends LootModifier {

    public static final Codec<RemoveVanillaRangedLootModifier> CODEC =
            RecordCodecBuilder.create(instance ->
                    codecStart(instance).apply(instance, RemoveVanillaRangedLootModifier::new));

    public RemoveVanillaRangedLootModifier(LootItemCondition[] conditions) {
        super(conditions);
    }

    @NotNull
    @Override
    protected ObjectArrayList<ItemStack> doApply(
            ObjectArrayList<ItemStack> generatedLoot,
            LootContext context
    ) {
        generatedLoot.removeIf(stack -> stack.is(Items.BOW) || stack.is(Items.CROSSBOW));
        return generatedLoot;
    }

    @Override
    public Codec<? extends IGlobalLootModifier> codec() {
        return CODEC;
    }
}
