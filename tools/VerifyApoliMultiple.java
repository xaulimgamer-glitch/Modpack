import com.google.gson.JsonParser;
import com.mojang.serialization.Codec;
import com.mojang.serialization.JsonOps;
import io.github.edwinmindcraft.apoli.common.power.configuration.MultipleConfiguration;
import net.minecraft.core.Holder;
import java.util.Set;

/**
 * Executes Apoli Forge's actual MultipleMapCodec with a registry-independent
 * integer child codec. This tests container error propagation, not registration
 * or activation of real powers in a running Forge server.
 */
public final class VerifyApoliMultiple {
    public static void main(String[] args) {
        var excluded = Set.of("type", "loading_priority", "name", "description", "hidden",
                "condition", "conditions", "fabric:load_conditions", "forge:conditions");
        var child = Codec.INT.fieldOf("value").codec();
        Codec<Holder<Integer>> holder = Codec.INT.xmap(Holder::direct, Holder::value);
        var codec = MultipleConfiguration.mapCodec(child, holder,
                key -> !excluded.contains(key) && !key.startsWith("$"),
                key -> "_" + key, (key, value, json) -> value).codec();

        var good = codec.parse(JsonOps.INSTANCE, JsonParser.parseString(
                "{\"type\":\"origins:multiple\",\"name\":\"test\","
                + "\"invisibility\":{\"value\":1},\"camouflage\":{\"value\":2}}"));
        var children = good.result().orElseThrow().children();
        require(children.keySet().equals(Set.of("_invisibility", "_camouflage")), "child key mapping");
        require(children.get("_camouflage").value() == 2, "second child retained");

        var bad = codec.parse(JsonOps.INSTANCE, JsonParser.parseString(
                "{\"type\":\"origins:multiple\",\"invisibility\":{\"value\":1},"
                + "\"camouflage\":{\"value\":\"invalid\"}}"));
        require(bad.error().isPresent(), "invalid child reported");
        require(bad.result().isEmpty(), "error is not a clean success");
        var partial = bad.resultOrPartial(message -> System.out.println("Expected error: " + message))
                .orElseThrow().children();
        require(partial.keySet().equals(Set.of("_invisibility")), "valid sibling survives as partial result");

        var empty = codec.parse(JsonOps.INSTANCE, JsonParser.parseString(
                "{\"type\":\"origins:multiple\",\"camouflage\":{\"value\":\"invalid\"}}"));
        require(empty.error().isPresent(), "all-invalid children reported");
        require(empty.resultOrPartial(message -> {}).orElseThrow().children().isEmpty(),
                "all-invalid children yield empty partial container");
        System.out.println("PASS: actual Apoli MultipleMapCodec accepts siblings, prefixes keys and retains valid children on decode error.");
    }

    private static void require(boolean value, String label) {
        if (!value) throw new AssertionError(label);
    }
}
