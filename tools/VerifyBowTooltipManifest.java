import com.google.gson.*;
import dev.latvian.mods.rhino.*;
import java.nio.file.*;
import java.util.*;

/** Executes registration against the real manifest with mocked KubeJS events. */
public final class VerifyBowTooltipManifest {
    public static void main(String[] args) throws Exception {
        var context = Context.enter();
        var scope = context.initStandardObjects();
        String manifest = Files.readString(Path.of("kubejs/awakening/arch_bow_variants.json"));
        ScriptableObject.putProperty(scope, "__manifest", manifest, context);
        context.evaluateString(scope, "var __registered=[];"
                + "var Java={loadClass:function(){return {hasShiftDown:function(){return false}}}};"
                + "var JsonIO={readString:function(path){return __manifest}};"
                + "var ItemEvents={tooltip:function(handler){handler({addAdvanced:function(id,callback){__registered.push(id)}})}};",
                "test-setup", 1, null);
        String source = Files.readString(Path.of("kubejs/client_scripts/awakening_bow_tooltips.js"));
        boolean oldFailed = false;
        try {
            context.evaluateString(scope, source.replace("(data.schema !== 2 && data.schema !== 3)", "data.schema !== 2"), "old-schema-check", 1, null);
        } catch (RuntimeException expected) {
            if (!expected.getMessage().contains("Unsupported manifest")) throw expected;
            oldFailed = true;
        }
        if (!oldFailed) throw new AssertionError("Expected schema 2-only guard to reject current manifest");
        context.evaluateString(scope, source, "awakening_bow_tooltips.js", 1, null);
        String json = context.toString(context.evaluateString(scope, "JSON.stringify(__registered)", "results", 1, null));
        var registered = JsonParser.parseString(json).getAsJsonArray();
        var registry = JsonParser.parseString(Files.readString(Path.of("kubejs/awakening_item_registry.json"))).getAsJsonObject();
        var ids = new HashSet<String>();
        for (var item : registry.getAsJsonArray("items")) ids.add(item.getAsJsonObject().get("id").getAsString());
        var distinct = new HashSet<String>();
        for (var item : registered) {
            String id = item.getAsString();
            if (!ids.contains(id)) throw new AssertionError("Tooltip targets unregistered item: " + id);
            if (!distinct.add(id)) throw new AssertionError("Duplicate tooltip registration: " + id);
        }
        var data = JsonParser.parseString(manifest).getAsJsonObject();
        long materials = data.getAsJsonArray("materials").asList().stream().filter(e -> {
            var material = e.getAsJsonObject();
            return !material.has("existing_outputs") || material.get("id").getAsString().equals("wood");
        }).count();
        long expected = materials * data.getAsJsonObject("bow_types").size() + 1;
        if (registered.size() != expected) throw new AssertionError("Tooltip registration count");
        System.out.println("PASS: old guard reproduces failure; schema 3 registers " + registered.size() + " existing bow tooltips. No Minecraft events executed.");
    }
}
