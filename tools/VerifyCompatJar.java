import java.nio.file.Path;
import java.util.Arrays;
import java.util.jar.JarFile;
import java.util.zip.CRC32;

/** Checks Java ZIP readability, every file CRC, and preservation of existing files. */
public final class VerifyCompatJar {
    public static void main(String[] args) throws Exception {
        String diagnostic = "dev/xaulim/awakeningcompat/command/StealthDiagnosticCommand.class";
        int count = 0;
        try (var baseline = new JarFile(Path.of(args[0]).toFile());
             var candidate = new JarFile(Path.of(args[1]).toFile())) {
            for (var entry : candidate.stream().filter(e -> !e.isDirectory()).toList()) {
                byte[] bytes;
                try (var in = candidate.getInputStream(entry)) { bytes = in.readAllBytes(); }
                var crc = new CRC32(); crc.update(bytes);
                if (entry.getCrc() != crc.getValue()) throw new AssertionError("Bad CRC: " + entry.getName());
                var old = baseline.getJarEntry(entry.getName());
                if (old == null) {
                    if (!entry.getName().equals(diagnostic)) throw new AssertionError("Unexpected new file");
                } else {
                    try (var in = baseline.getInputStream(old)) {
                        if (!Arrays.equals(bytes, in.readAllBytes())) throw new AssertionError("Changed: " + entry.getName());
                    }
                }
                count++;
            }
            long oldCount = baseline.stream().filter(e -> !e.isDirectory()).count();
            if (count != oldCount + 1 || candidate.getJarEntry(diagnostic) == null)
                throw new AssertionError("Unexpected file inventory");
        }
        System.out.println("PASS: Java read " + count + " files with valid CRCs; all original files preserved; only diagnostic class added.");
    }
}
