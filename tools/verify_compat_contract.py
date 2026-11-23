"""Verify the built addon contracts and packaged resources without launching Minecraft."""
import argparse
import json
from pathlib import Path
import tomllib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {"origins": "[1.20.1-1.10.0.9]", "icarus": "[2.14.1]"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--jar", type=Path, required=True)
    args = parser.parse_args()
    with zipfile.ZipFile(args.jar) as jar:
        assert jar.testzip() is None, "JAR CRC failure"
        manifest = jar.read("META-INF/MANIFEST.MF").decode("utf-8")
        assert "Implementation-Version: 0.1.0" in manifest, "file.jarVersion has no implementation version"
        source = tomllib.loads((ROOT / "custom_mods/awakening-compat/src/main/resources/META-INF/mods.toml").read_text(encoding="utf-8-sig"))
        packaged = tomllib.loads(jar.read("META-INF/mods.toml").decode("utf-8-sig"))
        assert source == packaged, "Packaged mods.toml differs from source"
        dependencies = {d["modId"]: d for d in packaged["dependencies"]["awakening_compat"]}
        for mod, version in EXPECTED.items():
            assert dependencies[mod]["versionRange"] == version, (mod, dependencies[mod])
            assert dependencies[mod]["mandatory"] is True
        config = json.loads(jar.read("awakening_compat.mixins.json"))
        assert config == json.loads((ROOT / "custom_mods/awakening-compat/src/main/resources/awakening_compat.mixins.json").read_text()), "Mixin config differs"
        assert config["injectors"]["defaultRequire"] == 1
        for name in config.get("mixins", []) + config.get("client", []):
            assert config["package"].replace(".", "/") + "/" + name + ".class" in jar.namelist(), name
        refmap = json.loads(jar.read(config["refmap"]))
        crossbow = refmap["mappings"]["dev/xaulim/awakeningicaruscompat/mixin/HeavyCrossbowArrowMixin"]
        assert {"releaseUsing", "getSupportedHeldProjectiles", "getAllSupportedProjectiles"} <= crossbow.keys()
        for name in ["client/DrowSunGlareOverlay", "command/StealthDiagnosticCommand"]:
            assert "dev/xaulim/awakeningcompat/" + name + ".class" in jar.namelist(), name
    print("PASS: pinned dependency contracts, source/resource parity, mixin classes, crossbow refmap and diagnostic/overlay packaging.")


if __name__ == "__main__":
    main()
