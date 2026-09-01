package dev.xaulim.awakeningicaruscompat.mixin;

import dev.xaulim.awakeningicaruscompat.compat.FaerieDetector;
import net.minecraft.world.entity.LivingEntity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(
    targets = "dev.cammiescorner.icarus.util.IcarusHelper",
    remap = false
)
public abstract class IcarusHelperMixin {

    @Inject(
        method = "hasWings",
        at = @At("RETURN"),
        cancellable = true,
        remap = false
    )
    private static void awakening$disableIcarusFlightForFaerie(
        LivingEntity entity,
        CallbackInfoReturnable<Boolean> cir
    ) {
        if (FaerieDetector.isFaerie(entity)) {
            cir.setReturnValue(false);
        }
    }
}