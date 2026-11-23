"""Apply narrow fixes supported by logs, original resources and the runtime item dump.

Does not modify mod JARs. Overrides are scoped to this audited pack installation.
"""
import copy
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
evidence = json.loads((ROOT / "docs/audit/runtime-evidence.json").read_text(encoding="utf-8"))
registry = json.loads((ROOT / "kubejs/awakening_item_registry.json").read_text(encoding="utf-8-sig"))
items = {item["id"] for item in registry["items"]}
pack = ROOT / "config/paxi/datapacks/awakening_runtime_fixes"
written = []


def write(path, data):
    target = pack / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    written.append(path)


write("pack.mcmeta", {"pack": {"pack_format": 15, "description": "Awakening: verified runtime resource corrections"}})
corrections = {
    "data/forge/tags/items/cooked_trilocararis.json": ("alexscaves:cooked_trilocaris", "alexscaves:cooked_trilocaris_tail"),
    "data/forge/tags/items/dinosaur_chop_raw.json": ("alexscaves:dinosaur_chop_raw", "alexscaves:dinosaur_chop"),
    "data/forge/tags/items/dinosaur_chop_cooked.json": ("alexscaves:dinosaur_chop_cooked", "alexscaves:cooked_dinosaur_chop"),
    "data/forge/tags/items/plates/silver.json": ("overgeared:silver_plate", "overgeared_iaf:silver_plate"),
}
for path, (old, new) in corrections.items():
    sources = evidence["resource_sources"][path]
    assert len(sources) == 1, "Review merged tag contributors before replacing " + path
    data = copy.deepcopy(sources[0]["json"])
    assert old in data["values"] and old not in items and new in items, path
    data["values"] = [new if entry == old else entry for entry in data["values"]]
    data["replace"] = True  # Remove the invalid original entry, not just append to it.
    assert all(entry in items for entry in data["values"]), path
    write(path, data)

for name in ["cardboard_box", "sealed_delivery_agreement"]:
    path = "data/ctov/tags/items/wares/" + name + ".json"
    sources = evidence["resource_sources"][path]
    assert len(sources) == 1 and sources[0]["json"]["values"] == ["wares:" + name]
    write(path, {"replace": True, "values": [{"id": "wares:" + name, "required": False}]})

for path, tag in [("fruits/gearo_berry", "forge:gearo_berry"), ("protein/peanut", "forge:peanut")]:
    # The current registry dumper silently exported zero tags for every item.
    # Validate the alias against its actual packaged definition instead.
    with zipfile.ZipFile(ROOT / "mods/vintagedelight-0.1.6.jar") as jar:
        original = json.loads(jar.read("data/forge/tags/items/" + tag.split(":", 1)[1] + ".json"))
    assert original["values"] and all(value in items for value in original["values"]), tag
    resource = "data/forge/tags/items/" + path + ".json"
    assert resource not in evidence["resource_sources"], "Alias already supplied by a mod"
    write(resource, {"replace": False, "values": ["#" + tag]})

for name in ["beetroot_soup", "mushroom_stew", "rabbit_stew_from_brown_mushroom", "rabbit_stew_from_red_mushroom"]:
    path = "data/minecraft/recipes/" + name + ".json"
    sources = evidence["resource_sources"][path]
    assert len(sources) == 1 and sources[0]["text"].strip() == "", path
    # RecipeManager checks conditions before requiring type/ingredients/result.
    # Retain the observed disabled behavior without assuming a replacement recipe.
    write(path, {"conditions": [{"type": "forge:false"}]})


def item_entries(value):
    if isinstance(value, dict):
        if value.get("type") in {"item", "minecraft:item"}:
            yield value
        for child in value.values():
            yield from item_entries(child)
    elif isinstance(value, list):
        for child in value:
            yield from item_entries(child)


for path, old, replacement in [
    ("data/naturalist/loot_tables/entities/tortoise.json", "minecraft:turtle_scute", "minecraft:scute"),
    ("data/minecraft/loot_tables/chests/jungle_temple.json", "twm:teste", None),
]:
    sources = evidence["resource_sources"][path]
    assert len(sources) == 1, "Review overriding loot tables first"
    data = copy.deepcopy(sources[0]["json"])
    invalid = [entry for entry in item_entries(data) if entry["name"] not in items | {"minecraft:air"}]
    assert len(invalid) == 1 and invalid[0]["name"] == old, path
    if replacement:
        assert replacement in items
        invalid[0]["name"] = replacement
    else:
        # Preserve the chance/weight of every valid drop. The nonexistent test
        # entry becomes an empty outcome rather than breaking the entire table.
        weight = invalid[0].get("weight", 1)
        invalid[0].clear()
        invalid[0].update(type="minecraft:empty", weight=weight)
    write(path, data)

(ROOT / "docs/audit/runtime-data-fixes.json").write_text(json.dumps({"pack": str(pack.relative_to(ROOT)), "files": written}, indent=2), encoding="utf-8")
print("PASS: wrote pack metadata and 14 validated resource overrides/aliases; no JARs changed.")
