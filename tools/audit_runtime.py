"""Collect current runtime errors and their packaged resource sources. Read-only."""
import collections
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/audit"
OUT.mkdir(parents=True, exist_ok=True)
lines = (ROOT / "logs/latest.log").read_text(encoding="utf-8", errors="replace").splitlines()
errors = collections.Counter()
loot = {}
for index, line in enumerate(lines):
    if "/ERROR]" in line and not re.search(r"\]:\s+(at |\.\.\.|Caused by)", line):
        errors[re.sub(r"^.*?\]: ", "", line)] += 1
    match = re.search(r"Couldn't parse element loot_tables:(\S+)", line)
    if match:
        loot[match[1]] = lines[index + 1] if index + 1 < len(lines) else ""

recipes = ["minecraft:beetroot_soup", "minecraft:mushroom_stew",
           "minecraft:rabbit_stew_from_brown_mushroom", "minecraft:rabbit_stew_from_red_mushroom",
           "spartanweaponry:copper_spear"]
tags = ["forge:cooked_trilocararis", "forge:plates/silver", "forge:meat", "origins:meat",
        "forge:dinosaur_chop_raw", "forge:dinosaur_chop_cooked", "ctov:wares/cardboard_box",
        "ctov:wares/sealed_delivery_agreement", "forge:fruits", "forge:protein",
        "forge:fruits/gearo_berry", "forge:protein/peanut"]
paths = set()
for kind, ids in [("recipes", recipes), ("tags/items", tags), ("loot_tables", list(loot))]:
    for identifier in ids:
        namespace, path = identifier.split(":", 1)
        paths.add(f"data/{namespace}/{kind}/{path}.json")
sources = collections.defaultdict(list)
for file in sorted((ROOT / "mods").glob("*.jar")):
    with zipfile.ZipFile(file) as jar:
        for path in paths.intersection(jar.namelist()):
            raw = jar.read(path).decode("utf-8-sig", errors="replace")
            try:
                value = json.loads(raw)
            except ValueError:
                value = None
            sources[path].append({"archive": file.name, "text": raw, "json": value})
registry = json.loads((ROOT / "kubejs/awakening_item_registry.json").read_text(encoding="utf-8-sig"))
items = {item["id"] for item in registry["items"]}
tagged_items = sum(bool(item.get("tags")) for item in registry["items"])
result = {"log": "logs/latest.log", "item_registry_count": len(items),
          "error_messages": [{"message": msg, "occurrences": n} for msg, n in errors.most_common()],
          "loot_errors": loot, "resource_sources": dict(sorted(sources.items())),
          "related_registered_items": sorted(item for item in items if any(word in item for word in
              ["triloc", "dinosaur_chop", "sea_pig", "silver_plate", "gearo_berry", "peanut"])),
          "item_dump_tagged_items": tagged_items,
          "tag_dump_reliable": tagged_items > 0,
          "tag_validation_note": "All-empty exported tags cannot establish runtime tag membership or absence."}
(OUT / "runtime-evidence.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"unique_error_messages": len(errors), "loot_table_errors": len(loot),
                  "resource_paths_found": len(sources), "item_registry_count": len(items)}))
for path, entries in sorted(sources.items()):
    if "/recipes/" in path or path in {"data/forge/tags/items/cooked_trilocararis.json",
        "data/forge/tags/items/plates/silver.json", "data/forge/tags/items/dinosaur_chop_raw.json",
        "data/forge/tags/items/dinosaur_chop_cooked.json"}:
        print(path, [(entry["archive"], entry["text"][:1300]) for entry in entries])
