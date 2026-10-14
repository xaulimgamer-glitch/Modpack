package dev.xaulim.awakeningicaruscompat.mixin;

import dev.xaulim.awakeningcompat.parry.ParryEligibility;
import net.minecraft.world.entity.player.Player;
import net.minecraftforge.event.entity.living.LivingAttackEvent;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Pseudo
@Mixin(
        targets = "net.mcreator.blockparrydodge.procedures.ParryActiveProcedure",
        remap = false
)
public abstract class BlockParryDodgeAttackMixin {

    @Inject(
            method = "onEntityAttacked",
            at = @At("HEAD"),
            cancellable = true,
            remap = false
    )
    private static void awakening$requireEligibleParryWeapon(
            LivingAttackEvent event,
            CallbackInfo ci
    ) {
        if (event != null
                && event.getEntity() instanceof Player player
                && !ParryEligibility.canParry(player)) {
            ci.cancel();
        }
    }
}
