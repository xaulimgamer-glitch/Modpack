"""Repair confirmed loot schemas/tags; remove only logged missing-biome rules."""
import copy
import json
from pathlib import Path
import re
import shutil
import tomllib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
evidence = json.loads((ROOT / "docs/audit/runtime-evidence.json").read_text(encoding="utf-8"))
items = {entry["id"] for entry in json.loads((ROOT / "kubejs/awakening_item_registry.json").read_text(encoding="utf-8-sig"))["items"]}
pack = ROOT / "config/paxi/datapacks/awakening_runtime_fixes"
written = []


def live_sources(path):
    entries = evidence["resource_sources"][path]
    result = []
    for entry in entries:
        with zipfile.ZipFile(ROOT / "mods" / entry["archive"]) as archive:
            value = json.loads(archive.read(path))
        assert value == entry["json"], "Resource changed since audit: " + path
        result.append(value)
    return result


def write(path, data):
    target = pack / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    written.append(path)


for name in ["avocado_leaves", "fruiting_avocado_leaves"]:
    path = f"data/culturaldelights/loot_tables/blocks/{name}.json"
    sources = live_sources(path)
    assert len(sources) == 1
    data = copy.deepcopy(sources[0])
    count = [0]

    def fix_condition(value):
        if isinstance(value, dict):
            if value.get("condition") == "minecraft:alternative":
                assert isinstance(value.get("terms"), list)
                value["condition"] = "minecraft:any_of"
                count[0] += 1
            for child in value.values():
                fix_condition(child)
        elif isinstance(value, list):
            for child in value:
                fix_condition(child)

    fix_condition(data)
    assert count[0] > 0
    expected = json.loads(json.dumps(sources[0]).replace('"minecraft:alternative"', '"minecraft:any_of"'))
    assert data == expected, "Unexpected loot change"
    write(path, data)

path = "data/betterend/loot_tables/entities/end_slime.json"
sources = live_sources(path)
assert len(sources) == 1
original = sources[0]
serialized = json.dumps(original)
assert serialized.count('"minecraft:slime"') == 3
data = json.loads(serialized.replace('"minecraft:slime"', '"slime"'))
write(path, data)

# Snapshot all existing contributors, not merely the faulty addon's entries.
# Re-run this audit if mods contributing these tags are changed or added.
for namespace in ["forge", "origins"]:
    path = f"data/{namespace}/tags/items/meat.json"
    sources = live_sources(path)
    assert all(not source.get("replace", False) for source in sources)
    values, seen, missing = [], set(), set()
    for source in sources:
        for entry in source["values"]:
            identifier = entry if isinstance(entry, str) else entry["id"]
            if not identifier.startswith("#") and identifier not in items:
                missing.add(identifier)
                assert identifier.startswith("alexscavesdelight:"), identifier
                entry = {"id": identifier, "required": False}
            key = json.dumps(entry, sort_keys=True)
            if key not in seen:
                seen.add(key)
                values.append(entry)
    assert "alexscavesdelight:cooked_sea_pig" in missing
    write(path, {"replace": True, "values": values})

log = (ROOT / "logs/latest.log").read_text(encoding="utf-8", errors="replace")
missing_biomes = set(re.findall(r'Error parsing config: worldgen/biome "([^"]+)" does not exist', log))
world = ROOT / "config/coldsweat/world.toml"
text = world.read_bytes().decode("utf-8-sig")
before = tomllib.loads(text)
removed = []
kept = []
for line in text.splitlines(keepends=True):
    match = re.match(r'^\s*\["([^"]+)"\s*,', line)
    if match and match[1] in missing_biomes:
        removed.append(match[1])
    else:
        kept.append(line)
new_text = "".join(kept)
after = tomllib.loads(new_text)


def expected_config(value):
    if isinstance(value, dict):
        return {key: expected_config(child) for key, child in value.items()}
    if isinstance(value, list):
        return [expected_config(child) for child in value if not (
            isinstance(child, list) and len(child) >= 2 and child[0] in missing_biomes
            and isinstance(child[1], (int, float)))]
    return value


assert after == expected_config(before), "Config edit removed more than missing-biome numeric rows"
if removed:
    backup = ROOT / "custom_mods/awakening-compat/build/runtime-fixes/coldsweat-world-before-cleanup.toml"
    backup.parent.mkdir(parents=True, exist_ok=True)
    if not backup.exists():
        shutil.copy2(world, backup)
    world.write_bytes(new_text.encode("utf-8"))
result = {"resource_fixes": written, "cold_sweat_missing_biome_rules_removed": removed,
          "note": "Only identifiers already rejected by the logged biome registry were removed; retest if biome packs change."}
(ROOT / "docs/audit/runtime-followup-fixes.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
print(f"PASS: {len(written)} loot/tag resources repaired; {len(removed)} logged missing-biome temperature rows removed; other config values preserved.")
