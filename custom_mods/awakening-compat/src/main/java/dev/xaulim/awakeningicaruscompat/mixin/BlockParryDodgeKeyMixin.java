package dev.xaulim.awakeningicaruscompat.mixin;

import dev.xaulim.awakeningcompat.parry.ParryEligibility;
import net.minecraft.world.entity.player.Player;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.Surrogate;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Pseudo
@Mixin(
        targets = "net.mcreator.blockparrydodge.network.ParryKeyMessage",
        remap = false
)
public abstract class BlockParryDodgeKeyMixin {

    @Inject(
            method = "pressAction",
            at = @At("HEAD"),
            cancellable = true,
            remap = false
    )
    private static void awakening$requireEligibleParryWeapon(
            Player entity,
            int type,
            int pressedms,
            CallbackInfo ci
    ) {
        if (type == 0 && !ParryEligibility.canParry(entity)) {
            ci.cancel();
        }
    }

    @Surrogate
    private static void awakening$requireEligibleParryWeapon(
            Player entity,
            int type,
            CallbackInfo ci
    ) {
        if (type == 0 && !ParryEligibility.canParry(entity)) {
            ci.cancel();
        }
    }
}
