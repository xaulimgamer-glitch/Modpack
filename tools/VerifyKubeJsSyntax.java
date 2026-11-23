import dev.latvian.mods.rhino.Context;
import java.nio.file.*;

/** Parses scripts with the installed Rhino compiler, without executing them. */
public final class VerifyKubeJsSyntax {
    public static void main(String[] args) throws Exception {
        var context = Context.enter();
        int count = 0;
        for (String directory : new String[] {"startup_scripts", "server_scripts", "client_scripts"}) {
            var root = Path.of("kubejs", directory);
            if (!Files.exists(root)) continue;
            try (var files = Files.walk(root)) {
                for (var file : files.filter(p -> p.toString().endsWith(".js")).toList()) {
                    context.compileString(Files.readString(file), file.toString(), 1, null);
                    count++;
                }
            }
        }
        System.out.println("PASS: " + count + " scripts parsed by installed Rhino; no scripts executed.");
        for (String name : new String[] {"caveore", "cupboard", "lithostitched", "lootintegrations", "structureessentials"}) {
            try (var reader = Files.newBufferedReader(Path.of("config", name + ".json"))) {
                com.google.gson.JsonParser.parseReader(reader);
            }
        }
        System.out.println("PASS: five commented .json configs accepted by Gson's lenient parser.");
    }
}
