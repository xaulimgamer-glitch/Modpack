import com.google.gson.*;
import java.nio.file.*;
import java.util.*;
import org.apache.maven.artifact.versioning.DefaultArtifactVersion;
import org.apache.maven.artifact.versioning.VersionRange;

/** Static Forge dependency ranges, using Maven's own version comparator. */
public final class VerifyForgeDependencies {
    public static void main(String[] args) throws Exception {
        var report = JsonParser.parseString(Files.readString(Path.of(args[0]))).getAsJsonObject();
        var versions = new HashMap<String, Set<String>>();
        versions.put("minecraft", Set.of("1.20.1"));
        versions.put("forge", Set.of("47.4.22"));
        for (var element : report.getAsJsonArray("archives")) {
            for (var mod : element.getAsJsonObject().getAsJsonArray("mods")) {
                var row = mod.getAsJsonObject();
                versions.computeIfAbsent(row.get("mod_id").getAsString(), k -> new HashSet<>())
                        .add(row.get("mod_version").getAsString());
            }
        }
        var findings = new JsonArray(); int checked = 0;
        for (var element : report.getAsJsonArray("archives")) {
            var archive = element.getAsJsonObject();
            for (var owner : archive.getAsJsonObject("dependencies").entrySet()) {
                if (!owner.getValue().isJsonArray()) continue;
                for (var value : owner.getValue().getAsJsonArray()) {
                    var dep = value.getAsJsonObject();
                    String id = dep.get("modId").getAsString();
                    boolean mandatory = dep.has("mandatory") && dep.get("mandatory").getAsBoolean();
                    String range = dep.has("versionRange") ? dep.get("versionRange").getAsString() : "*";
                    var available = versions.getOrDefault(id, Set.of());
                    String issue = null;
                    if (available.isEmpty()) { if (mandatory) issue = "missing_required"; }
                    else if (!range.equals("*") && !range.isEmpty()) {
                        try {
                            var constraint = VersionRange.createFromVersionSpec(range);
                            boolean matched = available.stream().anyMatch(v -> constraint.containsVersion(new DefaultArtifactVersion(v)));
                            if (!matched) issue = mandatory ? "required_version_mismatch" : "optional_present_version_mismatch";
                        } catch (Exception ex) { issue = "range_requires_review: " + ex; }
                    }
                    checked++;
                    if (issue != null) {
                        var f = new JsonObject(); f.addProperty("source", archive.get("source").getAsString());
                        f.addProperty("owner", owner.getKey()); f.addProperty("dependency", id);
                        f.addProperty("range", range); f.addProperty("side", dep.has("side") ? dep.get("side").getAsString() : "BOTH");
                        f.addProperty("issue", issue); f.add("candidates", new Gson().toJsonTree(available)); findings.add(f);
                    }
                }
            }
        }
        var result = new JsonObject(); result.addProperty("checked", checked); result.add("findings", findings);
        Files.writeString(Path.of(args[1]), new GsonBuilder().setPrettyPrinting().create().toJson(result));
        System.out.println("Checked " + checked + " Forge dependency declarations; " + findings.size() + " findings for review (includes bundled candidates, not resolved runtime).");
    }
}
