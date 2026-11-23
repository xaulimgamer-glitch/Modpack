import com.google.gson.*;
import org.objectweb.asm.*;
import org.objectweb.asm.tree.*;
import java.nio.file.*;
import java.util.*;
import java.util.jar.*;

/** Static bytecode targets only: does not simulate ordering of other transformers. */
public final class VerifyMixinTargets {
    static ClassNode read(byte[] bytes) { var node = new ClassNode(); new ClassReader(bytes).accept(node, 0); return node; }
    static Map<String, Object> values(AnnotationNode annotation) {
        var map = new HashMap<String, Object>();
        if (annotation.values != null) for (int i = 0; i < annotation.values.size(); i += 2)
            map.put((String) annotation.values.get(i), annotation.values.get(i + 1));
        return map;
    }
    static ClassNode target(String name, List<JarFile> jars) throws Exception {
        for (var jar : jars) { var entry = jar.getJarEntry(name + ".class");
            if (entry != null) try (var in = jar.getInputStream(entry)) { return read(in.readAllBytes()); }
        }
        throw new AssertionError("Target class not found: " + name);
    }
    public static void main(String[] args) throws Exception {
        var jars = new ArrayList<JarFile>();
        for (var file : Files.list(Path.of("mods")).filter(p -> p.toString().endsWith(".jar")).toList()) jars.add(new JarFile(file.toFile()));
        try (var compat = new JarFile("mods/awakening-compat-0.1.0.jar")) {
            var config = JsonParser.parseString(new String(compat.getInputStream(compat.getJarEntry("awakening_compat.mixins.json")).readAllBytes())).getAsJsonObject();
            var refmap = JsonParser.parseString(new String(compat.getInputStream(compat.getJarEntry("awakening_compat.refmap.json")).readAllBytes())).getAsJsonObject().getAsJsonObject("mappings");
            int methods = 0, mixins = 0;
            for (String side : List.of("mixins", "client")) for (var name : config.getAsJsonArray(side)) {
                String path = config.get("package").getAsString().replace('.', '/') + "/" + name.getAsString();
                var mixin = read(compat.getInputStream(compat.getJarEntry(path + ".class")).readAllBytes());
                var annotation = mixin.invisibleAnnotations.stream().filter(a -> a.desc.endsWith("/Mixin;")).findFirst().orElseThrow();
                var annotationValues = values(annotation);
                String targetName = annotationValues.containsKey("targets")
                        ? ((List<?>) annotationValues.get("targets")).get(0).toString().replace('.', '/')
                        : ((Type) ((List<?>) annotationValues.get("value")).get(0)).getInternalName();
                var target = target(targetName, jars);
                for (var handler : mixin.methods) {
                    var annotations = new ArrayList<AnnotationNode>();
                    if (handler.visibleAnnotations != null) annotations.addAll(handler.visibleAnnotations);
                    if (handler.invisibleAnnotations != null) annotations.addAll(handler.invisibleAnnotations);
                    for (var injection : annotations) {
                        boolean redirect = injection.desc.endsWith("/Redirect;");
                        if (!redirect && !injection.desc.endsWith("/Inject;")) continue;
                        var spec = values(injection);
                        var selected = new ArrayList<MethodNode>();
                        for (var selector : (List<?>) spec.get("method")) {
                            String text = selector.toString();
                            if (refmap.has(path) && refmap.getAsJsonObject(path).has(text)) text = refmap.getAsJsonObject(path).get(text).getAsString();
                            if (text.startsWith("L")) text = text.substring(text.indexOf(';') + 1);
                            String methodName = text.contains("(") ? text.substring(0, text.indexOf('(')) : text;
                            String descriptor = text.contains("(") ? text.substring(text.indexOf('(')) : null;
                            int before = selected.size();
                            for (var method : target.methods) if (method.name.equals(methodName) && (descriptor == null || method.desc.equals(descriptor))) selected.add(method);
                            if (selected.size() == before) throw new AssertionError(path + ": missing selector " + text);
                        }
                        if (redirect) {
                            Object rawAt = spec.get("at");
                            var at = values(rawAt instanceof List<?> list ? (AnnotationNode) list.get(0) : (AnnotationNode) rawAt);
                            String call = at.get("target").toString(); int end = call.indexOf(';'); int paren = call.indexOf('(', end);
                            String owner = call.substring(1, end), methodName = call.substring(end + 1, paren), desc = call.substring(paren);
                            int count = 0;
                            for (var method : selected) {
                                if ((method.access & Opcodes.ACC_STATIC) != 0 && (handler.access & Opcodes.ACC_STATIC) == 0) throw new AssertionError("Non-static redirect for static target");
                                for (var instruction : method.instructions) if (instruction instanceof MethodInsnNode invoke && invoke.owner.equals(owner) && invoke.name.equals(methodName) && invoke.desc.equals(desc)) count++;
                            }
                            int required = spec.containsKey("require") ? (Integer) spec.get("require") : 1;
                            int allowed = spec.containsKey("allow") ? (Integer) spec.get("allow") : Integer.MAX_VALUE;
                            if (count < required || count > allowed) throw new AssertionError(path + ": redirect matches " + count);
                        }
                        methods++;
                    }
                }
                mixins++;
                System.out.println("PASS " + path + " -> " + targetName);
            }
            System.out.println("PASS: " + mixins + " mixins, " + methods + " injection selectors; raw installed bytecode and redirect call counts verified.");
        } finally { for (var jar : jars) jar.close(); }
    }
}
