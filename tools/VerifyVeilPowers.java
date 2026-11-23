import com.google.gson.*;
import java.nio.file.*;
import java.util.*;

/** Static datapack checks; does not simulate Forge registries or mob AI. */
public final class VerifyVeilPowers {
    public static void main(String[] args) throws Exception {
        var root = Path.of("config/paxi/datapacks/rpg_races/data/rpgraces");
        var powers = new HashMap<String, JsonObject>();
        int jsonCount = 0;
        try (var files = Files.walk(root)) {
            for (var file : files.filter(p -> p.toString().endsWith(".json")).toList()) {
                JsonParser.parseString(Files.readString(file));
                jsonCount++;
            }
        }
        var powerRoot = root.resolve("powers");
        try (var files = Files.walk(powerRoot)) {
            for (var file : files.filter(p -> p.toString().endsWith(".json")).toList()) {
                String relative = powerRoot.relativize(file).toString().replace('\\', '/');
                String id = "rpgraces:" + relative.substring(0, relative.length() - 5);
                var json = JsonParser.parseString(Files.readString(file)).getAsJsonObject();
                require(powers.putIfAbsent(id, json) == null, "duplicate power: " + id);
            }
        }
        var generated = new HashSet<String>();
        var excluded = Set.of("type", "name", "description", "hidden", "loading_priority", "condition",
                "conditions", "fabric:load_conditions", "forge:conditions");
        for (var entry : powers.entrySet()) {
            if (!entry.getValue().get("type").getAsString().endsWith(":multiple")) continue;
            for (var child : entry.getValue().entrySet()) {
                if (excluded.contains(child.getKey()) || child.getKey().startsWith("$")) continue;
                String id = entry.getKey() + "_" + child.getKey();
                require(!powers.containsKey(id) && generated.add(id), "generated ID collision: " + id);
                require(child.getValue().isJsonObject(), "child must be an object: " + id);
            }
        }
        int refs = 0;
        try (var files = Files.walk(root.resolve("origins"))) {
            for (var file : files.filter(p -> p.toString().endsWith(".json")).toList()) {
                var origin = JsonParser.parseString(Files.readString(file)).getAsJsonObject();
                if (!origin.has("powers")) continue;
                for (var value : origin.getAsJsonArray("powers")) {
                    String id = value.getAsString();
                    if (!id.startsWith("rpgraces:")) continue;
                    require(powers.containsKey(id) || generated.contains(id), "missing power " + id + " in " + file);
                    refs++;
                }
            }
        }
        for (String suffix : List.of("elf/drow/shadow_veil", "elf/wood_elf/forest_veil")) {
            var veil = powers.get("rpgraces:" + suffix);
            var invis = veil.getAsJsonObject("invisibility");
            var camo = veil.getAsJsonObject("camouflage");
            require(invis.get("condition").equals(camo.get("condition")), "conditions differ: " + suffix);
            require(camo.get("type").getAsString().equals("origins:conditioned_attribute"), "attribute power type");
            require(camo.get("tick_rate").getAsInt() == 1, "tick rate");
            var modifier = camo.getAsJsonObject("modifier");
            require(modifier.get("attribute").getAsString().equals("stealth:camouflage"), "attribute ID");
            require(modifier.get("operation").getAsString().equals("addition"), "operation");
            require(modifier.get("value").getAsDouble() == 1.0, "camouflage amount");
            require(!veil.toString().contains("muffling"), "unexpected muffling");
            String path = "config/paxi/datapacks/rpg_races/data/rpgraces/powers/" + suffix + ".json";
            var process = new ProcessBuilder("git", "show", "a52d766^:" + path).start();
            var before = JsonParser.parseString(new String(process.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8)).getAsJsonObject();
            require(process.waitFor() == 0, "cannot read pre-commit power");
            require(before.get("condition").equals(invis.get("condition")), "condition changed since before integration");
            require(before.get("render_armor").equals(invis.get("render_armor")), "armor rendering changed");
        }
        String adaptation = "rpgraces:elf/drow/sun_sensitivity_dark_adaptation";
        require(generated.contains(adaptation), "Sun Glare resource ID not generated");
        String overlay = Files.readString(Path.of("custom_mods/awakening-compat/src/main/java/dev/xaulim/awakeningcompat/client/DrowSunGlareOverlay.java"));
        require(overlay.contains("elf/drow/sun_sensitivity_dark_adaptation"), "overlay resource ID mismatch");
        var vision = powers.get("rpgraces:generic/dark_vision/superior");
        require(vision.get("type").getAsString().equals("origins:night_vision"), "night vision type");
        require(vision.get("strength").getAsDouble() == 0.6, "night vision strength");
        System.out.println("PASS: " + jsonCount + " JSONs; " + refs + " local origin references; veil conditions match pre-a52d766; camouflage, night vision and Sun Glare IDs consistent.");
    }

    private static void require(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }
}
