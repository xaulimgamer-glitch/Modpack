package dev.xaulim.awakeningicaruscompat.mixin;

import dev.xaulim.awakeningicaruscompat.compat.FaerieDetector;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Redirect;

@Mixin(
    targets = "com.r3x.icarusrewinged.client.models.FixedWingEntityModel",
    remap = false
)
public abstract class FixedWingEntityModelMixin {

    @Redirect(
        method = "setupAnim(Lnet/minecraft/world/entity/LivingEntity;FFFFF)V",
        at = @At(
            value = "INVOKE",
            target = "Lnet/minecraft/world/entity/LivingEntity;m_21255_()Z"
        ),
        remap = false
    )
    private boolean awakening$creativeFlightCountsAsFlying(
        LivingEntity entity
    ) {
        if (entity instanceof Player player
            && FaerieDetector.isFaerie(player)
            && player.getAbilities().flying) {

            return true;
        }

        return entity.isFallFlying();
    }
}