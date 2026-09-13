package dev.xaulim.awakeningcompat.event;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import java.util.List;
import java.util.ListIterator;
import javax.annotation.Nullable;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.npc.VillagerProfession;
import net.minecraft.world.entity.npc.VillagerTrades;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.trading.MerchantOffer;
import net.minecraftforge.event.entity.living.LivingDropsEvent;
import net.minecraftforge.event.village.VillagerTradesEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID, bus = Mod.EventBusSubscriber.Bus.FORGE)
public final class VanillaRangedWeaponRestrictionHandler {

    private VanillaRangedWeaponRestrictionHandler() {
    }

    @SubscribeEvent
    public static void onLivingDrops(LivingDropsEvent event) {
        if (!(event.getEntity() instanceof Mob)) {
            return;
        }

        event.getDrops().removeIf(drop ->
                drop.getItem().is(Items.BOW) || drop.getItem().is(Items.CROSSBOW));
    }

    @SubscribeEvent
    public static void onVillagerTrades(VillagerTradesEvent event) {
        if (event.getType() != VillagerProfession.FLETCHER) {
            return;
        }

        event.getTrades().values().forEach(VanillaRangedWeaponRestrictionHandler::wrapTradeListings);
    }

    private static void wrapTradeListings(List<VillagerTrades.ItemListing> listings) {
        ListIterator<VillagerTrades.ItemListing> iterator = listings.listIterator();
        while (iterator.hasNext()) {
            VillagerTrades.ItemListing listing = iterator.next();
            if (!(listing instanceof VanillaRangedWeaponFilteringListing)) {
                iterator.set(new VanillaRangedWeaponFilteringListing(listing));
            }
        }
    }

    private record VanillaRangedWeaponFilteringListing(VillagerTrades.ItemListing delegate)
            implements VillagerTrades.ItemListing {

        @Nullable
        @Override
        public MerchantOffer getOffer(Entity trader, RandomSource random) {
            MerchantOffer offer = delegate.getOffer(trader, random);
            if (offer == null) {
                return null;
            }

            return offer.getResult().is(Items.BOW) || offer.getResult().is(Items.CROSSBOW)
                    ? null
                    : offer;
        }
    }
}
