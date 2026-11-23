package dev.xaulim.awakeningicaruscompat.mixin;

import com.electronwill.nightconfig.core.CommentedConfig;
import java.util.List;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Redirect;

/** Jupiter receives literal entry keys, not dot-separated NightConfig paths. */
@Pseudo
@Mixin(targets = "com.iafenvoy.jupiter.compat.forgeconfigspec.NightConfigHolder", remap = false)
public abstract class JupiterLiteralConfigKeyMixin {
    @Redirect(
        method = "buildGroup",
        at = @At(value = "INVOKE", target = "Lcom/electronwill/nightconfig/core/CommentedConfig;get(Ljava/lang/String;)Ljava/lang/Object;"),
        remap = false
    )
    private Object awakening$readLiteralKey(CommentedConfig config, String key) {
        return config.get(List.of(key));
    }

    // Jupiter 2.3.7 saves through four static, generated callbacks. A non-static
    // redirect with a wildcard selector skips these methods entirely.
    @Redirect(
        method = {
            "lambda$processEntry$0",
            "lambda$processEnum$1",
            "lambda$processCollectionEntry$2",
            "lambda$processEnumCollection$3"
        },
        at = @At(value = "INVOKE", target = "Lcom/electronwill/nightconfig/core/CommentedConfig;set(Ljava/lang/String;Ljava/lang/Object;)Ljava/lang/Object;"),
        remap = false,
        require = 4,
        allow = 4
    )
    private static Object awakening$writeLiteralKey(CommentedConfig config, String key, Object value) {
        return config.set(List.of(key), value);
    }
}
